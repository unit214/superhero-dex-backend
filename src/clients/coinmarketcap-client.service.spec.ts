import { Test, TestingModule } from '@nestjs/testing';

import { CoinmarketcapClientService } from '@/clients/coinmarketcap-client.service';
import { HttpService } from '@/clients/http.service';
import resetAllMocks = jest.resetAllMocks;
import { RateLimiter } from 'limiter';

import { coinmarketcapResponseAeUsdQuoteData } from '@/test/mock-data/pair-liquidity-info-history-mock-data';

const mockHttpService = {
  get: jest.fn(),
};

describe('CoinmarketcapClientService', () => {
  let service: CoinmarketcapClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoinmarketcapClientService,
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();
    service = module.get<CoinmarketcapClientService>(
      CoinmarketcapClientService,
    );
    resetAllMocks();
  });

  describe('getHistoricalPriceDataThrottled', () => {
    it('should correctly calculate and fetch the latest 5 min interval for a given timestamp', async () => {
      // Mock functions
      mockHttpService.get.mockResolvedValue(
        coinmarketcapResponseAeUsdQuoteData,
      );
      // Call function
      await service.getHistoricalPriceDataThrottled(1704203935123);

      // Assertions
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://pro-api.coinmarketcap.com/v3/cryptocurrency/quotes/historical?id=1700&interval=24h&count=1&time_end=2024-01-02T13:55:00.000Z',
        expect.anything(),
      );

      await service.getHistoricalPriceDataThrottled(1704203614123);

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://pro-api.coinmarketcap.com/v3/cryptocurrency/quotes/historical?id=1700&interval=24h&count=1&time_end=2024-01-02T13:50:00.000Z',
        expect.anything(),
      );
    });

    it('should be throtteled to defined rate limit', async () => {
      service['rateLimiter'] = new RateLimiter({
        tokensPerInterval: 2,
        interval: 'minute',
      });

      // Mock
      mockHttpService.get.mockResolvedValue({});

      // Call function
      service.getHistoricalPriceDataThrottled(1704203935123);
      service.getHistoricalPriceDataThrottled(1704203935123);
      service.getHistoricalPriceDataThrottled(1704203935123);

      await new Promise((res) => setTimeout(res, 200));

      // Assertion
      expect(mockHttpService.get).toHaveBeenCalledTimes(2);
    });
  });
});
