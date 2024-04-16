import { Module } from '@nestjs/common';

import { PairLiquidityInfoHistoryController } from '@/api/pair-liquidity-info-history/pair-liquidity-info-history.controller';
import { PairLiquidityInfoHistoryService } from '@/api/pair-liquidity-info-history/pair-liquidity-info-history.service';
import { PairsController } from '@/api/pairs/pairs.controller';
import { PairsService } from '@/api/pairs/pairs.service';
import { TokensController } from '@/api/tokens/tokens.controller';
import { TokensService } from '@/api/tokens/tokens.service';
import { DatabaseModule } from '@/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [
    PairLiquidityInfoHistoryController,
    PairsController,
    TokensController,
  ],
  providers: [PairLiquidityInfoHistoryService, PairsService, TokensService],
})
export class ApiModule {}
