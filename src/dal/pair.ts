import { Pair } from '@prisma/client';
import prisma from './client';

export const getAll = (): Promise<Pair[]> => prisma.pair.findMany({});

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
    data: {
      liquidityInfo: { upsert: { update, create: update } },
      synchronized: true,
    },
  });
};
