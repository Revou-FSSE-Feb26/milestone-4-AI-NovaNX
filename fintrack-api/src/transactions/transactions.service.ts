import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Transaction, Category } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTransactionDto,
  TransactionType,
} from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

// Reused by findAll/findOne to return nested related data (account, transfer
// destination account, category) in a single response.
const relationsInclude = {
  account: { select: { id: true, name: true, type: true } },
  toAccount: { select: { id: true, name: true, type: true } },
  category: true,
} as const;

type AccountSummary = { id: number; name: string; type: string };
type TransactionWithRelations = Transaction & {
  account?: AccountSummary;
  toAccount?: AccountSummary | null;
  category?: Category | null;
};

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

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
      this.prisma.account.findUnique({ where: { id: accountId } }),
      this.prisma.account.findUnique({ where: { id: toAccountId } }),
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
    const transactions = await this.prisma.transaction.findMany({
      orderBy: { id: 'asc' },
      include: relationsInclude,
    });
    return transactions.map((tx) => this.serialize(tx));
  }

  async findOne(id: number) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id },
      include: relationsInclude,
    });
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

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          account_id: dto.account_id,
          to_account_id: toAccountId,
          category_id: dto.category_id ?? null,
          type: dto.type,
          amount: dto.amount,
          description: dto.description ?? null,
          transaction_date: new Date(dto.transaction_date),
        },
      });

      const updates = this.balanceUpdates(
        dto.type,
        dto.amount,
        dto.account_id,
        toAccountId,
      );
      for (const update of updates) {
        await tx.account.update({
          where: { id: update.accountId },
          data: { balance: { increment: update.delta } },
        });
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

    return this.prisma.$transaction(async (tx) => {
      // Reverse old effect
      const oldUpdates = this.balanceUpdates(
        existing.type,
        existing.amount,
        existing.account_id,
        existing.to_account_id,
      );
      for (const update of oldUpdates) {
        await tx.account.update({
          where: { id: update.accountId },
          data: { balance: { increment: -update.delta } },
        });
      }

      const updated = await tx.transaction.update({
        where: { id },
        data: {
          ...dto,
          to_account_id: newToAccountId,
          transaction_date: dto.transaction_date
            ? new Date(dto.transaction_date)
            : undefined,
        },
      });

      // Apply new effect
      const newUpdates = this.balanceUpdates(
        updated.type,
        Number(updated.amount),
        updated.account_id,
        updated.to_account_id,
      );
      for (const update of newUpdates) {
        await tx.account.update({
          where: { id: update.accountId },
          data: { balance: { increment: update.delta } },
        });
      }

      return this.serialize(updated);
    });
  }

  async remove(id: number) {
    const existing = await this.findOne(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.transaction.delete({ where: { id } });
      const updates = this.balanceUpdates(
        existing.type,
        existing.amount,
        existing.account_id,
        existing.to_account_id,
      );
      for (const update of updates) {
        await tx.account.update({
          where: { id: update.accountId },
          data: { balance: { increment: -update.delta } },
        });
      }
    });
  }
}
