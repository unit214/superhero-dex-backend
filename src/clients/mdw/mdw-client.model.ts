export type MdwPaginatedResponse = {
  next?: string;
  prev?: string;
  data: any[];
};

export type ContractLog = {
  args: string[];
  block_hash: string;
  block_time: bigint;
  call_tx_hash: string;
  call_txi: number;
  contract_id: string;
  contract_tx_hash: string;
  contract_txi: number;
  data: string;
  event_hash: string;
  event_name?: string;
  ext_caller_contract_id?: string;
  ext_caller_contract_tx_hash?: string;
  ext_caller_contract_txi: string;
  height: number;
  log_idx: number;
  micro_index: number;
  parent_contract_id: string;
};

export type AccountBalance = {
  account: string;
  amount: bigint;
  contract: string;
};

export type BalancesV1 = {
  amounts: Record<string, bigint>;
  block_hash: string;
  contract_id: string;
  height: number;
};
