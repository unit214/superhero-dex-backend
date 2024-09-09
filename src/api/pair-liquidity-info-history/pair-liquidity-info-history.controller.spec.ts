import { CacheModule } from '@nestjs/cache-manager';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { OrderQueryEnum } from '@/api/api.model';
import { PairLiquidityInfoHistoryController } from '@/api/pair-liquidity-info-history/pair-liquidity-info-history.controller';
import { PairLiquidityInfoHistoryWithTokens } from '@/api/pair-liquidity-info-history/pair-liquidity-info-history.model';
import { PairLiquidityInfoHistoryService } from '@/api/pair-liquidity-info-history/pair-liquidity-info-history.service';
import { PairLiquidityInfoHistoryDbService } from '@/database/pair-liquidity-info-history/pair-liquidity-info-history-db.service';
import {
  historyEntry1,
  historyEntry3,
  pair1,
  pair2,
  token1,
  token2,
} from '@/test/mock-data/pair-liquidity-info-history-mock-data';

const mockPairLiquidityInfoHistoryDbService = {
  getAll: jest.fn(),
};

describe('PairLiquidityInfoHistoryController', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PairLiquidityInfoHistoryController],
      providers: [
        PairLiquidityInfoHistoryService,
        {
          provide: PairLiquidityInfoHistoryDbService,
          useValue: mockPairLiquidityInfoHistoryDbService,
        },
      ],
      imports: [
        CacheModule.register({
          isGlobal: true,
        }),
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  describe('GET /history', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return history entries and use default values for empty params', async () => {
      // Mocks
      const historyEntryWithPair1: PairLiquidityInfoHistoryWithTokens = {
        ...historyEntry1,
        pair: { ...pair1, token0: token1, token1: token2 },
      };

      const historyEntryWithPair2: PairLiquidityInfoHistoryWithTokens = {
        ...historyEntry3,
        pair: { ...pair2, token0: token2, token1: token2 },
      };

      mockPairLiquidityInfoHistoryDbService.getAll.mockResolvedValue([
        historyEntryWithPair1,
        historyEntryWithPair2,
      ]);

      // Call route
      const result = await request(app.getHttpServer()).get('/history');

      // Assertions
      expect(mockPairLiquidityInfoHistoryDbService.getAll).toHaveBeenCalledWith(
        {
          limit: 100,
          offset: 0,
          order: OrderQueryEnum.asc,
          pairAddress: undefined,
          tokenAddress: undefined,
          height: undefined,
          fromBlockTime: undefined,
          toBlockTime: undefined,
        },
      );
      expect(result.status).toBe(200);
      expect(result.body).toMatchSnapshot();
    });

    it('should parse all query params correctly', async () => {
      // Mocks
      mockPairLiquidityInfoHistoryDbService.getAll.mockResolvedValue([]);

      // Call route
      const result = await request(app.getHttpServer()).get(
        '/history?limit=50&offset=50&order=desc&pairAddress=ct_22iY9&height=912485&fromBlockTime=1709027642807&toBlockTime=1709027642807',
      );

      // Assertions
      expect(mockPairLiquidityInfoHistoryDbService.getAll).toHaveBeenCalledWith(
        {
          fromBlockTime: 1709027642807n,
          height: 912485,
          limit: 50,
          offset: 50,
          order: 'desc',
          pairAddress: 'ct_22iY9',
          toBlockTime: 1709027642807n,
          tokenAddress: undefined,
        },
      );
      expect(result.status).toBe(200);
      expect(result.body).toEqual([]);
    });

    it('should validate limit query param correctly', async () => {
      // Call route
      const result = await request(app.getHttpServer()).get(
        '/history?limit=xyz',
      );

      // Assertions
      expect(
        mockPairLiquidityInfoHistoryDbService.getAll,
      ).toHaveBeenCalledTimes(0);
      expect(result.status).toBe(400);
    });

    it('should validate offset query param correctly', async () => {
      // Call route
      const result = await request(app.getHttpServer()).get(
        '/history?offset=xyz',
      );

      // Assertions
      expect(
        mockPairLiquidityInfoHistoryDbService.getAll,
      ).toHaveBeenCalledTimes(0);
      expect(result.status).toBe(400);
    });

    it('should validate order query param correctly', async () => {
      // Call route
      const result = await request(app.getHttpServer()).get(
        '/history?order=xyz',
      );

      // Assertions
      expect(
        mockPairLiquidityInfoHistoryDbService.getAll,
      ).toHaveBeenCalledTimes(0);
      expect(result.status).toBe(400);
    });

    it('should validate height query param correctly', async () => {
      // Call route
      const result = await request(app.getHttpServer()).get(
        '/history?height=xyz',
      );

      // Assertions
      expect(
        mockPairLiquidityInfoHistoryDbService.getAll,
      ).toHaveBeenCalledTimes(0);
      expect(result.status).toBe(400);
    });

    it('should validate fromBlockTime query param correctly', async () => {
      // Call route
      const result = await request(app.getHttpServer()).get(
        '/history?fromBlockTime=xyz',
      );

      // Assertions
      expect(
        mockPairLiquidityInfoHistoryDbService.getAll,
      ).toHaveBeenCalledTimes(0);
      expect(result.status).toBe(400);
    });

    it('should validate toBlockTime query param correctly', async () => {
      // Call route
      const result = await request(app.getHttpServer()).get(
        '/history?toBlockTime=xyz',
      );

      // Assertions
      expect(
        mockPairLiquidityInfoHistoryDbService.getAll,
      ).toHaveBeenCalledTimes(0);
      expect(result.status).toBe(400);
    });
  });
});
