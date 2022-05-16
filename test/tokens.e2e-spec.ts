import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/api/app.module';

import worker from '../src/worker';
import { clean as cleanDb } from './utils/db';
import * as data from './data/context-mockups';
import * as dto from '../src/dto';
import * as utils from './utils';
import { nonNullable } from '../src/lib/utils';

type WorkerMethods = ReturnType<typeof worker>;
let activeWorker: WorkerMethods;

// Testing method
// 1. before each
//      - create a common context
//      - reset mockups (Context and Prisma Client)
//      - refreshPairs
// 2. before each
//      - initiate nest app

describe('tokens fetching (e2e)', () => {
  let app: INestApplication;
  beforeEach(async () => {
    await cleanDb();
    const ctx = utils.mockContext(data.context2);
    activeWorker = worker(ctx);
    await activeWorker.refreshPairs();
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/tokens (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/tokens')
      .expect(200);
    const value: dto.TokenWithListed[] = JSON.parse(response.text);

    expect(utils.sortByAddress(value)).toEqual([
      {
        address: 'ct_t0',
        symbol: 'A',
        name: 'A Token',
        decimals: 18,
        listed: false,
      },
      {
        address: 'ct_t1',
        symbol: 'B',
        name: 'B Token',
        decimals: 6,
        listed: false,
      },
      {
        address: 'ct_t3',
        symbol: 'C',
        name: 'C Token',
        decimals: 10,
        listed: false,
      },
    ]);
  });

  it('/tokens/listed (GET) 200 empty', () => {
    return request(app.getHttpServer())
      .get('/tokens/listed')
      .expect(200)
      .expect([]);
  });

  it('/tokens/listed (GET) 200 non-empty', async () => {
    await utils.listToken('ct_t0');
    await utils.listToken('ct_t3');
    const response = await request(app.getHttpServer())
      .get('/tokens/listed')
      .expect(200);
    const value: dto.Token[] = JSON.parse(response.text);

    expect(utils.sortByAddress(value)).toEqual([
      {
        address: 'ct_t0',
        symbol: 'A',
        name: 'A Token',
        decimals: 18,
      },
      {
        address: 'ct_t3',
        symbol: 'C',
        name: 'C Token',
        decimals: 10,
      },
    ]);
  });

  it('/tokens (GET) 200 with some listed', async () => {
    await utils.listToken('ct_t0');
    await utils.listToken('ct_t3');
    const response = await request(app.getHttpServer())
      .get('/tokens')
      .expect(200);
    const value: dto.TokenWithListed[] = JSON.parse(response.text);

    expect(
      value.sort((a: dto.TokenWithListed, b: dto.TokenWithListed) =>
        a.address.localeCompare(b.address),
      ),
    ).toEqual([
      {
        address: 'ct_t0',
        symbol: 'A',
        name: 'A Token',
        decimals: 18,
        listed: true,
      },
      {
        address: 'ct_t1',
        symbol: 'B',
        name: 'B Token',
        decimals: 6,
        listed: false,
      },
      {
        address: 'ct_t3',
        symbol: 'C',
        name: 'C Token',
        decimals: 10,
        listed: true,
      },
    ]);
  });

  it('/tokens/by-address/ct_t0 (GET) 200', () => {
    return request(app.getHttpServer())
      .get('/tokens/by-address/ct_t0')
      .expect(200)
      .expect({
        address: 'ct_t0',
        symbol: 'A',
        name: 'A Token',
        decimals: 18,
        listed: false,
        pairs: ['ct_p1', 'ct_p3'],
      });
  });

  it('/tokens/by-address/ct_tXXX (GET) 404', () => {
    return request(app.getHttpServer())
      .get('/tokens/by-address/ct_tXXX')
      .expect(404)
      .expect({
        statusCode: 404,
        message: 'token not found',
        error: 'Not Found',
      });
  });

  it('/tokens/by-address/ct_t0/pairs (GET) 200 with no liquidityInfo', async () => {
    const response = await request(app.getHttpServer())
      .get('/tokens/by-address/ct_t0/pairs')
      .expect(200);

    const value: dto.TokenPairs = JSON.parse(response.text);

    expect(utils.sortByAddress(value.pairs0)).toEqual([
      {
        address: 'ct_p1',
        synchronized: false,
        oppositeToken: {
          address: 'ct_t1',
          symbol: 'B',
          name: 'B Token',
          decimals: 6,
          listed: false,
        },
      },
      {
        address: 'ct_p3',
        synchronized: false,
        oppositeToken: {
          address: 'ct_t3',
          symbol: 'C',
          name: 'C Token',
          decimals: 10,
          listed: false,
        },
      },
    ]);
  });
  it('/tokens/by-address/ct_t0/pairs (GET) 200 with pairs only on pairs0', async () => {
    const ctx = utils.mockContext(data.context21);
    activeWorker = worker(ctx);
    await activeWorker.refreshPairs();
    await activeWorker.refreshPairsLiquidity();

    const response = await request(app.getHttpServer())
      .get('/tokens/by-address/ct_t0/pairs')
      .expect(200);

    const value: dto.TokenPairs = JSON.parse(response.text);

    expect(value.pairs1).toEqual([]);
    expect(utils.sortByAddress(value.pairs0)).toEqual([
      {
        address: 'ct_p1',
        synchronized: true,
        oppositeToken: {
          address: 'ct_t1',
          symbol: 'B',
          name: 'B Token',
          decimals: 6,
          listed: false,
        },
        liquidityInfo: {
          height: 1,
          totalSupply: '2',
          reserve0: '1',
          reserve1: '2',
        },
      },
      {
        address: 'ct_p3',
        synchronized: true,
        oppositeToken: {
          address: 'ct_t3',
          symbol: 'C',
          name: 'C Token',
          decimals: 10,
          listed: false,
        },
        liquidityInfo: {
          height: 1,
          totalSupply: '3',
          reserve0: '1',
          reserve1: '3',
        },
      },
      {
        address: 'ct_p4',
        synchronized: true,
        oppositeToken: {
          address: 'ct_t4',
          symbol: 'D',
          name: 'D Token',
          decimals: 10,
          listed: false,
        },
        liquidityInfo: {
          height: 1,
          totalSupply: '3',
          reserve0: '1',
          reserve1: '3',
        },
      },
    ]);
  });
  it('/tokens/by-address/ct_t3/pairs (GET) 200 with pairs only on pairs1', async () => {
    const ctx = utils.mockContext(data.context21);
    activeWorker = worker(ctx);
    await activeWorker.refreshPairs();
    await activeWorker.refreshPairsLiquidity();
    await utils.listToken('ct_t0');
    await utils.listToken('ct_t3');

    const response = await request(app.getHttpServer())
      .get('/tokens/by-address/ct_t3/pairs')
      .expect(200);

    const value: dto.TokenPairs = JSON.parse(response.text);

    expect(value.pairs0).toEqual([]);
    expect(utils.sortByAddress(value.pairs1)).toEqual([
      {
        address: 'ct_p2',
        synchronized: true,
        oppositeToken: {
          address: 'ct_t1',
          symbol: 'B',
          name: 'B Token',
          decimals: 6,
          listed: false,
        },
        liquidityInfo: {
          totalSupply: '200000',
          reserve0: '10',
          reserve1: '20000',
          height: 1,
        },
      },
      {
        address: 'ct_p3',
        synchronized: true,
        oppositeToken: {
          address: 'ct_t0',
          symbol: 'A',
          name: 'A Token',
          decimals: 18,
          listed: true,
        },
        liquidityInfo: {
          height: 1,
          totalSupply: '3',
          reserve0: '1',
          reserve1: '3',
        },
      },
    ]);
  });
  it('/tokens/by-address/ct_t3/pairs (GET) 200 with pairs on pairs0 and pairs1', async () => {
    const ctx = utils.mockContext({
      ...data.context21,
      pairs: data.context21.pairs.concat([
        {
          address: 'ct_p5',
          reserve0: 1n,
          reserve1: 3n,
          totalSupply: 1n * 3n,
          t0: 2,
          t1: 3,
        },
        {
          address: 'ct_p6',
          reserve0: 4n,
          reserve1: 10n,
          totalSupply: 4n * 10n,
          t0: 2,
          t1: 1,
        },
      ]),
    });
    activeWorker = worker(ctx);
    await activeWorker.refreshPairs();
    await activeWorker.refreshPairsLiquidity();
    await utils.listToken('ct_t0');
    await utils.listToken('ct_t3');

    const response = await request(app.getHttpServer())
      .get('/tokens/by-address/ct_t3/pairs')
      .expect(200);

    const value: dto.TokenPairs = JSON.parse(response.text);

    expect(utils.sortByAddress(value.pairs0)).toEqual([
      {
        address: 'ct_p5',
        synchronized: true,
        oppositeToken: {
          address: 'ct_t4',
          symbol: 'D',
          name: 'D Token',
          decimals: 10,
          listed: false,
        },
        liquidityInfo: {
          height: 1,
          totalSupply: '3',
          reserve0: '1',
          reserve1: '3',
        },
      },
      {
        address: 'ct_p6',
        synchronized: true,
        oppositeToken: {
          address: 'ct_t1',
          symbol: 'B',
          name: 'B Token',
          decimals: 6,
          listed: false,
        },
        liquidityInfo: {
          height: 1,
          totalSupply: '40',
          reserve0: '4',
          reserve1: '10',
        },
      },
    ]);
    expect(utils.sortByAddress(value.pairs1)).toEqual([
      {
        address: 'ct_p2',
        synchronized: true,
        oppositeToken: {
          address: 'ct_t1',
          symbol: 'B',
          name: 'B Token',
          decimals: 6,
          listed: false,
        },
        liquidityInfo: {
          height: 1,
          totalSupply: '200000',
          reserve0: '10',
          reserve1: '20000',
        },
      },
      {
        address: 'ct_p3',
        synchronized: true,
        oppositeToken: {
          address: 'ct_t0',
          symbol: 'A',
          name: 'A Token',
          decimals: 18,
          listed: true,
        },
        liquidityInfo: {
          height: 1,
          totalSupply: '3',
          reserve0: '1',
          reserve1: '3',
        },
      },
    ]);
  });
  it('/tokens/by-address/ct_tXXX/pairs (GET) 404', () => {
    return request(app.getHttpServer())
      .get('/tokens/by-address/ct_tXXX')
      .expect(404)
      .expect({
        statusCode: 404,
        message: 'token not found',
        error: 'Not Found',
      });
  });
});
describe('listed tokens management (e2e)', () => {
  let app: INestApplication;
  beforeEach(async () => {
    await cleanDb();
    const ctx = utils.mockContext(data.context2);
    activeWorker = worker(ctx);
    await activeWorker.refreshPairs();
    //add some listed tokens
    await utils.listToken('ct_t0');
    await utils.listToken('ct_t3');
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });
  describe('add to token list', () => {
    it('/tokens/listed/ct_xxxx(POST) 401 with no auth key and with invalid token', async () => {
      //
      await request(app.getHttpServer())
        .post('/tokens/listed/ct_xxxx')
        .expect(401);
    });
    it('/tokens/listed/ct_t0 (POST) 401 with no auth key provided and valid token address', async () => {
      //
      await request(app.getHttpServer())
        .post('/tokens/listed/ct_t0')
        .expect(401);
    });
    it('/tokens/listed/ct_xxxx (POST) 401 whith invalid auth key and invalid token', async () => {
      //
      await request(app.getHttpServer())
        .post('/tokens/listed/ct_xxxx')
        .set('Authorization', 'wrong-key')
        .expect(401);
    });
    it('/tokens/listed/ct_xxxx (POST) 401 whith invalid auth key and valid token', async () => {
      //
      await request(app.getHttpServer())
        .post('/tokens/listed/ct_t0')
        .set('Authorization', 'wrong-key')
        .expect(401);
    });
    it('/tokens/listed/ct_xxxx (POST) 404 with valid auth key but with invalid token', async () => {
      await request(app.getHttpServer())
        .post('/tokens/listed/ct_xxxx')
        .set('Authorization', nonNullable(process.env.AUTH_TOKEN))
        .expect(404);
    });
    it('/tokens/listed/ct_t1 (POST) 201 with valid auth key and with valid token', async () => {
      //verify before listing ct_t1
      await request(app.getHttpServer())
        .get('/tokens/by-address/ct_t1')
        .expect(200)
        .expect({
          address: 'ct_t1',
          symbol: 'B',
          name: 'B Token',
          decimals: 6,
          listed: false,
          pairs: ['ct_p2', 'ct_p1'],
        });

      //listing it
      await request(app.getHttpServer())
        .post('/tokens/listed/ct_t1')
        .set('Authorization', nonNullable(process.env.AUTH_TOKEN))
        .expect(201)
        .expect({
          address: 'ct_t1',
          symbol: 'B',
          name: 'B Token',
          decimals: 6,
          listed: true,
        });
      //
      //re-verify ct_t1 to be sure it was persisted also
      await request(app.getHttpServer())
        .get('/tokens/by-address/ct_t1')
        .expect(200)
        .expect({
          address: 'ct_t1',
          symbol: 'B',
          name: 'B Token',
          decimals: 6,
          listed: true,
          pairs: ['ct_p2', 'ct_p1'],
        });
    });
  });
  describe('remove from token list', () => {
    it('/tokens/listed/ct_xxxx (DELETE) 401 with no auth key and with invalid token', async () => {
      //
      await request(app.getHttpServer())
        .delete('/tokens/listed/ct_xxxx')
        .expect(401);
    });
    it('/tokens/listed/ct_t0 (DELETE) 401 with no auth key provided and valid token address', async () => {
      //
      await request(app.getHttpServer())
        .delete('/tokens/listed/ct_t0')
        .expect(401);
    });
    it('/tokens/listed/ct_xxxx (DELETE) 401 whith invalid auth key and invalid token', async () => {
      //
      await request(app.getHttpServer())
        .delete('/tokens/listed/ct_xxxx')
        .set('Authorization', 'wrong-key')
        .expect(401);
    });
    it('/tokens/listed/ct_xxxx (DELETE) 401 whith invalid auth key and valid token', async () => {
      //
      await request(app.getHttpServer())
        .delete('/tokens/listed/ct_t0')
        .set('Authorization', 'wrong-key')
        .expect(401);
    });
    it('/tokens/listed/ct_xxxx (DELETE) 404 with valid auth key but with invalid token', async () => {
      await request(app.getHttpServer())
        .delete('/tokens/listed/ct_xxxx')
        .set('Authorization', nonNullable(process.env.AUTH_TOKEN))
        .expect(404);
    });
    it('/tokens/listed/ct_t3 (DELETE) 200 with valid auth key and with valid token', async () => {
      //verify before unlisting ct_t3
      await request(app.getHttpServer())
        .get('/tokens/by-address/ct_t3')
        .expect(200)
        .expect({
          address: 'ct_t3',
          symbol: 'C',
          name: 'C Token',
          decimals: 10,
          listed: true,
          pairs: ['ct_p2', 'ct_p3'],
        });

      //unlisting it
      await request(app.getHttpServer())
        .delete('/tokens/listed/ct_t3')
        .set('Authorization', nonNullable(process.env.AUTH_TOKEN))
        .expect(200)
        .expect({
          address: 'ct_t3',
          symbol: 'C',
          name: 'C Token',
          decimals: 10,
          listed: false,
        });
      //
      //re-verify ct_t3 to be sure the unlisting was persisted too
      await request(app.getHttpServer())
        .get('/tokens/by-address/ct_t3')
        .expect(200)
        .expect({
          address: 'ct_t3',
          symbol: 'C',
          name: 'C Token',
          decimals: 10,
          listed: false,
          pairs: ['ct_p2', 'ct_p3'],
        });
    });
  });
});
