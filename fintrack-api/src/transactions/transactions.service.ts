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
import { BalanceUpdatesProvider } from './providers/balance-updates.provider';

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
    private readonly balanceUpdatesProvider: BalanceUpdatesProvider,
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
    userId: number,
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
      this.transactionsRepository.findAccountByIdAndUserId(accountId, userId),
      this.transactionsRepository.findAccountByIdAndUserId(toAccountId, userId),
    ]);
    if (!source) throw new NotFoundException(`Account #${accountId} not found`);
    if (!destination)
      throw new NotFoundException(`Account #${toAccountId} not found`);
    return toAccountId;
  }

  private async validateReferences(
    accountId: number,
    categoryId: number | null,
    type: TransactionType | string,
    userId: number,
  ) {
    const account = await this.transactionsRepository.findAccountByIdAndUserId(
      accountId,
      userId,
    );
    if (!account) {
      throw new NotFoundException(`Account #${accountId} not found`);
    }

    if (type !== 'transfer' && !categoryId) {
      throw new BadRequestException(
        'category_id is required for income and expense transactions',
      );
    }

    if (categoryId) {
      if (!(await this.transactionsRepository.findCategoryById(categoryId))) {
        throw new NotFoundException(`Category #${categoryId} not found`);
      }
    }
  }

  // Nested relational query: each transaction is returned together with its
  // account, transfer-destination account, and category in one response.
  async findAll(userId: number) {
    const transactions =
      await this.transactionsRepository.findAllByUserId(userId);
    return transactions.map((tx) => this.serialize(tx));
  }

  async findOne(id: number, userId: number) {
    const tx = await this.transactionsRepository.findByIdAndUserId(id, userId);
    if (!tx) throw new NotFoundException(`Transaction #${id} not found`);
    return this.serialize(tx);
  }

  async create(userId: number, dto: CreateTransactionDto) {
    await this.validateReferences(
      dto.account_id,
      dto.category_id ?? null,
      dto.type,
      userId,
    );

    let toAccountId: number | null = null;
    if (dto.type === TransactionType.TRANSFER) {
      toAccountId = await this.validateTransfer(
        dto.account_id,
        dto.to_account_id,
        userId,
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

      const updates = this.balanceUpdatesProvider.calculate(
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

  async update(id: number, userId: number, dto: UpdateTransactionDto) {
    const existing = await this.findOne(id, userId);

    const newType = dto.type ?? existing.type;
    const newAccountId = dto.account_id ?? existing.account_id;
    const newCategoryId =
      newType === 'transfer' ? null : (dto.category_id ?? existing.category_id);

    await this.validateReferences(newAccountId, newCategoryId, newType, userId);

    let newToAccountId: number | null = null;
    if (newType === 'transfer') {
      newToAccountId = await this.validateTransfer(
        newAccountId,
        dto.to_account_id ?? existing.to_account_id ?? undefined,
        userId,
      );
    }

    return this.transactionsRepository.runInTransaction(async (tx) => {
      // Reverse old effect
      const oldUpdates = this.balanceUpdatesProvider.calculate(
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
          category_id: newCategoryId,
          transaction_date: dto.transaction_date
            ? new Date(dto.transaction_date)
            : undefined,
        },
      );

      // Apply new effect
      const newUpdates = this.balanceUpdatesProvider.calculate(
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

  async remove(id: number, userId: number) {
    const existing = await this.findOne(id, userId);
    await this.transactionsRepository.runInTransaction(async (tx) => {
      await this.transactionsRepository.deleteTransaction(tx, id);
      const updates = this.balanceUpdatesProvider.calculate(
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
