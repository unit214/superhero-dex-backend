import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';

import { microBlockTimePattern, usdValuePattern } from '@/api/api.model';

export enum TimeFrame {
  '1H' = '1H',
  '1D' = '1D',
  '1W' = '1W',
  '1M' = '1M',
  '1Y' = '1Y',
  MAX = 'MAX',
}

export enum GraphType {
  TVL = 'TVL',
  Volume = 'Volume',
  Price = 'Price',
  Price0_1 = 'Price0_1',
  Price1_0 = 'Price1_0',
  Locked = 'Locked',
  Fees = 'Fees',
}

export class GraphData {
  @ApiProperty({
    description: 'Label',
    example: GraphType.TVL,
  })
  label: GraphType;
  @ApiProperty({
    description: 'Data',
    pattern: usdValuePattern,
    type: [String],
  })
  data: string[];
}

@ApiExtraModels(GraphData)
export class Graph {
  @ApiProperty({
    description: 'Datasets',
    type: 'array',
    items: { $ref: getSchemaPath(GraphData) },
  })
  datasets: GraphData[];
  @ApiProperty({
    description: 'Labels',
    pattern: microBlockTimePattern,
    type: [String],
  })
  labels: string[];
}
