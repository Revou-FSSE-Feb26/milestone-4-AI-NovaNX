import { Injectable, ConflictException } from '@nestjs/common';
import { Account } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // `omit` hides the password hash from the response; `include` returns each
  // user's accounts nested in the same payload (relational query). Nested
  // `balance` is a Decimal instance, so convert it back to a plain number.
  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { id: 'asc' },
      omit: { password: true },
      include: { accounts: true },
    });
    return users.map((user) => ({
      ...user,
      accounts: user.accounts.map((account: Account) => ({
        ...account,
        balance: Number(account.balance),
      })),
    }));
  }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email already registered');
    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: dto.password,
        role: 'user',
      },
      omit: { password: true },
    });
  }
}
