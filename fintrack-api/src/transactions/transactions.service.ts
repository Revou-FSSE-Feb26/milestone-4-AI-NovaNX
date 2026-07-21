import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountsService } from '../accounts/accounts.service';
import {
  CreateTransactionDto,
  TransactionType,
} from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

export interface Transaction {
  id: number;
  account_id: number;
  category_id: number | null;
  type: TransactionType;
  amount: number;
  description: string | null;
  transaction_date: string;
  created_at: string;
}

@Injectable()
export class TransactionsService {
  constructor(private readonly accountsService: AccountsService) {}

  private transactions: Transaction[] = [
    {
      id: 1,
      account_id: 1,
      category_id: 1,
      type: TransactionType.INCOME,
      amount: 9000000,
      description: 'June salary',
      transaction_date: '2026-06-01',
      created_at: '2026-06-01T08:00:00.000Z',
    },
    {
      id: 2,
      account_id: 1,
      category_id: 5,
      type: TransactionType.EXPENSE,
      amount: 650000,
      description: 'Electricity and internet',
      transaction_date: '2026-06-03',
      created_at: '2026-06-03T19:20:00.000Z',
    },
    {
      id: 3,
      account_id: 1,
      category_id: 3,
      type: TransactionType.EXPENSE,
      amount: 185000,
      description: 'Family dinner',
      transaction_date: '2026-06-08',
      created_at: '2026-06-08T20:15:00.000Z',
    },
    {
      id: 4,
      account_id: 2,
      category_id: 3,
      type: TransactionType.EXPENSE,
      amount: 45000,
      description: 'Office lunch',
      transaction_date: '2026-06-10',
      created_at: '2026-06-10T12:25:00.000Z',
    },
    {
      id: 5,
      account_id: 2,
      category_id: 4,
      type: TransactionType.EXPENSE,
      amount: 30000,
      description: 'Bus and MRT',
      transaction_date: '2026-06-14',
      created_at: '2026-06-14T18:10:00.000Z',
    },
  ];

  private nextId = 6;

  private balanceDelta(type: TransactionType, amount: number): number {
    if (type === TransactionType.INCOME) return amount;
    if (type === TransactionType.EXPENSE) return -amount;
    return 0; // transfer: no net change on single account
  }

  findAll() {
    return this.transactions;
  }

  findOne(id: number) {
    const tx = this.transactions.find((t) => t.id === id);
    if (!tx) throw new NotFoundException(`Transaction #${id} not found`);
    return tx;
  }

  create(dto: CreateTransactionDto) {
    const transaction: Transaction = {
      id: this.nextId++,
      account_id: dto.account_id,
      category_id: dto.category_id ?? null,
      type: dto.type,
      amount: dto.amount,
      description: dto.description ?? null,
      transaction_date: dto.transaction_date,
      created_at: new Date().toISOString(),
    };
    this.transactions.push(transaction);
    this.accountsService.adjustBalance(
      dto.account_id,
      this.balanceDelta(dto.type, dto.amount),
    );
    return transaction;
  }

  update(id: number, dto: UpdateTransactionDto) {
    const tx = this.findOne(id);
    // Reverse old effect
    this.accountsService.adjustBalance(
      tx.account_id,
      -this.balanceDelta(tx.type, tx.amount),
    );
    Object.assign(tx, dto);
    // Apply new effect
    this.accountsService.adjustBalance(
      tx.account_id,
      this.balanceDelta(tx.type, tx.amount),
    );
    return tx;
  }

  remove(id: number) {
    const index = this.transactions.findIndex((t) => t.id === id);
    if (index === -1)
      throw new NotFoundException(`Transaction #${id} not found`);
    const [tx] = this.transactions.splice(index, 1);
    // Reverse effect on account balance
    this.accountsService.adjustBalance(
      tx.account_id,
      -this.balanceDelta(tx.type, tx.amount),
    );
  }
}
