import { Test, TestingModule } from '@nestjs/testing';

import { Contract } from '@/clients/mdw-http-client.model';
import { MdwHttpClientService } from '@/clients/mdw-http-client.service';
import { ContractAddress } from '@/clients/sdk-client.model';
import { SdkClientService } from '@/clients/sdk-client.service';
import { PairDbService } from '@/database/pair/pair-db.service';
import { PairLiquidityInfoHistoryV2DbService } from '@/database/pair-liquidity-info-history/pair-liquidity-info-history-v2-db.service';
import { PairLiquidityInfoHistoryV2ErrorDbService } from '@/database/pair-liquidity-info-history-error/pair-liquidity-info-history-v2-error-db.service';
import { bigIntToDecimal } from '@/lib/utils';
import {
  EventType,
  PairLiquidityInfoHistoryImporterV2Service,
} from '@/tasks/pair-liquidity-info-history-importer/pair-liquidity-info-history-importer-v2.service';
import resetAllMocks = jest.resetAllMocks;

// Mock data
const pair = {
  id: 1,
  address: 'ct_pair' as ContractAddress,
  token0: { address: 'ct_token0' },
  token1: { address: 'ct_token1' },
};
const pairContract: Contract = {
  aexn_type: '',
  block_hash: 'mh_hash0',
  contract: pair.address,
  source_tx_hash: 'th_',
  source_tx_type: '',
  create_tx: {},
};
const initialMicroBlock = {
  hash: pairContract.block_hash,
  height: '10000',
  time: '1000000000000',
};
const contractLog1 = {
  args: ['100', '100'],
  block_hash: 'mh_hash1',
  block_time: '1000000000001',
  call_tx_hash: 'th_hash1',
  call_txi: '10000001',
  data: '',
  event_hash: '6O232NLB36RGK54HEJPVDFJVCSIVFV29KPORC07CSSDARM7LV4L0====', // Sync
  height: '10001',
  log_idx: '1',
};
const contractLog2 = {
  args: ['123', '100', '100'],
  block_hash: 'mh_hash1',
  block_time: '1000000000001',
  call_tx_hash: 'th_hash1',
  call_txi: '10000001',
  data: '',
  event_hash: 'L2BEDU7I5T8OSEUPB61900P8FJR637OE4MC4A9875C390RMQHSN0====', // PairMint
  height: '10001',
  log_idx: '2',
};
const contractLog3 = {
  args: ['200', '200'],
  block_hash: 'mh_hash2',
  block_time: '2000000000002',
  call_tx_hash: 'th_hash2',
  call_txi: '20000002',
  data: '',
  event_hash: '6O232NLB36RGK54HEJPVDFJVCSIVFV29KPORC07CSSDARM7LV4L0====', // Sync
  height: '20002',
  log_idx: '1',
};
const contractLog4 = {
  args: ['201', '199'],
  block_hash: 'mh_hash3',
  block_time: '3000000000003',
  call_tx_hash: 'th_hash3',
  call_txi: '30000003',
  data: '',
  event_hash: '6O232NLB36RGK54HEJPVDFJVCSIVFV29KPORC07CSSDARM7LV4L0====', // Sync
  height: '30003',
  log_idx: '1',
};
const contractLog5 = {
  args: [],
  block_hash: 'mh_hash3',
  block_time: '3000000000003',
  call_tx_hash: 'th_hash3',
  call_txi: '30000003',
  data: '1|0|0|1',
  event_hash: 'K39AB2I57LEUOUQ04LTEOMSJPJC3G9VGFRKVNJ5QLRMVCMDOPIMG====', // SwapTokens
  height: '30003',
  log_idx: '2',
};
const contractLog6 = {
  args: ['100', '100'],
  block_hash: 'mh_hash3',
  block_time: '3000000000003',
  call_tx_hash: 'th_hash4',
  call_txi: '40000004',
  data: '',
  event_hash: '6O232NLB36RGK54HEJPVDFJVCSIVFV29KPORC07CSSDARM7LV4L0====', // Sync
  height: '30003',
  log_idx: '1',
};
const contractLog7 = {
  args: [],
  block_hash: 'mh_hash3',
  block_time: '3000000000003',
  call_tx_hash: 'th_hash4',
  call_txi: '40000004',
  data: '101|99',
  event_hash: 'OIS2ALGSJ03MTP2BR5RBFL1GOUGESRVPGE58LGM0MVG9K3VAFKUG====', // PairBurn
  height: '30003',
  log_idx: '2',
};
const contractLog8 = {
  args: [],
  block_hash: 'mh_hash3',
  block_time: '3000000000003',
  call_tx_hash: 'th_hash4',
  call_txi: '40000004',
  data: '',
  event_hash: 'non_relevant_event_hash', // Something else
  height: '30003',
  log_idx: '3',
};

const mockMdwClientService = {
  getContract: jest.fn(),
  getMicroBlock: jest.fn(),
  getContractLogsUntilCondition: jest.fn(),
};

const mockPairDb = { getAll: jest.fn() };

const mockPairLiquidityInfoHistoryDb = {
  getLastlySyncedLogByPairId: jest.fn(),
  upsert: jest.fn(),
};

const mockPairLiquidityInfoHistoryErrorDb = {
  getErrorWithinHours: jest.fn(),
  upsert: jest.fn(),
};

describe('PairLiquidityInfoHistoryImporterV2Service', () => {
  let service: PairLiquidityInfoHistoryImporterV2Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PairLiquidityInfoHistoryImporterV2Service,
        { provide: MdwHttpClientService, useValue: mockMdwClientService },
        { provide: PairDbService, useValue: mockPairDb },
        {
          provide: PairLiquidityInfoHistoryV2DbService,
          useValue: mockPairLiquidityInfoHistoryDb,
        },
        {
          provide: PairLiquidityInfoHistoryV2ErrorDbService,
          useValue: mockPairLiquidityInfoHistoryErrorDb,
        },
        SdkClientService,
      ],
    }).compile();
    service = module.get<PairLiquidityInfoHistoryImporterV2Service>(
      PairLiquidityInfoHistoryImporterV2Service,
    );
    resetAllMocks();
  });

  describe('import', () => {
    it('should import liquidity correctly', async () => {
      // Mock functions
      mockPairDb.getAll.mockResolvedValue([pair]);
      mockPairLiquidityInfoHistoryErrorDb.getErrorWithinHours.mockResolvedValue(
        undefined,
      );
      mockPairLiquidityInfoHistoryDb.getLastlySyncedLogByPairId
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({
          reserve0: bigIntToDecimal(100n),
          reserve1: bigIntToDecimal(100n),
        });
      mockMdwClientService.getContract.mockResolvedValue(pairContract);
      mockMdwClientService.getMicroBlock.mockResolvedValue(initialMicroBlock);
      mockPairLiquidityInfoHistoryDb.upsert.mockResolvedValue(null);
      mockMdwClientService.getContractLogsUntilCondition.mockResolvedValue([
        contractLog1,
        contractLog2,
        contractLog3,
        contractLog4,
        contractLog5,
        contractLog6,
        contractLog7,
        contractLog8,
      ]);

      // Spies
      const logSpy = jest.spyOn(service.logger, 'log');

      // Start import
      await service.import();

      // Assertions
      expect(
        mockPairLiquidityInfoHistoryErrorDb.getErrorWithinHours,
      ).toHaveBeenCalledTimes(5); // Once for pair and 4 times for each inserted event

      expect(logSpy.mock.calls).toEqual([
        ['Started syncing pair liquidity info history.'],
        ['Syncing liquidity info history for 1 pairs.'],
        [`Inserted initial liquidity for pair ${pair.id} ${pair.address}.`],
        [
          `Completed sync for pair ${pair.id} ${pair.address}. Synced 4 log(s).`,
        ],
        ['Finished liquidity info history sync for all pairs.'],
      ]);

      expect(mockPairLiquidityInfoHistoryDb.upsert).toHaveBeenCalledTimes(5);
      expect(mockPairLiquidityInfoHistoryDb.upsert.mock.calls).toEqual([
        [
          {
            pairId: pair.id,
            eventType: 'CreatePair',
            reserve0: bigIntToDecimal(0n),
            reserve1: bigIntToDecimal(0n),
            deltaReserve0: bigIntToDecimal(0n),
            deltaReserve1: bigIntToDecimal(0n),
            fiatPrice: bigIntToDecimal(0n),
            height: parseInt(initialMicroBlock.height),
            microBlockHash: initialMicroBlock.hash,
            microBlockTime: BigInt(initialMicroBlock.time),
            transactionHash: pairContract.source_tx_hash,
            transactionIndex: 0n,
            logIndex: 0,
          },
        ],
        [
          {
            pairId: pair.id,
            eventType: EventType.PairMint,
            reserve0: bigIntToDecimal(100n),
            reserve1: bigIntToDecimal(100n),
            deltaReserve0: bigIntToDecimal(100n),
            deltaReserve1: bigIntToDecimal(100n),
            fiatPrice: bigIntToDecimal(0n),
            height: parseInt(contractLog2.height),
            microBlockHash: contractLog2.block_hash,
            microBlockTime: BigInt(contractLog2.block_time),
            transactionHash: contractLog2.call_tx_hash,
            transactionIndex: BigInt(contractLog2.call_txi),
            logIndex: parseInt(contractLog2.log_idx),
          },
        ],
        [
          {
            pairId: pair.id,
            eventType: EventType.Sync,
            reserve0: bigIntToDecimal(200n),
            reserve1: bigIntToDecimal(200n),
            deltaReserve0: bigIntToDecimal(100n),
            deltaReserve1: bigIntToDecimal(100n),
            fiatPrice: bigIntToDecimal(0n),
            height: parseInt(contractLog3.height),
            microBlockHash: contractLog3.block_hash,
            microBlockTime: BigInt(contractLog3.block_time),
            transactionHash: contractLog3.call_tx_hash,
            transactionIndex: BigInt(contractLog3.call_txi),
            logIndex: parseInt(contractLog3.log_idx),
          },
        ],
        [
          {
            pairId: pair.id,
            eventType: EventType.SwapTokens,
            reserve0: bigIntToDecimal(201n),
            reserve1: bigIntToDecimal(199n),
            deltaReserve0: bigIntToDecimal(1n),
            deltaReserve1: bigIntToDecimal(-1n),
            fiatPrice: bigIntToDecimal(0n),
            height: parseInt(contractLog5.height),
            microBlockHash: contractLog5.block_hash,
            microBlockTime: BigInt(contractLog5.block_time),
            transactionHash: contractLog5.call_tx_hash,
            transactionIndex: BigInt(contractLog5.call_txi),
            logIndex: parseInt(contractLog5.log_idx),
          },
        ],
        [
          {
            pairId: pair.id,
            eventType: EventType.PairBurn,
            reserve0: bigIntToDecimal(100n),
            reserve1: bigIntToDecimal(100n),
            deltaReserve0: bigIntToDecimal(-101n),
            deltaReserve1: bigIntToDecimal(-99n),
            fiatPrice: bigIntToDecimal(0n),
            height: parseInt(contractLog7.height),
            microBlockHash: contractLog7.block_hash,
            microBlockTime: BigInt(contractLog7.block_time),
            transactionHash: contractLog7.call_tx_hash,
            transactionIndex: BigInt(contractLog7.call_txi),
            logIndex: parseInt(contractLog5.log_idx),
          },
        ],
      ]);
    });

    it('should skip a pair if there was a recent error', async () => {
      // Mock functions
      mockPairDb.getAll.mockResolvedValue([pair]);
      mockPairLiquidityInfoHistoryErrorDb.getErrorWithinHours.mockResolvedValue(
        {
          id: 1,
          pairId: 1,
          microBlockHash: '',
          transactionHash: '',
          logIndex: -1,
          error: 'error',
          timesOccurred: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      );

      // Spies
      const logSpy = jest.spyOn(service.logger, 'log');

      // Start import
      await service.import();

      // Assertions
      expect(logSpy.mock.calls).toEqual([
        ['Started syncing pair liquidity info history.'],
        ['Syncing liquidity info history for 1 pairs.'],
        [`Skipped pair ${pair.id} due to recent error.`],
        ['Finished liquidity info history sync for all pairs.'],
      ]);
    });

    it('should skip a log if there was a recent error', async () => {
      // Mock functions
      mockPairDb.getAll.mockResolvedValue([pair]);
      mockPairLiquidityInfoHistoryErrorDb.getErrorWithinHours
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({
          id: 1,
          pairId: 1,
          microBlockHash: contractLog1.block_hash,
          transactionHash: contractLog1.call_tx_hash,
          logIndex: contractLog1.log_idx,
          error: 'error',
          timesOccurred: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
        .mockResolvedValueOnce(undefined);
      mockPairLiquidityInfoHistoryDb.getLastlySyncedLogByPairId.mockResolvedValue(
        {},
      );
      mockPairLiquidityInfoHistoryDb.upsert.mockResolvedValue(null);
      mockMdwClientService.getContractLogsUntilCondition.mockResolvedValue([
        contractLog1,
        contractLog2,
        contractLog4,
        contractLog5,
      ]);

      // Spies
      const logSpy = jest.spyOn(service.logger, 'log');

      // Start import
      await service.import();

      // Assertions
      expect(
        mockPairLiquidityInfoHistoryErrorDb.getErrorWithinHours,
      ).toHaveBeenCalledTimes(3); // Once for pair and 2 times for each event

      expect(logSpy.mock.calls).toEqual([
        ['Started syncing pair liquidity info history.'],
        ['Syncing liquidity info history for 1 pairs.'],
        [
          `Skipped log with block hash ${contractLog1.block_hash} tx hash ${contractLog1.call_tx_hash} and log index ${contractLog1.log_idx} due to recent error.`,
        ],
        [
          `Completed sync for pair ${pair.id} ${pair.address}. Synced 1 log(s).`,
        ],
        ['Finished liquidity info history sync for all pairs.'],
      ]);

      expect(mockPairLiquidityInfoHistoryDb.upsert.mock.calls).toEqual([
        [
          {
            pairId: pair.id,
            eventType: EventType.SwapTokens,
            reserve0: bigIntToDecimal(201n),
            reserve1: bigIntToDecimal(199n),
            deltaReserve0: bigIntToDecimal(1n),
            deltaReserve1: bigIntToDecimal(-1n),
            fiatPrice: bigIntToDecimal(0n),
            height: parseInt(contractLog5.height),
            microBlockHash: contractLog5.block_hash,
            microBlockTime: BigInt(contractLog5.block_time),
            transactionHash: contractLog5.call_tx_hash,
            transactionIndex: BigInt(contractLog5.call_txi),
            logIndex: parseInt(contractLog5.log_idx),
          },
        ],
      ]);
    });

    it('should catch and insert an error on pair level', async () => {
      const error = {
        pairId: pair.id,
        microBlockHash: '',
        transactionHash: '',
        logIndex: -1,
        error: 'Error: error',
      };

      // Mock functions
      mockPairDb.getAll.mockResolvedValue([pair]);
      mockPairLiquidityInfoHistoryErrorDb.getErrorWithinHours.mockResolvedValue(
        undefined,
      );
      mockPairLiquidityInfoHistoryDb.getLastlySyncedLogByPairId.mockResolvedValue(
        {},
      );
      mockMdwClientService.getContractLogsUntilCondition.mockRejectedValue(
        new Error('error'),
      );
      mockPairLiquidityInfoHistoryErrorDb.upsert.mockResolvedValue(null);

      // Spies
      const logSpy = jest.spyOn(service.logger, 'log');
      const errorSpy = jest.spyOn(service.logger, 'error');

      // Start import
      await service.import();

      // Assertions
      expect(mockPairLiquidityInfoHistoryErrorDb.upsert).toHaveBeenCalledWith(
        error,
      );

      expect(logSpy.mock.calls).toEqual([
        ['Started syncing pair liquidity info history.'],
        ['Syncing liquidity info history for 1 pairs.'],
        ['Finished liquidity info history sync for all pairs.'],
      ]);

      expect(errorSpy.mock.calls).toEqual([
        [`Skipped pair. ${JSON.stringify(error)}`],
      ]);
    });

    it('should catch and insert an error on log level', async () => {
      const error = {
        pairId: pair.id,
        microBlockHash: contractLog3.block_hash,
        transactionHash: contractLog3.call_tx_hash,
        logIndex: parseInt(contractLog3.log_idx),
        error: 'Error: error',
      };

      // Mock functions
      mockPairDb.getAll.mockResolvedValue([pair]);
      mockPairLiquidityInfoHistoryErrorDb.getErrorWithinHours.mockResolvedValue(
        undefined,
      );
      mockPairLiquidityInfoHistoryDb.getLastlySyncedLogByPairId
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('error'))
        .mockRejectedValueOnce(undefined);
      mockMdwClientService.getContractLogsUntilCondition.mockResolvedValue([
        contractLog3,
        contractLog4,
        contractLog5,
      ]);
      mockPairLiquidityInfoHistoryDb.upsert.mockResolvedValue(null);
      mockPairLiquidityInfoHistoryErrorDb.upsert.mockResolvedValue(null);
      const logSpy = jest.spyOn(service.logger, 'log');
      const errorSpy = jest.spyOn(service.logger, 'error');

      // Start import
      await service.import();

      // Assertions
      expect(mockPairLiquidityInfoHistoryErrorDb.upsert).toHaveBeenCalledWith(
        error,
      );

      expect(logSpy.mock.calls).toEqual([
        ['Started syncing pair liquidity info history.'],
        ['Syncing liquidity info history for 1 pairs.'],
        [
          `Completed sync for pair ${pair.id} ${pair.address}. Synced 1 log(s).`,
        ],
        ['Finished liquidity info history sync for all pairs.'],
      ]);

      expect(errorSpy.mock.calls).toEqual([
        [`Skipped log. ${JSON.stringify(error)}`],
      ]);

      expect(mockPairLiquidityInfoHistoryDb.upsert.mock.calls).toEqual([
        [
          {
            pairId: pair.id,
            eventType: EventType.SwapTokens,
            reserve0: bigIntToDecimal(201n),
            reserve1: bigIntToDecimal(199n),
            deltaReserve0: bigIntToDecimal(1n),
            deltaReserve1: bigIntToDecimal(-1n),
            fiatPrice: bigIntToDecimal(0n),
            height: parseInt(contractLog5.height),
            microBlockHash: contractLog5.block_hash,
            microBlockTime: BigInt(contractLog5.block_time),
            transactionHash: contractLog5.call_tx_hash,
            transactionIndex: BigInt(contractLog5.call_txi),
            logIndex: parseInt(contractLog5.log_idx),
          },
        ],
      ]);
    });
  });
});
