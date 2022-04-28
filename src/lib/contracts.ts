import NETWORKS from './networks';
import { Universal, Node } from '@aeternity/aepp-sdk';
import {
  CallData,
  ContractAddress,
  Hash,
  nonNullable,
  WalletAddress,
} from './utils';
import * as routerInterface from 'dex-contracts-v2/build/IAedexV2Router.aes.js';
import * as factoryInteface from 'dex-contracts-v2/build/IAedexV2Factory.aes.js';
import * as pairInteface from 'dex-contracts-v2/build/IAedexV2Pair.aes';
import { NETWORK_NAME } from './utils';

let client: any = null;

const getClient = async () => {
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

const formatMethodName = (str: string) => {
  const reservedWords = ['expectEvents', 'contract', 'deploy'];
  return reservedWords.some((x) => str === x) ? str + '2' : str;
};
const createWrappedMethods = (
  contract: any,
  extractor?: (ret: any) => any,
): any => {
  const methods = contract.methods;
  const keys = Object.keys(methods);
  const wrappedMethods = keys.reduce((acc, key) => {
    const method = methods[key];
    const wrappedMethod = async (...args: any[]) => {
      const ret = await method.apply(contract, args);
      return extractor ? extractor(ret) : ret.decodedResult;
    };
    const cloned = { ...acc };
    cloned[formatMethodName(key)] = wrappedMethod;
    return cloned;
  }, {});
  return wrappedMethods;
};

export type RouterMethods = {
  factory: () => Promise<string>;
};

export type FactoryMethods = {
  allPairs: () => Promise<ContractAddress[]>;
};

export type PairMethods = {
  token0: () => Promise<string>;
  token1: () => Promise<string>;
  totalSupply: () => Promise<bigint>;
  reserves: () => Promise<{ reserve0: bigint; reserve1: bigint }>;
};

export type MetaInfo = {
  name: string;
  symbol: string;
  decimals: bigint;
};

export type Aex9Methods = {
  metaInfo: () => Promise<MetaInfo>;
};

const wrapRouter = (router: any): RouterMethods => {
  const methods = createWrappedMethods(router);

  return {
    factory: methods.factory,
  };
};
const wrapFactory = (factory: any): FactoryMethods => {
  const methods = createWrappedMethods(factory);

  return {
    allPairs: methods.get_all_pairs,
  };
};

const wrapPair = (pair: any): PairMethods => {
  const methods = createWrappedMethods(pair);

  return {
    token0: methods.token0,
    token1: methods.token1,
    totalSupply: methods.total_supply,
    reserves: methods.get_reserves,
  };
};

const wrapAex9 = (token: any): Aex9Methods => {
  const methods = createWrappedMethods(token);

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
  log: [
    {
      address: ContractAddress;
      data: CallData;
      topics: unknown[];
    },
  ];
  returnType: 'ok' | 'revert';
  returnValue: CallData;
};
export type Context = {
  router: RouterMethods;
  factory: FactoryMethods;
  getPair: (address: string) => Promise<PairMethods>;
  getToken: (address: string) => Promise<Aex9Methods>;
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
    const token = wrapAex9(await getInstance(pairInteface, tokenAddress));
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
    const pair = wrapPair(await getInstance(pairInteface, pairAddress));
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
    factoryInteface,
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
