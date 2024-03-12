export type MdwPaginatedResponse<T> = {
  next?: string;
  prev?: string;
  data: T[];
};

export type Contract = {
  aexn_type: string;
  block_hash: string;
  contract: string;
  source_tx_hash: string;
  source_tx_type: string;
  create_tx: any;
};

export type ContractLog = {
  args: string[];
  block_hash: string;
  block_time: string;
  call_tx_hash: string;
  call_txi: string;
  contract_id: string;
  contract_tx_hash: string;
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
  parent_contract_id: string;
};

export type AccountBalance = {
  account: string;
  amount: string;
  contract: string;
};

export type BalancesV1 = {
  amounts: Record<string, string>;
  block_hash: string;
  contract_id: string;
  height: string;
};

export type MdwMicroBlock = {
  micro_block_index: string;
  transactions_count: string;
  hash: string;
  height: string;
  pof_hash: string;
  prev_hash: string;
  prev_key_hash: string;
  signature: string;
  state_hash: string;
  time: string;
  txs_hash: string;
  version: string;
};
