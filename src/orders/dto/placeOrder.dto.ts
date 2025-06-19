import { order_type } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class PlaceOrderDto {
  @IsString()
  baseCurrencyId: string;
  @IsString()
  fiatCurrencyId: string;
  @IsEnum(order_type)
  orderType: order_type;
  @IsNumber()
  price: Decimal;
  @IsNumber()
  originalAmount: Decimal;
  @IsOptional()
  @IsNumber()
  minAmountToOrder?: Decimal;
  @IsOptional()
  @IsNumber()
  maxAmountToOrder?: Decimal;
}
