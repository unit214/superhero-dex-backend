import { Injectable } from '@nestjs/common';

import { PairLiquidityInfoHistoryDbService } from '@/database/pair-liquidity-info-history/pair-liquidity-info-history-db.service';

@Injectable()
export class PairLiquidityInfoHistoryService {
  constructor(
    private readonly pairLiquidityInfoHistoryDb: PairLiquidityInfoHistoryDbService,
  ) {}

  getAllHistoryEntries = this.pairLiquidityInfoHistoryDb.getAll;
}
