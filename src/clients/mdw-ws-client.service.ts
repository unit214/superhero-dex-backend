import { Injectable, Logger } from '@nestjs/common';
import * as WebSocket from 'ws';
import NETWORKS from '../lib/network-config';
import { nonNullable, pluralize } from '../lib/utils';
import { SubscriptionEvent } from './mdw-ws-client.model';
import { ContractAddress } from './sdk-client.model';

export type Callbacks = {
  onDisconnected?: (error?: Error) => any;
  onEventReceived?: (event: SubscriptionEvent) => any;
  onConnected?: () => any;
};

@Injectable()
export class MdwWsClientService {
  readonly logger = new Logger(MdwWsClientService.name);

  createNewConnection = async (callbacks: Callbacks = {}) => {
    //1. connect
    const ws = this.createWebSocketConnection();

    //2. crate ping time-out checker
    const { setAlive, stopPing } = this.startPingMechanism(ws);

    //
    // set up the subscription
    //

    //3. on connect...
    const openHandler = async () => {
      setAlive();
      ws.on('pong', setAlive);

      const { ROUTER_ADDRESS, SUBSCRIBE_TO_ALL_TXS } = process.env;
      if (SUBSCRIBE_TO_ALL_TXS && parseInt(SUBSCRIBE_TO_ALL_TXS)) {
        this.subscribeToAllTxs(ws);
      } else {
        this.subscribeToContract(
          ws,
          nonNullable(ROUTER_ADDRESS) as ContractAddress,
        );
      }
      callbacks.onConnected && callbacks.onConnected();
    };

    //4. when receive new messages
    const messageHandler = this.createMessageHandler(
      callbacks,
      ws,
      this.logger,
    );

    const errorHandler = (error?: Error) => {
      callbacks.onDisconnected && callbacks.onDisconnected(error);
      stopPing();
      ws.removeAllListeners();
    };
    const closeHandler = () => errorHandler();
    const onPing = (event: Buffer) => ws.pong(event);

    ws.on('error', errorHandler);
    ws.on('message', messageHandler);
    ws.on('open', openHandler);
    ws.on('close', closeHandler);
    ws.on('ping', onPing);

    return ws;
  };

  private createMessageHandler =
    (callbacks: Callbacks, ws: WebSocket, logger: Logger) =>
    async (msg: WebSocket.RawData) => {
      const stringMessage = msg.toString();
      const objMessage = JSON.parse(stringMessage);
      const onUnknownMessage = () => {
        ws.close();
        throw new Error(`Unknown message received: ${stringMessage}`);
      };
      if (Array.isArray(objMessage)) {
        if (objMessage.some((x) => x === 'Transactions')) {
          logger.debug(`Subscribed to all transactions`);
        } else {
          logger.debug(
            `Subscribed to ${pluralize(objMessage.length, 'contract')}`,
          );
        }
        return;
      }
      if (typeof objMessage === 'string') {
        // if the message doesn't represent an already existing subscription
        if (objMessage.indexOf('already subscribed to target')) {
          onUnknownMessage();
        }
        // there is nothing of interest here, let's exit
        return;
      } else if (
        !['Object', 'Transactions'].some((x) => objMessage.subscription === x)
      ) {
        onUnknownMessage();
        return;
      }
      const event: SubscriptionEvent = objMessage;
      //if pair update subscribe to pair
      const callback = callbacks.onEventReceived;
      callback && (await callback(event));
    };

  private createWebSocketConnection = () =>
    new WebSocket(
      NETWORKS[nonNullable(process.env.NETWORK_NAME)].middlewareWebsocketUrl,
    );

  private subscribeToContract = (ws: WebSocket, address: ContractAddress) =>
    ws.send(
      JSON.stringify({
        op: 'Subscribe',
        payload: 'Object',
        target: address,
      }),
    );

  private subscribeToAllTxs = (ws: WebSocket) =>
    ws.send(
      JSON.stringify({
        op: 'Subscribe',
        payload: 'Transactions',
      }),
    );

  private startPingMechanism = (ws: WebSocket) => {
    let isAlive = false;

    const pingTimeOut = parseInt(process.env.MDW_PING_TIMEOUT_MS || '0');
    const interval = pingTimeOut
      ? setInterval(() => {
          if (!isAlive) {
            this.logger.warn('Ws terminate because of ping-timeout');
            interval && clearInterval(interval);
            ws.terminate();
            return;
          }

          isAlive = false;
          ws.ping();
        }, pingTimeOut)
      : null;
    return {
      setAlive: () => {
        isAlive = true;
      },
      stopPing: () => {
        interval && clearInterval(interval);
      },
    };
  };
}
