import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { Pair, PairLiquidityInfoHistoryError, Token } from '@prisma/client';
import { PairLiquidityInfoHistoryErrorDbService } from './pair-liquidity-info-history-error-db.service';

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
const errorEntry1: PairLiquidityInfoHistoryError = {
  id: 1,
  pairId: 1,
  microBlockHash: '',
  error: 'error_1',
  timesOccurred: 1,
  createdAt: new Date('2024-01-01 12:00:00.000'),
  updatedAt: new Date('2024-01-01 12:00:00.000'),
};
const errorEntry2: PairLiquidityInfoHistoryError = {
  id: 2,
  pairId: 1,
  microBlockHash: 'mh_1',
  error: 'error_2',
  timesOccurred: 1,
  createdAt: new Date('2024-01-01 12:00:00.000'),
  updatedAt: new Date('2024-01-01 12:00:00.000'),
};

describe('PairLiquidityInfoHistoryErrorDbService', () => {
  let service: PairLiquidityInfoHistoryErrorDbService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PairLiquidityInfoHistoryErrorDbService, PrismaService],
    }).compile();

    service = module.get<PairLiquidityInfoHistoryErrorDbService>(
      PairLiquidityInfoHistoryErrorDbService,
    );
    prismaService = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await prismaService.token.createMany({ data: [token1, token2] });
    await prismaService.pair.createMany({ data: [pair1, pair2] });
    await prismaService.pairLiquidityInfoHistoryError.createMany({
      data: [errorEntry1, errorEntry2],
    });
    jest.useFakeTimers().setSystemTime(new Date('2024-01-01 17:59:00.000'));
  });

  afterEach(async () => {
    await prismaService.pairLiquidityInfoHistoryError.deleteMany();
    await prismaService.pair.deleteMany();
    await prismaService.token.deleteMany();
    jest.useRealTimers();
  });

  afterAll(async () => {
    await prismaService.$disconnect();
  });

  describe('getErrorByPairIdAndMicroBlockHashWithinHours', () => {
    it('should correctly return an error within a recent given time window in hours by pairId', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2024-01-01 17:59:00.000'));
      const result = await service.getErrorByPairIdAndMicroBlockHashWithinHours(
        1,
        '',
        6,
      );
      expect(result?.id).toEqual(1);
    });

    it('should correctly return an error within a recent given time window in hours by pairId and microBlockHash', async () => {
      const result = await service.getErrorByPairIdAndMicroBlockHashWithinHours(
        1,
        'mh_1',
        6,
      );
      expect(result?.id).toEqual(2);
    });

    it('should not return errors older than the given time window in hours', async () => {
      const result = await service.getErrorByPairIdAndMicroBlockHashWithinHours(
        1,
        '',
        5,
      );
      expect(result).toBe(null);
    });
  });
});
