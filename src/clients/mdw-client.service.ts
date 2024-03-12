import { Injectable } from '@nestjs/common';
import NETWORKS from '../lib/networks';
import { AccountAddress, ContractAddress, nonNullable } from '../lib/utils';
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
  private LIMIT = 100;
  private DIRECTION = 'forward';
  private INT_AS_STRING = true;
  private params = `direction=${this.DIRECTION}&limit=${this.LIMIT}&int-as-string=${this.INT_AS_STRING}`;

  getContract(contractId: string): Promise<Contract> {
    return this.get<Contract>(`/v2/contracts/${contractId}?${this.params}`);
  }
  getContractLogs(contractAddress: ContractAddress): Promise<ContractLog[]> {
    return this.getAllPages<ContractLog>(
      `/v2/contracts/logs?contract_id=${contractAddress}&${this.params}`,
    );
  }

  getAccountBalanceForContractAtHash(
    contractAddress: ContractAddress,
    accountAddress: AccountAddress,
    hash: string,
  ): Promise<AccountBalance> {
    return this.get<AccountBalance>(
      `/v2/aex9/${contractAddress}/balances/${accountAddress}?hash=${hash}&${this.params}`,
    );
  }

  getMicroBlock(microBlockHash: string): Promise<MdwMicroBlock> {
    return this.get<MdwMicroBlock>(
      `/v2/micro-blocks/${microBlockHash}?${this.params}`,
    );
  }

  getContractBalancesAtHashV1(
    contractAddress: ContractAddress,
    hash: string,
  ): Promise<BalancesV1> {
    return this.get<BalancesV1>(
      `/aex9/balances/hash/${hash}/${contractAddress}?${this.params}`,
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

  private async getAllPages<T>(next: string): Promise<T[]> {
    const url = `${NETWORKS[nonNullable(process.env.NETWORK_NAME)].middlewareHttpUrl}${next}`;
    const result: MdwPaginatedResponse<T> = await fetch(url).then(
      async (res) => {
        if (res.ok) {
          return (await res.json()) as Promise<MdwPaginatedResponse<T>>;
        } else {
          throw new Error(
            `GET ${url} failed with status ${res.status}. Response body: ${await res.text()}`,
          );
        }
      },
    );

    if (result.next) {
      return result.data.concat(await this.getAllPages(result.next));
    }

    return result.data;
  }
}
