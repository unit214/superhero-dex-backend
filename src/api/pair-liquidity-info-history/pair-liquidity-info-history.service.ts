import { Injectable } from '@nestjs/common';
import BigNumber from 'bignumber.js';

import { PairLiquidityInfoHistoryEntry } from '@/api/api.model';
import { PairLiquidityInfoHistoryWithTokens } from '@/api/pair-liquidity-info-history/pair-liquidity-info-history.model';
import { PairLiquidityInfoHistoryDbService } from '@/database/pair-liquidity-info-history/pair-liquidity-info-history-db.service';
import { calculateUsdValue } from '@/lib/utils';

@Injectable()
export class PairLiquidityInfoHistoryService {
  constructor(
    private readonly pairLiquidityInfoHistoryDb: PairLiquidityInfoHistoryDbService,
  ) {}

  getAllHistoryEntries = this.pairLiquidityInfoHistoryDb.getAll;

  mapToEntryWithPrice(
    entry: PairLiquidityInfoHistoryWithTokens,
  ): PairLiquidityInfoHistoryEntry {
    const usdItems: {
      reserve0Usd: string | null;
      reserve1Usd: string | null;
      delta0UsdValue: string | null;
      delta1UsdValue: string | null;
      txUsdFee: string | null;
    } = {
      reserve0Usd: null,
      reserve1Usd: null,
      delta0UsdValue: null,
      delta1UsdValue: null,
      txUsdFee: null,
    };
    const token0AePrice =
      entry.token0AePrice === null || entry.token0AePrice.toString() === '-1'
        ? null
        : entry.token0AePrice?.toString();

    const token1AePrice =
      entry.token1AePrice === null || entry.token1AePrice.toString() === '-1'
        ? null
        : entry.token1AePrice?.toString();

    if (token0AePrice !== null && token1AePrice !== null) {
      usdItems.reserve0Usd = calculateUsdValue({
        reserve: entry.reserve0.toString(),
        tokenAePrice: token0AePrice,
        decimals: entry.pair.token0.decimals,
        aeUsdPrice: entry.aeUsdPrice.toString(),
      });
      usdItems.reserve1Usd = calculateUsdValue({
        reserve: entry.reserve1.toString(),
        tokenAePrice: token1AePrice,
        decimals: entry.pair.token1.decimals,
        aeUsdPrice: entry.aeUsdPrice.toString(),
      });
      usdItems.delta0UsdValue = calculateUsdValue({
        reserve: entry.deltaReserve0.toString(),
        tokenAePrice: token0AePrice,
        decimals: entry.pair.token0.decimals,
        aeUsdPrice: entry.aeUsdPrice.toString(),
      });
      usdItems.delta1UsdValue = calculateUsdValue({
        reserve: entry.deltaReserve1.toString(),
        tokenAePrice: token1AePrice,
        decimals: entry.pair.token1.decimals,
        aeUsdPrice: entry.aeUsdPrice.toString(),
      });
      usdItems.txUsdFee = new BigNumber(usdItems.delta0UsdValue)
        .multipliedBy(0.003)
        .toString();
    }

    return {
      pairAddress: entry.pair.address,
      senderAccount: entry.senderAccount,
      type: entry.eventType,
      reserve0: entry.reserve0.toString(),
      reserve1: entry.reserve1.toString(),
      deltaReserve0: entry.deltaReserve0.toString(),
      deltaReserve1: entry.deltaReserve1.toString(),
      token0AePrice: token0AePrice,
      token1AePrice: token1AePrice,
      aeUsdPrice: entry.aeUsdPrice.toString(),
      height: entry.height,
      microBlockHash: entry.microBlockHash,
      microBlockTime: entry.microBlockTime.toString(),
      transactionHash: entry.transactionHash,
      transactionIndex: entry.transactionIndex.toString(),
      logIndex: entry.logIndex,
      ...usdItems,
    };
  }
}
