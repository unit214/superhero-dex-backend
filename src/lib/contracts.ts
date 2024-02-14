import NETWORKS from './networks';
import {
  AeSdk,
  Node,
  ContractMethodsBase,
} from '@aeternity/aepp-sdk';
import { ContractAddress, nonNullable } from './utils';
import * as routerInterface from 'dex-contracts-v2/build/AedexV2Router.aci.json';
import * as factoryInterface from 'dex-contracts-v2/build/AedexV2Factory.aci.json';
import * as pairInterface from 'dex-contracts-v2/build/AedexV2Pair.aci.json';
import ContractWithMethods from '@aeternity/aepp-sdk/es/contract/Contract';

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
  factory: () => ContractAddress;
};

export type FactoryMethods = {
  get_all_pairs: () => ContractAddress[];
};

export type PairMethods = {
  token0: () => ContractAddress;
  token1: () => ContractAddress;
  total_supply: () => bigint;
  get_reserves: () => {
    reserve0: bigint;
    reserve1: bigint;
  };
};

export type MetaInfo = {
  name: string;
  symbol: string;
  decimals: bigint;
};

export type Aex9Methods = {
  meta_info: () => MetaInfo;
};

export type Context = {
  router: ContractWithMethods<RouterMethods>;
  factory: ContractWithMethods<FactoryMethods>;
  getPair: (
    address: ContractAddress,
  ) => Promise<ContractWithMethods<PairMethods>>;
  getToken: (
    address: ContractAddress,
  ) => Promise<ContractWithMethods<Aex9Methods>>;
  node: Node;
};

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
    const token = await getInstance<Aex9Methods>(pairInterface, tokenAddress);
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

export const getContext = async (): Promise<Context> => {
  const routerAddress = process.env.ROUTER_ADDRESS;
  if (!routerAddress) {
    throw new Error('Router address is not set');
  }
  const [client, node] = await getClient();
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
  const pairs: { [key: string]: ContractWithMethods<PairMethods> | undefined } =
    {};
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
