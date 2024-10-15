import { ApiProperty } from '@nestjs/swagger';

import {
  bigNumberExample,
  bigNumberPattern,
  microBlockTimePattern,
} from '@/api/api.model';

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
  PriceToken1InToken0 = 'PriceToken1InToken0',
  PriceToken0InToken1 = 'PriceToken0InToken1',
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
    example: bigNumberExample,
    type: [String],
  })
  data: string[];
}
