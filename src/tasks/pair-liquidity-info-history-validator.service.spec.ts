import { PairLiquidityInfoHistoryValidatorService } from './pair-liquidity-info-history-validator.service';
import { Test, TestingModule } from '@nestjs/testing';
import { MdwClientService } from '../clients/mdw-client.service';
import { PairLiquidityInfoHistoryService } from '../database/pair-liquidity-info-history.service';

const mockMdwClientService = {
  getKeyBlockMicroBlocks: jest.fn(),
};

const mockPairLiquidityInfoHistoryService = {
  getWithinHeightSorted: jest.fn(),
  deleteFromMicroBlockTime: jest.fn(),
};

describe('PairLiquidityInfoHistoryValidatorService', () => {
  let service: PairLiquidityInfoHistoryValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PairLiquidityInfoHistoryValidatorService,
        { provide: MdwClientService, useValue: mockMdwClientService },
        {
          provide: PairLiquidityInfoHistoryService,
          useValue: mockPairLiquidityInfoHistoryService,
        },
      ],
    }).compile();
    service = module.get<PairLiquidityInfoHistoryValidatorService>(
      PairLiquidityInfoHistoryValidatorService,
    );
  });

  describe('validate', () => {
    it('should validate history correctly', async () => {
      // Mock data
      const historyEntry1 = {
        height: 10001,
        microBlockTime: 1000000000001n,
        microBlockHash: 'mh_hash1',
      };
      const historyEntry2 = {
        height: 10001,
        microBlockTime: 1000000000002n,
        microBlockHash: 'mh_hash2',
      };
      const historyEntry3 = {
        height: 10003,
        microBlockTime: 1000000000003n,
        microBlockHash: 'mh_hash3',
      };
      const historyEntry4 = {
        height: 10004,
        microBlockTime: 1000000000004n,
        microBlockHash: 'mh_hash4',
      };
      const historyEntry5 = {
        height: 10005,
        microBlockTime: 1000000000005n,
        microBlockHash: 'mh_hash5',
      };
      // Mock functions
      mockPairLiquidityInfoHistoryService.getWithinHeightSorted.mockResolvedValue(
        [historyEntry1, historyEntry2, historyEntry3, historyEntry4],
      );
      mockMdwClientService.getKeyBlockMicroBlocks.mockImplementation(
        (height: number) => {
          if (height === historyEntry1.height) {
            return [
              { hash: historyEntry1.microBlockHash },
              { hash: historyEntry2.microBlockHash },
              { hash: 'mh_xyz' },
            ];
          } else if (height === historyEntry3.height) {
            return [{ hash: historyEntry3.microBlockHash }, { hash: 'mh_xyz' }];
          } else {
            return [];
          }
        },
      );
      mockPairLiquidityInfoHistoryService.deleteFromMicroBlockTime.mockResolvedValue(
        { count: 2 },
      );
      jest.spyOn(service.logger, 'log');

      // Start validation
      await service.validate();

      // Assertions
      expect(mockMdwClientService.getKeyBlockMicroBlocks).toHaveBeenCalledWith(
        historyEntry1.height,
      );
      expect(mockMdwClientService.getKeyBlockMicroBlocks).toHaveBeenCalledWith(
        historyEntry3.height,
      );
      expect(mockMdwClientService.getKeyBlockMicroBlocks).toHaveBeenCalledWith(
        historyEntry4.height,
      );
      expect(
        mockMdwClientService.getKeyBlockMicroBlocks,
      ).not.toHaveBeenCalledWith(historyEntry5.height);
      expect(
        mockPairLiquidityInfoHistoryService.deleteFromMicroBlockTime,
      ).toHaveBeenCalledWith(historyEntry4.microBlockTime);
      expect(service.logger.log).toHaveBeenCalledWith(
        `Found an inconsistency in pair liquidity info history. Deleted 2 entries.`,
      );
    });
  });
});
