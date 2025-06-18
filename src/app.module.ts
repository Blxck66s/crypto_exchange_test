import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersService } from './users/users.service';
import { UsersController } from './users/users.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CurrenciesModule } from './currencies/currencies.module';
import { WalletsModule } from './wallets/wallets.module';
import { OrdersModule } from './orders/orders.module';
import { OrderMatchesModule } from './order_matches/order_matches.module';
import { TransactionsModule } from './transactions/transactions.module';
import { OnChainTransactionsModule } from './on_chain_transactions/on_chain_transactions.module';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [UsersModule, AuthModule, CurrenciesModule, WalletsModule, OrdersModule, OrderMatchesModule, TransactionsModule, OnChainTransactionsModule, ConfigModule, PrismaModule],
  controllers: [AppController, UsersController],
  providers: [AppService, UsersService],
})
export class AppModule {}
