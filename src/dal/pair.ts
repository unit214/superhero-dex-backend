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
