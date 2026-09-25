// State, polling and every action. ui.tsx renders S; actions mutate S and call render() (the prototype's model, kept).
import { formatUnits, getAddress, hexToBytes, isAddress, parseUnits, toHex } from "viem";
import type { Abi, Address, ContractFunctionArgs, ContractFunctionName, Hex, RpcLog, TransactionReceipt } from "viem";
import {
  GUARD, GUARD_RAW, TOUR_OWNER, USDC, accounts, actionHash, allowance, chainIdOf, checkGuard, decodeLog, digestOf, ensureArc,
  eth, guardAbi, isBlocked, pqVerify, pub, readApy, readLogs, readSnap, sendTx, sleep, toShares, usdcAbi, why,
} from "./chain";
import type { BoxRead, TxPhase } from "./chain";
import { boxNoOf, cancelSigner, cardFileName, cardJson, cardText, parseCard, printCard, printOf, signer } from "./card";
import type { Card, IssuedCard } from "./card";
import { SFX } from "./sound";

/* ===== utils ===== */
export const short = (a: string) => a.slice(0, 6) + "…" + a.slice(-4);
const usd = (v: bigint) => Number(v) / 1e6;
export const f2 = (v: bigint | number) =>
  (typeof v === "bigint" ? usd(v) : v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const f6 = (v: bigint) => usd(v).toFixed(6);
export const sig2 = (x: number) => String(Number(x.toPrecision(2)));
const p2 = (n: number) => String(n).padStart(2, "0");
const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const dshort = (d: Date) => `${p2(d.getDate())} ${MON[d.getMonth()]}`;
export function fmtWhen(ms: number) {
  const d = new Date(ms);
  const parts = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZoneName: "short" }).formatToParts(d);
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${g("weekday")} ${g("day")} ${g("month")} ${g("year")}, ${g("hour")}:${g("minute")} ${g("timeZoneName")} (${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())} UTC)`;
}
export const RM = matchMedia("(prefers-reduced-motion: reduce)");
const ms = (v: number) => (RM.matches ? 1 : v); // 1 ms, not 0, so end events still fire
export const isPhone = () => matchMedia("(max-width: 639px), (pointer: coarse)").matches;
export const YEAR = 365 * 86400;
export const feeUsdc = (wei: bigint) => Number(formatUnits(wei, 18)).toFixed(4); // gas is paid in native USDC (18 decimals)

export function parseAmt(s: string): { e: string } | { v: bigint } {
  const t = s.trim().replace(/,/g, "");
  if (!t) return { e: ERR.amountEmpty };
  if (!/^\d*\.?\d*$/.test(t) || t === ".") return { e: ERR.amountZero };
  if ((t.split(".")[1] ?? "").length > 6) return { e: ERR.amountDecimals };
  const v = parseUnits(t, 6);
  return v > 0n ? { v } : { e: ERR.amountZero };
}
export const amtEcho = (s: string) => { const a = parseAmt(s); return "v" in a ? f2(a.v) : "0.00"; };

/* ===== error lines: copy.md §13 cut to one short line each (what happened, where the money is) ===== */
export const ERR = {
  noWallet: "No wallet found. Try the real box.",
  rejected: "Cancelled in wallet. Nothing sent.",
  wrongNetwork: "Wrong network. Switch to Arc.",
  addNetworkFailed: "Add Arc by hand: chain 5042, rpc.mainnet.arc.io.",
  disconnected: "Wallet disconnected. Money hasn't moved.",
  rpc: "Can't reach Arc. Money hasn't moved.",
  txDropped: "Arc didn't get it. Nothing sent.",
  txTimeout: "No answer yet. Check your wallet first.",
  failedOnChain: "Refused by Arc. Fee spent, money didn't move.",
  unknown: "Didn't go through. Money hasn't moved.",
  amountEmpty: "Enter an amount.",
  amountZero: "Enter more than zero.",
  amountDecimals: "Six decimals at most.",
  overWallet: (x: string) => `Wallet holds ${x} USDC.`,
  overLocker: (x: string) => `Locker holds ${x} USDC.`,
  overSavings: (x: string) => `Savings hold ${x} USDC.`,
  feeLow: "Not enough USDC left for the fee.",
  approveFailed: "Permission failed. Nothing deposited.",
  noUsdc: "No USDC on Arc in this wallet.",
  alreadyOpen: "This wallet already has a box.",
  boxNone: "No box for this wallet.",
  boxChanged: "Box changed. Signing again…",
  notHolder: "Connect the holder's wallet.",
  notCard: (no: string) => `Not a key card. Need Box ${no}'s file.`,
  damaged: "Card damaged. Try another copy.",
  otherBox: (other: string, no: string) => `Card is for Box ${other}, not ${no}.`,
  replaced: "Old card. Use your newest one.",
  noMatch: "Card doesn't fit this box.",
  typo: (n: number) => `Typo in group ${n}.`,
  rememberedGone: "Saved card is gone. Load your file.",
  notYourCard: "Not the card you just cut.",
  signCrashed: "Signing stopped. Try again.",
  signUnsupported: "This browser can't sign. Try Chrome.",
  expired: "Slip expired. Signing again…",
  rejectedOnChain: "Arc refused the signature. Reload the card.",
  keygenFailed: "Couldn't cut the card. Reload.",
  downloadBlocked: "Blocked. Print or copy instead.",
  toInvalid: "Invalid address.",
  toBox: "That's the box itself. Use a wallet.",
  toBlocked: "Address is on the USDC blocked list.",
  tick: "Tick the box first.",
  savingsFull: "Savings is full. Stays in Locker.",
  savingsUnavailable: "Savings unavailable. Money hasn't moved.",
  exitNotReady: "Exit isn't open yet.",
  exitNone: "No exit to cancel.",
  exitToInvalid: "Invalid address.",
  practiceRpc: "Can't reach Arc. Try again.",
};

/* ===== state ===== */
export type Ink = "green" | "brass" | "ink" | "red";
export type Row = {
  d: string; ts: number; st: string; st2?: string; ink: Ink; p: string; in: bigint; out: bigint; bal: bigint | null; tx: Hex; fresh?: boolean;
  wd?: { to: Address; locker: bigint; savings: bigint };
};
export type BoxView = {
  owner: Address; no: string; r: BoxRead | null; rows: Row[]; keys: Hex[];
  pbDone: boolean; pbBusy: boolean; pbAgain: boolean; pbErr: boolean; basis: bigint | null;
};
export type Sock = {
  door: "closed" | "swing" | "open"; wheel: "" | "hold" | "open"; k1: "none" | "in"; k2: "none" | "in";
  i1: 0 | 1; i2: 0 | 1; turned: 0 | 1; bolt: "thrown" | "retracted"; drawer: "in" | "ajar" | "out"; rattle: 0 | 1;
};
export const freshSock = (): Sock => ({ door: "closed", wheel: "", k1: "none", k2: "none", i1: 0, i2: 0, turned: 0, bolt: "thrown", drawer: "in", rattle: 0 });

type KeyState = {
  k2: "empty" | "typing" | "checking" | "signing" | "loaded" | "signed"; kerr?: string | null; code?: string;
  card?: Card; print?: string; signT0?: number; signSecs?: string; sig?: Hex; digest?: Hex; deadline?: bigint;
  send: "idle" | "wallet" | "confirming" | "turning" | "rejected"; slow?: boolean; sendErr?: string | null; dev?: string; busy?: boolean;
};
export type DepositSheet = {
  type: "deposit"; amount: string; err?: string | null; err2?: string | null; dev?: string; busy?: boolean; skip1?: boolean;
  phase: "amount" | "s1wait" | "s1conf" | "s2" | "s2wait" | "s2conf" | "done" | "chWait" | "chConf" | "chLocker" | "chSavings";
};
export type MoveSheet = { type: "move"; dir: "toSavings" | "toLocker"; amount: string; err?: string | null; dev?: string; busy?: false | "wallet" | "confirming"; done?: boolean; moved?: bigint };
export type WithdrawSheet = KeyState & {
  type: "withdraw"; step: "slip" | "keys" | "done"; from: "locker" | "savings"; amount: string; to: "self" | "other"; other: string; otherOk: boolean;
  err?: string | null; checking?: boolean; toAddr?: Address; value?: bigint; lockerAmount?: bigint; shares?: bigint;
  tx?: Hex; gasUsed?: bigint; fee?: bigint; block?: bigint;
};
export type CancelSheet = KeyState & { type: "exitCancel"; owner: Address; done?: boolean; tx?: Hex };
export type ExitStartSheet = {
  type: "exitStart"; phase: "explain" | "confirm" | "wallet" | "confirming"; to: "self" | "other"; other: string;
  toAddr?: Address; err?: string | null; dev?: string; busy?: boolean; checking?: boolean;
};
export type NoticeSheet = { type: "notice"; title: string; head: string; line: string; stamp: string; ink: Ink; text: string; tx?: Hex };
export type Sheet = DepositSheet | MoveSheet | WithdrawSheet | CancelSheet | ExitStartSheet | NoticeSheet
  | { type: "passbook"; owner: Address } | { type: "plaque" } | { type: "risks" };
export type KeySheet = WithdrawSheet | CancelSheet;

export type Practice = {
  stage: "cutting" | "signing" | "checking" | "genuine" | "refused" | "rpcErr"; cut?: boolean; print?: string; t0?: number;
  signed?: string; tampered?: boolean; ms?: number; pub?: Uint8Array; sig?: Uint8Array; localMs?: number; localOk?: boolean;
};
export type Replay = { stage: "playing" | "done"; cap: number; fee?: string };
export type OpenState = {
  step: 2 | 3; noUsdc?: boolean; cutting?: boolean; card?: IssuedCard; copied?: boolean; printed?: boolean; dlErr?: string;
  checked?: boolean; checkErr?: string; skipped?: boolean; saved?: boolean; remember?: boolean;
  sending?: null | "wallet" | "confirming"; busy?: boolean; err?: string; dev?: string; done?: boolean; tx?: Hex;
};
export type View = "landing" | "tour" | "practice" | "open" | "box" | "view";
type GuardState = "none" | "bad" | "checking" | "ok" | "notGuard" | "rpc";

export const S = {
  view: "landing" as View,
  guard: (GUARD ? "checking" : GUARD_RAW ? "bad" : "none") as GuardState,
  walletFound: !!eth(),
  account: null as Address | null,
  chainId: null as number | null,
  connecting: false,
  landErr: null as string | null,
  walletBal: null as bigint | null,
  showing: null as Address | null,
  boxes: {} as Record<Address, BoxView>,
  apy: null as number | null,
  apyErr: false,
  tourStep: 1,
  practice: null as Practice | null,
  replay: null as Replay | null,
  open: null as OpenState | null,
  sheet: null as Sheet | null,
  sheetKey: 0,
  err: null as null | "rpc" | "network" | "disconnected" | "account",
  errText: "",
  payBusy: false,
  payErr: null as string | null,
  why: false,
  live: "",
  sock: freshSock(),
  /** Wall clock at the last render: components read this instead of calling Date.now(). */
  now: 0,
  /** Coins added to the jar by the last confirmed move, and until when they're still falling. */
  drop: { from: 0, until: 0 },
};

let force: (() => void) | null = null;
export const setRenderer = (f: () => void) => { force = f; };
export const render = () => { S.now = Date.now(); force?.(); };
/** Components edit store objects through here (store objects are mutable; props aren't). */
export function patch<T extends object>(o: T, p: Partial<T>) { Object.assign(o, p); render(); }
/** Log buckets of the Savings balance, not growth theatre: the pile changes only on real moves. */
export const coinCount = (v: number) => (v <= 0 ? 0 : Math.max(1, Math.min(12, Math.round(3 * Math.log10(v) + 2))));

/* ===== box helpers ===== */
const ZERO_KEY: Hex = `0x${"0".repeat(64)}`;
export const boxView = (owner: Address): BoxView =>
  (S.boxes[owner] ??= { owner, no: boxNoOf(owner), r: null, rows: [], keys: [], pbDone: false, pbBusy: false, pbAgain: false, pbErr: false, basis: null });
export const cur = () => (S.showing ? S.boxes[S.showing] ?? null : null);
export const own = () => (S.account ? S.boxes[S.account] ?? null : null);
export const hasBox = (b: BoxView | null): b is BoxView & { r: BoxRead } => !!b?.r && b.r.pqKey !== ZERO_KEY;
export const isMine = (b: BoxView | null) => !!b && b.owner === S.account;
export const total = (b: BoxView) => (b.r ? b.r.locker + b.r.savings : 0n);
/** Chain time in seconds: the last block's timestamp, counted on locally. Never the device clock alone. */
export const chainNow = () => (HB.at ? Number(HB.ts) + (Date.now() - HB.at) / 1000 : Date.now() / 1000);
export function exitOf(b: BoxView | null) {
  if (!b?.r || !b.r.exitReadyAt) return null;
  const readyAt = Number(b.r.exitReadyAt);
  return { to: b.r.exitTo, readyAt, ready: chainNow() >= readyAt, own: b.r.exitTo === b.owner };
}
/** The box whose pending exit takes over the screen: the one on screen, else the connected holder's. */
export const bannerBox = () => { const c = cur(); if (exitOf(c)) return c; const o = own(); return exitOf(o) ? o : null; };
export function exitLeft(readyAt: number) {
  const s = Math.max(0, Math.floor(readyAt - chainNow()));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
export const countdown = (readyAt: number) => { const L = exitLeft(readyAt); return `${L.d} days ${p2(L.h)}:${p2(L.m)}:${p2(L.s)}`; };
export const tourWithdrawal = () => [...(cur()?.rows ?? [])].reverse().find((r) => r.wd) ?? null;
const cardKey = (owner: Address) => `ag:card:${GUARD}:${owner}`;
export const savedCard = (owner: Address) => { try { return localStorage.getItem(cardKey(owner)); } catch { return null; } };
export const appUrl = () => location.origin;

/* ===== heartbeat: one multicall every 10 s ===== */
export const HB = { at: 0, tried: 0, block: 0n, ts: 0n, basefee: 20_000_000_000n, fails: 0, n: 0 };
let pollP: Promise<void> | null = null;
export const poll = () => (pollP ??= doPoll().finally(() => { pollP = null; }));
const pollFresh = async () => { await pollP; await poll(); };

async function doPoll() {
  const owner = S.showing ?? S.account, wallet = S.account;
  if (!GUARD || S.guard !== "ok" || !owner) return;
  HB.tried = Date.now();
  try {
    const snap = await readSnap(GUARD, owner, wallet);
    Object.assign(HB, { at: Date.now(), block: snap.block, ts: snap.ts, basefee: snap.basefee, fails: 0, n: HB.n + 1 });
    if (wallet && wallet === S.account) S.walletBal = snap.walletBal;
    const bv = boxView(owner), prev = bv.r, r = snap.box;
    bv.r = r;
    const was = prev ? coinCount(Number(prev.savings) / 1e6) : 0, grown = coinCount(Number(r.savings) / 1e6);
    if (prev && grown > was && !RM.matches) {
      S.drop = { from: was, until: Date.now() + 1600 };
      for (let i = was; i < grown; i++) SFX.coin(((i - was) * 140 + 380) / 1000);
    }
    if (S.err === "rpc") S.err = null;
    const changed = !prev || prev.nonce !== r.nonce || prev.locker !== r.locker || prev.shares !== r.shares || prev.exitReadyAt !== r.exitReadyAt || prev.pqKey !== r.pqKey;
    if (changed && hasBox(bv)) void refreshLogs(bv);
    if (S.apy === null && !S.apyErr) void loadApy();
  } catch {
    if (++HB.fails >= 3 && !S.err) S.err = "rpc";
  }
  render();
}

let apyBusy = false;
async function loadApy() {
  if (apyBusy) return;
  apyBusy = true;
  try { S.apy = await readApy(HB.block); } catch { S.apyErr = true; }
  apyBusy = false;
  render();
}

/* ===== passbook: events → stamped lines ===== */
async function refreshLogs(bv: BoxView) {
  if (!GUARD) return;
  if (bv.pbBusy) { bv.pbAgain = true; return; }
  bv.pbBusy = true;
  const seen = bv.rows.length ? new Set(bv.rows.map((r) => r.tx + r.st)) : null;
  try {
    await readLogs(GUARD, bv.owner, HB.block, (logs, done) => { applyLogs(bv, logs, done, seen); render(); });
    bv.pbErr = false;
  } catch {
    bv.pbErr = true;
  }
  bv.pbBusy = false;
  render();
  if (bv.pbAgain) { bv.pbAgain = false; void refreshLogs(bv); }
}

/** Balance = money put in minus money paid out, plus interest once it's realised by a redemption. */
function applyLogs(bv: BoxView, logs: RpcLog[], done: boolean, seen: Set<string> | null) {
  const rows: Row[] = [], keys: Hex[] = [], pq = new Set<string>();
  let bal = 0n, basis = 0n, sh = 0n;
  const redeem = (shares: bigint, got: bigint) => { const part = sh ? (basis * shares) / sh : 0n; basis -= part; sh -= shares; bal += got - part; };
  for (const l of logs) {
    let ev;
    try { ev = decodeLog(l); } catch { continue; }
    const ts = Number(l.blockTimestamp ?? 0), tx = l.transactionHash as Hex;
    const base = { d: dshort(new Date(ts * 1000)), ts, tx, in: 0n, out: 0n, bal: 0n as bigint | null };
    switch (ev.eventName) {
      case "Opened": keys.push(ev.args.pqKey); rows.push({ ...base, st: "OPENED", ink: "green", p: `Card ${printOf(ev.args.pqKey)}` }); break;
      case "Deposited": bal += ev.args.amount; rows.push({ ...base, st: "DEPOSITED", ink: "green", p: `From ${short(bv.owner)}`, in: ev.args.amount }); break;
      case "MovedToSavings": basis += ev.args.amount; sh += ev.args.shares; rows.push({ ...base, st: "SAVED", ink: "brass", p: `Locker → Savings · ${f2(ev.args.amount)}` }); break;
      case "MovedToLocker": redeem(ev.args.shares, ev.args.amount); rows.push({ ...base, st: "TO LOCKER", ink: "brass", p: `Savings → Locker · ${f2(ev.args.amount)}` }); break;
      case "PQVerified": pq.add(tx); continue;
      case "Withdrawn": {
        const a = ev.args;
        if (a.shares) redeem(a.shares, a.savingsAmount);
        const out = a.lockerAmount + a.savingsAmount;
        bal -= out;
        rows.push({ ...base, st: "WITHDRAWN", st2: pq.has(tx) ? "KEY 2 OK" : undefined, ink: "ink", p: `To ${short(a.to)}`, out, wd: { to: a.to, locker: a.lockerAmount, savings: a.savingsAmount } });
        break;
      }
      case "KeyRotated": keys.push(ev.args.newKey); rows.push({ ...base, st: "NEW CARD", ink: "ink", p: `Card ${printOf(ev.args.newKey)}` }); break;
      case "ExitRequested": rows.push({ ...base, st: "EXIT STARTED", ink: "red", p: `To ${short(ev.args.to)} · opens ${dshort(new Date(Number(ev.args.readyAt) * 1000))}` }); break;
      case "ExitCancelled": rows.push({ ...base, st: "CANCELLED", ink: "green", p: "By key card" }); break;
      case "ExitExecuted": rows.push({ ...base, st: "EXIT PAID", ink: "red", p: `To ${short(ev.args.to)}`, out: ev.args.amount }); bal = basis = sh = 0n; break;
      default: continue;
    }
    rows[rows.length - 1].bal = bal;
  }
  for (const r of rows) {
    if (!done) r.bal = null; // the opening balance is unknown until the Opened line is read
    r.fresh = !!seen && !seen.has(r.tx + r.st);
  }
  Object.assign(bv, { rows, keys, pbDone: done, basis: done ? basis : null });
}

/* ===== flows: one token; a new flow or a close cancels the old one ===== */
let TOKEN = 0;
const STOP = Symbol("stop");
type Flow = { alive: () => boolean; wait: (d: number) => Promise<void>; step: <T>(p: Promise<T>) => Promise<T> };
function flow(fn: (c: Flow) => Promise<void>) {
  const t = ++TOKEN;
  const live = <T,>(v: T) => { if (t !== TOKEN) throw STOP; return v; };
  const c: Flow = {
    alive: () => t === TOKEN,
    wait: (d) => sleep(d).then(live),
    step: (p) => p.then(live, (e) => { if (t !== TOKEN) throw STOP; throw e; }),
  };
  void fn(c).catch((e) => { if (e !== STOP) console.error(e); }).finally(render);
}
const rethrow = (e: unknown) => { if (e === STOP) throw e; };
function cancelFlows() { TOKEN++; cancelSigner(); }

export function announce(t: string) { S.live = ""; render(); setTimeout(() => { S.live = t; render(); }, 30); }
function rattle() { S.sock.k2 = "in"; S.sock.rattle = 1; render(); setTimeout(() => { S.sock.rattle = 0; S.sock.k2 = "none"; render(); }, 600); }
function jump() {
  const h = document.documentElement;
  h.classList.add("jump");
  requestAnimationFrame(() => requestAnimationFrame(() => h.classList.remove("jump")));
}
/** In-app navigation between the two pages' states (/ and /box), keeping a ?guard= override. */
export function nav(path: string, replace = false) {
  const url = new URL(path, location.origin), g = new URLSearchParams(location.search).get("guard");
  if (g) url.searchParams.set("guard", g);
  const next = url.pathname + url.search;
  if (location.pathname + location.search !== next) history[replace ? "replaceState" : "pushState"](null, "", next);
}

/* ===== sheets (the counter window) ===== */
export function sheetOf<T extends Sheet["type"]>(t: T) {
  const s = S.sheet;
  return s && s.type === t ? (s as Extract<Sheet, { type: T }>) : null;
}
const keySheet = (): KeySheet | null => sheetOf("withdraw") ?? sheetOf("exitCancel");
const boxOf = (K: KeySheet) => (K.type === "exitCancel" ? S.boxes[K.owner] : cur());
function openSheet(s: Sheet) {
  cancelFlows();
  S.sheet = s; S.sheetKey++;
  if (s.type === "deposit") S.sock.drawer = "ajar"; // the drawer comes out for the slip
  if (S.err === "account") S.err = null;
  render();
}
function resetSock() { S.sock = { ...S.sock, k1: S.account ? "in" : "none", k2: "none", i1: 0, i2: 0, turned: 0, bolt: "thrown", drawer: "in", rattle: 0 }; }
export function closeSheet() {
  const s = S.sheet;
  if (!s || ("busy" in s && s.busy)) return; // never cancel a transaction in flight
  cancelFlows(); S.sheet = null; resetSock(); render();
}

/* ===== chain actions ===== */
function txErr(e: unknown, revert: Record<string, string> = {}) {
  const w = why(e);
  const REVERT: Record<string, string> = {
    NoBox: ERR.boxNone, AlreadyOpen: ERR.alreadyOpen, Blocked: ERR.toBlocked, Expired: ERR.expired, BadSignature: ERR.rejectedOnChain,
    NoExit: ERR.exitNone, ExitNotReady: ERR.exitNotReady, BadAmount: ERR.boxChanged,
  };
  const msg = w.kind === "rejected" ? ERR.rejected : w.kind === "rpc" ? ERR.rpc : w.kind === "dropped" ? ERR.txDropped
    : w.kind === "timeout" ? ERR.txTimeout : w.kind === "reverted" ? ERR.failedOnChain
    : w.kind === "revert" ? revert[w.name ?? ""] ?? REVERT[w.name ?? ""] ?? ERR.unknown : ERR.unknown;
  return { msg, dev: msg === ERR.unknown || msg === ERR.failedOnChain ? w.detail : undefined };
}

/** Key 1 in the lock: a connected wallet (optionally the holder's) on Arc. */
async function readyWallet(c: Flow, holder?: Address): Promise<{ ok: Address } | { err: string }> {
  if (!eth()) return { err: ERR.noWallet };
  if (!S.account) {
    try { S.account = (await c.step(accounts(true)))[0] ?? null; } catch (e) { rethrow(e); return { err: txErr(e).msg }; }
    if (!S.account) return { err: ERR.rejected };
    S.sock.k1 = "in";
  }
  if (holder && S.account !== holder) return { err: ERR.notHolder };
  try { await c.step(ensureArc()); } catch (e) { rethrow(e); return { err: why(e).kind === "rejected" ? ERR.wrongNetwork : ERR.addNetworkFailed }; }
  S.chainId = 5042;
  if (S.err === "network") S.err = null;
  return { ok: S.account };
}

/** sendTx inside a flow: phases re-render, and a cancelled flow stops listening. */
function tx<const abi extends Abi, fn extends ContractFunctionName<abi, "nonpayable">>(
  c: Flow, account: Address,
  call: { address: Address; abi: abi; functionName: fn; args: ContractFunctionArgs<abi, "nonpayable", fn> },
  on: (p: TxPhase) => void,
): Promise<TransactionReceipt> {
  return c.step(sendTx(account, call, HB.basefee, (p) => { if (c.alive()) { on(p); render(); } }));
}

/* ===== choreography ===== */
/** The door always finishes its swing, even if the visitor clicks on before it's done (a new flow must not freeze it). */
async function openDoor(c: Flow, setView: () => void) {
  announce("The door is opening.");
  SFX.doorRelease();
  S.sock.wheel = "open"; setView(); render(); // the interior is ready behind the leaf
  const inside = () => S.view !== "landing" && S.view !== "practice";
  setTimeout(() => { if (inside()) { S.sock.door = "swing"; render(); } }, ms(200)); // restrained 18° swing, 480 ms
  setTimeout(() => { if (inside()) { S.sock.door = "open"; render(); } }, ms(680));
  await c.wait(ms(680));
}
async function turnBothKeys(c: Flow) { // only ever called after a receipt
  S.sock.turned = 1; SFX.keyTurn(0); render();
  await c.wait(ms(320));
  S.sock.bolt = "retracted"; SFX.bolt(0); render();
  await c.wait(ms(160 + 120));
  S.sock.drawer = "out"; SFX.drawerSlide(0); render();
  await c.wait(ms(900));
}

const SLIP_OK = new TextEncoder().encode("Pay 10.00 USDC to 0x12ab…90cd");
const SLIP_BAD = new TextEncoder().encode("Pay 90.00 USDC to 0x12ab…90cd"); // one byte changed

async function practiceCheck(c: Flow, P: Practice, msg: Uint8Array) {
  const t = performance.now();
  try {
    const ok = await c.step(pqVerify(P.pub!, msg, P.sig!));
    P.ms = Math.round(performance.now() - t);
    P.stage = ok ? "genuine" : "refused";
    if (ok) SFX.stamp(); else { S.sock.i2 = 0; SFX.errorBuzz(); rattle(); }
  } catch (e) {
    rethrow(e);
    P.stage = "rpcErr";
    const t2 = performance.now();
    const v = await c.step(signer({ op: "verify", pub: P.pub!, msg, sig: P.sig! })).catch(() => null);
    if (v) { P.localOk = !!v.ok; P.localMs = Math.round(performance.now() - t2); }
  }
}

/** Load a card for the box on the sheet: parse, check it fits the box's lock, then sign. */
function loadCardText(text: string) {
  const K = keySheet(), b = K && boxOf(K);
  if (!K || !b?.r) return;
  const fail = (msg: string, shake = false) => { K.k2 = K.k2 === "typing" ? "typing" : "empty"; K.kerr = msg; SFX.errorBuzz(); if (shake) rattle(); render(); };
  const p = parseCard(text);
  if ("err" in p) return fail(p.err === "typo" ? ERR.typo(p.group) : p.err === "damaged" ? ERR.damaged : ERR.notCard(b.no));
  if (p.card.owner && p.card.owner !== b.owner) return fail(ERR.otherBox(p.card.box ?? boxNoOf(p.card.owner), b.no), true);
  flow(async (c) => {
    K.kerr = null; K.k2 = "checking"; render();
    let pk: Hex;
    try { pk = toHex((await c.step(signer({ op: "keygen", seed: p.card.seed }))).pub!); }
    catch (e) { rethrow(e); return fail(typeof Worker === "undefined" ? ERR.signUnsupported : ERR.signCrashed); }
    if (pk !== b.r!.pqKey) { K.k2 = "empty"; return fail(b.keys.includes(pk) ? ERR.replaced : ERR.noMatch, true); }
    K.card = p.card; K.print = printOf(pk);
    await signWith(c, K, b);
  });
}

const digestFor = (K: KeySheet, b: BoxView, deadline: bigint) =>
  digestOf(GUARD!, b.owner, K.type === "withdraw" ? actionHash.withdraw(K.toAddr!, K.lockerAmount!, K.shares!) : actionHash.cancelExit(), deadline);

/** Key 2 turns: deadline from chain time + 15 min, digest from the contract, signature from the worker. */
async function signWith(c: Flow, K: KeySheet, b: BoxView) {
  if (!K.card || !GUARD) return;
  K.k2 = "signing"; K.send = "idle"; K.sig = undefined; K.signT0 = performance.now();
  S.sock.k2 = "in"; S.sock.i2 = 0; SFX.keyInsert(); render();
  try {
    const deadline = (await c.step(pub.getBlock())).timestamp + 900n;
    const digest = await c.step(digestFor(K, b, deadline));
    const t1 = performance.now();
    const s = await c.step(signer({ op: "sign", seed: K.card.seed, msg: hexToBytes(digest) }));
    Object.assign(K, { sig: toHex(s.sig!), digest, deadline, k2: "signed", signSecs: ((performance.now() - t1) / 1000).toFixed(2) });
    S.sock.i2 = 1; SFX.detent(); // Key 2 earns its detent
  } catch (e) {
    rethrow(e);
    K.k2 = "loaded";
    K.kerr = why(e).kind === "rpc" ? ERR.rpc : ERR.signCrashed;
  }
}

/** Shared by withdraw and cancel-exit: simulate-driven recovery from a stale or rejected signature. */
async function recoverSig(c: Flow, e: unknown, K: KeySheet, b: BoxView) {
  const x = why(e);
  if (x.kind !== "revert" || (x.name !== "Expired" && x.name !== "BadSignature")) return false;
  const fresh = x.name === "Expired" ? null : await c.step(digestFor(K, b, K.deadline!)).catch((err) => { rethrow(err); return K.digest; });
  K.send = "idle";
  if (x.name === "Expired" || fresh !== K.digest) {
    K.kerr = x.name === "Expired" ? ERR.expired : ERR.boxChanged; // signs again on its own
    await signWith(c, K, b);
    return true;
  }
  Object.assign(K, { k2: "empty", card: undefined, sig: undefined, kerr: ERR.rejectedOnChain });
  S.sock.k2 = "none"; S.sock.i2 = 0; SFX.errorBuzz();
  return true;
}

/* ===== actions ===== */
function requireOwn() {
  const b = cur();
  if (hasBox(b) && isMine(b)) return true;
  if (!S.account) ACT.connect();
  return false;
}
function goTour(step: number) {
  S.view = "tour"; S.tourStep = step; S.replay = null; S.practice = null; S.showing = TOUR_OWNER; S.sheet = null;
  nav("/box");
  void pollFresh();
}

export const ACT = {
  sound() { SFX.unlock(); SFX.setSound(!SFX.on); render(); },
  plaque() { openSheet({ type: "plaque" }); },
  risks() { openSheet({ type: "risks" }); },
  passbook(owner: Address) { openSheet({ type: "passbook", owner }); },
  why() { S.why = !S.why; render(); },
  home() {
    cancelFlows();
    Object.assign(S, { view: "landing", showing: null, sheet: null, practice: null, replay: null, sock: { ...freshSock(), k1: S.account ? "in" : "none" } });
    nav("/"); render();
  },
  leaf() { if (S.view === "landing") ACT.connect(); },
  clearErr() { S.err = null; HB.fails = 0; void pollFresh(); render(); },
  async switchArc() {
    try { await ensureArc(); S.chainId = 5042; S.err = null; S.errText = ""; }
    catch (e) { S.errText = why(e).kind === "rejected" ? ERR.wrongNetwork : ERR.addNetworkFailed; }
    render();
  },
  /** User-chosen disconnect: forget the wallet here and in MetaMask, so a reload doesn't reconnect. Money doesn't move. */
  async disconnect() {
    cancelFlows();
    localStorage.setItem("ag:disconnected", "1");
    try { await eth()?.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] }); } catch { /* older wallets: the local flag still holds */ }
    Object.assign(S, { account: null, walletBal: null, sheet: null, err: null, errText: "", open: null, connecting: false });
    ACT.home();
  },
  async reconnect() {
    try { onAccounts(await accounts(true)); } catch { /* the banner stays */ }
  },

  connect() {
    if (!eth()) { S.landErr = ERR.noWallet; SFX.errorBuzz(); if (S.view !== "landing") ACT.home(); else render(); return; }
    if (S.guard !== "ok") return;
    if (S.view !== "landing") { ACT.home(); jump(); requestAnimationFrame(() => requestAnimationFrame(() => ACT.connect())); return; }
    flow(async (c) => {
      S.connecting = true; S.landErr = null; S.sock.wheel = "hold"; render(); // the wheel turns 30° and holds: waiting, not opening
      const fail = (msg: string) => { S.connecting = false; S.sock.wheel = ""; S.landErr = msg; SFX.errorBuzz(); };
      let acc: Address[];
      localStorage.removeItem("ag:disconnected");
      try { acc = await c.step(accounts(true)); } catch (e) { rethrow(e); return fail(txErr(e).msg); }
      if (!acc[0]) return fail(ERR.rejected);
      S.account = acc[0];
      try { await c.step(ensureArc()); S.chainId = 5042; }
      catch (e) { rethrow(e); S.err = "network"; S.errText = why(e).kind === "rejected" ? ERR.wrongNetwork : ERR.addNetworkFailed; }
      S.sock.k1 = "in"; SFX.keyInsert(); render();
      S.showing = S.account;
      await c.step(pollFresh());
      const b = own();
      if (!b?.r) { S.showing = null; return fail(ERR.rpc); }
      S.connecting = false;
      await c.wait(ms(380));
      await openDoor(c, () => {
        if (hasBox(b)) S.view = "box";
        else { S.view = "open"; S.open = { step: 2, noUsdc: (S.walletBal ?? 0n) < 10_000n }; }
      });
    });
  },
  tour() {
    if (S.guard !== "ok" || !TOUR_OWNER) return;
    if (S.view !== "landing") { cancelFlows(); goTour(1); S.sock = { ...freshSock(), door: "open" }; jump(); render(); return; }
    flow((c) => openDoor(c, () => goTour(1)));
  },
  tourStep(n: number) {
    cancelFlows();
    Object.assign(S, { tourStep: n, replay: null, practice: null, sock: { ...freshSock(), door: "open" } });
    render(); window.scrollTo({ top: 0 });
  },
  practice() {
    cancelFlows();
    Object.assign(S, { view: "practice", practice: null, showing: null, sheet: null, sock: { ...freshSock(), k1: S.account ? "in" : "none" } });
    nav("/?view=practice"); render();
  },
  practiceRun() {
    flow(async (c) => {
      const P: Practice = (S.practice = { stage: "cutting" });
      S.sock.k2 = "none"; S.sock.i2 = 0; render();
      const seed = crypto.getRandomValues(new Uint8Array(48)), t0 = performance.now();
      try {
        P.pub = (await c.step(signer({ op: "keygen", seed }))).pub!;
        await c.wait(Math.max(0, ms(600) - (performance.now() - t0))); // keygen ~126 ms, shown over 600 ms
        Object.assign(P, { cut: true, print: printOf(toHex(P.pub)), stage: "signing", t0: performance.now() });
        S.sock.k2 = "in"; SFX.keyInsert(); render();
        P.sig = (await c.step(signer({ op: "sign", seed, msg: SLIP_OK }))).sig!;
      } catch (e) { rethrow(e); S.practice = null; S.sock.k2 = "none"; announce(ERR.signCrashed); return; }
      P.signed = ((performance.now() - P.t0!) / 1000).toFixed(2); P.stage = "checking";
      S.sock.i2 = 1; SFX.detent(); render();
      await practiceCheck(c, P, SLIP_OK);
    });
  },
  tamper() {
    const P = S.practice;
    if (!P?.sig) return;
    flow(async (c) => { P.tampered = true; P.stage = "checking"; render(); await practiceCheck(c, P, SLIP_BAD); });
  },
  replay() {
    const row = tourWithdrawal();
    if (!row) return;
    flow(async (c) => {
      const R: Replay = (S.replay = { stage: "playing", cap: 1 });
      S.sock = { ...freshSock(), door: "open" }; render();
      pub.getTransactionReceipt({ hash: row.tx }).then((r) => { R.fee = feeUsdc(r.gasUsed * r.effectiveGasPrice); render(); }, () => {});
      await c.wait(1100);
      R.cap = 2; S.sock.k2 = "in"; SFX.keyInsert(); render(); await c.wait(500); S.sock.i2 = 1; SFX.detent(); render();
      await c.wait(1000);
      R.cap = 3; S.sock.k1 = "in"; SFX.keyInsert(); render(); await c.wait(500); S.sock.i1 = 1; SFX.detent(); render();
      await c.wait(1000);
      R.cap = 4; render();
      await turnBothKeys(c);
      R.stage = "done"; SFX.stamp();
    });
  },

  /* ----- open a box ----- */
  checkAgain() { flow(async (c) => { await c.step(pollFresh()); if (S.open) S.open.noUsdc = (S.walletBal ?? 0n) < 10_000n; }); },
  cutCard() {
    const O = S.open, a = S.account;
    if (!O || !a || !GUARD) return;
    flow(async (c) => {
      O.cutting = true; O.err = undefined; render();
      const seed = crypto.getRandomValues(new Uint8Array(48)), t0 = performance.now();
      let pk: Hex;
      try { pk = toHex((await c.step(signer({ op: "keygen", seed }))).pub!); }
      catch (e) { rethrow(e); O.cutting = false; O.err = typeof Worker === "undefined" ? ERR.signUnsupported : ERR.keygenFailed; return; }
      await c.wait(Math.max(0, ms(600) - (performance.now() - t0)));
      O.card = { seed, pub: pk, owner: a, guard: GUARD!, box: boxNoOf(a), print: printOf(pk), issued: new Date().toISOString().slice(0, 10) };
      O.cutting = false; O.step = 3;
    });
  },
  dl() {
    const c = S.open?.card;
    if (!c) return;
    try {
      const url = URL.createObjectURL(new Blob([cardJson(c)], { type: "application/json" })), a = document.createElement("a");
      a.href = url; a.download = cardFileName(c.box); a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { S.open!.dlErr = ERR.downloadBlocked; }
    render();
  },
  print() { const O = S.open; if (O?.card) { if (printCard(O.card, appUrl())) O.printed = true; else O.dlErr = ERR.downloadBlocked; render(); } },
  copyCard() {
    const O = S.open;
    if (!O?.card) return;
    navigator.clipboard.writeText(cardText(O.card, appUrl())).then(() => { O.copied = true; render(); }, () => { O.dlErr = ERR.downloadBlocked; render(); });
  },
  async checkCard(file: File) {
    const O = S.open;
    if (!O?.card) return;
    const p = parseCard(await file.text().catch(() => ""));
    const same = "card" in p && p.card.seed.length === O.card.seed.length && p.card.seed.every((x, i) => x === O.card!.seed[i]);
    if (same) { O.checked = true; O.checkErr = undefined; SFX.detent(); } else { O.checkErr = ERR.notYourCard; SFX.errorBuzz(); }
    render();
  },
  skipCheck() { if (S.open) { S.open.skipped = true; render(); } },
  savedTick(v: boolean) { if (S.open) { S.open.saved = v; render(); } },
  rememberTick(v: boolean) { if (S.open) { S.open.remember = v; render(); } },
  openBox() {
    const O = S.open, card = O?.card;
    if (!O || !card || !GUARD) return;
    flow(async (c) => {
      Object.assign(O, { err: undefined, dev: undefined, sending: "wallet", busy: true }); render();
      const w = await readyWallet(c, card.owner);
      if ("err" in w) { Object.assign(O, { sending: null, busy: false, err: w.err }); return; }
      try {
        const r = await tx(c, w.ok, { address: GUARD!, abi: guardAbi, functionName: "open", args: [card.pub] }, (p) => { if (p === "confirming") O.sending = "confirming"; });
        if (O.remember) { try { localStorage.setItem(cardKey(card.owner), cardJson(card)); } catch { /* storage full or off */ } }
        Object.assign(O, { tx: r.transactionHash, done: true, sending: null, busy: false });
        SFX.stamp(); announce(`Box No. ${card.box} is open.`);
        await c.step(pollFresh());
      } catch (e) {
        rethrow(e);
        const m = txErr(e);
        Object.assign(O, { sending: null, busy: false, err: m.msg, dev: m.dev }); SFX.errorBuzz();
      }
    });
  },
  firstDeposit() {
    Object.assign(S, { view: "box", open: null, showing: S.account }); // the card's seed leaves memory with S.open
    nav("/"); render(); ACT.deposit();
  },

  /* ----- deposit, then choose ----- */
  deposit() { if (requireOwn()) openSheet({ type: "deposit", phase: "amount", amount: "" }); },
  depMax() {
    const d = sheetOf("deposit");
    if (!d || S.walletBal === null) return;
    const v = ((S.walletBal - 50_000n) / 10_000n) * 10_000n; // keep 0.05 USDC for fees, whole cents
    d.err = v > 0n ? null : ERR.feeLow; d.amount = v > 0n ? formatUnits(v, 6) : ""; render();
  },
  depApprove() {
    const d = sheetOf("deposit"), b = cur();
    if (!d || !b || !GUARD) return;
    const a = parseAmt(d.amount), bal = S.walletBal ?? 0n;
    d.err = "e" in a ? a.e : a.v > bal ? ERR.overWallet(f2(bal)) : bal - a.v < 10_000n ? ERR.feeLow : null;
    if (d.err || !("v" in a)) { render(); return; }
    const v = a.v;
    flow(async (c) => {
      Object.assign(d, { phase: "s1wait", busy: true, dev: undefined }); render();
      const w = await readyWallet(c, b.owner);
      if ("err" in w) { Object.assign(d, { phase: "amount", busy: false, err: w.err }); return; }
      try {
        if ((await c.step(allowance(w.ok, GUARD!))) >= v) { Object.assign(d, { skip1: true, phase: "s2", busy: false }); return; }
        await tx(c, w.ok, { address: USDC, abi: usdcAbi, functionName: "approve", args: [GUARD!, v] }, (p) => { if (p === "confirming") d.phase = "s1conf"; });
        Object.assign(d, { phase: "s2", busy: false });
      } catch (e) {
        rethrow(e);
        const m = txErr(e);
        Object.assign(d, { phase: "amount", busy: false, err: m.msg === ERR.unknown || m.msg === ERR.failedOnChain ? ERR.approveFailed : m.msg, dev: m.dev });
      }
    });
  },
  depDeposit() {
    const d = sheetOf("deposit"), b = cur(), a = d ? parseAmt(d.amount) : null;
    if (!d || !b || !GUARD || !a || !("v" in a)) return;
    flow(async (c) => {
      Object.assign(d, { err: null, dev: undefined, phase: "s2wait", busy: true }); render();
      const w = await readyWallet(c, b.owner);
      if ("err" in w) { Object.assign(d, { phase: "s2", busy: false, err: w.err }); return; }
      try {
        await tx(c, w.ok, { address: GUARD!, abi: guardAbi, functionName: "deposit", args: [a.v] }, (p) => { if (p === "confirming") d.phase = "s2conf"; });
        await c.step(pollFresh());
        S.sock.drawer = "in"; // only a confirmed deposit moves the drawer back in
        Object.assign(d, { phase: "done", busy: false }); SFX.stamp();
        announce(`Deposited. ${f2(a.v)} USDC is in your Locker.`);
      } catch (e) {
        rethrow(e);
        const m = txErr(e);
        Object.assign(d, { phase: "s2", busy: false, err: m.msg, dev: m.dev });
      }
    });
  },
  keepLocker() { const d = sheetOf("deposit"); if (d) { d.phase = "chLocker"; render(); } },
  toSavings() {
    const d = sheetOf("deposit"), b = cur(), a = d ? parseAmt(d.amount) : null;
    if (!d || !b || !GUARD || !a || !("v" in a)) return;
    flow(async (c) => {
      Object.assign(d, { err2: null, dev: undefined, phase: "chWait", busy: true }); render();
      const w = await readyWallet(c, b.owner);
      if ("err" in w) { Object.assign(d, { phase: "done", busy: false, err2: w.err }); return; }
      try {
        await tx(c, w.ok, { address: GUARD!, abi: guardAbi, functionName: "moveToSavings", args: [a.v] }, (p) => { if (p === "confirming") d.phase = "chConf"; });
        await c.step(pollFresh());
        Object.assign(d, { phase: "chSavings", busy: false });
      } catch (e) {
        rethrow(e);
        const m = txErr(e);
        const msg = why(e).kind === "revert" ? ERR.savingsFull : m.msg === ERR.rejected ? `${ERR.rejected} It stays in your Locker.` : m.msg;
        Object.assign(d, { phase: "done", busy: false, err2: msg, dev: m.dev });
      }
    });
  },

  /* ----- move ----- */
  move() { const b = cur(); if (requireOwn() && b?.r) openSheet({ type: "move", dir: b.r.locker > 0n ? "toSavings" : "toLocker", amount: "" }); },
  moveDir(dir: MoveSheet["dir"]) { const m = sheetOf("move"); if (m && !m.busy && !m.done) { m.dir = dir; m.err = null; render(); } },
  moveMax() { const m = sheetOf("move"), r = cur()?.r; if (m && r) { m.amount = formatUnits(m.dir === "toSavings" ? r.locker : r.savings, 6); m.err = null; render(); } },
  moveGo() {
    const m = sheetOf("move"), b = cur();
    if (!m || !b?.r || !GUARD) return;
    const r = b.r, toS = m.dir === "toSavings", max = toS ? r.locker : r.savings, a = parseAmt(m.amount);
    const v = "v" in a && a.v > max && a.v - max < 5_000n ? max : "v" in a ? a.v : 0n; // "30.00" on screen may be 29.999871
    m.err = "e" in a ? a.e : v > max ? (toS ? ERR.overLocker(f2(max)) : ERR.overSavings(f2(max))) : null;
    if (m.err) { render(); return; }
    flow(async (c) => {
      Object.assign(m, { busy: "wallet", dev: undefined }); render();
      const w = await readyWallet(c, b.owner);
      if ("err" in w) { Object.assign(m, { busy: false, err: w.err }); return; }
      const on = (p: TxPhase) => { if (p === "confirming") m.busy = "confirming"; };
      try {
        if (toS) await tx(c, w.ok, { address: GUARD!, abi: guardAbi, functionName: "moveToSavings", args: [v] }, on);
        else {
          const conv = v >= r.savings ? r.shares : await c.step(toShares(v));
          await tx(c, w.ok, { address: GUARD!, abi: guardAbi, functionName: "moveToLocker", args: [conv < r.shares ? conv : r.shares] }, on);
        }
        await c.step(pollFresh());
        Object.assign(m, { busy: false, done: true, moved: v }); SFX.stamp();
      } catch (e) {
        rethrow(e);
        const x = txErr(e);
        Object.assign(m, { busy: false, err: why(e).kind === "revert" ? (toS ? ERR.savingsFull : ERR.savingsUnavailable) : x.msg, dev: x.dev });
      }
    });
  },

  /* ----- withdraw: slip -> keys -> receipt ----- */
  withdraw() {
    const b = cur();
    if (!requireOwn() || !b?.r) return;
    openSheet({ type: "withdraw", step: "slip", from: b.r.locker > 0n ? "locker" : "savings", amount: "", to: "self", other: "", otherOk: false, k2: "empty", send: "idle" });
  },
  wdMax() { const W = sheetOf("withdraw"), r = cur()?.r; if (W && r) { W.amount = formatUnits(W.from === "locker" ? r.locker : r.savings, 6); W.err = null; render(); } },
  wdNext() {
    const W = sheetOf("withdraw"), b = cur();
    if (!W || !b?.r || !GUARD || W.checking) return;
    const r = b.r, a = parseAmt(W.amount), max = W.from === "locker" ? r.locker : r.savings;
    const v = "v" in a && a.v > max && a.v - max < 5_000n ? max : "v" in a ? a.v : 0n;
    const raw = W.to === "self" ? b.owner : W.other.trim();
    const valid = isAddress(raw, { strict: false }) && !/^0x0{40}$/i.test(raw);
    W.err = "e" in a ? a.e : v > max ? (W.from === "locker" ? ERR.overLocker(f2(max)) : ERR.overSavings(f2(max)))
      : !valid ? ERR.toInvalid : getAddress(raw) === GUARD || getAddress(raw) === USDC ? ERR.toBox
      : W.to === "other" && !W.otherOk ? ERR.tick : (S.walletBal ?? 0n) < 15_000n ? ERR.feeLow : null;
    if (W.err) { render(); return; }
    const to = getAddress(raw);
    flow(async (c) => {
      W.checking = true; render();
      try {
        if (await c.step(isBlocked(to))) { W.err = ERR.toBlocked; return; }
        const conv = W.from === "savings" ? (v >= r.savings ? r.shares : await c.step(toShares(v))) : 0n;
        Object.assign(W, { toAddr: to, value: v, lockerAmount: W.from === "locker" ? v : 0n, shares: conv < r.shares ? conv : r.shares, step: "keys", kerr: null });
        S.sheetKey++;
      } catch (e) { rethrow(e); W.err = txErr(e).msg; }
      finally { W.checking = false; }
    });
  },
  wdChange() {
    const W = sheetOf("withdraw");
    if (!W) return;
    cancelFlows();
    Object.assign(W, { step: "slip", k2: "empty", sig: undefined, card: undefined, send: "idle", sendErr: null, kerr: null });
    S.sock.k2 = "none"; S.sock.i2 = 0; S.sheetKey++; render();
  },
  typeCode() { const K = keySheet(); if (K) { K.k2 = "typing"; K.kerr = null; render(); } },
  pickCancel() { const K = keySheet(); if (K) { K.k2 = "empty"; K.kerr = null; render(); } },
  loadTyped() { const K = keySheet(); if (K) loadCardText(K.code ?? ""); },
  async loadFile(f: File) { loadCardText(f.size > 100_000 ? "" : await f.text().catch(() => "")); },
  useSaved() {
    const K = keySheet(), b = K && boxOf(K), t = b && savedCard(b.owner);
    if (!K) return;
    if (!t) { K.kerr = ERR.rememberedGone; render(); return; }
    loadCardText(t);
  },
  signCancel() { const K = keySheet(); if (K) { cancelFlows(); K.k2 = "loaded"; S.sock.i2 = 0; render(); } },
  signAgain() { const K = keySheet(), b = K && boxOf(K); if (K && b) { K.kerr = null; flow((c) => signWith(c, K, b)); } },
  turnKeys() {
    const W = sheetOf("withdraw"), b = cur();
    if (!W || !b || !GUARD || W.k2 !== "signed") return;
    flow(async (c) => {
      Object.assign(W, { send: "wallet", busy: true, sendErr: null, dev: undefined, kerr: null }); render();
      const w = await readyWallet(c, b.owner);
      if ("err" in w) { Object.assign(W, { send: "idle", busy: false, sendErr: w.err }); return; }
      if (Number(W.deadline) - chainNow() < 60) { W.busy = false; await signWith(c, W, b); return; } // slip about to expire: sign again
      try {
        const r = await tx(c, w.ok, { address: GUARD!, abi: guardAbi, functionName: "withdraw", args: [W.toAddr!, W.lockerAmount!, W.shares!, W.deadline!, W.sig!] }, (p) => {
          if (p === "wallet") W.send = "wallet";
          if (p === "confirming") { W.send = "confirming"; S.sock.i1 = 1; SFX.detent(); } // Key 1 earns its detent
          if (p === "slow") W.slow = true;
        });
        Object.assign(W, { tx: r.transactionHash, gasUsed: r.gasUsed, fee: r.gasUsed * r.effectiveGasPrice, block: r.blockNumber, send: "turning", slow: false });
        void pollFresh();
        await turnBothKeys(c); // receipt first, then the keys turn
        Object.assign(W, { step: "done", busy: false }); S.sheetKey++; SFX.stamp();
        announce(`Both keys turned. ${f2(W.value!)} USDC sent.`);
      } catch (e) {
        rethrow(e);
        Object.assign(W, { busy: false, slow: false });
        if (await recoverSig(c, e, W, b)) return;
        if (why(e).kind === "rejected") { W.send = "rejected"; SFX.errorBuzz(); return; } // both keys stay in the locks
        const m = txErr(e);
        Object.assign(W, { send: "idle", sendErr: m.msg, dev: m.dev }); SFX.errorBuzz();
      }
    });
  },

  /* ----- emergency exit ----- */
  exitStart() {
    const b = own();
    if (!hasBox(b)) { if (S.guard === "ok" && TOUR_OWNER) ACT.tourStep4(); else ACT.plaque(); return; }
    if (S.view !== "box") { Object.assign(S, { view: "box", showing: S.account, sock: { ...freshSock(), door: "open", k1: "in" } }); nav("/"); }
    openSheet({ type: "exitStart", phase: "explain", to: "self", other: "" });
  },
  tourStep4() { cancelFlows(); goTour(4); S.sock = { ...freshSock(), door: "open" }; jump(); render(); },
  exTo(to: ExitStartSheet["to"]) { const E = sheetOf("exitStart"); if (E) { E.to = to; E.err = null; render(); } },
  exitGo() {
    const E = sheetOf("exitStart");
    if (!E || !S.account || E.checking) return;
    const raw = E.to === "self" ? S.account : E.other.trim();
    if (!isAddress(raw, { strict: false }) || /^0x0{40}$/i.test(raw)) { E.err = ERR.exitToInvalid; render(); return; }
    const to = getAddress(raw);
    if (to === GUARD || to === USDC) { E.err = ERR.toBox; render(); return; }
    flow(async (c) => {
      E.checking = true; render();
      try {
        if (await c.step(isBlocked(to))) { E.err = ERR.toBlocked; return; }
        Object.assign(E, { err: null, toAddr: to, phase: "confirm" }); S.sheetKey++;
      } catch (e) { rethrow(e); E.err = txErr(e).msg; }
      finally { E.checking = false; }
    });
  },
  exitBack() { const E = sheetOf("exitStart"); if (E) { E.phase = "explain"; S.sheetKey++; render(); } },
  exitYes() {
    const E = sheetOf("exitStart"), b = own();
    if (!E?.toAddr || !b || !GUARD) return;
    flow(async (c) => {
      Object.assign(E, { phase: "wallet", busy: true, err: null, dev: undefined }); render();
      const w = await readyWallet(c, b.owner);
      if ("err" in w) { Object.assign(E, { phase: "confirm", busy: false, err: w.err }); return; }
      try {
        await tx(c, w.ok, { address: GUARD!, abi: guardAbi, functionName: "requestExit", args: [E.toAddr!] }, (p) => { if (p === "confirming") E.phase = "confirming"; });
        await c.step(pollFresh());
        E.busy = false; S.sheet = null; resetSock(); window.scrollTo({ top: 0 }); SFX.emergencyBell();
        const ex = exitOf(b);
        announce(`Emergency exit started. Opens ${ex ? fmtWhen(ex.readyAt * 1000) : "in 7 days"}.`);
      } catch (e) {
        rethrow(e);
        const m = txErr(e);
        Object.assign(E, { phase: "confirm", busy: false, err: m.msg, dev: m.dev });
      }
    });
  },
  exitCancel(owner: Address) { if (S.boxes[owner]) openSheet({ type: "exitCancel", owner, k2: "empty", send: "idle" }); },
  cancelSend() {
    const C = sheetOf("exitCancel"), b = C && S.boxes[C.owner];
    if (!C || !b || !GUARD || C.k2 !== "signed") return;
    flow(async (c) => {
      Object.assign(C, { send: "wallet", busy: true, sendErr: null, dev: undefined, kerr: null }); render();
      const w = await readyWallet(c); // any wallet may send it: the key card is the authority
      if ("err" in w) { Object.assign(C, { send: "idle", busy: false, sendErr: w.err }); return; }
      if (Number(C.deadline) - chainNow() < 60) { C.busy = false; await signWith(c, C, b); return; }
      try {
        const r = await tx(c, w.ok, { address: GUARD!, abi: guardAbi, functionName: "cancelExit", args: [b.owner, C.deadline!, C.sig!] }, (p) => {
          if (p === "confirming") C.send = "confirming";
          if (p === "slow") C.slow = true;
        });
        C.tx = r.transactionHash;
        await c.step(pollFresh());
        Object.assign(C, { busy: false, done: true }); SFX.emergencyBell(); SFX.stamp(0.2);
        announce("Exit cancelled. Your box is back to normal.");
      } catch (e) {
        rethrow(e);
        Object.assign(C, { busy: false, slow: false });
        if (await recoverSig(c, e, C, b)) return;
        if (why(e).kind === "rejected") { C.send = "rejected"; SFX.errorBuzz(); return; }
        const m = txErr(e);
        Object.assign(C, { send: "idle", sendErr: m.msg, dev: m.dev }); SFX.errorBuzz();
      }
    });
  },
  payout(owner: Address) {
    const b = S.boxes[owner];
    if (!b?.r || !GUARD || S.payBusy) return;
    flow(async (c) => {
      S.payBusy = true; S.payErr = null; render();
      const w = await readyWallet(c); // anyone may press it; the money only goes to the chosen address
      if ("err" in w) { S.payBusy = false; S.payErr = w.err; return; }
      const amt = total(b), to = b.r!.exitTo;
      try {
        const r = await tx(c, w.ok, { address: GUARD!, abi: guardAbi, functionName: "executeExit", args: [b.owner] }, () => {});
        await c.step(pollFresh());
        S.payBusy = false;
        S.sheet = { type: "notice", title: "Exit paid", head: "EMERGENCY EXIT", line: `${f2(amt)} USDC → ${short(to)}`, stamp: "EXIT PAID", ink: "red", text: "Box is now empty.", tx: r.transactionHash };
        S.sheetKey++; SFX.stamp();
      } catch (e) {
        rethrow(e);
        S.payBusy = false; S.payErr = txErr(e).msg;
      }
    });
  },
  retryLogs(owner: Address) { const b = S.boxes[owner]; if (b) void refreshLogs(b); },
};

/* ===== wallet events, routes, start-up ===== */
function onAccounts(list: readonly string[]) {
  if (localStorage.getItem("ag:disconnected")) return;
  const next = list[0] ? getAddress(list[0]) : null;
  if (next === S.account) return;
  cancelFlows();
  Object.assign(S, { account: next, walletBal: null, sheet: null });
  if (!next) { S.err = "disconnected"; S.sock.k1 = "none"; render(); return; }
  if (S.err === "disconnected") S.err = null;
  if (S.sock.door === "open" || S.view !== "landing") S.sock.k1 = "in";
  if (S.view === "box" || S.view === "open") {
    S.showing = next; S.open = null;
    void pollFresh().then(() => {
      const b = own();
      if (hasBox(b)) {
        S.view = "box";
        S.err = "account"; S.errText = `Switched wallet · Box No. ${b.no}`;
        setTimeout(() => { if (S.err === "account") { S.err = null; render(); } }, 8000);
      } else { S.view = "open"; S.open = { step: 2, noUsdc: (S.walletBal ?? 0n) < 10_000n }; }
      render();
    });
  }
  render();
}

/** Two pages: / (door, practice, your box) and /box (read-only: ?owner=0x…, or the builder's box). */
function applyRoute() {
  const q = new URLSearchParams(location.search), path = location.pathname.replace(/\/+$/, "") || "/";
  const m = /^\/box(?:\/(0x[0-9a-fA-F]{40}))?$/.exec(path); // /box/0x… too, if the host rewrites it to /box
  const inside = (k1: boolean): Sock => ({ ...freshSock(), door: "open", wheel: "open", k1: k1 ? "in" : "none" });
  Object.assign(S, { sheet: null, practice: null, replay: null });
  if (m && S.guard === "ok") {
    const raw = m[1] ?? q.get("owner") ?? "";
    if (isAddress(raw, { strict: false })) {
      const a = getAddress(raw);
      Object.assign(S, a === S.account ? { view: "box", showing: a, sock: inside(true) } : { view: "view", showing: a, sock: inside(false) });
      return;
    }
    if (TOUR_OWNER) { Object.assign(S, { view: "tour", tourStep: 1, showing: TOUR_OWNER, sock: inside(false) }); return; }
  }
  if (!m && q.get("view") === "practice") { Object.assign(S, { view: "practice", showing: null, sock: { ...freshSock(), k1: S.account ? "in" : "none" } }); return; }
  Object.assign(S, { view: "landing", showing: null, sock: { ...freshSock(), k1: S.account ? "in" : "none" } });
}

let started = false;
export async function init() {
  if (started) return;
  started = true;
  const e = eth();
  const guardP = GUARD ? checkGuard(GUARD).then((r) => { S.guard = r; }, () => { S.guard = "rpc"; }) : Promise.resolve();
  if (e) {
    try {
      const a = localStorage.getItem("ag:disconnected") ? [] : await accounts(false);
      if (a[0]) { S.account = a[0]; S.chainId = await chainIdOf(); if (S.chainId !== 5042) { S.err = "network"; S.errText = ERR.wrongNetwork; } }
    } catch { /* the wallet stays locked until asked */ }
    e.on("accountsChanged", (a) => onAccounts(a));
    e.on("chainChanged", (id) => {
      S.chainId = Number(id);
      if (S.chainId === 5042) { if (S.err === "network") S.err = null; }
      else if (S.account) { S.err = "network"; S.errText = ERR.wrongNetwork; }
      render();
    });
  }
  await guardP;
  applyRoute();
  render();
  await pollFresh();
  render();
  addEventListener("popstate", () => { cancelFlows(); applyRoute(); jump(); render(); void pollFresh(); });
  addEventListener("beforeunload", (ev) => { if (S.open?.card && !S.open.done) ev.preventDefault(); }); // an unsaved card would be lost
  setInterval(() => { if (Date.now() - HB.tried >= 10_000 && !document.hidden) void poll(); render(); }, 1000);
}
