import { ApiProperty } from '@nestjs/swagger';

export const contractPattern = 'ct_([1-9a-zA-Z]){49,50}';
export const bigNumberPattern = '[1-9]+';
export const pairAddressPropertyOptions = {
  pattern: contractPattern,
  description: 'Pair contract address',
};
export const tokenAddressPropertyOptions = {
  pattern: contractPattern,
  description: 'Token contract address',
};

export class LiquidityInfo {
  @ApiProperty({
    description: 'Total suplly of Liquidity Tokens',
    pattern: bigNumberPattern,
  })
  totalSupply: string;

  @ApiProperty({
    description: 'Whole reserve of token0 owned by the Pair contract',
    pattern: bigNumberPattern,
  })
  reserve0: string;

  @ApiProperty({
    description: 'Whole reserve of token1 owned by the Pair contract',
    pattern: bigNumberPattern,
  })
  reserve1: string;
}

export class PairBase {
  @ApiProperty(pairAddressPropertyOptions)
  address: string;

  @ApiProperty({
    examples: [true, false],
    description: `When service just started and it is in synchronization process or an error \
occurred regarding this pair, the pair is considered unsynced, therefore the user should not \
take in consideration it's liquidity info as the latest representation`,
  })
  synchronized: boolean;
}

export class Token {
  @ApiProperty({
    pattern: contractPattern,
    description: 'Token contract address',
  })
  address: string;

  @ApiProperty({
    examples: ['WAE', 'FST', 'SND', 'USDT'],
    example: 'WAE',
    description: 'Symbol which represents the token',
  })
  symbol: string;

  @ApiProperty({
    examples: ['Wrapped AE', 'Token-A', 'Token-B', 'Wrapped Theter'],
    example: 'Wrapped AE',
    description: 'Full name of the token',
  })
  name: string;

  @ApiProperty({
    description: 'Total number of decimals represented by the token',
    example: 18,
  })
  decimals: number;
}

export class Pair extends PairBase {
  @ApiProperty({
    pattern: contractPattern,
    description: 'Contract address for the token stored as token0',
  })
  token0: string;

  @ApiProperty({
    pattern: contractPattern,
    description: 'Contract address for the token stored as token1',
  })
  token1: string;
}

const liquidityInfoPropertyOptions = {
  type: LiquidityInfo,
  nullable: true,
  description: `Liquidity pair information. NOTE: between the pair addition moment and the first liquidity fetching \
liquidityInfo will be null. After that it will always have the last fetched values`,
};

class PairWithLiquidity extends PairBase {
  @ApiProperty(liquidityInfoPropertyOptions)
  liquidityInfo?: LiquidityInfo;
}
export class PairWithLiquidityAndTokens extends PairWithLiquidity {
  @ApiProperty({
    description: 'Token stored as token0',
    example: {
      address: 'ct_2ZZwNQnX1XwBdAy9ZAI8cgyJ7ccafB9HbmmXO1shFCNqhl88F',
      symbol: 'WAE',
      name: 'Wrapped AE',
      decimals: 18,
    } as Token,
  })
  token0: Token;

  @ApiProperty({
    description: 'Token stored as token1',
    example: {
      address: 'ct_XWASad6omILdToOPfP58KoLxNnIzkWfIQJmIvHPSuHYZ5NxIjy',
      symbol: 'USDT',
      name: 'Wrapped Theter',
      decimals: 18,
    } as Token,
  })
  token1: Token;
}

export class PairWithLiquidityAndTokenAddresses extends PairWithLiquidity {
  @ApiProperty({
    pattern: contractPattern,
    description: 'Contract address for the token stored as token0',
    example: 'ct_2ZZwNQnX1XwBdAy9ZAI8cgyJ7ccafB9HbmmXO1shFCNqhl88F',
  })
  token0: string;

  @ApiProperty({
    pattern: contractPattern,
    description: 'Contract address for the token stored as token1',
    example: 'ct_XWASad6omILdToOPfP58KoLxNnIzkWfIQJmIvHPSuHYZ5NxIjy',
  })
  token1: string;
}

export class TokenWithListed extends Token {
  @ApiProperty({
    description:
      'Specifies if a token is supported/listed officialy by the DEX or is just added by a random user',
    examples: [true, false],
  })
  listed: boolean;
}

export class TokenWithPairAddresses extends TokenWithListed {
  @ApiProperty({
    description:
      'All pairs addresses in wich a given token takes part (as token0 or as token1)',
    pattern: contractPattern,
  })
  pairs: string[];
}

export class TokenPairWithLiquidityInfo {
  @ApiProperty(pairAddressPropertyOptions)
  address: string;

  @ApiProperty({
    description: 'If pair is synchronized',
    examples: [true, false],
  })
  synchronized: boolean;

  @ApiProperty({ description: 'The other token from pair' })
  oppositeToken: TokenWithListed;

  @ApiProperty(liquidityInfoPropertyOptions)
  liquidityInfo?: LiquidityInfo;
}

export class TokenPairs {
  @ApiProperty({
    type: [TokenPairWithLiquidityInfo],
    description: 'All the pairs which have as token0 the given token',
  })
  pairs0: TokenPairWithLiquidityInfo[];

  @ApiProperty({
    type: [TokenPairWithLiquidityInfo],
    description: 'All the pairs which have as token1 the given token',
  })
  pairs1: TokenPairWithLiquidityInfo[];
}
