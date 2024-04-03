import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { TokensService } from './api/tokens/tokens.service';
import { PairsService } from './api/pairs/pairs.service';
import { ClientsModule } from './clients/clients.module';
import { ApiModule } from './api/api.module';
import { PairSyncService } from './tasks/pair-sync/pair-sync.service';
import { MdwWsClientService } from './clients/mdw-ws-client.service';

@Module({
  imports: [ApiModule, ClientsModule, DatabaseModule],
  controllers: [AppController],
  providers: [MdwWsClientService, PairsService, TokensService, PairSyncService],
})
export class AppModule {}
