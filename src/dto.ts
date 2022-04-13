export type LiquidityInfo = {
  totalSupply: string;
  reserve0: string;
  reserve1: string;
};
export type Pair = {
  address: string;
  token0: string;
  token1: string;
  synchronized: boolean;
};

export type PairWithLiquidity = Pair & {
  liquidityInfo?: LiquidityInfo;
};

export type Token = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
};

export type TokenWithPairs = Token & {
  pairs: string[];
};
