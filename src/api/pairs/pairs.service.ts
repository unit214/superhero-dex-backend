import { Injectable } from '@nestjs/common';
import * as dal from '../../dal';
import { presentInvalidTokens } from '../../lib/utils';

@Injectable()
export class PairsService {
  async getAllPairs(onlyListed?: boolean) {
    return dal.pair.getAll(presentInvalidTokens, onlyListed);
  }

  async getAllPairsWithLiquidityInfo(onlyListed?: boolean) {
    return dal.pair.getAllWithLiquidityInfo(presentInvalidTokens, onlyListed);
  }

  async getCountStats() {
    return {
      all: await dal.pair.count(presentInvalidTokens),
      synced: await dal.pair.count(presentInvalidTokens, 'synchronized'),
      listed: await dal.pair.count(presentInvalidTokens, 'listed'),
    };
  }

  async getPair(address: string) {
    return dal.pair.getOne(address);
  }

  async getTopHeight() {
    return dal.pair.getTopHeight();
  }
}
