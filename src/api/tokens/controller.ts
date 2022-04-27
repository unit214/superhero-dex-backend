import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { TokensService } from './service';
import * as dto from '../../dto';
import { ApiResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { removeId } from '../../lib/utils';
import * as prisma from '@prisma/client';

const toDtoToken = ({
  listed, // eslint-disable-line @typescript-eslint/no-unused-vars
  id, // eslint-disable-line @typescript-eslint/no-unused-vars
  ...tail
}: prisma.Token) => tail;
@Controller('tokens')
export class TokensController {
  constructor(private readonly appService: TokensService) {}

  @Get()
  @ApiOperation({
    summary: 'Retrieves all stored tokens',
    description: `All the tokens no matter if are officially supported by the DEX (listed=true) or not will be retrieved`,
  })
  @ApiResponse({ status: 200, type: [dto.TokenWithListed] })
  async getAllTokens(): Promise<dto.TokenWithListed[]> {
    return (await this.appService.getAllTokens()).map((token) =>
      removeId(token),
    );
  }

  @Get('listed')
  @ApiOperation({
    summary: 'Retrieves all officially supported tokens',
    description: `Just direct token information is retrieved, for more information as pair addresses or even full pair details
use \`tokens/:address\` or \`tokens/:address/pairs\` `,
  })
  @ApiResponse({ status: 200, type: [dto.Token] })
  async getListedTokens(): Promise<dto.Token[]> {
    return (await this.appService.getListedTokens()).map(toDtoToken);
  }

  @Get('by-address/:address')
  @ApiParam({
    name: 'address',
    required: true,
    example: 'ct_CcujlSGNs3juOMWcrUZ7puLsAfsaTIwcYnTmhRi9sKnnXFJMX',
    ...dto.pairAddressPropertyOptions,
  })
  @ApiOperation({
    summary: 'Gets a specific token',
    description: `Gets information about a specific token with all belonging pair addresses`,
  })
  @ApiResponse({ status: 200, type: dto.TokenWithPairAddresses })
  @ApiResponse({ status: 404 })
  async findOne(
    @Param('address') address: string,
  ): Promise<dto.TokenWithPairAddresses> {
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

  @Get('by-address/:address/pairs')
  @ApiParam({
    name: 'address',
    required: true,
    example: 'ct_CcujlSGNs3juOMWcrUZ7puLsAfsaTIwcYnTmhRi9sKnnXFJMX',
    ...dto.pairAddressPropertyOptions,
  })
  @ApiOperation({
    summary: 'Retrieves all belonging pairs for a given token',
    description: `Gets all pairs with the liquidity attached and also the other pair token information. 
The returning object is splitted in two, pairs in which the given token represents the token0 and onother list in which
the given token represents the token1`,
  })
  @ApiResponse({ status: 200, type: dto.TokenPairs })
  @ApiResponse({ status: 404 })
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
          oppositeToken: removeId(token1),
          liquidityInfo:
            (liquidityInfo && removeId(liquidityInfo)) || undefined,
        }),
      ),
      pairs1: token.pairs1.map(
        ({ address, synchronized, liquidityInfo, token0: oppositeToken }) => ({
          address,
          synchronized,
          oppositeToken,
          liquidityInfo:
            (liquidityInfo && removeId(liquidityInfo)) || undefined,
        }),
      ),
    };
  }
}
