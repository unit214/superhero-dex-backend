import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { ClientsModule } from '@/clients/clients.module';
import { DatabaseModule } from '@/database/database.module';
import { PairLiquidityInfoHistoryImporterService } from '@/tasks/pair-liquidity-info-history-importer/pair-liquidity-info-history-importer.service';
import { PairLiquidityInfoHistoryImporterV2Service } from '@/tasks/pair-liquidity-info-history-importer/pair-liquidity-info-history-importer-v2.service';
import { PairLiquidityInfoHistoryValidatorService } from '@/tasks/pair-liquidity-info-history-validator/pair-liquidity-info-history-validator.service';
import { PairLiquidityInfoHistoryValidatorV2Service } from '@/tasks/pair-liquidity-info-history-validator/pair-liquidity-info-history-validator-v2.service';
import { PairSyncService } from '@/tasks/pair-sync/pair-sync.service';
import { TasksService } from '@/tasks/tasks.service';

@Module({
  imports: [ClientsModule, DatabaseModule, ScheduleModule.forRoot()],
  providers: [
    PairLiquidityInfoHistoryImporterService,
    PairLiquidityInfoHistoryImporterV2Service,
    PairLiquidityInfoHistoryValidatorService,
    PairLiquidityInfoHistoryValidatorV2Service,
    TasksService,
    PairSyncService,
  ],
})
export class TasksModule {}
