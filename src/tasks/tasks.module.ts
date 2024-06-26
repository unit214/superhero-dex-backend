import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { ClientsModule } from '@/clients/clients.module';
import { DatabaseModule } from '@/database/database.module';
import { PairLiquidityInfoHistoryImporterService } from '@/tasks/pair-liquidity-info-history-importer/pair-liquidity-info-history-importer.service';
import { PairLiquidityInfoHistoryValidatorService } from '@/tasks/pair-liquidity-info-history-validator/pair-liquidity-info-history-validator.service';
import { PairPathCalculatorService } from '@/tasks/pair-path-calculator/pair-path-calculator.service';
import { PairSyncService } from '@/tasks/pair-sync/pair-sync.service';
import { TasksService } from '@/tasks/tasks.service';

@Module({
  imports: [ClientsModule, DatabaseModule, ScheduleModule.forRoot()],
  providers: [
    PairLiquidityInfoHistoryImporterService,
    PairLiquidityInfoHistoryValidatorService,
    PairPathCalculatorService,
    TasksService,
    PairSyncService,
  ],
})
export class TasksModule {}
