// sound.js recipes from design/research/sound-motion.md, plus concept C detent + bolt (ported from the prototype).
const PREF = "pqg-sound", MASTER = 0.5;
let ctx: AudioContext | null = null, out: GainNode | null = null, room: ConvolverNode | null = null, noise: AudioBuffer | null = null;
let soundOn = true;
try { soundOn = localStorage.getItem(PREF) !== "off"; } catch {}

function setSound(on: boolean) {
  soundOn = on;
  try { localStorage.setItem(PREF, on ? "on" : "off"); } catch {}
  if (out && ctx) out.gain.setTargetAtTime(on ? MASTER : 0, ctx.currentTime, 0.03);
}
function unlock() {
  if (ctx) { void ctx.resume(); return; }
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx = new AC({ latencyHint: "interactive" });
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.25;
  out = ctx.createGain(); out.gain.value = soundOn ? MASTER : 0; out.connect(comp).connect(ctx.destination);
  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const ir = ctx.createBuffer(2, Math.floor(ctx.sampleRate * 0.9), ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const r = ir.getChannelData(ch); for (let i = 0; i < r.length; i++) r[i] = (Math.random() * 2 - 1) * (1 - i / r.length) ** 3; }
  room = ctx.createConvolver(); room.buffer = ir; room.connect(out);
  void ctx.resume();
}
const ready = () => !!ctx && soundOn;
const now = (at: number) => ctx!.currentTime + 0.02 + at;
function bus(vol: number, wet: number) { const g = ctx!.createGain(); g.gain.value = vol; g.connect(out!); const s = ctx!.createGain(); s.gain.value = wet; g.connect(s).connect(room!); return g; }
function env(dest: AudioNode, t: number, peak: number, attack: number, decay: number) { const g = ctx!.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay); g.connect(dest); return g; }
function hold(dest: AudioNode, t: number, peak: number, attack: number, sustain: number, release: number) { const g = ctx!.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + attack); g.gain.setValueAtTime(peak, t + attack + sustain); g.gain.exponentialRampToValueAtTime(0.0001, t + attack + sustain + release); g.connect(dest); return g; }
function noiseBurst(dest: AudioNode, t: number, dur: number, type: BiquadFilterType, freq: number, q = 1) { const src = ctx!.createBufferSource(); src.buffer = noise; src.loop = true; const f = ctx!.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(freq, t); src.connect(f).connect(dest); src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05); return f; }
function tone(dest: AudioNode, t: number, dur: number, type: OscillatorType, f0: number, f1 = f0) { const o = ctx!.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur); o.connect(dest); o.start(t); o.stop(t + dur + 0.05); return o; }
const thud = (dest: AudioNode, t: number, f0: number, f1: number, dur: number, vol: number) => tone(env(dest, t, vol, 0.004, dur), t, dur, "sine", f0, f1);
const tick = (dest: AudioNode, t: number, hz: number, vol: number, q = 6, dur = 0.03) => noiseBurst(env(dest, t, vol, 0.001, dur), t, dur, "bandpass", hz, q);

export const SFX = {
  unlock, setSound,
  get on() { return soundOn; },
  keyInsert(at = 0) { if (!ready()) return; const t = now(at), b = bus(0.7, 0.1); const f = noiseBurst(env(b, t, 0.18, 0.02, 0.26), t, 0.28, "bandpass", 2600, 3); f.frequency.exponentialRampToValueAtTime(4200, t + 0.28); [3900, 4300, 3600, 4700, 4100].forEach((hz, i) => tick(b, t + 0.05 + i * 0.045, hz, 0.22, 10, 0.02)); thud(b, t + 0.3, 220, 120, 0.06, 0.3); },
  keyTurn(at = 0) { if (!ready()) return; const t = now(at), b = bus(1, 0.3); noiseBurst(env(b, t, 0.08, 0.05, 0.25), t, 0.3, "bandpass", 1200, 2); [0, 0.1, 0.2].forEach((d) => tick(b, t + d, 2400 - d * 2000, 0.25, 8, 0.025)); const c = t + 0.32; thud(b, c, 120, 50, 0.3, 0.9); tick(b, c, 650, 0.5, 1.5, 0.07); tone(env(b, c, 0.05, 0.002, 0.45), c, 0.45, "sine", 1180); tone(env(b, c, 0.03, 0.002, 0.35), c, 0.35, "sine", 2710); },
  drawerSlide(at = 0, dur = 0.9) { if (!ready()) return; const t = now(at), b = bus(0.8, 0.2); const f = noiseBurst(hold(b, t, 0.25, 0.12, dur - 0.32, 0.2), t, dur, "bandpass", 380, 1.2); f.frequency.linearRampToValueAtTime(260, t + dur); for (let d = 0.05; d < dur - 0.1; d += 0.07) tick(b, t + d, 1100, 0.05, 4, 0.02); thud(b, t + dur, 130, 60, 0.18, 0.5); },
  stamp(at = 0) { if (!ready()) return; const t = now(at), b = bus(1, 0.2); thud(b, t, 160, 55, 0.12, 0.9); noiseBurst(env(b, t, 0.35, 0.002, 0.07), t, 0.08, "lowpass", 450, 0.8); tick(b, t + 0.004, 380, 0.3, 5, 0.09); noiseBurst(env(b, t + 0.22, 0.06, 0.01, 0.05), t + 0.22, 0.06, "highpass", 2500, 0.7); },
  coin(at = 0) { if (!ready()) return; const t = now(at), b = bus(0.8, 0.25); const base = 2400 * (0.96 + Math.random() * 0.08); [[0, 1], [0.085, 0.45], [0.14, 0.2]].forEach(([d, v]) => { [1, 1.47, 2.09, 2.56].forEach((r, i) => tone(env(b, t + d, (0.25 * v) / (i + 1), 0.001, 0.35 - i * 0.06), t + d, 0.4, "sine", base * r)); }); tone(env(b, t, 0.1, 0.003, 0.7), t, 0.7, "sine", 1320); tick(b, t, 5000, 0.2, 1, 0.012); },
  errorBuzz(at = 0) { if (!ready()) return; const t = now(at), b = bus(0.6, 0.1); const lp = ctx!.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 500; lp.connect(b); [0, 0.2].forEach((d) => tone(hold(lp, t + d, 0.18, 0.015, 0.1, 0.04), t + d, 0.16, "square", 98)); [0.42, 0.5, 0.56].forEach((d) => tick(b, t + d, 1800, 0.12, 6, 0.02)); },
  emergencyBell(at = 0, seconds = 1.1) { if (!ready()) return; const t = now(at), b = bus(0.5, 0.4), ring = ctx!.createGain(); ring.gain.setValueAtTime(0.0001, t); ring.connect(b); [[1, 0.5], [2.32, 0.25], [4.25, 0.15], [6.63, 0.08]].forEach(([r, v]) => { const g = ctx!.createGain(); g.gain.value = v; g.connect(ring); tone(g, t, seconds + 1.5, "sine", 740 * r); }); for (let i = 0; i < seconds * 16; i++) { const s = t + i / 16; ring.gain.setValueAtTime(1, s); ring.gain.setTargetAtTime(0.35, s, 0.02); tick(b, s, 3000, 0.08, 3, 0.01); } ring.gain.setTargetAtTime(0.0001, t + seconds, 0.45); },
  // concept C cues: detent = noise -> 1800 Hz bandpass Q3, 25 ms decay; bolt = sine 110 -> 65 Hz, 140 ms decay
  detent(at = 0) { if (!ready()) return; const t = now(at), b = bus(0.9, 0.12); noiseBurst(env(b, t, 0.55, 0.002, 0.025), t, 0.04, "bandpass", 1800, 3); },
  bolt(at = 0) { if (!ready()) return; const t = now(at), b = bus(0.9, 0.2); tone(env(b, t, 0.8, 0.002, 0.14), t, 0.16, "sine", 110, 65); tick(b, t, 650, 0.3, 1.5, 0.05); },
  doorRelease(at = 0) { if (!ready()) return; [0, 0.05, 0.1].forEach((d) => SFX.detent(at + d)); SFX.bolt(at + 0.14); const t = now(at + 0.2), b = bus(0.5, 0.35); noiseBurst(hold(b, t, 0.1, 0.06, 0.28, 0.14), t, 0.5, "lowpass", 260, 0.7); thud(b, t + 0.48, 95, 55, 0.2, 0.45); },
};
