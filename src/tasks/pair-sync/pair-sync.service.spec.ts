import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';

import { MdwWsClientService } from '@/clients/mdw-ws-client.service';
import { ContractAddress } from '@/clients/sdk-client.model';
import { SdkClientService } from '@/clients/sdk-client.service';
import { PairDbService } from '@/database/pair/pair-db.service';
import { TokenDbService } from '@/database/token/token-db.service';
import { PairLiquidityInfoHistoryImporterService } from '@/tasks/pair-liquidity-info-history-importer/pair-liquidity-info-history-importer.service';
import { PairPathCalculatorService } from '@/tasks/pair-path-calculator/pair-path-calculator.service';
import { Context } from '@/tasks/pair-sync/pair-sync.model';
import { PairSyncService } from '@/tasks/pair-sync/pair-sync.service';
import * as data from '@/test/mock-data/context-mock-data';
import {
  objSubEv,
  swapEvent,
  swapTxInfo,
} from '@/test/mock-data/subscription-event-mock-data';
import { mockContext } from '@/test/utils/context-mock';
import { mockupEnvVars, TEST_NET_VARS } from '@/test/utils/env-mock';

describe('PairSyncService', () => {
  let service: PairSyncService;
  const getAllAddressesMock = jest.fn().mockResolvedValue([]);

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PairSyncService,
        SdkClientService,
        { provide: MdwWsClientService, useValue: {} },
        {
          provide: PairDbService,
          useValue: {
            getAllAddresses: getAllAddressesMock,
            count: jest.fn(),
          },
        },
        {
          provide: TokenDbService,
          useValue: {},
        },
        {
          provide: PairLiquidityInfoHistoryImporterService,
          useValue: {
            import: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: PairPathCalculatorService,
          useValue: {
            sync: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();
    service = module.get<PairSyncService>(PairSyncService);
    await module.init();
  });

  describe('createOnEventReceived', () => {
    let ctx: ReturnType<typeof mockContext> = null as any;

    const initTestContext = (service: PairSyncService) => {
      type Ev = {
        onFactory: () => Promise<void>;
        refreshPairLiquidityByAddress: (
          contract: ContractAddress,
        ) => Promise<void>;
        getAllAddresses: () => Promise<ContractAddress[]>;
      };
      const { onFactory, refreshPairLiquidityByAddress } = mock<Ev>();

      service['onFactoryEventReceived'] = onFactory;
      service['refreshPairLiquidityByAddress'] = refreshPairLiquidityByAddress;

      const logger = {
        debug: jest.spyOn(service.logger, 'debug'),
        error: jest.spyOn(service.logger, 'error'),
      };

      const eventHandler = service['createOnEventReceived'].bind(service);
      return {
        getAllAddresses: getAllAddressesMock,
        logger,
        eventHandler,
        onFactory,
        refreshPairLiquidityByAddress,
      };
    };
    type T = ReturnType<typeof initTestContext>;
    let logger: T['logger'] = null as any;
    let eventHandler: T['eventHandler'] = null as any;
    let onFactory: T['onFactory'] = null as any;
    let refreshPairLiquidityByAddress: T['refreshPairLiquidityByAddress'] =
      null as any;
    let getAllAddresses: T['getAllAddresses'] = null as any;

    beforeEach(async () => {
      ctx = mockContext(data.context2);
      service.ctx = ctx;
      ({
        logger,
        eventHandler,
        onFactory,
        refreshPairLiquidityByAddress,
        getAllAddresses,
      } = initTestContext(service));
    });
    it('ignores unknown types', async () => {
      await eventHandler({
        ...objSubEv,
        payload: {
          ...objSubEv.payload,
          tx: {
            ...objSubEv.payload.tx,
            type: 'Some-Random-Type' as any,
          },
        },
      });
      expect(logger.debug).toHaveBeenCalledWith(
        `Ignoring transaction of type 'Some-Random-Type'`,
      );
    });
    it('throws error if no txInfo', async () => {
      expect(eventHandler({ ...objSubEv })).rejects.toThrow(
        `No tx info for hash 'th_1'`,
      );
    });

    it('ignores inverted transaction', async () => {
      ctx.node.getTransactionInfoByHash
        .calledWith(swapEvent.payload.hash)
        .mockReturnValue(
          Promise.resolve({
            ...swapTxInfo,
            callInfo: {
              ...swapTxInfo.callInfo,
              returnType: 'revert',
            },
          }),
        );
      await eventHandler({
        ...swapEvent,
      });
      expect(logger.debug).toHaveBeenCalledWith(
        `Ignore reverted transaction: '${swapEvent.payload.hash}'`,
      );
    });

    it('refresh pairs in factory', async () => {
      ctx.node.getTransactionInfoByHash
        .calledWith(objSubEv.payload.hash)
        .mockReturnValue(
          Promise.resolve({
            ...swapTxInfo,
            callInfo: {
              ...swapTxInfo.callInfo,
              log: [
                {
                  address: process.env.FACTORY_ADDRESS as any,
                  data: 'cb_1=',
                  topics: [],
                },
              ],
            },
          }),
        );
      getAllAddresses.mockReturnValue(Promise.resolve([]));
      await eventHandler({
        ...objSubEv,
      });
      expect(onFactory).toHaveBeenCalledWith(1);
    });

    it('refresh pair liquidity', async () => {
      ctx.node.getTransactionInfoByHash
        .calledWith(objSubEv.payload.hash)
        .mockReturnValue(
          Promise.resolve({
            ...swapTxInfo,
            callInfo: {
              ...swapTxInfo.callInfo,
              log: [
                {
                  address: 'ct_p1',
                  data: 'cb_1=',
                  topics: [],
                },
                {
                  address: 'ct_p2',
                  data: 'cb_1=',
                  topics: [],
                },
                //this will not be called
                {
                  address: 'ct_p3',
                  data: 'cb_1=',
                  topics: [],
                },
              ],
            },
          }),
        );
      getAllAddresses.mockReturnValue(Promise.resolve(['ct_p1', 'ct_p2']));

      await eventHandler({
        ...objSubEv,
      });
      expect(refreshPairLiquidityByAddress).toHaveBeenCalledWith('ct_p1', 1);
      expect(refreshPairLiquidityByAddress).toHaveBeenCalledWith('ct_p2', 1);
    });
  });

  describe('getContext() on testnet', () => {
    let context: Context | null = null;
    mockupEnvVars(TEST_NET_VARS);

    beforeAll(async () => {
      context = await service['getContext']();
    });

    const ctx = (): Context => {
      if (!context) {
        throw 'initiate context first';
      }
      return context;
    };

    it('matches the .env factory', async () => {
      const { decodedResult: factoryAddress } = await ctx().router.factory();
      expect(factoryAddress).toBe(process.env.FACTORY_ADDRESS);
    });

    it('should have at least 16 pairs', async () => {
      expect(
        (await ctx().factory.get_all_pairs()).decodedResult.length,
      ).toBeGreaterThanOrEqual(16);
    });

    it('pair should return right token addresses', async () => {
      const { decodedResult: allPairs } = await ctx().factory.get_all_pairs();
      const pairAddress = allPairs[allPairs.length - 1];
      expect(pairAddress).toBe(
        'ct_efYtiwDg4YZxDWE3iLPzvrjb92CJPvzGwriv4ZRuvuTDMNMb9',
      );
      const pairMethods = await ctx().getPair(pairAddress);
      if (pairMethods == null) {
        fail('pairMethods is null');
      }
      expect((await pairMethods.token0()).decodedResult).toBe(
        'ct_7tTzPfvv3Vx8pCEcuk1kmgtn4sFsYCQDzLi1LvFs8T5PJqgsC',
      );
      expect((await pairMethods.token1()).decodedResult).toBe(
        'ct_b7FZHQzBcAW4r43ECWpV3qQJMQJp5BxkZUGNKrqqLyjVRN3SC',
      );
    });

    it('regular aex9 token should have right metaInfo', async () => {
      const tokenMethods = await ctx().getToken(
        'ct_7tTzPfvv3Vx8pCEcuk1kmgtn4sFsYCQDzLi1LvFs8T5PJqgsC',
      );

      const { decodedResult: metaInfo } = await tokenMethods.meta_info();
      expect(metaInfo).toEqual({
        decimals: 18n,
        name: 'TestAEX9-B',
        symbol: 'TAEX9-B',
      });
    });

    it('WAE token should have right metaInfo', async () => {
      const tokenMethods = await ctx().getToken(
        'ct_JDp175ruWd7mQggeHewSLS1PFXt9AzThCDaFedxon8mF8xTRF',
      );
      const { decodedResult: metaInfo } = await tokenMethods.meta_info();
      expect(metaInfo).toEqual({
        decimals: 18n,
        name: 'Wrapped Aeternity',
        symbol: 'WAE',
      });
    });
  });
});
