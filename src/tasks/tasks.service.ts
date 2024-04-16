import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PairLiquidityInfoHistoryImporterService } from '@/tasks/pair-liquidity-info-history-importer/pair-liquidity-info-history-importer.service';
import { PairLiquidityInfoHistoryImporterV2Service } from '@/tasks/pair-liquidity-info-history-importer/pair-liquidity-info-history-importer-v2.service';
import { PairLiquidityInfoHistoryValidatorService } from '@/tasks/pair-liquidity-info-history-validator/pair-liquidity-info-history-validator.service';

const EVERY_5_MINUTES_STARTING_AT_02_30 = '30 2-57/5 * * * *';

@Injectable()
export class TasksService {
  constructor(
    private pairLiquidityInfoHistoryImporterService: PairLiquidityInfoHistoryImporterService,
    private pairLiquidityInfoHistoryImporterV2Service: PairLiquidityInfoHistoryImporterV2Service,
    private pairLiquidityInfoHistoryValidatorService: PairLiquidityInfoHistoryValidatorService,
  ) {}

  private _isRunning = false;

  get isRunning(): boolean {
    return this._isRunning;
  }

  setIsRunning(isRunning: boolean): void {
    this._isRunning = isRunning;
  }

  // @Cron(CronExpression.EVERY_5_MINUTES)
  // async runPairLiquidityInfoHistoryImporter() {
  //   try {
  //     if (!this.isRunning) {
  //       this.setIsRunning(true);
  //       await this.pairLiquidityInfoHistoryImporterService.import();
  //       this.setIsRunning(false);
  //     }
  //   } catch (error) {
  //     this.pairLiquidityInfoHistoryImporterService.logger.error(
  //       `Import failed. ${error}`,
  //     );
  //     this.setIsRunning(false);
  //   }
  // }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async runPairLiquidityInfoHistoryImporterV2() {
    try {
      if (!this.isRunning) {
        this.setIsRunning(true);
        await this.pairLiquidityInfoHistoryImporterV2Service.import();
        this.setIsRunning(false);
      }
    } catch (error) {
      this.pairLiquidityInfoHistoryImporterV2Service.logger.error(
        `Import failed. ${error}`,
      );
      this.setIsRunning(false);
    }
  }

  @Cron(EVERY_5_MINUTES_STARTING_AT_02_30)
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
