# DoraHacks BUIDL submission: Arc Microgrants (draft, not submitted)

The form is "Create a new BUIDL and submit". It has five steps: **Profile → Details → Team → Contact → Submission**. Fields marked * are required.

## 1. Profile
| Field | Answer |
|---|---|
| BUIDL (project) name * | **Arc Guard** |
| BUIDL logo * (JPEG/PNG, < 2 MB, 480×480) | `demo/logo-480.png`: white keyhole disc on blue |
| Vision * ("Describe the problem which this project solves") | Keep your USDC behind two keys: your wallet plus a post-quantum key card that Arc verifies on-chain, so a stolen (or one day quantum-broken) wallet key alone can't move your money. |
| Category * | **Crypto / Web3** |
| Key innovation domains (optional) | Payments · Wallet · Security · DeFi · Account Abstraction |
| Layer-1s (optional) | Arc |
| Layer-2s / Appchains (optional) | — (not applicable) |
| Other ecosystems (optional) | Circle · Morpho · MetaMask |
| GitHub * | https://github.com/Jayanthkoppala/arc-guard |
| Project website | https://arc-guard-eosin.vercel.app |
| Demo video | https://arc-guard-eosin.vercel.app/demo.mp4 (70 s, voiceover). A YouTube link would embed; upload it to your channel if you want the embed. |
| Social links * (up to 3) | https://x.com/JayBosshq · https://github.com/Jayanthkoppala · https://www.linkedin.com/in/jayanth-koppala-71a8091b9 |

## 2. Details (markdown)
```markdown
## Arc Guard: your dollars, behind two keys

Arc Guard is a USDC safe deposit box, live on **Arc mainnet**. Taking money out needs two keys:

1. **Your wallet**, which sends the transaction.
2. **Your key card**, a post-quantum **SLH-DSA-SHA2-128s** key made in your browser. Arc checks its signature **on-chain** with its native precompile at `0x1800…0004`.

If someone steals your wallet key, or a quantum computer one day breaks it, they still can't withdraw.

- **Locker:** your USDC just sits there.
- **Savings:** your USDC earns in the **Galaxy USDC vault on Morpho**, with a small extra risk that the app shows plainly.
- **Lost your key card?** Your wallet alone can start a **7-day emergency exit**, and the key card can cancel it.
- **The vault page:** every box and the total USDC held, read live from Arc.

### What it uses Arc for
| Arc feature | How Arc Guard uses it |
|---|---|
| Post-quantum verify precompile (`0x1800…0004`) | Checks every withdrawal, key change and exit cancel on-chain. We found no other app using it yet. |
| USDC as native gas | A two-key withdrawal is ~451k gas, about **$0.009**. The whole product is priced in dollars. |
| USDC blocklist check | The recipient is screened before the expensive signature check runs. |
| Sub-second deterministic finality | The keys "turn" in the UI only after the receipt, and the receipt is final. |
| Galaxy USDC vault (Morpho, ERC-4626) | Powers the Savings compartment. |

### Live on Arc mainnet
- App: https://arc-guard-eosin.vercel.app
- All boxes and totals: https://arc-guard-eosin.vercel.app/hall
- Contract (verified): https://explorer.arc.io/address/0x98022839c9D934ac17D3dED0327B7ae97Ebee48e
- A real two-key withdrawal (see the `PQVerified` event): https://explorer.arc.io/tx/0xb542a6d3cacb37d58a95a29c77c6381ec686a6ba05093490681f5c7f20c04f66?tab=logs
- Demo video: https://arc-guard-eosin.vercel.app/demo.mp4

### How it's built
- **Contract:**
  - `ArcGuard.sol`: one box per wallet, with no admin, no pause and no upgrade path.
  - Every signature is bound to the chain, the contract, the owner, a nonce, the exact action and a deadline, so it can't be replayed or reused.
- **Tests:**
  - 13 unit tests run on Circle's arc-foundry (the real Arc EVM with its precompiles).
  - A mainnet fork test runs against the real USDC and the real Galaxy vault.
- **App:**
  - Next.js and TypeScript, with viem.
  - The key card is generated and signs in a Web Worker with `@noble/post-quantum`, and never leaves the device.
  - The passbook is built from on-chain events.
- **Honest limits:**
  - The contract is **unaudited**.
  - Someone holding **both** keys can take everything.
  - Savings carries Morpho lending risk.
  - Not affiliated with Circle.

### What's next
- An ERC-7579 validator module, so smart wallets and Circle Agent Wallets can add a post-quantum co-signer.
- Post-quantum claim links that need no account.
- EURC boxes.
- An audit before any real deposits.
```

## 3. Team
| Field | Answer |
|---|---|
| Invite members | none (solo) |
| Team information | Solo builder: Jayanth Koppala (India). I built the contract, the tests, the Next.js app and the mainnet demo. |

## 4. Contact (only DoraHacks staff can see this; used for verification)
| Field | Answer |
|---|---|
| Telegram (primary contact) * | **@? (needed from Jay)** |
| Backup: Discord / WhatsApp / WeChat | optional (Jay's choice) |

## 5. Submission
This step hasn't shown yet. The form won't go past **Contact** until Telegram is filled in. It probably asks you to confirm the hackathon/track and may add organizer questions; I'll draft those as soon as it opens.

## Notes
- **Payout wallet:** the grant is paid in USDC on Arc. Any EVM address works, e.g. your MetaMask.
- **Eligibility:**
  - live on mainnet ✅
  - public repo ✅
  - says what it uses Arc for ✅
  - public profile ✅
  - not funded by Circle ✅
- **Voice credit:** the voiceover uses ElevenLabs on the free tier, which requires attribution. Add "Voice: ElevenLabs" to the video description.
