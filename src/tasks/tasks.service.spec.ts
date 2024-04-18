import { Test, TestingModule } from '@nestjs/testing';

import { MdwHttpClientService } from '@/clients/mdw-http-client.service';
import { SdkClientService } from '@/clients/sdk-client.service';
import { PairDbService } from '@/database/pair/pair-db.service';
import { PairLiquidityInfoHistoryDbService } from '@/database/pair-liquidity-info-history/pair-liquidity-info-history-db.service';
import { PairLiquidityInfoHistoryV2DbService } from '@/database/pair-liquidity-info-history/pair-liquidity-info-history-v2-db.service';
import { PairLiquidityInfoHistoryErrorDbService } from '@/database/pair-liquidity-info-history-error/pair-liquidity-info-history-error-db.service';
import { PairLiquidityInfoHistoryV2ErrorDbService } from '@/database/pair-liquidity-info-history-error/pair-liquidity-info-history-v2-error-db.service';
import { PrismaService } from '@/database/prisma.service';
import { PairLiquidityInfoHistoryImporterService } from '@/tasks/pair-liquidity-info-history-importer/pair-liquidity-info-history-importer.service';
import { PairLiquidityInfoHistoryImporterV2Service } from '@/tasks/pair-liquidity-info-history-importer/pair-liquidity-info-history-importer-v2.service';
import { PairLiquidityInfoHistoryValidatorService } from '@/tasks/pair-liquidity-info-history-validator/pair-liquidity-info-history-validator.service';
import { PairLiquidityInfoHistoryValidatorV2Service } from '@/tasks/pair-liquidity-info-history-validator/pair-liquidity-info-history-validator-v2.service';
import { TasksService } from '@/tasks/tasks.service';

describe('TasksService', () => {
  let tasksService: TasksService;
  let pairLiquidityInfoHistoryImporterService: PairLiquidityInfoHistoryImporterV2Service;
  let pairLiquidityInfoHistoryValidatorService: PairLiquidityInfoHistoryValidatorV2Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        PairLiquidityInfoHistoryImporterService,
        PairLiquidityInfoHistoryImporterV2Service,
        PairLiquidityInfoHistoryValidatorService,
        PairLiquidityInfoHistoryValidatorV2Service,
        MdwHttpClientService,
        SdkClientService,
        PairDbService,
        PairLiquidityInfoHistoryDbService,
        PairLiquidityInfoHistoryV2DbService,
        PairLiquidityInfoHistoryErrorDbService,
        PairLiquidityInfoHistoryV2ErrorDbService,
        PrismaService,
      ],
    }).compile();

    tasksService = module.get<TasksService>(TasksService);
    pairLiquidityInfoHistoryImporterService =
      module.get<PairLiquidityInfoHistoryImporterV2Service>(
        PairLiquidityInfoHistoryImporterV2Service,
      );
    pairLiquidityInfoHistoryValidatorService =
      module.get<PairLiquidityInfoHistoryValidatorV2Service>(
        PairLiquidityInfoHistoryValidatorV2Service,
      );
  });

  describe('runPairLiquidityInfoHistoryImporter', () => {
    it('should run if no task is running', async () => {
      jest
        .spyOn(pairLiquidityInfoHistoryImporterService, 'import')
        .mockResolvedValue();

      await tasksService.runPairLiquidityInfoHistoryImporterV2();
      expect(pairLiquidityInfoHistoryImporterService.import).toHaveBeenCalled();
      expect(tasksService.isRunning).toBe(false);
    });

    it('should not run if a task is running already', async () => {
      tasksService.setIsRunning(true);
      jest.spyOn(pairLiquidityInfoHistoryImporterService, 'import');
      await tasksService.runPairLiquidityInfoHistoryImporterV2();
      expect(
        pairLiquidityInfoHistoryImporterService.import,
      ).not.toHaveBeenCalled();
    });

    it('should handle error correctly', async () => {
      const error = new Error('Test Error');
      jest
        .spyOn(pairLiquidityInfoHistoryImporterService, 'import')
        .mockRejectedValue(error);
      jest.spyOn(pairLiquidityInfoHistoryImporterService.logger, 'error');

      await tasksService.runPairLiquidityInfoHistoryImporterV2();
      expect(
        pairLiquidityInfoHistoryImporterService.logger.error,
      ).toHaveBeenCalledWith(`Import failed. ${error}`);
      expect(tasksService.isRunning).toBe(false);
    });
  });

  describe('runPairLiquidityInfoHistoryValidator', () => {
    it('should run if no task is running', async () => {
      jest
        .spyOn(pairLiquidityInfoHistoryValidatorService, 'validate')
        .mockResolvedValue();

      await tasksService.runPairLiquidityInfoHistoryValidatorV2();
      expect(
        pairLiquidityInfoHistoryValidatorService.validate,
      ).toHaveBeenCalled();
    });

    it('should not run if a task is running already', async () => {
      tasksService.setIsRunning(true);

      jest.spyOn(pairLiquidityInfoHistoryValidatorService, 'validate');

      await tasksService.runPairLiquidityInfoHistoryValidatorV2();
      expect(
        pairLiquidityInfoHistoryValidatorService.validate,
      ).not.toHaveBeenCalled();
    });

    it('should handle error correctly', async () => {
      const error = new Error('Test Error');
      jest
        .spyOn(pairLiquidityInfoHistoryValidatorService, 'validate')
        .mockRejectedValue(error);
      jest.spyOn(pairLiquidityInfoHistoryValidatorService.logger, 'error');

      await tasksService.runPairLiquidityInfoHistoryValidatorV2();
      expect(
        pairLiquidityInfoHistoryValidatorService.logger.error,
      ).toHaveBeenCalledWith(`Validation failed. ${error}`);
      expect(tasksService.isRunning).toBe(false);
    });
  });
});
