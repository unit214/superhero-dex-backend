import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PairDbService } from './pair-db.service';
import { PairLiquidityInfoHistoryDbService } from './pair-liquidity-info-history-db.service';
import { PairLiquidityInfoHistoryErrorDbService } from './pair-liquidity-info-history-error-db.service';

@Module({
  providers: [
    PrismaService,
    PairDbService,
    PairLiquidityInfoHistoryDbService,
    PairLiquidityInfoHistoryErrorDbService,
  ],
  exports: [
    PairDbService,
    PairLiquidityInfoHistoryDbService,
    PairLiquidityInfoHistoryErrorDbService,
  ],
})
export class DatabaseModule {}
