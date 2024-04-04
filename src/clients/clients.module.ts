import { Module } from '@nestjs/common';
import { MdwHttpClientService } from './mdw-http-client.service';
import { SdkClientService } from './sdk-client.service';
import { MdwWsClientService } from './mdw-ws-client.service';

@Module({
  providers: [MdwHttpClientService, MdwWsClientService, SdkClientService],
  exports: [MdwHttpClientService, MdwWsClientService, SdkClientService],
})
export class ClientsModule {}
