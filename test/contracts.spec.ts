import { getContext, Context } from '../src/lib/contracts';
import { mockupEnvVars, TEST_NET_VARS } from './utils/env.mockups';

describe('with real Context on testnet', () => {
  let context: Context | null = null;
  mockupEnvVars(TEST_NET_VARS);

  beforeAll(async () => {
    context = await getContext();
  });

  const ctx = (): Context => {
    if (!context) {
      throw 'initiate context first';
    }
    return context;
  };

  it('matches the .env factory', async () => {
    const { decodedResult: factoryAddress } = await ctx().router.factory();
    expect(factoryAddress).toBe(process.env.FACTORY_ADDRESS);
  });
  it('should have at least 16 pairs', async () => {
    expect(
      (await ctx().factory.allPairs()).decodedResult.length,
    ).toBeGreaterThanOrEqual(16);
  });
  it('pair should return right token addresses', async () => {
    const { decodedResult: allPairs } = await ctx().factory.allPairs();
    const pairAddress = allPairs[allPairs.length - 1];
    expect(pairAddress).toBe(
      'ct_efYtiwDg4YZxDWE3iLPzvrjb92CJPvzGwriv4ZRuvuTDMNMb9',
    );
    const pairMethods = await ctx().getPair(pairAddress);
    if (!pairMethods) {
      fail('pairMethods is null');
    }
    expect((await pairMethods.token0()).decodedResult).toBe(
      'ct_7tTzPfvv3Vx8pCEcuk1kmgtn4sFsYCQDzLi1LvFs8T5PJqgsC',
    );
    expect((await pairMethods.token1()).decodedResult).toBe(
      'ct_b7FZHQzBcAW4r43ECWpV3qQJMQJp5BxkZUGNKrqqLyjVRN3SC',
    );
  });
  it('regular aex9 token should have right metaInfo', async () => {
    const tokenMethods = await ctx().getToken(
      'ct_7tTzPfvv3Vx8pCEcuk1kmgtn4sFsYCQDzLi1LvFs8T5PJqgsC',
    );

    const { decodedResult: metaInfo } = await tokenMethods.metaInfo();
    expect(metaInfo).toEqual({
      decimals: 18n,
      name: 'TestAEX9-B',
      symbol: 'TAEX9-B',
    });
  });
  it('WAE token should have right metaInfo', async () => {
    const tokenMethods = await ctx().getToken(
      'ct_JDp175ruWd7mQggeHewSLS1PFXt9AzThCDaFedxon8mF8xTRF',
    );
    const { decodedResult: metaInfo } = await tokenMethods.metaInfo();
    expect(metaInfo).toEqual({
      decimals: 18n,
      name: 'Wrapped Aeternity',
      symbol: 'WAE',
    });
  });
});
