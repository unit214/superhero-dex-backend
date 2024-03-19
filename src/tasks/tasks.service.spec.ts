import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PairLiquidityInfoHistoryImporterService } from './pair-liquidity-info-history-importer.service';
import { PairLiquidityInfoHistoryValidatorService } from './pair-liquidity-info-history-validator.service';
import { MdwClientService } from '../clients/mdw-client.service';
import { PairService } from '../database/pair.service';
import { PairLiquidityInfoHistoryService } from '../database/pair-liquidity-info-history.service';
import { PairLiquidityInfoHistoryErrorService } from '../database/pair-liquidity-info-history-error.service';
import { PrismaService } from '../database/prisma.service';

describe('TasksService', () => {
  let tasksService: TasksService;
  let pairLiquidityInfoHistoryImporterService: PairLiquidityInfoHistoryImporterService;
  let pairLiquidityInfoHistoryValidatorService: PairLiquidityInfoHistoryValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        PairLiquidityInfoHistoryImporterService,
        PairLiquidityInfoHistoryValidatorService,
        MdwClientService,
        PairService,
        PairLiquidityInfoHistoryService,
        PairLiquidityInfoHistoryErrorService,
        PrismaService,
      ],
    }).compile();

    tasksService = module.get<TasksService>(TasksService);
    pairLiquidityInfoHistoryImporterService =
      module.get<PairLiquidityInfoHistoryImporterService>(
        PairLiquidityInfoHistoryImporterService,
      );
    pairLiquidityInfoHistoryValidatorService =
      module.get<PairLiquidityInfoHistoryValidatorService>(
        PairLiquidityInfoHistoryValidatorService,
      );
  });

  describe('runPairLiquidityInfoHistoryImporter', () => {
    it('should run if no task is running', async () => {
      jest
        .spyOn(pairLiquidityInfoHistoryImporterService, 'import')
        .mockResolvedValue();

      await tasksService.runPairLiquidityInfoHistoryImporter();
      expect(pairLiquidityInfoHistoryImporterService.import).toHaveBeenCalled();
      expect(tasksService.isRunning).toBe(false);
    });

    it('should not run if a task is running already', async () => {
      tasksService.setIsRunning(true);
      jest.spyOn(pairLiquidityInfoHistoryImporterService, 'import');
      await tasksService.runPairLiquidityInfoHistoryImporter();
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

      await tasksService.runPairLiquidityInfoHistoryImporter();
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

      await tasksService.runPairLiquidityInfoHistoryValidator();
      expect(
        pairLiquidityInfoHistoryValidatorService.validate,
      ).toHaveBeenCalled();
    });

    it('should not run if a task is running already', async () => {
      tasksService.setIsRunning(true);

      jest.spyOn(pairLiquidityInfoHistoryValidatorService, 'validate');

      await tasksService.runPairLiquidityInfoHistoryValidator();
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

      await tasksService.runPairLiquidityInfoHistoryValidator();
      expect(
        pairLiquidityInfoHistoryValidatorService.logger.error,
      ).toHaveBeenCalledWith(`Validation failed. ${error}`);
      expect(tasksService.isRunning).toBe(false);
    });
  });
});