import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Account, Transaction } from '@prisma/client';
import { isForeignKeyConstraintError } from '../prisma/prisma-error.util';
import { AccountsRepository } from './accounts.repository';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly accountsRepository: AccountsRepository) {}

  // Prisma returns `balance`/`amount` as Decimal instances; convert them back
  // to plain numbers so the API response shape matches the previous contract.
  private serialize(account: Account & { transactions?: Transaction[] }) {
    return {
      ...account,
      balance: Number(account.balance),
      ...(account.transactions && {
        transactions: account.transactions.map((tx) => ({
          ...tx,
          amount: Number(tx.amount),
        })),
      }),
    };
  }

  async findAll(userId: number) {
    const accounts = await this.accountsRepository.findAllByUserId(userId);
    return accounts.map((account) => this.serialize(account));
  }

  async findAllForAdmin() {
    const accounts = await this.accountsRepository.findAll();
    return accounts.map((account) => this.serialize(account));
  }

  // Nested relational query: returns the account together with its own
  // transactions in a single response.
  async findOne(id: number, userId: number) {
    const account = await this.accountsRepository.findByIdAndUserId(id, userId);
    if (!account) throw new NotFoundException(`Account #${id} not found`);
    return this.serialize(account);
  }

  async create(userId: number, dto: CreateAccountDto) {
    const account = await this.accountsRepository.create({
      user_id: userId,
      name: dto.name,
      type: dto.type,
      balance: dto.balance ?? 0,
    });
    return this.serialize(account);
  }

  async update(id: number, userId: number, dto: UpdateAccountDto) {
    await this.findOne(id, userId);
    const account = await this.accountsRepository.update(id, dto);
    return this.serialize(account);
  }

  // Deleting the account cascades to its own transactions (onDelete: Cascade
  // on Transaction.account_id), but is blocked if the account is still used
  // as a transfer destination elsewhere (onDelete: Restrict on
  // Transaction.to_account_id).
  async remove(id: number, userId: number) {
    await this.findOne(id, userId);
    try {
      await this.accountsRepository.delete(id);
    } catch (error) {
      if (isForeignKeyConstraintError(error)) {
        throw new ConflictException(
          `Account #${id} cannot be deleted: it is still referenced as a transfer destination by other transactions`,
        );
      }
      throw error;
    }
  }
}
