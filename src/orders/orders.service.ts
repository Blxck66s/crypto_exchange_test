import { Injectable } from '@nestjs/common';
import { currency_type, order_status, order_type } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { PlaceOrderDto } from './dto';
import { Decimal } from '@prisma/client/runtime/library';
import { TransactionsService } from 'src/transactions/transactions.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async placeOrder(userId: string, placeOrderDto: PlaceOrderDto) {
    const currency = await this.prisma.currency.findFirst({
      where: { id: placeOrderDto.baseCurrencyId, type: currency_type.crypto },
    });
    if (!currency) {
      throw new Error('Base currency not found or not a crypto currency');
    }
    if (Decimal(placeOrderDto.originalAmount).lte(0)) {
      throw new Error('Original amount must be greater than zero');
    }
    if (Decimal(placeOrderDto.price).lte(0)) {
      throw new Error('Price must be greater than zero');
    }
    if (!placeOrderDto.maxAmountToOrder) {
      placeOrderDto.maxAmountToOrder = placeOrderDto.originalAmount;
    }
    if (
      Decimal(placeOrderDto.originalAmount).gt(
        Decimal(placeOrderDto.maxAmountToOrder),
      )
    ) {
      throw new Error('Original amount exceeds maximum limit');
    }
    const order = this.prisma.order.create({
      data: {
        userId,
        ...placeOrderDto,
        remainingAmount: placeOrderDto.originalAmount,
      },
    });

    const walletUpdate = this.prisma.userWallet.updateMany({
      where: { userId, currencyId: placeOrderDto.baseCurrencyId },
      data: {
        balance: {
          decrement: placeOrderDto.originalAmount,
        },
      },
    });

    await this.prisma.$transaction([order, walletUpdate]);
    return { message: 'Order placed successfully' };
  }

  async listOpenOrders(baseCurrencyId: string, orderType: order_type) {
    return this.prisma.order.findMany({
      where: { baseCurrencyId, status: order_status.open, orderType },
      include: {
        user: {
          select: { id: true, displayName: true, email: true },
        },
      },
    });
  }

  async orderUpdate(userId: string, orderId: string, toStatus: order_status) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
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
    if (order.orderType === action) {
      throw new Error(`Cannot ${action} an order of the same type`);
    }
    if (Decimal(amount).gt(order.remainingAmount)) {
      throw new Error('Amount exceeds remaining order amount');
    }

    const buyeeId = action === 'buy' ? userId : order.userId;
    const sellerId = action === 'buy' ? order.userId : userId;

    switch (action) {
      case 'buy': {
        const userWallet = await this.prisma.userWallet.findFirst({
          where: { userId: buyeeId, currencyId: order.fiatCurrencyId },
        });
        if (
          !userWallet ||
          userWallet.balance.lt(Decimal(amount).mul(order.price))
        ) {
          throw new Error('Insufficient balance in user wallet');
        }
        const orderUpdate = this.prisma.order.update({
          where: { id: orderId },
          data: { remainingAmount: order.remainingAmount.sub(amount) },
        });

        const walletUpdate = this.prisma.userWallet.updateMany({
          where: { userId: buyeeId, currencyId: order.fiatCurrencyId },
          data: {
            balance: {
              increment: Decimal(amount).mul(order.price),
            },
          },
        });

        // transfer on blockchain

        await Promise.all([orderUpdate, walletUpdate]);
        return await this.transactionsService.order(
          buyeeId,
          sellerId,
          amount,
          amount,
        );
      }
      case 'sell': {
        const userWallet = await this.prisma.userWallet.findFirst({
          where: { userId: sellerId, currencyId: order.baseCurrencyId },
        });
        if (!userWallet || userWallet.balance.lt(Decimal(amount))) {
          throw new Error('Insufficient balance in user wallet');
        }
        const orderUpdate = this.prisma.order.update({
          where: { id: orderId },
          data: { remainingAmount: order.remainingAmount.sub(amount) },
        });

        const walletUpdate = this.prisma.userWallet.updateMany({
          where: { userId: sellerId, currencyId: order.baseCurrencyId },
          data: {
            balance: {
              decrement: amount,
            },
          },
        });

        // transfer on blockchain
        await Promise.all([orderUpdate, walletUpdate]);
        return await this.transactionsService.order(
          sellerId,
          buyeeId,
          amount,
          amount,
        );
      }
      default:
        throw new Error('Invalid action');
    }
  }
}
