import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PairsService } from './service';
import * as dto from '../../dto';

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
}
