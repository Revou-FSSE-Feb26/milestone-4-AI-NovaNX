import { Injectable } from '@nestjs/common';

@Injectable()
export class TransactionsService {
  findAll() {
    return [
      {
        id: 1,
        account_id: 1,
        category_id: 2,
        type: 'expense',
        amount: 85000,
        description: 'Team lunch',
        transaction_date: '2026-07-15',
        created_at: '2026-07-15T12:30:00.000Z',
      },
    ];
  }
}
