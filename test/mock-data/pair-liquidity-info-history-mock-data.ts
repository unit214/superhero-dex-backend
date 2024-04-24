import { Pair, PairLiquidityInfoHistoryV2, Token } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { Contract } from '@/clients/mdw-http-client.model';
import { ContractAddress } from '@/clients/sdk-client.model';
import { EventType } from '@/tasks/pair-liquidity-info-history-importer/pair-liquidity-info-history-importer-v2.service';

export const token1: Token = {
  id: 1,
  address: 'ct_token1',
  symbol: '1',
  name: '1',
  decimals: 18,
  malformed: false,
  noContract: false,
  listed: false,
};

export const token2: Token = {
  id: 2,
  address: 'ct_token2',
  symbol: '2',
  name: '2',
  decimals: 18,
  malformed: false,
  noContract: false,
  listed: false,
};

export const token3: Token = {
  id: 3,
  address: 'ct_token3',
  symbol: '3',
  name: '3',
  decimals: 18,
  malformed: false,
  noContract: false,
  listed: false,
};

export const pair1: Pair = {
  id: 1,
  address: 'ct_pair1',
  t0: 1,
  t1: 2,
  synchronized: true,
};

export const pair2: Pair = {
  id: 2,
  address: 'ct_pair2',
  t0: 2,
  t1: 3,
  synchronized: true,
};

export const pair3: Pair = {
  id: 3,
  address: 'ct_pair4',
  t0: 2,
  t1: 3,
  synchronized: true,
};

export const historyEntry1: PairLiquidityInfoHistoryV2 = {
  id: 111,
  pairId: 1,
  eventType: EventType.PairMint,
  reserve0: new Decimal(1000),
  reserve1: new Decimal(1000),
  deltaReserve0: new Decimal(1000),
  deltaReserve1: new Decimal(1000),
  aeUsdPrice: new Decimal(0.050559),
  height: 100001,
  microBlockHash: 'mh_entry1',
  microBlockTime: 1000000000001n,
  transactionHash: 'th_entry1',
  transactionIndex: 100001n,
  logIndex: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const historyEntry2: PairLiquidityInfoHistoryV2 = {
  id: 222,
  pairId: 1,
  eventType: EventType.SwapTokens,
  reserve0: new Decimal(1050),
  reserve1: new Decimal(950),
  deltaReserve0: new Decimal(50),
  deltaReserve1: new Decimal(-50),
  aeUsdPrice: new Decimal(0.050559),
  height: 200002,
  microBlockHash: 'mh_entry2',
  microBlockTime: 2000000000002n,
  transactionHash: 'th_entry2',
  transactionIndex: 200002n,
  logIndex: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const historyEntry3: PairLiquidityInfoHistoryV2 = {
  id: 333,
  pairId: 2,
  eventType: EventType.PairMint,
  reserve0: new Decimal(1000),
  reserve1: new Decimal(1000),
  deltaReserve0: new Decimal(1000),
  deltaReserve1: new Decimal(1000),
  aeUsdPrice: new Decimal(0.050559),
  height: 300003,
  microBlockHash: 'mh_entry3',
  microBlockTime: 3000000000003n,
  transactionHash: 'th_entry3',
  transactionIndex: 300003n,
  logIndex: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const historyEntry4: PairLiquidityInfoHistoryV2 = {
  id: 444,
  pairId: 2,
  eventType: EventType.SwapTokens,
  reserve0: new Decimal(1050),
  reserve1: new Decimal(950),
  deltaReserve0: new Decimal(50),
  deltaReserve1: new Decimal(-50),
  aeUsdPrice: new Decimal(0.050559),
  height: 300003,
  microBlockHash: 'mh_entry3',
  microBlockTime: 3000000000003n,
  transactionHash: 'th_entry3',
  transactionIndex: 300003n,
  logIndex: 2,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const pairWithTokens = {
  id: 1,
  address: 'ct_pair' as ContractAddress,
  token0: { address: 'ct_token0' },
  token1: { address: 'ct_token1' },
};

export const pairContract: Contract = {
  aexn_type: '',
  block_hash: 'mh_hash0',
  contract: pairWithTokens.address,
  source_tx_hash: 'th_',
  source_tx_type: '',
  create_tx: {},
};

export const initialMicroBlock = {
  hash: pairContract.block_hash,
  height: '10000',
  time: '1000000000000',
};

export const contractLog1 = {
  args: ['100', '100'],
  block_hash: 'mh_hash1',
  block_time: '1000000000001',
  call_tx_hash: 'th_hash1',
  call_txi: '10000001',
  data: '',
  event_hash: '6O232NLB36RGK54HEJPVDFJVCSIVFV29KPORC07CSSDARM7LV4L0====', // Sync
  height: '10001',
  log_idx: '1',
};

export const contractLog2 = {
  args: ['123', '100', '100'],
  block_hash: 'mh_hash1',
  block_time: '1000000000001',
  call_tx_hash: 'th_hash1',
  call_txi: '10000001',
  data: '',
  event_hash: 'L2BEDU7I5T8OSEUPB61900P8FJR637OE4MC4A9875C390RMQHSN0====', // PairMint
  height: '10001',
  log_idx: '2',
};

export const contractLog3 = {
  args: ['200', '200'],
  block_hash: 'mh_hash2',
  block_time: '2000000000002',
  call_tx_hash: 'th_hash2',
  call_txi: '20000002',
  data: '',
  event_hash: '6O232NLB36RGK54HEJPVDFJVCSIVFV29KPORC07CSSDARM7LV4L0====', // Sync
  height: '20002',
  log_idx: '1',
};

export const contractLog4 = {
  args: ['201', '199'],
  block_hash: 'mh_hash3',
  block_time: '3000000000003',
  call_tx_hash: 'th_hash3',
  call_txi: '30000003',
  data: '',
  event_hash: '6O232NLB36RGK54HEJPVDFJVCSIVFV29KPORC07CSSDARM7LV4L0====', // Sync
  height: '30003',
  log_idx: '1',
};

export const contractLog5 = {
  args: [],
  block_hash: 'mh_hash3',
  block_time: '3000000000003',
  call_tx_hash: 'th_hash3',
  call_txi: '30000003',
  data: '1|0|0|1',
  event_hash: 'K39AB2I57LEUOUQ04LTEOMSJPJC3G9VGFRKVNJ5QLRMVCMDOPIMG====', // SwapTokens
  height: '30003',
  log_idx: '2',
};

export const contractLog6 = {
  args: ['100', '100'],
  block_hash: 'mh_hash3',
  block_time: '3000000000003',
  call_tx_hash: 'th_hash4',
  call_txi: '40000004',
  data: '',
  event_hash: '6O232NLB36RGK54HEJPVDFJVCSIVFV29KPORC07CSSDARM7LV4L0====', // Sync
  height: '30003',
  log_idx: '1',
};

export const contractLog7 = {
  args: [],
  block_hash: 'mh_hash3',
  block_time: '3000000000003',
  call_tx_hash: 'th_hash4',
  call_txi: '40000004',
  data: '101|99',
  event_hash: 'OIS2ALGSJ03MTP2BR5RBFL1GOUGESRVPGE58LGM0MVG9K3VAFKUG====', // PairBurn
  height: '30003',
  log_idx: '2',
};

export const contractLog8 = {
  args: [],
  block_hash: 'mh_hash3',
  block_time: '3000000000003',
  call_tx_hash: 'th_hash4',
  call_txi: '40000004',
  data: '',
  event_hash: 'non_relevant_event_hash', // Something else
  height: '30003',
  log_idx: '3',
};

export const coinmarketcapResponseAeUsdQuoteData = {
  data: {
    1700: {
      quotes: [{ quote: { USD: { price: 0.050559 } } }],
    },
  },
};
