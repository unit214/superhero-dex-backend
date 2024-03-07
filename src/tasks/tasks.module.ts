import { Module } from '@nestjs/common';
import { PairLiquidityInfoHistoryImporterService } from './pair-liquidity-info-history-importer.service';
import { DatabaseModule } from '../database/database.module';
import { ClientsModule } from '../clients/clients.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PairLiquidityInfoHistoryValidatorService } from './pair-liquidity-info-history-validator.service';

@Module({
  imports: [ClientsModule, DatabaseModule, ScheduleModule.forRoot()],
  providers: [
    PairLiquidityInfoHistoryImporterService,
    PairLiquidityInfoHistoryValidatorService,
  ],
})
export class TasksModule {}
