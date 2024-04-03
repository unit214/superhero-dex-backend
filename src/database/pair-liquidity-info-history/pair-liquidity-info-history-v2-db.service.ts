import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PairLiquidityInfoHistoryV2 } from '@prisma/client';

@Injectable()
export class PairLiquidityInfoHistoryV2DbService {
  constructor(private prisma: PrismaService) {}

  upsert(
    data: Omit<PairLiquidityInfoHistoryV2, 'id' | 'updatedAt' | 'createdAt'>,
  ) {
    return this.prisma.pairLiquidityInfoHistoryV2.upsert({
      where: {
        pairIdMicroBlockHashUniqueIndex: {
          pairId: data.pairId,
          microBlockHash: data.microBlockHash,
        },
      },
      update: {},
      create: data,
    });
  }

  getLastlySyncedLogByPairId(pairId: number) {
    return this.prisma.pairLiquidityInfoHistoryV2.findFirst({
      where: {
        pairId,
      },
      orderBy: [{ microBlockTime: 'desc' }, { logIndex: 'desc' }],
    });
  }
}
