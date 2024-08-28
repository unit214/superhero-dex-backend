import { CacheInterceptor } from '@nestjs/cache-manager';
import {
  Controller,
  Get,
  ParseEnumPipe,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';

import { Graph, GraphType, TimeFrame } from '@/api/graph/graph.model';
import { GraphService } from '@/api/graph/graph.service';
import { ContractAddress } from '@/clients/sdk-client.model';

@UseInterceptors(CacheInterceptor)
@Controller('graph')
export class GraphController {
  @Get()
  @ApiQuery({
    name: 'graphType',
    enum: GraphType,
    description: 'Desired Graph Type',
    required: true,
  })
  @ApiQuery({
    name: 'timeFrame',
    enum: TimeFrame,
    description: 'Desired Time Frame (Default: MAX)',
    required: false,
  })
  @ApiQuery({
    name: 'tokenAddress',
    type: String,
    description: 'Get graph for specific token',
    required: false,
  })
  @ApiQuery({
    name: 'pairAddress',
    type: String,
    description: 'Get graph for specific pair',
    required: false,
  })
  @ApiResponse({ status: 200, type: Graph })
  async get(
    @Query('graphType', new ParseEnumPipe(GraphType))
    graphType: GraphType,
    @Query('timeFrame', new ParseEnumPipe(TimeFrame, { optional: true }))
    timeFrame?: TimeFrame,
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
