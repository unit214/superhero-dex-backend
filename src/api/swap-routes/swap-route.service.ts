import { Injectable } from '@nestjs/common';

import { PairDbService } from '@/database/pair/pair-db.service';
import { presentInvalidTokens } from '@/lib/utils';

@Injectable()
export class SwapRoutesService {
  constructor(private readonly pairDbService: PairDbService) {}

  async getAllPairsWithLiquidityInfo(onlyListed?: boolean) {
    return this.pairDbService.getAllWithLiquidityInfo(
      presentInvalidTokens,
      onlyListed,
    );
  }
}
