import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Shared query shape: hides the password hash and nests each user's accounts.
const userQueryArgs = {
  omit: { password: true },
  include: { accounts: true },
} as const;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      orderBy: { id: 'asc' },
      ...userQueryArgs,
    });
  }

  findById(id: number) {
    return this.prisma.user.findUnique({ where: { id }, ...userQueryArgs });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findAuthUserById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    });
  }

  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data, omit: { password: true } });
  }

  update(id: number, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
      omit: { password: true },
    });
  }

  delete(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }
}
