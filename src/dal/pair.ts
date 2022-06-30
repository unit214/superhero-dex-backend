import prisma from './client';
import { ContractAddress } from '../lib/utils';
import { validTokenCondition } from './token';

const tokenCondition = (showInvalidTokens: boolean, onlyListed?: boolean) => ({
  is: {
    ...(onlyListed ? { listed: true } : {}),
    ...(showInvalidTokens ? {} : validTokenCondition),
  },
});

const tokensCondition = (showInvalidTokens: boolean, onlyListed?: boolean) => {
  const condition = tokenCondition(showInvalidTokens, !!onlyListed);
  return {
    token0: condition,
    token1: condition,
  };
};

export const getAllAddresses = async () =>
  (
    await prisma.pair.findMany({
      select: {
        address: true,
      },
    })
  ).map((x) => x.address as ContractAddress);

export const getAll = (showInvalidTokens: boolean, onlyListed?: boolean) =>
  prisma.pair.findMany({
    where: tokensCondition(showInvalidTokens, onlyListed),
    include: {
      token0: true,
      token1: true,
    },
  });

export const getTopHeight = async () =>
  (
    await prisma.pairLiquidityInfo.aggregate({
      _max: { height: true },
    })
  )._max.height;

export const getAllWithLiquidityInfo = (
  showInvalidTokens: boolean,
  onlyListed?: boolean,
) =>
  prisma.pair.findMany({
    where: tokensCondition(showInvalidTokens, onlyListed),
    include: {
      token0: true,
      token1: true,
      liquidityInfo: true,
    },
  });

export const getOne = (address: string) =>
  prisma.pair.findUnique({
    where: { address },
    include: { token0: true, token1: true, liquidityInfo: true },
  });

export const getOneLite = (address: string) =>
  prisma.pair.findUnique({
    where: { address },
  });

export type CountMode = 'all' | 'listed' | 'synchronized';
export const count = (showInvalidTokens: boolean, mode?: CountMode) =>
  prisma.pair.count({
    where: {
      ...tokensCondition(showInvalidTokens, mode === 'listed'),
      ...(mode === 'synchronized' ? { synchronized: true } : {}),
    },
  });

export const insert = (address: string, token0: number, token1: number) =>
  prisma.pair.create({
    data: {
      address,
      t0: token0,
      t1: token1,
      liquidityInfo: undefined,
      synchronized: false,
    },
  });

export const insertByTokenAddresses = (
  address: string,
  token0: ContractAddress,
  token1: ContractAddress,
) =>
  prisma.pair.create({
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

export const synchronise = async (
  pairId: number,
  totalSupply: bigint,
  reserve0: bigint,
  reserve1: bigint,
  height: number,
) => {
  const update = {
    totalSupply: totalSupply.toString(),
    reserve0: reserve0.toString(),
    reserve1: reserve1.toString(),
    height,
  };
  return prisma.pair.update({
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
};

export const unsyncAllPairs = async () =>
  prisma.pair.updateMany({
    data: { synchronized: false },
  });
