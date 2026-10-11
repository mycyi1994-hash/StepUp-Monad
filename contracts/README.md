# StepUp Monad contracts

Target: Monad Testnet, chain ID 10143. See deployments/monadTestnet.json for the deployed addresses and receipts.

MonadChallengeEscrow holds pre-funded native MON rewards and validates verifier-signed EIP-712 run proofs. A run is single-use across challenges and a wallet can receive one reward per challenge. Unclaimed funds stay locked until the end plus a 24-hour claim period, then the sponsor can refund them.

The inherited SUP token, reward distributor, sneaker contracts, SUP vault and course registry are also deployed to this chain. EAS and SchemaRegistry are explicitly deployed contracts: no OP Stack predeploy is assumed.

    npm ci
    npm test
    npm run deploy:monad

Supply private keys through .env, as listed in .env.example. The deploy script checks resumable deployment records and generates public client configuration. Before deploying to a different environment use a separate manifest and worker/database targets. Never reuse this testnet manifest on mainnet.

Optional source verification: set MONAD_EXPLORER_API_KEY to an Etherscan API V2 key and run npm run verify:monad. Source verification is not claimed merely because deployment succeeded. See ../docs/VALIDATION.md for evidence.
