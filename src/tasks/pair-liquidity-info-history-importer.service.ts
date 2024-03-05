import { Injectable, Logger } from '@nestjs/common';
import { MdwClientService } from '../clients/mdw/mdw-client.service';
import { PairService, PairWithTokens } from '../database/pair.service';
import { uniqWith, isEqual } from 'lodash';
import { PairLiquidityInfoHistoryService } from '../database/pair-liquidity-info-history.service';
import { contractIdToAccountId } from '../lib/utils';
import { PairLiquidityInfoHistoryErrorService } from '../database/pair-liquidity-info-history-error.service';
import { getClient } from '../lib/contracts';

type MicroBlock = {
  hash: string;
  timestamp: bigint;
  height: number;
};
//TODO add cronjob
@Injectable()
export class PairLiquidityInfoHistoryImporterService {
  constructor(
    private mdwClientService: MdwClientService,
    private pairService: PairService,
    private pairLiquidityStateService: PairLiquidityInfoHistoryService,
    private pairLiquidityErrorService: PairLiquidityInfoHistoryErrorService,
  ) {}

  private readonly logger = new Logger(
    PairLiquidityInfoHistoryImporterService.name,
  );

  async importHistoricData() {
    this.logger.log(`Start syncing pair liquidity info history.`);

    // Fetch all pairs from DB
    const pairsWithTokens = await this.pairService.getAll();
    this.logger.log(
      `Syncing liquidity info history for ${pairsWithTokens.length} pairs.`,
    );

    // TODO remove slice
    for (const pairWithTokens of pairsWithTokens.slice(0, 1)) {
      // Get current height
      const currentHeight = await (await getClient())[0].getHeight();

      // Get last synced block
      const { height: lastSyncedHeight, microBlockTime: lastSyncedBlockTime } =
        (await this.pairLiquidityStateService.getLastSyncedHeight(
          pairWithTokens.id,
        )) || { height: 0, microBlockTime: 0 };

      // Fetch all logs for pair contract
      const pairContractLogs = await this.mdwClientService.getContractLogs(
        pairWithTokens.address,
      );

      // Get unique microBlocks after current height - 10 or last synced microBlock time
      const uniqueBlocks = uniqWith<MicroBlock>(
        pairContractLogs
          .filter((contractLog) =>
            lastSyncedHeight < currentHeight - 10
              ? contractLog.block_time > lastSyncedBlockTime
              : contractLog.height >= currentHeight - 10,
          )
          .map((contractLog) => {
            return {
              hash: contractLog.block_hash,
              timestamp: contractLog.block_time,
              height: contractLog.height,
            };
          }),
        isEqual,
      );

      this.logger.log(
        `Need to sync ${uniqueBlocks.length} microBlocks for pair ${pairWithTokens.address}. Start syncing...`,
      );

      let numUpserted = 0;
      // Fetch and insert liquidity (totalSupply, reserve0, reserve1) for every microBlock
      for (const block of uniqueBlocks) {
        const liquidity = await this.getLiquidityForPairAtBlock(
          pairWithTokens,
          block,
        ).catch(async (error) => {
          this.logger.error(error);
          await this.pairLiquidityErrorService.insert({
            pairId: pairWithTokens.id,
            microBlockHash: block.hash,
            functionCall: 'getLiquidityForPairAtBlock',
            error: error.toString(),
          });
          return undefined;
        });
        if (liquidity) {
          await this.pairLiquidityStateService
            .upsertPaidLiquidityState({
              pairId: pairWithTokens.id,
              totalSupply: liquidity.totalSupply.toString(),
              reserve0: liquidity.reserve0.toString(),
              reserve1: liquidity.reserve1.toString(),
              height: block.height,
              microBlockHash: block.hash,
              microBlockTime: block.timestamp,
              keyblockHash: 'TBD', // TODO: do we even need this? For the validator, the height seems to be enough.
            })
            .then(() => numUpserted++);
        }
      }

      this.logger.log(
        `Synced ${numUpserted} microBlock for pair ${pairWithTokens.address}.`,
      );
    }

    this.logger.log(`Pair liquidity info history sync completed.`);
  }

  private async getLiquidityForPairAtBlock(
    pairWithTokens: PairWithTokens,
    block: MicroBlock,
  ) {
    // Total supply is the sum of all amounts of the pairs balances
    const totalSupply = Object.values(
      (
        await this.mdwClientService.getBalancesV1(
          pairWithTokens.address,
          block.hash,
        )
      ).amounts,
    ).reduce((a, b) => a + b, 0n);

    const reserve0 = (
      await this.mdwClientService.getAccountBalance(
        pairWithTokens.token0.address,
        contractIdToAccountId(pairWithTokens.address),
        block.hash,
      )
    ).amount;

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
