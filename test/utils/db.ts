import db from '../../src/dal/client';
export const clean = async () => {
  await db.pairLiquidityInfo.deleteMany();
  await db.pair.deleteMany();
  await db.token.deleteMany();
};
