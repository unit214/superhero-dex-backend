import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PairLiquidityInfoHistoryV2Error } from '@prisma/client';

@Injectable()
export class PairLiquidityInfoHistoryV2ErrorDbService {
  constructor(private prisma: PrismaService) {}

  getErrorByPairIdAndMicroBlockHashWithinHours(
    pairId: number,
    microBlockHash: string,
    transactionHash: string,
    logIndex: number,
    withinHours: number,
  ): Promise<PairLiquidityInfoHistoryV2Error | null> {
    return this.prisma.pairLiquidityInfoHistoryV2Error.findFirst({
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
      PairLiquidityInfoHistoryV2Error,
      'id' | 'timesOccurred' | 'createdAt' | 'updatedAt'
    >,
  ) {
    return this.prisma.pairLiquidityInfoHistoryV2Error.upsert({
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
