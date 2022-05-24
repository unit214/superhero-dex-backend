import * as WebSocket from 'ws';
import NETWORKS from '../lib/networks';
import {
  BlockHash,
  CallData,
  ContractAddress,
  Hash,
  nonNullable,
  pluralize,
  Signature,
  WalletAddress,
  Payload,
} from '../lib/utils';

import { Logger } from '@nestjs/common';
const logger = new Logger('WebSocket');

const createWebSocketConnection = () =>
  new WebSocket(NETWORKS[nonNullable(process.env.NETWORK_NAME)].middlewareUrl);

export type SubscriptionEvent = {
  subscription: 'Object' | 'Transactions'; // add any other additional enum values if are used
  source: string;
  payload: {
    tx: {
      version: number;
      nonce: number;
      fee: number;
      amount: number;
    } & (
      | {
          type: 'ContractCallTx'; // add any other additional enum values if are used
          gas_price: number;
          gas: number;
          contract_id: ContractAddress;
          caller_id: WalletAddress;
          call_data: CallData;
          abi_version: number;
        }
      | {
          type: 'SpendTx';
          ttl: number;
          sender_id: WalletAddress;
          recipient_id: WalletAddress;
          payload: Payload;
        }
    );
    signatures: Signature[];
    hash: Hash;
    block_height: number;
    block_hash: BlockHash;
  };
};

const subscribeToContract = (ws: WebSocket, address: ContractAddress) =>
  ws.send(
    JSON.stringify({
      op: 'Subscribe',
      payload: 'Object',
      target: address,
    }),
  );

const subscribeToAllTxs = (ws: WebSocket) =>
  ws.send(
    JSON.stringify({
      op: 'Subscribe',
      payload: 'Transactions',
    }),
  );

const startPingMechanism = (ws: WebSocket) => {
  let isAlive = false;

  const pingTimeOut = parseInt(process.env.MDW_PING_TIMEOUT_MS || '0');
  const interval = pingTimeOut
    ? setInterval(function ping() {
        if (isAlive === false) {
          logger.warn('Ws terminate because of ping-timeout');
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

export type Callbacks = {
  onDisconnected?: (error?: Error) => any;
  onEventReceived?: (event: SubscriptionEvent) => any;
  onConnected?: () => any;
};

export const createMessageHandler =
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
      // if the message doesn't represent an already subscription
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

export const createNewConnection = async (callbacks: Callbacks = {}) => {
  //1. connect
  const ws = createWebSocketConnection();

  //2. crate ping time-out checker
  const { setAlive, stopPing } = startPingMechanism(ws);

  //
  // setup the subscription
  //

  //3. on connect...
  const openHandler = async () => {
    setAlive();
    ws.on('pong', setAlive);

    const { ROUTER_ADDRESS, SUBSCRIBE_TO_ALL_TXS } = process.env;
    if (SUBSCRIBE_TO_ALL_TXS && parseInt(SUBSCRIBE_TO_ALL_TXS)) {
      subscribeToAllTxs(ws);
    } else {
      subscribeToContract(ws, nonNullable(ROUTER_ADDRESS) as ContractAddress);
    }
    callbacks.onConnected && callbacks.onConnected();
  };

  //4. when receive new messages
  const messageHandler = createMessageHandler(callbacks, ws, logger);

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
