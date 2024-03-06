import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PairService } from './pair.service';
import { PairLiquidityInfoHistoryService } from './pair-liquidity-info-history.service';
import { PairLiquidityInfoHistoryErrorService } from './pair-liquidity-info-history-error.service';
@Module({
  providers: [
    PrismaService,
    PairService,
    PairLiquidityInfoHistoryService,
    PairLiquidityInfoHistoryErrorService,
  ],
  exports: [
    PairService,
    PairLiquidityInfoHistoryService,
    PairLiquidityInfoHistoryErrorService,
  ],
})
export class DatabaseModule {}
