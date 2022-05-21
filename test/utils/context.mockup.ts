import {
  Context,
  PairMethods,
  MetaInfo,
  Aex9Methods,
} from '../../src/lib/contracts';
import {
  ContractAddress,
  WalletAddress,
  CallData,
  nonNullable,
} from '../../src/lib/utils';
import { mockDeep } from 'jest-mock-extended';

const mockupResult = () =>
  mockDeep<{
    callerId: WalletAddress;
    callerNonce: number;
    contractId: ContractAddress;
    gasPrice: number;
    gasUsed: number;
    height: number;
    log: any[];
    returnType: 'ok' | 'revert';
    returnValue: CallData;
  }>();
export const mockupContractMethod = <T>(t: T) =>
  Promise.resolve({ decodedResult: t, result: mockupResult() });
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
  mocked.factory.allPairs
    .calledWith()
    .mockReturnValue(
      mockupContractMethod(data.pairs.map((x) => x.address).reverse()),
    );

  //getPair
  for (const pair of data.pairs) {
    const pairMethodsMocked = mockDeep<PairMethods>();
    mocked.getPair
      .calledWith(pair.address)
      .mockReturnValue(Promise.resolve(pairMethodsMocked));

    //total supply
    pairMethodsMocked.totalSupply
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
    pairMethodsMocked.reserves.calledWith().mockReturnValue(
      mockupContractMethod({
        reserve0: pair.reserve0,
        reserve1: pair.reserve1,
      }),
    );
  }

  //getToken
  for (const token of data.tokens) {
    const tokenMethodsMocked = mockDeep<Aex9Methods>();

    mocked.getToken
      .calledWith(token.address)
      .mockReturnValue(Promise.resolve(tokenMethodsMocked));

    //meta info
    tokenMethodsMocked.metaInfo
      .calledWith()
      .mockReturnValue(mockupContractMethod(token.metaInfo));
  }

  return mocked;
};
