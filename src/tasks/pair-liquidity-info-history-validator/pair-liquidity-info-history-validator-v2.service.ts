import { Injectable, Logger } from '@nestjs/common';
import { groupBy, last, map } from 'lodash';

import { MdwHttpClientService } from '@/clients/mdw-http-client.service';
import {
  ContractAddress,
  contractAddrToAccountAddr,
} from '@/clients/sdk-client.model';
import { SdkClientService } from '@/clients/sdk-client.service';
import { PairDbService } from '@/database/pair/pair-db.service';
import { PairLiquidityInfoHistoryV2DbService } from '@/database/pair-liquidity-info-history/pair-liquidity-info-history-v2-db.service';
import { decimalToBigInt } from '@/lib/utils';

@Injectable()
export class PairLiquidityInfoHistoryValidatorV2Service {
  constructor(
    private pairLiquidityInfoHistoryDb: PairLiquidityInfoHistoryV2DbService,
    private pairDb: PairDbService,
    private mdwClient: MdwHttpClientService,
    private sdkClient: SdkClientService,
  ) {}

  readonly logger = new Logger(PairLiquidityInfoHistoryValidatorV2Service.name);

  readonly VALIDATION_WINDOW_BLOCKS = 20;

  async validate() {
    this.logger.log(`Started validating pair liquidity info history.`);

    // Get current height
    const currentHeight = await this.sdkClient.getHeight();

    // Get all liquidity entries greater or equal the current height minus VALIDATION_WINDOW_BLOCKS
    // and take the last entry of every microBlock to get the final reserve in that microBlock
    const liquidityEntriesWithinHeightSorted = map(
      groupBy(
        await this.pairLiquidityInfoHistoryDb.getWithinHeightSorted(
          currentHeight - this.VALIDATION_WINDOW_BLOCKS,
        ),
        'microBlockHash',
      ),
      (group) => last(group)!,
    );

    // If the reserves of a local microBlock do not match with the data from the middleware or the block does not exist,
    // delete this block and all newer entries
    let numDeleted = 0;
    for (const liquidityEntry of liquidityEntriesWithinHeightSorted) {
      let isError = false;
      let mdwReserve0: bigint | undefined;
      let mdwReserve1: bigint | undefined;

      const pairWithTokens = (await this.pairDb.get(liquidityEntry?.pairId))!;

      try {
        // reserve0 is the balance of the pair contract's account of token0
        mdwReserve0 = BigInt(
          (
            await this.mdwClient.getAccountBalanceForContractAtMicroBlockHash(
              pairWithTokens.token0.address as ContractAddress,
              contractAddrToAccountAddr(
                pairWithTokens.address as ContractAddress,
              ),
              liquidityEntry.microBlockHash,
            )
          ).amount,
        );

        // reserve1 is the balance of the pair contract's account of token1
        mdwReserve1 = BigInt(
          (
            await this.mdwClient.getAccountBalanceForContractAtMicroBlockHash(
              pairWithTokens.token1.address as ContractAddress,
              contractAddrToAccountAddr(
                pairWithTokens.address as ContractAddress,
              ),
              liquidityEntry.microBlockHash,
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
