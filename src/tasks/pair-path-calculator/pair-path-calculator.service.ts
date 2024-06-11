import { Injectable, Logger } from '@nestjs/common';

import { PairLiquidityInfoHistoryDbService } from '@/database/pair-liquidity-info-history/pair-liquidity-info-history-db.service';
import { TokenDbService } from '@/database/token/token-db.service';
import { getPaths } from '@/lib/paths';
import { decimalToBigInt, numberToDecimal } from '@/lib/utils';

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

    const precisionDenominator = 10n ** 18n;
    const poolFee = 997n * (precisionDenominator / 1000n);

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
          return 1n;
        }

        // get all paths
        const paths = getPaths(token, waeToken.id, edges);
        this.logger.debug(`Found ${paths.length} paths from ${token} to WAE`);

        // if there are no paths we can't calculate the exchange rate
        // TODO determine how we flag this so the calculation will not be repeated
        if (paths.length === 0) {
          return null;
        }

        // TODO check what the result is when there is no path from getPaths
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
              return (
                acc *
                (decimalToBigInt(edge.reserve1) /
                  decimalToBigInt(edge.reserve0)) *
                poolFee
              );
            }
            if (previousToken === edge.t1) {
              previousToken = edge.t0;
              return (
                acc *
                (decimalToBigInt(edge.reserve0) /
                  decimalToBigInt(edge.reserve1)) *
                poolFee
              );
            }
            throw new Error(
              'Could not match previous token with edge t0 or t1',
            );
          }, 1n * precisionDenominator);
        }
        return null;
      });

      // save the ae prices to the db
      await this.pairLiquidityInfoHistoryDb.update(entry.id, {
        token0AePrice:
          aePrices[0] !== null
            ? numberToDecimal(
                Number(aePrices[0]) / Number(precisionDenominator),
              )
            : null,
        token1AePrice:
          aePrices[1] !== null
            ? numberToDecimal(
                Number(aePrices[1]) / Number(precisionDenominator),
              )
            : null,
      });
    }
  }
}
