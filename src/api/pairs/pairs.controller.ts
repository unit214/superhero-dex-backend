import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import * as prisma from '@prisma/client';

import * as dto from '@/api/api.model';
import { PairsService } from '@/api/pairs/pairs.service';
import { ContractAddress } from '@/clients/sdk-client.model';
import { removeId } from '@/lib/utils';

export const toLiquidityInfoDto = (
  liquidityInfo: prisma.PairLiquidityInfo | null | undefined,
): dto.LiquidityInfo | undefined =>
  liquidityInfo ? removeId(liquidityInfo) : undefined;

@UseInterceptors(CacheInterceptor)
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
  @ApiQuery({
    name: 'token',
    type: String,
    description:
      'Allows to filter the pairs by a specific token address (token0 or token1)',
    required: false,
  })
  @ApiResponse({ status: 200, type: [dto.PairWithUsd] })
  @CacheTTL(24 * 60 * 60 * 1000)
  async getAllPairs(
    @Query('only-listed') onlyListedStr?: string, // false | true
    @Query('token') token?: ContractAddress,
  ): Promise<dto.PairWithUsd[]> {
    const onlyListed = !!onlyListedStr && onlyListedStr !== 'false';
    return this.pairsService.getAllPairsWithAggregation(onlyListed, token);
  }

  @Get(':address')
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
}
