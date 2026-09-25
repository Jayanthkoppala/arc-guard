# Sound & Motion: Arc Guard

A 1950s bank is heavy, slow and certain. Everything that moves here has **mass**: it takes effort to start, it glides, and it stops against something solid. Nothing bounces, springs or wobbles. The "safe" feeling comes from that last moment, the **clunk**, when a heavy thing hits its stop and stays there.

Three rules decide every choice below:

1. **Motion never claims what the chain hasn't done.** Keys turn and the box slides out only after the withdrawal receipt arrives. While we wait on the network, the UI shows waiting (ticking, a lamp glow), not success.
2. **Sound only answers the user.** Sounds play for the user's own clicks and for chain confirmations of the user's own actions. Passive updates (live interest, passbook loading, polling) are always silent.
3. **One clock per moment.** Each choreographed moment starts from a single `t0`. Audio is scheduled with `at` offsets and animations with the same `delay`s, so the clunk lands on the frame where the key stops.

---

## Part 1: Sound

### Defaults and policy

| Decision | Value | Why |
|---|---|---|
| Default | **On**, but no `AudioContext` exists until the first click ("Open the vault" / Connect) | Reviewers should hear the door. Browsers block audio before a user gesture anyway, so nothing ever plays unasked. |
| Toggle | Brass toggle top-right, label "Sound: on" / "Sound: off", `aria-pressed`, persisted in `localStorage['pqg-sound']` | One click to silence, and it stays off. |
| Master volume | `0.5` into a gentle compressor (−14 dB, 4:1) | Leaves headroom when sounds overlap (coins + stamp). |
| Room | Synthetic 0.9 s impulse (decaying noise) as a convolver send, 0.1–0.4 per sound | Gives a marble banking-hall tail and a sense of size without samples. |
| Reduced motion | Does **not** mute sound | Sound is not vestibular. The toggle is the only mute. |
| iOS ring/silent switch | Leave `navigator.audioSession` alone | With the default `auto`, Web Audio respects the silent switch. That's the polite behaviour for a bank. |
| Loops | None, except the signing tick, which stops the moment signing ends | |

Loudness was measured by rendering each recipe offline with `node-web-audio-api` at 48 kHz, through master 0.5 and the compressor, in dBFS (0 = digital full scale). Loudest to softest, the heavy moments lead: clunk, stamp and door sit at −7 to −9 dB peak, the reward (coin) and the bell sit in the middle, and the error and tick sit underneath.

| Sound | Length | Peak dBFS | RMS dBFS* | When |
|---|---|---|---|---|
| `keyTurn()` (ends in the clunk) | 0.8 s | −7.4 | −28.5 | Withdrawal receipt confirmed |
| `stamp()` | 0.4 s | −7.6 | −29.7 | Passbook stamp: DEPOSITED / SAVED / WITHDRAWN |
| `vaultDoor()` | 3.5 s | −9.3 | −26.8 | Landing, after Connect succeeds |
| `emergencyBell()` | 2.6 s | −13.1 | −29.1 | Emergency exit requested, or cancelled with the key card |
| `coin()` | 0.7 s | −13.6 | −36.2 | Each coin dropping into the Savings jar |
| `drawerSlide()` | 1.1 s | −15.2 | −38.0 | Box slides out after the clunk |
| `keyInsert()` | 0.4 s | −22.1 | −44.6 | Key card loaded into keyhole 2 |
| `errorBuzz()` | 0.6 s | −22.7 | −32.1 | Wrong key card, rejected or failed transaction |
| `startTicking()` | loop, 300 ms beat | −32.8 per beat | n/a | While the key card signs (1 s desktop, 3–8 s phone) |

\*RMS over the render window (render length ≈ sound length + 0.2–0.5 s tail). Tuning knob: `vol`, the first argument to `bus(vol, wet)` in each recipe. 6 dB ≈ ×2.

### The module: `src/sound.js` (drop-in, no dependencies)

Every recipe takes `at` (seconds from now) so a choreography can schedule a whole sequence from one `t0`. Each recipe returns early when sound is off or not unlocked yet, so callers never need to check.

```js
// sound.js: every Arc Guard sound is synthesised with Web Audio. No samples, no libraries.
const PREF = 'pqg-sound';
const MASTER = 0.5;
let ctx = null, out = null, room = null, noise = null;
export let soundOn = globalThis.localStorage?.getItem(PREF) !== 'off'; // default: on

export function setSound(on) {
  soundOn = on;
  globalThis.localStorage?.setItem(PREF, on ? 'on' : 'off');
  if (out) out.gain.setTargetAtTime(on ? MASTER : 0, ctx.currentTime, 0.03); // also silences anything mid-play
}

// Call from the first user gesture (Open the vault / Connect). Before that, browsers refuse to play.
export function unlockAudio(c) {
  if (ctx) return ctx.resume();
  ctx = c || new AudioContext({ latencyHint: 'interactive' });
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.25;
  out = ctx.createGain(); out.gain.value = soundOn ? MASTER : 0;
  out.connect(comp).connect(ctx.destination);
  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); // 1 s of white noise, shared
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const ir = ctx.createBuffer(2, Math.floor(ctx.sampleRate * 0.9), ctx.sampleRate); // marble hall
  for (let ch = 0; ch < 2; ch++) {
    const r = ir.getChannelData(ch);
    for (let i = 0; i < r.length; i++) r[i] = (Math.random() * 2 - 1) * (1 - i / r.length) ** 3;
  }
  room = ctx.createConvolver(); room.buffer = ir; room.connect(out);
  return ctx.resume?.();
}

// ---------- primitives ----------
const ready = () => ctx && soundOn;
const now = (at) => ctx.currentTime + 0.02 + at;

function bus(vol, wet) { // per-sound gain, with a send into the room
  const g = ctx.createGain(); g.gain.value = vol; g.connect(out);
  const s = ctx.createGain(); s.gain.value = wet; g.connect(s).connect(room);
  return g;
}
function env(dest, t, peak, attack, decay) { // exponential attack/decay on a fresh gain node
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  g.connect(dest); return g;
}
function hold(dest, t, peak, attack, sustain, release) { // attack, flat sustain, release
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.setValueAtTime(peak, t + attack + sustain);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + sustain + release);
  g.connect(dest); return g;
}
function noiseBurst(dest, t, dur, type, freq, q = 1) { // filtered noise; returns the filter
  const src = ctx.createBufferSource(); src.buffer = noise; src.loop = true;
  const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(freq, t);
  src.connect(f).connect(dest);
  src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
  return f;
}
function tone(dest, t, dur, type, f0, f1 = f0) { // oscillator with optional pitch glide
  const o = ctx.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  o.connect(dest); o.start(t); o.stop(t + dur + 0.05);
  return o;
}
const thud = (dest, t, f0, f1, dur, vol) => tone(env(dest, t, vol, 0.004, dur), t, dur, 'sine', f0, f1);
const tick = (dest, t, hz, vol, q = 6, dur = 0.03) => noiseBurst(env(dest, t, vol, 0.001, dur), t, dur, 'bandpass', hz, q);

// ---------- recipes ----------

// Round steel vault door. 0–0.64 s: four bolts retract. 0.75 s: the door breaks away and swings
// with a low rumble and a hinge groan. 2.95 s: it comes to rest. Matches --dur-door-* tokens.
export function vaultDoor(at = 0) {
  if (!ready()) return;
  const t = now(at), b = bus(1, 0.35);
  for (let i = 0; i < 4; i++) { // bolts, 160 ms apart, each a steel click + a low knock
    const ti = t + i * 0.16;
    tick(b, ti, 1900 + i * 140, 0.35, 4, 0.05);
    thud(b, ti, 140, 70, 0.14, 0.45);
  }
  const s = t + 0.75; // swing starts
  const rumble = hold(b, s, 0.5, 0.6, 0.6, 1.2); // 2.4 s of mass moving
  noiseBurst(rumble, s, 2.4, 'lowpass', 140, 0.7);
  const sub = ctx.createBiquadFilter(); sub.type = 'lowpass'; sub.frequency.value = 110;
  const subGain = ctx.createGain(); subGain.gain.value = 0.6;
  sub.connect(subGain).connect(rumble);
  tone(sub, s, 2.4, 'sawtooth', 42, 31); // pitch sags as the door slows
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 9;
  bp.connect(hold(b, s + 0.2, 0.12, 0.5, 0.6, 0.7)); // hinge groan
  const groan = tone(bp, s + 0.2, 1.8, 'sawtooth', 95, 80);
  const lfo = ctx.createOscillator(), depth = ctx.createGain(); // slow stick-slip wobble
  lfo.frequency.value = 7; depth.gain.value = 6;
  lfo.connect(depth).connect(groan.frequency); lfo.start(s + 0.2); lfo.stop(s + 2.05);
  thud(b, s + 2.2, 90, 40, 0.5, 0.8); // comes to rest against the stop
  tick(b, s + 2.2, 600, 0.2, 2, 0.08);
}

// Key card goes into keyhole 2: bright brass-on-steel scrape, five pin tumblers lift, key seats.
export function keyInsert(at = 0) {
  if (!ready()) return;
  const t = now(at), b = bus(0.7, 0.1);
  const f = noiseBurst(env(b, t, 0.18, 0.02, 0.26), t, 0.28, 'bandpass', 2600, 3);
  f.frequency.exponentialRampToValueAtTime(4200, t + 0.28); // pitch rises as the blade slides in
  [3900, 4300, 3600, 4700, 4100].forEach((hz, i) => tick(b, t + 0.05 + i * 0.045, hz, 0.22, 10, 0.02));
  thud(b, t + 0.3, 220, 120, 0.06, 0.3);
}

// Both keys turn a quarter turn over three detents, then the bolt throws: CLUNK at +320 ms.
export function keyTurn(at = 0) {
  if (!ready()) return;
  const t = now(at), b = bus(1, 0.3);
  noiseBurst(env(b, t, 0.08, 0.05, 0.25), t, 0.3, 'bandpass', 1200, 2); // friction
  [0, 0.1, 0.2].forEach((d) => tick(b, t + d, 2400 - d * 2000, 0.25, 8, 0.025)); // detents
  const c = t + 0.32; // the clunk: low body, mid knock, faint steel ring
  thud(b, c, 120, 50, 0.3, 0.9);
  tick(b, c, 650, 0.5, 1.5, 0.07);
  tone(env(b, c, 0.05, 0.002, 0.45), c, 0.45, 'sine', 1180);
  tone(env(b, c, 0.03, 0.002, 0.35), c, 0.35, 'sine', 2710);
}

// Safe deposit box slides out of the wall on steel runners and stops against its catch.
export function drawerSlide(at = 0, dur = 0.9) {
  if (!ready()) return;
  const t = now(at), b = bus(0.8, 0.2);
  const f = noiseBurst(hold(b, t, 0.25, 0.12, dur - 0.32, 0.2), t, dur, 'bandpass', 380, 1.2);
  f.frequency.linearRampToValueAtTime(260, t + dur); // runner pitch drops as it slows
  for (let d = 0.05; d < dur - 0.1; d += 0.07) tick(b, t + d, 1100, 0.05, 4, 0.02); // rollers
  thud(b, t + dur, 130, 60, 0.18, 0.5);
}

// Rubber stamp on paper on a wooden counter: thump + dry slap + wood knock, then the inked peel.
export function stamp(at = 0) {
  if (!ready()) return;
  const t = now(at), b = bus(1, 0.2);
  thud(b, t, 160, 55, 0.12, 0.9);
  noiseBurst(env(b, t, 0.35, 0.002, 0.06), t, 0.07, 'lowpass', 900, 0.8);
  tick(b, t + 0.004, 380, 0.3, 5, 0.09);
  noiseBurst(env(b, t + 0.22, 0.06, 0.01, 0.05), t + 0.22, 0.06, 'highpass', 2500, 0.7);
}

// A coin drops into the glass Savings jar: hit, two smaller bounces, the jar answers once.
export function coin(at = 0) {
  if (!ready()) return;
  const t = now(at), b = bus(0.8, 0.25);
  const base = 2400 * (0.96 + Math.random() * 0.08); // ±4% so repeated coins aren't clones
  [[0, 1], [0.085, 0.45], [0.14, 0.2]].forEach(([d, v]) => {
    [1, 1.47, 2.09, 2.56].forEach((r, i) => // inharmonic partials of a small metal disc
      tone(env(b, t + d, (0.25 * v) / (i + 1), 0.001, 0.35 - i * 0.06), t + d, 0.4, 'sine', base * r));
  });
  tone(env(b, t, 0.1, 0.003, 0.7), t, 0.7, 'sine', 1320); // hollow glass body
  tick(b, t, 5000, 0.2, 1, 0.012); // hard contact transient
}

// Soft escapement tick-tock while the key card signs. Returns stop(); call it when signing ends.
export function startTicking() {
  if (!ready()) return () => {};
  const b = bus(0.5, 0.15);
  let n = 0;
  const beat = () => {
    const t = ctx.currentTime + 0.01;
    tick(b, t, n++ % 2 ? 2600 : 3300, 0.5, 12, 0.018);
    thud(b, t, 900, 700, 0.02, 0.1);
  };
  beat();
  const id = setInterval(beat, 300); // ponytail: setInterval jitter ~ms; signing runs in a worker so the main thread is idle
  return () => { clearInterval(id); b.gain.setTargetAtTime(0, ctx.currentTime, 0.03); };
}

// Wrong key card / failed transaction. Calm: a low double buzz, then the key rattles and won't turn.
export function errorBuzz(at = 0) {
  if (!ready()) return;
  const t = now(at), b = bus(0.6, 0.1);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500; lp.connect(b);
  [0, 0.2].forEach((d) => tone(hold(lp, t + d, 0.18, 0.015, 0.1, 0.04), t + d, 0.16, 'square', 98));
  [0.42, 0.5, 0.56].forEach((d) => tick(b, t + d, 1800, 0.12, 6, 0.02));
}

// Emergency exit requested / cancelled. An old bank alarm bell: the clapper hits a steel gong
// 16 times a second for `seconds`, then the gong rings out. Never looped.
export function emergencyBell(at = 0, seconds = 1.1) {
  if (!ready()) return;
  const t = now(at), b = bus(0.5, 0.4), ring = ctx.createGain();
  ring.gain.setValueAtTime(0.0001, t); ring.connect(b);
  [[1, 0.5], [2.32, 0.25], [4.25, 0.15], [6.63, 0.08]].forEach(([r, v]) => { // gong partials
    const g = ctx.createGain(); g.gain.value = v; g.connect(ring);
    tone(g, t, seconds + 1.5, 'sine', 740 * r);
  });
  for (let i = 0; i < seconds * 16; i++) { // each strike re-excites the gong
    const s = t + i / 16;
    ring.gain.setValueAtTime(1, s); ring.gain.setTargetAtTime(0.35, s, 0.02);
    tick(b, s, 3000, 0.08, 3, 0.01);
  }
  ring.gain.setTargetAtTime(0.0001, t + seconds, 0.45);
}
```

Notes on the recipes:

- **Mass is sub-bass plus slowness.** The door's weight comes from the 42→31 Hz sawtooth under a 110 Hz lowpass and a 600 ms swell, not from loudness. Phone speakers drop everything under ~150 Hz, so each heavy sound also has a mid knock (600–650 Hz `tick`) that still reads as "solid" on a phone.
- **Every repeated sound varies.** The coin pitch varies ±4% and noise starts at a random offset. Three coins in a row then sound like three coins, not one sample played three times.
- **The error is not an alarm.** It's 98 Hz, lowpassed at 500 Hz, and shorter than the clunk. The review focus asks for a "clear, calm error"; the sound says "that key doesn't fit", not "you broke something".
- **The bell is for one moment only.** It plays when the user starts or cancels an emergency exit. A pending exit found on page load gets the red tag and **no** bell, because sound only answers the user.

---

## Part 2: Motion

### Principles

- Animate only `transform` and `opacity` (plus `clip-path` for the jar level). Shadows move by fading a pre-rendered `::after` layer, never by animating `box-shadow`.
- Add `will-change: transform` only during a choreography and remove it after. The door is the only 3D element: `perspective: 1600px` on its parent, `transform-origin: left center`.
- Easing has **no overshoot**: every cubic-bezier keeps y1 and y2 inside [0, 1]. Mechanical "settle" is a separate tiny keyframe (1–2 px or 1°), never a spring.
- Use CSS for states and the Web Animations API (`el.animate(...).finished`) for choreography. No GSAP, no Framer Motion.

### Tokens

```css
:root {
  /* easing: weighty, never bouncy */
  --ease-door:    cubic-bezier(0.70, 0, 0.20, 1);    /* slow breakaway, long glide, damped stop */
  --ease-bolt:    cubic-bezier(0.55, 0, 0.90, 0.45); /* accelerates into its stop (a bolt hits home) */
  --ease-drawer:  cubic-bezier(0.45, 0, 0.15, 1);    /* a tug, then decelerates on runners */
  --ease-press:   cubic-bezier(0.55, 0, 1, 0.45);    /* stamp comes down under force: ease-in, hits hard */
  --ease-lift:    cubic-bezier(0.20, 0, 0.20, 1);    /* stamp lifts off, reluctant then free */
  --ease-turn:    cubic-bezier(0.50, 0.05, 0.85, 0.40); /* key turns with effort and ends AT the clunk */
  --ease-fall:    cubic-bezier(0.50, 0, 1, 0.60);    /* coin under gravity */
  --ease-fill:    cubic-bezier(0.25, 0.10, 0.25, 1); /* jar level rises and settles */
  --ease-settle:  cubic-bezier(0.20, 0, 0, 1);       /* default UI: panels, cards, paper */

  /* durations */
  --dur-press:        80ms;   /* brass button goes down 2px */
  --dur-release:      160ms;  /* button comes back up */
  --dur-quick:        160ms;  /* hover sheen, focus ring */
  --dur-base:         280ms;  /* panels, sheets, explorer link reveal */
  --dur-slow:         600ms;  /* keyhole plate rises, page turn */
  --dur-door-bolts:   640ms;  /* 4 bolts x 120ms, 160ms stagger; handle wheel turns 270deg */
  --dur-door-swing:   2200ms; /* starts at +750ms, rests at +2950ms */
  --dur-key-insert:   300ms;
  --dur-key-turn:     320ms;  /* ends exactly on the clunk */
  --dur-drawer:       900ms;
  --dur-stamp-down:   110ms;
  --dur-stamp-hold:   90ms;
  --dur-stamp-lift:   260ms;
  --dur-coin-fall:    420ms;
  --dur-coin-stagger: 140ms;
  --dur-jar-fill:     1200ms;
  --dur-count:        600ms;  /* balance digits roll (odometer) */
  --dur-type-char:    38ms;   /* typewriter reveal, per character, steps(1) */
  --dur-tag-swing:    1400ms; /* emergency red tag drops in and settles */
  --dur-flip:         250ms;  /* countdown digit flip */
}
```

| Token | Value | Used for | Paired sound |
|---|---|---|---|
| Door bolts | 640 ms total (4 × 120 ms, 160 ms stagger), `--ease-bolt`, `translateX(-14px)` each; handle wheel `rotate(270deg)` over 640 ms, `--ease-door` | Landing, after Connect | `vaultDoor()` bolt clicks at 0 / 160 / 320 / 480 ms |
| Door swing | 2200 ms, delay 750 ms, `--ease-door`, `rotateY(0 → -108deg)`; lamp light spill `opacity 0→1` over 1400 ms from +900 ms | Landing | `vaultDoor()` rumble; rest thud at +2950 ms |
| Drawer slide | 900 ms, `--ease-drawer`, `translateY(0 → 64%)` of the drawer's height (the box is pulled down and toward you out of the wall grid, the same on phone and desktop). The drawer's own shadow `::after` fades in over the same 900 ms. | Withdrawal, and first view of the box | `drawerSlide()`, end thud at +900 ms |
| Stamp press | down 110 ms `--ease-press` (`scale 1.35 → 1`, `rotate -8deg → -3deg`, `opacity 0 → 1`), hold 90 ms, then the *ink mark* stays and the stamp body lifts 260 ms `--ease-lift` (`translateY -24px`, `opacity → 0`). Paper under it nudges `translateY(1px)` for 60 ms at contact | Passbook line confirmed | `stamp()` at contact (+110 ms) |
| Jar fill | coins: 3 coins, each 420 ms `--ease-fall` `translateY(-120px → 0)`, 140 ms stagger; level: `clip-path: inset(X% 0 0 0)` over 1200 ms `--ease-fill`, starting when coin 1 lands | Move to Savings confirmed | `coin()` at each landing (+420, +560, +700 ms) |
| Key insert | 300 ms `--ease-drawer`, `translateX(40px → 0)` into keyhole 2 | Key card file loaded | `keyInsert()` |
| Key turn | 320 ms `--ease-turn`, `rotate(0 → 90deg)`; then the lock plate `translateY(0 → 1.5px → 0)` over 90 ms (the clunk felt through the steel) | Withdrawal receipt | `keyTurn()`: clunk at +320 ms |
| Key reject | 360 ms linear, `rotate: 0, 6, -4, 5, -3, 0 deg` (tries to turn, won't), then key withdraws 280 ms `--ease-settle` | Wrong key card | `errorBuzz()` |
| Counter roll | 600 ms `--ease-settle`, digits roll vertically, only digits that change | Balances after a confirmed action | none |
| Live interest | Roll a digit **only when the on-chain `convertToAssets(shares)` value actually changes** (poll every 10 s): the changed digits crossfade over 400 ms with no roll. Between changes, the liveness signal is the line "Checked with Arc 4 s ago · block N": the seconds count up in plain text and reset on each poll, and a 6 px brass dot pulses once (opacity 0.4 → 1 → 0.4, 800 ms) per poll. At the measured 0.0558% APY a 6-dp balance changes about every 56,516 / balance seconds ($100 → every 9.4 min, $1,000 → 57 s), so faking a per-second tick would mean inventing digits. | Savings jar | none (passive) |
| Emergency tag | 1400 ms, `transform-origin: top center`, keyframes `rotate(-14deg) 0%, 5deg 35%, -2deg 65%, 0 100%`, `--ease-settle` per segment. This is a damped pendulum (a physical hanging tag), not a spring. | Emergency exit requested / page load with a pending exit | `emergencyBell()` only when the user requested it |
| Countdown flip | 250 ms `rotateX(0 → -90deg)` old digit, then the new digit `90deg → 0`, `--ease-press` / `--ease-settle` | 7-day exit countdown, seconds only | none |
| Buttons | press 80 ms `translateY(2px)`, and the brass edge `::after` shadow opacity 1 → 0.4; release 160 ms `--ease-settle`. No hover scale. | Everywhere | none (a click sound on every button gets tiresome in 2 minutes) |
| Signing progress | see the choreography below | Withdrawal, rotate key, cancel exit | `startTicking()` |

### Choreography: the withdrawal (the moment the demo is built around)

The honest order is: sign with the key card (browser, 1–8 s), then the wallet sends the transaction, then Arc confirms. The keys turn **only on the receipt**.

| t | Visual | Sound | Screen-reader (`aria-live="polite"`) |
|---|---|---|---|
| Tap **Withdraw** | Lamp dims to 70% (`opacity`, 400 ms). The keyhole plate rises from below (600 ms, `--ease-settle`). Keyhole 1 already holds a brass key tagged **Wallet**. Keyhole 2 is empty and says "Key card". | none | "Two keys needed. Your wallet is key 1. Load your key card for key 2." |
| Key card loaded | Key 2 slides in (300 ms). | `keyInsert()` | "Key card loaded." |
| Signing starts | Under the keyholes a brass bar fills. There is no real progress signal (SLH-DSA signs in one call), so the fill is an honest *estimate*: `p = 0.9 · (1 − e^(−t/τ))`, with τ = 0.4 s on desktop and τ = 2 s on touch devices. It never passes 90% until the worker returns, then it runs to 100% in 200 ms. The key 2 tag glows softly (opacity pulse 0.6 ↔ 1, 1600 ms, the only looping animation). | `startTicking()`, 300 ms beat | "Signing with your key card. On a phone this takes a few seconds." |
| Signature ready | Bar completes and the tick stops. A small ink mark **PQ SIGNED** appears beside keyhole 2 (the stamp keyframes at 60% scale, no sound). Keyhole 1's key tag glows. | tick stops | "Key card signed. Confirm in your wallet." |
| Wallet popup / tx pending | Nothing moves in our UI. The Key 1 glow continues. After the wallet returns a hash: "Sending to Arc…" in typewriter text. | none | "Sending to Arc." |
| **Receipt**: `t0` | Both keys turn together (320 ms, `--ease-turn`). | `keyTurn(0)` | |
| t0 + 320 ms | CLUNK. The lock plate shudders 1.5 px (90 ms). | (clunk inside `keyTurn`) | |
| t0 + 440 ms | The box slides out (900 ms, `--ease-drawer`). The lamp returns to 100% over the same 900 ms. | `drawerSlide(0.44)` | |
| t0 + 1340 ms | The box rests. The passbook slip slides up beside it (280 ms). | end thud inside `drawerSlide` | |
| t0 + 1620 ms | **WITHDRAWN** stamp presses onto the slip (down 110 ms). | `stamp(1.73)` (1620 + 110 ms contact) | "Withdrawn: 25.00 USDC to 0x12…ab." |
| t0 + 2080 ms | The transaction line types in (38 ms/char), followed by **"View on Arc explorer →"** (fades in over 280 ms). | none | link is focusable; focus moves to it |

From receipt to explorer link takes about 2.1 s. Long enough to feel, short enough for a 2-minute review.

**Failure branches:**

- **Wrong key card** (public key ≠ box key; check this *before* signing so nobody waits 8 s for a doomed signature): key reject motion + `errorBuzz()`. Key 2 slides back out, and the message says "This key card doesn't match box 0417. Try another card, or use the emergency exit."
- **Wallet rejected or tx reverted:** the keys never turn. The PQ SIGNED mark fades (280 ms), `errorBuzz()` plays, and the plate stays up with "Nothing moved. Your money is still in the box." plus Try again.
- **Signing takes more than 20 s:** the bar holds at 90% and the copy changes to "Still signing. Slow phones can take a while." No error.

The sequence in code, one `t0` for sound and motion:

```js
import { keyTurn, drawerSlide, stamp } from './sound.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ms = (v) => (reduce ? 1 : v); // 1ms, not 0, so .finished and animationend still fire
const ease = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export async function playWithdrawn({ keys, plate, drawer, slip, stampEl, link }) {
  keyTurn(0);
  if (reduce) { // same sounds, no travel: swap to end states with short crossfades
    drawerSlide(0.44); stamp(0.6);
    for (const el of [...keys, drawer, slip, stampEl, link]) el.classList.add('is-done');
    link.focus();
    return;
  }
  await Promise.all(keys.map((k) => k.animate(
    [{ transform: 'rotate(0deg)' }, { transform: 'rotate(90deg)' }],
    { duration: ms(320), easing: ease('--ease-turn'), fill: 'forwards' }).finished));
  plate.animate([{ transform: 'none' }, { transform: 'translateY(1.5px)' }, { transform: 'none' }], { duration: ms(90) });
  drawerSlide(0.12); // 440 ms after t0
  await drawer.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(64%)' }],
    { duration: ms(900), delay: ms(120), easing: ease('--ease-drawer'), fill: 'forwards' }).finished;
  await slip.animate([{ transform: 'translateY(24px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
    { duration: ms(280), easing: ease('--ease-settle'), fill: 'forwards' }).finished;
  stamp(0.11);
  await stampEl.animate([
    { transform: 'scale(1.35) rotate(-8deg)', opacity: 0 },
    { transform: 'scale(1) rotate(-3deg)', opacity: 1, offset: 0.24, easing: ease('--ease-press') },
    { transform: 'scale(1) rotate(-3deg)', opacity: 1 },
  ], { duration: ms(460), fill: 'forwards' }).finished;
  link.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms(280), fill: 'forwards' });
  link.focus();
}
```

(The stamp keyframes are one 460 ms animation: the press takes the first 24% (110 ms), then it holds. The visible lift is the stamp body, a separate element that uses `--ease-lift`.)

### Other choreographies (short)

- **Landing door (after Connect):** `t0` = wallet connected on Arc. `vaultDoor(0)`. Bolts 0–640 ms, handle wheel turns in parallel. Swing 750–2950 ms. Lamp spill 900–2300 ms. The box wall fades up behind the door (600 ms from +2000 ms). Move focus to the box heading at +2950 ms. The door is `aria-hidden`, and a live region says "Vault open."
- **Deposit confirmed:** stamp **DEPOSITED** on the passbook (`stamp()` at contact), the Locker balance rolls (600 ms), then the Locker-or-Savings question card rises (280 ms, from +700 ms).
- **Move to Savings confirmed:** 3 coins fall into the jar, 140 ms apart; `coin(0.42)`, `coin(0.56)`, `coin(0.70)`. The jar level rises over 1200 ms from +420 ms. Stamp **SAVED** at +1700 ms.
- **Emergency exit requested:** the red tag drops and swings (1400 ms) with `emergencyBell(0)`. The countdown types in (38 ms/char). If the page loads with an exit already pending, the tag is static at rest, there's no bell, and it is the first thing in the tab order.

### Reduced motion (`prefers-reduced-motion: reduce`)

Principle: keep **state changes and feedback**, remove **travel, rotation, scale and 3D**. Everything that moves becomes a ≤ 200 ms crossfade to its end state. Sounds still play (see the policy above), collapsed to the same moments.

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --dur-door-bolts: 1ms; --dur-door-swing: 1ms; --dur-key-insert: 1ms; --dur-key-turn: 1ms;
    --dur-drawer: 1ms; --dur-stamp-down: 1ms; --dur-stamp-lift: 1ms; --dur-coin-fall: 1ms;
    --dur-jar-fill: 1ms; --dur-count: 1ms; --dur-tag-swing: 1ms; --dur-flip: 1ms;
    --dur-slow: 200ms; --dur-base: 150ms; /* opacity-only transitions keep a short fade */
  }
  .door, .key, .drawer, .stamp, .coin, .tag, .flip { transition-property: opacity !important; }
  .signing-glow { animation: none; opacity: 1; }
}
```

| Moment | Full motion | Reduced motion |
|---|---|---|
| Door | bolts + 2.2 s swing | Closed-door image crossfades (300 ms) to the open interior. The full `vaultDoor()` still plays. |
| Keys | slide in, turn 90° | Key appears in place, and the turned state swaps in on the receipt. `keyInsert()` / `keyTurn()` play. |
| Drawer | 900 ms slide | Drawer's "out" state fades in (150 ms). |
| Stamp | press + lift | Ink mark fades in at final size (150 ms). |
| Jar | coins fall, level rises | Level set instantly, coins not drawn. The coin sounds still play (they're the reward). |
| Balances | odometer roll | Number replaced. |
| Signing bar | fills + glow pulse | Still fills (it's information), with no pulse. |
| Emergency tag | pendulum swing | Appears at rest. |
| Countdown | digit flip | Text changes. |

Use `1ms`, not `0`, for every duration. A `0s` transition never fires `transitionend`, so any handler that moves focus or starts the next step silently stalls. With `1ms`, every end event and `.finished` promise behaves the same in both modes.

---

## Verification

The two JS blocks above were extracted verbatim from this file by a throwaway harness (not committed) and checked:

1. `node --check` passes on both blocks (the `sound.js` module and `playWithdrawn`).
2. Every `sound.js` recipe was rendered through a real Web Audio implementation: `node-web-audio-api@2.2.0` `OfflineAudioContext`, 48 kHz stereo, injected via `unlockAudio(ctx)`. None threw, none produced NaN, none clipped, none were silent. The numbers are in the loudness table. The muted path (`setSound(false)`, then `vaultDoor()` and `startTicking()()`) returns cleanly without scheduling anything.
3. Not exercised: `playWithdrawn` against a real DOM (it passed the syntax check only), and how these sounds actually come across to a listener. The prototypes (Task 2) are where a human listens on a laptop and a phone speaker and adjusts `bus(vol, …)`.
