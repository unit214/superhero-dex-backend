import {
  Controller,
  Get,
  ParseEnumPipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

import { OrderQueryEnum, PairLiquidityInfoHistoryEntry } from '@/api/api.model';
import { PairLiquidityInfoHistoryService } from '@/api/pair-liquidity-info-history/pair-liquidity-info-history.service';
import { ContractAddress } from '@/clients/sdk-client.model';

@Controller('history/liquidity')
export class PairLiquidityInfoHistoryController {
  constructor(
    private readonly pairLiquidityInfoHistoryService: PairLiquidityInfoHistoryService,
  ) {}

  @Get()
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
  async findAll(
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 100,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
    @Query('order', new ParseEnumPipe(OrderQueryEnum, { optional: true }))
    order: OrderQueryEnum = OrderQueryEnum.asc,
    @Query('pairAddress') pairAddress?: ContractAddress,
    @Query('height', new ParseIntPipe({ optional: true })) height?: number,
    @Query('fromBlockTime', new ParseIntPipe({ optional: true }))
    fromBlockTime?: number,
    @Query('toBlockTime', new ParseIntPipe({ optional: true }))
    toBlockTime?: number,
  ): Promise<PairLiquidityInfoHistoryEntry[]> {
    return this.pairLiquidityInfoHistoryService
      .getAllHistoryEntries(
        Number(limit),
        Number(offset),
        order,
        pairAddress,
        height != null ? Number(height) : undefined,
        fromBlockTime != null ? BigInt(fromBlockTime) : undefined,
        toBlockTime != null ? BigInt(toBlockTime) : undefined,
      )
      .then((entries) =>
        entries.map((entry) => ({
          pairAddress: entry.pair.address,
          type: entry.eventType,
          reserve0: entry.reserve0.toString(),
          reserve1: entry.reserve1.toString(),
          deltaReserve0: entry.deltaReserve0.toString(),
          deltaReserve1: entry.deltaReserve1.toString(),
          aeUsdPrice: entry.aeUsdPrice.toString(),
          height: entry.height,
          microBlockHash: entry.microBlockHash,
          microBlockTime: entry.microBlockTime.toString(),
          transactionHash: entry.transactionHash,
          transactionIndex: entry.transactionIndex.toString(),
          logIndex: entry.logIndex,
        })),
      );
  }
}
