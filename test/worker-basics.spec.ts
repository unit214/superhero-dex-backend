import { getContext, Context } from '../src/lib/contracts';
import worker from '../src/worker';
import db from '../src/dal/client';

type WorkerMethods = ReturnType<typeof worker>;
let context: Context | null = null;
let workerMethods: WorkerMethods | null = null;

beforeAll(async () => {
  context = await getContext();
  workerMethods = worker(context);
});

//TODO: this context should be mocked up
const wrk = (): WorkerMethods => {
  if (!workerMethods) {
    throw 'initiate worker first';
  }
  return workerMethods;
};

//
//TODO: db connection should be mocked up
//

it('inserts new pairs', async () => {
  await wrk().refreshPairs();
  //TODO: after db mockup verify scenario
});

it('refresh pairs liquidity', async () => {
  await wrk().refreshPairsLiquidity();
  //TODO: after db mockup verify scenario
});

it('unsync all pairs', async () => {
  await wrk().unsyncAllPairs();
  //TODO: after db mockup verify scenario
  const pairs = await db.pair.findMany({ where: { synchronized: true } });
  expect(pairs.length).toBe(0);
});
