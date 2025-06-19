import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { Decimal } from '@prisma/client/runtime/library';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post('create')
  async createWallet(
    @Request() req: { user: { id: string } },
    @Body() { currencyId }: { currencyId: string },
  ) {
    return this.walletsService.createWallet(req.user.id, currencyId);
  }

  @Get('list')
  async listWallets(
    @Request() req: { user: { id: string } },
    @Query() { page = 1, limit = 10 }: { page?: number; limit?: number } = {},
  ) {
    return this.walletsService.getWalletsByUserId(req.user.id, {
      page: +page,
      limit: +limit,
    });
  }

  @Post('transfer/:fromWalletId/:toWalletId')
  async transfer(
    @Request() req: { user: { id: string } },
    @Body()
    { amount }: { amount: Decimal },
    @Param('fromWalletId') fromWalletId: string,
    @Param('toWalletId') toWalletId: string,
  ) {
    return this.walletsService.transferFunds(
      req.user.id,
      fromWalletId,
      toWalletId,
      amount,
    );
  }

  @Post('transfer/external/:fromWalletId/:toAddress')
  async transferToExternal(
    @Request() req: { user: { id: string } },
    @Body() { amount }: { amount: Decimal },
    @Param('fromWalletId') fromWalletId: string,
    @Param('toAddress') toAddress: string,
  ) {
    return this.walletsService.transferFundsToExternalWallet(
      req.user.id,
      fromWalletId,
      toAddress,
      amount,
    );
  }
}
