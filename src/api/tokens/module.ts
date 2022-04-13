import { Module } from '@nestjs/common';
import { TokensController } from './controller';
import { TokensService } from './service';

@Module({
  imports: [],
  controllers: [TokensController],
  providers: [TokensService],
})
export class TokensModule {}
