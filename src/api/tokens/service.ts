import { Injectable } from '@nestjs/common';
import * as dal from '../../dal';
import { Pair, Token, PairLiquidityInfo } from '@prisma/client';
import { ContractAddress, presentInvalidTokens } from '../../lib/utils';

@Injectable()
export class TokensService {
  async getCount(onlyListed?: boolean) {
    return dal.token.count(presentInvalidTokens, onlyListed);
  }
  async getAllTokens(): Promise<Token[]> {
    return dal.token.getAll(presentInvalidTokens);
  }
  async getListedTokens(): Promise<Token[]> {
    return dal.token.getListed();
  }

  async listToken(address: ContractAddress) {
    return dal.token.updateListedValue(address, true);
  }

  async unlistToken(address: ContractAddress) {
    return dal.token.updateListedValue(address, false);
  }

  async getToken(address: ContractAddress): Promise<
    | (Token & {
        pairs0: Pair[];
        pairs1: Pair[];
      })
    | null
  > {
    return dal.token.getByAddressWithPairs(address);
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
    return dal.token.getByAddressWithPairsAndLiquidity(address);
  }
}
