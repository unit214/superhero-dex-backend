import { Context, PairMethods } from '../src/lib/contracts';
import { ContractAddress } from '../src/lib/utils';
import { mockDeep } from 'jest-mock-extended';
import {
  mockContext,
  ContextData,
  mockupContractMethod,
} from './utils/context.mockup';

describe('Context', () => {
  it('sample mockup', async () => {
    const mocked = mockDeep<Context>();

    const mockedPM = mockDeep<PairMethods>();
    mockedPM.token0
      .calledWith()
      .mockReturnValue(Promise.resolve(mockupContractMethod('ct_asdada')));

    mocked.getPair
      .calledWith('ct_asda')
      .mockReturnValue(Promise.resolve(mockedPM));
    const ss = await mocked.getPair('ct_asda');
    expect((await ss.token0()).decodedResult).toBe('ct_asdada');
  });
});

const testContextDataMockup = (label: string, contextData: ContextData) => {
  describe(label, () => {
    const context = mockContext(contextData);

    it('test router.factory()', async () => {
      expect((await context.router.factory()).decodedResult).toBe(
        contextData.factory,
      );
    });

    it('test factory.allPairs()', async () => {
      const { decodedResult: pairs } = await context.factory.allPairs();
      debugger;
      expect(pairs).toEqual(contextData.pairs.map((x) => x.address).reverse());
    });

    for (const token of contextData.tokens) {
      it(`test getToken('${token.address}')`, async () => {
        const methods = await context.getToken(token.address);
        expect((await methods.metaInfo()).decodedResult).toEqual(
          token.metaInfo,
        );
      });
    }

    for (const pair of contextData.pairs) {
      it(`test getPair('${pair.address} and token0(),token1()')`, async () => {
        const pairMethods = await context.getPair(pair.address);
        expect((await pairMethods.token0()).decodedResult).toBe(
          contextData.tokens[pair.t0].address,
        );
        expect((await pairMethods.token1()).decodedResult).toBe(
          contextData.tokens[pair.t1].address,
        );
        expect((await pairMethods.totalSupply()).decodedResult).toBe(
          pair.totalSupply,
        );
        expect((await pairMethods.reserves()).decodedResult).toEqual({
          reserve0: pair.reserve0,
          reserve1: pair.reserve1,
        });
      });
    }
  });
};

testContextDataMockup('test context data #1', {
  factory: 'ct_1',
  pairs: [],
  tokens: [],
});

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
      symbol: 'B',
      decimals: 10n,
    },
  },
];
testContextDataMockup('test context data #2', {
  factory: 'ct_1',
  pairs: [],
  tokens: tokens,
});

testContextDataMockup('test context data #3', {
  factory: 'ct_1',
  pairs: [
    {
      address: 'ct_p1',
      reserve0: 1n,
      reserve1: 2n,
      totalSupply: 2n * 1n,
      t0: 0,
      t1: 1,
    },
    {
      address: 'ct_p2',
      reserve0: 10n,
      reserve1: 20000n,
      totalSupply: 10n * 20000n,
      t0: 1,
      t1: 2,
    },
    {
      address: 'ct_p3',
      reserve0: 1n,
      reserve1: 3n,
      totalSupply: 1n * 3n,
      t0: 0,
      t1: 2,
    },
  ],
  tokens: tokens,
});
