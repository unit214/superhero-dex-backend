import NETWORKS from './networks';

import { Universal, Node } from '@aeternity/aepp-sdk';
import * as routerInterface from 'dex-contracts-v2/build/IAedexV2Router.aes.js';
import * as factoryInteface from 'dex-contracts-v2/build/IAedexV2Factory.aes.js';

const NETWORK_NAME = process.env.NETWORK_NAME || 'testnet';

const createClient = async () => {
  const node = await Node({
    url: NETWORKS[NETWORK_NAME].nodeUrl,
    ignoreVersion: true,
  });

  return await Universal({
    nodes: [{ name: NETWORK_NAME, instance: node }],
    compilerUrl: NETWORKS[NETWORK_NAME].compilerUrl,
  });
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
  allPairs: () => Promise<string[]>;
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
    allPairs: () => methods.get_all_pairs(),
  };
};

export type Context = {
  router: RouterMethods;
  factory: FactoryMethods;
};

export const getContext = async () => {
  const client = await createClient();
  const router = await client.getContractInstance({
    source: routerInterface,
    contractAddress: process.env.ROUTER_ADDRESS,
  });
  const factory = await client.getContractInstance({
    source: factoryInteface,
    contractAddress: process.env.FACTORY_ADDRESS,
  });
  return {
    router: wrapRouter(router),
    factory: wrapFactory(factory),
  };
};
