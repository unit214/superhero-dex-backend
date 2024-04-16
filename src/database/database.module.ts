import { Module } from '@nestjs/common';

import { PairDbService } from '@/database/pair/pair-db.service';
import { PairLiquidityInfoHistoryDbService } from '@/database/pair-liquidity-info-history/pair-liquidity-info-history-db.service';
import { PairLiquidityInfoHistoryV2DbService } from '@/database/pair-liquidity-info-history/pair-liquidity-info-history-v2-db.service';
import { PairLiquidityInfoHistoryErrorDbService } from '@/database/pair-liquidity-info-history-error/pair-liquidity-info-history-error-db.service';
import { PairLiquidityInfoHistoryV2ErrorDbService } from '@/database/pair-liquidity-info-history-error/pair-liquidity-info-history-v2-error-db.service';
import { PrismaService } from '@/database/prisma.service';
import { TokenDbService } from '@/database/token/token-db.service';

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
