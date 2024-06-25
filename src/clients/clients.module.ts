import { Module } from '@nestjs/common';

import { CoinmarketcapClientService } from '@/clients/coinmarketcap-client.service';
import { HttpService } from '@/clients/http.service';
import { MdwHttpClientService } from '@/clients/mdw-http-client.service';
import { MdwWsClientService } from '@/clients/mdw-ws-client.service';
import { SdkClientService } from '@/clients/sdk-client.service';

@Module({
  providers: [
    CoinmarketcapClientService,
    HttpService,
    MdwHttpClientService,
    MdwWsClientService,
    SdkClientService,
  ],
  exports: [
    CoinmarketcapClientService,
    HttpService,
    MdwHttpClientService,
    MdwWsClientService,
    SdkClientService,
  ],
})
export class ClientsModule {}
