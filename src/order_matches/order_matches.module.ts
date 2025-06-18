import { Module } from '@nestjs/common';
import { OrderMatchesController } from './order_matches.controller';
import { OrderMatchesService } from './order_matches.service';

@Module({
  controllers: [OrderMatchesController],
  providers: [OrderMatchesService]
})
export class OrderMatchesModule {}
