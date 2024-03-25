import { Injectable } from '@nestjs/common';
import { presentInvalidTokens } from '../../lib/utils';
import { PairDbService } from '../../database/pair/pair-db.service';

@Injectable()
export class PairsService {
  constructor(private readonly pairDbService: PairDbService) {}
  async getAllPairs(onlyListed?: boolean) {
    return this.pairDbService.getAllWithCondition(
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
