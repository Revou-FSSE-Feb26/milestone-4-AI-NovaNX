import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TransactionsRepository } from './transactions.repository';
import { BalanceUpdatesProvider } from './providers/balance-updates.provider';

@Module({
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    TransactionsRepository,
    BalanceUpdatesProvider,
  ],
})
export class TransactionsModule {}
