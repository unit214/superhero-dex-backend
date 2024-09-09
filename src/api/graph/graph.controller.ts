import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import {
  Controller,
  Get,
  ParseEnumPipe,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

import { Graph, GraphType, TimeFrame } from '@/api/graph/graph.model';
import { GraphService } from '@/api/graph/graph.service';
import { ContractAddress } from '@/clients/sdk-client.model';

@UseInterceptors(CacheInterceptor)
@Controller('graph')
export class GraphController {
  @Get()
  @ApiOperation({
    summary: 'Retrieve graph data',
    description: `Retrieve desired graph type with desired time frame for the Overview, a specific Token or a specific Pair`,
  })
  @ApiQuery({
    name: 'graphType',
    enum: GraphType,
    description: 'Desired graph type',
    required: true,
  })
  @ApiQuery({
    name: 'timeFrame',
    enum: TimeFrame,
    description: 'Desired time frame (Default: MAX)',
    required: false,
  })
  @ApiQuery({
    name: 'tokenAddress',
    type: String,
    description: 'Get graph for specific Token',
    required: false,
  })
  @ApiQuery({
    name: 'pairAddress',
    type: String,
    description: 'Get graph for specific Pair',
    required: false,
  })
  @ApiResponse({ status: 200, type: Graph })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 404 })
  @CacheTTL(24 * 60 * 60 * 1000)
  async get(
    @Query('graphType', new ParseEnumPipe(GraphType))
    graphType: GraphType,
    @Query('timeFrame', new ParseEnumPipe(TimeFrame, { optional: true }))
    timeFrame: TimeFrame = TimeFrame.MAX,
    @Query('tokenAddress') tokenAddress?: ContractAddress,
    @Query('pairAddress') pairAddress?: ContractAddress,
  ): Promise<any> {
    return this.graphService.getGraph(
      graphType,
      timeFrame,
      tokenAddress,
      pairAddress,
    );
  }

  constructor(private readonly graphService: GraphService) {}
}
