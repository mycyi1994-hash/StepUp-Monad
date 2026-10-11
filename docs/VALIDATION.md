# Validation — 11 October 2026

- Solidity: 102 passing tests, including signature domain/recipient binding, replay protection, escrow funding and sponsor refund timing.
- Attester: 58 passing tests.
- Web wallet: 14 passing tests; wallet and draw bundles built.
- GPS verifier: 4 passing tests for distance, invalid traces, coverage and domain binding.
- Android source: string/resource, design contract (107 routes) and asset checks pass.
- New Supabase project: migrations 0001–0056 applied, isolated from the source application's database.
- Monad Testnet: nine deployed contracts; receipts in the deployment manifest. Three starter pools funded with a total of 0.6 test MON.
- Cloudflare: challenge worker, D1 database and separate attester deployed.

Pending verification at this revision: Android CI build/device captures, real-device Google sign-in, a physical outdoor GPS-to-claim session and explorer source verification. These are not asserted as completed tests. Final results will be appended when observed.

Initial Linux CI exposed a CREATE2 source-hash difference between Windows CRLF and Linux LF checkout. The deployed source bytes are now pinned in .gitattributes; the deterministic-deployment tests remain enabled to verify reproducibility on CI. Contract behavior was unchanged.
