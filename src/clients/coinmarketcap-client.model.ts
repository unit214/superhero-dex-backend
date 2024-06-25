export type AeUsdQuoteData = {
  1700: {
    id: number;
    name: string;
    symbol: string;
    is_active: 0 | 1;
    is_fiat: 0 | 1;
    quotes: [
      {
        timestamp: Date;
        quote: {
          USD: {
            percent_change_1h: number;
            percent_change_24h: number;
            percent_change_7d: number;
            percent_change_30d: number;
            price: number;
            volume_24h: number;
            market_cap: number;
            total_supply: number;
            circulating_supply: number;
            timestamp: Date;
          };
        };
      },
    ];
  };
};

export type CoinmarketcapResponse<T> = {
  status: CoinmarketcapStatus;
  data: T;
};

export type CoinmarketcapStatus = {
  timestamp: Date;
  error_code: number;
  error_message: string;
  elapsed: number;
  credit_count: number;
  notice: string;
};
