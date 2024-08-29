import { ApiProperty } from '@nestjs/swagger';

import { bigNumberPattern, microBlockTimePattern } from '@/api/api.model';

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

export class Graph {
  @ApiProperty({
    description: 'Graph type',
    example: GraphType.TVL,
  })
  graphType: GraphType;
  @ApiProperty({
    description: 'Time frame',
    example: TimeFrame.MAX,
  })
  timeFrame: TimeFrame;
  @ApiProperty({
    description: 'Labels / X-Axis',
    pattern: microBlockTimePattern,
    type: [String],
  })
  labels: string[];
  @ApiProperty({
    description: 'Data / Y-Axis',
    pattern: bigNumberPattern,
    type: [String],
  })
  data: string[];
}
