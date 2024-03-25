import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { TokensService } from './api/tokens/tokens.service';
import { PairsService } from './api/pairs/pairs.service';
import { ClientsModule } from './clients/clients.module';
import { ApiModule } from './api/api.module';

@Module({
  imports: [ApiModule, ClientsModule, DatabaseModule],
  controllers: [AppController],
  providers: [TokensService, PairsService],
})
export class AppModule {}
