import { Controller, Get } from '@nestjs/common';
import { PairsService } from './pairs/service';
import { TokensService } from './tokens/service';
import * as dto from '../dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('')
export class AppController {
  constructor(
    private readonly pairsService: PairsService,
    private readonly tokensService: TokensService,
  ) {}

  @Get('global-state')
  @ApiOperation({
    summary: 'retrieves the service global state',
    description: `gets overall dex information: pairs, tokens, top height, synchronization etc`,
  })
  @ApiResponse({ status: 200, type: dto.GlobalState })
  async globalState(): Promise<dto.GlobalState> {
    const pairStats = await this.pairsService.getCountStats();
    return {
      topBlockHeight: await this.pairsService.getTopHeight(),
      pairsSyncedPercent: (pairStats.synced * 100) / pairStats.all,
      tokens: await this.tokensService.getCount(),
      listedTokens: await this.tokensService.getCount(true),
      pairs: pairStats.all,
      listedPairs: pairStats.listed,
    };
  }
}
