// Key 2: the key card (a 48-byte SLH-DSA seed), its file/code formats, printing, and the signing worker.
import { bytesToHex, getAddress, hexToBytes, isAddress } from "viem";
import type { Address, Hex } from "viem";
import type { SignerReply, SignerRequest } from "./signer.worker";

/** Decoration only: last 4 hex characters of the address, as decimal, mod 10,000. */
export const boxNoOf = (a: string) => String(parseInt(a.slice(-4), 16) % 10000).padStart(4, "0");
/** The card's short fingerprint, from its public key: A1B2-C3D4. */
export const printOf = (pub: Hex) => `${pub.slice(2, 6)}-${pub.slice(6, 10)}`.toUpperCase();

export type Card = { seed: Uint8Array; owner?: Address; box?: string };
export type IssuedCard = { seed: Uint8Array; pub: Hex; owner: Address; guard: Address; box: string; print: string; issued: string };

const SEED_HEX = 96;
/** 96 hex characters in 12 groups of 8. */
export const cardCode = (seed: Uint8Array) => bytesToHex(seed).slice(2).toUpperCase().match(/.{8}/g)!;
export const cardFileName = (box: string) => `pq-guard-key-card-box-${box}.json`;

export function cardJson(c: IssuedCard) {
  return JSON.stringify({
    note: `Arc Guard key card for Box No. ${c.box}. Keep apart from your wallet. Never share.`,
    kind: "arc-guard-key-card", version: 1, scheme: "SLH-DSA-SHA2-128s",
    box: c.box, holder: c.owner, contract: c.guard, chainId: 5042, issued: c.issued, print: c.print,
    publicKey: c.pub, seed: bytesToHex(c.seed),
  }, null, 2);
}

export function cardText(c: IssuedCard, appUrl: string) {
  const code = cardCode(c.seed);
  return [
    "ARC GUARD · SAFE DEPOSIT · KEY CARD", "",
    `BOX No.      ${c.box}`, `HOLDER       ${c.owner}`, `ISSUED       ${c.issued}`, `CARD PRINT   ${c.print}`, "",
    "KEY 2 OF 2 · KEEP APART FROM YOUR WALLET", "", "CARD CODE",
    ...[0, 4, 8].map((i) => code.slice(i, i + 4).join(" ")), "",
    "This card and your wallet together can take everything out of your box. Keep them in different places.",
    `Lost it? Your money isn't lost: use the 7-day emergency exit at ${appUrl}.`,
    "Never share this card. No one will ever ask for it.", "",
    `Signature: SLH-DSA-SHA2-128s (NIST FIPS 205) · Arc · contract ${c.guard}`,
  ].join("\n");
}

export type ParsedCard = { card: Card } | { err: "notCard" | "damaged" } | { err: "typo"; group: number };

/** Accepts the downloaded JSON file, pasted JSON, or the typed card code with any separators. */
export function parseCard(text: string): ParsedCard {
  const t = text.trim();
  if (t.startsWith("{")) {
    let o: unknown;
    try { o = JSON.parse(t); } catch { return { err: "damaged" }; }
    if (!o || typeof o !== "object" || !("seed" in o)) return { err: "notCard" };
    const seed = typeof o.seed === "string" && /^0x[0-9a-fA-F]{96}$/.test(o.seed) ? hexToBytes(o.seed as Hex) : null;
    if (!seed) return { err: "damaged" };
    const holder = "holder" in o && typeof o.holder === "string" && isAddress(o.holder, { strict: false }) ? getAddress(o.holder) : undefined;
    const box = "box" in o && typeof o.box === "string" ? o.box : undefined;
    return { card: { seed, owner: holder, box } };
  }
  const code = t.replace(/^0x/i, "").replace(/[\s\-·]/g, "");
  if (!code || code.length < 16 || /[^0-9a-zA-Z]/.test(code)) return { err: "notCard" };
  if (/^[0-9a-fA-F]+$/.test(code) && code.length === SEED_HEX) return { card: { seed: hexToBytes(`0x${code}`) } };
  const bad = code.search(/[^0-9a-fA-F]/);
  const at = bad === -1 ? Math.min(code.length, SEED_HEX) : bad;
  return { err: "typo", group: Math.min(12, Math.floor(at / 8) + 1) };
}

/** The card face in its own window, with the full code, for the print dialog. */
export function printCard(c: IssuedCard, appUrl: string) {
  const w = window.open("", "_blank", "width=720,height=900");
  if (!w) return false;
  const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);
  w.document.write(`<!doctype html><title>Key card · Box No. ${c.box}</title>
<style>body{margin:32px;font:14px/1.5 ui-monospace,Menlo,monospace}pre{border:2px solid;border-radius:12px;padding:20px;white-space:pre-wrap;max-width:640px}
.cut{margin-top:28px;border-top:1px dashed;padding-top:6px;font-size:12px;max-width:680px}</style>
<pre>${esc(cardText(c, appUrl))}</pre><p class="cut">Cut along this line. Keep the card. Recycle the rest.</p>`);
  w.document.close();
  w.focus();
  w.print();
  return true;
}

/* ---------- the signing worker: one per job, so Cancel can stop it ---------- */
let job: { w: Worker; reject: (e: Error) => void } | null = null;

export function signer(req: SignerRequest): Promise<SignerReply> {
  cancelSigner();
  const { promise, resolve, reject } = Promise.withResolvers<SignerReply>();
  const w = new Worker(new URL("./signer.worker.ts", import.meta.url), { type: "module" });
  job = { w, reject };
  const done = () => { w.terminate(); if (job?.w === w) job = null; };
  w.onmessage = (e: MessageEvent<SignerReply>) => { done(); if (e.data.error) reject(new Error(e.data.error)); else resolve(e.data); };
  w.onerror = () => { done(); reject(new Error("crashed")); };
  w.postMessage(req);
  return promise;
}

export function cancelSigner() {
  if (!job) return;
  job.w.terminate();
  job.reject(new Error("cancelled"));
  job = null;
}
