import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import * as prisma from '@prisma/client';

import * as dto from '@/api/api.model';
import { PairsService } from '@/api/pairs/pairs.service';
import { getPaths } from '@/lib/paths';
import { removeId } from '@/lib/utils';

const toPair = (
  pair: prisma.Pair & {
    token0: prisma.Token;
    token1: prisma.Token;
  },
) => {
  return {
    address: pair.address,
    token0: pair.token0.address,
    token1: pair.token1.address,
    synchronized: pair.synchronized,
  };
};
const toPairWithLiquidityInfo = (
  pair: prisma.Pair & {
    liquidityInfo: prisma.PairLiquidityInfo | null;
    token0: prisma.Token;
    token1: prisma.Token;
  },
): dto.PairWithLiquidityAndTokenAddresses => {
  return {
    ...toPair(pair),
    liquidityInfo: toLiquidityInfoDto(pair.liquidityInfo),
  };
};

const toLiquidityInfoDto = (
  liquidityInfo: prisma.PairLiquidityInfo | null | undefined,
): dto.LiquidityInfo | undefined =>
  liquidityInfo ? removeId(liquidityInfo) : undefined;

@Controller('pairs')
export class PairsController {
  constructor(private readonly pairsService: PairsService) {}

  @Get()
  @ApiOperation({
    summary: 'Retrieves all the pairs',
    description: `the listed pairs do not have attached any liquidity info nor the tokens full information, \
for this purpose use the individual \`pairs/:address\` route`,
  })
  @ApiQuery({
    name: 'only-listed',
    type: Boolean,
    description:
      'Retrieves only the pairs having both tokens added in the official token list',
    required: false,
  })
  @ApiResponse({ status: 200, type: [dto.Pair] })
  async getAllPairs(
    @Query('only-listed') onlyListedStr?: string, //false | true
  ): Promise<dto.Pair[]> {
    const onlyListed = !!onlyListedStr && onlyListedStr !== 'false';
    return (await this.pairsService.getAllPairs(!!onlyListed)).map((pair) => ({
      address: pair.address,
      token0: pair.token0.address,
      token1: pair.token1.address,
      synchronized: pair.synchronized,
      transactions: '0', // TODO PIWO: fill me
      tvlUsd: '0', // TODO PIWO: fill me
      volumeUsd: {
        day: '0', // TODO PIWO: fill me
        week: '0', // TODO PIWO: fill me
      },
    }));
  }

  @Get('by-address/:address')
  @ApiOperation({
    summary: 'Gets a specific pair',
    description:
      'The pair retrieved comes also with liquidity info and full token information',
  })
  @ApiParam({
    name: 'address',
    required: true,
    example:
      process.env.DOC_PAIR ||
      'ct_2JZNDfAQHZMfoBuh32Aijd9TR8A5SHUVBzxC6x5d4sS7o8xeqN',
    ...dto.pairAddressPropertyOptions,
  })
  @ApiResponse({ status: 200, type: dto.PairWithLiquidityAndTokens })
  @ApiResponse({ status: 404 })
  async findOne(
    @Param('address') address: string,
  ): Promise<dto.PairWithLiquidityAndTokens> {
    const pair = await this.pairsService.getPair(address);
    if (!pair) {
      throw new NotFoundException('pair not found');
    }
    const token0 = removeId(pair.token0);
    const token1 = removeId(pair.token1);
    return {
      address: pair.address,
      token0,
      token1,
      synchronized: pair.synchronized,
      liquidityInfo: toLiquidityInfoDto(pair.liquidityInfo),
    };
  }

  @ApiOperation({
    summary: 'Retrieves all swap routes between two tokens',
    description: `Gets all swap routes directly or with one intermediate token from one token to another. \
The routes are represented as arrays of pairs.<br\> <b>NOTE</b>: the response is an array of pair arrays, but \
because of nest-swagger limitation the documentation can't show a multi-dimensional array. Though, please take in consideration \
the real response type is \`Array<Array<PairWithLiquidityAndTokenAddresses>>\``,
  })
  @Get('swap-routes/:from/:to?')
  @ApiQuery({
    name: 'only-listed',
    type: Boolean,
    description:
      'Retrieves only the pairs having both tokens added in the official token list',
    required: false,
  })
  @ApiResponse({
    status: 200,
    type: dto.PairWithLiquidityAndTokenAddresses,
    isArray: true,
  })
  @ApiParam({
    name: 'from',
    required: true,
    example:
      process.env.DOC_TOKEN1 ||
      'ct_b7FZHQzBcAW4r43ECWpV3qQJMQJp5BxkZUGNKrqqLyjVRN3SC',
    ...dto.tokenAddressPropertyOptions,
  })
  @ApiParam({
    name: 'to',
    required: true,
    example:
      process.env.DOC_TOKEN2 ||
      'ct_JDp175ruWd7mQggeHewSLS1PFXt9AzThCDaFedxon8mF8xTRF',
    ...dto.tokenAddressPropertyOptions,
  })
  async getSwapRoutes(
    @Param('from') from: string,
    @Param('to') to: string,
    @Query('only-listed') onlyListedStr: string, //false | true
  ): Promise<dto.PairWithLiquidityAndTokenAddresses[][]> {
    const onlyListed = !!onlyListedStr && onlyListedStr !== 'false';
    const pairs =
      await this.pairsService.getAllPairsWithLiquidityInfo(!!onlyListed);
    const edges = pairs.map((data) => ({
      data,
      t0: data.token0.address,
      t1: data.token1.address,
    }));
    return getPaths(from, to, edges).map((pairs) =>
      pairs.map((pair) => toPairWithLiquidityInfo(pair)),
    );
  }
}
