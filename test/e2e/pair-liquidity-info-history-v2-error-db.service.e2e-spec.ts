import { Test, TestingModule } from '@nestjs/testing';
import { Pair, PairLiquidityInfoHistoryV2Error, Token } from '@prisma/client';

import { PairLiquidityInfoHistoryV2ErrorDbService } from '@/database/pair-liquidity-info-history-error/pair-liquidity-info-history-v2-error-db.service';
import { PrismaService } from '@/database/prisma.service';

const token1: Token = {
  id: 1,
  address: 'ct_token1',
  symbol: '1',
  name: '1',
  decimals: 18,
  malformed: false,
  noContract: false,
  listed: false,
};
const token2: Token = {
  id: 2,
  address: 'ct_token2',
  symbol: '2',
  name: '2',
  decimals: 18,
  malformed: false,
  noContract: false,
  listed: false,
};
const pair1: Pair = {
  id: 1,
  address: 'ct_pair1',
  t0: 1,
  t1: 2,
  synchronized: true,
};
const pair2: Pair = {
  id: 2,
  address: 'ct_pair2',
  t0: 1,
  t1: 2,
  synchronized: true,
};
const errorEntry1: PairLiquidityInfoHistoryV2Error = {
  id: 1,
  pairId: 1,
  microBlockHash: '',
  transactionHash: '',
  logIndex: -1,
  error: 'error_1',
  timesOccurred: 1,
  createdAt: new Date('2024-01-01 12:00:00.000'),
  updatedAt: new Date('2024-01-01 12:00:00.000'),
};
const errorEntry2: PairLiquidityInfoHistoryV2Error = {
  id: 2,
  pairId: 1,
  microBlockHash: 'mh_1',
  transactionHash: 'th_1',
  logIndex: 1,
  error: 'error_2',
  timesOccurred: 1,
  createdAt: new Date('2024-01-01 12:00:00.000'),
  updatedAt: new Date('2024-01-01 12:00:00.000'),
};

describe('PairLiquidityInfoHistoryV2ErrorDbService', () => {
  let service: PairLiquidityInfoHistoryV2ErrorDbService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PairLiquidityInfoHistoryV2ErrorDbService, PrismaService],
    }).compile();

    service = module.get<PairLiquidityInfoHistoryV2ErrorDbService>(
      PairLiquidityInfoHistoryV2ErrorDbService,
    );
    prismaService = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await prismaService.token.createMany({ data: [token1, token2] });
    await prismaService.pair.createMany({ data: [pair1, pair2] });
    await prismaService.pairLiquidityInfoHistoryV2Error.createMany({
      data: [errorEntry1, errorEntry2],
    });
    jest.useFakeTimers().setSystemTime(new Date('2024-01-01 17:59:00.000'));
  });

  afterEach(async () => {
    await prismaService.pairLiquidityInfoHistoryV2Error.deleteMany();
    await prismaService.pair.deleteMany();
    await prismaService.token.deleteMany();
    jest.useRealTimers();
  });

  afterAll(async () => {
    await prismaService.$disconnect();
  });

  describe('getErrorWithinHours', () => {
    it('should correctly return an error within a recent given time window in hours on pair basis', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2024-01-01 17:59:00.000'));
      const result = await service.getErrorWithinHours(1, '', '', -1, 6);
      expect(result?.id).toEqual(1);
    });

    it('should correctly return an error within a recent given time window in hours on log basis', async () => {
      const result = await service.getErrorWithinHours(1, 'mh_1', 'th_1', 1, 6);
      expect(result?.id).toEqual(2);
    });

    it('should not return errors older than the given time window in hours', async () => {
      const result = await service.getErrorWithinHours(1, '', '', -1, 5);
      expect(result).toBe(null);
    });
  });
});
