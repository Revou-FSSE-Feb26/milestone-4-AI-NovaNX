import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Transaction, Category } from '@prisma/client';
import { TransactionsRepository } from './transactions.repository';
import {
  CreateTransactionDto,
  TransactionType,
} from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

type AccountSummary = { id: number; name: string; type: string };
type TransactionWithRelations = Transaction & {
  account?: AccountSummary;
  toAccount?: AccountSummary | null;
  category?: Category | null;
};

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
  ) {}

  // Prisma returns `amount` as a Decimal instance; convert it back to a
  // plain number so the API response shape matches the previous contract.
  private serialize(tx: TransactionWithRelations) {
    return { ...tx, amount: Number(tx.amount) };
  }

  // Transfers must stay within a single user's own accounts: no external
  // transfer (destination missing) and no cross-user transfer.
  private async validateTransfer(
    accountId: number,
    toAccountId: number | undefined,
  ): Promise<number> {
    if (!toAccountId) {
      throw new BadRequestException(
        'to_account_id is required for transfer transactions',
      );
    }
    if (toAccountId === accountId) {
      throw new BadRequestException(
        'to_account_id must be different from account_id',
      );
    }

    const [source, destination] = await Promise.all([
      this.transactionsRepository.findAccountById(accountId),
      this.transactionsRepository.findAccountById(toAccountId),
    ]);
    if (!source) throw new NotFoundException(`Account #${accountId} not found`);
    if (!destination)
      throw new NotFoundException(`Account #${toAccountId} not found`);
    if (source.user_id !== destination.user_id) {
      throw new BadRequestException(
        'Transfers are only allowed between accounts owned by the same user',
      );
    }

    return toAccountId;
  }

  private balanceUpdates(
    type: string,
    amount: number,
    accountId: number,
    toAccountId: number | null,
  ): { accountId: number; delta: number }[] {
    if (type === 'income') return [{ accountId, delta: amount }];
    if (type === 'expense') return [{ accountId, delta: -amount }];
    if (type === 'transfer' && toAccountId) {
      return [
        { accountId, delta: -amount },
        { accountId: toAccountId, delta: amount },
      ];
    }
    return [];
  }

  // Nested relational query: each transaction is returned together with its
  // account, transfer-destination account, and category in one response.
  async findAll() {
    const transactions = await this.transactionsRepository.findAll();
    return transactions.map((tx) => this.serialize(tx));
  }

  async findOne(id: number) {
    const tx = await this.transactionsRepository.findById(id);
    if (!tx) throw new NotFoundException(`Transaction #${id} not found`);
    return this.serialize(tx);
  }

  async create(dto: CreateTransactionDto) {
    let toAccountId: number | null = null;
    if (dto.type === TransactionType.TRANSFER) {
      toAccountId = await this.validateTransfer(
        dto.account_id,
        dto.to_account_id,
      );
    }

    return this.transactionsRepository.runInTransaction(async (tx) => {
      const transaction = await this.transactionsRepository.createTransaction(
        tx,
        {
          account_id: dto.account_id,
          to_account_id: toAccountId,
          category_id: dto.category_id ?? null,
          type: dto.type,
          amount: dto.amount,
          description: dto.description ?? null,
          transaction_date: new Date(dto.transaction_date),
        },
      );

      const updates = this.balanceUpdates(
        dto.type,
        dto.amount,
        dto.account_id,
        toAccountId,
      );
      for (const update of updates) {
        await this.transactionsRepository.adjustAccountBalance(
          tx,
          update.accountId,
          update.delta,
        );
      }

      return this.serialize(transaction);
    });
  }

  async update(id: number, dto: UpdateTransactionDto) {
    const existing = await this.findOne(id);

    const newType = dto.type ?? existing.type;
    const newAccountId = dto.account_id ?? existing.account_id;

    let newToAccountId: number | null = null;
    if (newType === 'transfer') {
      newToAccountId = await this.validateTransfer(
        newAccountId,
        dto.to_account_id ?? existing.to_account_id ?? undefined,
      );
    }

    return this.transactionsRepository.runInTransaction(async (tx) => {
      // Reverse old effect
      const oldUpdates = this.balanceUpdates(
        existing.type,
        existing.amount,
        existing.account_id,
        existing.to_account_id,
      );
      for (const update of oldUpdates) {
        await this.transactionsRepository.adjustAccountBalance(
          tx,
          update.accountId,
          -update.delta,
        );
      }

      const updated = await this.transactionsRepository.updateTransaction(
        tx,
        id,
        {
          ...dto,
          to_account_id: newToAccountId,
          transaction_date: dto.transaction_date
            ? new Date(dto.transaction_date)
            : undefined,
        },
      );

      // Apply new effect
      const newUpdates = this.balanceUpdates(
        updated.type,
        Number(updated.amount),
        updated.account_id,
        updated.to_account_id,
      );
      for (const update of newUpdates) {
        await this.transactionsRepository.adjustAccountBalance(
          tx,
          update.accountId,
          update.delta,
        );
      }

      return this.serialize(updated);
    });
  }

  async remove(id: number) {
    const existing = await this.findOne(id);
    await this.transactionsRepository.runInTransaction(async (tx) => {
      await this.transactionsRepository.deleteTransaction(tx, id);
      const updates = this.balanceUpdates(
        existing.type,
        existing.amount,
        existing.account_id,
        existing.to_account_id,
      );
      for (const update of updates) {
        await this.transactionsRepository.adjustAccountBalance(
          tx,
          update.accountId,
          -update.delta,
        );
      }
    });
  }
}
