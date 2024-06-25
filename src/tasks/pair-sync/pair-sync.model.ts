import { Node } from '@aeternity/aepp-sdk';
import ContractWithMethods from '@aeternity/aepp-sdk/es/contract/Contract';

import { ContractAddress } from '@/clients/sdk-client.model';

export type MetaInfo = {
  name: string;
  symbol: string;
  decimals: bigint;
};

export type Aex9Methods = {
  meta_info: () => MetaInfo;
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
