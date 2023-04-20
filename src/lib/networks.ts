type NetworkConfig = {
  nodeUrl: string;
  compilerUrl: string;
  middlewareUrl: string;
};

export default {
  testnet: {
    nodeUrl: 'https://testnet.aeternity.io',
    compilerUrl: 'https://latest.compiler.aepps.com',
    middlewareUrl: 'wss://testnet.aeternity.io/mdw/v2/websocket',
  },
  mainnet: {
    nodeUrl: 'https://mainnet.aeternity.io',
    compilerUrl: 'https://latest.compiler.aepps.com',
    middlewareUrl: 'wss://mainnet.aeternity.io/mdw/v2/websocket',
  },
} as { [key: string]: NetworkConfig };
