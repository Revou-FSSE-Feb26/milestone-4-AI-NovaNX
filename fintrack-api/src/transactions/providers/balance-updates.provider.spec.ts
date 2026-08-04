import { BalanceUpdatesProvider } from './balance-updates.provider';

describe('BalanceUpdatesProvider', () => {
  const provider = new BalanceUpdatesProvider();

  it('adds income to the source account', () => {
    expect(provider.calculate('income', 100, 1, null)).toEqual([
      { accountId: 1, delta: 100 },
    ]);
  });

  it('subtracts expenses from the source account', () => {
    expect(provider.calculate('expense', 100, 1, null)).toEqual([
      { accountId: 1, delta: -100 },
    ]);
  });

  it('moves transfer balances between accounts', () => {
    expect(provider.calculate('transfer', 100, 1, 2)).toEqual([
      { accountId: 1, delta: -100 },
      { accountId: 2, delta: 100 },
    ]);
  });
});
