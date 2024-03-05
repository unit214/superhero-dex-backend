import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
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
  constructor(private readonly httpService: HttpService) {
    // TODO remove axios
    // this.httpService.axiosRef.interceptors.response.use((response) => {
    //   response.data = parse(response.data);
    //   return response;
    // });
  }

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

  private customNumberParser(value) {
    return isInteger(value) ? BigInt(value) : parseFloat(value);
  }

  private async get<T>(url: string): Promise<T> {
    return fetch(
      `${NETWORKS[nonNullable(process.env.NETWORK_NAME)].middlewareHttpUrl}${url}`,
    )
      .then(async (response) => {
        if (response.ok) {
          return response.text();
        } else {
          return Promise.reject(await response.text());
        }
      })
      .then((text) => parse(text, null, this.customNumberParser) as T);
  }

  // TODO add error handling
  private async getAllPages<T>(next: string): Promise<T[]> {
    const url = `${NETWORKS[nonNullable(process.env.NETWORK_NAME)].middlewareHttpUrl}${next}`;
    const result: MdwPaginatedResponse = await fetch(url).then(
      (res) => res.json() as Promise<{ next: string; data: any }>,
    );

    if (result.next) {
      return result.data.concat(await this.getAllPages(result.next));
    }

    return result.data;
  }
}
