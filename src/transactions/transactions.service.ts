import { Injectable } from '@nestjs/common';
import { currency_type, transaction_status } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}
  async trade(
    fromWalletId: string,
    toWalletId: string,
    amount: Decimal,
    currencyType: currency_type,
    status: transaction_status = 'pending',
  ) {
    return await this.prisma.transaction.create({
      data: {
        fromWalletId,
        toWalletId,
        amountIn: amount,
        amountOut: amount, // for fee deduction in production
        type:
          currencyType === currency_type.fiat
            ? 'transfer_fiat'
            : 'transfer_crypto',
        status,
      },
    });
  }

  async order(
    fromWalletId: string,
    toWalletId: string,
    amountIn: Decimal,
    amountOut: Decimal,
    status: transaction_status = 'completed',
    type: 'order' | 'place_order' | 'cancel_order' = 'order',
  ) {
    return await this.prisma.transaction.create({
      data: {
        fromWalletId,
        toWalletId,
        amountIn,
        amountOut,
        type,
        status,
      },
    });
  }
}
