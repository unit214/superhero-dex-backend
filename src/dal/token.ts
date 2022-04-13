import { Token } from '@prisma/client';
import prisma from './client';

export const getAll = (): Promise<Token[]> => prisma.token.findMany({});

export const getListed = (): Promise<Token[]> =>
  prisma.token.findMany({ where: { listed: true } });

export const getByAddress = (address: string) =>
  prisma.token.findFirst({
    where: { address },
  });

export const getByAddressWithPairs = (address: string) =>
  prisma.token.findFirst({
    where: { address },
    include: { pairs0: true, pairs1: true },
  });

export const upsertToken = (
  address: string,
  symbol: string,
  name: string,
  decimals: number,
): Promise<Token> =>
  prisma.token.upsert({
    where: {
      address,
    },
    update: { symbol, name, decimals },
    create: { address, symbol, name, decimals },
  });
