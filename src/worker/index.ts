import { Context } from '../lib/contracts';
import * as dal from '../dal';
import * as db from '@prisma/client';

export default (ctx: Context) => {
  const getSafeTokenId = async (address: string): Promise<number> => {
    const token = await dal.token.getByAddress(address);
    if (token) {
      return token.id;
    }
    const tokenMethods = await ctx.getToken(address);
    const { name, symbol, decimals } = await tokenMethods.metaInfo();
    const tokenFromDb = await dal.token.upsertToken(
      address,
      name,
      symbol,
      Number(decimals),
    );
    return tokenFromDb.id;
  };

  const insertNewPair = async (address: string) => {
    const instance = await ctx.getPair(address);
    const [token0Address, token1Address] = [
      await instance.token0(),
      await instance.token1(),
    ];

    const [token0Id, token1Id] = [
      await getSafeTokenId(token0Address),
      await getSafeTokenId(token1Address),
    ];

    return dal.pair.insert(address, token0Id, token1Id);
  };

  const refreshPairs = async () => {
    const allFactoryPairs = await ctx.factory.allPairs();
    const allDbPairsLen = await dal.pair.count();
    //get new pairs, and reverse it , because allFactoryPairs is reversed by the factory contract
    const newAddresses = allFactoryPairs
      .slice(0, allFactoryPairs.length - allDbPairsLen)
      .reverse();

    // insert new pairs one by one
    for (const pairAddress of newAddresses) {
      await insertNewPair(pairAddress);
    }
    // if there are new pairs let's go another round to ensure
    // no other pair was created during this time
    // otherwise there is nothing to be done here
    if (!newAddresses.length) {
      return newAddresses;
    }
    const futurePairs = await refreshPairs();
    return newAddresses.concat(futurePairs);
  };

  const refreshPairLiquidy = async (dbPair: db.Pair) => {
    const pair = await ctx.getPair(dbPair.address);
    const totalSupply = await pair.totalSupply();
    const { reserve0, reserve1 } = await pair.reserves();
    await dal.pair.synchronise(dbPair.id, totalSupply, reserve0, reserve1);
  };

  const refreshPairsLiquidity = async () => {
    //get the all pairs
    const dbPairs = await dal.pair.getAll();
    for (const dbPair of dbPairs) {
      await refreshPairLiquidy(dbPair);
    }
  };

  return {
    refreshPairsLiquidity,
    refreshPairs,
    unsyncAllPairs: dal.pair.unsyncAllPairs,
  };
};
