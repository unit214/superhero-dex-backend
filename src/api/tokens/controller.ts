import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { TokensService } from './service';
import * as dto from '../../dto';

@Controller('tokens')
export class TokensController {
  constructor(private readonly appService: TokensService) {}

  @Get()
  async getAllTokens(): Promise<dto.Token[]> {
    return await this.appService.getAllTokens();
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
}
