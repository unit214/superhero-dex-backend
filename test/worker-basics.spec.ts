import { mockContext } from './utils/context.mockup';
import createWorkerMethods from '../src/worker';
import db from '../src/dal/client';
import prisma from '@prisma/client';
import * as data from './data/context-mockups';

type WorkerMethods = ReturnType<typeof createWorkerMethods>;
let workerMethods: WorkerMethods | null = null;

// Testing method
// 1. before all create a common context
// 2. before all reset mockups (Context and Prisma Client)
// 3. run worker methods and and test the impact on db

const activeWorker = (): WorkerMethods => {
  if (!workerMethods) {
    throw 'initiate worker first';
  }
  return workerMethods;
};

//
beforeEach(async () => {
  await db.pairLiquidityInfo.deleteMany();
  await db.pair.deleteMany();
  await db.token.deleteMany();
  const ctx = mockContext(data.context2);
  workerMethods = createWorkerMethods(ctx);
  await activeWorker().refreshPairs();
});
it('inserts new pairs', async () => {
  const pairs: prisma.Pair[] = await db.pair.findMany();
  expect(await db.pair.count()).toBe(3);
  for (let i = 0; i < 3; i++) {
    expect(pairs[i]).toMatchObject({
      address: data.context2.pairs[i].address,
      synchronized: false,
    });
  }
});

it('refresh pairs liquidity', async () => {
  await activeWorker().refreshPairsLiquidity();

  const pairs = await db.pair.findMany({
    include: { liquidityInfo: true },
    orderBy: { address: 'asc' },
  });
  for (let i = 0; i < 3; i++) {
    const expected = data.context2.pairs[i];
    expect(pairs[i].liquidityInfo).toMatchObject({
      reserve0: expected.reserve0.toString(),
      reserve1: expected.reserve1.toString(),
      totalSupply: expected.totalSupply.toString(),
    });
  }
});

it('refresh new added pairs', async () => {
  const ctx = mockContext(data.context21);
  workerMethods = createWorkerMethods(ctx);
  await activeWorker().refreshPairs();
  const pairs: prisma.Pair[] = await db.pair.findMany();
  expect(await db.pair.count()).toBe(4);
  expect(pairs[3]).toMatchObject({
    address: data.context21.pairs[3].address,
    synchronized: false,
  });
});

it('refresh liquidity for new added pairs', async () => {
  const ctx = mockContext(data.context21);
  workerMethods = createWorkerMethods(ctx);
  await activeWorker().refreshPairs();
  await activeWorker().refreshPairsLiquidity();
  const pairs = await db.pair.findMany({
    include: { liquidityInfo: true },
    orderBy: { address: 'asc' },
  });
  const expected = data.context21.pairs[3];
  expect(pairs[3].liquidityInfo).toMatchObject({
    reserve0: expected.reserve0.toString(),
    reserve1: expected.reserve1.toString(),
    totalSupply: expected.totalSupply.toString(),
  });
});

it('unsync all pairs', async () => {
  await activeWorker().unsyncAllPairs();
  const pairs = await db.pair.findMany({ where: { synchronized: true } });
  expect(pairs.length).toBe(0);
});
