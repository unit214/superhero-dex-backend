import { Injectable, Logger } from '@nestjs/common';
import { MdwHttpClientService } from '../clients/mdw-http-client.service';
import {
  PairDbService,
  PairWithTokens,
} from '../database/pair/pair-db.service';
import { isEqual, orderBy, uniqWith } from 'lodash';
import { PairLiquidityInfoHistoryDbService } from '../database/pair-liquidity-info-history/pair-liquidity-info-history-db.service';
import { PairLiquidityInfoHistoryErrorDbService } from '../database/pair-liquidity-info-history-error/pair-liquidity-info-history-error-db.service';
import { ContractLog } from '../clients/mdw-http-client.model';
import { SdkClientService } from '../clients/sdk-client.service';
import {
  ContractAddress,
  contractAddrToAccountAddr,
  MicroBlockHash,
} from '../clients/sdk-client.model';

type MicroBlock = {
  hash: MicroBlockHash;
  timestamp: bigint;
  height: number;
};

@Injectable()
export class PairLiquidityInfoHistoryImporterService {
  constructor(
    private mdwClient: MdwHttpClientService,
    private pairDb: PairDbService,
    private pairLiquidityInfoHistoryDb: PairLiquidityInfoHistoryDbService,
    private pairLiquidityInfoHistoryErrorDb: PairLiquidityInfoHistoryErrorDbService,
    private sdkClient: SdkClientService,
  ) {}

  readonly logger = new Logger(PairLiquidityInfoHistoryImporterService.name);

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

        // Get lastly synced block
        const {
          height: lastSyncedHeight,
          microBlockTime: lastSyncedBlockTime,
        } = (await this.pairLiquidityInfoHistoryDb.getLastlySyncedBlockByPairId(
          pairWithTokens.id,
        )) || { height: 0, microBlockTime: 0n };

        // If first sync (= no entries present yet for pair), insert initial liquidity
        if (lastSyncedHeight === 0 && lastSyncedBlockTime === 0n) {
          await this.insertInitialLiquidity(pairWithTokens);
        }

        // Determine which micro blocks to sync based on the lastly synced block
        // Strategy:
        // 1. Always (re-)fetch everything within the 10 most recent key blocks (currentHeight - 10).
        // 2. If the history is outdated, fetch everything since the lastly synced micro block
        const isHistoryOutdated = lastSyncedHeight < currentHeight - 10;

        const microBlocksToFetchFilter = (contractLog: ContractLog) =>
          isHistoryOutdated
            ? BigInt(contractLog.block_time) > lastSyncedBlockTime
            : parseInt(contractLog.height) >= currentHeight - 10;

        // To make sure we get all desired micro blocks, fetch all contract log pages
        // until the page contains a non-desired micro block
        const fetchContractLogsFilter = (contractLog: ContractLog) =>
          isHistoryOutdated
            ? BigInt(contractLog.block_time) <= lastSyncedBlockTime
            : parseInt(contractLog.height) < currentHeight - 10;

        const pairContractLogs =
          await this.mdwClient.getContractLogsUntilCondition(
            fetchContractLogsFilter,
            pairWithTokens.address as ContractAddress,
          );

        // From the logs, get unique micro blocks in ascending order
        const microBlocksToFetch = orderBy(
          uniqWith<MicroBlock>(
            pairContractLogs
              .filter(microBlocksToFetchFilter)
              .map((contractLog) => {
                return {
                  hash: contractLog.block_hash,
                  timestamp: BigInt(contractLog.block_time),
                  height: parseInt(contractLog.height),
                };
              }),
            isEqual,
          ),
          'timestamp',
          'asc',
        );

        if (microBlocksToFetch.length > 0) {
          this.logger.log(
            `Started syncing pair ${pairWithTokens.id} ${pairWithTokens.address}. Need to sync ${microBlocksToFetch.length} micro block(s). This can take some time.`,
          );
        } else {
          this.logger.log(
            `Pair ${pairWithTokens.id} ${pairWithTokens.address} is already up to date.`,
          );
        }

        let numUpserted = 0;
        // Fetch and insert liquidity (totalSupply, reserve0, reserve1) for every micro block
        for (const block of microBlocksToFetch) {
          try {
            // If an error occurred for this block recently, skip block
            const error =
              await this.pairLiquidityInfoHistoryErrorDb.getErrorByPairIdAndMicroBlockHashWithinHours(
                pairWithTokens.id,
                block.hash,
                this.WITHIN_HOURS_TO_SKIP_IF_ERROR,
              );
            if (error) {
              this.logger.log(
                `Skipped micro block ${block.hash} due to recent error.`,
              );
              continue;
            }

            // Fetch liquidity
            const liquidity = await this.getLiquidityForPairAtBlock(
              pairWithTokens,
              block,
            );

            // Upsert liquidity
            await this.pairLiquidityInfoHistoryDb
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
            await this.pairLiquidityInfoHistoryErrorDb.upsert(errorData);
          }
        }

        if (numUpserted > 0) {
          this.logger.log(
            `Completed sync for pair ${pairWithTokens.id} ${pairWithTokens.address}. Synced ${numUpserted} micro block(s).`,
          );
        }
      } catch (error) {
        const errorData = {
          pairId: pairWithTokens.id,
          microBlockHash: '',
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
        totalSupply: '0',
        reserve0: '0',
        reserve1: '0',
        height: parseInt(microBlock.height),
        microBlockHash: microBlock.hash,
        microBlockTime: BigInt(microBlock.time),
      })
      .then(() =>
        this.logger.log(
          `Inserted initial liquidity for pair ${pairWithTokens.address}.`,
        ),
      );
  }
  private async getLiquidityForPairAtBlock(
    pairWithTokens: PairWithTokens,
    block: MicroBlock,
  ) {
    // Total supply is the sum of all amounts of the pair contract's balances
    const pairBalances =
      await this.mdwClient.getContractBalancesAtMicroBlockHash(
        pairWithTokens.address as ContractAddress,
        block.hash,
      );
    const totalSupply = pairBalances
      .map((contractBalance) => BigInt(contractBalance.amount))
      .reduce((a, b) => a + b, 0n);

    // reserve0 is the balance of the pair contract's account of token0
    const reserve0 = (
      await this.mdwClient.getAccountBalanceForContractAtMicroBlockHash(
        pairWithTokens.token0.address as ContractAddress,
        contractAddrToAccountAddr(pairWithTokens.address as ContractAddress),
        block.hash,
      )
    ).amount;

    // reserve1 is the balance of the pair contract's account of token1
    const reserve1 = (
      await this.mdwClient.getAccountBalanceForContractAtMicroBlockHash(
        pairWithTokens.token1.address as ContractAddress,
        contractAddrToAccountAddr(pairWithTokens.address as ContractAddress),
        block.hash,
      )
    ).amount;

    return { totalSupply, reserve0, reserve1 };
  }
}
