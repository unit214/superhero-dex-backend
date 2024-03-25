import { Module } from '@nestjs/common';
import { PairsModule } from './api/pairs/pairs.module';
import { TokensModule } from './api/tokens/tokens.module';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { TasksModule } from './tasks/tasks.module';
import { TokensService } from './api/tokens/tokens.service';
import { PairsService } from './api/pairs/pairs.service';
import { ClientsModule } from './clients/clients.module';
import { PairLiquidityInfoHistoryModule } from './api/pair-liquidity-info-history/pair-liquidity-info-history.module';

@Module({
  imports: [
    PairsModule,
    TokensModule,
    ClientsModule,
    DatabaseModule,
    TasksModule,
    PairLiquidityInfoHistoryModule,
  ],
  controllers: [AppController],
  providers: [TokensService, PairsService],
})
export class AppModule {}
