import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PairLiquidityInfoHistory } from '@prisma/client';

@Injectable()
export class PairLiquidityInfoHistoryService {
  constructor(private prisma: PrismaService) {}

  getCountByPairId(pairId: number) {
    return this.prisma.pairLiquidityInfoHistory.count({
      where: {
        pairId: pairId,
      },
    });
  }
  getLastlySyncedBlockByPairId(pairId: number) {
    return this.prisma.pairLiquidityInfoHistory.findFirst({
      where: {
        pairId,
      },
      orderBy: [{ height: 'desc' }, { microBlockTime: 'desc' }],
      select: {
        height: true,
        microBlockTime: true,
      },
    });
  }

  getWithinHeightSorted(heightLimit: number) {
    return this.prisma.pairLiquidityInfoHistory.findMany({
      where: {
        height: {
          gte: heightLimit,
        },
      },
      orderBy: {
        microBlockTime: 'asc',
      },
    });
  }

  upsert(data: Omit<PairLiquidityInfoHistory, 'id' | 'updatedAt'>) {
    return this.prisma.pairLiquidityInfoHistory.upsert({
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

  deleteFromMicroBlockTime(microBlockTime: bigint) {
    return this.prisma.pairLiquidityInfoHistory.deleteMany({
      where: {
        microBlockTime: {
          gte: microBlockTime,
        },
      },
    });
  }
}
