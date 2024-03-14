import { Encoded } from '@aeternity/aepp-sdk';

export const nonNullable = <T>(t: T | null | undefined, label?: string): T => {
  if (t == null) {
    throw new Error(
      `${label ? label + ': ' : null} non nullable value expected`,
    );
  }
  return t;
};

export const removeId = <ID, T extends { id: ID }>(t: T) => {
  const {
    id, // eslint-disable-line @typescript-eslint/no-unused-vars
    ...tail
  } = t;
  return tail;
};

export const pluralize = (count: number, noun: string, suffix = 's') =>
  `${count} ${noun}${count !== 1 ? suffix : ''}`;

export type AccountAddress = Encoded.AccountAddress;
export type ContractAddress = Encoded.ContractAddress;
export type WalletAddress = Encoded.AccountAddress;
export type CallData = Encoded.ContractBytearray;
export type Signature = Encoded.Signature;
export type TxHash = Encoded.TxHash;
export type MicroBlockHash = Encoded.MicroBlockHash;
export type KeyBlockHash = Encoded.KeyBlockHash;
export type Payload = Encoded.Bytearray;

const parseEnv = (x) => x && JSON.parse(x);
export const presentInvalidTokens = parseEnv(process.env.SHOW_INVALID_TOKENS);

export const contractAddrToAccountAddr = (
  contractAddress: ContractAddress,
): AccountAddress => contractAddress.replace('ct_', 'ak_') as AccountAddress;
