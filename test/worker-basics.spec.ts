import { getContext, Context } from '../src/lib/contracts';
import { refreshPairs } from '../src/worker';

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
//TODO: tb connection should be mocked up
it('inserts new pairs', async () => {
  await refreshPairs(ctx());
  //TODO: after db mockup verify scenario
});
