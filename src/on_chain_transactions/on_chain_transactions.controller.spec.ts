import { Test, TestingModule } from '@nestjs/testing';
import { OnChainTransactionsController } from './on_chain_transactions.controller';

describe('OnChainTransactionsController', () => {
  let controller: OnChainTransactionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OnChainTransactionsController],
    }).compile();

    controller = module.get<OnChainTransactionsController>(OnChainTransactionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
