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
  reserve0,
  token0AePrice,
  decimals0,
  reserve1,
  token1AePrice,
  decimals1,
  aeUsdPrice,
}: {
  reserve0: string;
  token0AePrice: string;
  decimals0: number;
  reserve1: string;
  token1AePrice: string;
  decimals1: number;
  aeUsdPrice: string;
}) => {
  if (
    !reserve0 ||
    !reserve1 ||
    !token0AePrice ||
    !token1AePrice ||
    !aeUsdPrice
  ) {
    return '0';
  }

  const amountFromToken0 = new BigNumber(reserve0)
    .abs()
    .multipliedBy(token0AePrice)
    .div(new BigNumber(10).pow(decimals0));
  const amountFromToken1 = new BigNumber(reserve1)
    .abs()
    .multipliedBy(token1AePrice)
    .div(new BigNumber(10).pow(decimals1));

  console.log(reserve0, amountFromToken0.toString());
  console.log(reserve1, amountFromToken1.toString());

  return amountFromToken0
    .plus(amountFromToken1)
    .multipliedBy(aeUsdPrice)
    .toString();
};
