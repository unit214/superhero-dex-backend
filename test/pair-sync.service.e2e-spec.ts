import { mockContext } from './utils';
import prisma from '@prisma/client';
import * as data from './data/context-mockups';
import { PairSyncService } from '../src/tasks/pair-sync.service';
import { PrismaService } from '../src/database/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { TokenDbService } from '../src/database/token/token-db.service';
import { PairDbService } from '../src/database/pair/pair-db.service';
import { MdwWsClientService } from '../src/clients/mdw-ws-client.service';
import { clean as cleanDb } from './utils/db';

// Testing method
// 1. before all create a common context
// 2. before all reset mockups (Context and Prisma Client)
// 3. run worker methods and test the impact on db

describe('PairSyncService', () => {
  let service: PairSyncService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PairSyncService,
        PrismaService,
        TokenDbService,
        PairDbService,
        MdwWsClientService,
      ],
    }).compile();

    service = module.get<PairSyncService>(PairSyncService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await cleanDb(prismaService);
    const ctx = mockContext(data.context2);
    await service['refreshPairs'](ctx);
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
    const ctx = mockContext(data.context2);
    await service['refreshPairsLiquidity'](ctx);

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
    const ctx = mockContext(data.context21);
    await service['refreshPairs'](ctx);
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
    const ctx = mockContext(data.context21);
    await service['refreshPairs'](ctx);
    await service['refreshPairsLiquidity'](ctx);
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
