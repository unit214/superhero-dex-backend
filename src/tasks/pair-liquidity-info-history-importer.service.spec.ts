import { PairLiquidityInfoHistoryImporterService } from './pair-liquidity-info-history-importer.service';
import { Test, TestingModule } from '@nestjs/testing';
import { MdwClientService } from '../clients/mdw-client.service';
import { PairService } from '../database/pair.service';
import { PairLiquidityInfoHistoryService } from '../database/pair-liquidity-info-history.service';
import { PairLiquidityInfoHistoryErrorService } from '../database/pair-liquidity-info-history-error.service';
import { ContractAddress } from '../lib/utils';
import { Contract } from '../clients/mdw-client.model';

const mockMdwClientService = {
  getContract: jest.fn(),
  getMicroBlock: jest.fn(),
  getContractLogsUntilCondition: jest.fn(),
  getContractBalancesAtMicroBlockHash: jest.fn(),
  getAccountBalanceForContractAtMicroBlockHash: jest.fn(),
};

const mockPairService = {
  getAll: jest.fn(),
};

const mockPairLiquidityInfoHistoryService = {
  getLastlySyncedBlockByPairId: jest.fn(),
  upsert: jest.fn(),
};

const mockPairLiquidityInfoHistoryErrorService = {
  getErrorByPairIdAndMicroBlockHashWithinHours: jest.fn(),
};

describe('PairLiquidityInfoHistoryImporterService', () => {
  let service: PairLiquidityInfoHistoryImporterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PairLiquidityInfoHistoryImporterService,
        { provide: MdwClientService, useValue: mockMdwClientService },
        { provide: PairService, useValue: mockPairService },
        {
          provide: PairLiquidityInfoHistoryService,
          useValue: mockPairLiquidityInfoHistoryService,
        },
        {
          provide: PairLiquidityInfoHistoryErrorService,
          useValue: mockPairLiquidityInfoHistoryErrorService,
        },
      ],
    }).compile();
    service = module.get<PairLiquidityInfoHistoryImporterService>(
      PairLiquidityInfoHistoryImporterService,
    );
  });

  describe('import', () => {
    it('should import liquidity correctly', async () => {
      // Mock data
      const pair1 = {
        id: 1,
        address: 'ct_pair' as ContractAddress,
        token0: { address: 'ct_token0' },
        token1: { address: 'ct_token1' },
      };
      const pair1Contract: Contract = {
        aexn_type: '',
        block_hash: 'mh_hash0',
        contract: pair1.address,
        source_tx_hash: 'th_',
        source_tx_type: '',
        create_tx: {},
      };
      const initialMicroBlock = {
        hash: pair1Contract.block_hash,
        height: '10000',
        time: '1000000000000',
      };
      const pairContractLog1 = {
        block_time: '1000000000001',
        block_hash: 'mh_hash1',
        height: '10001',
      };
      const pairContractLog2 = {
        block_time: '1000000000002',
        block_hash: 'mh_hash2',
        height: '10002',
      };

      // Mock functions
      mockPairService.getAll.mockResolvedValue([pair1]);
      mockPairLiquidityInfoHistoryErrorService.getErrorByPairIdAndMicroBlockHashWithinHours.mockResolvedValue(
        undefined,
      );
      mockPairLiquidityInfoHistoryService.getLastlySyncedBlockByPairId.mockReturnValue(
        undefined,
      );
      mockMdwClientService.getContract.mockResolvedValue(pair1Contract);
      mockMdwClientService.getMicroBlock.mockResolvedValue(initialMicroBlock);
      mockPairLiquidityInfoHistoryService.upsert.mockResolvedValue(null);
      mockMdwClientService.getContractLogsUntilCondition.mockResolvedValue([
        pairContractLog1,
        pairContractLog2,
      ]);
      mockMdwClientService.getContractBalancesAtMicroBlockHash.mockResolvedValue(
        [{ amount: '1' }, { amount: '1' }],
      );
      mockMdwClientService.getAccountBalanceForContractAtMicroBlockHash.mockResolvedValue(
        { amount: '1' },
      );
      jest.spyOn(service.logger, 'log');

      // Start import
      await service.import();

      // Assertions
      // Insert initial liquidity
      expect(mockPairLiquidityInfoHistoryService.upsert).toHaveBeenCalledWith({
        pairId: pair1.id,
        totalSupply: '0',
        reserve0: '0',
        reserve1: '0',
        height: parseInt(initialMicroBlock.height),
        microBlockHash: initialMicroBlock.hash,
        microBlockTime: BigInt(initialMicroBlock.time),
      });
      expect(
        mockPairLiquidityInfoHistoryErrorService.getErrorByPairIdAndMicroBlockHashWithinHours,
      ).toHaveBeenCalledTimes(3);
      expect(service.logger.log).toHaveBeenCalledWith(
        `Started syncing pair ${pair1.id} ${pair1.address}. Need to sync 2 micro block(s). This can take some time.`,
      );
      expect(mockPairLiquidityInfoHistoryService.upsert).toHaveBeenCalledWith({
        pairId: pair1.id,
        totalSupply: '2',
        reserve0: '1',
        reserve1: '1',
        height: parseInt(pairContractLog1.height),
        microBlockHash: pairContractLog1.block_hash,
        microBlockTime: BigInt(pairContractLog1.block_time),
      });
      expect(mockPairLiquidityInfoHistoryService.upsert).toHaveBeenCalledWith({
        pairId: pair1.id,
        totalSupply: '2',
        reserve0: '1',
        reserve1: '1',
        height: parseInt(pairContractLog2.height),
        microBlockHash: pairContractLog2.block_hash,
        microBlockTime: BigInt(pairContractLog2.block_time),
      });
      expect(service.logger.log).toHaveBeenCalledWith(
        `Completed sync for pair ${pair1.id} ${pair1.address}. Synced 2 micro block(s).`,
      );
      expect(service.logger.log).toHaveBeenCalledWith(
        'Finished liquidity info history sync for all pairs.',
      );
    });
  });
});
