import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Pair, PairLiquidityInfoHistory } from '@prisma/client';
import * as request from 'supertest';

import { OrderQueryEnum } from '@/api/api.model';
import { PairLiquidityInfoHistoryController } from '@/api/pair-liquidity-info-history/pair-liquidity-info-history.controller';
import { PairLiquidityInfoHistoryService } from '@/api/pair-liquidity-info-history/pair-liquidity-info-history.service';
import {
  historyEntry1,
  historyEntry3,
  pair1,
  pair2,
} from '@/test/mock-data/pair-liquidity-info-history-mock-data';

const mockPairLiquidityInfoHistoryService = {
  getAllHistoryEntries: jest.fn(),
};

describe('PairLiquidityInfoHistoryController', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PairLiquidityInfoHistoryController],
      providers: [
        {
          provide: PairLiquidityInfoHistoryService,
          useValue: mockPairLiquidityInfoHistoryService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  describe('GET /history/liquidity', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    // TODO fix with updated return
    it.skip('should return history entries and use default values for empty params', async () => {
      // Mocks
      const historyEntryWithPair1: { pair: Pair } & PairLiquidityInfoHistory = {
        ...historyEntry1,
        pair: pair1,
      };

      const historyEntryWithPair2: { pair: Pair } & PairLiquidityInfoHistory = {
        ...historyEntry3,
        pair: pair2,
      };

      mockPairLiquidityInfoHistoryService.getAllHistoryEntries.mockResolvedValue(
        [historyEntryWithPair1, historyEntryWithPair2],
      );

      // Call route
      const result = await request(app.getHttpServer()).get(
        '/history/liquidity',
      );

      // Assertions
      expect(
        mockPairLiquidityInfoHistoryService.getAllHistoryEntries,
      ).toHaveBeenCalledWith(
        100,
        0,
        OrderQueryEnum.asc,
        undefined,
        undefined,
        undefined,
        undefined,
      );
      expect(result.status).toBe(200);
      expect(result.body).toEqual([
        {
          pairAddress: historyEntryWithPair1.pair.address,
          liquidityInfo: {
            reserve0: historyEntryWithPair1.reserve0,
            reserve1: historyEntryWithPair1.reserve1,
          },
          height: historyEntryWithPair1.height,
          microBlockHash: historyEntryWithPair1.microBlockHash,
          microBlockTime: historyEntryWithPair1.microBlockTime.toString(),
        },
        {
          pairAddress: historyEntryWithPair2.pair.address,
          liquidityInfo: {
            reserve0: historyEntryWithPair2.reserve0,
            reserve1: historyEntryWithPair2.reserve1,
          },
          height: historyEntryWithPair2.height,
          microBlockHash: historyEntryWithPair2.microBlockHash,
          microBlockTime: historyEntryWithPair2.microBlockTime.toString(),
        },
      ]);
    });

    it('should parse all query params correctly', async () => {
      // Mocks
      mockPairLiquidityInfoHistoryService.getAllHistoryEntries.mockResolvedValue(
        [],
      );

      // Call route
      const result = await request(app.getHttpServer()).get(
        '/history/liquidity?limit=50&offset=50&order=desc&pair-address=ct_22iY9&height=912485&from-block-time=1709027642807&to-block-time=1709027642807',
      );

      // Assertions
      expect(
        mockPairLiquidityInfoHistoryService.getAllHistoryEntries,
      ).toHaveBeenCalledWith(
        50,
        50,
        OrderQueryEnum.desc,
        'ct_22iY9',
        912485,
        1709027642807n,
        1709027642807n,
      );
      expect(result.status).toBe(200);
      expect(result.body).toEqual([]);
    });

    it('should validate limit query param correctly', async () => {
      // Call route
      const result = await request(app.getHttpServer()).get(
        '/history/liquidity?limit=xyz',
      );

      // Assertions
      expect(
        mockPairLiquidityInfoHistoryService.getAllHistoryEntries,
      ).toHaveBeenCalledTimes(0);
      expect(result.status).toBe(400);
    });

    it('should validate offset query param correctly', async () => {
      // Call route
      const result = await request(app.getHttpServer()).get(
        '/history/liquidity?offset=xyz',
      );

      // Assertions
      expect(
        mockPairLiquidityInfoHistoryService.getAllHistoryEntries,
      ).toHaveBeenCalledTimes(0);
      expect(result.status).toBe(400);
    });

    it('should validate order query param correctly', async () => {
      // Call route
      const result = await request(app.getHttpServer()).get(
        '/history/liquidity?order=xyz',
      );

      // Assertions
      expect(
        mockPairLiquidityInfoHistoryService.getAllHistoryEntries,
      ).toHaveBeenCalledTimes(0);
      expect(result.status).toBe(400);
    });

    it('should validate height query param correctly', async () => {
      // Call route
      const result = await request(app.getHttpServer()).get(
        '/history/liquidity?height=xyz',
      );

      // Assertions
      expect(
        mockPairLiquidityInfoHistoryService.getAllHistoryEntries,
      ).toHaveBeenCalledTimes(0);
      expect(result.status).toBe(400);
    });

    it('should validate from-block-time query param correctly', async () => {
      // Call route
      const result = await request(app.getHttpServer()).get(
        '/history/liquidity?from-block-time=xyz',
      );

      // Assertions
      expect(
        mockPairLiquidityInfoHistoryService.getAllHistoryEntries,
      ).toHaveBeenCalledTimes(0);
      expect(result.status).toBe(400);
    });

    it('should validate to-block-time query param correctly', async () => {
      // Call route
      const result = await request(app.getHttpServer()).get(
        '/history/liquidity?to-block-time=xyz',
      );

      // Assertions
      expect(
        mockPairLiquidityInfoHistoryService.getAllHistoryEntries,
      ).toHaveBeenCalledTimes(0);
      expect(result.status).toBe(400);
    });
  });
});
