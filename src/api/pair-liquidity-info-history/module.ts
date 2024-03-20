import { Module } from '@nestjs/common';
import { PairLiquidityInfoHistoryService } from './service';
import { PairLiquidityInfoHistoryController } from './controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PairLiquidityInfoHistoryController],
  providers: [PairLiquidityInfoHistoryService],
})
export class PairLiquidityInfoHistoryModule {}
