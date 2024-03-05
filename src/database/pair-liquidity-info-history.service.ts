import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PairLiquidityInfoHistory } from '@prisma/client';

@Injectable()
export class PairLiquidityInfoHistoryService {
  constructor(private prisma: PrismaService) {}

  getLastSyncedHeight(pairId: number) {
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

  upsertPaidLiquidityState(data: Omit<PairLiquidityInfoHistory, 'id'>) {
    return this.prisma.pairLiquidityInfoHistory.upsert({
      where: {
        pairIdHeightUniqueIndex: {
          pairId: data.pairId,
          microBlockHash: data.microBlockHash,
        },
      },
      update: {},
      create: data,
    });
  }
}
