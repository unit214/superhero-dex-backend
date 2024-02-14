import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/api/app.module';

import { mockContext, listToken } from './utils';
import worker from '../src/worker';
import * as db from './utils/db';
import * as data from './data/context-mockups';

type WorkerMethods = ReturnType<typeof worker>;
let activeWorker: WorkerMethods;

// Testing method:
// for every test we initiate context with different data as:
//      - create a common context
//      - reset mockups (Context and Prisma Client)
//      - refreshPairs
//      - initiate nest app

let app: INestApplication;
const initWorker = async (dataCtx: any) => {
  await db.clean();
  const ctx = mockContext(dataCtx);
  activeWorker = worker(ctx);
  await activeWorker.refreshPairs();
};

const initApp = async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  await app.init();
};

const init = async (dataCtx: any) => {
  await initWorker(dataCtx);
  await initApp();
};

describe('swap-routes fetching (e2e)', () => {
  it('/pairs/swap-routes/ct_t0/ct_t5 (GET) 200 no path for unexisting token ', async () => {
    await init(data.context2);

    return request(app.getHttpServer())
      .get('/pairs/swap-routes/ct_t0/ct_t5')
      .expect(200)
      .expect([]);
  });
  it('/pairs/swap-routes/ct_t0/ct_t5 (GET) 200 no path for unexisting pair', async () => {
    await init({
      ...data.context2,
      tokens: data.context2.tokens.concat({
        address: 'ct_t4',
        metaInfo: {
          name: 'D Token',
          symbol: 'D',
          decimals: 18n,
        },
      }),
    });

    return request(app.getHttpServer())
      .get('/pairs/swap-routes/ct_t0/ct_t5')
      .expect(200)
      .expect([]);
  });
  it('/pairs/swap-routes/ct_t0/ct_t4 (GET) 200 direct path', async () => {
    await init(data.context21);

    return request(app.getHttpServer())
      .get('/pairs/swap-routes/ct_t0/ct_t4')
      .expect(200)
      .expect([
        [
          {
            address: 'ct_p4',
            token0: 'ct_t0',
            token1: 'ct_t4',
            synchronized: false,
          },
        ],
      ]);
  });
  it('/pairs/swap-routes/ct_t0/ct_t3 (GET) 200 synchronized', async () => {
    await init(data.context2);
    await activeWorker.refreshPairsLiquidity();

    return request(app.getHttpServer())
      .get('/pairs/swap-routes/ct_t0/ct_t1')
      .expect(200)
      .expect([
        [
          {
            address: 'ct_p1',
            token0: 'ct_t0',
            token1: 'ct_t1',
            synchronized: true,
            liquidityInfo: {
              height: 1,
              totalSupply: '2',
              reserve0: '1',
              reserve1: '2',
            },
          },
        ],
        [
          {
            address: 'ct_p3',
            token0: 'ct_t0',
            token1: 'ct_t3',
            synchronized: true,
            liquidityInfo: {
              height: 1,
              totalSupply: '3',
              reserve0: '1',
              reserve1: '3',
            },
          },
          {
            address: 'ct_p2',
            token0: 'ct_t1',
            token1: 'ct_t3',
            synchronized: true,
            liquidityInfo: {
              height: 1,
              totalSupply: '200000',
              reserve0: '10',
              reserve1: '20000',
            },
          },
        ],
      ]);
  });
  it('/pairs/swap-routes/ct_t0/ct_t1 (GET) 200 one direct path and one indirect path', async () => {
    await init(data.context2);

    return request(app.getHttpServer())
      .get('/pairs/swap-routes/ct_t0/ct_t1')
      .expect(200)
      .expect([
        [
          {
            address: 'ct_p1',
            token0: 'ct_t0',
            token1: 'ct_t1',
            synchronized: false,
          },
        ],
        [
          {
            address: 'ct_p3',
            token0: 'ct_t0',
            token1: 'ct_t3',
            synchronized: false,
          },
          {
            address: 'ct_p2',
            token0: 'ct_t1',
            token1: 'ct_t3',
            synchronized: false,
          },
        ],
      ]);
  });
  it('/pairs/swap-routes/ct_t0/ct_t1?only-listed=true (GET) 200 suppress some paths', async () => {
    await init(data.context2);

    await listToken('ct_t0');
    await listToken('ct_t1');
    return request(app.getHttpServer())
      .get('/pairs/swap-routes/ct_t0/ct_t1?only-listed=true')
      .expect(200)
      .expect([
        [
          {
            address: 'ct_p1',
            token0: 'ct_t0',
            token1: 'ct_t1',
            synchronized: false,
          },
        ],
      ]);
  });
  it('/pairs/swap-routes/ct_t1/ct_t2 (GET) 200 testing reverse order of tokens', async () => {
    await init(data.context2);

    return request(app.getHttpServer())
      .get('/pairs/swap-routes/ct_t1/ct_t0')
      .expect(200)
      .expect([
        [
          {
            address: 'ct_p1',
            token0: 'ct_t0',
            token1: 'ct_t1',
            synchronized: false,
          },
        ],
        [
          {
            address: 'ct_p2',
            token0: 'ct_t1',
            token1: 'ct_t3',
            synchronized: false,
          },
          {
            address: 'ct_p3',
            token0: 'ct_t0',
            token1: 'ct_t3',
            synchronized: false,
          },
        ],
      ]);
  });
  it('/pairs/swap-routes/ct_t0/ct_t1 (GET) 200 one direct path and multiple indirect path', async () => {
    await init({
      ...data.context21,
      pairs: data.context21.pairs.concat({
        address: 'ct_p5',
        reserve0: 1n,
        reserve1: 4n,
        totalSupply: 1n * 4n,
        t0: 1,
        t1: 3,
      }),
    });

    return request(app.getHttpServer())
      .get('/pairs/swap-routes/ct_t0/ct_t1')
      .expect(200)
      .expect([
        [
          {
            address: 'ct_p1',
            token0: 'ct_t0',
            token1: 'ct_t1',
            synchronized: false,
          },
        ],
        [
          {
            address: 'ct_p3',
            token0: 'ct_t0',
            token1: 'ct_t3',
            synchronized: false,
          },
          {
            address: 'ct_p2',
            token0: 'ct_t1',
            token1: 'ct_t3',
            synchronized: false,
          },
        ],
        [
          {
            address: 'ct_p4',
            token0: 'ct_t0',
            token1: 'ct_t4',
            synchronized: false,
          },
          {
            address: 'ct_p5',
            token0: 'ct_t1',
            token1: 'ct_t4',
            synchronized: false,
          },
        ],
      ]);
  });
});
