# Arc Guard — design system (locked 2026-09-25)

**Chosen direction:** C, "The Custodian" (`design/prototypes/C-custodian.html`). It is the reference for every screen, state, string and motion. Jay chose it over A (the Big Door) because A was confusing.

- **Look:** a bank-green enamel cabinet on an ivory worktop, lamp light from the upper left, a brass number plate, and two labelled key sockets (WALLET, KEY CARD). The Locker is a steel drawer and Savings is a glass jar.
- **Fonts:** Newsreader 500 for headings, IBM Plex Sans 400/500 for UI, IBM Plex Mono 400/500 for money, hashes and the passbook.
- **Colours:** ivory `#F1EDE2`, ink `#202B28`, green `#24483F`, steel `#B6BFBB`, brass `#9A773F` (decoration only, never text), red `#923D32`.
- **Motion:** `cubic-bezier(.22,.61,.36,1)`, no bounce. The door swings 18° over 480 ms. The keys turn 30° over 320 ms, and the bolt moves 6 px over 160 ms, **only after the transaction receipt arrives**.
- **Sound:** `design/research/sound-motion.md` (`sound.js`).
- **Copy:** `design/research/copy.md`. The name is **Arc Guard**. The footer states "Not approved, endorsed or run by Circle."
- **Flows and states:** `design/research/ux-journey.md`.
