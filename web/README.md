# StepUp wallet and shared web assets

The deployed challenge homepage is built from [monad/src](../monad/src). This directory supplies the authenticated wallet, invite page, disclosures, fonts, sneaker artwork and wallet/draw bundles copied by monad/scripts/build.mjs.

- Public origin: https://stepup-monad.gana003.workers.dev
- Wallet: /wallet.html, configured by wallet-config.js for the dedicated Supabase project and Monad Testnet contracts.
- Invites: /c/<crew-id>, routed to invite.html; Android download points to this repository's monad-testnet release.
- Privacy, terms and account deletion pages describe this isolated testnet deployment.
- draw.html is retained with purchase disabled until a draw contract is deployed.

Run npm ci, npm run build:wallet, npm run build:draw and npm test here before building/deploying ../monad. The historical index.html/site.js/waitlist sources are not deployed as the challenge homepage. This directory is not automatically published by Cloudflare Pages.

Android assetlinks.json uses the bundled test signing certificate. Add the real store signing fingerprint before a Play Store release. No wallet private keys or privileged backend keys belong in these assets.
