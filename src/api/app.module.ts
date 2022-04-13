import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PairsModule } from './pairs/module';
import { TokensModule } from './tokens/module';

@Module({
  imports: [PairsModule, TokensModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
