import { Injectable, Logger } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import BigNumber from 'bignumber.js';

import { PairLiquidityInfoHistoryDbService } from '@/database/pair-liquidity-info-history/pair-liquidity-info-history-db.service';
import { TokenDbService } from '@/database/token/token-db.service';
import { getPaths } from '@/lib/paths';

@Injectable()
export class PairPathCalculatorService {
  constructor(
    private pairLiquidityInfoHistoryDb: PairLiquidityInfoHistoryDbService,
    private tokenDb: TokenDbService,
  ) {}

  readonly logger = new Logger(PairPathCalculatorService.name);

  async sync() {
    // get all history entries from the info history db service
    const entries =
      await this.pairLiquidityInfoHistoryDb.getEntriesWithoutAePrice();

    this.logger.log(`Found ${entries.length} entries without AE price`);

    const waeToken = await this.tokenDb.getByAddress(process.env.WAE_ADDRESS!);
    if (!waeToken) {
      throw new Error('WAE token not found in db');
    }

    const poolFee = new BigNumber(0.997);

    for (const entry of entries) {
      this.logger.debug(`Processing entry ${entry.id}`);
      // for each entry get the timestamp and use the info history db service to fetch the graph at the time
      const graph =
        await this.pairLiquidityInfoHistoryDb.getLatestEntryForAllPairsAtTime(
          entry.microBlockTime,
        );
      // build the graph and find the shortest path by using the path calculator
      const edges = graph.map((data) => ({
        data,
        t0: data.t0,
        t1: data.t1,
      }));

      const aePrices = [entry.pair.t0, entry.pair.t1].map((token) => {
        // validate if the token is the wae token, then we can skip the path calculation
        if (token === waeToken.id) {
          return new BigNumber(1);
        }

        // get all paths
        const paths = getPaths(token, waeToken.id, edges);
        this.logger.debug(`Found ${paths.length} paths from ${token} to WAE`);
        if (paths.length > 0) {
          console.log(paths[0]);
        }

        // if there are no paths we can't calculate the exchange rate
        // TODO determine how we flag this so the calculation will not be repeated
        if (paths.length === 0) {
          return null;
        }

        const shortestPath = paths.reduce((a, b) =>
          a.length <= b.length ? a : b,
        );
        this.logger.debug(`Shortest path has ${shortestPath.length} edges`);

        // if we find a path calculate the exchange rate to ae at the time and store it
        if (shortestPath.length > 0) {
          // now we have the nodes, but we need to know the direction (reserve0 -> reserve1 or reserve1 -> reserve0)
          let previousToken = token;
          return shortestPath.reduce((acc, edge) => {
            // first edge we compare against our original token
            // after that we compare to the previous token
            // if the previous token is t0
            // example: t0 = 10, t1 = 3
            // how many t1 can we get for 1 t0
            // 3 / 10 = 0.3 --> t1 / t0 = exchange rate

            // next pair, t0 is now 3 and t1 is 10
            // our token is t0 again, t1 is WAE
            // how many t1 can we get for 1 t0
            // 10 / 3 = 3.33 --> t1 / t0 = exchange rate

            // now we combine the two exchange rates
            // 3.33 * 0.3 = 1

            // but we also have to pay a fee, so we have to subtract the fee from each step
            // 3.33 * 0.3 * 0.997^2 = 0.9901

            if (previousToken === edge.t0) {
              previousToken = edge.t1;
              return acc
                .multipliedBy(poolFee)
                .multipliedBy(
                  new BigNumber(edge.reserve1.toString()).dividedBy(
                    edge.reserve0.toString(),
                  ),
                );
            }
            if (previousToken === edge.t1) {
              previousToken = edge.t0;
              console.log(edge.reserve0.toString());
              console.log(edge.reserve1.toString());
              console.log(poolFee.toString());
              return acc
                .multipliedBy(poolFee)
                .multipliedBy(
                  new BigNumber(edge.reserve0.toString()).dividedBy(
                    edge.reserve1.toString(),
                  ),
                );
            }
            throw new Error(
              'Could not match previous token with edge t0 or t1',
            );
          }, new BigNumber(1));
        }
        return null;
      });

      // check if either one is null and the otherone is not
      if (
        (aePrices[0] === null && aePrices[1] !== null) ||
        (aePrices[0] !== null && aePrices[1] === null)
      ) {
        throw new Error(
          `One of the ae prices is null and the other one is not, this can not be. Check entry ${entry.id}.`,
        );
      }

      // save the ae prices to the db
      await this.pairLiquidityInfoHistoryDb.update(entry.id, {
        token0AePrice:
          aePrices[0] !== null
            ? new Decimal(aePrices[0].toString())
            : new Decimal(-1),
        token1AePrice:
          aePrices[1] !== null
            ? new Decimal(aePrices[1].toString())
            : new Decimal(-1),
      });
    }
  }
}
