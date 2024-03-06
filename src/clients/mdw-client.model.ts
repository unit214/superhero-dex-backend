export type MdwPaginatedResponse<T> = {
  next?: string;
  prev?: string;
  data: T[];
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
