import { Token } from '@prisma/client';
import prisma from './client';
import { ContractAddress } from '../lib/utils';

export const getAll = (): Promise<Token[]> => prisma.token.findMany({});

export const getListed = (): Promise<Token[]> =>
  prisma.token.findMany({ where: { listed: true } });

export const getByAddress = (address: string) =>
  prisma.token.findFirst({
    where: { address },
  });

export const updateListedValue = (address: string, listed: boolean) =>
  prisma.token.update({
    where: { address },
    data: { listed },
  });

export const getByAddressWithPairs = (address: string) =>
  prisma.token.findFirst({
    where: { address },
    include: { pairs0: true, pairs1: true },
  });

export const getByAddressWithPairsAndLiquidity = (address: string) =>
  prisma.token.findFirst({
    where: { address },
    include: {
      pairs0: { include: { token1: true, liquidityInfo: true } },
      pairs1: { include: { token0: true, liquidityInfo: true } },
    },
  });

export const getAllAddresses = async (): Promise<ContractAddress[]> =>
  (
    await prisma.token.findMany({
      select: {
        address: true,
      },
    })
  ).map((x) => x.address as ContractAddress);

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
