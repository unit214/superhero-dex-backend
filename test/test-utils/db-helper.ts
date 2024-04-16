import { PrismaService } from '@/database/prisma.service';

export const cleanDb = async (prismaService: PrismaService) => {
  await prismaService.pairLiquidityInfo.deleteMany();
  await prismaService.pair.deleteMany();
  await prismaService.token.deleteMany();
};

export const listToken = (prismaService: PrismaService, address: string) =>
  prismaService.token.update({
    where: {
      address,
    },
    data: {
      listed: true,
    },
  });
