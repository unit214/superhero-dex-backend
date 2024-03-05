import { Module } from '@nestjs/common';
import { PairsModule } from './api/pairs/module';
import { TokensModule } from './api/tokens/module';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { TasksModule } from './tasks/tasks.module';
import { TokensService } from './api/tokens/service';
import { PairsService } from './api/pairs/service';
import { MdwClientService } from './clients/mdw/mdw-client.service';
import { MdwClientModule } from './clients/mdw/mdw-client.module';
import { PrismaService } from './database/prisma.service';
import { PairService } from './database/pair.service';
import { PairLiquidityInfoHistoryService } from './database/pair-liquidity-info-history.service';
import { HttpModule } from '@nestjs/axios';
import { PairLiquidityInfoHistoryImporterService } from './tasks/pair-liquidity-info-history-importer.service';

@Module({
  imports: [
    PairsModule,
    TokensModule,
    MdwClientModule,
    DatabaseModule,
    TasksModule,
    HttpModule,
  ],
  controllers: [AppController],
  providers: [
    // TODO check if all needed here
    PairsService,
    TokensService,
    MdwClientService,
    PrismaService,
    PairService,
    PairLiquidityInfoHistoryService,
    TokensService,
    PairLiquidityInfoHistoryImporterService,
  ],
})
export class AppModule {}
