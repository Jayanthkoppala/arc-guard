# Arc Guard Build Plan

**Goal:** a two-key (wallet + post-quantum) USDC safe deposit box on Arc mainnet, with a Locker and a Savings compartment and an old-world-bank interface, submitted to Arc Microgrants in the first review batch.

**Order (Jay, 25 Sep):** design first, then the technical build. Phase 1 settles the whole UI and UX through parallel design agents and ends in a clickable prototype of the reviewer's journey. Phase 2 builds the contract and the real app to match that prototype.

**Spec:** `docs/specs/2026-09-25-pq-guard-design.md`

## Global constraints
- Global nostalgia: a 1950s bank (vault door, safe deposit boxes, brass, a passbook). No culture-specific references.
- Copy never says "unhackable" or "approved by Circle". Savings is labelled "Galaxy USDC vault on Morpho" and always carries a one-line risk note.
- Every deposit lands in the Locker first. Then the app asks: Locker or Savings?
- Free fonts and assets only (Google Fonts, OFL or self-made). No paid libraries. Sounds are synthesised with Web Audio or come from CC0 sources.
- Works on phones and desktop, and respects `prefers-reduced-motion`.
- The reviewer's journey must fit in about 2 minutes and end on a real Arc explorer transaction (Phase 2).

## Review focus
- A reviewer with no wallet must still be able to watch the full story (demo mode, or a recorded real box).
- A lost or wrong key card needs a clear, calm error, not a stack trace.
- PQ signing takes about 1 s on a Mac and 3–8 s on a phone, so the UI needs a progress state that feels deliberate rather than broken.
- The Savings APY is tiny (0.06%). The UI must show it honestly without looking dead.
- A pending emergency exit must be impossible to miss.

---

## Phase 1: Design (today)

### Task 1: Design research wave (parallel agents)
Output files go in `design/research/`:
1. `typography.md`: 2–3 type pairings (display serif, body, typewriter numerals) with Google Fonts links, a size scale, and a sample of how numbers look.
2. `color-material.md`: palette tokens (bank green, brass, ivory paper, ink, alert red) with WCAG contrast checks, plus material recipes in pure CSS (brushed steel, brass, paper grain, lamp glow).
3. `sound-motion.md`: Web Audio recipes (vault door, key turn, clunk, stamp, coin clink, tick), motion timing and easing tokens, and the reduced-motion fallback.
4. `ux-journey.md`: the reviewer's 2-minute journey second by second, every screen with its states (empty, loading, signing, success, error, emergency pending), and the deposit-then-choose flow.
5. `copy.md`: voice and tone, plus every string: headlines, buttons, the risk note, key-card instructions, errors, passbook stamp words.
6. `references.md`: real-world and digital references (film vault scenes, vintage passbooks, safe deposit rooms, skeuomorphic apps that feel trustworthy), each with what to borrow and what to avoid.

In parallel, three concept ideators (Opus, Fable, Astra) each propose one radically different art direction within the 1950s-bank brief. Output: `design/concepts/*.md`.

### Task 2: Prototype wave
From the research and the concepts, build three single-file clickable HTML prototypes (`design/prototypes/A.html`, `B.html`, `C.html`), one per art direction. Each covers:
- landing (vault door)
- opening a box (key card)
- deposit, then choose Locker or Savings
- the box view (drawer and jar)
- a two-key withdrawal with a signing progress bar
- the passbook
- the emergency exit

Chain calls are mocked, and each prototype ends on a mock explorer link. Sounds and motion are included.

### Task 3: Review and pick
I screenshot every prototype on desktop and phone in the browser, check the sound and motion, and score each against the spec and the review focus. Jay picks one, or a mix. The chosen tokens go into `design/system.md` (fonts, colours, spacing, motion, sounds, components).

---

## Phase 2: Tech (after the design is locked)
Before it starts, this phase will be expanded into full test-first steps, because the component structure depends on the chosen prototype.

### Task 4: Toolchain
Install arc-foundry. Check the PQ precompile locally with a noble test vector; if it isn't there, fall back to a `vm.etch` mock plus one mainnet fork test. Generate PQ fixtures with a Bun script.

### Task 5: `PQGuard.sol` (test-first)
Functions: `open(bytes32 pqKey)`, `deposit(uint256)`, `moveToSavings(uint256)`, `moveToLocker(uint256 shares)`, `withdraw(address to, uint256 lockerAmount, uint256 shares, uint256 deadline, bytes pqSig)`, `rotateKey(bytes32, uint256, bytes)`, `requestEscape(address)`, `cancelEscape(uint256, bytes)`, `executeEscape()`.

Tests: good and bad signature, replay, wrong owner, expired deadline, deposit, move both ways, withdraw, rotate, and escape/cancel/execute.

### Task 6: Mainnet deploy
Needs Jay's funded wallet. Deploy at 30 gwei, verify with Standard JSON on explorer.arc.io, and record the addresses.

### Task 7: Real app
Build the chosen prototype in Vite + React + viem + wagmi: signing in a web worker, a passbook built from events, a live APY from the vault's share price, and demo mode.

### Task 8: Real demo and launch
Fund a box, move money into Savings, make one two-key withdrawal on mainnet. Deploy to Vercel. Write the README (threat model, gas table, addresses, transaction links). Record a 90-second video. Submit on DoraHacks. Post the community ask (with Jay's OK).
