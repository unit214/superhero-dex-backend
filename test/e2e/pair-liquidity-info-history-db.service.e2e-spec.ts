import { PairLiquidityInfoHistoryDbService } from '../../src/database/pair-liquidity-info-history/pair-liquidity-info-history-db.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/database/prisma.service';
import { Pair, PairLiquidityInfoHistory, Token } from '@prisma/client';
import { OrderQueryEnum } from '../../src/api/api.model';

import { ContractAddress } from '../../src/clients/sdk-client.model';

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
const token3: Token = {
  id: 3,
  address: 'ct_token3',
  symbol: '3',
  name: '3',
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
  t0: 2,
  t1: 3,
  synchronized: true,
};
const pair3: Pair = {
  id: 3,
  address: 'ct_pair4',
  t0: 2,
  t1: 3,
  synchronized: true,
};
const historyEntry1: PairLiquidityInfoHistory = {
  id: 1,
  pairId: 1,
  totalSupply: '2000148656239820912122563',
  reserve0: '950875688379385634428666',
  reserve1: '4208476309359648851631167',
  height: 100001,
  microBlockHash: 'mh_entry1',
  microBlockTime: 1000000000001n,
  updatedAt: new Date(),
};
const historyEntry2: PairLiquidityInfoHistory = {
  id: 2,
  pairId: 1,
  totalSupply: '9954575303087659158151',
  reserve0: '20210309618736130321327',
  reserve1: '4903471477408475598460',
  height: 200002,
  microBlockHash: 'mh_entry2',
  microBlockTime: 2000000000002n,
  updatedAt: new Date(),
};
const historyEntry3: PairLiquidityInfoHistory = {
  id: 3,
  pairId: 2,
  totalSupply: '56931443813890767374824',
  reserve0: '20556919390913460010617',
  reserve1: '157691178959228289022449',
  height: 300003,
  microBlockHash: 'mh_entry3',
  microBlockTime: 3000000000003n,
  updatedAt: new Date(),
};
const historyEntry4: PairLiquidityInfoHistory = {
  id: 4,
  pairId: 2,
  totalSupply: '56931443813890767374824',
  reserve0: '20556919390913460010617',
  reserve1: '157691178959228289022449',
  height: 300003,
  microBlockHash: 'mh_entry4',
  microBlockTime: 4000000000004n,
  updatedAt: new Date(),
};

describe('PairLiquidityInfoHistoryDbService', () => {
  let service: PairLiquidityInfoHistoryDbService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PairLiquidityInfoHistoryDbService, PrismaService],
    }).compile();

    service = module.get<PairLiquidityInfoHistoryDbService>(
      PairLiquidityInfoHistoryDbService,
    );
    prismaService = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await prismaService.token.createMany({ data: [token1, token2, token3] });
    await prismaService.pair.createMany({ data: [pair1, pair2, pair3] });
    await prismaService.pairLiquidityInfoHistory.createMany({
      data: [historyEntry1, historyEntry2, historyEntry3, historyEntry4],
    });
  });

  afterEach(async () => {
    await prismaService.pairLiquidityInfoHistory.deleteMany();
    await prismaService.pair.deleteMany();
    await prismaService.token.deleteMany();
  });

  afterAll(async () => {
    await prismaService.$disconnect();
  });

  describe('getAll', () => {
    it('should return all entries', async () => {
      const result = await service.getAll(100, 0, OrderQueryEnum.asc);
      expect(result.map((e) => e.id)).toEqual([1, 2, 3, 4]);
    });

    it('should return return entries with limit, offset and order', async () => {
      const result = await service.getAll(2, 1, OrderQueryEnum.desc);
      expect(result.map((e) => e.id)).toEqual([3, 2]);
    });

    it('should correctly filter by pair address', async () => {
      const result = await service.getAll(
        100,
        0,
        OrderQueryEnum.asc,
        pair1.address as ContractAddress,
        undefined,
        undefined,
        undefined,
      );
      expect(result.map((e) => e.id)).toEqual([1, 2]);
    });

    it('should correctly filter by height', async () => {
      const result = await service.getAll(
        100,
        0,
        OrderQueryEnum.asc,
        undefined,
        300003,
        undefined,
        undefined,
      );
      expect(result.map((e) => e.id)).toEqual([3, 4]);
    });

    it('should correctly return entries newer or equal fromBlockTime', async () => {
      const result = await service.getAll(
        100,
        0,
        OrderQueryEnum.asc,
        undefined,
        undefined,
        2000000000002n,
        undefined,
      );
      expect(result.map((e) => e.id)).toEqual([2, 3, 4]);
    });

    it('should correctly return entries older or equal toBlockTime', async () => {
      const result = await service.getAll(
        100,
        0,
        OrderQueryEnum.desc,
        undefined,
        undefined,
        undefined,
        3000000000003n,
      );
      expect(result.map((e) => e.id)).toEqual([3, 2, 1]);
    });
  });

  describe('getLastlySyncedBlockByPairId', () => {
    it('should correctly return the last synced block for a given pairId', async () => {
      const result = await service.getLastlySyncedBlockByPairId(1);
      expect(result?.microBlockTime).toEqual(2000000000002n);
    });
  });

  describe('getWithinHeightSorted', () => {
    it('should correctly return all entries greater or equal a given height limit sorted by microBlockTime ascending', async () => {
      const result = await service.getWithinHeightSorted(200002);
      expect(result.map((e) => e.id)).toEqual([2, 3, 4]);
    });
  });

  describe('deleteFromMicroBlockTime', () => {
    it('should correctly delete all entries newer or equal a given block time', async () => {
      await service.deleteFromMicroBlockTime(3000000000003n);
      const result = await prismaService.pairLiquidityInfoHistory.findMany();
      expect(result.map((e) => e.id)).toEqual([1, 2]);
    });
  });
});
