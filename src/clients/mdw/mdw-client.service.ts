import { Injectable } from '@nestjs/common';
import NETWORKS from '../../lib/networks';
import { nonNullable } from '../../lib/utils';
import {
  AccountBalance,
  BalancesV1,
  ContractLog,
  MdwPaginatedResponse,
} from './mdw-client.model';
import { isInteger, parse } from 'lossless-json';

@Injectable()
export class MdwClientService {
  constructor() {}

  private LIMIT = 100;
  private DIRECTION = 'forward';

  getContractLogs(contractId: string): Promise<ContractLog[]> {
    return this.getAllPages<ContractLog>(
      `/v2/contracts/logs?contract_id=${contractId}&direction=${this.DIRECTION}&limit=${this.LIMIT}`,
    );
  }

  getAccountBalance(
    contractId: string,
    accountId: string,
    hash: string,
  ): Promise<AccountBalance> {
    return this.get<AccountBalance>(
      `/v2/aex9/${contractId}/balances/${accountId}?hash=${hash}&direction=${this.DIRECTION}&limit=${this.LIMIT}`,
    );
  }

  async getBalancesV1(contractId: string, hash: string): Promise<BalancesV1> {
    return await this.get<BalancesV1>(
      `/aex9/balances/hash/${hash}/${contractId}`,
    );
  }

  private customNumberParser(value: string): number | bigint {
    return isInteger(value) ? BigInt(value) : parseFloat(value);
  }

  private async get<T>(url: string): Promise<T> {
    const fullUrl = `${NETWORKS[nonNullable(process.env.NETWORK_NAME)].middlewareHttpUrl}${url}`;
    return fetch(fullUrl)
      .then(async (res) => {
        if (res.ok) {
          return res.text();
        } else {
          throw new Error(
            `GET ${url} failed with status ${res.status}. Response body: ${await res.text()}`,
          );
        }
      })
      .then((text) => parse(text, null, this.customNumberParser) as T);
  }

  private async getAllPages<T>(next: string): Promise<T[]> {
    const url = `${NETWORKS[nonNullable(process.env.NETWORK_NAME)].middlewareHttpUrl}${next}`;
    const result: MdwPaginatedResponse<T> = await fetch(url)
      .then(async (res) => {
        if (res.ok) {
          return res.text();
        } else {
          throw new Error(
            `GET ${url} failed with status ${res.status}. Response body: ${await res.text()}`,
          );
        }
      })
      .then(
        (text) =>
          parse(text, null, this.customNumberParser) as MdwPaginatedResponse<T>,
      );

    if (result.next) {
      return result.data.concat(await this.getAllPages(result.next));
    }

    return result.data;
  }
}
