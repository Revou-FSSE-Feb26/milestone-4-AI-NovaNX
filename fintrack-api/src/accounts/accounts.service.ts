import { Injectable, NotFoundException } from '@nestjs/common';
import { Account, Transaction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async findAll() {
    const accounts = await this.prisma.account.findMany({
      orderBy: { id: 'asc' },
    });
    return accounts.map((account) => this.serialize(account));
  }

  // Nested relational query: returns the account together with its own
  // transactions in a single response.
  async findOne(id: number) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: { transactions: { orderBy: { transaction_date: 'desc' } } },
    });
    if (!account) throw new NotFoundException(`Account #${id} not found`);
    return this.serialize(account);
  }

  async create(dto: CreateAccountDto) {
    const account = await this.prisma.account.create({
      data: {
        user_id: dto.user_id,
        name: dto.name,
        type: dto.type,
        balance: dto.balance ?? 0,
      },
    });
    return this.serialize(account);
  }

  async update(id: number, dto: UpdateAccountDto) {
    await this.findOne(id);
    const account = await this.prisma.account.update({
      where: { id },
      data: dto,
    });
    return this.serialize(account);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.account.delete({ where: { id } });
  }
}
