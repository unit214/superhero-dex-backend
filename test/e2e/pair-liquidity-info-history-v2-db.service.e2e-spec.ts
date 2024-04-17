import { Test, TestingModule } from '@nestjs/testing';
import { Pair, PairLiquidityInfoHistoryV2, Token } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { PairLiquidityInfoHistoryV2DbService } from '@/database/pair-liquidity-info-history/pair-liquidity-info-history-v2-db.service';
import { PrismaService } from '@/database/prisma.service';
import { EventType } from '@/tasks/pair-liquidity-info-history-importer/pair-liquidity-info-history-importer-v2.service';

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
const historyEntry1: PairLiquidityInfoHistoryV2 = {
  id: 111,
  pairId: 1,
  eventType: EventType.PairMint,
  reserve0: new Decimal(1000),
  reserve1: new Decimal(1000),
  deltaReserve0: new Decimal(1000),
  deltaReserve1: new Decimal(1000),
  fiatPrice: new Decimal(0),
  height: 100001,
  microBlockHash: 'mh_entry1',
  microBlockTime: 1000000000001n,
  transactionHash: 'th_entry1',
  transactionIndex: 100001n,
  logIndex: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const historyEntry2: PairLiquidityInfoHistoryV2 = {
  id: 222,
  pairId: 1,
  eventType: EventType.SwapTokens,
  reserve0: new Decimal(1050),
  reserve1: new Decimal(950),
  deltaReserve0: new Decimal(50),
  deltaReserve1: new Decimal(-50),
  fiatPrice: new Decimal(0),
  height: 200002,
  microBlockHash: 'mh_entry2',
  microBlockTime: 2000000000002n,
  transactionHash: 'th_entry2',
  transactionIndex: 200002n,
  logIndex: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const historyEntry3: PairLiquidityInfoHistoryV2 = {
  id: 333,
  pairId: 2,
  eventType: EventType.PairMint,
  reserve0: new Decimal(1000),
  reserve1: new Decimal(1000),
  deltaReserve0: new Decimal(1000),
  deltaReserve1: new Decimal(1000),
  fiatPrice: new Decimal(0),
  height: 300003,
  microBlockHash: 'mh_entry3',
  microBlockTime: 3000000000003n,
  transactionHash: 'th_entry3',
  transactionIndex: 300003n,
  logIndex: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const historyEntry4: PairLiquidityInfoHistoryV2 = {
  id: 444,
  pairId: 2,
  eventType: EventType.SwapTokens,
  reserve0: new Decimal(1050),
  reserve1: new Decimal(950),
  deltaReserve0: new Decimal(50),
  deltaReserve1: new Decimal(-50),
  fiatPrice: new Decimal(0),
  height: 300003,
  microBlockHash: 'mh_entry4',
  microBlockTime: 3000000000003n,
  transactionHash: 'th_entry4',
  transactionIndex: 300003n,
  logIndex: 2,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('PairLiquidityInfoHistoryV2DbService', () => {
  let service: PairLiquidityInfoHistoryV2DbService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PairLiquidityInfoHistoryV2DbService, PrismaService],
    }).compile();

    service = module.get<PairLiquidityInfoHistoryV2DbService>(
      PairLiquidityInfoHistoryV2DbService,
    );
    prismaService = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await prismaService.token.createMany({ data: [token1, token2, token3] });
    await prismaService.pair.createMany({ data: [pair1, pair2, pair3] });
    await prismaService.pairLiquidityInfoHistoryV2.createMany({
      data: [historyEntry1, historyEntry2, historyEntry3, historyEntry4],
    });
  });

  afterEach(async () => {
    await prismaService.pairLiquidityInfoHistoryV2.deleteMany();
    await prismaService.pair.deleteMany();
    await prismaService.token.deleteMany();
  });

  afterAll(async () => {
    await prismaService.$disconnect();
  });

  describe('upsert', () => {
    it('should correctly upsert an existing entry', async () => {
      const updatedEntry = {
        pairId: historyEntry2.pairId,
        eventType: EventType.PairBurn,
        reserve0: new Decimal(500),
        reserve1: new Decimal(500),
        deltaReserve0: new Decimal(-500),
        deltaReserve1: new Decimal(-500),
        fiatPrice: new Decimal(0),
        height: 200002,
        microBlockHash: historyEntry2.microBlockHash,
        microBlockTime: 2000000000002n,
        transactionHash: historyEntry2.transactionHash,
        transactionIndex: 200002n,
        logIndex: historyEntry2.logIndex,
      };
      await service.upsert(updatedEntry);
      const entry = await prismaService.pairLiquidityInfoHistoryV2.findFirst({
        where: { id: historyEntry2.id },
      });
      expect(entry?.reserve0).toEqual(new Decimal(500));
    });

    it('should correctly insert an new entry', async () => {
      const newEntry = {
        pairId: 1,
        eventType: EventType.PairBurn,
        reserve0: new Decimal(500),
        reserve1: new Decimal(500),
        deltaReserve0: new Decimal(-500),
        deltaReserve1: new Decimal(-500),
        fiatPrice: new Decimal(0),
        height: 500005,
        microBlockHash: 'mh_entry5',
        microBlockTime: 5000000000005n,
        transactionHash: 'th_entry5',
        transactionIndex: 500005n,
        logIndex: 1,
      };
      await service.upsert(newEntry);
      const entry = await service.getLastlySyncedLogByPairId(1);
      expect(entry?.microBlockHash).toEqual('mh_entry5');
    });
  });

  describe('getLastlySyncedLogByPairId', () => {
    it('should correctly return the last synced log for a given pairId', async () => {
      const result1 = await service.getLastlySyncedLogByPairId(1);
      const result2 = await service.getLastlySyncedLogByPairId(2);
      expect(result1?.id).toEqual(historyEntry2.id);
      expect(result2?.id).toEqual(historyEntry4.id);
    });
  });
});
