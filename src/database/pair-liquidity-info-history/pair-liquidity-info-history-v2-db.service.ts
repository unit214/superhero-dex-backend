import { Injectable } from '@nestjs/common';
import { PairLiquidityInfoHistoryV2 } from '@prisma/client';

import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class PairLiquidityInfoHistoryV2DbService {
  constructor(private prisma: PrismaService) {}

  upsert(
    data: Omit<PairLiquidityInfoHistoryV2, 'id' | 'updatedAt' | 'createdAt'>,
  ) {
    return this.prisma.pairLiquidityInfoHistoryV2.upsert({
      where: {
        pairIdMicroBlockHashTxHashLogIndexUniqueIndex: {
          pairId: data.pairId,
          microBlockHash: data.microBlockHash,
          transactionHash: data.transactionHash,
          logIndex: data.logIndex,
        },
      },
      update: data,
      create: data,
    });
  }

  getLastlySyncedLogByPairId(pairId: number) {
    return this.prisma.pairLiquidityInfoHistoryV2.findFirst({
      where: {
        pairId,
      },
      orderBy: [
        { microBlockTime: 'desc' },
        { transactionIndex: 'desc' },
        { logIndex: 'desc' },
      ],
    });
  }
}