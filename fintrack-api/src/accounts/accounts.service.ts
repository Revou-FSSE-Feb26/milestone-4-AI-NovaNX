import { Injectable } from '@nestjs/common';

@Injectable()
export class AccountsService {
  findAll() {
    return [
      {
        id: 1,
        user_id: 1,
        name: 'BCA Utama',
        type: 'bank',
        balance: 7500000,
        created_at: '2026-07-01T08:30:00.000Z',
      },
    ];
  }
}
