# Arc Guard

**Your dollars, behind two keys.** Arc Guard is a USDC safe deposit box on [Arc](https://arc.io) mainnet. Taking money out needs **two keys**:

1. **Your wallet**, which sends the transaction.
2. **Your key card**, a post-quantum **SLH-DSA-SHA2-128s** signature that Arc checks on-chain with its native precompile at `0x1800000000000000000000000000000000000004`.

If a quantum computer, or a thief, ever gets your wallet key, they still can't move the money.

- **Locker:** your USDC just sits there.
- **Savings:** your USDC earns interest in the Galaxy USDC vault on Morpho, a lending protocol. Lending carries some extra risk.
- **Lost key card?** Your wallet alone can start a **7-day emergency exit**, and your key card can cancel it at any time before it pays out.

> Status: live on Arc mainnet — addresses and transaction links below.

## What it uses Arc for
| Arc feature | How Arc Guard uses it |
|---|---|
| Post-quantum signature verify precompile (`0x1800…0004`) | Checks every withdrawal, key change and exit cancellation on-chain. No other chain has this. |
| USDC as native gas | The whole product is priced in dollars. A two-key withdrawal costs about **400k gas ≈ 0.008 USDC**. |
| USDC blocklist (`isBlacklisted`) | The recipient is checked before the expensive signature check runs. |
| Sub-second deterministic finality | A withdrawal is final the moment the receipt arrives. The keys "turn" in the UI only after that. |
| Galaxy USDC vault (Morpho, ERC-4626) | The Savings compartment. |

## How it works
```
open(pqKey)                    wallet            one box per wallet
deposit(amount)                wallet            always lands in the Locker
moveToSavings / moveToLocker   wallet            money stays inside the box
withdraw(to, locker, shares,   wallet + key card PQ signature over keccak(chainid, contract,
         deadline, sig)                          owner, nonce, action, deadline)
rotateKey(newKey, …, sig)      wallet + key card
requestExit(to)                wallet            starts the 7-day timer
cancelExit(owner, …, sig)      key card          anyone may relay it
executeExit(owner)             anyone, after 7 days; pays only to the address the owner chose
```
There is no admin, no pause switch and no upgrade path. The key card is generated and signs **in your browser** (a Web Worker running `@noble/post-quantum`) and never leaves your device.

### What it protects, and what it doesn't
- ✅ Someone with only your wallet key, or a future quantum attack on it, can't withdraw.
- ✅ If you lose your key card, you get your money back after 7 days.
- ❌ Someone who has **both** keys can take everything.
- ❌ The contract has **not been audited**, and a bug could lose funds.
- ❌ Savings carries Morpho lending risk.
- Deposit only what you can afford to lose. Not a bank, not insured, and not approved, endorsed or run by Circle.

## Repo
- `src/ArcGuard.sol`: the contract.
- `test/`: 13 unit tests running on Circle's [arc-foundry](https://github.com/circlefin/arc-foundry) (the real Arc EVM with its precompiles), plus a mainnet fork test.
- `web/`: the Next.js app.
- `scripts/pqfixture.ts`, `scripts/demo.ts`: PQ test fixtures and the mainnet demo.
- `design/`: design system and research.

```bash
bun install
~/.arc-foundry/bin/forge test --network arc                                        # unit tests
~/.arc-foundry/bin/forge test --network arc --fork-url https://rpc.mainnet.arc.io  # + real Galaxy vault
cd web && bun install && bun run dev
```

## License
MIT
