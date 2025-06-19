import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PlaceOrderDto } from './dto';
import { order_status, order_type } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('place')
  async placeOrder(
    @Body() placeOrderDto: PlaceOrderDto,
    @Request() req: { user: { id: string } },
  ) {
    const userId = req.user.id;
    return this.ordersService.placeOrder(userId, placeOrderDto);
  }

  @Get('open/:baseCurrencyId/:orderType')
  async listOpenOrders(
    @Param('baseCurrencyId') baseCurrencyId: string,
    @Param('orderType') orderType: order_type,
  ) {
    return this.ordersService.listOpenOrders(baseCurrencyId, orderType);
  }

  @Patch('/:orderId')
  async updateOrder(
    @Request() req: { user: { id: string } },
    @Param('orderId') orderId: string,
    @Body('toStatus') toStatus: order_status,
  ) {
    const userId = req.user.id;
    return this.ordersService.orderUpdate(userId, orderId, toStatus);
  }

  @Post('/:action/:orderId')
  async orderAction(
    @Request() req: { user: { id: string } },
    @Param('orderId') orderId: string,
    @Param('action') action: 'buy' | 'sell',
    @Body('amount') amount: Decimal,
  ) {
    const userId = req.user.id;
    return this.ordersService.orderAction(userId, orderId, action, amount);
  }
}
