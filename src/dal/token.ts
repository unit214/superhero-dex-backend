import { Token } from '@prisma/client';
import prisma from './client';

export const getAll = (): Promise<Token[]> => prisma.token.findMany({});
