import NETWORKS from './networks';
import { AeSdk, Node } from '@aeternity/aepp-sdk';
import { CallData, ContractAddress, WalletAddress, nonNullable } from './utils';
import * as routerInterface from 'dex-contracts-v2/build/AedexV2Router.aci.json';
import * as factoryInterface from 'dex-contracts-v2/build/AedexV2Factory.aci.json';
import * as pairInterface from 'dex-contracts-v2/build/AedexV2Pair.aci.json';

let client: AeSdk;
let node: Node;

const getClient = async (): Promise<[AeSdk, Node]> => {
  const NETWORK_NAME = nonNullable(process.env.NETWORK_NAME);
  if (!client) {
    node = new Node(NETWORKS[NETWORK_NAME].nodeUrl, {
      ignoreVersion: true,
    });

    client = new AeSdk({
      nodes: [{ name: NETWORK_NAME, instance: node }],
    });
  }
  return [client, node];
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
  return {
    factory: router.factory,
  };
};
const wrapFactory = (factory: any): FactoryMethods => {
  return {
    allPairs: factory.get_all_pairs,
  };
};

const wrapPair = (pair: any): PairMethods => {
  return {
    token0: pair.token0,
    token1: pair.token1,
    totalSupply: pair.total_supply,
    reserves: pair.get_reserves,
  };
};

const wrapAex9 = (token: any): Aex9Methods => {
  return {
    metaInfo: token.meta_info,
  };
};

export type Context = {
  router: RouterMethods;
  factory: FactoryMethods;
  getPair: (address: ContractAddress) => Promise<PairMethods>;
  getToken: (address: ContractAddress) => Promise<Aex9Methods>;
  node: Node;
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

const instanceFactory = async (client: AeSdk) => {
  return (aci: any, contractAddress: ContractAddress) =>
    client.initializeContract({ aci, address: contractAddress });
};

export const getContext = async (): Promise<Context> => {
  const routerAddress = process.env.ROUTER_ADDRESS;
  if (!routerAddress) {
    throw new Error('Router address is not set');
  }
  const [client, node] = await getClient();
  const getInstance = await instanceFactory(client);
  const router = await getInstance(
    routerInterface,
    nonNullable<ContractAddress>(routerAddress as ContractAddress),
  );
  const factory = await getInstance(
    factoryInterface,
    nonNullable<ContractAddress>(
      process.env.FACTORY_ADDRESS as ContractAddress,
    ),
  );
  const pairs: { [key: string]: PairMethods | undefined } = {};
  const tokens: { [key: string]: Aex9Methods | undefined } = {};
  return {
    router: wrapRouter(router),
    factory: wrapFactory(factory),
    getPair: createGetPair(pairs, getInstance),
    getToken: createGetToken(tokens, getInstance),
    node,
  };
};
