import { CacheModule } from '@nestjs/cache-manager';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { PairsController } from '@/api/pairs/pairs.controller';
import { PairsService } from '@/api/pairs/pairs.service';
import { TokensController } from '@/api/tokens/tokens.controller';
import { TokensService } from '@/api/tokens/tokens.service';
import { PairDbService } from '@/database/pair/pair-db.service';
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
  pair4,
  token1,
  token2,
  token3,
  token4,
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
describe('PairsController', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const authToken = nonNullable(process.env.AUTH_TOKEN);

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PairsController, TokensController],
      imports: [CacheModule.register({})],
      providers: [
        PairsService,
        PairDbService,
        PrismaService,
        TokensService,
        TokenDbService,
      ],
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
      data: [token1, token2, token3, token4, token5],
    });
    await prismaService.pair.createMany({ data: [pair1, pair2, pair3, pair4] });
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

  describe('GET /pairs', () => {
    it('should return all pairs', async () => {
      return request(app.getHttpServer())
        .get('/pairs')
        .expect(200)
        .then((res) => expect(JSON.parse(res.text)).toMatchSnapshot());
    });

    it('should return only listed pairs with only-listed=true', async () => {
      await request(app.getHttpServer())
        .get('/pairs?only-listed=true')
        .expect(200)
        .expect([]);

      await request(app.getHttpServer())
        .post('/tokens/listed/ct_token1')
        .set('Authorization', authToken);
      await request(app.getHttpServer())
        .post('/tokens/listed/ct_token2')
        .set('Authorization', authToken);

      await request(app.getHttpServer())
        .get('/pairs?only-listed=true')
        .expect(200)
        .then((res) => expect(JSON.parse(res.text)).toMatchSnapshot());
    });
  });

  describe('GET /pairs/by-address/{pair_address}', () => {
    it('should return pair if it exists', async () => {
      return request(app.getHttpServer())
        .get('/pairs/by-address/ct_pair1')
        .expect(200)
        .then((res) => expect(JSON.parse(res.text)).toMatchSnapshot());
    });

    it('should return 404 if pair does not exist', async () => {
      return request(app.getHttpServer())
        .get('/pairs/by-address/ct_xxxx')
        .expect(404)
        .expect({
          statusCode: 404,
          message: 'pair not found',
          error: 'Not Found',
        });
    });
  });

  describe('GET /pairs/swap-routes/{from}/{to}', () => {
    it('should return 200 with [] if no path for unexisting token ', async () => {
      return request(app.getHttpServer())
        .get('/pairs/swap-routes/ct_token1/ct_xxxx')
        .expect(200)
        .expect([]);
    });

    it('should return 200 with [] for existing token if no pair or path exists', async () => {
      return request(app.getHttpServer())
        .get('/pairs/swap-routes/ct_token1/ct_token4')
        .expect(200)
        .expect([]);
    });

    it('should return a direct path', async () => {
      return request(app.getHttpServer())
        .get('/pairs/swap-routes/ct_token2/ct_token3')
        .expect(200)
        .then((res) => expect(JSON.parse(res.text)).toMatchSnapshot());
    });

    it('should return an indirect path', async () => {
      return request(app.getHttpServer())
        .get('/pairs/swap-routes/ct_token1/ct_token3')
        .expect(200)
        .then((res) => expect(JSON.parse(res.text)).toMatchSnapshot());
    });

    it('should return one direct path and one indirect path', async () => {
      return request(app.getHttpServer())
        .get('/pairs/swap-routes/ct_token1/ct_token5')
        .expect(200)
        .then((res) => expect(JSON.parse(res.text)).toMatchSnapshot());
    });

    it('should suppress some paths with only-listed=true ', async () => {
      await request(app.getHttpServer())
        .post('/tokens/listed/ct_token1')
        .set('Authorization', authToken);
      await request(app.getHttpServer())
        .post('/tokens/listed/ct_token5')
        .set('Authorization', authToken);

      return request(app.getHttpServer())
        .get('/pairs/swap-routes/ct_token1/ct_token5?only-listed=true')
        .expect(200)
        .then((res) => expect(JSON.parse(res.text)).toMatchSnapshot());
    });

    it('should return paths oven on reverse order of tokens', async () => {
      return request(app.getHttpServer())
        .get('/pairs/swap-routes/ct_token1/ct_token5')
        .expect(200)
        .then((res) => expect(JSON.parse(res.text)).toMatchSnapshot());
    });
  });
});
