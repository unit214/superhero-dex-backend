import { Injectable, OnModuleInit } from '@nestjs/common';
import { TokenDbService } from '../database/token/token-db.service';
import { PairDbService } from '../database/pair/pair-db.service';
import { Context, Aex9Methods, getContext } from '../lib/contracts';
import { Logger } from '@nestjs/common';
import { ContractAddress } from 'src/lib/utils';
import ContractWithMethods from '@aeternity/aepp-sdk/es/contract/Contract';
import { Pair } from '@prisma/client';
import { MdwWsClientService } from '../clients/mdw-ws-client.service';
import { SubscriptionEvent } from '../clients/mdw-ws-client.model';

@Injectable()
export class PairSyncService implements OnModuleInit {
  constructor(
    private readonly tokenDbService: TokenDbService,
    private readonly pairDbService: PairDbService,
    private readonly mdwWsClientService: MdwWsClientService,
  ) {}

  readonly logger = new Logger(PairSyncService.name);
  ctx: Context;

  async onModuleInit() {
    this.ctx = await getContext();
  }

  startSync = async (autoStart?: boolean, crashWhenClosed?: boolean) => {
    this.logger.log(`Starting ${process.env.NETWORK_NAME} worker...`);
    await this.unsyncAllPairs();
    await this.mdwWsClientService.createNewConnection({
      onConnected: async () => {
        await this.refreshPairs(this.ctx);
        await this.refreshPairsLiquidity(this.ctx);
      },
      onDisconnected: async (error) => {
        this.logger.warn(`Middleware disconnected: ${error}`);
        await this.unsyncAllPairs();
        if (autoStart) {
          setTimeout(() => this.startSync(true), 2000);
        } else if (crashWhenClosed) {
          throw new Error('Middleware connection closed');
        }
      },
      onEventReceived: this.createOnEventReceived(
        this.ctx,
        this.logger,
        this.onFactoryEventReceived,
        this.refreshPairLiquidityByAddress,
        () => this.pairDbService.getAllAddresses(),
      ),
    });
  };

  unsyncAllPairs = async () => {
    const batch = await this.pairDbService.unsyncAllPairs();
    this.logger.log(`${batch.count} pairs marked as unsync`);
  };

  refreshPairs = async (ctx: Context): Promise<ContractAddress[]> => {
    this.logger.log(`Getting all pairs from Factory...`);
    const { decodedResult: allFactoryPairs } =
      await ctx.factory.get_all_pairs();
    this.logger.log(`${allFactoryPairs.length} pairs found on DEX`);
    const allDbPairsLen = await this.pairDbService.count(true);
    //get new pairs, and reverse it , because allFactoryPairs is reversed by the factory contract
    const newAddresses = allFactoryPairs
      .slice(0, allFactoryPairs.length - allDbPairsLen)
      .reverse();

    this.logger.log(`${newAddresses.length} new pairs found`);

    if (!newAddresses.length) {
      this.logger.log(`Pairs refresh completed`);
      return newAddresses;
    }

    //get pair tokens in parallel
    const pairWithTokens = await Promise.all(
      newAddresses.map(
        async (
          pairAddress: ContractAddress,
        ): Promise<[ContractAddress, [ContractAddress, ContractAddress]]> => [
          pairAddress,
          await this.getPairTokens(ctx, pairAddress),
        ],
      ),
    );

    const tokenSet: Set<ContractAddress> = new Set(
      pairWithTokens.reduce(
        (acc: ContractAddress[], data) => acc.concat(data[1]),
        [],
      ),
    );

    //ensure all new tokens will be inserted
    await this.insertOnlyNewTokens(ctx, [...tokenSet]);

    //finally insert new pairs sequential to preserve the right order
    for (const [
      pairAddress,
      [token0Address, token1Address],
    ] of pairWithTokens) {
      await this.insertNewPair(pairAddress, token0Address, token1Address);
    }

    // because there are new pairs let's go another round to ensure
    // no other pair was created during this time
    this.logger.debug('We go another round to see if any pair was created');
    const futurePairs = await this.refreshPairs(ctx);
    return newAddresses.concat(futurePairs);
  };

  refreshPairsLiquidity = async (ctx: Context) => {
    //get the all pairs
    const dbPairs = await this.pairDbService.getAllWithCondition(true);
    this.logger.log(`Refreshing pairs liquidity...`);
    await Promise.all(
      dbPairs.map((dbPair) => this.refreshPairLiquidity(ctx, dbPair)),
    );
    this.logger.log(`Pairs liquidity refresh completed`);
  };

  createOnEventReceived =
    (
      ctx: Context,
      logger: Logger,
      onFactory: typeof this.onFactoryEventReceived,
      refreshPairLiquidity: typeof this.refreshPairLiquidityByAddress,
      getAllAddresses: () => Promise<ContractAddress[]>,
    ) =>
    async (event: SubscriptionEvent) => {
      const {
        hash,
        tx: { type },
      } = event.payload;
      if (type !== 'ContractCallTx') {
        logger.debug(`Ignoring transaction of type '${type}'`);
        return;
      }
      //TODO: try to trow exception here to see if it reconnects
      const txInfo = await ctx.node.getTransactionInfoByHash(hash);
      if (!txInfo) {
        throw new Error(`No tx info for hash '${hash}'`);
      }
      if (!txInfo.callInfo) {
        throw new Error(`No tx.callInfo for hash '${hash}'`);
      }
      if (txInfo.callInfo.returnType !== 'ok') {
        logger.debug(`Ignore reverted transaction: '${hash}'`);
        return;
      }
      // make a list with all unique contracts
      const contracts = [
        ...new Set(
          txInfo.callInfo?.log.map((x) => x.address as ContractAddress),
        ),
      ];

      // get all known addresses
      const addresses: { [key: ContractAddress]: boolean | undefined } = (
        await getAllAddresses()
      ).reduce((a, v) => ({ ...a, [v]: true }), {});

      //parse events on be on
      const allPromises = contracts.map((contract) => {
        // factory state was modified
        if (contract === process.env.FACTORY_ADDRESS) {
          return onFactory(ctx, event.payload.block_height);
        }
        // if the pair is newly created within this transaction
        // the pair will be ignored in this loop, but that's not a problem, because
        // the factory event handler was also involved here and will take care of the
        // newly created pair
        else if (addresses[contract]) {
          return refreshPairLiquidity(
            ctx,
            contract,
            event.payload.block_height,
          );
        }
        return Promise.resolve();
      });
      return Promise.all(allPromises);
    };

  private updateTokenMetadata = async (
    address: ContractAddress,
    tokenMethods: ContractWithMethods<Aex9Methods>,
  ) => {
    try {
      const {
        decodedResult: { name, symbol, decimals },
      } = await tokenMethods.meta_info();

      const tokenFromDb = await this.tokenDbService.upsertToken(
        address,
        symbol,
        name,
        Number(decimals),
      );
      this.logger.debug(`Token ${symbol} [${address}] updated/inserted`);
      return tokenFromDb.id;
    } catch (error) {
      const tokenFromDb =
        await this.tokenDbService.upsertMalformedToken(address);
      this.logger.warn(`Token ${address} is malformed`, error.message);
      return tokenFromDb.id;
    }
  };

  private upsertTokenInformation = async (
    ctx: Context,
    address: ContractAddress,
  ): Promise<number> => {
    const token = await this.tokenDbService.getByAddress(address);
    if (token) {
      return token.id;
    }
    let tokenMethods: ContractWithMethods<Aex9Methods>;
    try {
      tokenMethods = await ctx.getToken(address);
    } catch (error) {
      const noContract = `v3/contracts/${address} error: Contract not found`;
      if (error.message && error.message.indexOf(noContract) > -1) {
        const tokenFromDb =
          await this.tokenDbService.upsertNoContractForToken(address);
        this.logger.warn(`No contract for Token ${address}`);
        return tokenFromDb.id;
      }
      throw error;
    }

    return await this.updateTokenMetadata(address, tokenMethods);
  };

  private insertNewPair = async (
    address: ContractAddress,
    token0Address: ContractAddress,
    token1Address: ContractAddress,
  ) => {
    const ret = await this.pairDbService.insertByTokenAddresses(
      address,
      token0Address,
      token1Address,
    );
    this.logger.debug(
      `Pair ${ret.token0.symbol}/${ret.token1.symbol} [${address}] inserted`,
    );
    return ret;
  };

  private getPairTokens = async (
    ctx: Context,
    address: ContractAddress,
  ): Promise<[ContractAddress, ContractAddress]> => {
    const instance = await ctx.getPair(address);
    return [
      (await instance.token0()).decodedResult,
      (await instance.token1()).decodedResult,
    ];
  };

  private insertOnlyNewTokens = async (
    ctx: Context,
    tokenAddresses: ContractAddress[],
  ) => {
    const allAddresses = new Set(
      await this.tokenDbService.getAllAddresses(true),
    );
    const newOnes = tokenAddresses.filter(
      (tokenAddress) => !allAddresses.has(tokenAddress),
    );
    return Promise.all(
      newOnes.map((tokenAddress) =>
        this.upsertTokenInformation(ctx, tokenAddress),
      ),
    );
  };

  private refreshPairLiquidityByAddress = async (
    ctx: Context,
    address: ContractAddress,
    height?: number,
  ) => {
    const found = await this.pairDbService.getOneLite(address);
    if (!found) {
      throw new Error(`Pair not found ${address}`);
    }
    await this.refreshPairLiquidity(ctx, found, height);
  };

  private refreshPairLiquidity = async (
    ctx: Context,
    dbPair: Pair,
    height?: number,
  ) => {
    const pair = await ctx.getPair(dbPair.address as ContractAddress);
    const { decodedResult: totalSupply } = await pair.total_supply();
    const {
      decodedResult: { reserve0, reserve1 },
      result,
    } = await pair.get_reserves();
    const syncHeight = height || result?.height;
    if (!syncHeight) {
      console.error('Could not get height');
      return;
    }
    const ret = await this.pairDbService.synchronise(
      dbPair.id,
      totalSupply,
      reserve0,
      reserve1,
      syncHeight,
    );
    this.logger.debug(
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

  private onFactoryEventReceived = async (ctx: Context, height: number) => {
    const newAddresses = await this.refreshPairs(ctx);
    await Promise.all(
      newAddresses.map((address) =>
        this.refreshPairLiquidityByAddress(ctx, address, height),
      ),
    );
  };
}
