import { MdwClientService } from '../clients/mdw-client.service';
import { PairLiquidityInfoHistoryService } from '../database/pair-liquidity-info-history.service';
import { Injectable, Logger } from '@nestjs/common';
import { uniq } from 'lodash';
import { getClient } from '../lib/contracts';
import { MicroBlockHash } from '../lib/utils';

@Injectable()
export class PairLiquidityInfoHistoryValidatorService {
  constructor(
    private mdwClientService: MdwClientService,
    private pairLiquidityInfoHistoryService: PairLiquidityInfoHistoryService,
  ) {}

  readonly logger = new Logger(PairLiquidityInfoHistoryValidatorService.name);

  async validate() {
    this.logger.log(`Started validating pair liquidity info history.`);

    // Get current height
    const currentHeight = await getClient().then(([client]) =>
      client.getHeight(),
    );

    // Get all liquidity entries greater or equal the current height minus 20
    const liquidityEntriesWithinHeightSorted =
      await this.pairLiquidityInfoHistoryService.getWithinHeightSorted(
        currentHeight - 20,
      );

    // Get unique keyBlocks from entries
    const uniqueHeights = uniq(
      liquidityEntriesWithinHeightSorted.map((e) => e.height),
    );

    // Fetch microBlocks for these unique keyBlocks from mdw
    const microBlockHashsOnMdw = (
      await Promise.all(
        uniqueHeights.map((h) =>
          this.mdwClientService.getKeyBlockMicroBlocks(h),
        ),
      )
    )
      .flat()
      .map((mb) => mb.hash);

    // If a local microBlock is not contained in the mdw, delete this block and all newer entries
    let numDeleted = 0;
    for (const liquidityEntry of liquidityEntriesWithinHeightSorted) {
      if (
        !microBlockHashsOnMdw.includes(
          liquidityEntry.microBlockHash as MicroBlockHash,
        )
      ) {
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
      this.logger.log('No problems in pair liquidity info history found.');
    }

    this.logger.log('Finished validating pair liquidity info history.');
  }
}
