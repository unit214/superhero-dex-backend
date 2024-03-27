import { Injectable } from '@nestjs/common';
import { PairLiquidityInfoHistoryDbService } from '../../database/pair-liquidity-info-history/pair-liquidity-info-history-db.service';
import { Pair, PairLiquidityInfoHistory } from '@prisma/client';
import { OrderQueryEnum } from '../../dto';

import { ContractAddress } from '../../clients/sdk-client.model';

@Injectable()
export class PairLiquidityInfoHistoryService {
  constructor(
    private readonly pairLiquidityInfoHistoryDb: PairLiquidityInfoHistoryDbService,
  ) {}
  getAllHistoryEntries(
    limit: number,
    offset: number,
    order: OrderQueryEnum,
    pairAddress?: ContractAddress,
    height?: number,
    fromBlockTime?: bigint,
    toBlockTime?: bigint,
  ): Promise<({ pair: Pair } & PairLiquidityInfoHistory)[]> {
    return this.pairLiquidityInfoHistoryDb.getAll(
      limit,
      offset,
      order,
      pairAddress,
      height,
      fromBlockTime,
      toBlockTime,
    );
  }
}
