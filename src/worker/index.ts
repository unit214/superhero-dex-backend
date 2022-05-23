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
  const {
    decodedResult: { name, symbol, decimals },
  } = await tokenMethods.metaInfo();

  const tokenFromDb = await dal.token.upsertToken(
    address,
    symbol,
    name,
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
  return [
    (await instance.token0()).decodedResult,
    (await instance.token1()).decodedResult,
  ];
};

const insertOnlyNewTokens = async (
  ctx: Context,
  tokenAddresses: ContractAddress[],
) => {
  const allAddresses = new Set(await dal.token.getAllAddresses());
  const newOnes = tokenAddresses.filter(
    (tokenAddress) => !allAddresses.has(tokenAddress),
  );
  return Promise.all(
    newOnes.map((tokenAddress) => upsertTokenInformation(ctx, tokenAddress)),
  );
};

const refreshPairLiquidityByAddress = async (
  ctx: Context,
  address: ContractAddress,
  height?: number,
) => {
  const found = await dal.pair.getOneLite(address);
  if (!found) {
    throw new Error(`Pair not found ${address}`);
  }
  await refreshPairLiquidity(ctx, found, height);
};
const refreshPairLiquidity = async (
  ctx: Context,
  dbPair: db.Pair,
  height?: number,
) => {
  const pair = await ctx.getPair(dbPair.address);
  const { decodedResult: totalSupply } = await pair.totalSupply();
  const {
    decodedResult: { reserve0, reserve1 },
    result: { height: heightFromDryRun },
  } = await pair.reserves();
  const ret = await dal.pair.synchronise(
    dbPair.id,
    totalSupply,
    reserve0,
    reserve1,
    height || heightFromDryRun,
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
  const { decodedResult: allFactoryPairs } = await ctx.factory.allPairs();
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
  await insertOnlyNewTokens(ctx, [...tokenSet]);

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
  await Promise.all(dbPairs.map((dbPair) => refreshPairLiquidity(ctx, dbPair)));
  logger.log(`Pairs liquidity refresh completed`);
};

const onFactoryEventReceived = async (ctx: Context, height: number) => {
  const newAddresses = await refreshPairs(ctx);
  await Promise.all(
    newAddresses.map((address) =>
      refreshPairLiquidityByAddress(ctx, address, height),
    ),
  );
};

const createOnEventReceived =
  (ctx: Context) => async (event: mdw.SubscriptionEvent) => {
    const {
      hash,
      tx: { type },
    } = event.payload;
    if (type !== 'ContractCallTx') {
      logger.debug(`Ignoring transaction of type ${type}`);
      return;
    }
    //TODO: try to trow exception here to see if it reconnects
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
        return onFactoryEventReceived(ctx, event.payload.block_height);
      }
      // if the pair is newly created withing this transaction
      // the pair will be ignore in this loop, but that's not a problem, because
      // factory event handler was also involved here and it will take care of
      // newly created pair
      else if (addresses[contract]) {
        return refreshPairLiquidityByAddress(
          ctx,
          contract,
          event.payload.block_height,
        );
      }
      return Promise.resolve();
    });
    return Promise.all(allPromises);
  };

export default (ctx: Context) => {
  const unsyncAllPairs = async () => {
    const batch = await dal.pair.unsyncAllPairs();
    logger.log(`${batch.count} pairs marked as unsync`);
  };
  const onEventReceived = createOnEventReceived(ctx);

  async function startWorker(autoStart?: boolean, crashWhenClosed?: boolean) {
    logger.log('Starting worker...');
    await unsyncAllPairs();
    await mdw.createNewConnection({
      onConnected: async () => {
        await refreshPairs(ctx);
        await refreshPairsLiquidity(ctx);
      },
      onDisconnected: async (error) => {
        logger.warn(`Middleware disconnected: ${error}`);
        await unsyncAllPairs();
        if (autoStart) {
          setTimeout(() => startWorker(true), 2000);
        } else if (crashWhenClosed) {
          throw new Error('Middleware connection closed');
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
