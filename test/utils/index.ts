import { PrismaService } from '../../src/database/prisma.service';

export * from './context.mockup';
export * from './env.mockups';
export * from './db';

export const sortByAddress = (xs: { address: string }[]) =>
  [...xs].sort((a, b) => a.address.localeCompare(b.address));

export const listToken = (prismaService: PrismaService, address: string) =>
  prismaService.token.update({
    where: {
      address,
    },
    data: {
      listed: true,
    },
  });
