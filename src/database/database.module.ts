import { Module } from '@nestjs/common';

import { PairDbService } from '@/database/pair/pair-db.service';
import { PairLiquidityInfoHistoryDbService } from '@/database/pair-liquidity-info-history/pair-liquidity-info-history-db.service';
import { PairLiquidityInfoHistoryErrorDbService } from '@/database/pair-liquidity-info-history-error/pair-liquidity-info-history-error-db.service';
import { PrismaService } from '@/database/prisma.service';
import { TokenDbService } from '@/database/token/token-db.service';

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
