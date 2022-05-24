import { Logger } from '@nestjs/common';
import { mock } from 'jest-mock-extended';

import { createOnEventReceived } from '../src/worker';
import { Context } from '../src/lib/contracts';
import { ContractAddress } from '../src/lib/utils';
import * as data from './data/context-mockups';
import * as utils from './utils';
import { objSubEv, swapEvent, swapTxInfo } from './data/subscription-events';

let ctx: ReturnType<typeof utils.mockContext> = null as any;

const initTestContext = () => {
  type Ev = {
    onFactory: (ctx: Context) => Promise<void>;
    refreshPairsLiquidity: (
      ctx: Context,
      contract: ContractAddress,
    ) => Promise<void>;
    getAllAddresses: () => Promise<ContractAddress[]>;
  };
  const { onFactory, refreshPairsLiquidity, getAllAddresses } = mock<Ev>();
  const logger = mock<Logger>();
  const eventHandler = createOnEventReceived(
    ctx,
    logger,
    onFactory,
    refreshPairsLiquidity,
    getAllAddresses,
  );
  return {
    getAllAddresses,
    logger,
    eventHandler,
    onFactory,
    refreshPairsLiquidity,
  };
};
type T = ReturnType<typeof initTestContext>;
let logger: T['logger'] = null as any;
let eventHandler: T['eventHandler'] = null as any;
let onFactory: T['onFactory'] = null as any;
let refreshPairsLiquidity: T['refreshPairsLiquidity'] = null as any;
let getAllAddresses: T['getAllAddresses'] = null as any;

beforeEach(() => {
  ctx = utils.mockContext(data.context2);
  ({ logger, eventHandler, onFactory, refreshPairsLiquidity, getAllAddresses } =
    initTestContext());
});

describe('createOnEventReceived', () => {
  it('ignores unkown types', async () => {
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
    expect(
      async () =>
        await eventHandler({
          ...objSubEv,
        }),
    ).rejects.toThrow(`No tx info for hash 'th_1'`);
  });
  it('ignores inverted transaction', async () => {
    ctx.client.getTxInfo.calledWith(swapEvent.payload.hash).mockReturnValue(
      Promise.resolve({
        ...swapTxInfo,
        returnType: 'revert',
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
    ctx.client.getTxInfo.calledWith(objSubEv.payload.hash).mockReturnValue(
      Promise.resolve({
        ...swapTxInfo,
        log: [
          {
            address: process.env.FACTORY_ADDRESS as any,
            data: 'cb_1=',
            topics: [],
          },
        ],
      }),
    );
    getAllAddresses.calledWith().mockReturnValue(Promise.resolve([]));
    await eventHandler({
      ...objSubEv,
    });
    expect(onFactory).toHaveBeenCalledWith(ctx, 1);
  });
  it('refresh pair liquidity', async () => {
    ctx.client.getTxInfo.calledWith(objSubEv.payload.hash).mockReturnValue(
      Promise.resolve({
        ...swapTxInfo,
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
      }),
    );
    getAllAddresses
      .calledWith()
      .mockReturnValue(Promise.resolve(['ct_p1', 'ct_p2']));

    await eventHandler({
      ...objSubEv,
    });
    expect(refreshPairsLiquidity).toHaveBeenCalledWith(ctx, 'ct_p1', 1);
    expect(refreshPairsLiquidity).toHaveBeenCalledWith(ctx, 'ct_p2', 1);
  });
});
