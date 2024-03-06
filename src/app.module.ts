import { Module } from '@nestjs/common';
import { PairsModule } from './api/pairs/module';
import { TokensModule } from './api/tokens/module';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { TasksModule } from './tasks/tasks.module';
import { TokensService } from './api/tokens/service';
import { PairsService } from './api/pairs/service';
import { ClientsModule } from './clients/clients.module';

@Module({
  imports: [
    PairsModule,
    TokensModule,
    ClientsModule,
    DatabaseModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [TokensService, PairsService],
})
export class AppModule {}
