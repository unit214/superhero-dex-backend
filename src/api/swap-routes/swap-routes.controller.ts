import { CacheInterceptor } from '@nestjs/cache-manager';
import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import * as prisma from '@prisma/client';

import * as dto from '@/api/api.model';
import { toLiquidityInfoDto } from '@/api/pairs/pairs.controller';
import { SwapRoutesService } from '@/api/swap-routes/swap-route.service';
import { getPaths } from '@/lib/paths';

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

@UseInterceptors(CacheInterceptor)
@Controller('swap-routes')
export class SwapRoutesController {
  constructor(private readonly swapRoutesService: SwapRoutesService) {}

  @ApiOperation({
    summary: 'Retrieves all swap routes between two tokens',
    description: `Gets all swap routes directly or with one intermediate token from one token to another. \
The routes are represented as arrays of pairs.<br\> <b>NOTE</b>: the response is an array of pair arrays, but \
because of nest-swagger limitation the documentation can't show a multi-dimensional array. Though, please take in consideration \
the real response type is \`Array<Array<PairWithLiquidityAndTokenAddresses>>\``,
  })
  @Get(':from/:to?')
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
      await this.swapRoutesService.getAllPairsWithLiquidityInfo(!!onlyListed);
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
