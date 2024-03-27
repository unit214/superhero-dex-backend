import { Module } from '@nestjs/common';
import { MdwHttpClientService } from './mdw-http-client.service';
import { SdkClientService } from './sdk-client.service';

@Module({
  providers: [MdwHttpClientService, MdwHttpClientService, SdkClientService],
  exports: [MdwHttpClientService, MdwHttpClientService, SdkClientService],
})
export class ClientsModule {}
