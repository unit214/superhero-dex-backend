import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import {
  Controller,
  Get,
  ParseEnumPipe,
  ParseIntPipe,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

import { OrderQueryEnum, PairLiquidityInfoHistoryEntry } from '@/api/api.model';
import { PairLiquidityInfoHistoryService } from '@/api/pair-liquidity-info-history/pair-liquidity-info-history.service';
import { ContractAddress } from '@/clients/sdk-client.model';

@Controller('history')
@UseInterceptors(CacheInterceptor)
export class PairLiquidityInfoHistoryController {
  constructor(
    private readonly pairLiquidityInfoHistoryService: PairLiquidityInfoHistoryService,
  ) {}

  @Get('')
  @ApiOperation({
    summary: 'Retrieve all entries of the pair liquidity info history',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    description: 'Limit of history entries per page (default: 100, max: 100)',
    required: false,
  })
  @ApiQuery({
    name: 'offset',
    type: Number,
    description: 'Offset of page (default: 0)',
    required: false,
  })
  @ApiQuery({
    name: 'order',
    enum: OrderQueryEnum,
    description:
      'Sorts history entries in ascending or descending order (default: asc)',
    required: false,
  })
  @ApiQuery({
    name: 'pairAddress',
    type: String,
    description: 'Retrieve only history entries for the given pair address',
    required: false,
  })
  @ApiQuery({
    name: 'tokenAddress',
    type: String,
    description: 'Retrieve only history entries for the given token address',
    required: false,
  })
  @ApiQuery({
    name: 'height',
    type: Number,
    description: 'Retrieve only history entries for the given height',
    required: false,
  })
  @ApiQuery({
    name: 'fromBlockTime',
    type: Number,
    description:
      'Retrieve only history entries that are equal or newer than the given micro block time',
    required: false,
  })
  @ApiQuery({
    name: 'toBlockTime',
    type: Number,
    description:
      'Retrieve only history entries that are equal or older than the given micro block time',
    required: false,
  })
  @ApiResponse({ status: 200, type: [PairLiquidityInfoHistoryEntry] })
  @CacheTTL(24 * 60 * 60 * 1000)
  async findAll(
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 100,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
    @Query('order', new ParseEnumPipe(OrderQueryEnum, { optional: true }))
    order: OrderQueryEnum = OrderQueryEnum.asc,
    @Query('pairAddress') pairAddress?: ContractAddress,
    @Query('tokenAddress') tokenAddress?: ContractAddress,
    @Query('height', new ParseIntPipe({ optional: true })) height?: number,
    @Query('fromBlockTime', new ParseIntPipe({ optional: true }))
    fromBlockTime?: number,
    @Query('toBlockTime', new ParseIntPipe({ optional: true }))
    toBlockTime?: number,
  ): Promise<PairLiquidityInfoHistoryEntry[]> {
    const historyEntries =
      await this.pairLiquidityInfoHistoryService.getAllHistoryEntries({
        limit: Number(limit),
        offset: Number(offset),
        order,
        pairAddress,
        tokenAddress,
        height: height != null ? Number(height) : undefined,
        fromBlockTime:
          fromBlockTime != null ? BigInt(fromBlockTime) : undefined,
        toBlockTime: toBlockTime != null ? BigInt(toBlockTime) : undefined,
      });
    return historyEntries.map(
      this.pairLiquidityInfoHistoryService.mapToEntryWithPrice,
    );
  }
}
