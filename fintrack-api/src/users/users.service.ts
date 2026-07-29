import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Account } from '@prisma/client';
import { isForeignKeyConstraintError } from '../prisma/prisma-error.util';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  // `omit` hides the password hash from the response; `include` returns each
  // user's accounts nested in the same payload (relational query). Nested
  // `balance` is a Decimal instance, so convert it back to a plain number.
  async findAll() {
    const users = await this.usersRepository.findAll();
    return users.map((user) => ({
      ...user,
      accounts: user.accounts.map((account: Account) => ({
        ...account,
        balance: Number(account.balance),
      })),
    }));
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return {
      ...user,
      accounts: user.accounts.map((account: Account) => ({
        ...account,
        balance: Number(account.balance),
      })),
    };
  }

  async create(dto: CreateUserDto) {
    const exists = await this.usersRepository.findByEmail(dto.email);
    if (exists) throw new ConflictException('Email already registered');
    return this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: 'user',
    });
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);
    if (dto.email) {
      const existing = await this.usersRepository.findByEmail(dto.email);
      if (existing && existing.id !== id) {
        throw new ConflictException('Email already registered');
      }
    }
    return this.usersRepository.update(id, dto);
  }

  // Deleting the user cascades to their own accounts (onDelete: Cascade on
  // Account.user_id), but is blocked if one of those accounts is still used
  // as a transfer destination by another user's transaction (onDelete:
  // Restrict on Transaction.to_account_id).
  async remove(id: number) {
    await this.findOne(id);
    try {
      await this.usersRepository.delete(id);
    } catch (error) {
      if (isForeignKeyConstraintError(error)) {
        throw new ConflictException(
          `User #${id} cannot be deleted: one of their accounts is still referenced as a transfer destination by other transactions`,
        );
      }
      throw error;
    }
  }
}
