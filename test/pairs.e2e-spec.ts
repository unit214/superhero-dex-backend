import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { listToken, mockContext, sortByAddress } from './utils';
import createWorkerMethods from '../src/worker';
import * as data from './data/context-mockups';
import * as db from './utils/db';
import { TokensModule } from '../src/api/tokens/module';
import { PairsModule } from '../src/api/pairs/module';

type WorkerMethods = ReturnType<typeof createWorkerMethods>;
let activeWorker: WorkerMethods;

// Testing method
// 1. before each
//      - create a common context
//      - reset mockups (Context and Prisma Client)
//      - refreshPairs
// 2. before each
//      - initiate nest app

describe('pairs fetching (e2e)', () => {
  let app: INestApplication;
  beforeEach(async () => {
    await db.clean();
    const ctx = mockContext(data.context2);
    activeWorker = createWorkerMethods(ctx);
    await activeWorker.refreshPairs();
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TokensModule, PairsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/pairs (GET) 200 unsynced', () => {
    return request(app.getHttpServer())
      .get('/pairs')
      .expect(200)
      .expect([
        {
          address: 'ct_p1',
          token0: 'ct_t0',
          token1: 'ct_t1',
          synchronized: false,
        },
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
      ]);
  });

  it('/pairs (GET) 200 synchronized', async () => {
    await activeWorker.refreshPairsLiquidity();
    const response = await request(app.getHttpServer())
      .get('/pairs')
      .expect(200);

    expect(sortByAddress(JSON.parse(response.text))).toEqual([
      {
        address: 'ct_p1',
        token0: 'ct_t0',
        token1: 'ct_t1',
        synchronized: true,
      },
      {
        address: 'ct_p2',
        token0: 'ct_t1',
        token1: 'ct_t3',
        synchronized: true,
      },
      {
        address: 'ct_p3',
        token0: 'ct_t0',
        token1: 'ct_t3',
        synchronized: true,
      },
    ]);
  });

  it('/pairs (GET) 200 with new pair', async () => {
    await activeWorker.refreshPairsLiquidity();
    const ctx = mockContext(data.context21);
    activeWorker = createWorkerMethods(ctx);
    await activeWorker.refreshPairs();
    const response = await request(app.getHttpServer())
      .get('/pairs')
      .expect(200);

    expect(sortByAddress(JSON.parse(response.text))).toEqual([
      {
        address: 'ct_p1',
        token0: 'ct_t0',
        token1: 'ct_t1',
        synchronized: true,
      },
      {
        address: 'ct_p2',
        token0: 'ct_t1',
        token1: 'ct_t3',
        synchronized: true,
      },
      {
        address: 'ct_p3',
        token0: 'ct_t0',
        token1: 'ct_t3',
        synchronized: true,
      },
      {
        address: 'ct_p4',
        synchronized: false,
        token0: 'ct_t0',
        token1: 'ct_t4',
      },
    ]);
  });

  it('/pairs (GET) 200 only-listed=true', async () => {
    await activeWorker.refreshPairsLiquidity();
    const ctx = mockContext(data.context21);
    activeWorker = createWorkerMethods(ctx);
    await activeWorker.refreshPairs();

    let response = await request(app.getHttpServer())
      .get('/pairs?only-listed=true')
      .expect(200);

    expect(sortByAddress(JSON.parse(response.text))).toEqual([]);
    await listToken('ct_t0');
    await listToken('ct_t3');
    await listToken('ct_t4');

    response = await request(app.getHttpServer())
      .get('/pairs?only-listed=true')
      .expect(200);
    expect(sortByAddress(JSON.parse(response.text))).toEqual([
      {
        address: 'ct_p3',
        token0: 'ct_t0',
        token1: 'ct_t3',
        synchronized: true,
      },
      {
        address: 'ct_p4',
        token0: 'ct_t0',
        token1: 'ct_t4',
        synchronized: false,
      },
    ]);
  });

  it('/pairs/by-address/ct_p1 (GET) 200 no liquidity', async () => {
    return request(app.getHttpServer())
      .get('/pairs/by-address/ct_p1')
      .expect(200)
      .expect({
        address: 'ct_p1',
        token0: {
          address: 'ct_t0',
          symbol: 'A',
          name: 'A Token',
          decimals: 18,
          listed: false,
          malformed: false,
          noContract: false,
        },
        token1: {
          address: 'ct_t1',
          symbol: 'B',
          name: 'B Token',
          decimals: 6,
          listed: false,
          malformed: false,
          noContract: false,
        },
        synchronized: false,
      });
  });
  it('/pairs/by-address/ct_p1 (GET) 200 synchronized', async () => {
    await activeWorker.refreshPairsLiquidity();
    return request(app.getHttpServer())
      .get('/pairs/by-address/ct_p1')
      .expect(200)
      .expect({
        address: 'ct_p1',
        token0: {
          address: 'ct_t0',
          symbol: 'A',
          name: 'A Token',
          decimals: 18,
          listed: false,
          malformed: false,
          noContract: false,
        },
        token1: {
          address: 'ct_t1',
          symbol: 'B',
          name: 'B Token',
          decimals: 6,
          listed: false,
          malformed: false,
          noContract: false,
        },
        synchronized: true,
        liquidityInfo: {
          height: 1,
          totalSupply: '2',
          reserve0: '1',
          reserve1: '2',
        },
      });
  });
  it('/pairs/by-address/ct_p1 (GET) 200 unsynchronized with liquidity', async () => {
    await activeWorker.refreshPairsLiquidity();
    await activeWorker.unsyncAllPairs();
    return request(app.getHttpServer())
      .get('/pairs/by-address/ct_p1')
      .expect(200)
      .expect({
        address: 'ct_p1',
        token0: {
          address: 'ct_t0',
          symbol: 'A',
          name: 'A Token',
          decimals: 18,
          listed: false,
          malformed: false,
          noContract: false,
        },
        token1: {
          address: 'ct_t1',
          symbol: 'B',
          name: 'B Token',
          decimals: 6,
          listed: false,
          malformed: false,
          noContract: false,
        },
        synchronized: false,
        liquidityInfo: {
          height: 1,
          totalSupply: '2',
          reserve0: '1',
          reserve1: '2',
        },
      });
  });
  it('/pairs/by-address/ct_0000 (GET) 404 not founded pair', async () => {
    return request(app.getHttpServer())
      .get('/pairs/by-address/ct_0000')
      .expect(404)
      .expect({
        statusCode: 404,
        message: 'pair not found',
        error: 'Not Found',
      });
  });
});
