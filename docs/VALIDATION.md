# Validation — 11 October 2026

- Solidity: 102 passing tests, including signature domain/recipient binding, replay protection, escrow funding and sponsor refund timing.
- Attester: 58 passing tests.
- Web wallet: 14 passing tests; wallet and draw bundles built.
- GPS/native verifier: 6 passing tests for distance, invalid traces, coverage, domain binding and native session eligibility.
- Android source: string/resource, design contract (107 routes) and asset checks pass.
- New Supabase project: migrations 0001–0056 applied, isolated from the source application's database.
- Monad Testnet: nine deployed contracts; receipts in the deployment manifest. Three starter pools funded with a total of 0.6 test MON.
- Cloudflare: challenge worker, D1 database and separate attester deployed. Final challenge-worker version: `987f38d3-a22e-4c09-a934-ad6da828bd57`. Deployment-specific privacy/terms/deletion disclosures were rendered and reviewed.

- Android: 500 unit tests and the QA APK build passed at `4dc620fedd4f43d0ab625ecf008ed157e8390952` ([build](https://github.com/mycyi1994-hash/StepUp-Monad/actions/runs/38116832128)). The APK is published in the [testnet release](https://github.com/mycyi1994-hash/StepUp-Monad/releases/tag/monad-testnet); `StepUp-test.json` identifies its exact source revision.
- Android 14 and 15 secondary forms, reference and onboarding capture suites passed ([run](https://github.com/mycyi1994-hash/StepUp-Monad/actions/runs/38114457261)).
- Android 15 wallet interaction/state capture suite passed on the same `4dc620fe` source as the APK ([run](https://github.com/mycyi1994-hash/StepUp-Monad/actions/runs/38116833875)). Screenshot review found and fixed wrapping and edge clipping for large amounts: the existing fitted-number component now re-measures the target font size. Final normal, 320 dp and large-font captures were reviewed. These screenshots use test fixtures, not real balances: [wallet](screenshots/android-wallet.png), [320 dp](screenshots/android-wallet-320dp.png), [large font](screenshots/android-wallet-large-font.png).
- Deployed verifier end-to-end: session creation, wallet authentication, a 120 m / 60 s synthetic GPS fixture, signed proof, idempotent retry and an actual escrow claim succeeded. See [verifier receipts](verifier-smoke.json). This is integration evidence, not a physical run or user activity.
- Direct contract funding and claim succeeded with a separate labeled synthetic proof ([receipts](contract-smoke.json)). The two test pools are closed; the three public starter pools remain funded.
- Native bridge rejects unauthenticated requests (401) and returns the dedicated test account's empty run list with a valid Supabase session (200). No physical run was fabricated in the database.
- Browser review covered the 390 px layout, sponsor reward totals, wallet/invite/APK links and loading/error states. Challenge API, attester health and Android asset links returned successfully.

Remaining checks: real-device Google sign-in, a physical outdoor GPS-to-claim session and explorer source verification. Mystery draw purchases remain disabled because no draw contract is deployed. Final demo/founder recording and organizer form submission are not complete.

Initial Linux CI exposed a CREATE2 source-hash difference between Windows CRLF and Linux LF checkout. The deployed source bytes are now pinned in .gitattributes; the deterministic-deployment tests remain enabled to verify reproducibility on CI. Contract behavior was unchanged.
