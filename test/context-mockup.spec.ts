import { Context, PairMethods } from '../src/lib/contracts';
import { mockDeep } from 'jest-mock-extended';
import { mockContext, ContextData, mockupContractMethod } from './utils';
import * as data from './data/context-mockups';
import ContractWithMethods from '@aeternity/aepp-sdk/es/contract/Contract';

describe('Context', () => {
  it('sample mockup', async () => {
    const mocked = mockDeep<Context>();

    const mockedPM = mockDeep<ContractWithMethods<PairMethods>>();
    mockedPM.token0
      .calledWith()
      .mockReturnValue(Promise.resolve(mockupContractMethod('ct_sample')));

    mocked.getPair
      .calledWith('ct_sample')
      .mockReturnValue(Promise.resolve(mockedPM));
    const ss = await mocked.getPair('ct_sample');
    expect((await ss.token0()).decodedResult).toBe('ct_sample');
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
      const { decodedResult: pairs } = await context.factory.get_all_pairs();
      expect(pairs).toEqual(contextData.pairs.map((x) => x.address).reverse());
    });

    for (const token of contextData.tokens) {
      it(`test getToken('${token.address}')`, async () => {
        const methods = await context.getToken(token.address);
        expect((await methods.meta_info()).decodedResult).toEqual(
          token.metaInfo,
        );
      });
    }

    for (const pair of contextData.pairs) {
      it(`test getPair('${pair.address}) and token0(),token1()'`, async () => {
        const pairMethods = await context.getPair(pair.address);
        expect((await pairMethods.token0()).decodedResult).toBe(
          contextData.tokens[pair.t0].address,
        );
        expect((await pairMethods.token1()).decodedResult).toBe(
          contextData.tokens[pair.t1].address,
        );
        expect((await pairMethods.total_supply()).decodedResult).toBe(
          pair.totalSupply,
        );
        expect((await pairMethods.get_reserves()).decodedResult).toEqual({
          reserve0: pair.reserve0,
          reserve1: pair.reserve1,
        });
      });
    }
  });
};

testContextDataMockup('test context data #1', data.context0);

testContextDataMockup('test context data #2', data.context1);

testContextDataMockup('test context data #3', data.context2);
