import {
  Controller,
  Get,
  Param,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { PairsService } from './service';
import * as dto from '../../dto';
import * as prisma from '@prisma/client';
import { getPaths } from '../../lib/paths';
import { ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { removeId } from '../../lib/utils';

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
  (liquidityInfo && removeId(liquidityInfo)) || undefined;

@Controller('pairs')
export class PairsController {
  constructor(private readonly appService: PairsService) {}

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
    const onlyListed = !!onlyListedStr && onlyListedStr != 'false';
    return (await this.appService.getAllPairs(!!onlyListed)).map((pair) => ({
      address: pair.address,
      token0: pair.token0.address,
      token1: pair.token1.address,
      synchronized: pair.synchronized,
    }));
  }

  @Get('by-address/:address')
  @ApiOperation({
    summary: 'Gets a specific pair',
    description:
      'The pair retrieved comes also with liquidity info and full token informations',
  })
  @ApiParam({
    name: 'address',
    required: true,
    example: 'ct_CcujlSGNs3juOMWcrUZ7puLsAfsaTIwcYnTmhRi9sKnnXFJMX',
    ...dto.pairAddressPropertyOptions,
  })
  @ApiResponse({ status: 200, type: dto.PairWithLiquidityAndTokens })
  @ApiResponse({ status: 404 })
  async findOne(
    @Param('address') address: string,
  ): Promise<dto.PairWithLiquidityAndTokens> {
    const pair = await this.appService.getPair(address);
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
    example: 'ct_2ZZwNQnX1XwBdAy9ZAI8cgyJ7ccafB9HbmmXO1shFCNqhl88F',
    ...dto.tokenAddressPropertyOptions,
  })
  @ApiParam({
    name: 'to',
    required: true,
    example: 'ct_XWASad6omILdToOPfP58KoLxNnIzkWfIQJmIvHPSuHYZ5NxIjy',
    ...dto.tokenAddressPropertyOptions,
  })
  async getSwapRoutes(
    @Param('from') from: string,
    @Param('to') to: string,
    @Query('only-listed') onlyListedStr: string, //false | true
  ): Promise<dto.PairWithLiquidityAndTokenAddresses[][]> {
    const onlyListed = !!onlyListedStr && onlyListedStr != 'false';
    const pairs = await this.appService.getAllPairsWithLiquidityInfo(
      !!onlyListed,
    );
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
