import { Injectable } from '@nestjs/common';

import { PairDbService } from '@/database/pair/pair-db.service';
import { presentInvalidTokens } from '@/lib/utils';

@Injectable()
export class PairsService {
  constructor(private readonly pairDbService: PairDbService) {}
  async getAllPairsWithAggregation(onlyListed?: boolean) {
    return this.pairDbService.getAllWithConditionAndAggregations(
      presentInvalidTokens,
      onlyListed,
    );
  }

  async getAllPairsWithLiquidityInfo(onlyListed?: boolean) {
    return this.pairDbService.getAllWithLiquidityInfo(
      presentInvalidTokens,
      onlyListed,
    );
  }

  async getCountStats() {
    return {
      all: await this.pairDbService.count(presentInvalidTokens),
      synced: await this.pairDbService.count(
        presentInvalidTokens,
        'synchronized',
      ),
      listed: await this.pairDbService.count(presentInvalidTokens, 'listed'),
    };
  }

  async getPair(address: string) {
    return this.pairDbService.getOne(address);
  }

  async getTopHeight() {
    return this.pairDbService.getTopHeight();
  }
}
