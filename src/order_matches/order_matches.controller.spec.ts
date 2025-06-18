import { Test, TestingModule } from '@nestjs/testing';
import { OrderMatchesController } from './order_matches.controller';

describe('OrderMatchesController', () => {
  let controller: OrderMatchesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderMatchesController],
    }).compile();

    controller = module.get<OrderMatchesController>(OrderMatchesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
