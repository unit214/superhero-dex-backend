import { Injectable } from '@nestjs/common';
import NETWORKS from '../lib/networks';
import { nonNullable } from '../lib/utils';
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
  constructor() {}

  private LIMIT = 100;
  private DIRECTION = 'forward';
  private INT_AS_STRING = true;
  private params = `direction=${this.DIRECTION}&limit=${this.LIMIT}&int-as-string=${this.INT_AS_STRING}`;

  getContract(contractId: string): Promise<Contract> {
    return this.get<Contract>(`/v2/contracts/${contractId}?${this.params}`);
  }
  getContractLogs(contractId: string): Promise<ContractLog[]> {
    return this.getAllPages<ContractLog>(
      `/v2/contracts/logs?contract_id=${contractId}&${this.params}`,
    );
  }

  getAccountBalance(
    contractId: string,
    accountId: string,
    hash: string,
  ): Promise<AccountBalance> {
    return this.get<AccountBalance>(
      `/v2/aex9/${contractId}/balances/${accountId}?hash=${hash}&${this.params}`,
    );
  }

  getMicroBlock(microBlockHash: string): Promise<MdwMicroBlock> {
    return this.get<MdwMicroBlock>(
      `/v2/micro-blocks/${microBlockHash}?${this.params}`,
    );
  }

  async getBalancesV1(contractId: string, hash: string): Promise<BalancesV1> {
    return await this.get<BalancesV1>(
      `/aex9/balances/hash/${hash}/${contractId}?${this.params}`,
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
