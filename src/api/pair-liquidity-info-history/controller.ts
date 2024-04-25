import {
  Controller,
  Get,
  ParseEnumPipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { PairLiquidityInfoHistoryService } from './service';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import * as dto from '../../dto';
import { OrderQueryEnum } from '../../dto';
import { ContractAddress } from '../../lib/utils';

@Controller('history/liquidity')
export class PairLiquidityInfoHistoryController {
  constructor(
    private readonly pairLiquidityInfoHistoryService: PairLiquidityInfoHistoryService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Retrieve all entries of the pair liquidity info history',
    deprecated: true,
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
    name: 'pair-address',
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
    name: 'from-block-time',
    type: Number,
    description:
      'Retrieve only history entries that are equal or newer than the given micro block time',
    required: false,
  })
  @ApiQuery({
    name: 'to-block-time',
    type: Number,
    description:
      'Retrieve only history entries that are equal or older than the given micro block time',
    required: false,
  })
  @ApiResponse({ status: 200, type: [dto.PairLiquidityInfoHistoryEntry] })
  async findAll(
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 100,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
    @Query('order', new ParseEnumPipe(OrderQueryEnum, { optional: true }))
    order: OrderQueryEnum = OrderQueryEnum.asc,
    @Query('pair-address') pairAddress?: ContractAddress,
    @Query('height', new ParseIntPipe({ optional: true })) height?: number,
    @Query('from-block-time', new ParseIntPipe({ optional: true }))
    fromBlockTime?: number,
    @Query('to-block-time', new ParseIntPipe({ optional: true }))
    toBlockTime?: number,
  ): Promise<dto.PairLiquidityInfoHistoryEntry[]> {
    return this.pairLiquidityInfoHistoryService
      .getAllHistoryEntries(
        Number(limit),
        Number(offset),
        order,
        pairAddress,
        height ? Number(height) : undefined,
        fromBlockTime ? BigInt(fromBlockTime) : undefined,
        toBlockTime ? BigInt(toBlockTime) : undefined,
      )
      .then((entries) =>
        entries.map((entry) => ({
          pairAddress: entry.pair.address,
          liquidityInfo: {
            totalSupply: entry.totalSupply,
            reserve0: entry.reserve0,
            reserve1: entry.reserve1,
          },
          height: entry.height,
          microBlockHash: entry.microBlockHash,
          microBlockTime: entry.microBlockTime.toString(),
        })),
      );
  }
}
