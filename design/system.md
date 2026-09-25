# Arc Guard: design system (locked 25 Sep 2026)

**Style:** High-Fidelity Claymorphism ("digital clay"), limited to **two colours: blue `#0000FF` and white `#FFFFFF`**.
- Every lighter or darker tone is `#0000FF` or white at some opacity, or a blend of the two.
- No other hue anywhere: no violet, pink, green, amber, red or grey.
- Urgency, errors and success are shown by form (filled clay, weight, icons, position), never by a new colour.

**Layout base:** direction C, "The Custodian". The safe-deposit cabinet is the hero object, with a Locker drawer, a Savings jar and two key sockets (WALLET and KEY CARD). It is rendered as a chunky, soft blue clay object.

**Text:**
- **Very little.** Headlines are 2–5 words, with at most one short line under a headline. Buttons are 1–3 words. No paragraphs.
- **Explanations** sit behind a "?" or "Details".
- **Always visible:** the one-line Savings risk note, errors, and the emergency-exit banner.
- **Motion:** no typewriter or typing effects.

## Tokens (CSS custom properties, one `:root` block)
```css
:root {
  --blue: #0000FF;
  --white: #FFFFFF;
  --canvas: color-mix(in srgb, #0000FF 3%, #FFFFFF);        /* faint blue-white page */
  --card: color-mix(in srgb, #FFFFFF 70%, transparent);    /* glass-clay */
  --ink: #0000FF;                                           /* all text is blue */
  --ink-muted: color-mix(in srgb, #0000FF 72%, #FFFFFF);    /* never lighter than this for text */
  --blue-soft: color-mix(in srgb, #0000FF 8%, #FFFFFF);     /* recessed fields, chips */
  --blue-light: color-mix(in srgb, #0000FF 45%, #FFFFFF);   /* gradient start */
  --grad-primary: linear-gradient(135deg, var(--blue-light), var(--blue));

  --r-hero: 48px; --r-card: 32px; --r-mid: 24px; --r-btn: 20px; --r-icon: 16px;

  --shadow-surface:
    30px 30px 60px rgba(0,0,255,.10), -30px -30px 60px #FFFFFF,
    inset 10px 10px 20px rgba(0,0,255,.04), inset -10px -10px 20px rgba(255,255,255,.8);
  --shadow-card:
    16px 16px 32px rgba(0,0,255,.12), -10px -10px 24px rgba(255,255,255,.9),
    inset 6px 6px 12px rgba(0,0,255,.03), inset -6px -6px 12px #FFFFFF;
  --shadow-card-hover:
    22px 22px 44px rgba(0,0,255,.16), -12px -12px 28px #FFFFFF,
    inset 6px 6px 12px rgba(0,0,255,.03), inset -6px -6px 12px #FFFFFF;
  --shadow-button:
    12px 12px 24px rgba(0,0,255,.30), -8px -8px 16px rgba(255,255,255,.4),
    inset 4px 4px 8px rgba(255,255,255,.4), inset -4px -4px 8px rgba(0,0,120,.25);
  --shadow-button-hover:
    16px 16px 30px rgba(0,0,255,.38), -8px -8px 16px rgba(255,255,255,.5),
    inset 4px 4px 8px rgba(255,255,255,.45), inset -4px -4px 8px rgba(0,0,120,.25);
  --shadow-pressed:
    inset 10px 10px 20px rgba(0,0,255,.12), inset -10px -10px 20px #FFFFFF;

  --font-display: "Nunito", system-ui, sans-serif;   /* 700/800/900: headings, numbers */
  --font-body: "DM Sans", system-ui, sans-serif;     /* 400/500/700 */
  --font-mono: ui-monospace, "SF Mono", monospace;   /* hashes only */

  --ease-soft: cubic-bezier(.34,1.56,.64,1);         /* bouncy clay (hover/press) */
  --ease-out: cubic-bezier(.22,.61,.36,1);
}
```
Note: `rgba(0,0,120,…)` is a darker shade of the same blue, used only inside shadows for shading.

## Components
- **Button:** height 56px (lg 64px), `--r-btn`, bold Nunito, and `--grad-primary` with white text and `--shadow-button`. Secondary buttons are white with blue text and `--shadow-button`. Hover: lift 4px and `--shadow-button-hover`. Active: `scale(.92)` and `--shadow-pressed`, 200ms. Focus: a 4px ring in `rgba(0,0,255,.3)`. Full width on phones.
- **Card:** `--r-card`, `--card` with `backdrop-filter: blur(24px)`, `--shadow-card`, padding 32px (24px on phones). Hover (when interactive): lift 8px and `--shadow-card-hover`, 500ms.
- **Input:** 64px tall, radius 16px, `--blue-soft` with `--shadow-pressed`, 18px text. Focus: white with a 4px ring.
- **Stat orb / icon:** a round `--grad-primary` orb with a white icon, animated with `clay-breathe`.
- **Cabinet (hero):** a blue clay block, `--r-hero` radius and `--shadow-surface`.
  - Circular door: a white clay disc with a blue handle.
  - Two key sockets: pressed wells. Each gets a filled blue orb when its key is used.
  - Locker drawer: a white clay slab.
  - Savings jar: a rounded glass-clay jar filled with blue clay coins.
- **Emergency banner:** a full-width, filled blue clay bar with white bold text and an icon. It is sticky.
- **Passbook:** a white clay card. Rows have blue text, hairlines at `rgba(0,0,255,.15)` and rounded blue "stamp" chips.

## Background
Canvas colour, plus 3 fixed blobs:
- Size 60vh, `rgba(0,0,255,.08)` / `.06` / `.05`, `blur(64px)`.
- They drift with `clay-float` (8s), `clay-float-delayed` (10s) and `clay-float-slow` (12s), with staggered 2s and 4s delays.

## Motion
- Hover lifts elements and press squishes them.
- `clay-breathe` (6s, scale 1→1.02) runs on orbs.
- Keys turn and the drawer slides **only after the transaction receipt**.
- `prefers-reduced-motion`: all motion is off; sounds still play.

## Type scale
- Hero: 48px on phones, 64px on sm, 80px on lg; Nunito 900, tracking -0.02em, line-height 1.1.
- Section: 32/40/48px, weight 800.
- Card title: 22–28px, weight 800.
- Body: 16–18px DM Sans 500, line-height 1.6.
- Labels: 12–14px, weight 700, uppercase, letter-spacing 0.08em.
