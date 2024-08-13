import { Injectable } from '@nestjs/common';
import { Prisma, Token } from '@prisma/client';

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
        priceUsd: string;
        tvlAe: string;
        tvlUsd: string;
        totalReserve: string;
        pairs: number;
        volumeUsdDay: string;
        volumeUsdWeek: string;
        volumeUsdMonth: string;
        volumeUsdYear: string;
        volumeUsdAll: string;
        priceChangeDay: string;
        priceChangeWeek: string;
        priceChangeMonth: string;
        priceChangeYear: string;
      }[]
    >(this.getWithAggregationQuery(showInvalidTokens, null));
  }

  async getWithAggregation(address: string) {
    return this.prisma
      .$queryRaw<{
        address: string;
        symbol: string;
        name: string;
        decimals: number;
        malformed: boolean;
        noContract: boolean;
        listed: boolean;
        priceAe: string;
        priceUsd: string;
        tvlAe: string;
        tvlUsd: string;
        totalReserve: string;
        pairs: number;
        volumeUsdDay: string;
        volumeUsdWeek: string;
        volumeUsdMonth: string;
        volumeUsdYear: string;
        volumeUsdAll: string;
        priceChangeDay: string;
        priceChangeWeek: string;
        priceChangeMonth: string;
        priceChangeYear: string;
      }>(this.getWithAggregationQuery(true, address))
      .then((x) => x[0]);
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

  private getWithAggregationQuery(
    showInvalidTokens: boolean,
    tokenAddress: string | null,
  ) {
    const hasAddressFilter: boolean = tokenAddress !== null;
    return Prisma.sql`
      SELECT
        t.address,
        t.symbol,
        t.name,
        t.decimals,
        t.malformed,
        t."noContract",
        t.listed,
        ROUND(
          SUM(
            CASE
              WHEN t.id = p.t0 THEN (latest_liquidity_info."token0AePrice") * (
                latest_liquidity_info."reserve0" / POW (10, t.decimals)
              )
              ELSE (latest_liquidity_info."token1AePrice") * (
                latest_liquidity_info."reserve1" / POW (10, t.decimals)
              )
            END / total_reserve (t.id, INTERVAL '0 DAY')
          )::numeric,
          18
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
            END * latest_liquidity_info."aeUsdPrice" / total_reserve (t.id, INTERVAL '0 DAY')
          )::numeric,
          4
        ) AS "priceUsd",
        ROUND(
          SUM(
            CASE
              WHEN t.id = p.t0 THEN (latest_liquidity_info."token0AePrice") * (
                latest_liquidity_info."reserve0" / POW (10, t.decimals)
              )
              ELSE (latest_liquidity_info."token1AePrice") * (
                latest_liquidity_info."reserve1" / POW (10, t.decimals)
              )
            END
          )::numeric,
          18
        ) AS "tvlAe",
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
        ) AS "tvlUsd",
        total_reserve (t.id, INTERVAL '0 DAY') AS "totalReserve",
        count(p.id)::integer AS "pairs",
        volume_usd (t.id, INTERVAL '1 DAY') AS "volumeUsdDay",
        volume_usd (t.id, INTERVAL '1 WEEK') AS "volumeUsdWeek",
        volume_usd (t.id, INTERVAL '1 MONTH') AS "volumeUsdMonth",
        volume_usd (t.id, INTERVAL '1 YEAR') AS "volumeUsdYear",
        volume_usd (t.id, INTERVAL '100 YEAR') AS "volumeUsdAll",
        (
          (
            historic_price (t.id, INTERVAL '0 DAY') - historic_price (t.id, INTERVAL '1 DAY')
          ) / historic_price (t.id, INTERVAL '1 DAY')
        ) * 100 AS "priceChangeDay",
        (
          (
            historic_price (t.id, INTERVAL '0 DAY') - historic_price (t.id, INTERVAL '1 WEEK')
          ) / historic_price (t.id, INTERVAL '1 WEEK')
        ) * 100 AS "priceChangeWeek",
        (
          (
            historic_price (t.id, INTERVAL '0 DAY') - historic_price (t.id, INTERVAL '1 MONTH')
          ) / historic_price (t.id, INTERVAL '1 MONTH')
        ) * 100 AS "priceChangeMonth",
        (
          (
            historic_price (t.id, INTERVAL '0 DAY') - historic_price (t.id, INTERVAL '1 YEAR')
          ) / historic_price (t.id, INTERVAL '1 YEAR')
        ) * 100 AS "priceChangeYear"
      FROM
        "Token" t
        LEFT JOIN "Pair" p ON t.id = p.t0
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
          WHEN NOT ${showInvalidTokens} THEN t.malformed = FALSE
          AND t."noContract" = FALSE
          ELSE TRUE
        END
        AND
        CASE
           WHEN ${hasAddressFilter} THEN t.address = ${tokenAddress}
           ELSE TRUE
        END
      GROUP BY
        t.id
      LIMIT
      CASE
        WHEN ${hasAddressFilter} THEN 1
        ELSE NULL
      END
    `;
  }
}
