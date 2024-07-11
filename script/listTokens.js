async function main() {
  const AUTH_TOKEN = process.env.AUTH_TOKEN || '';
  if (!AUTH_TOKEN) {
    console.log('Please provide AUTH_TOKEN');
    process.exit(1);
  }

  const mainnetTokens = [
    'ct_J3zBY8xxjsRr3QojETNw48Eb38fjvEuJKkQ6KzECvubvEcvCa',
    'ct_7UfopTwsRuLGFEcsScbYgQ6YnySXuyMxQWhw6fjycnzS5Nyzq',
    'ct_2U1usf3A8ZNUcZLkZe5rEoBTxk7eJvk9fcbRDNqmRiwXCHAYN',
    'ct_KeTvHnhU85vuuQMMZocaiYkPL9tkoavDRT3Jsy47LK2YqLHYb',
    'ct_xtk8rSz9suPb6D6VLquyfVji25FcnFRDjn3dnn5mmvHsPiESt',
  ];

  const testnetTokens = [
    'ct_b7FZHQzBcAW4r43ECWpV3qQJMQJp5BxkZUGNKrqqLyjVRN3SC',
    'ct_7tTzPfvv3Vx8pCEcuk1kmgtn4sFsYCQDzLi1LvFs8T5PJqgsC',
    'ct_28w7VyXS6UDNbyWZxZLtxpDKJorfpYyBQM4f9quseFEByUeDpb',
    'ct_JDp175ruWd7mQggeHewSLS1PFXt9AzThCDaFedxon8mF8xTRF',
  ];

  const MAINNET_DEX_BACKEND_URL =
    'https://dex-backend-mainnet.prd.service.aepps.com';
  const TESTNET_DEX_BACKEND_URL =
    'https://dex-backend-testnet.prd.service.aepps.com';

  for (const token of mainnetTokens) {
    await fetch(`${MAINNET_DEX_BACKEND_URL}/tokens/listed/${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: AUTH_TOKEN,
      },
    })
      .then((res) => res.json())
      .then((json) => console.log(json))
      .catch((err) => console.error(err));
  }
}
main();
