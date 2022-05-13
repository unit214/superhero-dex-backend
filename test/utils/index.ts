export * from './context.mockup';
export * from './env.mockups';

export const sortByAddress = (xs: { address: string }[]) =>
  [...xs].sort((a, b) => a.address.localeCompare(b.address));
