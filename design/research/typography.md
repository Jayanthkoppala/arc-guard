# Typography: Arc Guard

A 1950s bank has three kinds of lettering, so we use three families:

1. **Engraved caps**: the brass plaque on the vault door and the numbers on the box doors.
2. **Body serif**: the printed leaflet and the letter from the manager.
3. **Typewriter numerals**: the passbook entries, the teller's slip and the rubber stamp.

All fonts come from Google Fonts under the OFL. We never let one family do another's job. Engraved caps never show an amount in a column, and the typewriter face never sets a paragraph.

## How this was verified (2026-09-25)

- Every family below returned **HTTP 200** from `https://fonts.google.com/specimen/<Name>` and from the CSS2 API (`fonts.googleapis.com/css2?family=…`) with a Chrome user agent. The combined recommended URL also returned 200.
- **KB** is the real byte size of the `latin` subset woff2 files the CSS2 API serves for the weights listed. The `latin-ext`, `cyrillic` and `vietnamese` files only download if those characters appear, thanks to `unicode-range`.
- I rendered each numeral face with `1,204.50 USDC`, `0x8e35…12af` and the confusable glyphs `0O 1lI 8B 5S 6b` and checked the results by eye. I also checked whether each font's digits share one advance width (tabular by default) and which OpenType features survive in the served file.

| Family | Role | Specimen | Weights checked | latin woff2 | Digits tabular by default | `tnum` in served file |
|---|---|---|---|---|---|---|
| Castoro Titling | engraved caps | https://fonts.google.com/specimen/Castoro+Titling | 400 (only weight) | 13.1 KB | no | no |
| Libre Caslon Text | body | https://fonts.google.com/specimen/Libre+Caslon+Text | 400, 400i, 700 (static) | 52.6 KB | no | **yes** |
| Courier Prime | typewriter | https://fonts.google.com/specimen/Courier+Prime | 400, 700 | 22.2 KB | **yes** (mono, 0.6 em) | n/a |
| Cinzel | engraved caps | https://fonts.google.com/specimen/Cinzel | variable 400–900, 1 file | 25.3 KB | no | no |
| Source Serif 4 | body | https://fonts.google.com/specimen/Source+Serif+4 | 400, 600, 400i (no opsz axis) | 69.4 KB | **yes** | yes |
| IBM Plex Mono | typewriter / ledger | https://fonts.google.com/specimen/IBM+Plex+Mono | 400, 500 | 19.6 KB | **yes** | n/a |
| Marcellus SC | engraved caps | https://fonts.google.com/specimen/Marcellus+SC | 400 (only weight) | 14.0 KB | no | no |
| Old Standard TT | body | https://fonts.google.com/specimen/Old+Standard+TT | 400, 700, 400i | 41.8 KB | **yes** | no (not needed) |
| Space Mono | typewriter | https://fonts.google.com/specimen/Space+Mono | 400, 700 | 18.6 KB | **yes** | n/a |

Note: Source Serif 4 **with** the `opsz` axis costs 168.7 KB. Don't load the optical-size axis.

---

## Pairing A: "Engraved Passbook" ✅ recommended

**Castoro Titling** (plaques, box numbers) + **Libre Caslon Text** (body) + **Courier Prime** (money, hashes, stamps)

**Why it fits.** Castoro Titling is an all-caps titling face with sharp, fine serifs. It looks cut into brass, not printed. Its lining digits read well on box doors (`BOX NO. 042`). Caslon is the classic English-language text face. It fits the look of a bank leaflet or a manager's letter from any country, not one nation's "old bank". Courier Prime is Courier redrawn for screens, with sturdier strokes than Courier New. It is the look of a typewritten passbook line, and it is monospaced, so amounts line up in a column for free. Together the three read as "brass door → paper leaflet → typed ledger", which is the product's own story.

**Numbers.**
- `1,204.50 USDC` in Courier Prime: every digit is 0.6 em wide, so the comma and point sit in a fixed grid and rows line up to the cent. The `1` has a flag and a foot, the `l` has a curved tail, and `I` has slab serifs, so all three are distinct.
- `0x8e35…12af`: hex is always lowercase, so the zero only has to differ from `o`, and it does (it's full cap height). `8` and `B` are distinct. The `…` (U+2026) is a single one-cell glyph, so truncated addresses keep their width.
- Weak spot: `0` and capital `O` differ only by width. **This doesn't matter here.** No amount, address or hash we show contains a capital O. Don't set free-text user input in Courier.
- Castoro Titling digits are proportional with no `tnum`. That's fine, because it only ever sets single labels (box numbers, "EST. 2026"), never columns.

**Load.** Castoro Titling 400 · Libre Caslon Text 400, 400i, 700 · Courier Prime 400, 700.
**Size: 87.9 KB** woff2 (latin) plus about 2 KB of CSS.

**Gotchas.**
- Castoro Titling has **no lowercase**: lowercase maps to caps (`No.` renders `NO.`). Write plaque copy in caps, or just let it happen.
- There is **no `№` glyph** in any latin subset. Use `NO.`
- It has one weight, so set `font-synthesis: none` or browsers will fake a bold.
- It is a titling face, so its hairlines get fragile below 14 px.

---

## Pairing B: "Brass & Ledger" (most legible)

**Cinzel** (plaques) + **Source Serif 4** (body) + **IBM Plex Mono** (money, hashes)

**Why it fits.** Cinzel is modelled on Roman inscriptional capitals, the lettering carved on classical bank façades and cornerstones. Heavier weights (600–700) look like deep-cast brass. Source Serif 4 is a sturdy transitional serif with real `tnum`/`pnum` and a large x-height, so it has the best small-size reading of the three body faces. IBM Plex Mono has a **dotted zero**, the clearest `0`/`O` split in the set, and plain, even strokes. It reads as "bank machine ledger" more than "typewriter".

**Numbers.**
- `1,204.50 USDC` and `0x8e35…12af` in Plex Mono are the most legible of any option: dotted `0`, a serifed `1`, a tailed `l` and an open `e`.
- Cinzel has **no lowercase**: lowercase comes out as small caps, so `0x8e35` renders `0X8E35` and must never be set in it. Its `1` looks like an `I`, so box numbers such as `NO. 011` are ambiguous. **Keep numbers out of Cinzel entirely.**

**Load.** Cinzel variable (one file covers 400–900; use 600/700) · Source Serif 4 400, 600, 400i (no `opsz`) · IBM Plex Mono 400, 500.
**Size: 114.3 KB.**

**Trade-off.** It's the safest pick for legibility, but it has the least nostalgia. Plex Mono feels 1980s, and Cinzel is common on "luxury" landing pages.

---

## Pairing C: "Teller's Window" (lightest, most period)

**Marcellus SC** (plaques) + **Old Standard TT** (body) + **Space Mono** (money, hashes)

**Why it fits.** Marcellus SC is a flared-serif small-caps face with the calm, wide proportions of a bronze door sign. Old Standard TT revives late-19th-century book and ledger type (high contrast, Modern style). It's the most "antique bank" of the body faces, and its digits are tabular by default. Space Mono is a retro grotesque monospace with a **dotted zero**. Its geometric shapes give a mid-century teller-machine feel.

**Numbers.**
- Space Mono: the dotted `0` is excellent, but the `1` has an odd, detached-looking flag that reads as quirky at 14–16 px. Its `a` and `f` have a strong personality.
- Old Standard TT has tabular digits, so body-text tables align without `tnum`.
- **Marcellus SC's `0` is a round circle identical to its `O`**: `042` reads as `O42`. That disqualifies it for box numbers, so numbers would have to move to the mono face.
- Old Standard TT's high-contrast hairlines thin out at 15 px on low-DPI Android screens, which is a risk for the always-visible Savings risk note.

**Load.** Marcellus SC 400 · Old Standard TT 400, 700, 400i · Space Mono 400, 700.
**Size: 74.4 KB.**

---

## Recommendation: Pairing A

Pairing A best delivers "they feel like they are exactly saving". The brass plaque, the leaflet and the typed passbook are three distinct, familiar materials, and the typewriter numerals **are** the passbook. It stays under 90 KB. Its one numeral weakness (0/O) can't occur in our data, while B and C each carry a real flaw (Cinzel's `1`/`I`, Marcellus's `0`/`O`, Plex's missing nostalgia).

If testing on phones shows Courier Prime too light at 15 px, swap only the money face to IBM Plex Mono (−2.6 KB). Nothing else changes.

### Rejected (and why)

| Font | Reason |
|---|---|
| Special Elite | Distressed typewriter; **digits are proportional** (measured), so columns won't align; ragged glyphs blur hex at 15 px; 51.8 KB for a single weight. It would fit a decorative stamp, but Courier Prime Bold covers stamps for free. |
| Cutive Mono | Hairline strokes vanish at 15 px on ivory. |
| Libre Caslon Display, Cormorant SC | Display-only contrast; Cormorant SC's oldstyle digits (`1,204.50` bounces) are wrong for money. |
| Libre Baskerville | Good body face, but digits are proportional and `tnum` is not in the served file. |

---

## Type scale (Pairing A)

The body is 17 px on mobile and 18 px on desktop. Mobile uses roughly a 1.25 step and desktop roughly 1.333, rounded to whole px. The breakpoint is `min-width: 768px`. Libre Caslon Text has a tall cap height (0.77 em), so 17 px reads like 18–19 px Georgia. Courier Prime has a small x-height (0.45 em), so the mono sizes run one step larger than you'd expect.

| Token | Family / weight | Mobile px | Desktop px | Line-height | Tracking | Use |
|---|---|---|---|---|---|---|
| `plaque-xl` | Castoro Titling 400 | 34 | 60 | 1.10 | 0.06em | Vault door: "YOUR DOLLARS, BEHIND TWO KEYS." |
| `plaque-l` | Castoro Titling 400 | 24 | 36 | 1.15 | 0.10em | Compartment plaques: LOCKER / SAVINGS / PASSBOOK |
| `plaque-m` | Castoro Titling 400 | 16 | 20 | 1.20 | 0.16em | Box number tags, button caps, "PROTECTED AGAINST QUANTUM COMPUTERS" |
| `plaque-s` | Castoro Titling 400 | 14 | 14 | 1.25 | 0.20em | Tiny engraved labels (floor: never below 14) |
| `h2` | Libre Caslon Text 700 | 22 | 28 | 1.25 | 0 | Screen headings in sentence case |
| `h3` | Libre Caslon Text 700 | 18 | 21 | 1.30 | 0 | Card titles |
| `body` | Libre Caslon Text 400 | 17 | 18 | 1.55 | 0 | Paragraphs, instructions |
| `note` | Libre Caslon Text 400i | 15 | 15 | 1.45 | 0 | Savings risk note, emergency-exit explainers (floor 15, never smaller or lighter) |
| `caption` | Libre Caslon Text 400 | 14 | 14 | 1.40 | 0.01em | Footnotes, timestamps in prose |
| `money-hero` | Courier Prime 700 | `clamp(28px, 11vw, 40px)` | 64 | 1.00 | 0 | Balance on a compartment |
| `money-unit` | Courier Prime 400 | 0.45em of hero | 0.45em of hero | 1.00 | 0.08em | "USDC" after the hero figure |
| `money-row` | Courier Prime 400 | 17 | 17 | 1.50 | 0 | Passbook entry amounts |
| `ledger-label` | Courier Prime 400 caps | 13 | 14 | 1.40 | 0.08em | Passbook date + event type ("25 SEP 2026 · TO SAVINGS") |
| `hash` | Courier Prime 400 | 15 | 15 | 1.40 | 0.02em | `0x8e35…12af`, tx hashes |
| `stamp` | Courier Prime 700 caps | 20 | 26 | 1.00 | 0.12em | Rubber stamps: DEPOSITED, LOCKED, EXIT PENDING (rotate −4°) |

**Width math for mono** (0.6 em per character):
- `money-hero` at 40 px holds 12 characters (`9,999,999.99`) in 288 px, which fits a 320 px content column (360 px phone minus 2 × 20 px padding). `11vw` shrinks it on 320 px phones.
- A single-line passbook row (`25 SEP 2026  TO SAVINGS  104.00 USDC`, 36 characters) needs 367 px at 17 px, so **below 480 px each row stacks**: line 1 is the `ledger-label` on the left; line 2 is `money-row` right-aligned, with `hash` under it.

### Engraved-caps letter-spacing rule

Tracking goes **up as size goes down**, which is how real engravers spaced plaque lettering:

| Rendered size | `letter-spacing` |
|---|---|
| ≥ 48 px | 0.06em |
| 24–47 px | 0.10em |
| 16–23 px | 0.16em |
| 14–15 px | 0.20em |

- Always `text-transform: uppercase; font-kerning: normal; font-synthesis: none;`.
- Tracking adds space after the last letter too. For centred plaques, add `padding-inline-start` equal to the tracking value so the text sits optically centred.
- An incised look via `text-shadow` is fine as decoration, but **contrast is measured on the base colour only**. The shadow doesn't count toward WCAG AA.

### Numbers, tabular figures and formatting

- **Courier Prime is already tabular** (every glyph is 0.6 em). Still declare `font-variant-numeric: tabular-nums` on `.money` and `.hash`, so a fallback font (`Courier New`, `ui-monospace`) behaves the same.
- **Libre Caslon Text in tables**: set `font-variant-numeric: tabular-nums lining-nums`. I confirmed `tnum` is present in the served file. Its default digits are proportional.
- **Never** put amounts in Castoro Titling columns (proportional, no `tnum`).
- Right-align amount columns and always use a fixed number of decimals, so decimal points line up. Format with `Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`.
- **Savings earnings are tiny** at about 0.06% APY: 1,000 USDC earns about 0.0016 USDC a day, which rounds to `0.00`. Show an "earned" line with 6 decimals (USDC's native precision), e.g. `+0.001644 USDC`, so savers can see it growing. Show balances with 2 decimals, and put the exact 6-decimal value in `title` / `aria-label`.
- Join the amount and unit with a no-break space: `1,204.50&nbsp;USDC`. None of the three fonts has U+202F or U+2009 in latin, so don't use them.
- Use a real minus, U+2212 (`−104.00`), for withdrawals. It's present in all three fonts and matches the width of `+`.
- Addresses and hashes:
  - Always lowercase.
  - Truncate to `0x` + 4 … 4 using U+2026 (one glyph, present in all three fonts).
  - Add `translate="no"`, `font-variant-ligatures: none` and `overflow-wrap: anywhere` when shown in full.
  - The full value goes in `title` plus a copy button.

Sample passbook (desktop, one line per entry; mobile stacks as described above):

```
25 SEP 2026   DEPOSIT          1,204.50 USDC   0x8e35…12af
25 SEP 2026   TO SAVINGS        −104.00 USDC   0x3b1c…90de
26 SEP 2026   EARNED           +0.001644 USDC
02 OCT 2026   EXIT STARTED            —        0x77a2…c4f1
```

### CSS tokens

```css
:root {
  --font-plaque: "Castoro Titling", "Trajan Pro", "Times New Roman", serif;
  --font-body: "Libre Caslon Text", Georgia, "Times New Roman", serif;
  --font-money: "Courier Prime", "Courier New", ui-monospace, monospace;
}
.plaque { font-family: var(--font-plaque); font-weight: 400; text-transform: uppercase;
          font-kerning: normal; font-synthesis: none; }
.money, .hash { font-family: var(--font-money); font-variant-numeric: tabular-nums;
                font-variant-ligatures: none; }
.money { text-align: end; white-space: nowrap; }
.hash { text-transform: lowercase; }
```

## Exact `<link>` tag (Pairing A)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Castoro+Titling&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet">
```

This URL was verified to return HTTP 200. `display=swap` shows the fallback stack immediately, which matters because reviewers give the page about 2 minutes.

Alternate links, in case Jay picks B or C:

```html
<!-- B: Brass & Ledger (114 KB) -->
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<!-- C: Teller's Window (74 KB) -->
<link href="https://fonts.googleapis.com/css2?family=Marcellus+SC&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
```
