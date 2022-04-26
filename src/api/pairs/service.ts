import { Injectable } from '@nestjs/common';
import * as dal from '../../dal';

@Injectable()
export class PairsService {
  async getAllPairs(onlyListed?: boolean) {
    return dal.pair.getAll(onlyListed);
  }

  async getAllPairsWithLiquidityInfo(onlyListed?: boolean) {
    return dal.pair.getAllWithLiquidityInfo(onlyListed);
  }

  async getPair(address: string) {
    return dal.pair.getOne(address);
  }
}
