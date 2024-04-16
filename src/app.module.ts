import { Module } from '@nestjs/common';

import { ApiModule } from '@/api/api.module';
import { PairsService } from '@/api/pairs/pairs.service';
import { TokensService } from '@/api/tokens/tokens.service';
import { AppController } from '@/app.controller';
import { ClientsModule } from '@/clients/clients.module';
import { MdwWsClientService } from '@/clients/mdw-ws-client.service';
import { DatabaseModule } from '@/database/database.module';
import { PairSyncService } from '@/tasks/pair-sync/pair-sync.service';
import { TasksModule } from '@/tasks/tasks.module';

@Module({
  imports: [ApiModule, ClientsModule, DatabaseModule, TasksModule],
  controllers: [AppController],
  providers: [MdwWsClientService, PairsService, TokensService, PairSyncService],
})
export class AppModule {}
