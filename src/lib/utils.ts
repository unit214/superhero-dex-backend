export const nonNullable = <T>(t: T | null | undefined): T => {
  if (t == null) {
    throw new Error('non nullable value expected');
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
