import { Module } from '@nestjs/common';
import { MdwClientService } from './mdw-client.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [MdwClientService],
  exports: [MdwClientService],
})
export class MdwClientModule {}
