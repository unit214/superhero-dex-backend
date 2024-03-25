import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PairLiquidityInfoHistoryController } from './pair-liquidity-info-history/pair-liquidity-info-history.controller';
import { PairLiquidityInfoHistoryService } from './pair-liquidity-info-history/pair-liquidity-info-history.service';
import { PairsController } from './pairs/pairs.controller';
import { TokensController } from './tokens/tokens.controller';
import { PairsService } from './pairs/pairs.service';
import { TokensService } from './tokens/tokens.service';

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
