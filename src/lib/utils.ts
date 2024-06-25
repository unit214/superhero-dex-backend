import { Decimal } from '@prisma/client/runtime/library';
import BigNumber from 'bignumber.js';

export const nonNullable = <T>(t: T | null | undefined, label?: string): T => {
  if (t == null) {
    throw new Error(
      `${label ? label + ': ' : null} non nullable value expected`,
    );
  }
  return t;
};

export const removeId = <ID, T extends { id: ID }>(t: T) => {
  const {
    id, // eslint-disable-line @typescript-eslint/no-unused-vars
    ...tail
  } = t;
  return tail;
};

export const pluralize = (count: number, noun: string, suffix = 's') =>
  `${count} ${noun}${count !== 1 ? suffix : ''}`;

const parseEnv = (x) => x && JSON.parse(x);
export const presentInvalidTokens = parseEnv(process.env.SHOW_INVALID_TOKENS);

export const numberToDecimal = (number: number): Decimal =>
  new Decimal(number.toString());

export const bigIntToDecimal = (bigInt: bigint): Decimal =>
  new Decimal(bigInt.toString());

export const decimalToBigInt = (decimal: Decimal): bigint =>
  BigInt(decimal.toFixed().toString());

export const calculateUsdValue = ({
  reserve,
  tokenAePrice,
  decimals,
  aeUsdPrice,
}: {
  reserve: string;
  tokenAePrice: string;
  decimals: number;
  aeUsdPrice: string;
}) => {
  if (!reserve || !tokenAePrice || !aeUsdPrice) {
    return '0';
  }

  return new BigNumber(reserve)
    .abs()
    .div(new BigNumber(10).pow(decimals))
    .multipliedBy(tokenAePrice)
    .multipliedBy(aeUsdPrice)
    .toString();
};
