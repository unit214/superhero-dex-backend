import * as WebSocket from 'ws';
import NETWORKS from '../lib/networks';
import {
  BlockHash,
  CallData,
  ContractAddress,
  Hash,
  NETWORK_NAME,
  nonNullable,
  pluralize,
  Signature,
  WalletAddress,
  Payload,
} from '../lib/utils';

import { Logger } from '@nestjs/common';
const logger = new Logger('WebSocket');

const MIDDLEWARE_URL: string = NETWORKS[NETWORK_NAME].middlewareUrl;
const createWebSocketConnection = () => new WebSocket(MIDDLEWARE_URL);
const { ROUTER_ADDRESS, SUSBCRIBE_TO_ALL_TXS } = process.env;

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
    signatures: [Signature];
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

export const createNewConnection = async (
  callBacks: {
    onDisconnected?: (error?: Error) => any;
    onEventReceived?: (event: SubscriptionEvent) => any;
    onConnected?: () => any;
  } = {},
) => {
  //2. connect
  const ws = createWebSocketConnection();

  //
  // setup the subscription
  //

  //3. on connect...
  const openHandler = async () => {
    if (SUSBCRIBE_TO_ALL_TXS && parseInt(SUSBCRIBE_TO_ALL_TXS)) {
      subscribeToAllTxs(ws);
    } else {
      subscribeToContract(ws, nonNullable(ROUTER_ADDRESS) as ContractAddress);
    }
    callBacks.onConnected && callBacks.onConnected();
  };

  //4. when receive new messages
  const messageHandler = async (msg: WebSocket.RawData) => {
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
      !['Object', 'Transactions'].some((x) => objMessage.subscription !== x)
    ) {
      onUnknownMessage();
      return;
    }

    const event: SubscriptionEvent = objMessage;
    //if pair update subscribe to pair
    const callBack = callBacks.onEventReceived;
    callBack && (await callBack(event));
  };

  const closeHandler = () => {
    callBacks.onDisconnected && callBacks.onDisconnected();
  };
  const errorHandler = (error: Error) => {
    callBacks.onDisconnected && callBacks.onDisconnected(error);
  };

  ws.on('error', errorHandler);
  ws.on('message', messageHandler);
  ws.on('open', openHandler);
  ws.on('close', closeHandler);

  return ws;
};
