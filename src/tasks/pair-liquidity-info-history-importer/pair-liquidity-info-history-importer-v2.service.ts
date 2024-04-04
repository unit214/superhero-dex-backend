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
        const isHistoryOutdated = lastSyncedHeight < currentHeight - 10;

        // To make sure we get all desired logs, fetch all contract log pages
        // until the page contains a non-desired entry
        const fetchContractLogsLimit = (contractLog: ContractLog) =>
          isHistoryOutdated
            ? BigInt(contractLog.block_time) < lastSyncedBlockTime
            : parseInt(contractLog.height) < currentHeight - 10;

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
              : parseInt(contractLog.height) >= currentHeight - 10,
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

            // TODO continue for non relevant events
            // TODO Parse event
            // TODO insert event with correct data
            // Upsert liquidity
            await this.pairLiquidityInfoHistoryDb
              .upsert({
                pairId: pairWithTokens.id,
                eventType: 'parsedEventType', // TODO change
                logIndex: parseInt(log.log_idx),
                height: parseInt(log.height),
                microBlockHash: log.block_hash,
                microBlockTime: BigInt(log.block_time),
                transactionHash: log.call_tx_hash,
                reserve0: '0',
                reserve1: '0',
                totalSupply: '0',
                deltaReserve0: '0',
                deltaReserve1: '0',
                fiatPrice: '0',
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
        logIndex: 0,
        height: parseInt(microBlock.height),
        microBlockHash: microBlock.hash,
        microBlockTime: BigInt(microBlock.time),
        transactionHash: pairContract.source_tx_hash,
        reserve0: '0',
        reserve1: '0',
        totalSupply: '0',
        deltaReserve0: '0',
        deltaReserve1: '0',
        fiatPrice: '0',
      })
      .then(() =>
        this.logger.log(
          `Inserted initial liquidity for pair ${pairWithTokens.id} ${pairWithTokens.address}.`,
        ),
      );
  }
}
