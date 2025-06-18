import { Test, TestingModule } from '@nestjs/testing';
import { OnChainTransactionsService } from './on_chain_transactions.service';

describe('OnChainTransactionsService', () => {
  let service: OnChainTransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OnChainTransactionsService],
    }).compile();

    service = module.get<OnChainTransactionsService>(OnChainTransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
