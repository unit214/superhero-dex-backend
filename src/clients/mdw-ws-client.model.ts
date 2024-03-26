import {
  CallData,
  ContractAddress,
  MicroBlockHash,
  Payload,
  Signature,
  TxHash,
  WalletAddress,
} from '../lib/utils';

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
    hash: TxHash;
    block_height: number;
    block_hash: MicroBlockHash;
  };
};
