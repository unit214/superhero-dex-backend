import { Module } from '@nestjs/common';
import { PairsController } from './controller';
import { PairsService } from './service';

@Module({
  imports: [],
  controllers: [PairsController],
  providers: [PairsService],
})
export class PairsModule {}
