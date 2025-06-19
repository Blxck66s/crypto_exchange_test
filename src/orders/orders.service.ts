import { Injectable } from '@nestjs/common';
import { order_status, order_type } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto';
import { Decimal } from '@prisma/client/runtime/library';
import { TransactionsService } from 'src/transactions/transactions.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async placeOrder(userId: string, createOrderDto: CreateOrderDto) {
    const order = this.prisma.order.create({
      data: {
        userId,
        ...createOrderDto,
        remainingAmount: createOrderDto.originalAmount,
      },
    });

    const walletUpdate = this.prisma.userWallet.updateMany({
      where: { userId, currencyId: createOrderDto.baseCurrencyId },
      data: {
        balance: {
          decrement: createOrderDto.originalAmount,
        },
      },
    });

    await this.prisma.$transaction([order, walletUpdate]);
    return { message: 'Order placed successfully' };
  }

  async listOpenOrders(baseCurrencyId: string, orderType: order_type) {
    return this.prisma.order.findMany({
      where: { baseCurrencyId, status: order_status.open, orderType },
      include: { user: true },
    });
  }

  async orderUpdate(userId: string, orderId: string, toStatus: order_status) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });
    if (!order) throw new Error('Order not found');
    if (order.userId !== userId) throw new Error('Unauthorized');

    switch (toStatus) {
      case order_status.cancelled: {
        if (userId !== order.userId)
          throw new Error('Unauthorized to cancel this order');
        const orderUpdate = this.prisma.order.update({
          where: { id: orderId },
          data: { status: order_status.cancelled },
        });
        const updateBalance = this.prisma.userWallet.updateMany({
          where: { userId: order.userId, currencyId: order.baseCurrencyId },
          data: {
            balance: {
              increment: order.remainingAmount,
            },
          },
        });
        await Promise.all([orderUpdate, updateBalance]);
        return { message: 'Order cancelled successfully' };
      }
    }
  }

  async orderAction(
    userId: string,
    orderId: string,
    action: 'buy' | 'sell',
    amount: Decimal,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });
    if (!order) throw new Error('Order not found');
    if (order.userId === userId)
      throw new Error('Cannot buy or sell to your own order');
    if (amount > order.remainingAmount)
      throw new Error('Insufficient order amount');
    if (order.orderType === action) {
      throw new Error(`Cannot ${action} an order of the same type`);
    }
    switch (action) {
      case 'buy': {
        const userWallet = await this.prisma.userWallet.findFirst({
          where: { userId, currencyId: order.baseCurrencyId },
        });
        if (!userWallet || userWallet.balance.lt(amount.mul(order.price))) {
          throw new Error('Insufficient balance in user wallet');
        }
        const orderUpdate = this.prisma.order.update({
          where: { id: orderId },
          data: { remainingAmount: order.remainingAmount.sub(amount) },
        });
        const buyeeWalletUpdate = this.prisma.userWallet.updateMany({
          where: { userId, currencyId: order.baseCurrencyId },
          data: {
            balance: {
              decrement: amount.mul(order.price),
            },
          },
        });

        // transfer on blockchain

        await Promise.all([orderUpdate, buyeeWalletUpdate]);
        return await this.transactionsService.order(
          userId,
          order.userId,
          amount,
          amount.mul(order.price),
          'completed',
        );
      }
      case 'sell': {
        const userWallet = await this.prisma.userWallet.findFirst({
          where: { userId, currencyId: order.fiatCurrencyId },
        });
        if (!userWallet || userWallet.balance.lt(amount)) {
          throw new Error('Insufficient balance in user wallet');
        }
        const orderUpdate = this.prisma.order.update({
          where: { id: orderId },
          data: { remainingAmount: order.remainingAmount.sub(amount) },
        });
        const sellerWalletUpdate = this.prisma.userWallet.updateMany({
          where: { userId, currencyId: order.fiatCurrencyId },
          data: {
            balance: {
              increment: amount.mul(order.price),
            },
          },
        });

        // transfer on blockchain

        await Promise.all([orderUpdate, sellerWalletUpdate]);
        return await this.transactionsService.order(
          order.userId,
          userId,
          amount,
          amount.mul(order.price),
          'completed',
        );
      }
      default:
        throw new Error('Invalid action');
    }
  }
}
