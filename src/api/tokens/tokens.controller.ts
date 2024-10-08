import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import {
  Controller,
  Delete,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiHeaders,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import * as prisma from '@prisma/client';

import * as dto from '@/api/api.model';
import { TokensService } from '@/api/tokens/tokens.service';
import { ContractAddress } from '@/clients/sdk-client.model';
import { removeId } from '@/lib/utils';

const withTokenAuthorization = async <T>(
  auth: string,
  work: () => Promise<T>,
): Promise<T> => {
  if (auth !== process.env.AUTH_TOKEN) {
    throw new UnauthorizedException('wrong authorization');
  }
  try {
    return await work(); // await is not redundant is for the try catch purpose
  } catch (error) {
    if (error.message.indexOf('Record to update not found') > -1) {
      throw new NotFoundException('Token not found');
    } else {
      throw error;
    }
  }
};
const toDtoToken = ({
  listed, // eslint-disable-line @typescript-eslint/no-unused-vars
  id, // eslint-disable-line @typescript-eslint/no-unused-vars
  ...tail
}: prisma.Token) => tail;

@UseInterceptors(CacheInterceptor)
@Controller('tokens')
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Get()
  @ApiOperation({
    summary: 'Retrieves all stored tokens',
    description: `All the tokens no matter if are officially supported by the DEX (listed=true) or not will be retrieved`,
  })
  @ApiResponse({ status: 200, type: [dto.TokenWithUsd] })
  @CacheTTL(24 * 60 * 60 * 1000)
  async getAllTokens(): Promise<dto.TokenWithUsd[]> {
    return this.tokensService.getAllTokensWithAggregation();
  }

  @Get('listed')
  @ApiOperation({
    summary: 'Retrieves all officially supported tokens',
    description: `Just direct token information is retrieved, for more information as pair addresses or even full pair details
use \`tokens/:address\` or \`tokens/:address/pairs\` `,
  })
  @ApiResponse({ status: 200, type: [dto.Token] })
  async getListedTokens(): Promise<dto.Token[]> {
    return (await this.tokensService.getListedTokens()).map(toDtoToken);
  }

  @Get(':address')
  @ApiParam({
    name: 'address',
    required: true,
    example:
      process.env.DOC_TOKEN1 ||
      'ct_b7FZHQzBcAW4r43ECWpV3qQJMQJp5BxkZUGNKrqqLyjVRN3SC',
    ...dto.pairAddressPropertyOptions,
  })
  @ApiOperation({
    summary: 'Gets a specific token',
    description: `Gets information about a specific token with all belonging pair addresses`,
  })
  @ApiResponse({ status: 200, type: dto.TokenWithUsd })
  @ApiResponse({ status: 404 })
  async findOne(
    @Param('address') address: ContractAddress,
  ): Promise<dto.TokenWithUsd> {
    const token = await this.tokensService.getToken(address);
    if (!token) {
      throw new NotFoundException('token not found');
    }
    return token;
  }

  @Get(':address/pairs')
  @ApiParam({
    name: 'address',
    required: true,
    example:
      process.env.DOC_TOKEN1 ||
      'ct_b7FZHQzBcAW4r43ECWpV3qQJMQJp5BxkZUGNKrqqLyjVRN3SC',
    ...dto.pairAddressPropertyOptions,
  })
  @ApiOperation({
    summary: 'Retrieves all belonging pairs for a given token',
    description: `Gets all pairs with the liquidity attached and also the other pair token information. 
The returning object is split in two, pairs in which the given token represents the token0 and another list in which
the given token represents the token1`,
  })
  @ApiResponse({ status: 200, type: dto.TokenPairs })
  @ApiResponse({ status: 404 })
  async pairs(
    @Param('address') address: ContractAddress,
  ): Promise<dto.TokenPairs> {
    const token = await this.tokensService.getTokenWithPairsInfo(address);
    if (!token) {
      throw new NotFoundException('token not found');
    }

    return {
      pairs0: token.pairs0.map(
        ({ address, synchronized, liquidityInfo, token1 }) => ({
          address,
          synchronized,
          oppositeToken: removeId(token1),
          liquidityInfo: liquidityInfo ? removeId(liquidityInfo) : undefined,
        }),
      ),
      pairs1: token.pairs1.map(
        ({ address, synchronized, liquidityInfo, token0 }) => ({
          address,
          synchronized,
          oppositeToken: removeId(token0),
          liquidityInfo: liquidityInfo ? removeId(liquidityInfo) : undefined,
        }),
      ),
    };
  }

  @Post('listed/:address')
  @ApiParam({
    name: 'address',
    required: true,
    example:
      process.env.DOC_TOKEN2 ||
      'ct_JDp175ruWd7mQggeHewSLS1PFXt9AzThCDaFedxon8mF8xTRF',
    ...dto.pairAddressPropertyOptions,
  })
  @ApiOperation({
    summary: 'Mark token as listed',
    description: `Add a token in the official token list`,
  })
  @ApiHeaders([
    {
      name: 'Authorization',
      description: 'authorization token',
      required: true,
      allowEmptyValue: false,
      example:
        '77e1c923ec679c11a3a2efbd0cde5927edf874818e5be54443da6b12a9280202',
    },
  ])
  @ApiResponse({ status: 201, type: dto.TokenWithListed })
  @ApiResponse({ status: 404 })
  @ApiResponse({ status: 401 })
  async listToken(
    @Param('address') address: ContractAddress,
    @Headers('Authorization') auth: string,
  ): Promise<dto.TokenWithListed> {
    return withTokenAuthorization(auth, async () =>
      removeId(await this.tokensService.listToken(address)),
    );
  }

  @Delete('listed/:address')
  @ApiParam({
    name: 'address',
    required: true,
    example:
      process.env.DOC_TOKEN2 ||
      'ct_JDp175ruWd7mQggeHewSLS1PFXt9AzThCDaFedxon8mF8xTRF',
    ...dto.pairAddressPropertyOptions,
  })
  @ApiOperation({
    summary: 'Unmark token as listed',
    description: `Remove a token from the official token list`,
  })
  @ApiHeaders([
    {
      name: 'Authorization',
      description: 'authorization token',
      required: true,
      allowEmptyValue: false,
      example:
        '77e1c923ec679c11a3a2efbd0cde5927edf874818e5be54443da6b12a9280202',
    },
  ])
  @ApiResponse({ status: 200, type: dto.TokenWithListed })
  @ApiResponse({ status: 404 })
  @ApiResponse({ status: 401 })
  async unlistToken(
    @Param('address') address: ContractAddress,
    @Headers('Authorization') auth: string,
  ): Promise<dto.TokenWithListed> {
    return withTokenAuthorization(auth, async () =>
      removeId(await this.tokensService.unlistToken(address)),
    );
  }
}
