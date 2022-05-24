export const TEST_NET_VARS = {
  NETWORK_NAME: 'testnet',
  ROUTER_ADDRESS: 'ct_MLXQEP12MBn99HL6WDaiTqDbG4bJQ3Q9Bzr57oLfvEkghvpFb',
  FACTORY_ADDRESS: 'ct_NhbxN8wg8NLkGuzwRNDQhMDKSKBwDAQgxQawK7tkigi2aC7i9',
};
export const mockupEnvVars = (inputEnv: any) => {
  const env = process.env;

  beforeAll(() => {
    jest.resetModules();
    process.env = { ...env, ...inputEnv };
  });

  afterAll(() => {
    process.env = env;
  });
};
