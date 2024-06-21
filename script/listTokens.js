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

  const MAINNET_DEX_BACKEND_URL =
    'https://dex-backend-mainnet.prd.service.aepps.com';
  const TESTNET_DEX_BACKEND_URL =
    'https://dex-backend-testnet.prd.service.aepps.com';

  const path = '/tokens/listed/';

  for (const token of mainnetTokens) {
    await fetch(`${MAINNET_DEX_BACKEND_URL}${path}${token}`, {
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
