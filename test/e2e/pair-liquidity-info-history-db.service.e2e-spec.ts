import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import { omit } from 'lodash';

import { OrderQueryEnum } from '@/api/api.model';
import { ContractAddress } from '@/clients/sdk-client.model';
import { PairLiquidityInfoHistoryDbService } from '@/database/pair-liquidity-info-history/pair-liquidity-info-history-db.service';
import { PrismaService } from '@/database/prisma.service';
import { EventType } from '@/tasks/pair-liquidity-info-history-importer/pair-liquidity-info-history-importer.service';
import {
  historyEntry1,
  historyEntry2,
  historyEntry3,
  historyEntry4,
  pair1,
  pair2,
  pair3,
  token1,
  token2,
  token3,
  token5,
} from '@/test/mock-data/pair-liquidity-info-history-mock-data';

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
    await prismaService.token.createMany({
      data: [token1, token2, token3, token5],
    });
    await prismaService.pair.createMany({ data: [pair1, pair2, pair3] });
    await prismaService.pairLiquidityInfoHistory.createMany({
      data: [historyEntry4, historyEntry2, historyEntry3, historyEntry1],
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

  describe('upsert', () => {
    it('should correctly upsert an existing entry', async () => {
      const updatedEntry = {
        pairId: historyEntry2.pairId,
        eventType: EventType.PairBurn,
        reserve0: new Decimal(500),
        reserve1: new Decimal(500),
        deltaReserve0: new Decimal(-500),
        deltaReserve1: new Decimal(-500),
        token0AePrice: new Decimal(0.060559),
        token1AePrice: new Decimal(0.060559),
        aeUsdPrice: new Decimal(0.060559),
        height: 200002,
        microBlockHash: historyEntry2.microBlockHash,
        microBlockTime: 2000000000002n,
        transactionHash: historyEntry2.transactionHash,
        senderAccount: 'abc',
        transactionIndex: 200002n,
        logIndex: historyEntry2.logIndex,
      };
      await service.upsert(updatedEntry);
      const entry = await prismaService.pairLiquidityInfoHistory.findUnique({
        where: { id: historyEntry2.id },
      });
      expect(omit(entry, ['createdAt', 'updatedAt'])).toMatchSnapshot();
    });

    it('should correctly insert an new entry', async () => {
      const newEntry = {
        pairId: 1,
        eventType: EventType.PairBurn,
        reserve0: new Decimal(500),
        reserve1: new Decimal(500),
        deltaReserve0: new Decimal(-500),
        deltaReserve1: new Decimal(-500),
        token0AePrice: new Decimal(0),
        token1AePrice: new Decimal(0),
        aeUsdPrice: new Decimal(0),
        height: 500005,
        microBlockHash: 'mh_entry5',
        microBlockTime: 5000000000005n,
        transactionHash: 'th_entry5',
        senderAccount: '',
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

  describe('getWithinHeightSortedWithPair', () => {
    it('should correctly return all entries greater or equal a given height limit sorted ascending', async () => {
      const result = await service.getWithinHeightSortedWithPair(200002);
      expect(result.map((e) => e.id)).toEqual([
        historyEntry2.id,
        historyEntry3.id,
        historyEntry4.id,
      ]);
    });
  });

  describe('deleteFromMicroBlockTime', () => {
    it('should correctly delete all entries newer or equal a given block time', async () => {
      await service.deleteFromMicroBlockTime(3000000000003n);
      const result = await prismaService.pairLiquidityInfoHistory.findMany();
      expect(result.map((e) => e.id)).toEqual([
        historyEntry2.id,
        historyEntry1.id,
      ]);
    });
  });

  describe('getAll', () => {
    it('should return all entries', async () => {
      const result = await service.getAll({
        limit: 100,
        offset: 0,
        order: OrderQueryEnum.asc,
        pairAddress: undefined,
        tokenAddress: undefined,
        height: undefined,
        fromBlockTime: undefined,
        toBlockTime: undefined,
      });
      expect(result.map((e) => e.id)).toEqual([
        historyEntry1.id,
        historyEntry2.id,
        historyEntry3.id,
        historyEntry4.id,
      ]);
    });

    it('should return return entries with limit, offset and order', async () => {
      const result = await service.getAll({
        limit: 2,
        offset: 1,
        order: OrderQueryEnum.desc,
        pairAddress: undefined,
        tokenAddress: undefined,
        height: undefined,
        fromBlockTime: undefined,
        toBlockTime: undefined,
      });
      expect(result.map((e) => e.id)).toEqual([
        historyEntry3.id,
        historyEntry2.id,
      ]);
    });

    it('should correctly filter by pair address', async () => {
      const result = await service.getAll({
        limit: 100,
        offset: 0,
        order: OrderQueryEnum.asc,
        pairAddress: pair1.address as ContractAddress,
        tokenAddress: undefined,
        height: undefined,
        fromBlockTime: undefined,
        toBlockTime: undefined,
      });
      expect(result.map((e) => e.id)).toEqual([
        historyEntry1.id,
        historyEntry2.id,
      ]);
    });

    it('should correctly filter by height', async () => {
      const result = await service.getAll({
        limit: 100,
        offset: 0,
        order: OrderQueryEnum.asc,
        pairAddress: undefined,
        tokenAddress: undefined,
        height: 300003,
        fromBlockTime: undefined,
        toBlockTime: undefined,
      });
      expect(result.map((e) => e.id)).toEqual([
        historyEntry3.id,
        historyEntry4.id,
      ]);
    });

    it('should correctly return entries newer or equal fromBlockTime', async () => {
      const result = await service.getAll({
        limit: 100,
        offset: 0,
        order: OrderQueryEnum.asc,
        pairAddress: undefined,
        tokenAddress: undefined,
        height: undefined,
        fromBlockTime: 2000000000002n,
        toBlockTime: undefined,
      });
      expect(result.map((e) => e.id)).toEqual([
        historyEntry2.id,
        historyEntry3.id,
        historyEntry4.id,
      ]);
    });

    it('should correctly return entries older or equal toBlockTime', async () => {
      const result = await service.getAll({
        limit: 100,
        offset: 0,
        order: OrderQueryEnum.desc,
        pairAddress: undefined,
        tokenAddress: undefined,
        height: undefined,
        fromBlockTime: undefined,
        toBlockTime: 3000000000003n,
      });
      expect(result.map((e) => e.id)).toEqual([
        historyEntry4.id,
        historyEntry3.id,
        historyEntry2.id,
        historyEntry1.id,
      ]);
    });
  });
});
