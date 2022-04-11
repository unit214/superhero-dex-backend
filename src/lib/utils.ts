export const nonNullable = <T>(t: T | null | undefined): T => {
  if (t == null) {
    throw new Error('non nullable value expected');
  }
  return t;
};
