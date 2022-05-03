import { Module } from '@nestjs/common';
import { PairsModule } from './pairs/module';
import { TokensModule } from './tokens/module';
import { TokensService } from './tokens/service';
import { PairsService } from './pairs/service';
import { AppController } from './app.controller';

@Module({
  imports: [PairsModule, TokensModule],
  controllers: [AppController],
  providers: [TokensService, PairsService],
})
export class AppModule {}
