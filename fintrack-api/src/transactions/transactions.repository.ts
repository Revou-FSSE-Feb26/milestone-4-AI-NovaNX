import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Reused by findAll/findOne to return nested related data (account, transfer
// destination account, category) in a single response.
export const relationsInclude = {
  account: { select: { id: true, name: true, type: true } },
  toAccount: { select: { id: true, name: true, type: true } },
  category: true,
} as const;

@Injectable()
export class TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.transaction.findMany({
      orderBy: { id: 'asc' },
      include: relationsInclude,
    });
  }

  findById(id: number) {
    return this.prisma.transaction.findUnique({
      where: { id },
      include: relationsInclude,
    });
  }

  findAccountById(id: number) {
    return this.prisma.account.findUnique({ where: { id } });
  }

  // Runs a set of writes atomically; used to keep transaction rows and their
  // related account balances consistent.
  runInTransaction<T>(
    work: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(work);
  }

  createTransaction(
    tx: Prisma.TransactionClient,
    data: Prisma.TransactionUncheckedCreateInput,
  ) {
    return tx.transaction.create({ data });
  }

  updateTransaction(
    tx: Prisma.TransactionClient,
    id: number,
    data: Prisma.TransactionUncheckedUpdateInput,
  ) {
    return tx.transaction.update({ where: { id }, data });
  }

  deleteTransaction(tx: Prisma.TransactionClient, id: number) {
    return tx.transaction.delete({ where: { id } });
  }

  adjustAccountBalance(
    tx: Prisma.TransactionClient,
    accountId: number,
    delta: number,
  ) {
    return tx.account.update({
      where: { id: accountId },
      data: { balance: { increment: delta } },
    });
  }
}
