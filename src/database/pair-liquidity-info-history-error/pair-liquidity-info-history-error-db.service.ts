import { Injectable } from '@nestjs/common';
import { PairLiquidityInfoHistoryError } from '@prisma/client';

import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class PairLiquidityInfoHistoryErrorDbService {
  constructor(private prisma: PrismaService) {}

  getErrorWithinHours(
    pairId: number,
    microBlockHash: string,
    transactionHash: string,
    logIndex: number,
    withinHours: number,
  ): Promise<PairLiquidityInfoHistoryError | null> {
    return this.prisma.pairLiquidityInfoHistoryError.findFirst({
      where: {
        pairId: pairId,
        microBlockHash: microBlockHash,
        transactionHash: transactionHash,
        logIndex: logIndex,
        updatedAt: {
          gt: new Date(Date.now() - withinHours * 60 * 60 * 1000),
        },
      },
    });
  }

  upsert(
    data: Omit<
      PairLiquidityInfoHistoryError,
      'id' | 'timesOccurred' | 'createdAt' | 'updatedAt'
    >,
  ) {
    return this.prisma.pairLiquidityInfoHistoryError.upsert({
      where: {
        pairIdMicroBlockHashTxHashLogIndexErrorUniqueIndex: {
          pairId: data.pairId,
          microBlockHash: data.microBlockHash,
          transactionHash: data.transactionHash,
          logIndex: data.logIndex,
          error: data.error,
        },
      },
      update: { timesOccurred: { increment: 1 } },
      create: {
        pairId: data.pairId,
        microBlockHash: data.microBlockHash,
        transactionHash: data.transactionHash,
        logIndex: data.logIndex,
        error: data.error,
      },
    });
  }
}
