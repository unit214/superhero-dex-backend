import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import * as dto from '@/api/api.model';
import { TokensController } from '@/api/tokens/tokens.controller';
import { TokensService } from '@/api/tokens/tokens.service';
import { MdwWsClientService } from '@/clients/mdw-ws-client.service';
import { SdkClientService } from '@/clients/sdk-client.service';
import { PairDbService } from '@/database/pair/pair-db.service';
import { PrismaService } from '@/database/prisma.service';
import { TokenDbService } from '@/database/token/token-db.service';
import { nonNullable } from '@/lib/utils';
import { PairSyncService } from '@/tasks/pair-sync/pair-sync.service';
import { mockContext } from '@/test/test-utils/context-mock';
import * as data from '@/test/test-utils/context-mock-data';
import { cleanDb, listToken } from '@/test/test-utils/db-helper';
import { sortByAddress } from '@/test/test-utils/utils';

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
describe('TokenController', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let pairSyncService: PairSyncService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TokensController],
      providers: [
        MdwWsClientService,
        SdkClientService,
        PairDbService,
        PairSyncService,
        PrismaService,
        TokenDbService,
        TokensService,
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prismaService = module.get(PrismaService);
    pairSyncService = module.get(PairSyncService);
  });

  beforeEach(async () => {
    await cleanDb(prismaService);
    pairSyncService.ctx = mockContext(data.context2);
    await pairSyncService['refreshPairs']();
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await app.close();
  });

  describe('/tokens', () => {
    it('/tokens (GET)', async () => {
      const response = await request(app.getHttpServer())
        .get('/tokens')
        .expect(200);
      const value: dto.TokenWithListed[] = JSON.parse(response.text);

      expect(sortByAddress(value)).toEqual([
        {
          address: 'ct_t0',
          symbol: 'A',
          name: 'A Token',
          decimals: 18,
          listed: false,
          malformed: false,
          noContract: false,
        },
        {
          address: 'ct_t1',
          symbol: 'B',
          name: 'B Token',
          decimals: 6,
          listed: false,
          malformed: false,
          noContract: false,
        },
        {
          address: 'ct_t3',
          symbol: 'C',
          name: 'C Token',
          decimals: 10,
          listed: false,
          malformed: false,
          noContract: false,
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
      await listToken(prismaService, 'ct_t0');
      await listToken(prismaService, 'ct_t3');
      const response = await request(app.getHttpServer())
        .get('/tokens/listed')
        .expect(200);
      const value: dto.Token[] = JSON.parse(response.text);

      expect(sortByAddress(value)).toEqual([
        {
          address: 'ct_t0',
          symbol: 'A',
          name: 'A Token',
          decimals: 18,
          malformed: false,
          noContract: false,
        },
        {
          address: 'ct_t3',
          symbol: 'C',
          name: 'C Token',
          decimals: 10,
          malformed: false,
          noContract: false,
        },
      ]);
    });

    it('/tokens (GET) 200 with some listed', async () => {
      await listToken(prismaService, 'ct_t0');
      await listToken(prismaService, 'ct_t3');
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
          malformed: false,
          noContract: false,
        },
        {
          address: 'ct_t1',
          symbol: 'B',
          name: 'B Token',
          decimals: 6,
          listed: false,
          malformed: false,
          noContract: false,
        },
        {
          address: 'ct_t3',
          symbol: 'C',
          name: 'C Token',
          decimals: 10,
          listed: true,
          malformed: false,
          noContract: false,
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
          malformed: false,
          noContract: false,
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

      expect(sortByAddress(value.pairs0)).toEqual([
        {
          address: 'ct_p1',
          synchronized: false,
          oppositeToken: {
            address: 'ct_t1',
            symbol: 'B',
            name: 'B Token',
            decimals: 6,
            listed: false,
            malformed: false,
            noContract: false,
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
            malformed: false,
            noContract: false,
          },
        },
      ]);
    });

    it('/tokens/by-address/ct_t0/pairs (GET) 200 with pairs only on pairs0', async () => {
      pairSyncService.ctx = mockContext(data.context21);
      await pairSyncService['refreshPairs']();
      await pairSyncService['refreshPairsLiquidity']();

      const response = await request(app.getHttpServer())
        .get('/tokens/by-address/ct_t0/pairs')
        .expect(200);

      const value: dto.TokenPairs = JSON.parse(response.text);

      expect(value.pairs1).toEqual([]);
      expect(sortByAddress(value.pairs0)).toEqual([
        {
          address: 'ct_p1',
          synchronized: true,
          oppositeToken: {
            address: 'ct_t1',
            symbol: 'B',
            name: 'B Token',
            decimals: 6,
            listed: false,
            malformed: false,
            noContract: false,
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
            malformed: false,
            noContract: false,
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
            malformed: false,
            noContract: false,
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
      pairSyncService.ctx = mockContext(data.context21);
      await pairSyncService['refreshPairs']();
      await pairSyncService['refreshPairsLiquidity']();
      await listToken(prismaService, 'ct_t0');
      await listToken(prismaService, 'ct_t3');

      const response = await request(app.getHttpServer())
        .get('/tokens/by-address/ct_t3/pairs')
        .expect(200);

      const value: dto.TokenPairs = JSON.parse(response.text);

      expect(value.pairs0).toEqual([]);
      expect(sortByAddress(value.pairs1)).toEqual([
        {
          address: 'ct_p2',
          synchronized: true,
          oppositeToken: {
            address: 'ct_t1',
            symbol: 'B',
            name: 'B Token',
            decimals: 6,
            listed: false,
            malformed: false,
            noContract: false,
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
            malformed: false,
            noContract: false,
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
      pairSyncService.ctx = mockContext({
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
      await pairSyncService['refreshPairs']();
      await pairSyncService['refreshPairsLiquidity']();
      await listToken(prismaService, 'ct_t0');
      await listToken(prismaService, 'ct_t3');

      const response = await request(app.getHttpServer())
        .get('/tokens/by-address/ct_t3/pairs')
        .expect(200);

      const value: dto.TokenPairs = JSON.parse(response.text);

      expect(sortByAddress(value.pairs0)).toEqual([
        {
          address: 'ct_p5',
          synchronized: true,
          oppositeToken: {
            address: 'ct_t4',
            symbol: 'D',
            name: 'D Token',
            decimals: 10,
            listed: false,
            malformed: false,
            noContract: false,
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
            malformed: false,
            noContract: false,
          },
          liquidityInfo: {
            height: 1,
            totalSupply: '40',
            reserve0: '4',
            reserve1: '10',
          },
        },
      ]);
      expect(sortByAddress(value.pairs1)).toEqual([
        {
          address: 'ct_p2',
          synchronized: true,
          oppositeToken: {
            address: 'ct_t1',
            symbol: 'B',
            name: 'B Token',
            decimals: 6,
            listed: false,
            malformed: false,
            noContract: false,
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
            malformed: false,
            noContract: false,
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

  describe('/tokens/listed', () => {
    beforeEach(async () => {
      await listToken(prismaService, 'ct_t0');
      await listToken(prismaService, 'ct_t3');
    });

    describe('add to token list', () => {
      it('/tokens/listed/ct_xxxx(POST) 401 with no auth key and with invalid token', async () => {
        await request(app.getHttpServer())
          .post('/tokens/listed/ct_xxxx')
          .expect(401);
      });

      it('/tokens/listed/ct_t0 (POST) 401 with no auth key provided and valid token address', async () => {
        await request(app.getHttpServer())
          .post('/tokens/listed/ct_t0')
          .expect(401);
      });

      it('/tokens/listed/ct_xxxx (POST) 401 with invalid auth key and invalid token', async () => {
        await request(app.getHttpServer())
          .post('/tokens/listed/ct_xxxx')
          .set('Authorization', 'wrong-key')
          .expect(401);
      });

      it('/tokens/listed/ct_xxxx (POST) 401 with invalid auth key and valid token', async () => {
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
            malformed: false,
            noContract: false,
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
            malformed: false,
            noContract: false,
          });
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
            malformed: false,
            noContract: false,
            pairs: ['ct_p2', 'ct_p1'],
          });
      });
    });

    describe('remove from token list', () => {
      it('/tokens/listed/ct_xxxx (DELETE) 401 with no auth key and with invalid token', async () => {
        await request(app.getHttpServer())
          .delete('/tokens/listed/ct_xxxx')
          .expect(401);
      });

      it('/tokens/listed/ct_t0 (DELETE) 401 with no auth key provided and valid token address', async () => {
        await request(app.getHttpServer())
          .delete('/tokens/listed/ct_t0')
          .expect(401);
      });

      it('/tokens/listed/ct_xxxx (DELETE) 401 with invalid auth key and invalid token', async () => {
        await request(app.getHttpServer())
          .delete('/tokens/listed/ct_xxxx')
          .set('Authorization', 'wrong-key')
          .expect(401);
      });

      it('/tokens/listed/ct_xxxx (DELETE) 401 with invalid auth key and valid token', async () => {
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
            malformed: false,
            noContract: false,
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
            malformed: false,
            noContract: false,
          });
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
            malformed: false,
            noContract: false,
            pairs: ['ct_p2', 'ct_p3'],
          });
      });
    });
  });
});
