import { AeSdk, ContractMethodsBase } from '@aeternity/aepp-sdk';
import ContractWithMethods from '@aeternity/aepp-sdk/es/contract/Contract';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Pair } from '@prisma/client';
import * as factoryInterface from 'dex-contracts-v2/build/AedexV2Factory.aci.json';
import * as pairInterface from 'dex-contracts-v2/build/AedexV2Pair.aci.json';
import * as routerInterface from 'dex-contracts-v2/build/AedexV2Router.aci.json';

import { SubscriptionEvent } from '@/clients/mdw-ws-client.model';
import { MdwWsClientService } from '@/clients/mdw-ws-client.service';
import { ContractAddress } from '@/clients/sdk-client.model';
import { SdkClientService } from '@/clients/sdk-client.service';
import { PairDbService } from '@/database/pair/pair-db.service';
import { TokenDbService } from '@/database/token/token-db.service';
import { nonNullable } from '@/lib/utils';
import {
  Aex9Methods,
  Context,
  FactoryMethods,
  PairMethods,
  RouterMethods,
} from '@/tasks/pair-sync/pair-sync.model';

@Injectable()
export class PairSyncService implements OnModuleInit {
  constructor(
    private readonly tokenDb: TokenDbService,
    private readonly pairDb: PairDbService,
    private readonly mdwWsClient: MdwWsClientService,
    private readonly sdkClient: SdkClientService,
  ) {}

  readonly logger = new Logger(PairSyncService.name);
  ctx: Context;

  async onModuleInit() {
    this.ctx = await this.getContext();
  }

  async startSync(
    autoStart?: boolean,
    crashWhenClosed?: boolean,
  ): Promise<void> {
    this.logger.log(`Starting ${process.env.NETWORK_NAME} worker...`);
    await this.unsyncAllPairs();
    await this.mdwWsClient.createNewConnection({
      onConnected: async () => {
        await this.refreshPairs();
        await this.refreshPairsLiquidity();
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
        this.logger,
        this.onFactoryEventReceived,
        this.refreshPairLiquidityByAddress.bind(this),
        () => this.pairDb.getAllAddresses(),
      ),
    });
  }

  private getContext = async (): Promise<Context> => {
    const createGetToken =
      (
        tokens: { [key: string]: ContractWithMethods<Aex9Methods> | undefined },
        getInstance: Awaited<ReturnType<typeof instanceFactory>>,
      ) =>
      async (
        tokenAddress: ContractAddress,
      ): Promise<ContractWithMethods<Aex9Methods>> => {
        const cached = tokens[tokenAddress];
        if (cached) {
          return cached;
        }
        const token = await getInstance<Aex9Methods>(
          pairInterface,
          tokenAddress,
        );
        tokens[tokenAddress] = token;
        return token;
      };

    const createGetPair =
      (
        pairs: { [key: string]: ContractWithMethods<PairMethods> | undefined },
        getInstance: Awaited<ReturnType<typeof instanceFactory>>,
      ) =>
      async (
        pairAddress: ContractAddress,
      ): Promise<ContractWithMethods<PairMethods>> => {
        const cached = pairs[pairAddress];
        if (cached) {
          return cached;
        }
        const pair = await getInstance<PairMethods>(pairInterface, pairAddress);
        pairs[pairAddress] = pair;
        return pair;
      };

    const instanceFactory = async (client: AeSdk) => {
      return <T extends ContractMethodsBase>(
        aci: any,
        contractAddress: ContractAddress,
      ) => client.initializeContract<T>({ aci, address: contractAddress });
    };

    const routerAddress = process.env.ROUTER_ADDRESS;
    if (!routerAddress) {
      throw new Error('Router address is not set');
    }
    const [client, node] = await this.sdkClient.getClient();
    const getInstance = await instanceFactory(client);
    const router = await getInstance<RouterMethods>(
      routerInterface,
      nonNullable<ContractAddress>(routerAddress as ContractAddress),
    );
    const factory = await getInstance<FactoryMethods>(
      factoryInterface,
      nonNullable<ContractAddress>(
        process.env.FACTORY_ADDRESS as ContractAddress,
      ),
    );
    const pairs: {
      [key: string]: ContractWithMethods<PairMethods> | undefined;
    } = {};
    const tokens: {
      [key: string]: ContractWithMethods<Aex9Methods> | undefined;
    } = {};
    return {
      router,
      factory,
      getPair: createGetPair(pairs, getInstance),
      getToken: createGetToken(tokens, getInstance),
      node,
    };
  };

  private async unsyncAllPairs(): Promise<void> {
    const batch = await this.pairDb.unsyncAllPairs();
    this.logger.log(`${batch.count} pairs marked as unsync`);
  }

  private async refreshPairs(): Promise<ContractAddress[]> {
    this.logger.log(`Getting all pairs from Factory...`);
    const { decodedResult: allFactoryPairs } =
      await this.ctx.factory.get_all_pairs();
    this.logger.log(`${allFactoryPairs.length} pairs found on DEX`);
    const allDbPairsLen = await this.pairDb.count(true);
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
          await this.getPairTokens(pairAddress),
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
    await this.insertOnlyNewTokens([...tokenSet]);

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
    const futurePairs = await this.refreshPairs();
    return newAddresses.concat(futurePairs);
  }

  private async refreshPairsLiquidity(): Promise<void> {
    //get the all pairs
    const dbPairs = await this.pairDb.getAllWithCondition(true);
    this.logger.log(`Refreshing pairs liquidity...`);
    await Promise.all(
      dbPairs.map((dbPair) => this.refreshPairLiquidity(dbPair)),
    );
    this.logger.log(`Pairs liquidity refresh completed`);
  }

  private createOnEventReceived =
    (
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
      const txInfo = await this.ctx.node.getTransactionInfoByHash(hash);
      if (txInfo == null) {
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
          return onFactory(event.payload.block_height);
        }
        // if the pair is newly created within this transaction
        // the pair will be ignored in this loop, but that's not a problem, because
        // the factory event handler was also involved here and will take care of the
        // newly created pair
        else if (addresses[contract]) {
          return refreshPairLiquidity(contract, event.payload.block_height);
        }
        return Promise.resolve();
      });
      return Promise.all(allPromises);
    };

  private async updateTokenMetadata(
    address: ContractAddress,
    tokenMethods: ContractWithMethods<Aex9Methods>,
  ) {
    try {
      const {
        decodedResult: { name, symbol, decimals },
      } = await tokenMethods.meta_info();

      const tokenFromDb = await this.tokenDb.upsertToken(
        address,
        symbol,
        name,
        Number(decimals),
      );
      this.logger.debug(`Token ${symbol} [${address}] updated/inserted`);
      return tokenFromDb.id;
    } catch (error) {
      const tokenFromDb = await this.tokenDb.upsertMalformedToken(address);
      this.logger.warn(`Token ${address} is malformed`, error.message);
      return tokenFromDb.id;
    }
  }

  private async upsertTokenInformation(
    address: ContractAddress,
  ): Promise<number> {
    const token = await this.tokenDb.getByAddress(address);
    if (token) {
      return token.id;
    }
    let tokenMethods: ContractWithMethods<Aex9Methods>;
    try {
      tokenMethods = await this.ctx.getToken(address);
    } catch (error) {
      const noContract = `v3/contracts/${address} error: Contract not found`;
      if (error.message && error.message.indexOf(noContract) > -1) {
        const tokenFromDb =
          await this.tokenDb.upsertNoContractForToken(address);
        this.logger.warn(`No contract for Token ${address}`);
        return tokenFromDb.id;
      }
      throw error;
    }

    return await this.updateTokenMetadata(address, tokenMethods);
  }

  private async insertNewPair(
    address: ContractAddress,
    token0Address: ContractAddress,
    token1Address: ContractAddress,
  ) {
    const ret = await this.pairDb.insertByTokenAddresses(
      address,
      token0Address,
      token1Address,
    );
    this.logger.debug(
      `Pair ${ret.token0.symbol}/${ret.token1.symbol} [${address}] inserted`,
    );
    return ret;
  }

  private async getPairTokens(
    address: ContractAddress,
  ): Promise<[ContractAddress, ContractAddress]> {
    const instance = await this.ctx.getPair(address);
    return [
      (await instance.token0()).decodedResult,
      (await instance.token1()).decodedResult,
    ];
  }

  private async insertOnlyNewTokens(tokenAddresses: ContractAddress[]) {
    const allAddresses = new Set(await this.tokenDb.getAllAddresses(true));
    const newOnes = tokenAddresses.filter(
      (tokenAddress) => !allAddresses.has(tokenAddress),
    );
    return Promise.all(
      newOnes.map((tokenAddress) => this.upsertTokenInformation(tokenAddress)),
    );
  }

  private async refreshPairLiquidityByAddress(
    address: ContractAddress,
    height?: number,
  ) {
    const found = await this.pairDb.getOneLite(address);
    if (!found) {
      throw new Error(`Pair not found ${address}`);
    }
    await this.refreshPairLiquidity(found, height);
  }

  private async refreshPairLiquidity(dbPair: Pair, height?: number) {
    const pair = await this.ctx.getPair(dbPair.address as ContractAddress);
    const { decodedResult: totalSupply } = await pair.total_supply();
    const {
      decodedResult: { reserve0, reserve1 },
      result,
    } = await pair.get_reserves();
    const syncHeight = height ?? result?.height;
    if (syncHeight == null) {
      console.error('Could not get height');
      return;
    }
    const ret = await this.pairDb.synchronise(
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
  }

  private async onFactoryEventReceived(height: number) {
    const newAddresses = await this.refreshPairs();
    await Promise.all(
      newAddresses.map((address) =>
        this.refreshPairLiquidityByAddress(address, height),
      ),
    );
  }
}
