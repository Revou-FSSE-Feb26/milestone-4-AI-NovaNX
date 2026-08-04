import { Injectable } from '@nestjs/common';

export interface BalanceUpdate {
  accountId: number;
  delta: number;
}

@Injectable()
export class BalanceUpdatesProvider {
  calculate(
    type: string,
    amount: number,
    accountId: number,
    toAccountId: number | null,
  ): BalanceUpdate[] {
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
}
