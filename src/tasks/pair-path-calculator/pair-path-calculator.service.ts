import { Injectable, Logger } from '@nestjs/common';
import { groupBy, last, map } from 'lodash';

import { MdwHttpClientService } from '@/clients/mdw-http-client.service';
import {
  ContractAddress,
  contractAddrToAccountAddr,
  MicroBlockHash,
} from '@/clients/sdk-client.model';
import { SdkClientService } from '@/clients/sdk-client.service';
import { PairDbService } from '@/database/pair/pair-db.service';
import { PairLiquidityInfoHistoryDbService } from '@/database/pair-liquidity-info-history/pair-liquidity-info-history-db.service';
import { getPaths } from '@/lib/paths';
import { decimalToBigInt } from '@/lib/utils';

@Injectable()
export class PairPathCalculatorService {
  constructor(
    private pairLiquidityInfoHistoryDb: PairLiquidityInfoHistoryDbService,
    private pairDb: PairDbService,
    private mdwClient: MdwHttpClientService,
    private sdkClient: SdkClientService,
  ) {}

  readonly logger = new Logger(PairPathCalculatorService.name);

  readonly VALIDATION_WINDOW_BLOCKS = 20;

  async sync() {
    // get all history entries from the info history db service
    const entries =
      await this.pairLiquidityInfoHistoryDb.getEntriesWithoutAePrice();

    for (const entry of entries) {
      // for each entry get the timestamp and use the info history db service to fetch the graph at the time
      const graph =
        await this.pairLiquidityInfoHistoryDb.getLatestEntryForAllPairsAtTime(
          entry.microBlockTime,
        );
      const edges = graph.map((data) => ({
        data,
        t0: data.t0,
        t1: data.t1,
      }));
      const shortestPath = getPaths(entry.pair.t0, entry.pair.t1, edges).reduce(
        (a, b) => (a.length <= b.length ? a : b),
      );
    }

    // build the graph and find the shortest path by using the path calculator
    // if we find a path calculate the exchange rate to ae at the time and store it
    // if we don't find a path store a null value
  }

  async validate() {
    this.logger.log(`Started validating pair liquidity info history.`);

    // Get current height
    const currentHeight = await this.sdkClient.getHeight();

    // Get all liquidity entries greater or equal the current height minus VALIDATION_WINDOW_BLOCKS
    // and take the last entry of every microBlock to get the final reserve in that microBlock
    const liquidityEntriesWithinHeightSorted = map(
      groupBy(
        await this.pairLiquidityInfoHistoryDb.getWithinHeightSortedWithPair(
          currentHeight - this.VALIDATION_WINDOW_BLOCKS,
        ),
        'microBlockHash',
      ),
      (group) => last(group)!,
    );

    // If the reserves of a local microBlock do not match with the data from the middleware or the block does not exist,
    // delete all logs in this block and all newer entries
    let numDeleted = 0;
    for (const liquidityEntry of liquidityEntriesWithinHeightSorted) {
      let isError = false;
      let mdwReserve0: bigint | undefined;
      let mdwReserve1: bigint | undefined;

      try {
        // reserve0 is the balance of the pair contract's account of token0
        mdwReserve0 = BigInt(
          (
            await this.mdwClient.getAccountBalanceForContractAtMicroBlockHash(
              liquidityEntry.pair.token0.address as ContractAddress,
              contractAddrToAccountAddr(
                liquidityEntry.pair.address as ContractAddress,
              ),
              liquidityEntry.microBlockHash as MicroBlockHash,
            )
          ).amount,
        );

        // reserve1 is the balance of the pair contract's account of token1
        mdwReserve1 = BigInt(
          (
            await this.mdwClient.getAccountBalanceForContractAtMicroBlockHash(
              liquidityEntry.pair.token1.address as ContractAddress,
              contractAddrToAccountAddr(
                liquidityEntry.pair.address as ContractAddress,
              ),
              liquidityEntry.microBlockHash as MicroBlockHash,
            )
          ).amount,
        );
      } catch (e) {
        this.logger.error(e);
        isError = true;
      }
      if (
        isError ||
        decimalToBigInt(liquidityEntry.reserve0) !== mdwReserve0 ||
        decimalToBigInt(liquidityEntry.reserve1) !== mdwReserve1
      ) {
        numDeleted = (
          await this.pairLiquidityInfoHistoryDb.deleteFromMicroBlockTime(
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
