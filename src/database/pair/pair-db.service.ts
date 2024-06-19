import { Injectable } from '@nestjs/common';
import { Pair, Token } from '@prisma/client';

import { ContractAddress } from '@/clients/sdk-client.model';
import { PrismaService } from '@/database/prisma.service';
import { validTokenCondition } from '@/database/token/token-db.service';

export type PairWithTokens = { token0: Token; token1: Token } & Pair;
export type CountMode = 'all' | 'listed' | 'synchronized';

@Injectable()
export class PairDbService {
  constructor(private prisma: PrismaService) {}
  getAll(): Promise<PairWithTokens[]> {
    return this.prisma.pair.findMany({
      orderBy: [{ id: 'asc' }],
      include: {
        token0: true,
        token1: true,
      },
    });
  }

  getAllWithConditionAndAggregations(
    showInvalidTokens: boolean,
    onlyListed?: boolean,
    filterToken?: ContractAddress,
  ) {
    return this.prisma.$queryRaw<
      {
        address: string;
        token0: string;
        token1: string;
        synchronized: boolean;
        transactions: number;
        tvlUsd: number;
        volumeUsdDay: number;
        volumeUsdWeek: number;
        volumeUsdMonth: number;
        volumeUsdYear: number;
        volumeUsdAll: number;
      }[]
    >`
      SELECT
        p.address AS address,
        t0.address AS token0,
        t1.address AS token1,
        p.synchronized AS synchronized,
        COUNT(DISTINCT liquidity_history."transactionHash")::int AS transactions,
        CASE
          WHEN latest_liquidity_info."token0AePrice" >= 0
          AND latest_liquidity_info."token1AePrice" >= 0 THEN ROUND(
            (
              (
                latest_liquidity_info.reserve0 / POW (10, t0.decimals)
              ) * latest_liquidity_info."token0AePrice" * latest_liquidity_info."aeUsdPrice" + (
                latest_liquidity_info.reserve1 / POW (10, t1.decimals)
              ) * latest_liquidity_info."token1AePrice" * latest_liquidity_info."aeUsdPrice"
            )::numeric,
            4
          )
          ELSE 0
        END AS "tvlUsd",
        ROUND(
          SUM(
            CASE
              WHEN liquidity_history."token0AePrice" >= 0
              AND liquidity_history."token1AePrice" >= 0
              AND liquidity_history."eventType" = 'SwapTokens'
              AND liquidity_history."microBlockTime" >= extract(
                epoch
                FROM
                  NOW() - INTERVAL '1 DAY'
              ) * 1000 THEN (
                ABS(liquidity_history."deltaReserve0") / POW (10, t0.decimals)
              ) * liquidity_history."token0AePrice" * liquidity_history."aeUsdPrice" + (
                ABS(liquidity_history."deltaReserve1") / POW (10, t1.decimals)
              ) * liquidity_history."token1AePrice" * liquidity_history."aeUsdPrice"
            END
          )::numeric,
          4
        ) AS "volumeUsdDay",
        ROUND(
          SUM(
            CASE
              WHEN liquidity_history."token0AePrice" >= 0
              AND liquidity_history."token1AePrice" >= 0
              AND liquidity_history."eventType" = 'SwapTokens'
              AND liquidity_history."microBlockTime" >= extract(
                epoch
                FROM
                  NOW() - INTERVAL '1 WEEK'
              ) * 1000 THEN (
                ABS(liquidity_history."deltaReserve0") / POW (10, t0.decimals)
              ) * liquidity_history."token0AePrice" * liquidity_history."aeUsdPrice" + (
                ABS(liquidity_history."deltaReserve1") / POW (10, t1.decimals)
              ) * liquidity_history."token1AePrice" * liquidity_history."aeUsdPrice"
            END
          )::numeric,
          4
        ) AS "volumeUsdWeek",
        ROUND(
          SUM(
            CASE
              WHEN liquidity_history."token0AePrice" >= 0
              AND liquidity_history."token1AePrice" >= 0
              AND liquidity_history."eventType" = 'SwapTokens'
              AND liquidity_history."microBlockTime" >= extract(
                epoch
                FROM
                  NOW() - INTERVAL '1 MONTH'
              ) * 1000 THEN (
                ABS(liquidity_history."deltaReserve0") / POW (10, t0.decimals)
              ) * liquidity_history."token0AePrice" * liquidity_history."aeUsdPrice" + (
                ABS(liquidity_history."deltaReserve1") / POW (10, t1.decimals)
              ) * liquidity_history."token1AePrice" * liquidity_history."aeUsdPrice"
            END
          )::numeric,
          4
        ) AS "volumeUsdMonth",
        ROUND(
          SUM(
            CASE
              WHEN liquidity_history."token0AePrice" >= 0
              AND liquidity_history."token1AePrice" >= 0
              AND liquidity_history."eventType" = 'SwapTokens'
              AND liquidity_history."microBlockTime" >= extract(
                epoch
                FROM
                  NOW() - INTERVAL '1 YEAR'
              ) * 1000 THEN (
                ABS(liquidity_history."deltaReserve0") / POW (10, t0.decimals)
              ) * liquidity_history."token0AePrice" * liquidity_history."aeUsdPrice" + (
                ABS(liquidity_history."deltaReserve1") / POW (10, t1.decimals)
              ) * liquidity_history."token1AePrice" * liquidity_history."aeUsdPrice"
            END
          )::numeric,
          4
        ) AS "volumeUsdYear",
        ROUND(
          SUM(
            CASE
              WHEN liquidity_history."token0AePrice" >= 0
              AND liquidity_history."token1AePrice" >= 0
              AND liquidity_history."eventType" = 'SwapTokens' THEN (
                ABS(liquidity_history."deltaReserve0") / POW (10, t0.decimals)
              ) * liquidity_history."token0AePrice" * liquidity_history."aeUsdPrice" + (
                ABS(liquidity_history."deltaReserve1") / POW (10, t1.decimals)
              ) * liquidity_history."token1AePrice" * liquidity_history."aeUsdPrice"
            END
          )::numeric,
          4
        ) AS "volumeUsdAll"
      FROM
        "Pair" p
        LEFT JOIN LATERAL (
          SELECT
            *
          FROM
            "Token"
          WHERE
            p.t0 = id
        ) t0 ON TRUE
        LEFT JOIN LATERAL (
          SELECT
            *
          FROM
            "Token"
          WHERE
            p.t1 = id
        ) t1 ON TRUE
        LEFT JOIN LATERAL (
          SELECT
            *
          FROM
            "PairLiquidityInfoHistory"
          WHERE
            p.id = "pairId"
          ORDER BY
            "microBlockTime" DESC,
            "logIndex" DESC
          LIMIT
            1
        ) latest_liquidity_info ON TRUE
        LEFT JOIN "PairLiquidityInfoHistory" liquidity_history ON p.id = liquidity_history."pairId"
      WHERE
        CASE
          WHEN ${showInvalidTokens} THEN t0.malformed = FALSE
          AND t0."noContract" = FALSE
          AND t1.malformed = FALSE
          AND t1."noContract" = FALSE
          ELSE TRUE
        END
        AND CASE
          WHEN ${onlyListed} THEN t0.listed = TRUE
          AND t1.listed = TRUE
          ELSE TRUE
        END
        AND CASE
          WHEN ${!!filterToken} THEN t0.address = ${filterToken}
          OR t1.address = ${filterToken}
          ELSE TRUE
        END
      GROUP BY
        p.id,
        t0.address,
        t1.address,
        latest_liquidity_info."token0AePrice",
        latest_liquidity_info."token1AePrice",
        latest_liquidity_info."reserve0",
        latest_liquidity_info.reserve1,
        t0.decimals,
        t1.decimals,
        latest_liquidity_info."aeUsdPrice";
    `;
  }

  getAllWithCondition(showInvalidTokens: boolean, onlyListed?: boolean) {
    return this.prisma.pair.findMany({
      where: this.tokensCondition(showInvalidTokens, onlyListed),
      include: {
        token0: true,
        token1: true,
        liquidityInfoHistory: {
          select: {
            transactionHash: true,
          },
        },
      },
    });
  }

  async getAllAddresses() {
    return (
      await this.prisma.pair.findMany({
        select: {
          address: true,
        },
      })
    ).map((x) => x.address as ContractAddress);
  }

  async getTopHeight() {
    return (
      await this.prisma.pairLiquidityInfo.aggregate({
        _max: { height: true },
      })
    )._max.height;
  }

  getAllWithLiquidityInfo(showInvalidTokens: boolean, onlyListed?: boolean) {
    return this.prisma.pair.findMany({
      where: this.tokensCondition(showInvalidTokens, onlyListed),
      include: {
        token0: true,
        token1: true,
        liquidityInfo: true,
      },
    });
  }

  get(pairId: number): Promise<PairWithTokens | null> {
    return this.prisma.pair.findUnique({
      where: { id: pairId },
      include: { token0: true, token1: true },
    });
  }

  getOne(address: string) {
    return this.prisma.pair.findUnique({
      where: { address },
      include: { token0: true, token1: true, liquidityInfo: true },
    });
  }

  getOneLite(address: string) {
    return this.prisma.pair.findUnique({
      where: { address },
    });
  }

  count(showInvalidTokens: boolean, mode?: CountMode) {
    return this.prisma.pair.count({
      where: {
        ...this.tokensCondition(showInvalidTokens, mode === 'listed'),
        ...(mode === 'synchronized' ? { synchronized: true } : {}),
      },
    });
  }

  insert(address: string, token0: number, token1: number) {
    return this.prisma.pair.create({
      data: {
        address,
        t0: token0,
        t1: token1,
        liquidityInfo: undefined,
        synchronized: false,
      },
    });
  }

  insertByTokenAddresses(
    address: string,
    token0: ContractAddress,
    token1: ContractAddress,
  ) {
    return this.prisma.pair.create({
      select: {
        id: true,
        address: true,
        token0: true,
        token1: true,
        liquidityInfo: false,
        synchronized: false,
      },
      data: {
        address,
        token0: { connect: { address: token0 } },
        token1: { connect: { address: token1 } },
        liquidityInfo: undefined,
        synchronized: false,
      },
    });
  }

  synchronise(
    pairId: number,
    totalSupply: bigint,
    reserve0: bigint,
    reserve1: bigint,
    height: number,
  ) {
    const update = {
      totalSupply: totalSupply.toString(),
      reserve0: reserve0.toString(),
      reserve1: reserve1.toString(),
      height,
    };
    return this.prisma.pair.update({
      where: { id: pairId },
      select: {
        id: true,
        address: true,
        token0: true,
        token1: true,
        liquidityInfo: true,
        synchronized: true,
      },
      data: {
        liquidityInfo: { upsert: { update, create: update } },
        synchronized: true,
      },
    });
  }

  unsyncAllPairs() {
    return this.prisma.pair.updateMany({
      data: { synchronized: false },
    });
  }

  private tokenCondition = (
    showInvalidTokens: boolean,
    onlyListed?: boolean,
  ) => ({
    is: {
      ...(onlyListed ? { listed: true } : {}),
      ...(showInvalidTokens ? {} : validTokenCondition),
    },
  });

  private tokensCondition = (
    showInvalidTokens: boolean,
    onlyListed?: boolean,
  ) => {
    const condition = this.tokenCondition(showInvalidTokens, !!onlyListed);
    return {
      token0: condition,
      token1: condition,
    };
  };
}
