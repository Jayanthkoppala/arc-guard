# The Big Door: a cinematic vault

**Mood:** monumental, hushed, certain.

**Premise:** the camera belongs to the customer. Each screen is one shot inside a grand 1950s bank's strongroom: cold steel, one warm lamp and heavy mechanisms you can hear. Safety feels real here because everything has weight and moves slowly.

## Hero screen (landing)
- A round vault door fills about 88% of the viewport, drawn as a single inline SVG of about 12 KB.
- The door has 12 radial locking bolts, a five-spoke brass handwheel in the centre and a combination dial above it. An engraved plaque reads *"Your dollars, behind two keys."* A smaller plaque reads *"Protected against quantum computers."*
- Behind the door is near-black. A thin line of amber lamplight leaks around the seam.
- **CTA:** the wheel itself. The label under it says "Turn to open". A normal "Open the vault" button sits below as a fallback.

## Screens
1. **Landing.** Connecting the wallet sets off the whole sequence: the wheel spins 180° (900 ms, `cubic-bezier(.6,0,.2,1)`), the 12 bolts pull back one at a time 60 ms apart, and the door swings on its left hinge (`rotateY(-78deg)`, 1400 ms). Light floods in. The whole intro is capped at 2.4 s and a tap skips it.
2. **Open a box + key card.** The view slowly pushes into a wall of numbered brass-rimmed boxes (scale 1→1.6, 1200 ms). One box, numbered from the address (e.g. **No. 4417**), lights up. The key card deals onto the table: an ivory card with a brass edge, blind-embossed box number and an engraved serial. It carries a "Save it" button (download or print) and a checkbox: "I've put my key card somewhere safe". Ticking it runs `open()`.
3. **Box view.** The box sits pulled out on a green baize table under a lamp.
   - **Left, the Locker drawer:** brushed steel with a typewritten balance label.
   - **Right, the Savings jar:** glass, brass lid. The coin pile's height scales with the log of the balance, so small amounts still fill it visibly.
   - Below the jar is a live counter in Courier Prime, showing 6 decimals so it visibly ticks.
   - The APY is stated honestly: "0.06% a year — about 6¢ per $100". The risk note sits under the jar: *"Earns by lending through Morpho. Small extra risk."*
4. **Deposit, then choose.** The coins drop into the Locker tray (the coin clink sound) and a DEPOSITED stamp lands on a slip. Then two brass-framed doors appear: **"Keep it in the Locker"** and **"Let it earn in Savings"**. The Savings door carries the APY and the risk line.
5. **Two-key withdraw.** Two keyholes on the front of the box.
   - **Key 1 (wallet):** turns as soon as the wallet is connected.
   - **Key 2 (key card):** the card slides into a slot, and the signing wait becomes a **time-lock chronometer**. Real 1950s vaults had time-locks, so waiting reads as part of the security.
   - The chronometer is a brass dial with a sweeping hand driven by the worker's progress. 12 tumbler pins drop, one per 1/12 of the progress, each with a tick. Copy: "Checking your key card. Slow on purpose: 3–8 s on phones."
   - At 100% both keys turn together with a clunk and the box slides out 40 px. The explorer link appears as a torn receipt slip.
6. **Passbook.** A steel ledger drawer opens onto ivory pages. Lines type out in Courier Prime at 18 ms per character (only the newest line animates). Rubber stamps (DEPOSITED, SAVED, WITHDRAWN, INTEREST) are rotated −3° to 4° with ink at 85% opacity, and each line links to its transaction.
7. **Emergency.** A 7-day chronometer is mounted on the vault door, in big Courier Prime digits (d:hh:mm). A red paper tag hangs on the box. A header banner stays up on every screen while an exit is pending. **"Cancel with key card"** reuses the key-card slot.

## Palette
| Token | Hex | Use |
|---|---|---|
| vault-black | `#0E1512` | background |
| baize | `#1F3B2E` | panels |
| steel | `#8A949A` | secondary text; about 5.9:1 on background |
| steel-hi | `#C9D1D4` | highlights |
| brass | `#B8893B` | accent text; about 5.8:1 on background |
| brass-hi | `#E2C07A` | highlights |
| ivory | `#F2EAD7` | text; about 15:1 on background |
| ink | `#1E1B16` | text on paper |
| lamp | `#FFB957` | glow only, never text |
| alert | `#B3261E` | alerts; about 5.8:1 on ivory |

## Fonts
- **Cinzel** (plaques, headings): https://fonts.google.com/specimen/Cinzel
- **Libre Caslon Text** (body): https://fonts.google.com/specimen/Libre+Caslon+Text
- **Courier Prime** (numbers and passbook): https://fonts.google.com/specimen/Courier+Prime
- Use `font-variant-numeric: tabular-nums`.

## Signature interaction
**Spin the handwheel.** A pointer drag rotates the wheel. Past 150° it snaps, the bolts retract in sequence and the door swings open. The same wheel returns on the withdraw screen as the final "open" action, which ties the journey together.

## Sound (Web Audio)
Starts muted until the first gesture, with a toggle in the top-right corner. Master gain is 0.5.

Shared **hall reverb:** a ConvolverNode with a synthetic impulse (stereo noise × e^(−t/0.5), 2.2 s long). Each sound sends 0.25 to it.

| Sound | Web Audio graph |
|---|---|
| Door | Brown-noise buffer → lowpass 180 Hz → gain envelope 0→0.8 (300 ms) →0 (1.8 s), plus a 42 Hz sine rumble |
| Bolts | 12 × 40 ms noise bursts → bandpass 900 Hz (Q 4), 60 ms apart |
| Key turn | 3 clicks: noise → highpass 2 kHz, 15 ms each, 70 ms apart |
| Clunk | Sine 90→50 Hz over 120 ms, plus noise → lowpass 400 Hz, 250 ms decay |
| Stamp | Sine 70 Hz, 80 ms, plus noise → lowpass 600 Hz |
| Coin | Sines at 2637 Hz and 3951 Hz, exponential decay over 400 ms |
| Tumbler tick | Square wave 1.2 kHz, 8 ms → bandpass |

## Fast and legible on a phone
- Everything is SVG plus CSS gradients: no WebGL, no images over 20 KB, and no `filter: blur`. The lamp is a `radial-gradient`.
- Only `transform` and `opacity` are animated.
- When `pointer: coarse` matches, the 3D door swing becomes a scale-and-fade (600 ms).
- In portrait, the drawer stacks above the jar. Body text is at least 16 px ivory on vault-black, and tap targets are at least 48 px.
- **Reduced motion:** every sequence becomes a 200 ms crossfade, and the tumbler pins become a plain progress bar. The short sounds stay, but the door and reverb tails are dropped.

## Biggest risk
The cinematic weight could eat the reviewer's 2 minutes and read as a casino or game, and a dark steel room can feel cold rather than safe. Mitigations:
- Cap the intro at 2.4 s and let a tap skip it.
- Put warm lamp amber on every money surface.
- Keep every number in calm, plain type.