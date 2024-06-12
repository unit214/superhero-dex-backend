import { Injectable } from '@nestjs/common';
import { Pair, PairLiquidityInfoHistory, Token } from '@prisma/client';

import { OrderQueryEnum } from '@/api/api.model';
import { ContractAddress } from '@/clients/sdk-client.model';
import { PairLiquidityInfoHistoryDbService } from '@/database/pair-liquidity-info-history/pair-liquidity-info-history-db.service';

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
  ): Promise<
    ({
      pair: Pair & { token0: Token; token1: Token };
    } & PairLiquidityInfoHistory)[]
  > {
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
