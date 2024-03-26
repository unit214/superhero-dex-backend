import { ContractAddress } from '../../src/lib/utils';
import { ContextData } from '../utils';

const tokens = [
  {
    address: 'ct_t0' as ContractAddress,
    metaInfo: {
      name: 'A Token',
      symbol: 'A',
      decimals: 18n,
    },
  },
  {
    address: 'ct_t1' as ContractAddress,
    metaInfo: {
      name: 'B Token',
      symbol: 'B',
      decimals: 6n,
    },
  },
  {
    address: 'ct_t3' as ContractAddress,
    metaInfo: {
      name: 'C Token',
      symbol: 'C',
      decimals: 10n,
    },
  },
];
const pairs = [
  {
    address: 'ct_p1' as ContractAddress,
    reserve0: 1n,
    reserve1: 2n,
    totalSupply: 2n * 1n,
    t0: 0,
    t1: 1,
  },
  {
    address: 'ct_p2' as ContractAddress,
    reserve0: 10n,
    reserve1: 20000n,
    totalSupply: 10n * 20000n,
    t0: 1,
    t1: 2,
  },
  {
    address: 'ct_p3' as ContractAddress,
    reserve0: 1n,
    reserve1: 3n,
    totalSupply: 1n * 3n,
    t0: 0,
    t1: 2,
  },
];
export const context0: ContextData = {
  factory: 'ct_1',
  pairs: [],
  tokens: [],
};
export const context1: ContextData = {
  factory: 'ct_1',
  pairs: [],
  tokens: tokens,
};

export const context2: ContextData = {
  factory: 'ct_1',
  pairs: pairs,
  tokens: tokens,
};

export const context21: ContextData = {
  factory: 'ct_1',
  pairs: pairs.concat({
    address: 'ct_p4' as ContractAddress,
    reserve0: 1n,
    reserve1: 3n,
    totalSupply: 1n * 3n,
    t0: 0,
    t1: 3,
  }),
  tokens: tokens.concat({
    address: 'ct_t4' as ContractAddress,
    metaInfo: {
      name: 'D Token',
      symbol: 'D',
      decimals: 10n,
    },
  }),
};
