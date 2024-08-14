import { CacheModule } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import prisma from '@prisma/client';

import { CoinmarketcapClientService } from '@/clients/coinmarketcap-client.service';
import { HttpService } from '@/clients/http.service';
import { MdwHttpClientService } from '@/clients/mdw-http-client.service';
import { MdwWsClientService } from '@/clients/mdw-ws-client.service';
import { SdkClientService } from '@/clients/sdk-client.service';
import { PairDbService } from '@/database/pair/pair-db.service';
import { PairLiquidityInfoHistoryDbService } from '@/database/pair-liquidity-info-history/pair-liquidity-info-history-db.service';
import { PairLiquidityInfoHistoryErrorDbService } from '@/database/pair-liquidity-info-history-error/pair-liquidity-info-history-error-db.service';
import { PrismaService } from '@/database/prisma.service';
import { TokenDbService } from '@/database/token/token-db.service';
import { PairLiquidityInfoHistoryImporterService } from '@/tasks/pair-liquidity-info-history-importer/pair-liquidity-info-history-importer.service';
import { PairPathCalculatorService } from '@/tasks/pair-path-calculator/pair-path-calculator.service';
import { PairSyncService } from '@/tasks/pair-sync/pair-sync.service';
import * as data from '@/test/mock-data/context-mock-data';
import { mockContext } from '@/test/utils/context-mock';
import { cleanDb } from '@/test/utils/db-helper';

// Testing method
// 1. before all create a common context
// 2. before all reset mockups (Context and Prisma Client)
// 3. run worker methods and test the impact on db

describe('PairSyncService', () => {
  let service: PairSyncService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register({})],
      providers: [
        PairSyncService,
        PrismaService,
        TokenDbService,
        PairDbService,
        HttpService,
        CoinmarketcapClientService,
        MdwHttpClientService,
        MdwWsClientService,
        SdkClientService,
        PairLiquidityInfoHistoryImporterService,
        PairLiquidityInfoHistoryDbService,
        PairLiquidityInfoHistoryErrorDbService,
        PairPathCalculatorService,
      ],
    }).compile();

    service = module.get<PairSyncService>(PairSyncService);
    prismaService = module.get<PrismaService>(PrismaService);
    await module.init();
  });

  beforeEach(async () => {
    await cleanDb(prismaService);
    service.ctx = mockContext(data.context2);
    await service['refreshPairs']();
  });

  afterAll(async () => {
    await prismaService.$disconnect();
  });

  it('inserts new pairs', async () => {
    const pairs: prisma.Pair[] = await prismaService.pair.findMany();
    expect(await prismaService.pair.count()).toBe(3);
    for (let i = 0; i < 3; i++) {
      expect(pairs[i]).toMatchObject({
        address: data.context2.pairs[i].address,
        synchronized: false,
      });
    }
  });

  it('refresh pairs liquidity', async () => {
    await service['refreshPairsLiquidity']();

    const pairs = await prismaService.pair.findMany({
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
    service.ctx = mockContext(data.context21);
    await service['refreshPairs']();
    const pairs: prisma.Pair[] = await prismaService.pair.findMany({
      orderBy: { id: 'asc' },
    });
    expect(await prismaService.pair.count()).toBe(4);
    expect(pairs[3]).toMatchObject({
      address: data.context21.pairs[3].address,
      synchronized: false,
    });
  });

  it('refresh liquidity for new added pairs', async () => {
    service.ctx = mockContext(data.context21);
    await service['refreshPairs']();
    await service['refreshPairsLiquidity']();
    const pairs = await prismaService.pair.findMany({
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
    await service['unsyncAllPairs']();
    const pairs = await prismaService.pair.findMany({
      where: { synchronized: true },
    });
    expect(pairs.length).toBe(0);
  });
});
