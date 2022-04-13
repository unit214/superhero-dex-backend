import { Injectable } from '@nestjs/common';
import * as dal from '../../dal';
import { Pair, Token } from '@prisma/client';

@Injectable()
export class TokensService {
  async getAllTokens(): Promise<Token[]> {
    return dal.token.getAll();
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
}
