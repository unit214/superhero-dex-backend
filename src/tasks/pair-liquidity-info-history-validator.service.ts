import { MdwClientService } from '../clients/mdw-client.service';
import { PairLiquidityInfoHistoryService } from '../database/pair-liquidity-info-history.service';
import { Injectable, Logger } from '@nestjs/common';
import { orderBy, uniq } from 'lodash';
import { Cron } from '@nestjs/schedule';
import { getClient } from '../lib/contracts';

@Injectable()
export class PairLiquidityInfoHistoryValidatorService {
  constructor(
    private mdwClientService: MdwClientService,
    private pairLiquidityInfoHistoryService: PairLiquidityInfoHistoryService,
  ) {}

  private readonly logger = new Logger(
    PairLiquidityInfoHistoryValidatorService.name,
  );

  private isValidationRunning: boolean = false;

  // TODO change to desired frequency
  @Cron('*/20 * * * * *')
  async runTask() {
    try {
      if (!this.isValidationRunning) {
        this.isValidationRunning = true;
        await this.validatePairLiquidityInfoHistory();
        this.isValidationRunning = false;
      }
    } catch (error) {
      this.isValidationRunning = false;
      this.logger.error(`Validation failed. ${error}`);
    }
  }

  async validatePairLiquidityInfoHistory() {
    this.logger.log(`Started validating pair liquidity info history.`);
    // Get current height
    const currentHeight = await (await getClient())[0].getHeight();

    // Get all liquidity entries greater or equal the current height minus 20
    const liquidityEntriesWithinHeight =
      await this.pairLiquidityInfoHistoryService.getWithinHeight(
        currentHeight - 20,
      );

    // Get unique keyBlocks from entries
    const uniqueHeights = uniq(
      liquidityEntriesWithinHeight.map((e) => e.height),
    );

    // Fetch microBlocks for these unique keyBlocks from mdw
    const microBlockHashsOnMdw = (
      await Promise.all(
        uniqueHeights.map((h) =>
          this.mdwClientService.getKeyBlockMicroBlocks(h.toString()),
        ),
      )
    )
      .flat()
      .map((mb) => mb.hash);

    // If a local microBlock is not contained in the mdw, delete this block and all newer entries
    let numDeleted = 0;
    for (const liquidityEntry of orderBy(
      liquidityEntriesWithinHeight,
      ['microBlockTime'],
      ['asc'],
    )) {
      if (!microBlockHashsOnMdw.includes(liquidityEntry.microBlockHash)) {
        numDeleted = (
          await this.pairLiquidityInfoHistoryService.deleteFromMicroBlockTime(
            liquidityEntry.microBlockTime,
          )
        ).count;
        break;
      }
    }

    if (numDeleted > 0) {
      this.logger.log(
        `Found an inconsistency in pair liquidity info history. Deleted ${numDeleted} entries.`,
      );
    } else {
      this.logger.log(`No problems in pair liquidity info history found.`);
    }

    this.logger.log(`Finished validating pair liquidity info history.`);
  }
}
