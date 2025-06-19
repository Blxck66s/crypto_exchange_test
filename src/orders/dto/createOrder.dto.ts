import { order_type } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { Transform } from 'class-transformer';
import { IsDecimal, IsEnum, IsNumberString, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  baseCurrencyId: string;
  @IsString()
  fiatCurrencyId: string;
  @IsEnum(order_type)
  orderType: order_type;
  @IsNumberString()
  @Transform(({ value }) => +value)
  @IsDecimal()
  price: Decimal;
  @IsNumberString()
  @Transform(({ value }) => +value)
  @IsDecimal()
  originalAmount: Decimal;
  @IsNumberString()
  @Transform(({ value }) => +value)
  @IsDecimal()
  minAmountToOrder?: Decimal;
  @IsNumberString()
  @Transform(({ value }) => +value)
  @IsDecimal()
  maxAmountToOrder?: Decimal;
}
