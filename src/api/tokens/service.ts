import { Injectable } from '@nestjs/common';
import * as dal from '../../dal';
import { Pair, Token, PairLiquidityInfo } from '@prisma/client';

@Injectable()
export class TokensService {
  async getAllTokens(): Promise<Token[]> {
    return dal.token.getAll();
  }
  async getListedTokens(): Promise<Token[]> {
    return dal.token.getListed();
  }

  async getToken(address: string): Promise<
    | (Token & {
        pairs0: Pair[];
        pairs1: Pair[];
      })
    | null
  > {
    return dal.token.getByAddressWithPairs(address);
  }

  async getTokenWithPairsInfo(address: string): Promise<
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
