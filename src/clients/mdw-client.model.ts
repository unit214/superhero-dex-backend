import {
  AccountAddress,
  ContractAddress,
  KeyBlockHash,
  MicroBlockHash,
  TxHash,
} from '../lib/utils';

export type MdwPaginatedResponse<T> = {
  next?: string;
  prev?: string;
  data: T[];
};

export type Contract = {
  aexn_type: string;
  block_hash: MicroBlockHash;
  contract: ContractAddress;
  source_tx_hash: TxHash;
  source_tx_type: string;
  create_tx: any;
};

export type ContractLog = {
  args: string[];
  block_hash: MicroBlockHash;
  block_time: string;
  call_tx_hash: TxHash;
  call_txi: string;
  contract_id: ContractAddress;
  contract_tx_hash: TxHash;
  contract_txi: string;
  data: string;
  event_hash: string;
  event_name?: string;
  ext_caller_contract_id?: string;
  ext_caller_contract_tx_hash?: string;
  ext_caller_contract_txi: string;
  height: string;
  log_idx: string;
  micro_index: string;
  parent_contract_id: ContractAddress;
};

export type AccountBalance = {
  account: AccountAddress;
  amount: string;
  contract: ContractAddress;
};

export type BalancesV1 = {
  amounts: Record<AccountAddress, string>;
  block_hash: MicroBlockHash;
  contract_id: ContractAddress;
  height: string;
};

export type MdwMicroBlock = {
  micro_block_index: string;
  transactions_count: string;
  hash: MicroBlockHash;
  height: string;
  pof_hash: string;
  prev_hash: MicroBlockHash;
  prev_key_hash: KeyBlockHash;
  signature: string;
  state_hash: string;
  time: string;
  txs_hash: string;
  version: string;
};
