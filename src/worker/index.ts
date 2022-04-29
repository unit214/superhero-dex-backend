import { Context } from '../lib/contracts';
import * as dal from '../dal';
import * as db from '@prisma/client';
import * as mdw from './middleware';

import { Logger } from '@nestjs/common';
import { ContractAddress } from 'src/lib/utils';
const logger = new Logger('Worker');

const upsertTokenInformation = async (
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
  logger.debug(`Token ${symbol} [${address}] updated/inserted`);
  return tokenFromDb.id;
};

const insertNewPair = async (
  address: ContractAddress,
  token0Address: ContractAddress,
  token1Address: ContractAddress,
) => {
  const ret = await dal.pair.insertByTokenAddresses(
    address,
    token0Address,
    token1Address,
  );
  logger.debug(
    `Pair ${ret.token0.symbol}/${ret.token1.symbol} [${address}] inserted`,
  );
  return ret;
};

const getPairTokens = async (
  ctx: Context,
  address: ContractAddress,
): Promise<[ContractAddress, ContractAddress]> => {
  const instance = await ctx.getPair(address);
  return [await instance.token0(), await instance.token1()];
};

const inserOnlyNewTokens = async (
  ctx: Context,
  tokenAddreses: ContractAddress[],
) => {
  const allAddresses = new Set(await dal.token.getAllAddresses());
  const newOnes = tokenAddreses.filter(
    (tokenAddress) => !allAddresses.has(tokenAddress),
  );
  return Promise.all(
    newOnes.map((tokenAddress) => upsertTokenInformation(ctx, tokenAddress)),
  );
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
    `Pair ${ret.token0.symbol}/${ret.token1.symbol} [${
      dbPair.address
    }] synchronized with ${JSON.stringify({
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

  if (!newAddresses.length) {
    logger.log(`Pairs refresh completed`);
    return newAddresses;
  }

  //get pair tokens in parallel
  const pairWithTokens = await Promise.all(
    newAddresses.map(
      async (
        pairAddress,
      ): Promise<[ContractAddress, [ContractAddress, ContractAddress]]> => [
        pairAddress,
        await getPairTokens(ctx, pairAddress),
      ],
    ),
  );

  const tokenSet = new Set(
    pairWithTokens.reduce(
      (acc: ContractAddress[], data) => acc.concat(data[1]),
      [],
    ),
  );

  //ensure all new tokens will be inserted
  await inserOnlyNewTokens(ctx, [...tokenSet]);

  //finally insert new pairs sequential to preserve the right order
  for (const [pairAddress, [token0Address, token1Address]] of pairWithTokens) {
    await insertNewPair(pairAddress, token0Address, token1Address);
  }

  // because there are new pairs let's go another round to ensure
  // no other pair was created during this time
  logger.debug('We go another round to see if any pair was created');
  const futurePairs = await refreshPairs(ctx);
  return newAddresses.concat(futurePairs);
};

const refreshPairsLiquidity = async (ctx: Context) => {
  //get the all pairs
  const dbPairs = await dal.pair.getAll();
  logger.log(`Refreshing pairs liquidity...`);
  await Promise.all(dbPairs.map((dbPair) => refreshPairLiquidy(ctx, dbPair)));
  logger.log(`Pairs liquidity refresh completed`);
};

const onFactoryEventReceived = async (ctx: Context) => {
  const newAddresses = await refreshPairs(ctx);
  await Promise.all(
    newAddresses.map((address) => refreshPairLiquidyByAddress(ctx, address)),
  );
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
    const allPromises = contracts.map((contract) => {
      //factory state was modified was modified
      if (contract === process.env.FACTORY_ADDRESS) {
        return onFactoryEventReceived(ctx);
      }
      // if the pair is newly created withing this transaction
      // the pair will be ingnore in this loop, but that's not a problem, because
      // factory event handler was also involved here and it will take care of
      // newly created pair
      else if (addresses[contract]) {
        return refreshPairLiquidyByAddress(ctx, contract);
      }
      return Promise.resolve();
    });
    return Promise.all(allPromises);
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
