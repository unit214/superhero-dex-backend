import { Context } from '../lib/contracts';
import * as dal from '../dal';
import * as db from '@prisma/client';

import { Logger } from '@nestjs/common';
const logger = new Logger('Worker');

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

    const ret = await dal.pair.insert(address, token0Id, token1Id);
    logger.debug(`${address} pair inserted`);
    return ret;
  };

  const refreshPairs = async () => {
    logger.log(`Getting all pairs from Factory...`);
    const allFactoryPairs = await ctx.factory.allPairs();
    logger.log(`${allFactoryPairs.length} pairs found on DEX`);
    const allDbPairsLen = await dal.pair.count();
    //get new pairs, and reverse it , because allFactoryPairs is reversed by the factory contract
    const newAddresses = allFactoryPairs
      .slice(0, allFactoryPairs.length - allDbPairsLen)
      .reverse();

    logger.log(`${newAddresses.length} new pairs found`);
    // insert new pairs one by one
    for (const pairAddress of newAddresses) {
      await insertNewPair(pairAddress);
    }
    // if there are new pairs let's go another round to ensure
    // no other pair was created during this time
    // otherwise there is nothing to be done here
    if (!newAddresses.length) {
      logger.log(`Pairs refresh completed`);
      return newAddresses;
    }
    const futurePairs = await refreshPairs();
    return newAddresses.concat(futurePairs);
  };

  const refreshPairLiquidy = async (dbPair: db.Pair) => {
    const pair = await ctx.getPair(dbPair.address);
    const totalSupply = await pair.totalSupply();
    const { reserve0, reserve1 } = await pair.reserves();
    const ret = await dal.pair.synchronise(
      dbPair.id,
      totalSupply,
      reserve0,
      reserve1,
    );
    logger.debug(
      `${dbPair.address} pair synchronized with ${JSON.stringify({
        totalSupply: totalSupply.toString(),
        reserve0: reserve0.toString(),
        reserve1: reserve1.toString(),
      })}`,
    );
    return ret;
  };

  const refreshPairsLiquidity = async () => {
    //get the all pairs
    const dbPairs = await dal.pair.getAll();
    logger.log(`Refreshing pairs liquidity...`);
    for (const dbPair of dbPairs) {
      await refreshPairLiquidy(dbPair);
    }
    logger.log(`Pairs liquidity refresh completed`);
  };

  const unsyncAllPairs = async () => {
    const batch = await dal.pair.unsyncAllPairs();
    logger.log(`${batch.count} pairs marked as unsynced`);
  };

  //TODO: this should start a much complex worker which listens for middleware events
  //and synchronise the db state with the actual state of DEX
  const startWorker = async () => {
    logger.log('Starting worker...');
    await unsyncAllPairs();
    await refreshPairs();
    await refreshPairsLiquidity();
  };
  return {
    refreshPairsLiquidity,
    refreshPairs,
    unsyncAllPairs,
    startWorker,
  };
};
