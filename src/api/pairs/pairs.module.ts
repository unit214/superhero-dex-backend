import { Module } from '@nestjs/common';
import { PairsController } from './pairs.controller';
import { PairsService } from './pairs.service';

@Module({
  imports: [],
  controllers: [PairsController],
  providers: [PairsService],
})
export class PairsModule {}
