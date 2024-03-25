import { Module } from '@nestjs/common';
import { PairLiquidityInfoHistoryService } from './pair-liquidity-info-history.service';
import { PairLiquidityInfoHistoryController } from './pair-liquidity-info-history.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PairLiquidityInfoHistoryController],
  providers: [PairLiquidityInfoHistoryService],
})
export class PairLiquidityInfoHistoryModule {}
