import { Module } from '@nestjs/common';
import { PairsModule } from './pairs/module';
import { TokensModule } from './tokens/module';

@Module({
  imports: [PairsModule, TokensModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
