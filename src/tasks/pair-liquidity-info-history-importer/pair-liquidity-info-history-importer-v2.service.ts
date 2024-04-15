import { Injectable, Logger } from '@nestjs/common';
import { MdwHttpClientService } from '../../clients/mdw-http-client.service';
import {
  PairDbService,
  PairWithTokens,
} from '../../database/pair/pair-db.service';
import { SdkClientService } from '../../clients/sdk-client.service';
import { ContractLog } from '../../clients/mdw-http-client.model';
import { ContractAddress } from '../../clients/sdk-client.model';
import { orderBy } from 'lodash';
import { PairLiquidityInfoHistoryV2DbService } from '../../database/pair-liquidity-info-history/pair-liquidity-info-history-v2-db.service';
import { PairLiquidityInfoHistoryV2ErrorDbService } from '../../database/pair-liquidity-info-history-error/pair-liquidity-info-history-v2-error-db.service';
import { bigIntToDecimal } from '../../lib/utils';

@Injectable()
export class PairLiquidityInfoHistoryImporterV2Service {
  constructor(
    private mdwClient: MdwHttpClientService,
    private pairDb: PairDbService,
    private pairLiquidityInfoHistoryDb: PairLiquidityInfoHistoryV2DbService,
    private pairLiquidityInfoHistoryErrorDb: PairLiquidityInfoHistoryV2ErrorDbService,
    private sdkClient: SdkClientService,
  ) {}

  readonly logger = new Logger(PairLiquidityInfoHistoryImporterV2Service.name);

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
    this.logger.log(`Started syncing pair liquidity info history.`);

    // Fetch all pairs from DB
    const pairsWithTokens = await this.pairDb.getAll();
    this.logger.log(
      `Syncing liquidity info history for ${pairsWithTokens.length} pairs.`,
    );

    for (const pairWithTokens of pairsWithTokens) {
      try {
        // If an error occurred for this pair recently, skip pair
        const error =
          await this.pairLiquidityInfoHistoryErrorDb.getErrorByPairIdAndMicroBlockHashWithinHours(
            pairWithTokens.id,
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
        const lastSyncedHeight = lastSyncedLog?.height || 0;
        const lastSyncedBlockTime = lastSyncedLog?.microBlockTime || 0n;
        const lastSyncedLogIndex = lastSyncedLog?.logIndex || -1;

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
        const logsToInsert = orderBy(
          pairContractLogs.filter((contractLog: ContractLog) =>
            isHistoryOutdated
              ? (BigInt(contractLog.block_time) === lastSyncedBlockTime &&
                  parseInt(contractLog.log_idx) > lastSyncedLogIndex) ||
                BigInt(contractLog.block_time) > lastSyncedBlockTime
              : parseInt(contractLog.height) >=
                currentHeight - this.SLIDING_WINDOW_BLOCKS,
          ),
          ['block_time', 'log_idx'],
          ['asc', 'asc'],
        );

        let numUpserted = 0;

        for (const log of logsToInsert) {
          try {
            // If an error occurred for this log recently, skip block
            const error =
              await this.pairLiquidityInfoHistoryErrorDb.getErrorByPairIdAndMicroBlockHashWithinHours(
                pairWithTokens.id,
                log.block_hash,
                parseInt(log.log_idx),
                this.WITHIN_HOURS_TO_SKIP_IF_ERROR,
              );
            if (error) {
              this.logger.log(
                `Skipped log with block hash ${log.block_hash} and log index ${log.log_idx} due to recent error.`,
              );
              continue;
            }

            // Parse event
            const event = this.parseEvent(log);

            // If event could not be parsed (event is a non-relevant event), continue
            if (!event) {
              continue;
            }

            // Upsert liquidity
            await this.pairLiquidityInfoHistoryDb
              .upsert({
                pairId: pairWithTokens.id,
                eventType: event.eventType,
                reserve0: bigIntToDecimal(event.reserve0),
                reserve1: bigIntToDecimal(event.reserve1),
                deltaReserve0: bigIntToDecimal(event.deltaReserve0),
                deltaReserve1: bigIntToDecimal(event.deltaReserve1),
                fiatPrice: bigIntToDecimal(0n),
                height: parseInt(log.height),
                microBlockTime: BigInt(log.block_time),
                logIndex: parseInt(log.log_idx),
                microBlockHash: log.block_hash,
                transactionHash: log.call_tx_hash,
              })
              .then(() => numUpserted++);
          } catch (error) {
            const errorData = {
              pairId: pairWithTokens.id,
              microBlockHash: log.block_hash,
              logIndex: parseInt(log.log_idx),
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
    await this.pairLiquidityInfoHistoryDb
      .upsert({
        pairId: pairWithTokens.id,
        eventType: 'CreatePair',
        reserve0: bigIntToDecimal(0n),
        reserve1: bigIntToDecimal(0n),
        deltaReserve0: bigIntToDecimal(0n),
        deltaReserve1: bigIntToDecimal(0n),
        fiatPrice: bigIntToDecimal(0n),
        height: parseInt(microBlock.height),
        microBlockTime: BigInt(microBlock.time),
        logIndex: 0,
        microBlockHash: microBlock.hash,
        transactionHash: pairContract.source_tx_hash,
      })
      .then(() =>
        this.logger.log(
          `Inserted initial liquidity for pair ${pairWithTokens.id} ${pairWithTokens.address}.`,
        ),
      );
  }

  private parseEvent(log: ContractLog) {
    const parseEventData = (data: string): bigint[] => {
      return data.split('|').map((d) => BigInt(d));
    };

    switch (log.event_hash) {
      case this.SYNC_EVENT_HASH:
        // Sync
        // args: [balance0, balance1], data: empty
        return {
          eventType: 'Sync',
          reserve0: BigInt(log.args[0]),
          reserve1: BigInt(log.args[1]),
          deltaReserve0: null,
          deltaReserve1: null,
        };
      case this.SWAP_TOKENS_EVENT_HASH:
        // SwapTokens
        // args: [_, _], data: [amount0In, amount1In, amount0Out, amount1Out]
        const swapTokensData = parseEventData(log.data);
        return {
          eventType: 'SwapTokens',
          reserve0: null,
          reserve1: null,
          deltaReserve0: swapTokensData[0] - swapTokensData[2],
          deltaReserve1: swapTokensData[1] - swapTokensData[3],
        };
      case this.PAIR_MINT_EVENT_HASH:
        // PairMint
        // args: [_, amount0, amount1], data: empty
        return {
          eventType: 'PairMint',
          reserve0: null,
          reserve1: null,
          deltaReserve0: BigInt(log.args[1]),
          deltaReserve1: BigInt(log.args[2]),
        };
      case this.PAIR_BURN_EVENT_HASH:
        // PairBurn
        // args: [_, _], data: [amount0, amount1]
        const pairBurnData = parseEventData(log.data);
        return {
          eventType: 'PairBurn',
          reserve0: null,
          reserve1: null,
          deltaReserve0: 0n - pairBurnData[0],
          deltaReserve1: 0n - pairBurnData[1],
        };
      default:
        return null;
    }
  }
}
