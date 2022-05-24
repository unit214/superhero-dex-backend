import * as mdw from '../src/worker/middleware';
import * as WebSocket from 'ws';
import { Logger } from '@nestjs/common';
import { mock } from 'jest-mock-extended';
import { objSubEv, txSubEv } from './data/subscription-events';

import { createMessageHandler, Callbacks } from '../src/worker/middleware';

it('just connects', async () => {
  let future: any;
  const promise = new Promise((resolve, reject) => {
    future = { resolve, reject };
  });
  const ws = await mdw.createNewConnection({
    onDisconnected: (error) => {
      if (error) {
        console.error(error);
        future?.reject(error);
      } else {
        future?.resolve();
      }
    },
    onConnected: () => {
      ws.close();
    },
  });

  await promise;
});

describe('createMessageHandler', () => {
  const initTestContext = () => {
    const callbacks = mock<Callbacks>();
    const ws = mock<WebSocket>();
    const logger = mock<Logger>();
    const msgHandler = createMessageHandler(callbacks, ws, logger);
    return { callbacks, ws, logger, msgHandler };
  };

  type T = ReturnType<typeof initTestContext>;
  let callbacks: T['callbacks'] = null as any;
  let ws: T['ws'] = null as any;
  let logger: T['logger'] = null as any;
  let msgHandler: T['msgHandler'] = null as any;
  beforeEach(() => {
    ({ callbacks, ws, logger, msgHandler } = initTestContext());
  });
  it('random string will cause error', async () => {
    expect(() => msgHandler('"some string"' as any)).rejects.toThrow(
      'Unknown message received: "some string"',
    );
    expect(ws.close).toHaveBeenCalledWith();
  });
  it('"already subscribed to target" not throwing error', async () => {
    //not throwing an error is enough
    await msgHandler('"already subscribed to target"' as any);
  });

  it('subscribed to all transactions', async () => {
    await msgHandler('[1,"sentence","Transactions"]' as any);
    expect(logger.debug).toHaveBeenCalledWith('Subscribed to all transactions');
  });
  it('subscribed to one contract', async () => {
    await msgHandler('["the-contract"]' as any);
    expect(logger.debug).toHaveBeenCalledWith('Subscribed to 1 contract');
  });
  it('subscribed to multiple contracts', async () => {
    await msgHandler('["ct_1",2,5]' as any);
    expect(logger.debug).toHaveBeenCalledWith('Subscribed to 3 contracts');
  });
  it('unrecongnized object will cause error', async () => {
    expect(() =>
      msgHandler('{"prop": "oject without proper shape"}' as any),
    ).rejects.toThrow(
      'Unknown message received: {"prop": "oject without proper shape"}',
    );
    expect(ws.close).toHaveBeenCalledWith();
  });
  it('Oject subscription event succeeds', async () => {
    await msgHandler(JSON.stringify(objSubEv) as any);
    expect(callbacks.onEventReceived).toHaveBeenCalledWith(objSubEv);
  });
  it('Transactions subscription event succeeds', async () => {
    await msgHandler(JSON.stringify(txSubEv) as any);
    expect(callbacks.onEventReceived).toHaveBeenCalledWith(txSubEv);
  });
});
