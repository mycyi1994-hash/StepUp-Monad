# Metropolis submission draft

**Name:** StepUp

**One line:** Sponsor-funded running challenges that pay directly from escrow on Monad.

**Problem:** Running crews can organize a challenge, but collecting sponsor funds and distributing small rewards is usually manual and hard for participants to verify.

**Product:** A sponsor selects a distance, deadline and reward slots, then funds the complete MON pool. Runners track activity in the browser or Android app. A verifier checks the session and signs a wallet-bound proof. The escrow releases the exact reward, prevents duplicate claims and returns expired unclaimed funds to the sponsor.

**Why Monad:** This is an EVM application with many independent small claims. Monad provides a chain for the familiar wallet and contract tooling and is a suitable target for frequent reward settlement. This build demonstrates the complete funding/proof/claim design on Monad Testnet; it does not claim a measured performance benchmark or gas sponsorship.

**Links:** [Live app](https://stepup-monad.gana003.workers.dev) · [Source](https://github.com/mycyi1994-hash/StepUp-Monad) · [Android APK](https://github.com/mycyi1994-hash/StepUp-Monad/releases/download/monad-testnet/StepUp-Monad.apk) · [Escrow](https://testnet.monadscan.com/address/0xd5d563869cA856114AF80bA3C94df99281ccF005)

**Recommended track:** Consumer Products & Payments. The sponsor funds a group activity and runners receive verifiable small payouts; lead the presentation with that experience. The [official Metropolis page](https://monad.xyz/developers/hackathons/metropolis), checked 11 October 2026, lists a 13 October deadline and asks for a working product, demo, short write-up and code link. Confirm the exact cutoff time in the application platform. Existing projects are allowed when the submitted work was built during the event window; use BUILD-RECORD.md to identify that work.

## Proposed first pilot

Recruit one local running crew and one sponsor for a four-week trial. The sponsor commits each week's pool before runners start. Measure funded challenges, eligible runs, successful claims, repeated participation and the organizer's time spent on payouts. No crew, sponsor, user count or pilot result is claimed yet.

The business hypothesis is paid organizer tooling or a disclosed sponsor service fee. The current contract charges no protocol fee. Prove that organizers value verified reward settlement before introducing fees or mainnet assets; participants should understand that this build uses test tokens. The next product work is real-device validation, a clearer onboarding flow and stronger activity verification.

## Three-minute demonstration

1. 0:00–0:25: Show the funded pool and explain the crew reward problem.
2. 0:25–0:55: Connect to Monad Testnet. Show the distance, reward and remaining slots.
3. 0:55–1:35: Show a real recorded run. For a live outdoor demo use the 100 m challenge; do not portray an emulator or synthetic trace as a physical run.
4. 1:35–2:15: Request the wallet-bound proof, claim and open the transaction receipt.
5. 2:15–2:40: Show sponsor creation and the remaining escrow balance.
6. 2:40–3:00: Explain the next pilot: one local running crew and one funded weekly challenge. This is a proposed pilot, not existing traction.

## Submission notes

Use the organizer's form, include the source and deployed address, and attach a screen recording plus the founder introduction if requested. A recorded video and final form submission are not represented as complete by this repository. Disclose the existing Android base using BUILD-RECORD.md. The new work is the Monad challenge system, deployment and integration described there.

Limitations: centralized activity verifier; spoofing risk; testnet rewards; Google login requires a real-device verification; mystery draw purchases are not deployed. No token sale, real-money payout or mainnet launch is included.
