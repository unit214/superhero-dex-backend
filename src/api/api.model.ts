import { ApiProperty } from '@nestjs/swagger';

// Patterns
export const contractPattern =
  'ct_([23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz]){49,50}';
export const transactionPattern =
  'th_([23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz]){49,50}';
export const accountPattern =
  'ak_([23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz]){49,50}';
export const bigNumberPattern = '[1-9]+';
export const usdValuePattern = '[1-9]+([.][1-9]{1,4})?'; // [.] instead of \. needed, because of the \ being interpreted as an escape character in JavaScript resulting in incorrect pattern
export const aeValuePattern = '[1-9]+([.][1-9]{1,18})?'; // [.] instead of \. needed, because of the \ being interpreted as an escape character in JavaScript resulting in incorrect pattern
export const percentPattern = '[1-9]+([.][1-9]+)?'; // [.] instead of \. needed, because of the \ being interpreted as a escape character in JavaScript resulting in incorrect pattern
export const microBlockTimePattern = '[1-9]{13}';
export const microBlockHashPattern =
  'mh_([23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz]){49,50}';

// Examples
export const heightExample = 598149;
export const bigNumberExample = '75819422625233931920';
export const usdValueExample = '0.1114';
export const aeValueExample = '6.251274413368500893';
export const percentExample = '26.579964573';

export const pairAddressPropertyOptions = {
  description: 'Pair contract address',
  pattern: contractPattern,
};
export const tokenAddressPropertyOptions = {
  description: 'Token contract address',
  pattern: contractPattern,
};

export class LiquidityInfo {
  @ApiProperty({
    description: 'Total supply of Liquidity Tokens',
    pattern: bigNumberPattern,
    example: bigNumberExample,
  })
  totalSupply: string;

  @ApiProperty({
    description: 'Whole reserve of token0 owned by the Pair contract',
    pattern: bigNumberPattern,
    example: bigNumberExample,
  })
  reserve0: string;

  @ApiProperty({
    description: 'Whole reserve of token1 owned by the Pair contract',
    pattern: bigNumberPattern,
    example: bigNumberExample,
  })
  reserve1: string;
}

export class PairBase {
  @ApiProperty(pairAddressPropertyOptions)
  address: string;

  @ApiProperty({
    description: `When service just started and it is in synchronization process or an error \
occurred regarding this pair, the pair is considered unsynced, therefore the user should not \
take in consideration it's liquidity info as the latest representation`,
    examples: [true, false],
  })
  synchronized: boolean;
}

export class Token {
  @ApiProperty({
    description: 'Token contract address',
    pattern: contractPattern,
  })
  address: string;

  @ApiProperty({
    description: 'Symbol which represents the token',
    examples: ['WAE', 'FST', 'SND', 'USDT'],
    example: 'WAE',
  })
  symbol: string;

  @ApiProperty({
    description: 'Full name of the token',
    examples: ['Wrapped AE', 'Token-A', 'Token-B', 'Wrapped Theter'],
    example: 'Wrapped AE',
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
}

export class TokenWithListed extends Token {
  @ApiProperty({
    description:
      'Specifies if a token is supported/listed officially by the DEX or is just added by a random user',
    examples: [true, false],
  })
  listed: boolean;
}

const liquidityInfoPropertyOptions = {
  description: `Liquidity pair information. NOTE: between the pair addition moment and the first liquidity fetching \
liquidityInfo will be null. After that it will always have the last fetched values`,
  type: LiquidityInfo,
  nullable: true,
};

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

export class TokenWithUsd extends TokenWithListed {
  @ApiProperty({
    description: 'Price of the token in AE',
    pattern: usdValuePattern,
    example: usdValueExample,
  })
  priceAe: string;

  @ApiProperty({
    description: 'Price of the token in USD',
    pattern: usdValuePattern,
    example: usdValueExample,
  })
  priceUsd: string;

  @ApiProperty({
    description: 'Total locked value in AE',
    pattern: aeValuePattern,
    example: aeValueExample,
  })
  tvlAe: string;

  @ApiProperty({
    description: 'Total locked value in USD',
    pattern: usdValuePattern,
    example: usdValueExample,
  })
  tvlUsd: string;

  @ApiProperty({
    description: 'Total Reserve',
    pattern: usdValuePattern,
    example: usdValueExample,
  })
  totalReserve: string;

  @ApiProperty({
    description: 'Number of pairs for this token',
    example: 16,
  })
  pairs: number;

  @ApiProperty({
    description: 'Volume for last day in USD',
    pattern: usdValuePattern,
    example: usdValueExample,
  })
  volumeUsdDay: string;

  @ApiProperty({
    description: 'Volume for last week in USD',
    pattern: usdValuePattern,
    example: usdValueExample,
  })
  volumeUsdWeek: string;

  @ApiProperty({
    description: 'Volume for last month in USD',
    pattern: usdValuePattern,
    example: usdValueExample,
  })
  volumeUsdMonth: string;

  @ApiProperty({
    description: 'Volume for last year in USD',
    pattern: usdValuePattern,
    example: usdValueExample,
  })
  volumeUsdYear: string;

  @ApiProperty({
    description: 'Volume for all time in USD',
    pattern: usdValuePattern,
    example: usdValueExample,
  })
  volumeUsdAll: string;

  @ApiProperty({
    description: 'Price change for last day in percent',
    pattern: percentPattern,
    example: percentExample,
  })
  priceChangeDay: string;

  @ApiProperty({
    description: 'Price change for last week in percent',
    pattern: percentPattern,
    example: percentExample,
  })
  priceChangeWeek: string;

  @ApiProperty({
    description: 'Price change for last month in percent',
    pattern: percentPattern,
    example: percentExample,
  })
  priceChangeMonth: string;

  @ApiProperty({
    description: 'Price change for last year in percent',
    pattern: percentPattern,
    example: percentExample,
  })
  priceChangeYear: string;
}

export class PairWithUsd extends PairBase {
  @ApiProperty({
    description: 'Contract address for the token stored as token0',
    pattern: contractPattern,
  })
  token0: string;

  @ApiProperty({
    description: 'Contract address for the token stored as token1',
    pattern: contractPattern,
  })
  token1: string;

  @ApiProperty({
    description: 'How many transactions were made in the pair',
    example: 0,
  })
  transactions: number;

  @ApiProperty({
    description: 'Total Value Locked in USD',
    pattern: usdValuePattern,
    example: usdValueExample,
  })
  tvlUsd: string;

  @ApiProperty({
    description: 'Volume for last day in USD',
    pattern: usdValuePattern,
    example: usdValueExample,
  })
  volumeUsdDay: string;

  @ApiProperty({
    description: 'Volume for last week in USD',
    pattern: usdValuePattern,
    example: usdValueExample,
  })
  volumeUsdWeek: string;

  @ApiProperty({
    description: 'Volume for last month in USD',
    pattern: usdValuePattern,
    example: usdValueExample,
  })
  volumeUsdMonth: string;

  @ApiProperty({
    description: 'Volume for last year in USD',
    pattern: usdValuePattern,
    example: usdValueExample,
  })
  volumeUsdYear: string;

  @ApiProperty({
    description: 'Volume for all time in USD',
    pattern: usdValuePattern,
    example: usdValueExample,
  })
  volumeUsdAll: string;
}

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
    description: 'Contract address for the token stored as token0',
    pattern: contractPattern,
    example:
      process.env.DOC_TOKEN1 ||
      'ct_b7FZHQzBcAW4r43ECWpV3qQJMQJp5BxkZUGNKrqqLyjVRN3SC',
  })
  token0: string;

  @ApiProperty({
    description: 'Contract address for the token stored as token1',
    pattern: contractPattern,
    example:
      process.env.DOC_TOKEN2 ||
      'ct_JDp175ruWd7mQggeHewSLS1PFXt9AzThCDaFedxon8mF8xTRF',
  })
  token1: string;
}

export class TokenPairs {
  @ApiProperty({
    description: 'All the pairs which have as token0 the given token',
    type: [TokenPairWithLiquidityInfo],
  })
  pairs0: TokenPairWithLiquidityInfo[];

  @ApiProperty({
    description: 'All the pairs which have as token1 the given token',
    type: [TokenPairWithLiquidityInfo],
  })
  pairs1: TokenPairWithLiquidityInfo[];
}

export class GlobalState {
  @ApiProperty({
    description: 'Maximum block-height found in liquidity-info',
    example: heightExample,
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

  @ApiProperty({
    description: 'Type of the event',
    example: EventTypeEnum.SwapTokens,
  })
  type: EventTypeEnum;

  @ApiProperty({
    description: 'Whole reserve of token0 owned by the Pair contract',
    pattern: bigNumberPattern,
    example: bigNumberExample,
  })
  reserve0: string;

  @ApiProperty({
    description: 'Whole reserve of token1 owned by the Pair contract',
    pattern: bigNumberPattern,
    example: bigNumberExample,
  })
  reserve1: string;

  @ApiProperty({
    description: 'Change in reserve0',
    pattern: bigNumberPattern,
    example: bigNumberExample,
  })
  deltaReserve0: string;

  @ApiProperty({
    description: 'Change in reserve1',
    pattern: bigNumberPattern,
    example: bigNumberExample,
  })
  deltaReserve1: string;

  @ApiProperty({
    description: 'Exchange rate of token0 to AE',
    pattern: aeValuePattern,
    example: aeValueExample,
    type: 'string', // needed if type is string | null for the example to render correctly
  })
  token0AePrice: string | null;

  @ApiProperty({
    description: 'Exchange rate of token1 to AE',
    pattern: aeValuePattern,
    example: aeValueExample,
    type: 'string', // needed if type is string | null for the example to render correctly
  })
  token1AePrice: string | null;

  @ApiProperty({
    description: 'Price of AE in USD',
    pattern: usdValuePattern,
    example: usdValueExample,
  })
  aeUsdPrice: string;

  @ApiProperty({
    description: 'Block height of the history entry',
    example: heightExample,
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
    pattern: usdValuePattern,
    example: usdValueExample,
    type: 'string', // needed if type is string | null for the example to render correctly
  })
  reserve0Usd: string | null;

  @ApiProperty({
    description: 'USD value of the reserve of token 1 of the pair',
    pattern: usdValuePattern,
    example: usdValueExample,
    type: 'string', // needed if type is string | null for the example to render correctly
  })
  reserve1Usd: string | null;

  @ApiProperty({
    description: 'USD value of the transaction of token 0 of the pair',
    pattern: usdValuePattern,
    example: usdValueExample,
    type: 'string', // needed if type is string | null for the example to render correctly
  })
  delta0UsdValue: string | null;

  @ApiProperty({
    description: 'USD value of the transaction of token 1 of the pair',
    pattern: usdValuePattern,
    example: usdValueExample,
    type: 'string', // needed if type is string | null for the example to render correctly
  })
  delta1UsdValue: string | null;

  @ApiProperty({
    description: 'USD value of the pool fee',
    pattern: usdValuePattern,
    example: usdValueExample,
    type: 'string', // needed if type is string | null for the example to render correctly
  })
  txUsdFee: string | null;
}
