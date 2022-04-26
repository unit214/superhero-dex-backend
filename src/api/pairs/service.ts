import { Injectable } from '@nestjs/common';
import * as dal from '../../dal';
import { Pair, Token, PairLiquidityInfo } from '@prisma/client';

@Injectable()
export class PairsService {
  async getAllPairs(): Promise<(Pair & { token0: Token; token1: Token })[]> {
    return dal.pair.getAll();
  }

  async getPair(address: string): Promise<
    | (Pair & {
        token0: Token;
        token1: Token;
        liquidityInfo: PairLiquidityInfo | null;
      })
    | null
  > {
    return dal.pair.getOne(address);
  }
}
