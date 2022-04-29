import { getContext, Context } from '../src/lib/contracts';

let context: Context | null = null;
beforeAll(async () => {
  context = await getContext();
});

//TODO: this context should be mocked up
const ctx = (): Context => {
  if (!context) {
    throw 'initiate context first';
  }
  return context;
};
describe('contract utilities and context', () => {
  it('gets context', async () => {
    const { decodedResult: factoryAddress } = await ctx().router.factory();
    expect(factoryAddress).toBe(process.env.FACTORY_ADDRESS);
  });
  it('get all pairs', async () => {
    await ctx().factory.allPairs();
  });
});
