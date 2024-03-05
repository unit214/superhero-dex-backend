type NetworkConfig = {
  nodeUrl: string;
  compilerUrl: string;
  middlewareUrl: string;
  middlewareHttpUrl: string;
};

export default {
  testnet: {
    nodeUrl: 'https://testnet.aeternity.io',
    compilerUrl: 'https://latest.compiler.aepps.com',
    middlewareUrl: 'wss://testnet.aeternity.io/mdw/v2/websocket',
    middlewareHttpUrl: 'https://testnet.aeternity.io/mdw',
  },
  mainnet: {
    nodeUrl: 'https://mainnet.aeternity.io',
    compilerUrl: 'https://latest.compiler.aepps.com',
    middlewareUrl: 'wss://mainnet.aeternity.io/mdw/v2/websocket',
    middlewareHttpUrl: 'https://mainnet.aeternity.io/mdw',
  },
} as { [key: string]: NetworkConfig };
