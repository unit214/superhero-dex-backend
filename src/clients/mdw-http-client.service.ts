import { Injectable } from '@nestjs/common';

import { HttpService } from '@/clients/http.service';
import {
  AccountBalance,
  Contract,
  ContractBalance,
  ContractLog,
  MdwMicroBlock,
  MdwPaginatedResponse,
  TransactionWithContext,
} from '@/clients/mdw-http-client.model';
import {
  AccountAddress,
  ContractAddress,
  KeyBlockHash,
  MicroBlockHash,
  TxHash,
} from '@/clients/sdk-client.model';
import NETWORKS from '@/lib/network-config';
import { nonNullable } from '@/lib/utils';

@Injectable()
export class MdwHttpClientService {
  constructor(private httpService: HttpService) {
    // fill the transactionSenderMapping with the latest transactions from the router
    void this.fillTransactionSenderMapping();
  }

  private readonly LIMIT = 100;
  private readonly DIRECTION = 'forward';
  private readonly INT_AS_STRING = true;
  private readonly defaultParams = `direction=${this.DIRECTION}&limit=${this.LIMIT}&int-as-string=${this.INT_AS_STRING}`;
  private readonly transactionSenderMapping = new Map<string, string>();

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

  getContractBalancesAtMicroBlockHash(
    contractAddress: ContractAddress,
    microBlockHash: MicroBlockHash,
  ): Promise<ContractBalance[]> {
    return this.getAllPages<ContractBalance>(
      `/v2/aex9/${contractAddress}/balances/?block_hash=${microBlockHash}&${this.defaultParams}`,
    );
  }

  getAccountBalanceForContractAtMicroBlockHash(
    contractAddress: ContractAddress,
    accountAddress: AccountAddress,
    microBlockHash: MicroBlockHash,
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

  async getKeyBlockMicroBlocks(
    hashOrKbi: KeyBlockHash | number,
  ): Promise<MdwMicroBlock[]> {
    return this.getAllPages<MdwMicroBlock>(
      `/v2/key-blocks/${hashOrKbi}/micro-blocks?${this.defaultParams}`,
    );
  }

  async getSenderAccountForTransaction(txHash: TxHash): Promise<string> {
    if (!this.transactionSenderMapping.has(txHash)) {
      const tx = await this.getTransaction(txHash);
      this.transactionSenderMapping.set(txHash, tx.tx.caller_id);
    }
    return this.transactionSenderMapping.get(txHash)!;
  }

  async getTransaction(txHash: string): Promise<TransactionWithContext> {
    return this.get(`/v3/transactions/${txHash}`);
  }

  async fillTransactionSenderMapping() {
    const transactions = await this.getAllPages<TransactionWithContext>(
      `/v3/transactions?contract_id=${process.env.ROUTER_ADDRESS}&${this.defaultParams}`,
    );
    transactions.forEach((tx) => {
      this.transactionSenderMapping.set(tx.hash, tx.tx.caller_id);
    });
  }

  private async get<T>(url: string): Promise<T> {
    const fullUrl = `${NETWORKS[nonNullable(process.env.NETWORK_NAME)].middlewareHttpUrl}${url}`;
    return this.httpService.get<T>(fullUrl);
  }

  // Fetches pages from middleware until the page contains at least one entry that meets the condition
  private async getPagesUntilCondition<T>(
    condition: (data: T) => boolean,
    next: string,
  ): Promise<T[]> {
    const result = await this.get<MdwPaginatedResponse<T>>(
      next + `&int-as-string=${this.INT_AS_STRING}`,
    );

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
