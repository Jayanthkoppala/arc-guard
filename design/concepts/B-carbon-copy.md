# Carbon Copy

```json
{
  "name": "Carbon Copy",
  "mood": "Quiet. Inked. Kept.",
  "premise": "The passbook IS the app. No vault-door hero: you sit at a private booth beside the teller's window, your passbook open on green counter cloth under a lamp. Every chain event is an original (Arc tx) and a carbon copy (a stamped line in your book). Transactions are paper slips you push under the frosted glass and get back stamped. Steel and weight appear only in sound and a few brass details; paper does the rest.",
  "hero_screen": "Top-down first-person view. A closed passbook (deep green cloth, brass-foil 'SAFE DEPOSIT PASSBOOK', a typed paper label 'Box No. ____') lies on counter cloth #1F3D33; a warm lamp radial (#F6D28A @ 0.18) from top-left; frosted teller glass along the top 18% of the viewport. A paper slip clipped to the cover reads, typed: 'Your dollars, behind two keys.' A small brass-edged card: 'Protected against quantum computers.' Single CTA slip: 'Present your wallet'.",
  "screens": {
    "landing": "Lamp warms up 300 ms, passbook slides in from bottom 600 ms cubic-bezier(0.2,0.7,0.2,1). 'Present your wallet' = the slip is pushed up under the glass (swipe or tap). Arc added silently. On connect the cover opens (rotateY 0→-160°, 700 ms, transform-origin left) and the box number types onto the label at 40 ms/char.",
    "open_box_key_card": "Page 1. Headline (Caslon) 'Opening Box No. 4471'. The PQ key generates while a carbon-paper bar darkens left→right. The key card is a 5×3 index card with a perforated top edge: 'KEY CARD — KEEP THIS', typed fingerprint, box no., date. 'Tear off' = drag along the perforation ≥80 px (or tap 'Tear off'); the card lifts 12° and the file downloads. Then the user presses a rubber stamp 'SAVED — I HAVE PUT IT AWAY' (this is the confirm checkbox). 'Remember on this device' is a tick box with a typed warning line. open() runs → teller stamps 'OPENED' in red with date.",
    "box_view": "Passbook open on the Balances spread. Left page LOCKER: a drawer's paper tag, balance 28 px Courier Prime bold, 'Sits still. Nothing touches it.' Right page SAVINGS: a small glass coin jar SVG sits on the counter beside the page; balance ticks in its last two decimals every ~3 s (real share price); typed footnote 'Galaxy USDC vault on Morpho · 0.06% APY' + risk line 'Earns by lending through Morpho. Small extra risk.' Three slips clipped to the bottom edge: Deposit slip / Transfer slip / Withdrawal slip.",
    "deposit_then_choose": "Deposit slip slides down from under the glass (500 ms). One lined field: amount. Push it under the glass → approve+deposit (slip stays under glass = pending, top edge blurred by backdrop-filter blur(6px)). It returns stamped 'DEPOSITED' (thud). A second slip drops: 'Keep it in the Locker, or let it earn in Savings?' two tick boxes; Savings shows live APY and the risk line. Locker → slip filed, done. Savings → moveToSavings, then 'SAVED' stamp in carbon blue + coin clink; jar level rises 400 ms.",
    "withdraw_two_key": "Withdrawal slip with two signature lines. Line 1 'Depositor (wallet)': after wallet confirm, a Homemade Apple scrawl draws in over 500 ms (stroke-dashoffset). Line 2 'Key card': drop/upload the card file onto the slip; the slip lifts and a carbon sheet lies over it; the impression darkens left→right as a real progress bar for 1–8 s, typed status 'Verifying key card… a few seconds on phones.' On verify: key-turn + clunk, second scrawl draws, slip goes under the glass, returns with 'WITHDRAWN' red stamp and a perforated receipt tab 'Receipt · arc tx 0x…' that tears off to the explorer. Wrong card: red typed line 'This card doesn't fit Box 4471.' No stack trace.",
    "passbook": "The same book, Ledger pages. Rows: DATE | ENTRY | STAMP | AMOUNT | BALANCE in Courier Prime 14 px; stamps in Stardos Stencil rotated −3…+3° seeded by tx hash: DEPOSITED green, SAVED carbon blue, WITHDRAWN red, INTEREST brass. Each row is a link (underline in ink). Pages paginate with a 700 ms curl; a carriage-return bell on page end.",
    "emergency": "A red paper tag 'Lost your key card?' is always clipped to the book's fore-edge. Pull it → 'Notice of Emergency Withdrawal' form → requestEscape. A red-bordered notice is then stapled ACROSS both balance pages with 'PAYS OUT IN 6d 23:59:41' typed at 32 px; the book cannot be closed while it's stapled, and the cover shows a red tag on landing. 'Cancel with key card' stamps 'CANCELLED' over the notice."
  },
  "palette": {
    "paper": "#F3ECD8",
    "paper_aged": "#E8DCBF",
    "ink": "#1E2430 (13.2:1 on paper)",
    "counter_green": "#1F3D33 (paper text on it 10.0:1)",
    "brass_rule": "#B08D3C (ornament only; 2.65:1, never text)",
    "brass_text": "#6F5416 (6.0:1 on paper)",
    "stamp_red": "#A8322A (5.6:1 on paper)",
    "carbon_blue": "#4A4F8C (6.4:1 on paper)",
    "note_grey": "#5A5548 (6.3:1)",
    "alert_field": "#B3261E (paper on it 5.5:1)",
    "lamp_glow": "#F6D28A @ alpha 0.18 radial"
  },
  "fonts": [
    "Libre Caslon Text — headings + body (drawn from 1950s ad lettering) — https://fonts.google.com/specimen/Libre+Caslon+Text",
    "Courier Prime — every number, ledger, form field (IBM Courier, 1956) — https://fonts.google.com/specimen/Courier+Prime",
    "Stardos Stencil — stamp words only — https://fonts.google.com/specimen/Stardos+Stencil",
    "Homemade Apple — signature scrawls, decorative only — https://fonts.google.com/specimen/Homemade+Apple",
    "Rejected: Special Elite (grunge kills numerals at 14 px on phones)."
  ],
  "signature_interaction": "'Push it under the glass.' Every chain action is a slip you slide up under the frosted teller glass (drag ≥80 px or tap 'Hand it over'). Submitted = slip leaves your hand; pending = slip sits under the glass, top blurred, wallet popup opens; confirmed = slip comes back stamped with a thud. One gesture maps 1:1 to the tx lifecycle and is native to a phone thumb.",
  "sound_cues": {
    "master": "all → GainNode 0.6 → DynamicsCompressor → destination; AudioContext resumed on first gesture; mute toggle in cover.",
    "stamp_thud": "white-noise buffer → BiquadFilter lowpass 400 Hz + OscillatorNode sine 90 Hz; gain 0→1 in 5 ms, exp→0.001 in 140 ms; plus 15 ms bandpass 2 kHz noise for the rubber slap.",
    "typewriter_key": "noise → bandpass 3 kHz Q 8 → gain 0.25, 12 ms, per character, throttled to 20/s.",
    "carriage_bell": "triangle 2100 Hz → gain 0.15 exp ramp to 0.001 over 600 ms.",
    "paper_slide": "pink-noise buffer → bandpass 1.2 kHz Q 0.7 → gain swell 0→0.3→0 over 300 ms.",
    "coin_clink": "sines 3800 Hz + 5200 Hz (detune +4 cents), gain 0.2, exp decay 80 ms.",
    "key_turn_clunk": "lowpass 600 Hz noise 250 ms, then sine 60 Hz 100 ms gain 0.5 → the only 'steel' sound; reserved for verified key card."
  },
  "motion_tokens": "paper: 600 ms cubic-bezier(0.2,0.7,0.2,1); stamp: 180 ms cubic-bezier(0.6,0,1,1) scale 1.4→1, mix-blend-mode multiply, filter blur(0.3px) for bleed; page curl 700 ms; typing 40 ms/char. Reduced motion: no slide/curl/typing — elements fade 150 ms; carbon progress bar stays (it is information, not decoration).",
  "phone_legibility": "A passbook is portrait already: one page per 390 px screen, the two-page spread stacks vertically with the jar atop the Savings page. Ledger 14 px/1.45 Courier Prime, balances 28 px, amounts right-aligned (monospace = free tabular figures). Paper grain = SVG feTurbulence at 0.06 opacity, never behind text; ink on paper stays ≥11:1 on aged paper. Slips are the buttons, so targets are ≥56 px tall. Signing wait shows elapsed seconds so 8 s feels deliberate.",
  "biggest_risk": "Reads 'quaint' instead of 'fortress'. Paper is intimate but light; the brief wants weight. Mitigations: the frosted glass is always on screen (someone is on the other side), the box view carries a small steel-door SVG on the cover ('Box 4471 · Vault Level B'), and every withdrawal ends with the one steel sound — key turn and clunk — before the stamp. Second risk: 3D page curl on low-end Android; measure the first two flips and fall back to crossfade under 50 fps."
}
```
