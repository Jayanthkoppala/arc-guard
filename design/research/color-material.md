# Arc Guard: colour and material research

Status: research for the prototype round. Chosen tokens move to `design/system.md` afterwards.
Every contrast ratio below was computed with the WCAG 2.x relative-luminance formula (script in §6). Every CSS recipe in §4 was rendered in Chromium at 1400×1000 and 390×844 before it was written here.

---

## 1. Decision: a dark room with light paper (one fixed scheme, no toggle)

**We ship one scheme with two layers:**
- **The room** is dark: lacquered bank green `#0F2A1F`, lit from above by a warm lamp and falling into shadow at the corners. The vault door, the drawers, the keyholes and the brass all sit in it.
- **The paper** is light: ivory `#F6EFDC`. The passbook, the key card, forms, amounts and the risk note are all printed on it.

We ignore `prefers-color-scheme` and don't offer a light/dark toggle.

Why:
1. **Lamp glow needs darkness.** A warm pool of light only reads against a dim room. On an ivory page it just looks like a beige gradient, and the nostalgic "after-hours bank hall" feeling goes with it.
2. **Metal needs darkness to look like metal.** Brass and steel read as metal because of specular highlights, and a highlight is only visible when it is much brighter than its surroundings. On a light background, brushed steel looks like grey plastic and brass looks like mustard.
3. **Reading still happens on light paper.** Anything a saver must read (amounts, the passbook, the risk line, key-card instructions) is `--ink-900` on `--paper-100` at **15.05:1**. That is better than any dark-mode body text, and it's the "typewriter passbook" in the brief. Paper also stays readable on a phone in sunlight, where fully dark UIs wash out.
4. **Money on paper feels safe; money on black feels like crypto.** An all-dark UI with gold accents looks like a casino or trading app. Keeping the dark to the *room* while the *content* stays on paper keeps it a bank. **Rule: on the inner screens (Your box, Passbook, Withdraw), paper covers at least 55% of the viewport.** Only the landing (vault door) is mostly dark.
5. **One scheme halves the QA work.** The judges see it for about two minutes. That time goes into material quality, not a second theme.

Set `color-scheme: dark` on `:root` and `color-scheme: light` on `.paper` so native inputs, scrollbars and date pickers match the surface they sit on (see recipe §4.3).

---

## 2. Palette tokens

```css
:root {
  color-scheme: dark;

  /* Bank green: the room (walls, wainscot, lacquer) */
  --green-900: #0F2A1F;   /* page background */
  --green-800: #16392A;   /* raised panels, counter top */
  --green-700: #1E4D38;   /* secondary button fill */
  --green-500: #2F6B4F;   /* DECORATIVE ONLY: rules, dividers, pinstripes */

  /* Vault steel: door, drawers, keyholes */
  --steel-900: #1B1E21;   /* keyhole panel, deep steel */
  --steel-700: #3A4046;   /* door rim, plaque borders */
  --steel-500: #6B737B;   /* borders/dividers on dark (non-text) */
  --steel-300: #A9B0B6;   /* muted text on dark; mid steel */
  --steel-100: #D9DDE0;   /* light steel plaque; text on steel-900 */

  /* Brass: plaques, primary buttons, hinges, keys */
  --brass-700: #6B5021;   /* brass-coloured TEXT on paper */
  --brass-500: #B08D3C;   /* fill only (darkest button stop) */
  --brass-400: #C9A45A;   /* base brass fill; gilt dark stop */
  --brass-300: #E4CB8C;   /* brass text on dark; focus ring on dark */

  /* Passbook paper */
  --paper-100: #F6EFDC;   /* ivory page */
  --paper-200: #EDE3C8;   /* shaded paper: zebra rows, key-card back */
  --paper-300: #DCCDA6;   /* ruled lines, card edges */

  /* Typewriter ink (warm, never pure black) */
  --ink-900: #1F1A14;
  --ink-700: #4A4034;

  /* Rubber-stamp inks: ink on paper only */
  --stamp-red:  #A8322D;  /* WITHDRAWN */
  --stamp-blue: #2B4C8C;  /* DEPOSITED; links + focus on paper */

  /* Status */
  --success:      #2E6B3A; /* on paper: SAVED stamp, "confirmed" */
  --success-dark: #8BC795; /* on green/steel: "Key accepted" */
  --warn:         #7F5300; /* on paper */
  --warn-dark:    #E3AE45; /* on green/steel */
  --danger:       #B3261E; /* emergency: FILLED tag with paper text */
  --danger-dark:  #E8837A; /* emergency text on green/steel */

  /* Lamp light, as an rgb triplet for alpha use: rgb(var(--lamp) / .3) */
  --lamp: 255 205 130;
}
```

### Usage rules
| Situation | Use | Never |
|---|---|---|
| Money amounts, ledger lines | `--ink-900` on paper, typewriter face | gold/brass numerals (look "gamey", and fail on paper) |
| Primary action ("Deposit", "Open the vault") | brass button, `--green-900` label | brass text on paper (`--brass-500` = 2.72:1) |
| Secondary action | `--green-700` fill, `--paper-100` label | ghost buttons with `--green-500` text |
| Headline on the room | gilt (`.gilt`) or `--brass-300` | `--brass-500` text |
| Savings risk line | `--ink-700` on paper, never red or amber | alarm colours (it's a note, not a warning) |
| Emergency exit pending | `.tag-danger` filled red tag + the word + countdown in `--danger-dark` on the room | `--danger` as text on green (2.34:1) |
| Links on paper | `--stamp-blue`, underlined | colour alone |

**Stamp ink → event map** (colour is never the only signal: every stamp also has its word, and the typed ledger line says the same thing):

| Event(s) | Stamp word | Ink |
|---|---|---|
| `Deposited` | DEPOSITED | `--stamp-blue` |
| `Moved` → Savings | SAVED | `--success` |
| `Moved` → Locker | IN LOCKER | `--stamp-blue` |
| interest accrual line | INTEREST | `--brass-700` |
| `Withdrawn`, `EscapeExecuted` | WITHDRAWN / PAID OUT | `--stamp-red` |
| `PQVerified` | TWO KEYS ✓ | `--success` |
| `KeyRotated` | NEW KEY | `--ink-700` |
| `EscapeRequested` | EXIT REQUESTED | `.tag-danger` (a filled tag, not a stamp) |
| `EscapeCancelled` | CANCELLED | `--stamp-blue` |

`--stamp-red` (routine withdrawal) and `--danger` (emergency) are close in hue, so they are kept apart **by form**. Red *ink* (a stamp with a double border, rotated and textured) always means a normal payout. A red *filled tag* with paper-white text always means an emergency. Don't swap them.

---

## 3. Computed contrast table

Thresholds (WCAG 2.2 AA): normal text 4.5:1; large text (≥ 24px regular or ≥ 18.66px bold) 3:1; non-text UI and focus indicators 3:1.
For gradients, the **worst stop** is checked. Alpha rows are checked on the blended colour, `mix = α·fg + (1−α)·bg` in sRGB. The real render uses `mix-blend-mode: multiply`, which gives a darker ink, so these numbers are conservative.

| Foreground | Background | Ratio | Needs | Pass | Use |
|---|---|---:|---:|:-:|---|
| `--ink-900` `#1F1A14` | `--paper-100` `#F6EFDC` | 15.05 | 4.5 | ✅ | Body text, typed passbook figures, balances on paper |
| `--ink-900` `#1F1A14` | `--paper-200` `#EDE3C8` | 13.50 | 4.5 | ✅ | Body text on shaded paper (table stripes, key card back) |
| `--ink-900` `#1F1A14` | `--paper-300` `#DCCDA6` | 10.96 | 4.5 | ✅ | Text on ruled-line colour / card edge (worst case on a rule) |
| `--ink-700` `#4A4034` | `--paper-100` `#F6EFDC` | 8.82 | 4.5 | ✅ | Secondary text, risk note, timestamps |
| `--ink-700` `#4A4034` | `--paper-200` `#EDE3C8` | 7.92 | 4.5 | ✅ | Secondary text on shaded paper |
| `--brass-700` `#6B5021` | `--paper-100` `#F6EFDC` | 6.55 | 4.5 | ✅ | Brass labels on paper ("BOX Nº", section heads) |
| `--brass-700` `#6B5021` | `--paper-200` `#EDE3C8` | 5.88 | 4.5 | ✅ | Brass labels on shaded paper |
| `--stamp-red` `#A8322D` | `--paper-100` `#F6EFDC` | 5.79 | 4.5 | ✅ | WITHDRAWN stamp, solid ink |
| `--stamp-red` @0.9 → `#B0453E` | `--paper-100` `#F6EFDC` | 4.86 | 3.0 | ✅ | WITHDRAWN stamp as rendered (opacity .9) |
| `--stamp-red` @0.9 → `#AF443C` | `--paper-200` `#EDE3C8` | 4.42 | 3.0 | ✅ | WITHDRAWN stamp on shaded paper |
| `--stamp-blue` `#2B4C8C` | `--paper-100` `#F6EFDC` | 7.28 | 4.5 | ✅ | DEPOSITED stamp, links on paper, focus ring on paper |
| `--stamp-blue` @0.9 → `#3F5C94` | `--paper-100` `#F6EFDC` | 5.77 | 3.0 | ✅ | DEPOSITED stamp as rendered |
| `--success` `#2E6B3A` | `--paper-100` `#F6EFDC` | 5.58 | 4.5 | ✅ | SAVED stamp, "confirmed" text on paper |
| `--success` `#2E6B3A` | `--paper-200` `#EDE3C8` | 5.01 | 4.5 | ✅ | Success on shaded paper |
| `--warn` `#7F5300` | `--paper-100` `#F6EFDC` | 5.83 | 4.5 | ✅ | Warning text on paper ("Remember on this device") |
| `--warn` `#7F5300` | `--paper-200` `#EDE3C8` | 5.23 | 4.5 | ✅ | Warning on shaded paper |
| `--danger` `#B3261E` | `--paper-100` `#F6EFDC` | 5.70 | 4.5 | ✅ | Emergency word on paper (bold, next to tag) |
| `--paper-100` `#F6EFDC` | `--danger` `#B3261E` | 5.70 | 4.5 | ✅ | Text inside the red emergency tag / danger button |
| `--paper-100` `#F6EFDC` | `--green-900` `#0F2A1F` | 13.34 | 4.5 | ✅ | Body text on the room |
| `--paper-100` `#F6EFDC` | `--green-800` `#16392A` | 11.07 | 4.5 | ✅ | Text on raised green panels |
| `--paper-100` `#F6EFDC` | `--green-700` `#1E4D38` | 8.42 | 4.5 | ✅ | Secondary button (green) label |
| `--paper-100` `#F6EFDC` | `#081A13` | 15.67 | 4.5 | ✅ | Text in the darkest vignette corner |
| `--brass-300` `#E4CB8C` | `--green-900` `#0F2A1F` | 9.64 | 4.5 | ✅ | Gilt headline (brightest stop), brass text on room |
| `--brass-400` `#C9A45A` | `--green-900` `#0F2A1F` | 6.52 | 4.5 | ✅ | Gilt headline (darkest stop) |
| `--brass-400` `#C9A45A` | `#081A13` | 7.66 | 4.5 | ✅ | Gilt in vignette corner |
| `--brass-300` `#E4CB8C` | `--steel-900` `#1B1E21` | 10.54 | 4.5 | ✅ | Brass text on dark steel (keyhole panel) |
| `--steel-300` `#A9B0B6` | `--green-900` `#0F2A1F` | 6.98 | 4.5 | ✅ | Captions / muted text on the room |
| `--steel-300` `#A9B0B6` | `--steel-900` `#1B1E21` | 7.63 | 4.5 | ✅ | Muted text on dark steel |
| `--steel-100` `#D9DDE0` | `--steel-900` `#1B1E21` | 12.25 | 4.5 | ✅ | Body text on dark steel |
| `--success-dark` `#8BC795` | `--green-900` `#0F2A1F` | 7.80 | 4.5 | ✅ | Success text on room ("Key accepted") |
| `--warn-dark` `#E3AE45` | `--green-900` `#0F2A1F` | 7.59 | 4.5 | ✅ | Warning text on room |
| `--danger-dark` `#E8837A` | `--green-900` `#0F2A1F` | 5.80 | 4.5 | ✅ | Emergency countdown text on room |
| `--danger-dark` `#E8837A` | `--steel-900` `#1B1E21` | 6.35 | 4.5 | ✅ | Emergency text on dark steel |
| `--green-900` `#0F2A1F` | `#B08D3C` | 4.90 | 4.5 | ✅ | Brass button label, darkest gradient stop (worst case) |
| `--green-900` `#0F2A1F` | `--brass-400` `#C9A45A` | 6.52 | 4.5 | ✅ | Brass button label, mid stop |
| `--green-900` `#0F2A1F` | `#EAD49A` | 10.49 | 4.5 | ✅ | Brass button label, top highlight |
| `--ink-900` `#1F1A14` | `#9AA2A8` | 6.67 | 4.5 | ✅ | Engraved text on brushed steel, darkest band (worst case) |
| `--ink-900` `#1F1A14` | `#C4CACE` | 10.43 | 4.5 | ✅ | Engraved text on brushed steel, lightest |
| `--ink-900` `#1F1A14` | `--steel-100` `#D9DDE0` | 12.64 | 4.5 | ✅ | Text on light steel plaque |
| `--brass-300` `#E4CB8C` | `--green-900` `#0F2A1F` | 9.64 | 3.0 | ✅ | Focus ring on room (non-text, 3:1) |
| `--stamp-blue` `#2B4C8C` | `--paper-200` `#EDE3C8` | 6.53 | 3.0 | ✅ | Focus ring on shaded paper (non-text) |
| `--steel-500` `#6B737B` | `--green-900` `#0F2A1F` | 3.18 | 3.0 | ✅ | Input border / divider on room (non-text) |
| `--brass-500` `#B08D3C` | `--paper-100` `#F6EFDC` | 2.72 | n/a | — | DECORATIVE ONLY: brass fill on paper — never text |
| `--green-500` `#2F6B4F` | `--green-900` `#0F2A1F` | 2.43 | n/a | — | DECORATIVE ONLY: rules/dividers on room |
| `--paper-200` `#EDE3C8` | `--paper-100` `#F6EFDC` | 1.11 | n/a | — | DECORATIVE ONLY: blind emboss |
| `--danger` `#B3261E` | `--green-900` `#0F2A1F` | 2.34 | n/a | — | FORBIDDEN: danger red as text on room — use danger-dark |

Notes on the table:
- Stamps are set in 20px bold (large text, so they only need 3:1), and they pass 4.5:1 anyway. The ink-mask holes (§4.7) break up some strokes, so stamps are **redundant decoration**: the typed ledger line carries the meaning, and the stamp gets `aria-hidden="true"`.
- The vignette darkens the room towards `#081A13` at the corners. That *raises* contrast for light text, so the plain `--green-900` rows are the worst case.
- The brass button's darkest stop is pinned at `#B08D3C` so its label passes (4.90). Don't darken the gradient past this. The `:active` state starts at that same stop.

---

## 4. Material recipes (pure CSS + inline data-URI SVG, no images, no libraries)

This is one stylesheet, verified in Chromium. The textures are `feTurbulence` SVGs inlined as data URIs, so there are no requests. Tile sizes are chosen so the browser rasterises each texture once and then just repeats it. **Never animate the turbulence itself.**

```css
/* ---------- 1. Tokens ---------- */
:root {
  color-scheme: dark;

  /* Bank green — the room: walls, wainscot, lacquer */
  --green-900: #0F2A1F;
  --green-800: #16392A;
  --green-700: #1E4D38;
  --green-500: #2F6B4F; /* decorative only (rules, dividers) */

  /* Vault steel — door, drawers, keyholes */
  --steel-900: #1B1E21;
  --steel-700: #3A4046;
  --steel-500: #6B737B; /* borders on dark only, never text */
  --steel-300: #A9B0B6;
  --steel-100: #D9DDE0;

  /* Brass — plaques, buttons, hinges, key */
  --brass-700: #6B5021; /* brass *text* on paper */
  --brass-500: #B08D3C;
  --brass-400: #C9A45A;
  --brass-300: #E4CB8C; /* brass text on dark, focus ring on dark */

  /* Passbook paper */
  --paper-100: #F6EFDC;
  --paper-200: #EDE3C8;
  --paper-300: #DCCDA6; /* ruled lines, card edges */

  /* Typewriter ink */
  --ink-900: #1F1A14;
  --ink-700: #4A4034;

  /* Rubber-stamp inks (ink on paper only) */
  --stamp-red: #A8322D;
  --stamp-blue: #2B4C8C;

  /* Status */
  --success: #2E6B3A;       /* on paper */
  --success-dark: #8BC795;  /* on green/steel */
  --warn: #7F5300;          /* on paper */
  --warn-dark: #E3AE45;     /* on green/steel */
  --danger: #B3261E;        /* emergency: FILLED tag with paper text, never ink */
  --danger-dark: #E8837A;   /* emergency text on green/steel */

  /* Lamp */
  --lamp: 255 205 130;      /* rgb triplet for alpha use */

  /* Textures (data-URI SVG, tile-able) */
  --grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .32 0 0 0 0 .25 0 0 0 0 .14 .55 0 0 0 -.18'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
  --mottle: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='480' height='480'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.02' numOctaves='3' seed='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .45 0 0 0 0 .34 0 0 0 0 .16 .45 0 0 0 -.2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E");
  --brush: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='200'%3E%3Cfilter id='b'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.003 .95' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 .5'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23b)'/%3E%3C/svg%3E");
  --ink-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='2' seed='11' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 8 0 0 0 -2.4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23m)'/%3E%3C/svg%3E");
}

/* ---------- 2. Lamp-lit room (page background) ---------- */
body {
  margin: 0;
  min-height: 100vh;
  background: var(--green-900);
  color: var(--paper-100);
}
body::before { /* fixed overlay, not background-attachment:fixed (iOS ignores it) */
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    /* pool of lamp light from above */
    radial-gradient(ellipse 65% 50% at 50% -8%, rgb(var(--lamp) / .30), rgb(var(--lamp) / .10) 45%, transparent 72%),
    /* vignette: corners fall into shadow */
    radial-gradient(ellipse 110% 85% at 50% 42%, transparent 48%, rgb(0 0 0 / .55) 100%),
    /* lacquered wall has faint grain too */
    var(--grain);
  background-size: auto, auto, 220px;
}
@media (prefers-reduced-motion: no-preference) {
  body::before { animation: lamp-breathe 7s ease-in-out infinite alternate; }
}
@keyframes lamp-breathe { from { opacity: 1; } to { opacity: .93; } }

/* ---------- 3. Paper surface (passbook, key card, forms) ---------- */
.paper {
  color-scheme: light;         /* native inputs render light on paper */
  color: var(--ink-900);
  background:
    /* lamp falls on the top of the page */
    radial-gradient(ellipse 90% 60% at 50% 0%, rgb(var(--lamp) / .18), transparent 70%),
    /* aged edges */
    radial-gradient(ellipse 100% 100% at 50% 50%, transparent 62%, rgb(120 90 40 / .16) 100%),
    var(--mottle),
    var(--grain),
    var(--paper-100);
  background-size: auto, auto, 480px, 220px, auto;
  border-radius: 3px;
  box-shadow: 0 1px 0 var(--paper-300), 0 12px 28px rgb(0 0 0 / .45);
}
/* Passbook ruling + red margin line */
.passbook {
  --rule: 32px;
  line-height: var(--rule);
  background:
    linear-gradient(90deg, transparent 56px, rgb(168 50 45 / .55) 56px 57px, transparent 57px),
    repeating-linear-gradient(180deg, transparent 0 calc(var(--rule) - 1px), var(--paper-300) calc(var(--rule) - 1px) var(--rule)),
    var(--mottle), var(--grain), var(--paper-100);
  background-size: auto, auto, 480px, 220px, auto;
  background-attachment: local;
  padding: var(--rule) 16px var(--rule) 68px; /* vertical padding = one rule so type sits on the lines */
}

/* ---------- 4. Brushed steel (drawers, plaques) ---------- */
.steel {
  color: var(--ink-900);
  background:
    var(--brush),
    linear-gradient(180deg, #C4CACE 0%, #B3BABF 45%, #9AA2A8 55%, #B9C0C4 100%);
  background-size: 600px 200px, auto;
  background-blend-mode: overlay, normal;
  border: 1px solid var(--steel-700);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / .6),
    inset 0 -1px 0 rgb(0 0 0 / .25),
    0 2px 0 var(--steel-900),
    0 8px 18px rgb(0 0 0 / .45);
}
/* Spun (lathe-turned) steel — the round vault door */
.spun {
  aspect-ratio: 1;
  border-radius: 50%;
  background:
    repeating-radial-gradient(circle at 50% 50%, rgb(255 255 255 / .06) 0 1px, rgb(0 0 0 / .06) 1px 2px),
    conic-gradient(from 20deg, #8E969D, #E3E7EA 12%, #9AA2A8 25%, #C4CACE 38%, #7F878E 50%, #E3E7EA 62%, #9AA2A8 75%, #C4CACE 88%, #8E969D);
  box-shadow:
    inset 0 0 0 10px var(--steel-700),
    inset 0 0 0 12px #C4CACE,
    inset 0 0 40px rgb(0 0 0 / .45),
    0 24px 60px rgb(0 0 0 / .65);
}

/* ---------- 5. Polished brass with moving highlight ---------- */
.brass {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  color: var(--green-900);
  font-weight: 700;
  border: 1px solid #8A6A2A;
  border-radius: 6px;
  padding: .75em 1.5em;
  background: linear-gradient(180deg, #EAD49A 0%, #C9A45A 40%, #B08D3C 60%, #D6B66E 100%);
  text-shadow: 0 1px 0 rgb(255 248 220 / .45);          /* engraved-in-brass */
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / .6),
    inset 0 -2px 0 rgb(0 0 0 / .18),
    0 1px 0 var(--brass-700),
    0 4px 10px rgb(0 0 0 / .4);
  cursor: pointer;
}
.brass::after { /* specular sweep */
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(105deg, transparent 38%, rgb(255 250 230 / .65) 50%, transparent 62%);
  transform: translateX(-120%);
}
@media (prefers-reduced-motion: no-preference) {
  .brass::after { transition: transform 900ms cubic-bezier(.2, .6, .2, 1); }
  .brass:hover::after, .brass:focus-visible::after { transform: translateX(120%); }
}
.brass:active { background: linear-gradient(180deg, #B08D3C 0%, #C9A45A 55%, #D6B66E 100%); box-shadow: inset 0 2px 4px rgb(0 0 0 / .35); }
.brass:focus-visible { outline: 3px solid var(--brass-300); outline-offset: 3px; }
.paper :focus-visible { outline-color: var(--stamp-blue); }

/* ---------- 6. Engraved / embossed text ---------- */
/* Engraved into steel or brass: dark fill, light edge below */
.engraved { color: var(--ink-900); text-shadow: 0 1px 0 rgb(255 255 255 / .5), 0 -1px 0 rgb(0 0 0 / .25); }
/* Letterpress into paper */
.letterpress { color: var(--ink-700); text-shadow: 0 1px 0 rgb(255 255 255 / .75); }
/* Gilt lettering on green (bank-window gold leaf) */
.gilt {
  color: var(--brass-300); /* fallback */
  background: linear-gradient(180deg, #F3E2AE 0%, #E4CB8C 45%, #C9A45A 55%, #EAD49A 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 1px 0 rgb(0 0 0 / .7)) drop-shadow(0 0 12px rgb(var(--lamp) / .18));
}
/* Blind emboss (raised, same colour as paper) — DECORATIVE ONLY, ~1:1 contrast */
.blind-emboss { color: var(--paper-200); text-shadow: -1px -1px 0 rgb(255 255 255 / .8), 1px 1px 0 rgb(90 70 30 / .28); }

/* ---------- 7. Rubber stamp ---------- */
.stamp {
  --ink: var(--stamp-blue);
  display: inline-block;
  padding: .3em .6em;
  color: var(--ink);
  border: 4px double var(--ink);
  border-radius: 5px;
  font: 700 1.25rem/1 "Courier Prime", "Courier New", monospace; /* ≥ 18.66px bold = WCAG large text */
  letter-spacing: .14em;
  text-transform: uppercase;
  transform: rotate(-5deg);
  opacity: .9;
  mix-blend-mode: multiply;      /* paper grain shows through the ink */
  -webkit-mask-image: var(--ink-mask);
  mask-image: var(--ink-mask);
  -webkit-mask-size: 160px;
  mask-size: 160px;
}
.stamp--red   { --ink: var(--stamp-red); }
.stamp--green { --ink: var(--success); }
.stamp--brass { --ink: var(--brass-700); }

/* Emergency tag — filled, never ink */
.tag-danger {
  display: inline-block;
  color: var(--paper-100);
  background: var(--danger);
  font-weight: 700;
  padding: .35em .8em .35em 1.4em;
  clip-path: polygon(14px 0, 100% 0, 100% 100%, 14px 100%, 0 50%);
  box-shadow: inset 0 -2px 0 rgb(0 0 0 / .2);
}

/* ---------- 8. Windows High Contrast / forced colours ---------- */
@media (forced-colors: active) {
  .stamp { -webkit-mask-image: none; mask-image: none; mix-blend-mode: normal; opacity: 1; }
  .gilt { background: none; -webkit-text-fill-color: currentColor; filter: none; }
  .tag-danger { clip-path: none; border: 2px solid; }
}
```

### Markup that goes with it
```html
<!-- Room + gilt headline + brass button -->
<h1 class="gilt">Your dollars, behind two keys.</h1>
<button class="brass">Open the vault</button>

<!-- Round vault door (the SVG/HTML for bolts and the wheel goes on top of this disc) -->
<div class="spun" style="width:min(80vw, 420px)"></div>

<!-- Brushed-steel drawer front with engraved number -->
<div class="steel"><span class="engraved">BOX Nº 0417</span></div>

<!-- Passbook page -->
<section class="paper passbook">
  <p>25 SEP 2026   DEPOSIT   1,250.00</p>
  <span class="stamp" aria-hidden="true">Deposited</span>
  <span class="stamp stamp--red" aria-hidden="true">Withdrawn</span>
</section>

<!-- Emergency -->
<span class="tag-danger">Exit pending</span>
```

### 4.1 Recipe notes (the values that matter)

| Recipe | Key values | Why |
|---|---|---|
| **Lamp glow + vignette** | Glow: `radial-gradient(ellipse 65% 50% at 50% -8%, rgb(255 205 130 / .30) → .10 at 45% → 0 at 72%)`. Vignette: `ellipse 110% 85% at 50% 42%`, clear to 48%, then `rgb(0 0 0/.55)` at the edge | The lamp sits just above the viewport (`-8%`), so light "falls" onto the content. 2700K-ish amber `#FFCD82` at 30% max keeps text colours unchanged. The breathe animation is 7s, opacity 1 → .93 (a gaslight flicker would be too much), and only runs with `prefers-reduced-motion: no-preference`. |
| **Brushed steel** | `feTurbulence baseFrequency='.003 .95'` (≈300:1 anisotropy gives horizontal streaks), `background-blend-mode: overlay` on a 4-stop cylinder gradient `#C4CACE → #B3BABF 45% → #9AA2A8 55% → #B9C0C4` | Overlay makes the streaks both lighter and darker, the way real brushing does. The hard band at 45–55% is the reflection of the lamp that sells "curved drawer front". |
| **Spun steel (vault door)** | `repeating-radial-gradient` 1px/1px rings at 6% alpha over an 8-stop `conic-gradient` alternating `#E3E7EA`/`#7F878E` | This is how lathe-turned steel really catches light: a bright/dark "X" rotates around the centre. Rotating the conic `from` angle by ~20° while the door swings gives a free, cheap highlight shift. |
| **Polished brass** | Gradient `#EAD49A → #C9A45A 40% → #B08D3C 60% → #D6B66E`, `inset 0 1px 0 rgb(255 255 255/.6)` top bevel, `inset 0 -2px 0 rgb(0 0 0/.18)` bottom bevel, specular sweep `105deg` band of `rgb(255 250 230/.65)` moving −120% → 120% in 900ms `cubic-bezier(.2,.6,.2,1)` | The top light and dark bottom band make it look domed. The sweep runs on hover and focus only, and is gated by reduced-motion. |
| **Paper** | Grain: `baseFrequency='.9'`, 3 octaves, brown `rgb(.32,.25,.14)` at alpha `0.55·R − 0.18`, 220px tile. Mottle (ageing): `baseFrequency='.02'` at alpha `0.45·R − 0.2`, 480px tile. Plus an edge darkening `rgb(120 90 40/.16)` and a lamp wash from the top | Rejected: long anisotropic "fibres" (`.012 .35`). They rendered as **wood grain**. Mottle stronger than about 0.5·R reads as dirty parchment or camouflage. |
| **Passbook ruling** | `--rule: 32px`, 1px `--paper-300` lines, red margin at 56px `rgb(168 50 45/.55)`, vertical padding = one rule | The padding has to be a multiple of `--rule`, or the type floats between lines (that bug showed up in the first render). |
| **Engraved text** | `text-shadow: 0 1px 0 rgb(255 255 255/.5), 0 -1px 0 rgb(0 0 0/.25)` with `--ink-900` | The light edge *below* the letters means the letters are cut *into* the surface, lit from above. |
| **Letterpress (paper)** | `--ink-700` + `0 1px 0 rgb(255 255 255/.75)` | Use for labels and the risk line. |
| **Gilt lettering** | `background-clip:text` gradient `#F3E2AE → #E4CB8C 45% → #C9A45A 55% → #EAD49A`, `filter: drop-shadow(0 1px 0 rgb(0 0 0/.7))` | `text-shadow` paints *over* clipped-background text, so it has to be `filter: drop-shadow`. The fallback `color: var(--brass-300)` shows if clipping isn't supported. |
| **Blind emboss** | Paper-coloured text with `-1px -1px` white and `1px 1px rgb(90 70 30/.28)` | 1.11:1, **decorative only** (a watermark "ARC GUARD" on the key card). Never put information in it. |
| **Rubber stamp** | 4px `double` border, 20px bold uppercase typewriter, `letter-spacing:.14em`, `rotate(-5deg)` (vary ±1–6° per stamp, seeded by tx hash), `opacity:.9`, `mix-blend-mode:multiply`, ink mask = turbulence `baseFrequency='.75'` with alpha `8·R − 2.4`, 160px tile | The mask gives ink starvation and speckle. `multiply` lets the paper grain show through the ink. Mask `7·R − 2.6` ate about half the ink (tested and rejected). |

### 4.2 Gotchas found while rendering (read before building)
1. **Don't use `filter: url(#id)` in a bundled stylesheet.** Inside an external `.css` file, `url(#ink-edge)` resolves against the *stylesheet's* URL (`/assets/index-abc.css#ink-edge`), not the page. It works in Vite dev (styles are injected as `<style>`) and **silently breaks in the production build**, and the element disappears completely. That happened to our stamps in testing. If you want displaced, rough edges, put the `<filter>` and the element that uses it inside the same inline `<svg>` React component. The CSS mask alone is enough, and it's what we ship.
2. **Textures decode after first paint.** Data-URI SVGs with filters were rasterised a few frames after load in Chromium (the first screenshots had no grain). That's harmless for backgrounds, since they fade in. But a `mask-image` that hasn't decoded yet hides the element, so **stamps must never be the only carrier of information** (they aren't, see §3 notes). Stamps appear after a user action anyway, by which point the mask is decoded.
3. **`background-attachment: fixed` is ignored on iOS Safari.** That's why the lamp and vignette sit on a `position: fixed` `body::before` with `z-index: -1` and `pointer-events: none`.
4. **`mix-blend-mode` has a cost.** Keep `multiply` to small elements (stamps). Never put it on a scrolling, full-height layer. Only 4 stamps were tested. For long passbooks, render just the visible page of rows (a real passbook shows one page at a time anyway).
5. **Forced colours** (Windows High Contrast): masks, blend and gilt clipping are switched off in §8 of the stylesheet, so text falls back to system colours.

---

## 5. What was rejected
- **Pure black `#000` or near-neutral charcoal for the room.** It reads as "crypto dashboard". A green-tinted dark keeps the bank.
- **Saturated "money green" `#2E7D32`-family as the base.** It's too modern and too Material. Bank green has to be desaturated and deep (`#0F2A1F`, about 38% saturation at 11% lightness).
- **Yellow gold `#FFD700`.** It reads as a casino. Brass is desaturated and warm (`#C9A45A`).
- **Pure white paper.** `#FFFFFF` next to lamp light looks clinical. Ivory `#F6EFDC` keeps the warmth and still gives 15:1 with ink.
- **A light/dark toggle.** See §1.

---

## 6. Reproducing the numbers
```python
def L(h):
    c = [int(h.lstrip('#')[i:i+2], 16) / 255 for i in (0, 2, 4)]
    c = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]

def contrast(a, b):
    hi, lo = sorted([L(a), L(b)], reverse=True)
    return (hi + 0.05) / (lo + 0.05)

def mix(fg, bg, alpha):  # sRGB alpha blend, for opacity rows
    f = [int(fg[i:i+2], 16) for i in (1, 3, 5)]
    g = [int(bg[i:i+2], 16) for i in (1, 3, 5)]
    return '#' + ''.join('%02X' % round(alpha * p + (1 - alpha) * q) for p, q in zip(f, g))

assert round(contrast('#1F1A14', '#F6EFDC'), 2) == 15.05
assert round(contrast('#0F2A1F', '#B08D3C'), 2) == 4.90
```
