import { Injectable } from '@nestjs/common';
import NETWORKS from '../lib/networks';
import {
  AccountAddress,
  ContractAddress,
  MicroBlockHash,
  nonNullable,
} from '../lib/utils';
import {
  AccountBalance,
  BalancesV1,
  Contract,
  ContractLog,
  MdwMicroBlock,
  MdwPaginatedResponse,
} from './mdw-client.model';

@Injectable()
export class MdwClientService {
  private readonly LIMIT = 100;
  private readonly DIRECTION = 'forward';
  private readonly INT_AS_STRING = true;
  private readonly defaultParams = `direction=${this.DIRECTION}&limit=${this.LIMIT}&int-as-string=${this.INT_AS_STRING}`;

  getContract(contractAddress: ContractAddress): Promise<Contract> {
    return this.get<Contract>(
      `/v2/contracts/${contractAddress}?${this.defaultParams}`,
    );
  }

  getAllContractLogs(contractAddress: ContractAddress): Promise<ContractLog[]> {
    return this.getAllPages<ContractLog>(
      `/v2/contracts/logs?contract_id=${contractAddress}&${this.defaultParams}`,
    );
  }

  getContractLogsUntilCondition(
    condition: (contractLog: ContractLog) => boolean,
    contractAddress: ContractAddress,
  ): Promise<ContractLog[]> {
    return this.getPagesUntilCondition<ContractLog>(
      condition,
      `/v2/contracts/logs?contract_id=${contractAddress}&direction=backward&limit=${this.LIMIT}&int-as-string=${this.INT_AS_STRING}`,
    );
  }

  getAccountBalanceForContractAtMicroBlockHash(
    contractAddress: ContractAddress,
    accountAddress: AccountAddress,
    microBlockHash: string,
  ): Promise<AccountBalance> {
    return this.get<AccountBalance>(
      `/v2/aex9/${contractAddress}/balances/${accountAddress}?hash=${microBlockHash}&${this.defaultParams}`,
    );
  }

  getMicroBlock(microBlockHash: MicroBlockHash): Promise<MdwMicroBlock> {
    return this.get<MdwMicroBlock>(
      `/v2/micro-blocks/${microBlockHash}?${this.defaultParams}`,
    );
  }

  getContractBalancesAtMicroBlockHashV1(
    contractAddress: ContractAddress,
    microBlockHash: MicroBlockHash,
  ): Promise<BalancesV1> {
    return this.get<BalancesV1>(
      `/aex9/balances/hash/${microBlockHash}/${contractAddress}?${this.defaultParams}`,
    );
  }

  async getKeyBlockMicroBlocks(hashOrKbi: string): Promise<MdwMicroBlock[]> {
    return this.getAllPages<MdwMicroBlock>(
      `/v2/key-blocks/${hashOrKbi}/micro-blocks?${this.params}`,
    );
  }

  private async get<T>(url: string): Promise<T> {
    const fullUrl = `${NETWORKS[nonNullable(process.env.NETWORK_NAME)].middlewareHttpUrl}${url}`;
    return fetch(fullUrl).then(async (res) => {
      if (res.ok) {
        return (await res.json()) as Promise<T>;
      } else {
        throw new Error(
          `GET ${url} failed with status ${res.status}. Response body: ${await res.text()}`,
        );
      }
    });
  }

  // Fetches pages from middleware until the page contains at least one entry that meets the condition
  private async getPagesUntilCondition<T>(
    condition: (data: T) => boolean,
    next: string,
  ): Promise<T[]> {
    const result = await this.get<MdwPaginatedResponse<T>>(next);

    if (result.data.filter(condition).length === 0 && result.next) {
      return result.data.concat(
        await this.getPagesUntilCondition<T>(condition, result.next),
      );
    }
    return result.data;
  }

  private async getAllPages<T>(next: string): Promise<T[]> {
    const result = await this.get<MdwPaginatedResponse<T>>(next);

    if (result.next) {
      return result.data.concat(await this.getAllPages(result.next));
    }

    return result.data;
  }
}
