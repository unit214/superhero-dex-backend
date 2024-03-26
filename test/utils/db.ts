import { PrismaService } from '../../src/database/prisma.service';

export const clean = async (prismaService: PrismaService) => {
  await prismaService.pairLiquidityInfo.deleteMany();
  await prismaService.pair.deleteMany();
  await prismaService.token.deleteMany();
};
