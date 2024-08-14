import * as process from 'node:process';

import { CacheModule } from '@nestjs/cache-manager';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { TokensController } from '@/api/tokens/tokens.controller';
import { TokensService } from '@/api/tokens/tokens.service';
import { PrismaService } from '@/database/prisma.service';
import { TokenDbService } from '@/database/token/token-db.service';
import { nonNullable } from '@/lib/utils';
import {
  historyEntry1,
  historyEntry2,
  historyEntry3,
  historyEntry4,
  liquidityInfo1,
  liquidityInfo2,
  pair1,
  pair2,
  pair3,
  token1,
  token2,
  token3,
  token5,
} from '@/test/mock-data/pair-liquidity-info-history-mock-data';

// Testing method
// before all
//   - initiate nest app
// before each
//   - clean db
//   - insert test data
// after all
//   - close nest app
//   - disconnect from prisma
describe('TokenController', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const authToken = nonNullable(process.env.AUTH_TOKEN);

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TokensController],
      imports: [CacheModule.register({})],
      providers: [TokenDbService, TokensService, PrismaService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prismaService = module.get(PrismaService);
  });

  beforeAll(async () => {
    await prismaService.pairLiquidityInfoHistory.deleteMany();
    await prismaService.pairLiquidityInfo.deleteMany();
    await prismaService.pair.deleteMany();
    await prismaService.token.deleteMany();
  });

  beforeEach(async () => {
    await prismaService.token.createMany({
      data: [token1, token2, token3, token5],
    });
    await prismaService.pair.createMany({ data: [pair1, pair2, pair3] });
    await prismaService.pairLiquidityInfo.createMany({
      data: [liquidityInfo1, liquidityInfo2],
    });
    await prismaService.pairLiquidityInfoHistory.createMany({
      data: [historyEntry1, historyEntry2, historyEntry3, historyEntry4],
    });
  });

  afterEach(async () => {
    await prismaService.pairLiquidityInfoHistory.deleteMany();
    await prismaService.pairLiquidityInfo.deleteMany();
    await prismaService.pair.deleteMany();
    await prismaService.token.deleteMany();
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await app.close();
  });

  describe('GET /tokens', () => {
    it('should return all tokens when none are listed', async () => {
      await request(app.getHttpServer())
        .get('/tokens')
        .expect(200)
        .then((res) => expect(JSON.parse(res.text)).toMatchSnapshot());
    });

    it('should return all tokens even if some are listed', async () => {
      await request(app.getHttpServer())
        .post('/tokens/listed/ct_token1')
        .set({ Authorization: authToken });
      await request(app.getHttpServer())
        .post('/tokens/listed/ct_token3')
        .set({ Authorization: authToken });
      await request(app.getHttpServer())
        .get('/tokens')
        .expect(200)
        .then((res) => expect(JSON.parse(res.text)).toMatchSnapshot());
    });
  });

  describe('GET /tokens/{token_address}', () => {
    it('should return a single token if it exists', async () => {
      await request(app.getHttpServer())
        .get('/tokens/ct_token1')
        .expect(200)
        .then((res) => expect(JSON.parse(res.text)).toMatchSnapshot());
    });

    it('should return 404 if the token does not exist', () => {
      return request(app.getHttpServer())
        .get('/tokens/ct_xxxx')
        .expect(404)
        .expect({
          statusCode: 404,
          message: 'token not found',
          error: 'Not Found',
        });
    });
  });

  describe('GET /tokens/{token_address}/pairs', () => {
    it('should return pairs with no liquidity info', async () => {
      await request(app.getHttpServer())
        .get('/tokens/ct_token1/pairs')
        .expect(200)
        .then((res) => expect(JSON.parse(res.text)).toMatchSnapshot());
    });

    it('should return pairs with liquidity info', async () => {
      await request(app.getHttpServer())
        .get('/tokens/ct_token2/pairs')
        .expect(200)
        .then((res) => expect(JSON.parse(res.text)).toMatchSnapshot());
    });

    it('should return 404 if the token does not exist', () => {
      return request(app.getHttpServer())
        .get('/tokens/ct_xxxx')
        .expect(404)
        .expect({
          statusCode: 404,
          message: 'token not found',
          error: 'Not Found',
        });
    });
  });

  describe('GET /tokens/listed', () => {
    it('should return no tokens if none are listed', () => {
      return request(app.getHttpServer())
        .get('/tokens/listed')
        .expect(200)
        .expect([]);
    });

    it('should return listed tokens if some are listed', async () => {
      await request(app.getHttpServer())
        .post('/tokens/listed/ct_token1')
        .set('Authorization', authToken);
      await request(app.getHttpServer())
        .post('/tokens/listed/ct_token3')
        .set('Authorization', authToken);
      await request(app.getHttpServer())
        .get('/tokens/listed')
        .expect(200)
        .then((res) => expect(JSON.parse(res.text)).toMatchSnapshot());
    });
  });

  describe('POST /tokens/listed/{token_address}', () => {
    it('should return 401 with no auth key and invalid token address', async () => {
      await request(app.getHttpServer())
        .post('/tokens/listed/ct_xxxx')
        .expect(401);
    });

    it('should return 401 with no auth key and valid token address', async () => {
      await request(app.getHttpServer())
        .post('/tokens/listed/ct_token1')
        .expect(401);
    });

    it('should return 401 with invalid auth key and invalid token', async () => {
      await request(app.getHttpServer())
        .post('/tokens/listed/ct_xxxx')
        .set('Authorization', 'wrong-key')
        .expect(401);
    });

    it('should return 401 with invalid auth key and valid token', async () => {
      await request(app.getHttpServer())
        .post('/tokens/listed/ct_token1')
        .set('Authorization', 'wrong-key')
        .expect(401);
    });

    it('should return 404 with valid auth key but with invalid token', async () => {
      await request(app.getHttpServer())
        .post('/tokens/listed/ct_xxxx')
        .set('Authorization', authToken)
        .expect(404);
    });

    it('should return 201 with valid auth key and valid token and mark the token as listed', async () => {
      //verify before listing ct_t1
      await request(app.getHttpServer())
        .get('/tokens/ct_token1')
        .expect(200)
        .then((res) => expect(JSON.parse(res.text)).toMatchSnapshot());

      //listing it
      await request(app.getHttpServer())
        .post('/tokens/listed/ct_token1')
        .set('Authorization', authToken)
        .expect(201)
        .then((res) => expect(JSON.parse(res.text)).toMatchSnapshot());

      //re-verify ct_t1 to be sure it was persisted also
      await request(app.getHttpServer())
        .get('/tokens/ct_token1')
        .expect(200)
        .then((res) => expect(JSON.parse(res.text)).toMatchSnapshot());
    });
  });

  describe('DELETE /tokens/listed/{token_address}', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/tokens/listed/ct_token3')
        .set('Authorization', authToken);
    });

    it('should return 401 with no auth key and invalid token', async () => {
      await request(app.getHttpServer())
        .delete('/tokens/listed/ct_xxxx')
        .expect(401);
    });

    it('should return 401 with no auth key and valid token address', async () => {
      await request(app.getHttpServer())
        .delete('/tokens/listed/ct_token3')
        .expect(401);
    });

    it('should return 401 with invalid auth key and invalid token', async () => {
      await request(app.getHttpServer())
        .delete('/tokens/listed/ct_xxxx')
        .set('Authorization', 'wrong-key')
        .expect(401);
    });

    it('should return 401 with invalid auth key and valid token', async () => {
      await request(app.getHttpServer())
        .delete('/tokens/listed/ct_token3')
        .set('Authorization', 'wrong-key')
        .expect(401);
    });

    it('should return 404 with valid auth key but with invalid token', async () => {
      await request(app.getHttpServer())
        .delete('/tokens/listed/ct_xxxx')
        .set('Authorization', authToken)
        .expect(404);
    });

    it('should return 200 with valid auth key and valid token', async () => {
      //verify before unlisting ct_t3
      await request(app.getHttpServer())
        .get('/tokens/ct_token3')
        .expect(200)
        .then((res) => expect(JSON.parse(res.text)).toMatchSnapshot());

      //unlisting it
      await request(app.getHttpServer())
        .delete('/tokens/listed/ct_token3')
        .set('Authorization', nonNullable(process.env.AUTH_TOKEN))
        .expect(200)
        .then((res) => expect(JSON.parse(res.text)).toMatchSnapshot());

      //re-verify ct_t3 to be sure the unlisting was persisted too
      await request(app.getHttpServer())
        .get('/tokens/ct_token3')
        .expect(200)
        .then((res) => expect(JSON.parse(res.text)).toMatchSnapshot());
    });
  });
});
