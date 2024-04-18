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

  getAllWithCondition(showInvalidTokens: boolean, onlyListed?: boolean) {
    return this.prisma.pair.findMany({
      where: this.tokensCondition(showInvalidTokens, onlyListed),
      include: {
        token0: true,
        token1: true,
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
