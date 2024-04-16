import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Pair, PairLiquidityInfoHistory } from '@prisma/client';
import * as request from 'supertest';

import { OrderQueryEnum } from '@/api/api.model';
import { PairLiquidityInfoHistoryController } from '@/api/pair-liquidity-info-history/pair-liquidity-info-history.controller';
import { PairLiquidityInfoHistoryService } from '@/api/pair-liquidity-info-history/pair-liquidity-info-history.service';

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

    it('should return history entries and use default values for empty params', async () => {
      // Mocks
      const historyEntry1: { pair: Pair } & PairLiquidityInfoHistory = {
        id: 1,
        pairId: 1,
        totalSupply: '2000148656239820912122563',
        reserve0: '950875688379385634428666',
        reserve1: '4208476309359648851631167',
        height: 912485,
        microBlockHash: 'mh_Tx43Gh3acudUNSUWihPcV1Se4XcoFK3aUFAtFZk2Z4Zv7igZs',
        microBlockTime: 1709027642807n,
        updatedAt: new Date('2024-03-20 17:04:51.625'),
        pair: {
          id: 1,
          address: 'ct_efYtiwDg4YZxDWE3iLPzvrjb92CJPvzGwriv4ZRuvuTDMNMb9',
          t0: 15,
          t1: 5,
          synchronized: true,
        },
      };

      const historyEntry2: { pair: Pair } & PairLiquidityInfoHistory = {
        id: 2,
        pairId: 3,
        totalSupply: '9954575303087659158151',
        reserve0: '20210309618736130321327',
        reserve1: '4903471477408475598460',
        height: 707395,
        microBlockHash: 'mh_2dUTfmwFc2ymeroB534giVwEvsa8d44Vf8SXtvy6GeHjdgQoHj',
        microBlockTime: 1671708830503n,
        updatedAt: new Date('2024-03-20 12:16:49.065'),
        pair: {
          id: 3,
          address: 'ct_22iY9F7hng23gN8awi4aGnLy54YSR41wztbqgQCquuLYvTiGcm',
          t0: 17,
          t1: 22,
          synchronized: true,
        },
      };

      mockPairLiquidityInfoHistoryService.getAllHistoryEntries.mockResolvedValue(
        [historyEntry1, historyEntry2],
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
          pairAddress: historyEntry1.pair.address,
          liquidityInfo: {
            totalSupply: historyEntry1.totalSupply,
            reserve0: historyEntry1.reserve0,
            reserve1: historyEntry1.reserve1,
          },
          height: historyEntry1.height,
          microBlockHash: historyEntry1.microBlockHash,
          microBlockTime: historyEntry1.microBlockTime.toString(),
        },
        {
          pairAddress: historyEntry2.pair.address,
          liquidityInfo: {
            totalSupply: historyEntry2.totalSupply,
            reserve0: historyEntry2.reserve0,
            reserve1: historyEntry2.reserve1,
          },
          height: historyEntry2.height,
          microBlockHash: historyEntry2.microBlockHash,
          microBlockTime: historyEntry2.microBlockTime.toString(),
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
