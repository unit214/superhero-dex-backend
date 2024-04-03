import { nonNullable } from '../../src/lib/utils';
import { mockDeep } from 'jest-mock-extended';
import ContractWithMethods from '@aeternity/aepp-sdk/es/contract/Contract';
import {
  Aex9Methods,
  Context,
  MetaInfo,
  PairMethods,
} from '../../src/tasks/pair-sync/pair-sync.model';
import { CallData, ContractAddress } from '../../src/clients/sdk-client.model';
const mockupResult = () =>
  mockDeep<{
    callerId: string;
    callerNonce: string;
    contractId: string;
    gasPrice: bigint;
    gasUsed: number;
    height: number;
    log: any[];
    returnType: 'ok' | 'revert';
    returnValue: CallData;
  }>({
    height: 1,
  });

export const mockupContractMethod = <T>(t: T) =>
  Promise.resolve({
    decodedResult: t,
    result: mockupResult(),
  } as unknown as any);

export type ContextData = {
  factory: ContractAddress;
  pairs: {
    address: ContractAddress;
    reserve0: bigint;
    reserve1: bigint;
    totalSupply: bigint;
    t0: number;
    t1: number;
  }[];
  tokens: { address: ContractAddress; metaInfo: MetaInfo }[];
};

export const mockContext = (data: ContextData) => {
  const mocked = mockDeep<Context>();

  // router
  mocked.router.factory
    .calledWith()
    .mockReturnValue(mockupContractMethod(data.factory));

  // factory
  mocked.factory.get_all_pairs
    .calledWith()
    .mockReturnValue(
      mockupContractMethod(data.pairs.map((x) => x.address).reverse()),
    );

  //getPair
  for (const pair of data.pairs) {
    const pairMethodsMocked = mockDeep<ContractWithMethods<PairMethods>>();
    mocked.getPair
      .calledWith(pair.address)
      .mockReturnValue(Promise.resolve(pairMethodsMocked));

    //total supply
    pairMethodsMocked.total_supply
      .calledWith()
      .mockReturnValue(mockupContractMethod(pair.totalSupply));

    //tokens
    pairMethodsMocked.token0
      .calledWith()
      .mockReturnValue(
        mockupContractMethod(nonNullable(data.tokens[pair.t0]).address),
      );
    pairMethodsMocked.token1
      .calledWith()
      .mockReturnValue(
        mockupContractMethod(nonNullable(data.tokens[pair.t1]).address),
      );

    //reserves
    pairMethodsMocked.get_reserves.calledWith().mockReturnValue(
      mockupContractMethod({
        reserve0: pair.reserve0,
        reserve1: pair.reserve1,
      }),
    );
  }

  //getToken
  for (const token of data.tokens) {
    const tokenMethodsMocked = mockDeep<ContractWithMethods<Aex9Methods>>();

    mocked.getToken
      .calledWith(token.address)
      .mockReturnValue(Promise.resolve(tokenMethodsMocked));

    //meta info
    tokenMethodsMocked.meta_info
      .calledWith()
      .mockReturnValue(mockupContractMethod(token.metaInfo));
  }

  return mocked;
};
