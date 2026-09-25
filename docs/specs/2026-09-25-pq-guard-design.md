# PQ Guard — design spec (2026-09-25)

## What it is
A USDC safe deposit box on Arc mainnet. The box has two compartments:
- **Locker:** the USDC just sits there.
- **Savings:** the USDC is deposited in the Galaxy USDC Morpho vault and earns interest.

Taking money out needs **two keys**: your wallet, which sends the transaction, and a **post-quantum key** (SLH-DSA-SHA2-128s) whose signature Arc verifies on-chain through its precompile `0x1800…0004`. Everything is open source (MIT). Deliverables are one contract and one web app.

Goal: an Arc Microgrants submission in the first review batch. The reviewer opens a link, sees a real box on mainnet, and follows a real two-key withdrawal to the explorer.

## Promises we make (and don't)
- **We promise:** a quantum computer that cracks your wallet key still can't take the money, and neither can a thief who has only your wallet. Losing the PQ key isn't fatal, because a 7-day emergency exit exists and the PQ key can cancel it.
- **We don't promise:** "unhackable". If someone steals both keys, the money is gone. A contract bug could lose funds. Savings carries Morpho lending risk. The UI says all of this plainly.
- **Labels:** the vault is shown as "Galaxy USDC vault on Morpho". We never say "approved by Circle".

## Contract: `PQGuard.sol` (one contract, one box per wallet)
- **State per owner:** `pqKey` (32 bytes), `nonce`, `locker` (USDC, 6 decimals), `shares` (vault shares), and `escape {to, readyAt}`.
- **Functions:**
  - `open(pqKey)`: opens your box.
  - `depositLocker(amount)` and `depositSavings(amount)`: pull USDC through the ERC-20 at `0x3600…` after `approve`. Savings deposits call `vault.deposit` on Galaxy `0x8e35…12af`, which is ERC-4626 with USDC as its asset (checked on mainnet).
  - `moveToSavings(amount)` and `moveToLocker(shares)`: owner only. The money stays inside the box, so no PQ signature is needed.
  - `withdraw(to, lockerAmount, shares, deadline, pqSig)`: requires `msg.sender == owner` **and** the precompile to verify `pqSig` over `keccak256(chainid, this, owner, nonce, "withdraw", to, lockerAmount, shares, deadline)`. Then `nonce++`. The recipient is checked against the blocklist before the expensive check runs.
  - `rotateKey(newKey, deadline, pqSig)`: signed by the old PQ key.
  - `requestEscape(to)`: owner only. Starts a 7-day timer.
  - `cancelEscape(deadline, pqSig)`: anyone can submit it, but the PQ signature is required.
  - `executeEscape()`: after the 7 days, pays out everything to `to`.
- **Events:** `Opened`, `Deposited`, `Moved`, `PQVerified`, `Withdrawn`, `KeyRotated`, `EscapeRequested`, `EscapeCancelled`, `EscapeExecuted`. The passbook is built from these.
- **Tests (arc-foundry):** good and bad signature, replay (nonce), wrong owner, expired deadline, deposit and withdraw from Savings, rotate key, and escape, cancel and execute. PQ fixtures come from `@noble/post-quantum`.
- **Cost:** about 440k gas (~0.009 USDC) per two-key action.

## Design: an old-world bank, 1950s
Global references: a round steel vault door, walls of numbered safe deposit boxes, brass, a warm lamp glow, a typewriter passbook, rubber stamps, a coin jar. Palette: deep bank green, brass, ivory paper. Fonts: a serif for headings and a typewriter face for numbers. Sounds (Web Audio): a heavy door, a key turn and *clunk*, a stamp thud, a coin clink. Motion is weighty and slow, never bouncy. It respects reduced-motion settings and works on phones.

### Screens
1. **Vault door (landing):** "Your dollars, behind two keys." A plaque reads "Protected against quantum computers". Connect a wallet (Arc is added automatically) and the door swings open.
2. **Open a box (first visit):** the box number is derived from your address. It generates your PQ key in the browser, shows a **key card** (downloadable file, printable) once, and has you confirm that you saved it. Optional: "Remember on this device", with a warning. The `open()` transaction runs at this point.
3. **Your box:**
   - The **Locker drawer** shows its USDC balance.
   - The **Savings coin jar** shows its balance and grows live, with the real APY from the vault.
   - Buttons: Deposit, Move, Withdraw.
   - A risk line under Savings: "Earns by lending through Morpho. Small extra risk."
4. **Deposit:** choose Locker or Savings, enter an amount, approve, deposit. A stamp lands in the passbook.
5. **Withdraw:** two keyholes. Key 1 is the wallet (connected). For key 2, you load the key card and the browser signs in about 1 s, with a progress bar in a web worker. Both keys turn, the box slides out, and a real explorer link appears.
6. **Passbook:** a typed ledger of every event with stamps (DEPOSITED, SAVED, WITHDRAWN, INTEREST). Every line links to its Arc transaction.
7. **Emergency:** "Lost your key card?" starts the 7-day exit, with a big countdown. If an exit is pending, the box shows a red tag and a "Cancel with key card" button.

## Stack
- Foundry via arc-foundry (contract).
- Vite + React + viem + wagmi (app).
- `@noble/post-quantum` in a web worker.
- Hosted on Vercel.
- The APY comes from reading the vault's share price on-chain over time, or from the Earn kit's `exploreVaults` called through a tiny server route. The Earn kit refuses API keys in the browser, and our call needs no key.

## Build order (~18–20 h)
1. Arc-foundry setup, and check that the precompile works locally: 0.5 h
2. Contract and tests: 4 h
3. Deploy to mainnet and verify with Standard JSON: 1 h
4. App skeleton: wallet, contract reads, deposit and withdraw flows working without polish: 4 h
5. Vault look: door, box, keys, passbook, jar, sounds, animations: 5–6 h
6. Real demo: fund a box, put money in Savings, make one two-key withdrawal on mainnet: 0.5 h
7. README (threat model, gas, addresses, transaction links), 90-second video, DoraHacks submission: 1.5 h
8. Buffer: 1–2 h

## Not in v1 (listed as next steps in the README)
Gasless claim links, a relayer, EURC, multiple owners, choosing between vaults, an ERC-7579 module for smart wallets and Circle Agent Wallets, a browser extension, and a mobile app.

## Open checks (answered during build step 1)
- Does arc-anvil include the PQ precompile? If not, mock it with `vm.etch` and add one fork test against mainnet.
- Are there Morpho deposit caps or withdrawal delays on Galaxy USDC? Read the vault's `maxDeposit` and `maxWithdraw` before depositing.
