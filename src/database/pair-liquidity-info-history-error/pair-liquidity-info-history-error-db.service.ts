import { Injectable } from '@nestjs/common';
import { PairLiquidityInfoHistoryError } from '@prisma/client';

import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class PairLiquidityInfoHistoryErrorDbService {
  constructor(private prisma: PrismaService) {}

  getErrorByPairIdAndMicroBlockHashWithinHours(
    pairId: number,
    microBlockHash: string,
    withinHours: number,
  ): Promise<PairLiquidityInfoHistoryError | null> {
    return this.prisma.pairLiquidityInfoHistoryError.findFirst({
      where: {
        pairId: pairId,
        microBlockHash: microBlockHash,
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
        pairIdMicroBlockHashErrorUniqueIndex: {
          pairId: data.pairId,
          microBlockHash: data.microBlockHash,
          error: data.error,
        },
      },
      update: { timesOccurred: { increment: 1 } },
      create: {
        pairId: data.pairId,
        microBlockHash: data.microBlockHash,
        error: data.error,
      },
    });
  }
}
