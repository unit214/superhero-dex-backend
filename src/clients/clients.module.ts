import { Module } from '@nestjs/common';

import { MdwHttpClientService } from '@/clients/mdw-http-client.service';
import { MdwWsClientService } from '@/clients/mdw-ws-client.service';
import { SdkClientService } from '@/clients/sdk-client.service';

@Module({
  providers: [MdwHttpClientService, MdwWsClientService, SdkClientService],
  exports: [MdwHttpClientService, MdwWsClientService, SdkClientService],
})
export class ClientsModule {}
