import { Module } from '@nestjs/common';
import { PairLiquidityInfoHistoryImporterService } from './pair-liquidity-info-history-importer.service';
import { DatabaseModule } from '../database/database.module';
import { MdwClientModule } from '../clients/mdw/mdw-client.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [MdwClientModule, DatabaseModule, ScheduleModule.forRoot()],
  providers: [PairLiquidityInfoHistoryImporterService],
})
export class TasksModule {}
