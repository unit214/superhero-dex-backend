import { Pair } from '@prisma/client';
import prisma from './client';

export const getAll = (): Promise<Pair[]> => prisma.pair.findMany({});
