import { Pair, PairLiquidityInfoHistory, Token } from '@prisma/client';

export type PairLiquidityInfoHistoryWithTokens = {
  pair: Pair & { token0: Token; token1: Token };
} & PairLiquidityInfoHistory;
