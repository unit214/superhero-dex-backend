import { Injectable } from '@nestjs/common';
import { Pair, Token } from '@prisma/client';
import { PrismaService } from './prisma.service';

export type PairWithTokens = { token0: Token; token1: Token } & Pair;

@Injectable()
export class PairService {
  constructor(private prisma: PrismaService) {}
  getAll(): Promise<PairWithTokens[]> {
    return this.prisma.pair.findMany({
      orderBy: [{ id: 'asc' }],
      include: {
        token0: true,
        token1: true,
      },
    });
  }
}
