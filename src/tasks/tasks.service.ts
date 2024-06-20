import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PairLiquidityInfoHistoryImporterService } from '@/tasks/pair-liquidity-info-history-importer/pair-liquidity-info-history-importer.service';
import { PairLiquidityInfoHistoryValidatorService } from '@/tasks/pair-liquidity-info-history-validator/pair-liquidity-info-history-validator.service';
import { PairPathCalculatorService } from '@/tasks/pair-path-calculator/pair-path-calculator.service';

const EVERY_5_MINUTES_STARTING_AT_02_30 = '30 2-57/5 * * * *';

@Injectable()
export class TasksService {
  constructor(
    private pairLiquidityInfoHistoryImporterService: PairLiquidityInfoHistoryImporterService,
    private pairLiquidityInfoHistoryValidatorService: PairLiquidityInfoHistoryValidatorService,
    private pairPathCalculatorService: PairPathCalculatorService,
  ) {}

  private _isRunning = false;

  get isRunning(): boolean {
    return this._isRunning;
  }

  setIsRunning(isRunning: boolean): void {
    this._isRunning = isRunning;
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async runPairLiquidityInfoHistoryImporter() {
    try {
      if (!this.isRunning) {
        this.setIsRunning(true);
        await this.pairLiquidityInfoHistoryImporterService.import();
        this.setIsRunning(false);
      }
    } catch (error) {
      this.pairLiquidityInfoHistoryImporterService.logger.error(
        `Import failed. ${error}`,
      );
      this.setIsRunning(false);
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async runPairLiquidityInfoHistoryExchangeRateCalculator() {
    try {
      if (!this.isRunning) {
        this.setIsRunning(true);
        await this.pairPathCalculatorService.sync();
        this.setIsRunning(false);
      }
    } catch (error) {
      console.error(error);
      this.pairPathCalculatorService.logger.error(
        `Path Calculation failed. ${error}`,
      );
      this.setIsRunning(false);
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async runPairLiquidityInfoHistoryValidator() {
    try {
      if (!this.isRunning) {
        this.setIsRunning(true);
        await this.pairLiquidityInfoHistoryValidatorService.validate();
        this.setIsRunning(false);
      }
    } catch (error) {
      this.pairLiquidityInfoHistoryValidatorService.logger.error(
        `Validation failed. ${error}`,
      );
      this.setIsRunning(false);
    }
  }
}
