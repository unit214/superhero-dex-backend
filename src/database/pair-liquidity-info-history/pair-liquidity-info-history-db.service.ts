import { Injectable } from '@nestjs/common';
import { PairLiquidityInfoHistory } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { OrderQueryEnum } from '@/api/api.model';
import { ContractAddress } from '@/clients/sdk-client.model';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class PairLiquidityInfoHistoryDbService {
  constructor(private prisma: PrismaService) {}

  upsert(
    data: Omit<
      PairLiquidityInfoHistory,
      'id' | 'updatedAt' | 'createdAt' | 'token0AePrice' | 'token1AePrice'
    >,
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

  update(id: number, data: Partial<PairLiquidityInfoHistory>) {
    return this.prisma.pairLiquidityInfoHistory.update({
      where: {
        id,
      },
      data,
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
        pair: {
          include: {
            token0: true,
            token1: true,
          },
        },
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

  getEntriesWithoutAePrice() {
    return this.prisma.pairLiquidityInfoHistory.findMany({
      where: {
        token0AePrice: null,
        token1AePrice: null,
      },
      include: {
        pair: true,
      },
      orderBy: [
        { microBlockTime: 'asc' },
        { transactionIndex: 'asc' },
        { logIndex: 'asc' },
      ],
    });
  }

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

  getLatestEntryForAllPairsAtTime(microBlockTime: bigint) {
    // This query is not supported by Prisma, so we use $queryRaw
    return this.prisma.$queryRaw<
      {
        id: number;
        pairId: number;
        reserve0: Decimal;
        reserve1: Decimal;
        token0AePrice: Decimal;
        token1AePrice: Decimal;
        t0: number;
        t1: number;
      }[]
    >`
        WITH ranked_entries AS (SELECT e.*, ROW_NUMBER() OVER (PARTITION BY "pairId" ORDER BY "microBlockTime" DESC) AS re
                                FROM "PairLiquidityInfoHistory" AS e
                                WHERE "microBlockTime" <= ${microBlockTime})
        SELECT r."id",
               r."pairId",
               r."reserve0",
               r."reserve1",
               r."token0AePrice",
               r."token1AePrice",
               p.t0,
               p.t1
        FROM ranked_entries r
                 LEFT JOIN "Pair" p ON r."pairId" = p.id
        WHERE re = 1
          AND "reserve0" > 0
          AND "reserve1" > 0;`;
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
