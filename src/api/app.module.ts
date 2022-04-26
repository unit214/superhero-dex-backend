import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PairsModule } from './pairs/module';

@Module({
  imports: [PairsModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
