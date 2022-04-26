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
) => {
  return {
    ...toPair(pair),
    liquidityInfo: pair.liquidityInfo || undefined,
  };
};
@Controller('pairs')
export class PairsController {
  constructor(private readonly appService: PairsService) {}

  @Get()
  async getAllPairs(): Promise<dto.Pair[]> {
    return (await this.appService.getAllPairs()).map((pair) => ({
      address: pair.address,
      token0: pair.token0.address,
      token1: pair.token1.address,
      synchronized: pair.synchronized,
    }));
  }
  @Get(':address')
  async findOne(
    @Param('address') address: string,
  ): Promise<dto.PairWithLiquidity> {
    const pair = await this.appService.getPair(address);
    if (!pair) {
      throw new NotFoundException('pair not found');
    }
    return {
      address: pair.address,
      token0: pair.token0.address,
      token1: pair.token1.address,
      synchronized: pair.synchronized,
      liquidityInfo: pair.liquidityInfo || undefined,
    };
  }

  @Get('swap-routes/:from/:to?')
  async getSwapRoutes(
    @Param('from') from: string,
    @Param('to') to: string,
    @Query('only-listed') onlyListedStr: string, //false | true
  ): Promise<any> {
    const onlyListed = !!onlyListedStr && onlyListedStr != 'false';
    const pairs = await this.appService.getAllPairsWithLiquidityInfo(
      !!onlyListed,
    );
    const edges = pairs.map((data) => ({
      data,
      t0: data.token0.address,
      t1: data.token1.address,
    }));
    return getPaths(from, to, edges).map((xs) =>
      xs.map((pair) => toPairWithLiquidityInfo(pair)),
    );
  }
}
