# Arc Guard: voice and complete copy

Every string the app shows, in one place. Keys like `landing.headline` are for the prototypes and the real app. `{braces}` mark values filled in at runtime. When a string depends on a contract behaviour that isn't built yet, it is marked **[CHECK]**.

---

## 1. Voice: the 1950s teller

**Who is talking:** the head teller of an old bank. Calm, courteous and exact. Never in a hurry and never excited. The teller explains once, clearly, then steps aside. The teller never oversells, because a good bank has no need to.

**Who is listening:** (a) a Circle DevRel reviewer with two minutes and a lot of crypto knowledge, and (b) an ordinary saver with none. Write for (b). (a) will read plain English as confidence.

### Rules
1. **Plain words first.** Use Locker, Savings, key card, box, passbook, fee. Crypto terms appear only in the glossary, the "Details" disclosures and the footer. Where a crypto term has to appear (the wallet popup will say "transaction"), pair it once: "Confirm in your wallet (Key 1)."
2. **Always say where the money is.** Every error, wait state and success line ends by stating the money's status: "Nothing was sent." "Your money is still in the Locker." This one habit does most of the work of making people feel safe, and it is always true.
3. **Short sentences, second person, active voice.** "You" is the customer. "The box" does things; "we" does not. Never write "we hold / keep / protect your money". It's non-custodial, and "we" suggests a custodian. "We" appears only in the footer and About, meaning the people who made the software.
4. **Say "safe" only as an object, never as a promise.** A safe deposit box, keep it somewhere safe: fine. "Your money is 100% safe": never. For the feeling, use concrete facts: "behind two keys", "only your keys open it", "nothing leaves without both keys".
5. **Always give the risk plainly.** Savings shows its risk line every time it appears. No caveat goes in grey 10 px text: disclosures use body size, with ink colour at AA contrast.
6. **Rates are honest and in money terms.** Never write "APY" in the UI. Write "0.06% a year: about 6¢ on every $100." Small numbers stated plainly read as honest. Hiding them reads as a trick.
7. **Numbers.** Write amounts as `1,250.00 USDC` in the typewriter face, 2 decimals in balances. The live Savings jar shows 6 decimals. In prose, use "digital dollars (USDC)" once, then "USDC". Durations are "7 days", "about 1 second", "a few seconds". Fees are "about 0.01 USDC".
8. **Casing.** Headings use sentence case. Buttons start with a verb, use sentence case and have at most 3 words ("Open my box", "Turn both keys"). Stamps and the plaque are ALL CAPS. Box numbers look like `No. 4172`.
9. **Period flavour lives in nouns, not in jokes.** Use box, drawer, passbook, slip, stamp, teller, key card and plaque. At most one period phrase per screen ("Very good.", "Right this way."). No puns and no "Oops".
10. **Punctuation.** No exclamation marks. No emoji. No ALL CAPS in sentences. No ellipsis in error text. Wait states may use "…".

### Banned words
`unhackable`, `unbreakable`, `bulletproof`, `military-grade`, `bank-grade`, `guaranteed`, `risk-free`, `100% safe`, `fully secure`, `insured`, `FDIC`, `trust us`, `approved/endorsed/partnered/backed by Circle`, `official Circle`, `invest`, `yield farming`, `passive income`, `APY` (in the UI), `gas` (in the UI), `web3`, `DeFi` (in the UI), `revolutionary`, `future-proof`, `quantum-proof`, `Oops`, `Whoops`, `Something went wrong` (with no cause given).

### Allowed claims (and nothing stronger)
- "To take money out, you need two keys: your wallet and your key card."
- "Someone with only your wallet can't take money out."
- "Your key card uses a signature built to resist quantum computers (SLH-DSA, a NIST standard)."
- "Arc checks the key card's signature itself, every time money leaves."
- "Lose your key card, and your money isn't lost: there's a 7-day emergency exit."
- "The software is open source. Anyone can read it."
- "We have no key to your box." **[CHECK: true only if the contract has no admin, owner, pause or upgrade path. The spec lists none.]**

---

## 2. Glossary: crypto term → what the app says

| Crypto term | App says | Notes |
|---|---|---|
| Wallet / EOA | **Key 1** · your wallet | Key 1 and "your wallet" appear together the first time on each screen. |
| SLH-DSA private key | **Key 2** · your key card | Never "private key" in the main UI. |
| SLH-DSA public key (`pqKey`) | the lock on your box / card fingerprint | The fingerprint is the first 8 hex characters of the public key, shown as `A1B2-C3D4`. |
| Signature (PQ) | turning Key 2 / signing slip | "Your key card signs a slip for this exact withdrawal." |
| Transaction | slip / "confirm in your wallet" | |
| Sign / confirm tx | turn Key 1 | |
| Smart contract | the box / the box's rules | "Smart contract" appears only in the footer and Details. |
| `open()` | open a box | |
| Address | account number / "address" | Show it shortened: `0x12ab…90cd`. The full address appears on tap. |
| USDC | digital dollars (USDC), then USDC | |
| Gas fee | fee · "paid to Arc, not to us" | Arc charges fees in USDC. |
| `approve` | give the box permission | "Step 1 of 2: allow the box to take {amount} USDC from your wallet." |
| Morpho / ERC-4626 vault | **Savings** · Galaxy USDC vault on Morpho | Always this full label, never shortened. |
| Vault shares | (hidden) | Show USDC value only. |
| APY | yearly rate · "a year" | |
| Nonce, deadline, chain ID | (hidden) | They surface only through errors, in plain words. |
| Block explorer / tx hash | Arc's public record / receipt number | Link text: "See it on Arc's public record". |
| Mainnet | live on Arc | |
| Precompile | Arc's built-in checker | Used only in "Read the plaque". |
| `requestEscape` | start the emergency exit | |
| `cancelEscape` | cancel the exit | |
| `executeEscape` | pay out the exit | |
| `rotateKey` | replace your key card | |
| Events | passbook entries | |
| Blocklist | the USDC blocked list | |
| Non-custodial | only your keys open it | In the footer: "non-custodial". |

---

## 3. Name and taglines

Product name: **Arc Guard**. On the brass nameplate it reads **ARC GUARD · SAFE DEPOSIT**. Where "PQ" needs explaining, the About line says: "PQ stands for post-quantum."

Five tagline options:
1. **Your dollars, behind two keys.** ← recommended (it is the spec line). It states the mechanism, not a promise.
2. A safe deposit box for your digital dollars.
3. Two keys. One box. Only you hold both.
4. Kept the old way. Guarded for what's next.
5. Old-fashioned safekeeping for USDC, with a key built for the quantum age.

Use 1 as the headline and 2 as the `<title>` and meta description ("Arc Guard: a safe deposit box for your digital dollars, on Arc").

---

## 4. Landing: the vault door

| Key | String |
|---|---|
| `landing.nameplate` | ARC GUARD · SAFE DEPOSIT |
| `landing.headline` | Your dollars, behind two keys. |
| `landing.sub` | A safe deposit box for USDC on Arc. To take money out, you need your wallet and a key card that only you hold. Keep your money in the Locker, or let it earn in Savings. |
| `landing.cta.connect` | Open the door |
| `landing.cta.connect.sub` | Connect your wallet. Arc is added for you. |
| `landing.cta.practice` | Try Key 2 yourself |
| `landing.cta.practice.sub` | Cut a practice key card and let Arc check its signature. No wallet, no money. |
| `landing.cta.real` | See a real box |
| `landing.cta.real.sub` | A live box on Arc, with every entry on the public record. |
| `landing.hours` (small brass sign by the door) | OPEN 24 HOURS · ARC MAINNET |
| `landing.door.opening` (aria-live) | The vault door is opening. |
| `landing.sound.toggle` | Sound: on / Sound: off |

### The plaque
The spec's plaque, "Protected against quantum computers", slightly overstates the case. Someone with only the wallet key can still start the 7-day exit and move money between compartments. **Recommended engraving:**

| Key | String |
|---|---|
| `plaque.engraving` | TWO KEYS TO WITHDRAW · SECOND KEY BUILT TO RESIST QUANTUM COMPUTERS |
| `plaque.engraving.short` (for phones) | SECOND KEY RESISTS QUANTUM COMPUTERS |
| `plaque.link` | Read the plaque |

`plaque.full` (the modal that opens on tap, in paper and typewriter style):

> **Why two keys?**
> Your wallet proves who you are with one kind of signature. Experts expect that a large enough quantum computer could one day forge it. No such computer exists today.
>
> So your box asks for a second key: a key card that signs with **SLH-DSA**, a hash-based signature published by NIST in 2024 (FIPS 205) and designed to resist quantum computers. Arc checks that signature itself, every time money leaves the box.
>
> **What this means.** Someone who gets your wallet, whether by theft today or by quantum computer later, still can't take money out without your key card.
>
> **What it doesn't mean.**
> - If someone gets **both** your wallet and your key card, they can take everything.
> - Someone with only your wallet can **start** the 7-day emergency exit. You can cancel it with your key card. Check your box at least once a week.
> - The box is new software. A bug could lose money.
> - Savings lends through Morpho, which adds a small extra risk.
>
> Everything here is open source. You can read every line.

---

## 5. Opening a box (first visit)

| Key | String |
|---|---|
| `open.title` | Right this way. Let's open your box. |
| `open.boxNo` | Your box: No. {boxNo} |
| `open.boxNo.hint` | The number comes from your wallet's address. Same wallet, same box, on any device. |
| `open.steps.label` | Four steps, about a minute. |
| `open.step1.title` | 1. Key 1: your wallet |
| `open.step1.done` | Connected: {addrShort} |
| `open.noUsdc` | This wallet has no USDC on Arc yet. You'll need a little: some to deposit, and about 0.01 USDC per action for fees. Add USDC, then come back. Nothing has been set up. |
| `open.noUsdc.btn` | Check again |
| `open.step2.title` | 2. Cut your key card |
| `open.step2.body` | Your browser makes Key 2 right now. It never leaves this device unless you save it. No one else ever sees it. |
| `open.step2.btn` | Cut my key card |
| `open.step2.working` | Cutting your key card… |
| `open.step3.title` | 3. Save your key card |
| `open.step3.body` | You'll see this card once. Save it where your wallet isn't: printed in a drawer, or on a different device. |
| `open.step3.btn.download` | Download card |
| `open.step3.btn.print` | Print card |
| `open.step3.btn.copy` | Copy card text |
| `open.step3.copied` | Copied. Paste it somewhere that isn't this device. |
| `open.step3.downloadHelp` | Download didn't start? Some wallet apps block files. Print the card, or copy its text instead. |
| `open.step3.check.title` | Check your card |
| `open.step3.check.body` | Load the card you just saved, to make sure it works before you rely on it. |
| `open.step3.check.btn` | Check my card |
| `open.step3.check.ok` | Card checked. It fits Box No. {boxNo}. |
| `open.step3.confirm` | I've saved my key card somewhere away from my wallet. |
| `open.step3.remember` | Also remember it on this device |
| `open.step3.remember.warn` | Not recommended. Your wallet and your key card would then sit on the same device, so one thief could take both keys. Anyone using this browser, or a bad browser extension, could read the card. |
| `open.step4.title` | 4. Open the box |
| `open.step4.body` | Confirm in your wallet. This registers your key card's lock on the box. Fee: about {fee} USDC, paid to Arc. |
| `open.step4.btn` | Open my box |
| `open.step4.waiting` | Waiting for your wallet… |
| `open.step4.confirming` | Arc is recording your box… |
| `open.done.title` | Box No. {boxNo} is open. |
| `open.done.body` | It's empty for now. Your first deposit goes into the Locker. |
| `open.done.btn` | Make a deposit |
| `open.leave.warn` | Your key card isn't saved yet. If you leave now, you'll need to cut a new one. |

Keep `open.step4.btn` disabled until `open.step3.confirm` is ticked. Recommendation: also require `open.step3.check.ok`, with a text link "Skip the check" that shows `open.step3.check.skipWarn`: "Skipping. If the saved card doesn't work, only the 7-day exit can get your money out."

---

## 6. The key card

### On-screen card instructions
| Key | String |
|---|---|
| `card.what` | This is Key 2. Together with your wallet, it opens your box. |
| `card.rule1` | Keep it apart from your wallet. Not on the same phone, not in the same notes app. |
| `card.rule2` | Never share it. No one from Arc Guard will ever ask for it. |
| `card.rule3` | If you lose it, your money isn't lost. Use the 7-day emergency exit. |
| `card.rule4` | No one can replace it for you. There's no copy anywhere else. |

### Printed and downloaded card (the face of the card, typewriter style)
```
┌──────────────────────────────────────────────────────────┐
│  ARC GUARD · SAFE DEPOSIT                    KEY CARD      │
│                                                          │
│  BOX No.        {boxNo}                                  │
│  HOLDER         {address}                                │
│  ISSUED         {YYYY-MM-DD}                             │
│  CARD PRINT     {A1B2-C3D4}                              │
│                                                          │
│  [ QR CODE ]    KEY 2 OF 2 · KEEP APART FROM YOUR WALLET │
│                                                          │
│  CARD CODE                                               │
│  {128 hex chars in 16 groups of 8, 4 groups per line}    │
│                                                          │
│  This card and your wallet together can take everything  │
│  out of your box. Keep them in different places.         │
│  Lost it? Your money isn't lost: use the 7-day           │
│  emergency exit at {appUrl}.                             │
│  Never share this card. No one will ever ask for it.     │
│                                                          │
│  Signature: SLH-DSA-SHA2-128s (NIST FIPS 205) · Arc      │
└──────────────────────────────────────────────────────────┘
```
- Download filename: `pq-guard-key-card-box-{boxNo}.json`. It includes a human-readable field: `"note": "Arc Guard key card for Box No. {boxNo}. Keep apart from your wallet. Never share."`
- Print footer (the line that tears off): `Cut along this line. Keep the card. Recycle the rest.`

### Loading the card (withdraw, cancel exit, replace card)
| Key | String |
|---|---|
| `card.load.title` | Key 2: your key card |
| `card.load.drop` | Drop your key card here, or choose the file |
| `card.load.btn.file` | Choose file |
| `card.load.btn.scan` | Scan printed card |
| `card.load.btn.type` | Type card code |
| `card.load.btn.remembered` | Use card on this device |
| `card.load.ok` | Card fits. Print {A1B2-C3D4}, Box No. {boxNo}. |
| `card.load.privacy` | The card stays in this browser. Only the signed slip is sent. |

### Replacing the card (`rotateKey`)
| Key | String |
|---|---|
| `rotate.title` | Replace your key card |
| `rotate.body` | You'll need your current card. Your box gets a new lock, and the old card stops working for good. |
| `rotate.btn` | Cut a new card |
| `rotate.done` | New card in use. The old card no longer opens Box No. {boxNo}. Destroy it. |
| `rotate.lost` | Lost the current card? You can't replace it without the card. Use the emergency exit instead. |

---

## 7. Your box

| Key | String |
|---|---|
| `box.title` | Box No. {boxNo} |
| `box.holder` | Holder {addrShort} |
| `box.total` | In your box: {total} USDC |
| `box.locker.label` | Locker |
| `box.locker.caption` | Sits here. Doesn't earn. |
| `box.savings.label` | Savings |
| `box.savings.vault` | Galaxy USDC vault on Morpho |
| `box.savings.rate` | {apy}% a year: about {centsPer100}¢ on every $100 |
| `box.savings.risk` | Earns by lending through Morpho. Small extra risk. |
| `box.savings.projection` | At this rate, your {savings} USDC earns about {yearly} USDC a year. |
| `box.savings.live` (aria) | Savings balance, updating as it earns |
| `box.savings.rate.loading` | Reading today's rate… |
| `box.savings.rate.unavailable` | Rate not available right now. Savings keeps earning either way. |
| `box.savings.loss` | Savings is worth {value} USDC, less than the {movedIn} USDC you moved in. This is the lending risk named below. The Locker isn't affected. |
| `box.savings.rounding` (small, under the jar after a move) | Savings counts in vault shares, so {amount} USDC can show as {amountMinus}. The vault rounds down by at most a millionth of a dollar. |
| `box.btn.deposit` | Deposit |
| `box.btn.move` | Move |
| `box.btn.withdraw` | Withdraw |
| `box.btn.passbook` | Passbook |
| `box.link.emergency` | Lost your key card? |
| `box.link.rotate` | Replace key card |
| `box.empty` | Your box is empty. Deposits go into the Locker first. |

**The APY is tiny (0.06%), so show it honestly without it looking dead.** Pair the live jar ticking in 6 decimals (`12.000431`) with `box.savings.rate`. Small and real beats a big number rounded to zero. Never show "0.1%" or "~0%".

### Move between compartments
| Key | String |
|---|---|
| `move.title` | Move between Locker and Savings |
| `move.body` | Money stays inside your box. Your wallet alone can do this. No key card needed. |
| `move.toSavings` | Locker → Savings |
| `move.toLocker` | Savings → Locker |
| `move.amount` | Amount |
| `move.max` | All |
| `move.btn` | Move {amount} USDC |
| `move.done.toSavings` | Moved. {amount} USDC is now in Savings, earning. |
| `move.done.toLocker` | Moved. {amount} USDC is back in the Locker. |
| `move.rounding` | Shows {amountMinus} instead of {amount}? The vault rounds down by at most a millionth of a dollar (0.000001 USDC). Interest soon covers it. |

---

## 8. Deposit, then choose

| Key | String |
|---|---|
| `deposit.title` | Make a deposit |
| `deposit.lead` | Every deposit goes into your Locker first. Then you choose where it stays. |
| `deposit.amount.label` | How much? |
| `deposit.amount.placeholder` | 0.00 |
| `deposit.wallet` | In your wallet: {walletBal} USDC |
| `deposit.max` | All but fees |
| `deposit.feeNote` | Keep a little USDC in your wallet for fees: about 0.01 USDC per action. |
| `deposit.step1` | Step 1 of 2: give the box permission to take {amount} USDC. |
| `deposit.step1.btn` | Give permission |
| `deposit.step2` | Step 2 of 2: deposit {amount} USDC. |
| `deposit.step2.btn` | Deposit {amount} USDC |
| `deposit.step.skip1` | Permission already given. One step. |
| `deposit.waiting` | Waiting for your wallet… |
| `deposit.confirming` | Arc is recording your deposit… |
| `deposit.done` | Deposited. {amount} USDC is in your Locker. |
| `deposit.done.stamp` | DEPOSITED |

### The Locker-or-Savings question
| Key | String |
|---|---|
| `choose.title` | Keep it in the Locker, or let it earn in Savings? |
| `choose.locker.title` | Locker |
| `choose.locker.body` | Just sits there. Nothing to do. Earns nothing. |
| `choose.locker.btn` | Keep in Locker |
| `choose.savings.title` | Savings |
| `choose.savings.vault` | Galaxy USDC vault on Morpho |
| `choose.savings.rate` | {apy}% a year: about {centsPer100}¢ on every $100 |
| `choose.savings.risk` | Earns by lending through Morpho. Small extra risk. |
| `choose.savings.btn` | Move to Savings |
| `choose.savings.fee` | One more confirmation in your wallet. No key card needed. |
| `choose.footnote` | You can change your mind anytime from your box. |
| `choose.done.locker` | Very good. {amount} USDC stays in your Locker. |
| `choose.done.savings` | Very good. {amount} USDC is in Savings, earning from now. |
| `choose.details` (expandable) | Savings deposits your USDC into the Galaxy USDC vault, a lending vault run on Morpho by a third party. Borrowers pay interest, which the vault passes on. If borrowers or the vault fail, some money could be lost, and sometimes withdrawals wait until funds are repaid. Arc Guard doesn't run the vault. |

---

## 9. Withdraw: two keys

| Key | String |
|---|---|
| `withdraw.title` | Take money out |
| `withdraw.lead` | This needs both keys. |
| `withdraw.from.locker` | From Locker (up to {locker} USDC) |
| `withdraw.from.savings` | From Savings (up to {savings} USDC) |
| `withdraw.to.label` | Send to |
| `withdraw.to.self` | Your wallet ({addrShort}) |
| `withdraw.to.other` | Another address |
| `withdraw.to.other.warn` | Check every character. Money sent to the wrong address can't be brought back. |
| `withdraw.summary` | {amount} USDC to {addrShort}. Fee about 0.01 USDC, paid to Arc. |
| `withdraw.key1.label` | Key 1 · your wallet |
| `withdraw.key1.ok` | In the lock: {addrShort} |
| `withdraw.key2.label` | Key 2 · your key card |
| `withdraw.key2.empty` | Load your key card to sign this withdrawal. |
| `withdraw.sign.btn` | Sign with key card |
| `withdraw.turn.btn` | Turn both keys |
| `withdraw.turn.sub` | Confirm in your wallet. Arc then checks both keys. |
| `withdraw.slipNote` | Your key card signs a slip for this exact amount and address, valid for {minutes} minutes. It can't be reused. |

### Signing wait (worker, about 1 s on desktop, 3–8 s on phones)
Copy is swapped by elapsed time, not by fake percentages. The progress bar is time-estimated and **shows no % number**. Line 1 appears at once. Desktop usually finishes before line 2.

| Key | At | String |
|---|---|---|
| `sign.wait.0` | 0 s | Your key card is signing… |
| `sign.wait.1` | 1.5 s | Signing takes a moment. This key is built heavy on purpose. |
| `sign.wait.2` | 4 s | Phones take a few seconds. Still signing. |
| `sign.wait.3` | 8 s | Nearly there. Keep this page open. |
| `sign.wait.4` | 20 s | This is taking longer than usual. You can keep waiting or cancel. Nothing has been sent. |
| `sign.cancel` | — | Cancel |
| `sign.done` | — | Signed. Key 2 is turned. |
| `sign.aria` | — | Signing with your key card. Nothing has been sent yet. |

### Sending
| Key | String |
|---|---|
| `withdraw.waitWallet` | Turn Key 1: confirm in your wallet… |
| `withdraw.confirming` | Arc is checking both keys… |
| `withdraw.slow` | Still waiting for Arc. Usually a second or two. Your wallet shows the latest status. |

### Success
| Key | String |
|---|---|
| `withdraw.done.title` | Both keys turned. |
| `withdraw.done.body` | {amount} USDC sent to {addrShort}. |
| `withdraw.done.receipt` | Receipt No. {txShort} |
| `withdraw.done.explorer` | See it on Arc's public record |
| `withdraw.done.left` | Left in your box: {total} USDC |
| `withdraw.done.stamp` | WITHDRAWN |
| `withdraw.done.close` | Back to my box |

---

## 10. Success lines (shared)
One line, then the money's status. No confetti language.

| Event | Line |
|---|---|
| Box opened | Box No. {boxNo} is open. |
| Permission given | Permission given. Now the deposit. |
| Deposited | Deposited. {amount} USDC is in your Locker. |
| Kept in Locker | Very good. It stays in your Locker. |
| To Savings | {amount} USDC is in Savings, earning from now. |
| To Locker | {amount} USDC is back in the Locker. |
| Withdrawn | Both keys turned. {amount} USDC sent. |
| Card replaced | New card in use. Destroy the old one. |
| Exit started | Emergency exit started. Opens {date} at {time}. |
| Exit cancelled | Exit cancelled. Your box is back to normal. |
| Exit paid | Exit paid. {amount} USDC sent to {addrShort}. Your box is now empty. |
| Card checked | Card checked. It fits Box No. {boxNo}. |

---

## 11. Passbook

| Key | String |
|---|---|
| `passbook.title` | Passbook · Box No. {boxNo} |
| `passbook.cols` | DATE · PARTICULARS · IN · OUT · BALANCE |
| `passbook.empty` | No entries yet. Your first deposit will be stamped here. |
| `passbook.loading` | Fetching your entries from Arc… |
| `passbook.lineLink` | Receipt |
| `passbook.note` | Every line is copied from Arc's public record. Tap a line to see its receipt. |
| `passbook.more` | Earlier entries |

### Stamp words (maximum 10 characters, rubber-stamp caps)
| Event | Stamp | Ink | Particulars line |
|---|---|---|---|
| `Opened` | OPENED | green | Box opened · card {print} |
| `Deposited` | DEPOSITED | green | Deposit from {addrShort} |
| `Moved` (→ Savings) | SAVED | brass | Locker → Savings |
| `Moved` (→ Locker) | TO LOCKER | brass | Savings → Locker |
| `PQVerified` | KEY 2 OK | green | Key card verified by Arc |
| `Withdrawn` | WITHDRAWN | ink | Paid to {addrShort} |
| `KeyRotated` | NEW CARD | ink | Key card replaced · new print {print} |
| `EscapeRequested` | EXIT STARTED | red | Emergency exit to {addrShort} · opens {date} |
| `EscapeCancelled` | CANCELLED | green | Emergency exit cancelled with key card |
| `EscapeExecuted` | EXIT PAID | red | Emergency exit paid to {addrShort} |
| (derived) | INTEREST | brass | Interest earned in Savings, {from}–{to} |

- **INTEREST is not an on-chain event.** Interest accrues continuously. Show it as a derived line only at statement breaks (for example, before each Savings move or withdrawal, and "to date" at the top). Give it no receipt link, and mark it with the note `Calculated, not a transaction.` This keeps "every line links to Arc" true for real entries.
- `PQVerified` and `Withdrawn` fire in the same transaction. Merge them into one line stamped WITHDRAWN, with a small secondary stamp `KEY 2 OK`.
- `EXIT STARTED` is 12 characters, the one allowed exception, because it has to be unmistakable. If the stamp art can't fit it, use `EXIT`.

---

## 12. Emergency exit

### Explanation (the "Lost your key card?" screen)
| Key | String |
|---|---|
| `exit.title` | Lost your key card? |
| `exit.lead` | Your money isn't lost. |
| `exit.body` | Start the emergency exit with your wallet alone. After 7 days, everything in your box, Locker and Savings, is paid to the address you choose. |
| `exit.why` | Why 7 days? So that someone with only your wallet can't empty your box at once. During the wait, your key card can cancel the exit. |
| `exit.to.label` | Pay everything to |
| `exit.to.self` | This wallet ({addrShort}) |
| `exit.to.other` | Another address |
| `exit.warn.address` | Check this address carefully. In 7 days the whole box goes there, and it can't be undone. |
| `exit.warn.cancel` | If you find your card, you can cancel. Anyone holding your key card can cancel too. |
| `exit.warn.after` | After it's paid out, your box is empty. To keep saving here, open a new box with a new card. **[CHECK: can the same wallet reopen after an executed exit?]** |
| `exit.found` | Have your card after all? You don't need this. Withdraw normally. |
| `exit.btn` | Start 7-day exit |
| `exit.confirm` | Start the exit? In 7 days, {total} USDC goes to {addrShort}. |
| `exit.confirm.yes` | Yes, start it |
| `exit.confirm.no` | Go back |

### Pending (must be impossible to miss)
| Key | String |
|---|---|
| `exit.tag` (red tag on the box) | EXIT PENDING |
| `exit.banner` | Emergency exit pending. In {countdown}, everything in this box goes to {addrShort}. |
| `exit.countdown` | {d} days {hh}:{mm}:{ss} |
| `exit.countdown.aria` | Emergency exit opens in {d} days and {h} hours. |
| `exit.notMe` | Didn't start this? Someone may have your wallet. Cancel now with your key card, then withdraw everything to a new wallet. |
| `exit.cancel.btn` | Cancel with key card |
| `exit.cancel.body` | Load your key card. Anyone can send the cancellation, but only your key card can sign it. |
| `exit.cancel.done` | Exit cancelled. Your box is back to normal. |
| `exit.pending.withdrawNote` | While an exit is pending, you can still withdraw with both keys. **[CHECK contract behaviour.]** |

### Ready
| Key | String |
|---|---|
| `exit.ready.title` | The exit is open. |
| `exit.ready.body` | {total} USDC can now be paid to {addrShort}. |
| `exit.ready.btn` | Pay out now |
| `exit.ready.note` | Anyone can press this; the money only ever goes to {addrShort}. |
| `exit.paid` | Exit paid. {amount} USDC sent to {addrShort}. Your box is now empty. |

---

## 13. Error messages
The formula is: **what happened. Where the money is. What to do.** Never show raw revert strings, hex or stack traces. Put those in a collapsed "Details for developers" row.

### Wallet and network
| Key | String |
|---|---|
| `err.noWallet` | No wallet found in this browser. Install a wallet app, or look around the demo box first. |
| `err.rejected` | You cancelled in your wallet. Nothing was sent. |
| `err.wrongNetwork` | Your wallet is on another network. Switch to Arc to continue. [Switch to Arc] |
| `err.addNetworkFailed` | Your wallet didn't add Arc. Add it by hand (details below), then try again. Nothing was sent. |
| `err.accountChanged` | You switched wallets. This is Box No. {boxNo}. |
| `err.accountChanged.noBox` | This wallet has no box yet. [Open a box] |
| `err.disconnected` | Your wallet disconnected. Your money hasn't moved. [Reconnect] |
| `err.rpc` | Can't reach Arc right now. Your money hasn't moved. Try again in a minute. |
| `err.txDropped` | Arc didn't receive that. Nothing was sent. Try again. |
| `err.txTimeout` | No answer from Arc yet. Check your wallet's activity before trying again, so you don't send twice. |

### Amounts and fees
| Key | String |
|---|---|
| `err.amount.empty` | Enter an amount. |
| `err.amount.zero` | Enter an amount above zero. |
| `err.amount.decimals` | USDC goes to 6 decimal places at most. |
| `err.amount.overWallet` | You have {walletBal} USDC in your wallet. Enter that or less. |
| `err.amount.overLocker` | Your Locker holds {locker} USDC. Enter that or less. |
| `err.amount.overSavings` | Your Savings hold {savings} USDC. Enter that or less. |
| `err.fee.low` | Not enough USDC in your wallet for the fee (about 0.01 USDC). Add a little USDC to your wallet. Nothing was sent. |
| `err.approve.failed` | Permission wasn't given. Nothing was deposited. Try step 1 again. |

### Box state
| Key | String |
|---|---|
| `err.box.alreadyOpen` | This wallet already has a box: No. {boxNo}. [Go to my box] |
| `err.box.none` | This wallet has no box yet. [Open a box] |
| `err.box.changed` | Your box changed while you were signing (another action went through first). Nothing was sent. Sign again. |

### Key card
| Key | String |
|---|---|
| `err.card.notCard` | That file isn't a Arc Guard key card. Look for `pq-guard-key-card-box-{boxNo}.json`. |
| `err.card.damaged` | This key card is damaged or incomplete. Try another copy, or your printed card. |
| `err.card.otherBox` | This key card is for Box No. {otherBox}, not Box No. {boxNo}. Nothing was sent. |
| `err.card.replaced` | This card was replaced on {date} and no longer opens your box. Use your newest card. |
| `err.card.noMatch` | This card doesn't fit your box's lock. Nothing was sent. Try another copy, or use the emergency exit. |
| `err.card.typo` | The card code doesn't check out. Look for a mistyped character in group {n}. |
| `err.card.scan` | Couldn't read the QR code. Try more light, or type the card code instead. |
| `err.card.camera` | Camera access is off. Allow it in your browser settings, or type the card code. |
| `err.card.remembered.gone` | The card saved on this device is gone (browser data was cleared). Load your saved card instead. |

### Signing
| Key | String |
|---|---|
| `err.sign.crashed` | Your browser stopped the signing, probably to save memory. Close other tabs and try again. Nothing was sent. |
| `err.sign.unsupported` | This browser can't sign with a key card. Try a recent Chrome, Safari or Firefox. Your money hasn't moved. |
| `err.sign.expired` | The signed slip expired before it reached Arc (slips last {minutes} minutes). Nothing was sent. Sign again. |
| `err.sign.rejectedOnChain` | Arc didn't accept the key card's signature. Nothing was sent. Load your card again and retry. If it happens again, the card may not match your box. |
| `err.keygen.failed` | Couldn't cut your key card. Reload the page and try again. Your box hasn't been opened yet. |
| `err.download.blocked` | Your browser blocked the download. Print the card, or copy its text. |

### Withdraw and Savings
| Key | String |
|---|---|
| `err.to.invalid` | That isn't a valid address. Check it and try again. |
| `err.to.box` | That's the box's own address. Send to a wallet instead. |
| `err.to.blocked` | USDC can't be sent to this address: it's on the USDC blocked list. Nothing was sent. Choose another address. |
| `err.savings.full` | The Savings vault isn't taking deposits right now (it's full). Your money stays in the Locker. |
| `err.savings.limited` | Savings can pay out only {max} USDC right now. The rest is lent out. Take up to {max} now, or try later. The rest stays in Savings, still earning. |
| `err.savings.unavailable` | Can't reach the Savings vault right now. Your money hasn't moved. Try again shortly. |

### Emergency exit
| Key | String |
|---|---|
| `err.exit.pending` | An exit is already pending. It opens {date}. |
| `err.exit.notReady` | The exit opens {date} at {time}. Not yet. |
| `err.exit.none` | There's no exit to cancel. Your box is normal. |
| `err.exit.to.invalid` | That isn't a valid address. The whole box would go there, so check it and try again. |

### Fallback
| Key | String |
|---|---|
| `err.unknown` | That didn't go through, and the reason isn't clear. Your money hasn't moved. Try again, or open Details for developers. |

`err.unknown` must only say "hasn't moved" when the app has confirmed the transaction reverted or never reached Arc. If that's unknown, use `err.txTimeout` instead.

---

## 14. No-wallet paths: a real box and a practice card
Recommended by UXJourney: no pretend money anywhere. Judges see a real box read-only, and can make Arc check a real Key 2 signature themselves (an `eth_call` to the PQ precompile; nothing is written, so there's no receipt).

### See a real box (read-only)
| Key | String |
|---|---|
| `tour.ribbon` | A REAL BOX · VIEW ONLY |
| `tour.lead` | This is the builder's own box, live on Arc. You can look at everything. Only its two keys can move anything. |
| `tour.passbookNote` | Every line here is a real entry. Tap one to see its receipt on Arc's public record. |
| `tour.btn.disabled` (on Deposit, Move, Withdraw) | View only. Open your own box to use this. |
| `tour.cta` | Open your own box |
| `tour.cta.practice` | Try Key 2 yourself |

### Try Key 2 yourself (practice card)
| Key | String |
|---|---|
| `practice.title` | Try Key 2 yourself |
| `practice.lead` | Cut a practice key card in your browser, sign a slip, and ask Arc to check it. No wallet, no money, no fee. |
| `practice.step1.btn` | Cut a practice card |
| `practice.step1.done` | Practice card cut. Print {A1B2-C3D4}. It opens no box. |
| `practice.slip` | SLIP: "Pay 10.00 USDC to 0x12ab…90cd". A sample message. Nothing will be paid. |
| `practice.step2.btn` | Sign the slip |
| `practice.step2.working` | Your practice card is signing… (the same wait messages as `sign.wait.*`) |
| `practice.step3.btn` | Ask Arc to check |
| `practice.step3.working` | Arc's built-in checker is reading the signature… |
| `practice.ok.stamp` | GENUINE |
| `practice.ok` | Arc says: genuine. The live network checked this signature in {ms} ms. Nothing was written, so there's no receipt. |
| `practice.tamper.btn` | Change one letter |
| `practice.tamper.done` | Slip changed: "Pay 10.00 USDC" is now "Pay 90.00 USDC". |
| `practice.bad.stamp` | REFUSED |
| `practice.bad` | Arc says: not genuine. Change one letter and the signature no longer fits. A forged or altered slip can't open a box. |
| `practice.discard` | This practice card is thrown away when you leave. Real cards are cut when you open a box. |
| `practice.cta` | Open a real box |
| `practice.err.rpc` | Can't reach Arc right now, so the check didn't run. Try again in a minute. |

### Fallback only: pretend box (if Main keeps it)
If a pretend box stays in, it must be labelled on every screen, and it can never link to a fake receipt.

| Key | String |
|---|---|
| `demo.ribbon` | PRACTICE BOX · PRETEND MONEY |
| `demo.lead` | Everything works as it would, but no money moves on Arc. |
| `demo.explorer` | In a real box, this links to Arc's public record. [See a real one] |
| `demo.exit` | Leave practice box |

---

## 15. Footer and About

`footer.disclosure` (always visible, body size, AA contrast):

> Arc Guard is open-source software (MIT), not a bank. It's non-custodial: your money sits in a smart contract on Arc that only your two keys can open. We hold no key and can't move it. **[CHECK]** Not insured. Not approved, endorsed or run by Circle. Savings uses the Galaxy USDC vault on Morpho, run by third parties, and lending carries risk. The contract is new and has not been audited **[CHECK before launch]**; a bug could lose funds. Anyone with both your wallet and your key card can take everything. Deposit only what you can afford to lose.

`footer.links`: Source code · Contract on Arc · How it works · Risks

`about.short`: Arc Guard is a two-key safe deposit box for USDC on Arc. PQ stands for post-quantum: your second key uses a signature designed to resist quantum computers. Built for Arc Microgrants and open for anyone to read.

`meta.title`: Arc Guard: a safe deposit box for your digital dollars
`meta.description`: Keep USDC on Arc behind two keys: your wallet, and a key card built to resist quantum computers. Locker or Savings. Open source.
