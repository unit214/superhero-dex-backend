import { Module } from '@nestjs/common';

import { ApiModule } from '@/api/api.module';
import { PairsService } from '@/api/pairs/pairs.service';
import { TokensService } from '@/api/tokens/tokens.service';
import { AppController } from '@/app.controller';
import { ClientsModule } from '@/clients/clients.module';
import { MdwWsClientService } from '@/clients/mdw-ws-client.service';
import { DatabaseModule } from '@/database/database.module';
import { PairLiquidityInfoHistoryImporterService } from '@/tasks/pair-liquidity-info-history-importer/pair-liquidity-info-history-importer.service';
import { PairPathCalculatorService } from '@/tasks/pair-path-calculator/pair-path-calculator.service';
import { PairSyncService } from '@/tasks/pair-sync/pair-sync.service';
import { TasksModule } from '@/tasks/tasks.module';

@Module({
  imports: [ApiModule, ClientsModule, DatabaseModule, TasksModule],
  controllers: [AppController],
  providers: [
    MdwWsClientService,
    PairsService,
    TokensService,
    PairSyncService,
    // FIXME probably not the right place but did not get it to work any otherway
    PairLiquidityInfoHistoryImporterService,
    PairPathCalculatorService,
  ],
})
export class AppModule {}
