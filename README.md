# StepUp on Monad

Run together. Earn from a funded challenge. Verify the payout on Monad.

StepUp combines an Android running app with sponsor-funded running challenges. A crew funds a MON pool, runners complete the distance, and a signed run proof unlocks a fixed payout from an on-chain escrow.

- [Open the challenge app](https://stepup-monad.gana003.workers.dev)
- [Download the Android test APK](https://github.com/mycyi1994-hash/StepUp-Monad/releases/download/monad-testnet/StepUp-Monad.apk)
- [Open the wallet](https://stepup-monad.gana003.workers.dev/wallet.html)
- [Challenge contract](https://testnet.monadscan.com/address/0xd5d563869cA856114AF80bA3C94df99281ccF005)
- [Submission and demo script](docs/METROPOLIS.md) · [Build record](docs/BUILD-RECORD.md) · [한국어](README.ko.md)

## Try it

Use a wallet with Monad Testnet (chain ID 10143) and [test MON](https://faucet.monad.xyz). Choose a funded challenge and start GPS tracking in the browser. Keep the page open while running, finish, sign the run proof request, then claim the reward. The wallet confirms a real testnet transaction. Each wallet can claim once per challenge; each run proof can be spent once across challenges.

Android users can track a run in StepUp and open **Profile → Wallet → Monad running challenges**. The authenticated handoff lets the web app use a recent eligible, clean running session from the app. A wallet signature is still required. Browser GPS is the fallback when native sign-in is unavailable.

## What is deployed

The challenge escrow, SUP rewards, two sneaker contract generations, vault, course registry and an independent EAS deployment are on **Monad Testnet**. Public addresses and transaction receipts are in [the deployment manifest](contracts/deployments/monadTestnet.json). The API, verifier and a separate Supabase project are dedicated to this repository. Three starter challenges were funded with test MON.

Android retains running history, sneaker collection, crews, events and the SUP wallet. The new challenge path connects running activity to a pre-funded MON reward. Mystery draw on-chain purchase is disabled until a separate draw deployment is configured; its existing collection UI remains available.

## Trust and limits

The verifier checks GPS accuracy, timestamp continuity, speed and distance before issuing an EIP-712 proof. Native proofs additionally require an authenticated clean session created after the challenge. This is a centralized, fallible verifier, not a cryptographic proof of physical activity; location spoofing and rooted devices remain risks. The contract independently enforces funding, recipient, deadline and replay protection. Sponsor refunds unlock after the challenge and claim grace period.

All assets and rewards are testnet demonstrations. No measured mainnet throughput, revenue or adoption is claimed. The native Google sign-in flow needs a real-device check; browser challenges do not depend on Google login.

## Develop

Requirements: Node 22+, Java 17 and Android SDK for native builds.

    cd contracts && npm ci && npm test
    cd ../attester && npm ci && npm test
    cd ../web && npm ci && npm run build:wallet && npm run build:draw && npm test
    cd ../monad && npm ci && npm test && npm run build

From the repository root, run ./gradlew :app:testDebugUnitTest :app:assembleQa. CI publishes the test APK from main. See [deployment instructions](docs/DEPLOYMENT.md) for fresh infrastructure. Keys, passwords and admin credentials are never committed.
