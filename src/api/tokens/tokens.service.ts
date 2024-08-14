import { Cache } from '@nestjs/cache-manager';
import { Injectable } from '@nestjs/common';
import { Pair, PairLiquidityInfo, Token } from '@prisma/client';

import { TokenWithUsd } from '@/api/api.model';
import { ContractAddress } from '@/clients/sdk-client.model';
import { TokenDbService } from '@/database/token/token-db.service';
import { presentInvalidTokens } from '@/lib/utils';

@Injectable()
export class TokensService {
  constructor(
    private readonly tokenDbService: TokenDbService,
    private cacheManager: Cache,
  ) {}
  async getCount(onlyListed?: boolean) {
    return this.tokenDbService.count(presentInvalidTokens, onlyListed);
  }
  async getAllTokens(): Promise<Token[]> {
    return this.tokenDbService.getAll(presentInvalidTokens);
  }
  async getAllTokensWithAggregation(): Promise<TokenWithUsd[]> {
    return this.tokenDbService.getAllWithAggregation(presentInvalidTokens);
  }
  async getListedTokens(): Promise<Token[]> {
    return this.tokenDbService.getListed();
  }

  async listToken(address: ContractAddress) {
    const res = this.tokenDbService.updateListedValue(address, true);
    await this.cacheManager.reset();
    return res;
  }

  async unlistToken(address: ContractAddress) {
    const res = this.tokenDbService.updateListedValue(address, false);
    await this.cacheManager.reset();
    return res;
  }

  async getToken(address: ContractAddress): Promise<TokenWithUsd | null> {
    return this.tokenDbService.getWithAggregation(address);
  }

  async getTokenWithPairsInfo(address: ContractAddress): Promise<
    | (Token & {
        pairs0: (Pair & {
          token1: Token;
          liquidityInfo: PairLiquidityInfo | null;
        })[];
        pairs1: (Pair & {
          liquidityInfo: PairLiquidityInfo | null;
          token0: Token;
        })[];
      })
    | null
  > {
    return this.tokenDbService.getByAddressWithPairsAndLiquidity(address);
  }
}
