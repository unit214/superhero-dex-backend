import { Injectable } from '@nestjs/common';
import { RateLimiter } from 'limiter';

import {
  AeUsdQuoteData,
  CoinmarketcapResponse,
} from '@/clients/coinmarketcap-client.model';
import { HttpService } from '@/clients/http.service';

@Injectable()
export class CoinmarketcapClientService {
  constructor(private httpService: HttpService) {}

  private readonly AUTH_HEADER = {
    'X-CMC_PRO_API_KEY': process.env.COIN_MARKET_CAP_API_KEY || '',
  };
  private readonly AE_CURRENCY_ID = 1700;
  private readonly COUNT = 1;
  private readonly INTERVAL = '24h';
  private readonly CALLS_LIMIT = 28;
  private readonly CALL_INTERVAL = 'minute';
  private rateLimiter = new RateLimiter({
    tokensPerInterval: this.CALLS_LIMIT,
    interval: this.CALL_INTERVAL,
  });

  async getHistoricalPriceDataThrottled(microBlockTime: number) {
    await this.rateLimiter.removeTokens(1);
    const timeEnd = this.roundMicroBlockTimeDownTo5MinInterval(microBlockTime);
    const url = `https://pro-api.coinmarketcap.com/v3/cryptocurrency/quotes/historical?id=${this.AE_CURRENCY_ID}&interval=${this.INTERVAL}&count=${this.COUNT}&time_end=${timeEnd}`;
    return this.get<CoinmarketcapResponse<AeUsdQuoteData>>(url);
  }

  private async get<T>(url: string): Promise<T> {
    return this.httpService.get<T>(url, new Headers(this.AUTH_HEADER));
  }

  private roundMicroBlockTimeDownTo5MinInterval(
    microBlockTime: number,
  ): string {
    const date = new Date(microBlockTime);
    date.setMinutes(Math.floor(date.getMinutes() / 5) * 5);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date.toISOString();
  }
}
