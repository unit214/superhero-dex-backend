import { Context } from '../lib/contracts';
import * as db from '../dal';

const getSafeTokenId = async (
  ctx: Context,
  address: string,
): Promise<number> => {
  const token = await db.token.getByAddress(address);
  if (token) {
    return token.id;
  }
  const tokenMethods = await ctx.getToken(address);
  const { name, symbol, decimals } = await tokenMethods.metaInfo();
  const tokenFromDb = await db.token.upsertToken(
    address,
    name,
    symbol,
    Number(decimals),
  );
  return tokenFromDb.id;
};

const insertNewPair = async (ctx: Context, address: string) => {
  const instance = await ctx.getPair(address);
  const [token0Address, token1Address] = [
    await instance.token0(),
    await instance.token1(),
  ];

  const [token0Id, token1Id] = [
    await getSafeTokenId(ctx, token0Address),
    await getSafeTokenId(ctx, token1Address),
  ];

  return db.pair.insert(address, token0Id, token1Id);
};

export const refreshPairs = async (ctx: Context) => {
  const allFactoryPairs = await ctx.factory.allPairs();
  const allDbPairsLen = await db.pair.count();
  //get new pairs, and reverse it , because allFactoryPairs is reversed by the factory contract
  const newAddresses = allFactoryPairs
    .slice(0, allFactoryPairs.length - allDbPairsLen)
    .reverse();

  // insert new pairs one by one
  for (const pairAddress of newAddresses) {
    await insertNewPair(ctx, pairAddress);
  }
  // if there are new pairs let's go another round to ensure
  // no other pair was created during this time
  // otherwise there is nothing to be done here
  if (!newAddresses.length) {
    return newAddresses;
  }
  const futurePairs = await refreshPairs(ctx);
  return newAddresses.concat(futurePairs);
};
