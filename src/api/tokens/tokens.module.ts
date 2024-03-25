import { Module } from '@nestjs/common';
import { TokensController } from './tokens.controller';
import { TokensService } from './tokens.service';

@Module({
  imports: [],
  controllers: [TokensController],
  providers: [TokensService],
})
export class TokensModule {}
