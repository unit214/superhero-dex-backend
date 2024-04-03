import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { sortByAddress } from '../test-utils/utils';
import * as data from '../test-utils/context-mock-data';
import { cleanDb, listToken } from '../test-utils/db-helper';
import { PrismaService } from '../../src/database/prisma.service';
import { PairSyncService } from '../../src/tasks/pair-sync/pair-sync.service';
import { PairsController } from '../../src/api/pairs/pairs.controller';
import { PairsService } from '../../src/api/pairs/pairs.service';
import { PairDbService } from '../../src/database/pair/pair-db.service';
import { TokenDbService } from '../../src/database/token/token-db.service';
import { MdwWsClientService } from '../../src/clients/mdw-ws-client.service';
import { SdkClientService } from '../../src/clients/sdk-client.service';
import { mockContext } from '../test-utils/context-mock';

// Testing method
// before all
//   - initiate nest app
// before each
//   - clean db
//   - create a common context
//   - refreshPairs
// after all
//   - close nest app
//   - disconnect from prisma
describe('PairsController', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let pairSyncService: PairSyncService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PairsController],
      providers: [
        MdwWsClientService,
        SdkClientService,
        PairDbService,
        PairDbService,
        PairsService,
        PairSyncService,
        PrismaService,
        TokenDbService,
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prismaService = module.get(PrismaService);
    pairSyncService = module.get(PairSyncService);
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await cleanDb(prismaService);
    pairSyncService.ctx = mockContext(data.context2);
    await pairSyncService['refreshPairs']();
  });

  describe('/pairs', () => {
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
      await pairSyncService['refreshPairsLiquidity']();
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
      await pairSyncService['refreshPairsLiquidity']();
      pairSyncService.ctx = mockContext(data.context21);
      await pairSyncService['refreshPairs']();
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
      await pairSyncService['refreshPairsLiquidity']();
      pairSyncService.ctx = mockContext(data.context21);
      await pairSyncService['refreshPairs']();

      let response = await request(app.getHttpServer())
        .get('/pairs?only-listed=true')
        .expect(200);

      expect(sortByAddress(JSON.parse(response.text))).toEqual([]);
      await listToken(prismaService, 'ct_t0');
      await listToken(prismaService, 'ct_t3');
      await listToken(prismaService, 'ct_t4');

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
      await pairSyncService['refreshPairsLiquidity']();
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
      await pairSyncService['refreshPairsLiquidity']();
      await pairSyncService['unsyncAllPairs']();
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

  describe('/pairs/swap-routes', () => {
    it('/pairs/swap-routes/ct_t0/ct_t5 (GET) 200 no path for unexisting token ', async () => {
      return request(app.getHttpServer())
        .get('/pairs/swap-routes/ct_t0/ct_t5')
        .expect(200)
        .expect([]);
    });

    it('/pairs/swap-routes/ct_t0/ct_t5 (GET) 200 no path for unexisting pair', async () => {
      pairSyncService.ctx = mockContext({
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
      await pairSyncService['refreshPairs']();

      return request(app.getHttpServer())
        .get('/pairs/swap-routes/ct_t0/ct_t5')
        .expect(200)
        .expect([]);
    });

    it('/pairs/swap-routes/ct_t0/ct_t4 (GET) 200 direct path', async () => {
      pairSyncService.ctx = mockContext(data.context21);
      await pairSyncService['refreshPairs']();

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
      pairSyncService.ctx = mockContext(data.context21);
      await pairSyncService['refreshPairsLiquidity']();

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
      await listToken(prismaService, 'ct_t0');
      await listToken(prismaService, 'ct_t1');
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
      pairSyncService.ctx = mockContext({
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
      await pairSyncService['refreshPairs']();

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
});
