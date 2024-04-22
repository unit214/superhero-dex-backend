import { Test, TestingModule } from '@nestjs/testing';

import { MdwHttpClientService } from '@/clients/mdw-http-client.service';
import {
  AccountAddress,
  ContractAddress,
  MicroBlockHash,
} from '@/clients/sdk-client.model';
import { SdkClientService } from '@/clients/sdk-client.service';
import { PairLiquidityInfoHistoryV2DbService } from '@/database/pair-liquidity-info-history/pair-liquidity-info-history-v2-db.service';
import { PairLiquidityInfoHistoryValidatorV2Service } from '@/tasks/pair-liquidity-info-history-validator/pair-liquidity-info-history-validator-v2.service';
import {
  historyEntry1,
  historyEntry2,
  historyEntry3,
  historyEntry4,
  pairWithTokens,
} from '@/test/mock-data/pair-liquidity-info-history-mock-data';
import resetAllMocks = jest.resetAllMocks;

const mockPairLiquidityInfoHistoryV2Db = {
  getWithinHeightSortedWithPair: jest.fn(),
  deleteFromMicroBlockTime: jest.fn(),
};

const mockMdwClient = {
  getAccountBalanceForContractAtMicroBlockHash: jest.fn(),
};

const mockSdkClient = {
  getHeight: jest.fn(),
};

describe('PairLiquidityInfoHistoryValidatorV2Service', () => {
  let service: PairLiquidityInfoHistoryValidatorV2Service;
  let logSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PairLiquidityInfoHistoryValidatorV2Service,
        SdkClientService,
        {
          provide: PairLiquidityInfoHistoryV2DbService,
          useValue: mockPairLiquidityInfoHistoryV2Db,
        },
        { provide: MdwHttpClientService, useValue: mockMdwClient },
        { provide: SdkClientService, useValue: mockSdkClient },
      ],
    }).compile();
    service = module.get<PairLiquidityInfoHistoryValidatorV2Service>(
      PairLiquidityInfoHistoryValidatorV2Service,
    );
    logSpy = jest.spyOn(service.logger, 'log');
    resetAllMocks();
  });

  describe('validate', () => {
    it('should not delete entries if the mdw data matches with the last element of a local micro block', async () => {
      // Mock functions
      mockSdkClient.getHeight.mockResolvedValue(900000);
      mockPairLiquidityInfoHistoryV2Db.getWithinHeightSortedWithPair.mockResolvedValue(
        [
          { ...historyEntry2, pair: pairWithTokens },
          { ...historyEntry3, pair: pairWithTokens },
          { ...historyEntry4, pair: pairWithTokens },
        ],
      );

      mockMdwClient.getAccountBalanceForContractAtMicroBlockHash.mockImplementation(
        (
          contractAddress: ContractAddress,
          accountAddress: AccountAddress,
          microBlockHash: MicroBlockHash,
        ) => {
          if (microBlockHash === historyEntry2.microBlockHash) {
            if (contractAddress === pairWithTokens.token0.address) {
              return {
                amount: historyEntry2.reserve0,
              };
            } else {
              return {
                amount: historyEntry2.reserve1,
              };
            }
          } else if (microBlockHash === historyEntry4.microBlockHash) {
            if (contractAddress === pairWithTokens.token0.address) {
              return {
                amount: historyEntry4.reserve0,
              };
            } else {
              return {
                amount: historyEntry4.reserve1,
              };
            }
          } else {
            return {};
          }
        },
      );

      // Start validation
      await service.validate();

      // Assertions
      expect(
        mockPairLiquidityInfoHistoryV2Db.getWithinHeightSortedWithPair,
      ).toHaveBeenCalledWith(899980); // Current height - VALIDATION_WINDOW_BLOCKS

      expect(
        mockMdwClient.getAccountBalanceForContractAtMicroBlockHash,
      ).toHaveBeenCalledTimes(4);

      expect(
        mockPairLiquidityInfoHistoryV2Db.deleteFromMicroBlockTime,
      ).toHaveBeenCalledTimes(0);
      expect(logSpy.mock.calls).toEqual([
        ['Started validating pair liquidity info history.'],
        ['No problems in pair liquidity info history found.'],
        ['Finished validating pair liquidity info history.'],
      ]);
    });

    it("should correctly delete entries if the mdw data doesn't match with the local data", async () => {
      // Mock functions
      mockSdkClient.getHeight.mockResolvedValue(900000);
      mockPairLiquidityInfoHistoryV2Db.getWithinHeightSortedWithPair.mockResolvedValue(
        [
          { ...historyEntry1, pair: pairWithTokens },
          { ...historyEntry2, pair: pairWithTokens },
          { ...historyEntry3, pair: pairWithTokens },
          { ...historyEntry4, pair: pairWithTokens },
        ],
      );

      mockMdwClient.getAccountBalanceForContractAtMicroBlockHash.mockImplementation(
        (
          contractAddress: ContractAddress,
          accountAddress: AccountAddress,
          microBlockHash: MicroBlockHash,
        ) => {
          if (microBlockHash === historyEntry1.microBlockHash) {
            if (contractAddress === pairWithTokens.token0.address) {
              return {
                amount: historyEntry1.reserve0,
              };
            } else {
              return {
                amount: historyEntry1.reserve1,
              };
            }
          } else if (microBlockHash === historyEntry2.microBlockHash) {
            if (contractAddress === pairWithTokens.token0.address) {
              return {
                amount: '123',
              };
            } else {
              return {
                amount: '123',
              };
            }
          } else {
            return {};
          }
        },
      );

      mockPairLiquidityInfoHistoryV2Db.deleteFromMicroBlockTime.mockResolvedValue(
        { count: 3 },
      );

      // Start validation
      await service.validate();

      // Assertions
      expect(
        mockMdwClient.getAccountBalanceForContractAtMicroBlockHash,
      ).toHaveBeenCalledTimes(4);

      expect(
        mockPairLiquidityInfoHistoryV2Db.deleteFromMicroBlockTime,
      ).toHaveBeenCalledWith(historyEntry2.microBlockTime);
      expect(logSpy.mock.calls).toEqual([
        ['Started validating pair liquidity info history.'],
        [
          'Found an inconsistency in pair liquidity info history. Deleted 3 entries.',
        ],
        ['Finished validating pair liquidity info history.'],
      ]);
    });

    it('should correctly delete entries if mdw returns an error', async () => {
      // Mock functions
      mockSdkClient.getHeight.mockResolvedValue(900000);
      mockPairLiquidityInfoHistoryV2Db.getWithinHeightSortedWithPair.mockResolvedValue(
        [
          { ...historyEntry1, pair: pairWithTokens },
          { ...historyEntry2, pair: pairWithTokens },
          { ...historyEntry3, pair: pairWithTokens },
          { ...historyEntry4, pair: pairWithTokens },
        ],
      );

      mockMdwClient.getAccountBalanceForContractAtMicroBlockHash.mockImplementation(
        (
          contractAddress: ContractAddress,
          accountAddress: AccountAddress,
          microBlockHash: MicroBlockHash,
        ) => {
          if (microBlockHash === historyEntry1.microBlockHash) {
            if (contractAddress === pairWithTokens.token0.address) {
              return {
                amount: historyEntry1.reserve0,
              };
            } else {
              return {
                amount: historyEntry1.reserve1,
              };
            }
          } else if (microBlockHash === historyEntry2.microBlockHash) {
            if (contractAddress === pairWithTokens.token0.address) {
              throw new Error('mdw error');
            }
          }
        },
      );

      mockPairLiquidityInfoHistoryV2Db.deleteFromMicroBlockTime.mockResolvedValue(
        { count: 3 },
      );

      // Start validation
      await service.validate();

      // Assertions
      expect(
        mockMdwClient.getAccountBalanceForContractAtMicroBlockHash,
      ).toHaveBeenCalledTimes(3);

      expect(
        mockPairLiquidityInfoHistoryV2Db.deleteFromMicroBlockTime,
      ).toHaveBeenCalledWith(historyEntry2.microBlockTime);
      expect(logSpy.mock.calls).toEqual([
        ['Started validating pair liquidity info history.'],
        [
          'Found an inconsistency in pair liquidity info history. Deleted 3 entries.',
        ],
        ['Finished validating pair liquidity info history.'],
      ]);
    });
  });
});
