import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

export interface Account {
  id: number;
  user_id: number;
  name: string;
  type: string;
  balance: number;
  created_at: string;
}

@Injectable()
export class AccountsService {
  private accounts: Account[] = [
    {
      id: 1,
      user_id: 1,
      name: 'BCA Utama',
      type: 'bank',
      balance: 10250000,
      created_at: '2026-05-01T08:30:00.000Z',
    },
    {
      id: 2,
      user_id: 1,
      name: 'Dompet Harian',
      type: 'cash',
      balance: 815000,
      created_at: '2026-05-01T08:35:00.000Z',
    },
    {
      id: 3,
      user_id: 2,
      name: 'Mandiri Payroll',
      type: 'bank',
      balance: 8350000,
      created_at: '2026-05-03T09:30:00.000Z',
    },
    {
      id: 4,
      user_id: 2,
      name: 'GoPay',
      type: 'e-wallet',
      balance: 460000,
      created_at: '2026-05-03T09:35:00.000Z',
    },
    {
      id: 5,
      user_id: 3,
      name: 'BNI Tabungan',
      type: 'bank',
      balance: 12400000,
      created_at: '2026-05-08T10:45:00.000Z',
    },
    {
      id: 6,
      user_id: 3,
      name: 'OVO',
      type: 'e-wallet',
      balance: 695000,
      created_at: '2026-05-08T10:50:00.000Z',
    },
  ];

  private nextId = 7;

  findAll() {
    return this.accounts;
  }

  findOne(id: number): Account {
    const account = this.accounts.find((a) => a.id === id);
    if (!account) throw new NotFoundException(`Account #${id} not found`);
    return account;
  }

  create(dto: CreateAccountDto) {
    const account: Account = {
      id: this.nextId++,
      user_id: dto.user_id,
      name: dto.name,
      type: dto.type,
      balance: dto.balance ?? 0,
      created_at: new Date().toISOString(),
    };
    this.accounts.push(account);
    return account;
  }

  update(id: number, dto: UpdateAccountDto) {
    const account = this.findOne(id);
    Object.assign(account, dto);
    return account;
  }

  remove(id: number) {
    const index = this.accounts.findIndex((a) => a.id === id);
    if (index === -1) throw new NotFoundException(`Account #${id} not found`);
    this.accounts.splice(index, 1);
  }

  adjustBalance(accountId: number, delta: number): void {
    const account = this.findOne(accountId);
    account.balance = Math.round((account.balance + delta) * 100) / 100;
  }
}
