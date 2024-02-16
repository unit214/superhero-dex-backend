import { Token } from '@prisma/client';
import prisma from './client';
import { ContractAddress } from '../lib/utils';

export const validTokenCondition = { malformed: false, noContract: false };

export const getAll = (showInvalidTokens: boolean): Promise<Token[]> =>
  prisma.token.findMany({
    where: showInvalidTokens ? {} : validTokenCondition,
  });

export const getListed = (): Promise<Token[]> =>
  //there is no reason to list invalid tokens
  prisma.token.findMany({ where: { ...validTokenCondition, listed: true } });

export const getByAddress = (address: string) =>
  prisma.token.findFirst({
    where: { address },
  });

export const updateListedValue = async (address: string, listed: boolean) => {
  //ensure the token is valid in order to be listed
  if (listed) {
    const exists = await prisma.token.findFirst({
      where: { address },
      select: { malformed: true, noContract: true },
    });
    if (exists?.malformed || exists?.noContract) {
      throw new Error("An invalid token can't be listed");
    }
  }
  return prisma.token.update({
    //we don't want to list invalid tokens
    where: { address },
    data: { listed },
  });
};

export const getByAddressWithPairs = (address: string) =>
  prisma.token.findFirst({
    where: { address },
    include: { pairs0: true, pairs1: true },
  });

export const count = (showInvalidTokens: boolean, onlyListed?: boolean) =>
  prisma.token.count({
    where: {
      ...(onlyListed ? { listed: true } : {}),
      ...(() => (showInvalidTokens ? {} : validTokenCondition))(),
    },
  });

export const getByAddressWithPairsAndLiquidity = (address: string) =>
  prisma.token.findFirst({
    where: { address },
    include: {
      pairs0: { include: { token1: true, liquidityInfo: true } },
      pairs1: { include: { token0: true, liquidityInfo: true } },
    },
  });

export const getAllAddresses = async (
  showInvalidTokens: boolean,
): Promise<ContractAddress[]> =>
  (
    await prisma.token.findMany({
      where: showInvalidTokens ? {} : validTokenCondition,
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
  commonUpsert(address, {
    symbol,
    name,
    decimals,
    noContract: false,
    malformed: false,
  });

export const upsertMalformedToken = (address: string): Promise<Token> =>
  commonUpsert(address, { malformed: true, noContract: false });

export const upsertNoContractForToken = (address: string): Promise<Token> =>
  commonUpsert(address, { malformed: false, noContract: true });

const commonUpsert = (
  address: string,
  common: Partial<Token>,
): Promise<Token> =>
  prisma.token.upsert({
    where: {
      address,
    },
    update: common,
    create: { address, ...common },
  });
