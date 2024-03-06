import { Injectable, Logger } from '@nestjs/common';
import { MdwClientService } from '../clients/mdw/mdw-client.service';
import { PairService, PairWithTokens } from '../database/pair.service';
import { isEqual, uniqWith, values } from 'lodash';
import { PairLiquidityInfoHistoryService } from '../database/pair-liquidity-info-history.service';
import { contractIdToAccountId } from '../lib/utils';
import { PairLiquidityInfoHistoryErrorService } from '../database/pair-liquidity-info-history-error.service';
import { getClient } from '../lib/contracts';
import { Cron, CronExpression } from '@nestjs/schedule';

type MicroBlock = {
  hash: string;
  timestamp: bigint;
  height: number;
};

@Injectable()
export class PairLiquidityInfoHistoryImporterService {
  constructor(
    private mdwClientService: MdwClientService,
    private pairService: PairService,
    private pairLiquidityInfoHistoryService: PairLiquidityInfoHistoryService,
    private pairLiquidityInfoHistoryErrorService: PairLiquidityInfoHistoryErrorService,
  ) {}

  private readonly logger = new Logger(
    PairLiquidityInfoHistoryImporterService.name,
  );

  private isSyncRunning: boolean = false;

  // TODO change to desired frequency
  @Cron(CronExpression.EVERY_30_SECONDS)
  async runTask() {
    try {
      if (!this.isSyncRunning) {
        this.isSyncRunning = true;
        await this.syncPairLiquidityInfoHistory();
        this.isSyncRunning = false;
      }
    } catch (error) {
      this.isSyncRunning = false;
      this.logger.error(`Sync failed. ${JSON.stringify(error)}`);
    }
  }

  private async syncPairLiquidityInfoHistory() {
    this.logger.log(`Started syncing pair liquidity info history.`);

    // Fetch all pairs from DB
    const pairsWithTokens = await this.pairService.getAll();
    this.logger.log(
      `Syncing liquidity info history for ${pairsWithTokens.length} pairs.`,
    );

    for (const pairWithTokens of pairsWithTokens) {
      try {
        // Get current height
        const currentHeight = await (await getClient())[0].getHeight();

        // Get last synced block
        const {
          height: lastSyncedHeight,
          microBlockTime: lastSyncedBlockTime,
        } = (await this.pairLiquidityInfoHistoryService.getLastSyncedHeight(
          pairWithTokens.id,
        )) || { height: 0, microBlockTime: 0n };

        // Fetch all logs for pair contract
        const pairContractLogs = await this.mdwClientService.getContractLogs(
          pairWithTokens.address,
        );

        // If the history is outdated, fetch everything after the lastly fetched microBlock.
        // Also, always refetch everything in the 10 most recent key blocks (currentHeight - 10).
        const uniqueBlocks = uniqWith<MicroBlock>(
          pairContractLogs
            .filter((contractLog) =>
              lastSyncedHeight < currentHeight - 10
                ? BigInt(contractLog.block_time) > lastSyncedBlockTime
                : parseInt(contractLog.height) >= currentHeight - 10,
            )
            .map((contractLog) => {
              return {
                hash: contractLog.block_hash,
                timestamp: BigInt(contractLog.block_time),
                height: parseInt(contractLog.height),
              };
            }),
          isEqual,
        );

        if (uniqueBlocks.length > 0) {
          this.logger.log(
            `Started syncing pair ${pairWithTokens.address}. Need to sync ${uniqueBlocks.length} microBlocks. This can take some time.`,
          );
        } else {
          this.logger.log(
            `Pair ${pairWithTokens.address} is already up to date.`,
          );
        }

        let numUpserted = 0;
        // Fetch and insert liquidity (totalSupply, reserve0, reserve1) for every microBlock
        for (const block of uniqueBlocks) {
          try {
            // Fetch liquidity
            const liquidity = await this.getLiquidityForPairAtBlock(
              pairWithTokens,
              block,
            );
            // Upsert liquidity
            await this.pairLiquidityInfoHistoryService
              .upsertPaidLiquidityState({
                pairId: pairWithTokens.id,
                totalSupply: liquidity.totalSupply.toString(),
                reserve0: liquidity.reserve0,
                reserve1: liquidity.reserve1,
                height: block.height,
                microBlockHash: block.hash,
                microBlockTime: block.timestamp,
              })
              .then(() => numUpserted++);
          } catch (error) {
            const errorData = {
              pairId: pairWithTokens.id,
              microBlockHash: block.hash,
              error: error.toString(),
            };
            this.logger.error(
              `Skipped microBlock. ${JSON.stringify(errorData)}`,
            );
            await this.pairLiquidityInfoHistoryErrorService.insert(errorData);
          }
        }

        if (numUpserted > 0) {
          this.logger.log(
            `Completed sync for pair ${pairWithTokens.address}. Synced ${numUpserted} microBlocks.`,
          );
        }
      } catch (error) {
        const errorData = {
          pairId: pairWithTokens.id,
          microBlockHash: null,
          error: error.toString(),
        };
        this.logger.error(`Skipped pair. ${JSON.stringify(errorData)}`);
        await this.pairLiquidityInfoHistoryErrorService.insert(errorData);
      }
    }

    this.logger.log(`Finished liquidity info history sync for all pairs.`);
  }

  private async getLiquidityForPairAtBlock(
    pairWithTokens: PairWithTokens,
    block: MicroBlock,
  ) {
    // Total supply is the sum of all amounts of the pair contract's balances
    const pairBalances = await this.mdwClientService.getBalancesV1(
      pairWithTokens.address,
      block.hash,
    );
    const totalSupply = values(pairBalances.amounts)
      .map((amount) => BigInt(amount))
      .reduce((a, b) => a + b, 0n);

    // reserve0 is the balance of the pair contract's account of token0
    const reserve0 = (
      await this.mdwClientService.getAccountBalance(
        pairWithTokens.token0.address,
        contractIdToAccountId(pairWithTokens.address),
        block.hash,
      )
    ).amount;

    // reserve1 is the balance of the pair contract's account of token1
    const reserve1 = (
      await this.mdwClientService.getAccountBalance(
        pairWithTokens.token1.address,
        contractIdToAccountId(pairWithTokens.address),
        block.hash,
      )
    ).amount;

    return { totalSupply, reserve0, reserve1 };
  }
}
