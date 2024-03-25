import { Injectable } from '@nestjs/common';
import { Pair, PairLiquidityInfo, Token } from '@prisma/client';
import { ContractAddress, presentInvalidTokens } from '../../lib/utils';
import { TokenDbService } from '../../database/token/token-db.service';

@Injectable()
export class TokensService {
  constructor(private readonly tokenDbService: TokenDbService) {}
  async getCount(onlyListed?: boolean) {
    return this.tokenDbService.count(presentInvalidTokens, onlyListed);
  }
  async getAllTokens(): Promise<Token[]> {
    return this.tokenDbService.getAll(presentInvalidTokens);
  }
  async getListedTokens(): Promise<Token[]> {
    return this.tokenDbService.getListed();
  }

  async listToken(address: ContractAddress) {
    return this.tokenDbService.updateListedValue(address, true);
  }

  async unlistToken(address: ContractAddress) {
    return this.tokenDbService.updateListedValue(address, false);
  }

  async getToken(address: ContractAddress): Promise<
    | (Token & {
        pairs0: Pair[];
        pairs1: Pair[];
      })
    | null
  > {
    return this.tokenDbService.getByAddressWithPairs(address);
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
