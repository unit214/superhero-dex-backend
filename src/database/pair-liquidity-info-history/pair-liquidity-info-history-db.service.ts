import { Injectable } from '@nestjs/common';
import { PairLiquidityInfoHistory } from '@prisma/client';

import { OrderQueryEnum } from '@/api/api.model';
import { ContractAddress } from '@/clients/sdk-client.model';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class PairLiquidityInfoHistoryDbService {
  constructor(private prisma: PrismaService) {}

  upsert(
    data: Omit<PairLiquidityInfoHistory, 'id' | 'updatedAt' | 'createdAt'>,
  ) {
    return this.prisma.pairLiquidityInfoHistory.upsert({
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

  getAll = (
    limit: number,
    offset: number,
    order?: OrderQueryEnum,
    pairAddress?: ContractAddress,
    height?: number,
    fromBlockTime?: bigint,
    toBlockTime?: bigint,
  ) =>
    this.prisma.pairLiquidityInfoHistory.findMany({
      where: {
        pair: pairAddress ? { address: { equals: pairAddress } } : {},
        height: height != null ? { equals: height } : {},
        microBlockTime: {
          gte: fromBlockTime,
          lte: toBlockTime,
        },
      },
      include: {
        pair: true,
      },
      orderBy:
        order != null
          ? [
              { microBlockTime: order },
              { transactionIndex: order },
              { logIndex: order },
            ]
          : {},
      take: limit,
      skip: offset,
    });

  getLastlySyncedLogByPairId(pairId: number) {
    return this.prisma.pairLiquidityInfoHistory.findFirst({
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

  getWithinHeightSortedWithPair(heightLimit: number) {
    return this.prisma.pairLiquidityInfoHistory.findMany({
      where: {
        height: {
          gte: heightLimit,
        },
      },
      orderBy: [
        { microBlockTime: 'asc' },
        { transactionIndex: 'asc' },
        { logIndex: 'asc' },
      ],
      include: {
        pair: {
          include: {
            token0: true,
            token1: true,
          },
        },
      },
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
