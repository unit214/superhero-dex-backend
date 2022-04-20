import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { TokensService } from './service';
import * as dto from '../../dto';

@Controller('tokens')
export class TokensController {
  constructor(private readonly appService: TokensService) {}

  @Get()
  async getAllTokens(): Promise<dto.TokenWithListed[]> {
    return await this.appService.getAllTokens();
  }

  @Get('listed')
  async getListedTokens(): Promise<dto.Token[]> {
    return (await this.appService.getListedTokens()).map(
      ({
        listed, // eslint-disable-line @typescript-eslint/no-unused-vars
        ...tail
      }) => tail,
    );
  }

  @Get(':address')
  async findOne(
    @Param('address') address: string,
  ): Promise<dto.TokenWithPairs> {
    const token = await this.appService.getToken(address);
    if (!token) {
      throw new NotFoundException('token not found');
    }

    const {
      pairs0,
      pairs1,
      id, // eslint-disable-line @typescript-eslint/no-unused-vars
      ...tail
    } = token;
    return {
      ...tail,
      pairs: pairs0.concat(pairs1).map((x) => x.address),
    };
  }

  @Get(':address/pairs')
  async pairs(@Param('address') address: string): Promise<dto.TokenPairs> {
    const token = await this.appService.getTokenWithPairsInfo(address);
    if (!token) {
      throw new NotFoundException('token not found');
    }

    return {
      pairs0: token.pairs0.map(
        ({ address, synchronized, liquidityInfo, token1 }) => ({
          address,
          synchronized,
          oppositeToken: token1,
          liquidityInfo: liquidityInfo || undefined,
        }),
      ),
      pairs1: token.pairs1.map(
        ({ address, synchronized, liquidityInfo, token0: oppositeToken }) => ({
          address,
          synchronized,
          oppositeToken,
          liquidityInfo: liquidityInfo || undefined,
        }),
      ),
    };
  }
}
