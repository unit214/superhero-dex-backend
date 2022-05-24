export * from './context.mockup';
export * from './env.mockups';
export * from './db';
import db from '../../src/dal/client';

export const sortByAddress = (xs: { address: string }[]) =>
  [...xs].sort((a, b) => a.address.localeCompare(b.address));

export const listToken = (address: string) =>
  db.token.update({
    where: {
      address,
    },
    data: {
      listed: true,
    },
  });
