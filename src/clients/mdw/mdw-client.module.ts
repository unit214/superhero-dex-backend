import { Module } from '@nestjs/common';
import { MdwClientService } from './mdw-client.service';

@Module({
  providers: [MdwClientService],
  exports: [MdwClientService],
})
export class MdwClientModule {}
