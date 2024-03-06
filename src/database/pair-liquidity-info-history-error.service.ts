import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PairLiquidityInfoHistoryError } from '@prisma/client';

@Injectable()
export class PairLiquidityInfoHistoryErrorService {
  constructor(private prisma: PrismaService) {}
  insert(data: Omit<PairLiquidityInfoHistoryError, 'id' | 'createdAt'>) {
    return this.prisma.pairLiquidityInfoHistoryError.create({
      data: {
        pairId: data.pairId,
        microBlockHash: data.microBlockHash,
        error: data.error,
      },
    });
  }
}
