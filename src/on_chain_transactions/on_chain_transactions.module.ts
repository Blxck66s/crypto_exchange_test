import { Module } from '@nestjs/common';
import { OnChainTransactionsController } from './on_chain_transactions.controller';
import { OnChainTransactionsService } from './on_chain_transactions.service';

@Module({
  controllers: [OnChainTransactionsController],
  providers: [OnChainTransactionsService]
})
export class OnChainTransactionsModule {}
