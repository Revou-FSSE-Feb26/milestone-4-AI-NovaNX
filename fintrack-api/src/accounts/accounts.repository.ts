import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.account.findMany({ orderBy: { id: 'asc' } });
  }

  // Nested relational query: returns the account together with its own
  // transactions in a single response.
  findById(id: number) {
    return this.prisma.account.findUnique({
      where: { id },
      include: { transactions: { orderBy: { transaction_date: 'desc' } } },
    });
  }

  create(data: Prisma.AccountUncheckedCreateInput) {
    return this.prisma.account.create({ data });
  }

  update(id: number, data: Prisma.AccountUncheckedUpdateInput) {
    return this.prisma.account.update({ where: { id }, data });
  }

  delete(id: number) {
    return this.prisma.account.delete({ where: { id } });
  }
}
