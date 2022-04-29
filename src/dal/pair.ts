import prisma from './client';
import { ContractAddress } from '../lib/utils';
const onlyListedCondition = {
  token0: { is: { listed: true } },
  token1: { is: { listed: true } },
};

export const getAllAddresses = async () =>
  (
    await prisma.pair.findMany({
      select: {
        address: true,
      },
    })
  ).map((x) => x.address);

export const getAll = (onlyListed?: boolean) =>
  prisma.pair.findMany({
    where: onlyListed ? onlyListedCondition : {},
    include: {
      token0: true,
      token1: true,
    },
  });

export const getAllWithLiquidityInfo = (onlyListed?: boolean) =>
  prisma.pair.findMany({
    where: onlyListed ? onlyListedCondition : {},
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

export const count = () => prisma.pair.count();

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
) => {
  const update = {
    totalSupply: totalSupply.toString(),
    reserve0: reserve0.toString(),
    reserve1: reserve1.toString(),
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
