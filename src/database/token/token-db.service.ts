import { Injectable } from '@nestjs/common';
import { Token } from '@prisma/client';

import { ContractAddress } from '@/clients/sdk-client.model';
import { PrismaService } from '@/database/prisma.service';

export const validTokenCondition = { malformed: false, noContract: false };

@Injectable()
export class TokenDbService {
  constructor(private prisma: PrismaService) {}

  getAll(showInvalidTokens: boolean): Promise<Token[]> {
    return this.prisma.token.findMany({
      where: showInvalidTokens ? {} : validTokenCondition,
    });
  }

  getAllWithAggregation(showInvalidTokens: boolean) {
    return this.prisma.$queryRaw<
      {
        address: string;
        symbol: string;
        name: string;
        decimals: number;
        malformed: boolean;
        noContract: boolean;
        listed: boolean;
        priceAe: string;
        priceUsd: number;
        fdvAe: string;
        fdvUsd: number;
        totalReserve: string;
        pairs: number;
        volumeUsdDay: number;
        volumeUsdWeek: number;
        volumeUsdMonth: number;
        volumeUsdYear: number;
        volumeUsdAll: number;
      }[]
    >`
      SELECT
        t.address,
        t.symbol,
        t.name,
        t.decimals,
        t.malformed,
        t."noContract",
        t.listed,
        SUM(
          CASE
            WHEN t.id = p.t0 THEN (latest_liquidity_info."token0AePrice") * (
              latest_liquidity_info."reserve0" / POW (10, t.decimals)
            )
            ELSE (latest_liquidity_info."token1AePrice") * (
              latest_liquidity_info."reserve1" / POW (10, t.decimals)
            )
          END / total_reserve (t.id)
        ) AS "priceAe",
        ROUND(
          SUM(
            CASE
              WHEN t.id = p.t0 THEN (latest_liquidity_info."token0AePrice") * (
                latest_liquidity_info."reserve0" / POW (10, t.decimals)
              )
              ELSE (latest_liquidity_info."token1AePrice") * (
                latest_liquidity_info."reserve1" / POW (10, t.decimals)
              )
            END * latest_liquidity_info."aeUsdPrice" / total_reserve (t.id)
          )::numeric,
          4
        ) AS "priceUsd",
        SUM(
          CASE
            WHEN t.id = p.t0 THEN (latest_liquidity_info."token0AePrice") * (
              latest_liquidity_info."reserve0" / POW (10, t.decimals)
            )
            ELSE (latest_liquidity_info."token1AePrice") * (
              latest_liquidity_info."reserve1" / POW (10, t.decimals)
            )
          END
        ) AS "fdvAe",
        ROUND(
          SUM(
            CASE
              WHEN t.id = p.t0 THEN (latest_liquidity_info."token0AePrice") * (
                latest_liquidity_info."reserve0" / POW (10, t.decimals)
              )
              ELSE (latest_liquidity_info."token1AePrice") * (
                latest_liquidity_info."reserve1" / POW (10, t.decimals)
              )
            END * latest_liquidity_info."aeUsdPrice"
          )::numeric,
          4
        ) AS "fdvUsd",
        total_reserve (t.id) AS "totalReserve",
        count(p.id) AS "pairs",
        volume_usd (t.id, INTERVAL '1 DAY') AS "volumeUsdDay",
        volume_usd (t.id, INTERVAL '1 WEEK') AS "volumeUsdWeek",
        volume_usd (t.id, INTERVAL '1 YEAR') AS "volumeUsdYear",
        volume_usd (t.id, INTERVAL '100 YEAR') AS "volumeUsdAll"
      FROM
        "Token" t
        LEFT JOIN public."Pair" p ON t.id = p.t0
        OR t.id = p.t1
        LEFT JOIN LATERAL (
          SELECT
            *
          FROM
            "PairLiquidityInfoHistory"
          WHERE
            p.id = "pairId"
            AND "token0AePrice" >= 0
            AND "token1AePrice" >= 0
          ORDER BY
            "microBlockTime" DESC,
            "logIndex" DESC
          LIMIT
            1
        ) latest_liquidity_info ON TRUE
      WHERE
        CASE
          WHEN ${showInvalidTokens} THEN t.malformed = FALSE
          AND t."noContract" = FALSE
          ELSE TRUE
        END
      GROUP BY
        t.id
    `;
  }

  getListed(): Promise<Token[]> {
    //there is no reason to list invalid tokens
    return this.prisma.token.findMany({
      where: { ...validTokenCondition, listed: true },
    });
  }

  getByAddress(address: string) {
    return this.prisma.token.findFirst({
      where: { address },
    });
  }

  async updateListedValue(address: string, listed: boolean) {
    //ensure the token is valid in order to be listed
    if (listed) {
      const exists = await this.prisma.token.findFirst({
        where: { address },
        select: { malformed: true, noContract: true },
      });
      if (exists?.malformed || exists?.noContract) {
        throw new Error("An invalid token can't be listed");
      }
    }
    return this.prisma.token.update({
      //we don't want to list invalid tokens
      where: { address },
      data: { listed },
    });
  }

  getByAddressWithPairs(address: string) {
    return this.prisma.token.findFirst({
      where: { address },
      include: { pairs0: true, pairs1: true },
    });
  }

  count(showInvalidTokens: boolean, onlyListed?: boolean) {
    return this.prisma.token.count({
      where: {
        ...(onlyListed ? { listed: true } : {}),
        ...(() => (showInvalidTokens ? {} : validTokenCondition))(),
      },
    });
  }

  getByAddressWithPairsAndLiquidity(address: string) {
    return this.prisma.token.findFirst({
      where: { address },
      include: {
        pairs0: { include: { token1: true, liquidityInfo: true } },
        pairs1: { include: { token0: true, liquidityInfo: true } },
      },
    });
  }

  async getAllAddresses(
    showInvalidTokens: boolean,
  ): Promise<ContractAddress[]> {
    return (
      await this.prisma.token.findMany({
        where: showInvalidTokens ? {} : validTokenCondition,
        select: {
          address: true,
        },
      })
    ).map((x) => x.address as ContractAddress);
  }

  upsertToken(
    address: string,
    symbol: string,
    name: string,
    decimals: number,
  ): Promise<Token> {
    return this.commonUpsert(address, {
      symbol,
      name,
      decimals,
      noContract: false,
      malformed: false,
    });
  }

  upsertMalformedToken(address: string): Promise<Token> {
    return this.commonUpsert(address, { malformed: true, noContract: false });
  }

  upsertNoContractForToken(address: string): Promise<Token> {
    return this.commonUpsert(address, { malformed: false, noContract: true });
  }

  private commonUpsert(
    address: string,
    common: Partial<Token>,
  ): Promise<Token> {
    return this.prisma.token.upsert({
      where: {
        address,
      },
      update: common,
      create: { address, ...common },
    });
  }
}
