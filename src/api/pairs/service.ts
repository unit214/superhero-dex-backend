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

  async getCountStats() {
    return {
      all: await dal.pair.count(),
      synced: await dal.pair.count('synchronized'),
      listed: await dal.pair.count('listed'),
    };
  }

  async getPair(address: string) {
    return dal.pair.getOne(address);
  }

  async getTopHeight() {
    return dal.pair.getTopHeight();
  }
}
