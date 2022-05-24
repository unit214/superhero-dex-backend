import NETWORKS from './networks';
import { Universal, Node } from '@aeternity/aepp-sdk';
import {
  CallData,
  ContractAddress,
  WalletAddress,
  Hash,
  nonNullable,
} from './utils';
import * as routerInterface from 'dex-contracts-v2/build/IAedexV2Router.aes.js';
import * as factoryInterface from 'dex-contracts-v2/build/IAedexV2Factory.aes.js';
import * as pairInterface from 'dex-contracts-v2/build/IAedexV2Pair.aes';

let client: any = null;

const getClient = async () => {
  const NETWORK_NAME = nonNullable(process.env.NETWORK_NAME);
  if (!client) {
    const node = await Node({
      url: NETWORKS[NETWORK_NAME].nodeUrl,
      ignoreVersion: true,
    });

    client = await Universal({
      nodes: [{ name: NETWORK_NAME, instance: node }],
      compilerUrl: NETWORKS[NETWORK_NAME].compilerUrl,
    });
  }
  return client;
};

export type RouterMethods = {
  factory: () => ContractMethodResult<ContractAddress>;
};

export type FactoryMethods = {
  allPairs: () => ContractMethodResult<ContractAddress[]>;
};

export type ContractMethodResult<T> = Promise<{
  result: {
    callerId: WalletAddress;
    callerNonce: number;
    contractId: ContractAddress;
    gasPrice: number;
    gasUsed: number;
    height: number;
    log: any[];
    returnType: 'ok' | 'revert';
    returnValue: CallData;
  };
  decodedResult: T;
}>;
export type PairMethods = {
  token0: () => ContractMethodResult<ContractAddress>;
  token1: () => ContractMethodResult<ContractAddress>;
  totalSupply: () => ContractMethodResult<bigint>;
  reserves: () => ContractMethodResult<{ reserve0: bigint; reserve1: bigint }>;
};

export type MetaInfo = {
  name: string;
  symbol: string;
  decimals: bigint;
};

export type Aex9Methods = {
  metaInfo: () => ContractMethodResult<MetaInfo>;
};

const wrapRouter = (router: any): RouterMethods => {
  const methods = router.methods;

  return {
    factory: methods.factory,
  };
};
const wrapFactory = (factory: any): FactoryMethods => {
  const methods = factory.methods;

  return {
    allPairs: methods.get_all_pairs,
  };
};

const wrapPair = (pair: any): PairMethods => {
  const methods = pair.methods;

  return {
    token0: methods.token0,
    token1: methods.token1,
    totalSupply: methods.total_supply,
    reserves: methods.get_reserves,
  };
};

const wrapAex9 = (token: any): Aex9Methods => {
  const methods = token.methods;

  return {
    metaInfo: methods.meta_info,
  };
};

export type TxInfo = {
  callerId: WalletAddress;
  callerNonce: number;
  contractId: ContractAddress;
  gasPrice: number;
  gasUsed: number;
  height: number;
  log: {
    address: ContractAddress;
    data: CallData;
    topics: unknown[];
  }[];
  returnType: 'ok' | 'revert';
  returnValue: CallData;
};
export type Context = {
  router: RouterMethods;
  factory: FactoryMethods;
  getPair: (address: ContractAddress) => Promise<PairMethods>;
  getToken: (address: ContractAddress) => Promise<Aex9Methods>;
  client: { getTxInfo: (hash: Hash) => Promise<TxInfo | null | undefined> };
};

const createGetToken =
  (
    tokens: { [key: string]: Aex9Methods | undefined },
    getInstance: (source: string, address: string) => Promise<any>,
  ) =>
  async (tokenAddress: string): Promise<Aex9Methods> => {
    const cached = tokens[tokenAddress];
    if (cached) {
      return cached;
    }
    const token = wrapAex9(await getInstance(pairInterface, tokenAddress));
    tokens[tokenAddress] = token;
    return token;
  };

const createGetPair =
  (
    pairs: { [key: string]: PairMethods | undefined },
    getInstance: (source: string, address: string) => any,
  ) =>
  async (pairAddress: string): Promise<PairMethods> => {
    const cached = pairs[pairAddress];
    if (cached) {
      return cached;
    }
    const pair = wrapPair(await getInstance(pairInterface, pairAddress));
    pairs[pairAddress] = pair;
    return pair;
  };

const instanceFactory = async (client: any) => {
  return (source: string, contractAddress: string): Promise<any> =>
    client.getContractInstance({ source, contractAddress });
};

export const getContext = async (): Promise<Context> => {
  const client = await getClient();
  const getInstance = await instanceFactory(client);
  const router = await getInstance(
    routerInterface,
    nonNullable(process.env.ROUTER_ADDRESS),
  );
  const factory = await getInstance(
    factoryInterface,
    nonNullable(process.env.FACTORY_ADDRESS),
  );
  const pairs: { [key: string]: PairMethods | undefined } = {};
  const tokens: { [key: string]: Aex9Methods | undefined } = {};
  return {
    router: wrapRouter(router),
    factory: wrapFactory(factory),
    getPair: createGetPair(pairs, getInstance),
    getToken: createGetToken(tokens, getInstance),
    client,
  };
};
