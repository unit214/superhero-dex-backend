import { Context } from '../lib/contracts';
import * as dal from '../dal';
import * as db from '@prisma/client';
import * as mdw from './middleware';

import { Logger } from '@nestjs/common';
import { ContractAddress } from 'src/lib/utils';
const logger = new Logger('Worker');

const getSafeTokenId = async (
  ctx: Context,
  address: string,
): Promise<number> => {
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

  const ret = await dal.pair.insert(address, token0Id, token1Id);
  logger.debug(`${address} pair inserted`);
  return ret;
};

const refreshPairLiquidyByAddress = async (
  ctx: Context,
  address: ContractAddress,
) => {
  const found = await dal.pair.getOneLite(address);
  if (!found) {
    throw new Error(`Pair not found ${address}`);
  }
  await refreshPairLiquidy(ctx, found);
};
const refreshPairLiquidy = async (ctx: Context, dbPair: db.Pair) => {
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

const refreshPairs = async (ctx: Context): Promise<ContractAddress[]> => {
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
    await insertNewPair(ctx, pairAddress);
  }
  // if there are new pairs let's go another round to ensure
  // no other pair was created during this time
  // otherwise there is nothing to be done here
  if (!newAddresses.length) {
    logger.log(`Pairs refresh completed`);
    return newAddresses;
  }
  const futurePairs = await refreshPairs(ctx);
  return newAddresses.concat(futurePairs);
};

const refreshPairsLiquidity = async (ctx: Context) => {
  //get the all pairs
  const dbPairs = await dal.pair.getAll();
  logger.log(`Refreshing pairs liquidity...`);
  for (const dbPair of dbPairs) {
    await refreshPairLiquidy(ctx, dbPair);
  }
  logger.log(`Pairs liquidity refresh completed`);
};

const onFactoryEventReceived = async (ctx: Context) => {
  const newAddresses = await refreshPairs(ctx);
  for (const address of newAddresses) {
    await refreshPairLiquidyByAddress(ctx, address);
  }
};

const createOnEventRecieved =
  (ctx: Context) => async (event: mdw.SubscriptionEvent) => {
    const { hash } = event.payload;
    //TODO: try to trow execption here to see if it reconnects
    const txInfo = await ctx.client.getTxInfo(hash);
    if (!txInfo) {
      //TODO: what happens if no txInfo??
      throw new Error(`No tx info for hash ${hash}`);
    }
    if (txInfo.returnType !== 'ok') {
      logger.debug(`Ignore reverted transaction: ${hash}`);
      return;
    }
    // make a list with all unique contracts
    const contracts = [...new Set(txInfo.log.map((x) => x.address))];

    // get all known addresses
    const addresses: { [key: ContractAddress]: boolean | undefined } = (
      await dal.pair.getAllAddresses()
    ).reduce((a, v) => ({ ...a, [v]: true }), {});
    //parse events on be on
    for (const contract of contracts) {
      //factory state was modified was modified
      if (contract === process.env.FACTORY_ADDRESS) {
        //TODO hadne onFactoryEventReceived
        await onFactoryEventReceived(ctx);
      }
      // if the pair is newly created withing this transaction
      // the pair will be ingnore in this loop, but that's not a problem, because
      // factory event handler was also involved here and it will take care of
      // newly created pair
      else if (addresses[contract]) {
        await refreshPairLiquidyByAddress(ctx, contract);
      }
    }
  };

export default (ctx: Context) => {
  const unsyncAllPairs = async () => {
    const batch = await dal.pair.unsyncAllPairs();
    logger.log(`${batch.count} pairs marked as unsynced`);
  };
  const onEventReceived = createOnEventRecieved(ctx);

  async function startWorker(autoStart?: boolean) {
    logger.log('Starting worker...');
    await unsyncAllPairs();
    await mdw.createNewConnection({
      onConnected: async () => {
        await refreshPairs(ctx);
        await refreshPairsLiquidity(ctx);
      },
      onDisconnected: async () => {
        logger.warn('Middleware disconnected');
        await unsyncAllPairs();
        logger.debug('All pairs marked as unsynced');
        if (autoStart) {
          setTimeout(() => startWorker(true), 2000);
        }
      },
      onEventReceived,
    });
  }
  return {
    refreshPairsLiquidity: () => refreshPairsLiquidity(ctx),
    refreshPairs: () => refreshPairs(ctx),
    unsyncAllPairs,
    startWorker,
  };
};
