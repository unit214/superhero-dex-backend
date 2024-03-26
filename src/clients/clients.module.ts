import { Module } from '@nestjs/common';
import { MdwHttpClientService } from './mdw-http-client.service';

@Module({
  providers: [MdwHttpClientService, MdwHttpClientService],
  exports: [MdwHttpClientService, MdwHttpClientService],
})
export class ClientsModule {}
