import { BadRequestException, Injectable } from '@nestjs/common';
import { currency_type, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { Wallet } from 'ethers';
import { PrismaService } from 'src/prisma/prisma.service';
import { TransactionsService } from 'src/transactions/transactions.service';

@Injectable()
export class WalletsService {
  constructor(
    private prisma: PrismaService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async createWallet(userId: string, currencyId: string) {
    const currency = await this.prisma.currency.findUnique({
      where: { id: currencyId },
    });
    if (!currency) throw new Error('Currency not found');

    const wallet = Wallet.createRandom();
    if (!process.env.WALLET_ENCRYPTION_KEY)
      throw new Error('WALLET_ENCRYPTION_KEY is not set');

    const encryptedPK = await wallet.encrypt(process.env.WALLET_ENCRYPTION_KEY);

    return await this.prisma.userWallet
      .create({
        data: {
          userId,
          currencyId,
          ...(currency.type === 'crypto' &&
            currency.codeName === 'eth' && {
              privateKey: encryptedPK,
              depositAddress: wallet.address,
            }),
        },
        select: {
          id: true,
          currencyId: true,
          balance: true,
          depositAddress: true,
        },
      })
      .catch((error) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        )
          throw new BadRequestException(
            `Wallet for ${currency.name} already exists for user ${userId}`,
          );
      });
  }

  async getWalletsByUserId(
    userId: string,
    { page, limit }: { page: number; limit: number },
  ) {
    return await this.prisma.userWallet.findMany({
      where: { userId },
      select: {
        id: true,
        balance: true,
        depositAddress: true,
        currency: true,
      },

      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async transferFunds(
    userId: string,
    fromWalletId: string,
    toWalletId: string,
    amount: Decimal,
  ) {
    const fromWallet = await this.prisma.userWallet.findUnique({
      where: { id: fromWalletId, userId },
      include: { currency: true },
    });
    if (!fromWallet) throw new Error('From wallet not found');

    const toWallet = await this.prisma.userWallet.findUnique({
      where: { id: toWalletId },
      include: { currency: true },
    });
    if (!toWallet) throw new Error('To wallet not found');

    if (fromWallet.currency.codeName !== toWallet.currency.codeName)
      throw new Error('Currencies do not match');

    if (fromWallet.balance < amount)
      throw new Error('Insufficient balance in the from wallet');

    if (
      toWallet.depositAddress &&
      fromWallet.privateKey &&
      fromWallet.currency.type === currency_type.crypto
    ) {
      // do crypto transfer
    }

    const fromWalletUpdate = this.prisma.userWallet.update({
      where: { id: fromWalletId },
      data: { balance: { decrement: amount } },
    });

    const toWalletUpdate = this.prisma.userWallet.update({
      where: { id: toWalletId },
      data: { balance: { increment: amount } },
    });

    await this.prisma.$transaction([fromWalletUpdate, toWalletUpdate]);

    await this.transactionsService.trade(
      fromWalletId,
      toWalletId,
      amount,
      fromWallet.currency.type,
      'completed',
    );

    return { message: 'Transfer successful' };
  }

  async transferFundsToExternalWallet(
    userId: string,
    fromWalletId: string,
    toAddress: string,
    amount: Decimal,
  ) {
    if (!process.env.WALLET_ENCRYPTION_KEY)
      throw new Error('WALLET_ENCRYPTION_KEY is not set');

    const fromWallet = await this.prisma.userWallet.findUnique({
      where: { id: fromWalletId, userId },
      include: { currency: true },
    });
    if (!fromWallet) throw new Error('From wallet not found');

    if (fromWallet.currency.type !== currency_type.crypto)
      throw new Error('From wallet is not a crypto wallet');

    if (fromWallet.balance < amount)
      throw new Error('Insufficient balance in the from wallet');

    if (fromWallet.depositAddress && fromWallet.privateKey) {
      // do crypto transfer
    }

    const fromWalletUpdate = this.prisma.userWallet.update({
      where: { id: fromWalletId },
      data: { balance: { decrement: amount } },
    });

    await this.prisma.$transaction([fromWalletUpdate]);

    await this.transactionsService.trade(
      fromWalletId,
      toAddress,
      amount,
      fromWallet.currency.type,
      'completed',
    );

    return { message: 'Transfer to external wallet successful' };
  }
}
