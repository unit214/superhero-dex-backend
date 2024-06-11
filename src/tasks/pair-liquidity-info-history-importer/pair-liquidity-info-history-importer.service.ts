import { Injectable, Logger } from '@nestjs/common';
import { PairLiquidityInfoHistory } from '@prisma/client';
import { orderBy } from 'lodash';

import { CoinmarketcapClientService } from '@/clients/coinmarketcap-client.service';
import { ContractLog } from '@/clients/mdw-http-client.model';
import { MdwHttpClientService } from '@/clients/mdw-http-client.service';
import { ContractAddress } from '@/clients/sdk-client.model';
import { SdkClientService } from '@/clients/sdk-client.service';
import { PairDbService, PairWithTokens } from '@/database/pair/pair-db.service';
import { PairLiquidityInfoHistoryDbService } from '@/database/pair-liquidity-info-history/pair-liquidity-info-history-db.service';
import { PairLiquidityInfoHistoryErrorDbService } from '@/database/pair-liquidity-info-history-error/pair-liquidity-info-history-error-db.service';
import { bigIntToDecimal, decimalToBigInt, numberToDecimal } from '@/lib/utils';

export enum EventType {
  Sync = 'Sync',
  SwapTokens = 'SwapTokens',
  PairMint = 'PairMint',
  PairBurn = 'PairBurn',
}

type Event = SyncEvent | DeltaReserveEvent;

type SyncEvent = {
  eventType: EventType.Sync;
  reserve0: bigint;
  reserve1: bigint;
};

type DeltaReserveEvent = {
  eventType: EventType.SwapTokens | EventType.PairMint | EventType.PairBurn;
  deltaReserve0: bigint;
  deltaReserve1: bigint;
};

@Injectable()
export class PairLiquidityInfoHistoryImporterService {
  constructor(
    private pairDb: PairDbService,
    private pairLiquidityInfoHistoryDb: PairLiquidityInfoHistoryDbService,
    private pairLiquidityInfoHistoryErrorDb: PairLiquidityInfoHistoryErrorDbService,
    private mdwClient: MdwHttpClientService,
    private sdkClient: SdkClientService,
    private coinmarketcapClient: CoinmarketcapClientService,
  ) {}

  readonly logger = new Logger(PairLiquidityInfoHistoryImporterService.name);

  readonly WITHIN_HOURS_TO_SKIP_IF_ERROR = 6;
  readonly SLIDING_WINDOW_BLOCKS = 10;

  private readonly SYNC_EVENT_HASH =
    '6O232NLB36RGK54HEJPVDFJVCSIVFV29KPORC07CSSDARM7LV4L0====';
  private readonly SWAP_TOKENS_EVENT_HASH =
    'K39AB2I57LEUOUQ04LTEOMSJPJC3G9VGFRKVNJ5QLRMVCMDOPIMG====';
  private readonly PAIR_BURN_EVENT_HASH =
    'OIS2ALGSJ03MTP2BR5RBFL1GOUGESRVPGE58LGM0MVG9K3VAFKUG====';
  private readonly PAIR_MINT_EVENT_HASH =
    'L2BEDU7I5T8OSEUPB61900P8FJR637OE4MC4A9875C390RMQHSN0====';

  async import() {
    this.logger.log('Started syncing pair liquidity info history.');

    // Fetch all pairs from DB
    const pairsWithTokens = await this.pairDb.getAll();
    this.logger.log(
      `Syncing liquidity info history for ${pairsWithTokens.length} pairs.`,
    );

    for (const pairWithTokens of pairsWithTokens) {
      try {
        // If an error occurred for this pair recently, skip pair
        const error =
          await this.pairLiquidityInfoHistoryErrorDb.getErrorWithinHours(
            pairWithTokens.id,
            '',
            '',
            -1,
            this.WITHIN_HOURS_TO_SKIP_IF_ERROR,
          );
        if (error) {
          this.logger.log(
            `Skipped pair ${pairWithTokens.id} due to recent error.`,
          );
          continue;
        }

        // Get current height
        const currentHeight = await this.sdkClient.getHeight();

        // Get lastly synced log
        const lastSyncedLog =
          await this.pairLiquidityInfoHistoryDb.getLastlySyncedLogByPairId(
            pairWithTokens.id,
          );

        // If first sync (= no entries present yet for pair), insert initial liquidity
        if (!lastSyncedLog) {
          await this.insertInitialLiquidity(pairWithTokens);
        }
        const lastSyncedHeight = lastSyncedLog?.height ?? 0;
        const lastSyncedBlockTime = lastSyncedLog?.microBlockTime ?? 0n;
        const lastSyncedTxIndex = lastSyncedLog?.transactionIndex ?? 0n;
        const lastSyncedLogIndex = lastSyncedLog?.logIndex ?? -1;

        // Determine which logs to sync based on the lastly synced log
        // Strategy:
        // 1. Always (re-)fetch everything within the 10 most recent key blocks (currentHeight - 10).
        // 2. If the history is outdated, fetch everything since the lastly synced log
        const isHistoryOutdated =
          lastSyncedHeight < currentHeight - this.SLIDING_WINDOW_BLOCKS;

        // To make sure we get all desired logs, fetch all contract log pages
        // until the page contains a non-desired entry
        const fetchContractLogsLimit = (contractLog: ContractLog) =>
          isHistoryOutdated
            ? BigInt(contractLog.block_time) < lastSyncedBlockTime
            : parseInt(contractLog.height) <
              currentHeight - this.SLIDING_WINDOW_BLOCKS;

        const pairContractLogs =
          await this.mdwClient.getContractLogsUntilCondition(
            fetchContractLogsLimit,
            pairWithTokens.address as ContractAddress,
          );

        // Filter out all logs we don't want to insert (based on the strategy above) and sort the logs
        // in ascending order
        const relevantContractLogs = orderBy(
          pairContractLogs.filter((contractLog: ContractLog) =>
            isHistoryOutdated
              ? (BigInt(contractLog.call_txi) === lastSyncedTxIndex &&
                  parseInt(contractLog.log_idx) > lastSyncedLogIndex) ||
                BigInt(contractLog.call_txi) > lastSyncedTxIndex
              : parseInt(contractLog.height) >=
                currentHeight - this.SLIDING_WINDOW_BLOCKS,
          ),
          ['block_time', 'call_txi', 'log_idx'],
          ['asc', 'asc', 'asc'],
        );

        // Parse events from logs
        const logsAndEvents = relevantContractLogs
          .map((log) => ({
            log: log,
            event: this.parseEvent(log),
          }))
          .filter(
            (logAndEvent): logAndEvent is { log: ContractLog; event: Event } =>
              !!logAndEvent.event,
          );

        // Insert liquidity info for events
        let numUpserted = 0;
        for (const current of logsAndEvents) {
          try {
            const succeeding =
              logsAndEvents[logsAndEvents.indexOf(current) + 1];

            let liquidityInfo: Parameters<
              typeof this.pairLiquidityInfoHistoryDb.upsert
            >[0];
            // If current event is a Sync event and the next event is not a Sync event, insert merged liquidity info
            if (
              current.event.eventType === EventType.Sync &&
              succeeding.event.eventType !== EventType.Sync
            ) {
              const aeUsdPrice = await this.fetchPrice(
                parseInt(succeeding.log.block_time),
              );
              liquidityInfo = {
                pairId: pairWithTokens.id,
                eventType: succeeding.event.eventType,
                reserve0: bigIntToDecimal(current.event.reserve0),
                reserve1: bigIntToDecimal(current.event.reserve1),
                deltaReserve0: bigIntToDecimal(succeeding.event.deltaReserve0),
                deltaReserve1: bigIntToDecimal(succeeding.event.deltaReserve1),
                aeUsdPrice: numberToDecimal(aeUsdPrice),
                height: parseInt(succeeding.log.height),
                microBlockHash: succeeding.log.block_hash,
                microBlockTime: BigInt(succeeding.log.block_time),
                transactionHash: succeeding.log.call_tx_hash,
                transactionIndex: BigInt(succeeding.log.call_txi),
                logIndex: parseInt(succeeding.log.log_idx),
                senderAccount:
                  await this.mdwClient.getSenderAccountForTransaction(
                    current.log.call_tx_hash,
                  ),
              };
              // Else if current event is a Sync event and the next event is also a Sync event, insert Sync event
            } else if (current.event.eventType === EventType.Sync) {
              const lastSyncedLog =
                await this.pairLiquidityInfoHistoryDb.getLastlySyncedLogByPairId(
                  pairWithTokens.id,
                );
              const aeUsdPrice = await this.fetchPrice(
                parseInt(current.log.block_time),
              );
              liquidityInfo = {
                pairId: pairWithTokens.id,
                eventType: current.event.eventType,
                reserve0: bigIntToDecimal(current.event.reserve0),
                reserve1: bigIntToDecimal(current.event.reserve1),
                // Calculated by the delta from lastly synced log's reserve0
                deltaReserve0: lastSyncedLog
                  ? bigIntToDecimal(
                      current.event.reserve0 -
                        decimalToBigInt(lastSyncedLog.reserve0),
                    )
                  : bigIntToDecimal(0n),
                // Calculated by the delta from lastly synced log's reserve1
                deltaReserve1: lastSyncedLog
                  ? bigIntToDecimal(
                      current.event.reserve1 -
                        decimalToBigInt(lastSyncedLog.reserve1),
                    )
                  : bigIntToDecimal(0n),
                aeUsdPrice: numberToDecimal(aeUsdPrice),
                height: parseInt(current.log.height),
                microBlockHash: current.log.block_hash,
                microBlockTime: BigInt(current.log.block_time),
                transactionHash: current.log.call_tx_hash,
                transactionIndex: BigInt(current.log.call_txi),
                logIndex: parseInt(current.log.log_idx),
                senderAccount:
                  await this.mdwClient.getSenderAccountForTransaction(
                    current.log.call_tx_hash,
                  ),
              };
              // Else continue, as every non-Sync event is preceded by a Sync event and thus already inserted previously
            } else {
              continue;
            }

            // If an error occurred for this log recently, skip block
            const error =
              await this.pairLiquidityInfoHistoryErrorDb.getErrorWithinHours(
                pairWithTokens.id,
                current.log.block_hash,
                current.log.call_tx_hash,
                parseInt(current.log.log_idx),
                this.WITHIN_HOURS_TO_SKIP_IF_ERROR,
              );
            if (error) {
              this.logger.log(
                `Skipped log with block hash ${current.log.block_hash} tx hash ${current.log.call_tx_hash} and log index ${current.log.log_idx} due to recent error.`,
              );
              continue;
            }

            // Upsert liquidity
            await this.pairLiquidityInfoHistoryDb
              .upsert(liquidityInfo)
              .then(() => numUpserted++);
          } catch (error) {
            const errorData = {
              pairId: pairWithTokens.id,
              microBlockHash: current.log.block_hash,
              transactionHash: current.log.call_tx_hash,
              logIndex: parseInt(current.log.log_idx),
              error: error.toString(),
            };
            this.logger.error(`Skipped log. ${JSON.stringify(errorData)}`);
            await this.pairLiquidityInfoHistoryErrorDb.upsert(errorData);
          }
        }

        if (numUpserted > 0) {
          this.logger.log(
            `Completed sync for pair ${pairWithTokens.id} ${pairWithTokens.address}. Synced ${numUpserted} log(s).`,
          );
        }
      } catch (error) {
        const errorData = {
          pairId: pairWithTokens.id,
          microBlockHash: '',
          transactionHash: '',
          logIndex: -1,
          error: error.toString(),
        };
        this.logger.error(`Skipped pair. ${JSON.stringify(errorData)}`);
        await this.pairLiquidityInfoHistoryErrorDb.upsert(errorData);
      }
    }

    this.logger.log('Finished liquidity info history sync for all pairs.');
  }

  private async insertInitialLiquidity(pairWithTokens: PairWithTokens) {
    const pairContract = await this.mdwClient.getContract(
      pairWithTokens.address as ContractAddress,
    );
    const microBlock = await this.mdwClient.getMicroBlock(
      pairContract.block_hash,
    );
    const aeUsdPrice = await this.fetchPrice(parseInt(microBlock.time));
    await this.pairLiquidityInfoHistoryDb
      .upsert({
        pairId: pairWithTokens.id,
        eventType: 'CreatePair',
        reserve0: bigIntToDecimal(0n),
        reserve1: bigIntToDecimal(0n),
        deltaReserve0: bigIntToDecimal(0n),
        deltaReserve1: bigIntToDecimal(0n),
        aeUsdPrice: numberToDecimal(aeUsdPrice),
        height: parseInt(microBlock.height),
        microBlockHash: microBlock.hash,
        microBlockTime: BigInt(microBlock.time),
        transactionHash: pairContract.source_tx_hash,
        transactionIndex: 0n,
        senderAccount: await this.mdwClient.getSenderAccountForTransaction(
          pairContract.source_tx_hash,
        ),
        logIndex: 0,
      })
      .then(() =>
        this.logger.log(
          `Inserted initial liquidity for pair ${pairWithTokens.id} ${pairWithTokens.address}.`,
        ),
      );
  }

  private parseEvent(log: ContractLog): Event | undefined {
    const parseEventData = (data: string): bigint[] => {
      return data.split('|').map((d) => BigInt(d));
    };

    switch (log.event_hash) {
      case this.SYNC_EVENT_HASH:
        // Sync
        // args: [balance0, balance1], data: empty
        return {
          eventType: EventType.Sync,
          reserve0: BigInt(log.args[0]),
          reserve1: BigInt(log.args[1]),
        };
      case this.SWAP_TOKENS_EVENT_HASH:
        // SwapTokens
        // args: [_, _], data: [amount0In, amount1In, amount0Out, amount1Out]
        const swapTokensData = parseEventData(log.data);
        return {
          eventType: EventType.SwapTokens,
          deltaReserve0: swapTokensData[0] - swapTokensData[2],
          deltaReserve1: swapTokensData[1] - swapTokensData[3],
        };
      case this.PAIR_MINT_EVENT_HASH:
        // PairMint
        // args: [_, amount0, amount1], data: empty
        return {
          eventType: EventType.PairMint,
          deltaReserve0: BigInt(log.args[1]),
          deltaReserve1: BigInt(log.args[2]),
        };
      case this.PAIR_BURN_EVENT_HASH:
        // PairBurn
        // args: [_, _], data: [amount0, amount1]
        const pairBurnData = parseEventData(log.data);
        return {
          eventType: EventType.PairBurn,
          deltaReserve0: 0n - pairBurnData[0],
          deltaReserve1: 0n - pairBurnData[1],
        };
      default:
        return undefined;
    }
  }

  private async fetchPrice(microBlockTime: number): Promise<number> {
    // mock with random value between 0.05 and 0.5
    return Math.random() * (0.5 - 0.05) + 0.05;

    return this.coinmarketcapClient
      .getHistoricalPriceDataThrottled(microBlockTime)
      .then((res) => res.data['1700'].quotes[0].quote.USD.price)
      .catch(() => 0.1);
  }
}
