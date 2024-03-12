import { Injectable, Logger } from '@nestjs/common';
import { MdwClientService } from '../clients/mdw-client.service';
import { PairService, PairWithTokens } from '../database/pair.service';
import { isEqual, uniqWith, values } from 'lodash';
import { PairLiquidityInfoHistoryService } from '../database/pair-liquidity-info-history.service';
import { ContractAddress, contractAddrToAccountAddr } from '../lib/utils';
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

  WITHIN_HOURS_TO_SKIP_IF_ERROR = 6;

  private isSyncRunning: boolean = false;

  @Cron(CronExpression.EVERY_5_MINUTES)
  async runTask() {
    try {
      if (!this.isSyncRunning) {
        this.isSyncRunning = true;
        await this.syncPairLiquidityInfoHistory();
      }
    } catch (error) {
      this.logger.error(`Sync failed. ${error}`);
    } finally {
      this.isSyncRunning = false;
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
        // If an error occurred for this pair recently, skip pair
        const error =
          await this.pairLiquidityInfoHistoryErrorService.getErrorByPairIdAndMicroBlockHashWithinHours(
            pairWithTokens.id,
            '',
            this.WITHIN_HOURS_TO_SKIP_IF_ERROR,
          );
        if (error) {
          this.logger.log(
            `Skipped pair ${pairWithTokens.id} due to recent error.`,
          );
          continue;
        }

        // Insert initial liquidity if first sync / no entries present yet
        await this.insertInitialLiquidity(pairWithTokens);

        // Fetch all logs for pair contract
        const pairContractLogs = await this.mdwClientService.getContractLogs(
          pairWithTokens.address as ContractAddress,
        );

        // Get current height
        const currentHeight = await getClient().then(([client]) =>
          client.getHeight(),
        );

        // Get lastly synced block
        const {
          height: lastSyncedHeight,
          microBlockTime: lastSyncedBlockTime,
        } =
          (await this.pairLiquidityInfoHistoryService.getLastlySyncedBlockByPairId(
            pairWithTokens.id,
          )) || { height: 0, microBlockTime: 0n };

        // From the logs, select the micro blocks to fetch data for
        // Strategy:
        // 1. Always (re-)fetch everything within the 10 most recent key blocks (currentHeight - 10).
        // 2. If the history is outdated, fetch everything since the lastly synced micro block (and refetch the lastly fetched microblock)
        const microBlocksToFetch = uniqWith<MicroBlock>(
          pairContractLogs
            .filter((contractLog) =>
              lastSyncedHeight < currentHeight - 10
                ? BigInt(contractLog.block_time) >= lastSyncedBlockTime
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

        if (microBlocksToFetch.length > 0) {
          this.logger.log(
            `Started syncing pair ${pairWithTokens.address}. Need to sync ${microBlocksToFetch.length} microBlocks. This can take some time.`,
          );
        } else {
          this.logger.log(
            `Pair ${pairWithTokens.address} is already up to date.`,
          );
        }

        let numUpserted = 0;
        // Fetch and insert liquidity (totalSupply, reserve0, reserve1) for every microBlock
        for (const block of microBlocksToFetch) {
          try {
            // If an error occurred for this block recently, skip block
            const error =
              await this.pairLiquidityInfoHistoryErrorService.getErrorByPairIdAndMicroBlockHashWithinHours(
                pairWithTokens.id,
                block.hash,
                this.WITHIN_HOURS_TO_SKIP_IF_ERROR,
              );
            if (error) {
              this.logger.log(
                `Skipped microblock ${block.hash} due to recent error.`,
              );
              continue;
            }

            // Fetch liquidity
            const liquidity = await this.getLiquidityForPairAtBlock(
              pairWithTokens,
              block,
            );

            // Upsert liquidity
            await this.pairLiquidityInfoHistoryService
              .upsert({
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
            await this.pairLiquidityInfoHistoryErrorService.upsert(errorData);
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
          microBlockHash: '',
          error: error.toString(),
        };
        this.logger.error(`Skipped pair. ${JSON.stringify(errorData)}`);
        await this.pairLiquidityInfoHistoryErrorService.upsert(errorData);
      }
    }

    this.logger.log(`Finished liquidity info history sync for all pairs.`);
  }

  private async insertInitialLiquidity(pairWithToken: PairWithTokens) {
    const count = await this.pairLiquidityInfoHistoryService.getCountByPairId(
      pairWithToken.id,
    );
    if (count === 0) {
      const pairContract = await this.mdwClientService.getContract(
        pairWithToken.address,
      );
      const microBlock = await this.mdwClientService.getMicroBlock(
        pairContract.block_hash,
      );
      await this.pairLiquidityInfoHistoryService
        .upsert({
          pairId: pairWithToken.id,
          totalSupply: '0',
          reserve0: '0',
          reserve1: '0',
          height: parseInt(microBlock.height),
          microBlockHash: microBlock.hash,
          microBlockTime: BigInt(microBlock.time),
        })
        .then(() =>
          this.logger.log(
            `Inserted initial liquidity for pair ${pairWithToken.address}.`,
          ),
        );
    }
  }
  private async getLiquidityForPairAtBlock(
    pairWithTokens: PairWithTokens,
    block: MicroBlock,
  ) {
    // Total supply is the sum of all amounts of the pair contract's balances
    const pairBalances =
      await this.mdwClientService.getContractBalancesAtHashV1(
        pairWithTokens.address as ContractAddress,
        block.hash,
      );
    const totalSupply = values(pairBalances.amounts)
      .map((amount) => BigInt(amount))
      .reduce((a, b) => a + b, 0n);

    // reserve0 is the balance of the pair contract's account of token0
    const reserve0 = (
      await this.mdwClientService.getAccountBalanceForContractAtHash(
        pairWithTokens.token0.address as ContractAddress,
        contractAddrToAccountAddr(pairWithTokens.address as ContractAddress),
        block.hash,
      )
    ).amount;

    // reserve1 is the balance of the pair contract's account of token1
    const reserve1 = (
      await this.mdwClientService.getAccountBalanceForContractAtHash(
        pairWithTokens.token1.address as ContractAddress,
        contractAddrToAccountAddr(pairWithTokens.address as ContractAddress),
        block.hash,
      )
    ).amount;

    return { totalSupply, reserve0, reserve1 };
  }
}
