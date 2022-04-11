import { Token } from '@prisma/client';
import prisma from './client';

export const getAll = (): Promise<Token[]> => prisma.token.findMany({});

export const getByAddress = (address: string) =>
  prisma.token.findFirst({
    where: { address },
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
