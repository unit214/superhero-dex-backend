import { Module } from '@nestjs/common';
import { PairLiquidityInfoHistoryImporterService } from './pair-liquidity-info-history-importer/pair-liquidity-info-history-importer.service';
import { DatabaseModule } from '../database/database.module';
import { ClientsModule } from '../clients/clients.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PairLiquidityInfoHistoryValidatorService } from './pair-liquidity-info-history-validator/pair-liquidity-info-history-validator.service';
import { TasksService } from './tasks.service';
import { PairSyncService } from './pair-sync/pair-sync.service';
import { PairLiquidityInfoHistoryImporterV2Service } from './pair-liquidity-info-history-importer/pair-liquidity-info-history-importer-v2.service';

@Module({
  imports: [ClientsModule, DatabaseModule, ScheduleModule.forRoot()],
  providers: [
    PairLiquidityInfoHistoryImporterService,
    PairLiquidityInfoHistoryImporterV2Service,
    PairLiquidityInfoHistoryValidatorService,
    TasksService,
    PairSyncService,
  ],
})
export class TasksModule {}
