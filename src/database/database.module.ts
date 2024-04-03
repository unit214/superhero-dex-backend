import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PairDbService } from './pair/pair-db.service';
import { PairLiquidityInfoHistoryDbService } from './pair-liquidity-info-history/pair-liquidity-info-history-db.service';
import { PairLiquidityInfoHistoryErrorDbService } from './pair-liquidity-info-history-error/pair-liquidity-info-history-error-db.service';
import { TokenDbService } from './token/token-db.service';
import { PairLiquidityInfoHistoryV2DbService } from './pair-liquidity-info-history/pair-liquidity-info-history-v2-db.service';
import { PairLiquidityInfoHistoryV2ErrorDbService } from './pair-liquidity-info-history-error/pair-liquidity-info-history-v2-error-db.service';

@Module({
  providers: [
    PrismaService,
    PairDbService,
    PairLiquidityInfoHistoryDbService,
    PairLiquidityInfoHistoryErrorDbService,
    PairLiquidityInfoHistoryV2DbService,
    PairLiquidityInfoHistoryV2ErrorDbService,
    TokenDbService,
  ],
  exports: [
    PairDbService,
    PairLiquidityInfoHistoryDbService,
    PairLiquidityInfoHistoryErrorDbService,
    PairLiquidityInfoHistoryV2DbService,
    PairLiquidityInfoHistoryV2ErrorDbService,
    TokenDbService,
  ],
})
export class DatabaseModule {}
