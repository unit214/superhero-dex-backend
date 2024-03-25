import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PairDbService } from './pair/pair-db.service';
import { PairLiquidityInfoHistoryDbService } from './pair-liquidity-info-history/pair-liquidity-info-history-db.service';
import { PairLiquidityInfoHistoryErrorDbService } from './pair-liquidity-info-history-error/pair-liquidity-info-history-error-db.service';
import { TokenDbService } from './token/token-db.service';

@Module({
  providers: [
    PrismaService,
    PairDbService,
    PairLiquidityInfoHistoryDbService,
    PairLiquidityInfoHistoryErrorDbService,
    TokenDbService,
  ],
  exports: [
    PairDbService,
    PairLiquidityInfoHistoryDbService,
    PairLiquidityInfoHistoryErrorDbService,
    TokenDbService,
  ],
})
export class DatabaseModule {}
