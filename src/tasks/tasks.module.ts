import { Module } from '@nestjs/common';
import { PairLiquidityInfoHistoryImporterService } from './pair-liquidity-info-history-importer.service';
import { DatabaseModule } from '../database/database.module';
import { ClientsModule } from '../clients/clients.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ClientsModule, DatabaseModule, ScheduleModule.forRoot()],
  providers: [PairLiquidityInfoHistoryImporterService],
})
export class TasksModule {}
