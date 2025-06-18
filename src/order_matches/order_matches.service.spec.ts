import { Test, TestingModule } from '@nestjs/testing';
import { OrderMatchesService } from './order_matches.service';

describe('OrderMatchesService', () => {
  let service: OrderMatchesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderMatchesService],
    }).compile();

    service = module.get<OrderMatchesService>(OrderMatchesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
