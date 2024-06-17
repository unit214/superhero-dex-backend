import { ApiProperty } from '@nestjs/swagger';

export const contractPattern =
  'ct_([23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz]){49,50}';
export const transactionPattern =
  'th_([23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz]){49,50}';
export const accountPattern =
  'ak_([23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz]){49,50}';
export const bigNumberPattern = '[1-9]+';
export const microBlockTimePattern = '[1-9]{13}';
export const microBlockHashPattern =
  'mh_([23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz]){49,50}';

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
    description: 'Total supply of Liquidity Tokens',
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
    description: `Total number of decimals represented by the token. \
If the token is marked as malformed or no contract was found decimals will be \`-1\``,
    example: 18,
  })
  decimals: number;

  @ApiProperty({
    description:
      "`true` in token meta-info (name/symbol/decimals/) could not be retrieved or doesn't follow AEX9 specifications",
    example: false,
  })
  malformed: boolean;

  @ApiProperty({
    description:
      '`true` if there is no contract deployed at the specified address',
    example: false,
  })
  noContract: boolean;

  @ApiProperty({
    description: 'Price of the token in USD',
    pattern: bigNumberPattern,
  })
  priceUsd: string;

  @ApiProperty({
    description: 'Price change in percent',
    example: {
      day: '0',
      week: '0',
    },
  })
  priceChange: {
    day: string;
    week: string;
  };

  @ApiProperty({
    description: 'Fully diluted valuation in USD',
    pattern: bigNumberPattern,
  })
  fdvUsd: string;

  @ApiProperty({
    description: 'Volume in USD',
    example: {
      day: '0',
      week: '0',
    },
  })
  volumeUsd: {
    day: string;
    week: string;
  };
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

  @ApiProperty({
    description: 'How many transactions were made in the pair',
    example: 0,
  })
  transactions: number;

  @ApiProperty({
    description: 'Total Value Locked in USD',
    pattern: bigNumberPattern,
  })
  tvlUsd: string;

  @ApiProperty({
    description: 'Volume in USD',
    example: {
      day: '0',
      week: '0',
    },
  })
  volumeUsd: {
    day: string;
    week: string;
  };
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
      address:
        process.env.DOC_TOKEN1 ||
        'ct_b7FZHQzBcAW4r43ECWpV3qQJMQJp5BxkZUGNKrqqLyjVRN3SC',
      symbol: 'WAE',
      name: 'Wrapped AE',
      decimals: 18,
    } as Token,
  })
  token0: Token;

  @ApiProperty({
    description: 'Token stored as token1',
    example: {
      address:
        process.env.DOC_TOKEN2 ||
        'ct_JDp175ruWd7mQggeHewSLS1PFXt9AzThCDaFedxon8mF8xTRF',
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
    example:
      process.env.DOC_TOKEN1 ||
      'ct_b7FZHQzBcAW4r43ECWpV3qQJMQJp5BxkZUGNKrqqLyjVRN3SC',
  })
  token0: string;

  @ApiProperty({
    pattern: contractPattern,
    description: 'Contract address for the token stored as token1',
    example:
      process.env.DOC_TOKEN2 ||
      'ct_JDp175ruWd7mQggeHewSLS1PFXt9AzThCDaFedxon8mF8xTRF',
  })
  token1: string;
}

export class TokenWithListed extends Token {
  @ApiProperty({
    description:
      'Specifies if a token is supported/listed officially by the DEX or is just added by a random user',
    examples: [true, false],
  })
  listed: boolean;
}

export class TokenWithPairAddresses extends TokenWithListed {
  @ApiProperty({
    description:
      'All pairs addresses in which a given token takes part (as token0 or as token1)',
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

export class GlobalState {
  @ApiProperty({
    description: 'Maximum block-height found in liquidity-info',
    example: 598149,
  })
  topBlockHeight: number | null;

  @ApiProperty({
    description: 'How many pairs are synced (in percent)',
    example: 25.5,
  })
  pairsSyncedPercent: number;

  @ApiProperty({
    description: 'Total number of tokens',
    example: 7,
  })
  tokens: number;

  @ApiProperty({
    description: 'How many tokens are officially listed',
    example: 4,
  })
  listedTokens: number;

  @ApiProperty({
    description: 'Total number of pairs',
    example: 16,
  })
  pairs: number;

  @ApiProperty({
    description:
      'How many pairs contains only officially listed tokens (token0 & token1)',
    example: 7,
  })
  listedPairs: number;
}

export enum OrderQueryEnum {
  asc = 'asc',
  desc = 'desc',
}

class EventTypeEnum {
  static readonly CreatePair = 'CreatePair';
  static readonly PairMint = 'PairMint';
  static readonly PairBurn = 'PairBurn';
  static readonly SwapTokens = 'SwapTokens';
}

export class PairLiquidityInfoHistoryEntry {
  @ApiProperty({
    description: 'Pair Address of the history entry',
    pattern: contractPattern,
  })
  pairAddress: string;
  @ApiProperty({ description: 'Type of the event' })
  type: EventTypeEnum;

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

  @ApiProperty({
    description: 'Change in reserve0',
    pattern: bigNumberPattern,
  })
  deltaReserve0: string;

  @ApiProperty({
    description: 'Change in reserve1',
    pattern: bigNumberPattern,
  })
  deltaReserve1: string;

  @ApiProperty({
    description: 'Exchange rate of token0 to AE',
    pattern: bigNumberPattern,
  })
  token0AePrice: string | null;

  @ApiProperty({
    description: 'Exchange rate of token1 to AE',
    pattern: bigNumberPattern,
  })
  token1AePrice: string | null;

  @ApiProperty({
    description: 'Price of AE in USD',
  })
  aeUsdPrice: string;

  @ApiProperty({
    description: 'Block height of the history entry',
  })
  height: number;

  @ApiProperty({
    description: 'Micro block hash of the history entry',
    pattern: microBlockHashPattern,
  })
  microBlockHash: string;

  @ApiProperty({
    description: 'Micro block time of the history entry',
    pattern: microBlockTimePattern,
  })
  microBlockTime: string;

  @ApiProperty({
    description: 'Transaction hash of the history entry',
    pattern: transactionPattern,
    example: 'th_JQzjTGpZGBtNtXMH1vYLwB1X2B6zUSLr6AfoQtgM6zQfXue4E',
  })
  transactionHash: string;

  @ApiProperty({
    description: 'Transaction index of the history entry',
    example: '0',
  })
  transactionIndex: string;

  @ApiProperty({
    description: 'Log index of the history entry',
    example: 0,
  })
  logIndex: number;

  @ApiProperty({
    description: 'Account that sent the transaction',
    pattern: accountPattern,
    example: 'ak_JQzjTGpZGBtNtXMH1vYLwB1X2B6zUSLr6AfoQtgM6zQfXue4E',
  })
  senderAccount: string;

  @ApiProperty({
    description: 'USD value of the reserve of token 0 of the pair',
    pattern: bigNumberPattern,
  })
  reserve0Usd: string | null;

  @ApiProperty({
    description: 'USD value of the reserve of token 1 of the pair',
    pattern: bigNumberPattern,
  })
  reserve1Usd: string | null;

  @ApiProperty({
    description: 'USD value of the transaction of token 0 of the pair',
    pattern: bigNumberPattern,
  })
  delta0UsdValue: string | null;

  @ApiProperty({
    description: 'USD value of the transaction of token 1 of the pair',
    pattern: bigNumberPattern,
  })
  delta1UsdValue: string | null;

  @ApiProperty({
    description: 'USD value of the pool fee',
    pattern: bigNumberPattern,
  })
  txUsdFee: string | null;
}
