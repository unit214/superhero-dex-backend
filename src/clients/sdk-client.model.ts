import { Encoded } from '@aeternity/aepp-sdk';

export type AccountAddress = Encoded.AccountAddress;
export type ContractAddress = Encoded.ContractAddress;
export type WalletAddress = Encoded.AccountAddress;
export type CallData = Encoded.ContractBytearray;
export type Signature = Encoded.Signature;
export type TxHash = Encoded.TxHash;
export type MicroBlockHash = Encoded.MicroBlockHash;
export type KeyBlockHash = Encoded.KeyBlockHash;
export type Payload = Encoded.Bytearray;

export const contractAddrToAccountAddr = (
  contractAddress: ContractAddress,
): AccountAddress => contractAddress.replace('ct_', 'ak_') as AccountAddress;
