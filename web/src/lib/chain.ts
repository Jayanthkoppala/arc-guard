// Everything that talks to Arc: config, ABIs, reads, the passbook log reader, the wallet and transactions.
// Browser-only module (loaded through next/dynamic with ssr: false).
import {
  BaseError, ContractFunctionRevertedError, HttpRequestError, LimitExceededRpcError, TimeoutError, UserRejectedRequestError,
  WaitForTransactionReceiptTimeoutError, createPublicClient, createWalletClient, custom, decodeEventLog, defineChain,
  encodeAbiParameters, encodeFunctionData, getAddress, http, isAddress, keccak256, pad, parseAbi, toHex,
} from "viem";
import type {
  Abi, Address, ContractFunctionArgs, ContractFunctionName, EIP1193Provider, EncodeFunctionDataParameters, EstimateContractGasParameters, Hex,
  RpcLog, TransactionReceipt,
} from "viem";

export function sleep(ms: number) {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
}

// NEXT_PUBLIC_ARC_RPC_URL exists for local fork testing; production reads Arc mainnet's public RPC.
export const RPC = process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.mainnet.arc.io";
export const EXPLORER = "https://explorer.arc.io";
export const USDC: Address = "0x3600000000000000000000000000000000000000";
export const VAULT: Address = "0x8E357432CC12ff425c36432F312968aEb16112AF";
export const PQ: Address = "0x1800000000000000000000000000000000000004";
const MULTICALL3: Address = "0xcA11bde05977b3631167028862bE2a173976CA11";
export const SOURCE_URL = process.env.NEXT_PUBLIC_SOURCE_URL || "https://github.com/";
export const txUrl = (h: string) => `${EXPLORER}/tx/${h}?tab=logs`;
export const addrUrl = (a: string) => `${EXPLORER}/address/${a}`;

export const arc = defineChain({
  id: 5042,
  name: "Arc",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
  blockExplorers: { default: { name: "Arc explorer", url: EXPLORER } },
  contracts: { multicall3: { address: MULTICALL3 } },
});

/* ---------- config: env, overridable with ?guard=0x… ---------- */
const envGuard = process.env.NEXT_PUBLIC_ARC_GUARD_ADDRESS?.trim() || "";
const queryGuard = new URLSearchParams(location.search).get("guard")?.trim() || "";
export const GUARD_RAW = queryGuard || envGuard;
export const GUARD: Address | null = isAddress(GUARD_RAW, { strict: false }) ? getAddress(GUARD_RAW) : null;
const envTour = process.env.NEXT_PUBLIC_TOUR_OWNER?.trim() || "";
export const TOUR_OWNER: Address | null = isAddress(envTour, { strict: false }) ? getAddress(envTour) : null;
// The deploy block only applies to the env address; a ?guard= override finds its own.
const envDeploy = process.env.NEXT_PUBLIC_ARC_GUARD_DEPLOY_BLOCK?.trim();
const ENV_DEPLOY_BLOCK = !queryGuard && envDeploy && /^\d+$/.test(envDeploy) ? BigInt(envDeploy) : null;

/* ---------- ABIs ---------- */
export const guardAbi = parseAbi([
  "function open(bytes32 pqKey)",
  "function deposit(uint256 amount)",
  "function moveToSavings(uint256 amount)",
  "function moveToLocker(uint256 shares)",
  "function requestExit(address to)",
  "function executeExit(address owner)",
  "function withdraw(address to, uint256 lockerAmount, uint256 shares, uint256 deadline, bytes pqSig)",
  "function cancelExit(address owner, uint256 deadline, bytes pqSig)",
  "function digest(address owner, bytes32 actionHash, uint256 deadline) view returns (bytes32)",
  "function savingsValue(address owner) view returns (uint256)",
  "function boxes(address) view returns (bytes32 pqKey, uint64 nonce, uint64 exitReadyAt, address exitTo, uint256 locker, uint256 shares)",
  "function usdc() view returns (address)",
  "function vault() view returns (address)",
  "function EXIT_DELAY() view returns (uint256)",
  "event Opened(address indexed owner, bytes32 pqKey)",
  "event Deposited(address indexed owner, uint256 amount)",
  "event MovedToSavings(address indexed owner, uint256 amount, uint256 shares)",
  "event MovedToLocker(address indexed owner, uint256 shares, uint256 amount)",
  "event PQVerified(address indexed owner, bytes32 digest, uint64 nonce)",
  "event Withdrawn(address indexed owner, address indexed to, uint256 lockerAmount, uint256 shares, uint256 savingsAmount)",
  "event KeyRotated(address indexed owner, bytes32 newKey)",
  "event ExitRequested(address indexed owner, address indexed to, uint64 readyAt)",
  "event ExitCancelled(address indexed owner)",
  "event ExitExecuted(address indexed owner, address indexed to, uint256 amount)",
  "error NoBox()", "error AlreadyOpen()", "error BadAmount()", "error Expired()", "error BadSignature()",
  "error Blocked()", "error NoExit()", "error ExitNotReady()", "error TransferFailed()",
]);
export const usdcAbi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function isBlacklisted(address) view returns (bool)",
]);
const vaultAbi = parseAbi([
  "function convertToAssets(uint256 shares) view returns (uint256)",
  "function convertToShares(uint256 assets) view returns (uint256)",
]);
const mc3Abi = parseAbi([
  "function getBlockNumber() view returns (uint256)",
  "function getCurrentBlockTimestamp() view returns (uint256)",
  "function getBasefee() view returns (uint256)",
]);
const pqAbi = parseAbi(["function verifySlhDsaSha2128s(bytes vk, bytes msg, bytes sig) view returns (bool)"]);

/* ---------- public client: the public RPC allows ~3–4 quick calls, so space them out ---------- */
let nextSlot = 0;
const spacedFetch: typeof fetch = async (input, init) => {
  const t = Date.now(), wait = Math.max(0, nextSlot - t);
  nextSlot = Math.max(t, nextSlot) + 260;
  if (wait) await sleep(wait);
  return fetch(input, init);
};
// viem retries "rate limit exceeded" (-32005) with exponential backoff.
export const pub = createPublicClient({ chain: arc, transport: http(RPC, { fetchFn: spacedFetch, retryCount: 5, retryDelay: 700, timeout: 20_000 }) });

/* ---------- reads ---------- */
export type BoxRead = { pqKey: Hex; nonce: bigint; exitReadyAt: bigint; exitTo: Address; locker: bigint; shares: bigint; savings: bigint };
export type Snap = { box: BoxRead; block: bigint; ts: bigint; basefee: bigint; walletBal: bigint };
const ZERO: Address = "0x0000000000000000000000000000000000000000";

/** One eth_call per heartbeat: chain head, the box, and the wallet's USDC. Missing owner/wallet read as the zero address. */
export async function readSnap(guard: Address, owner: Address | null, wallet: Address | null): Promise<Snap> {
  const [block, ts, basefee, b, savings, walletBal] = await pub.multicall({
    allowFailure: false,
    contracts: [
      { address: MULTICALL3, abi: mc3Abi, functionName: "getBlockNumber" },
      { address: MULTICALL3, abi: mc3Abi, functionName: "getCurrentBlockTimestamp" },
      { address: MULTICALL3, abi: mc3Abi, functionName: "getBasefee" },
      { address: guard, abi: guardAbi, functionName: "boxes", args: [owner ?? ZERO] },
      { address: guard, abi: guardAbi, functionName: "savingsValue", args: [owner ?? ZERO] },
      { address: USDC, abi: usdcAbi, functionName: "balanceOf", args: [wallet ?? ZERO] },
    ],
  });
  const [pqKey, nonce, exitReadyAt, exitTo, locker, shares] = b;
  return { box: { pqKey, nonce, exitReadyAt, exitTo, locker, shares, savings }, block, ts, basefee, walletBal };
}

/** Is there an Arc Guard at this address, wired to Arc's USDC and the Galaxy vault? */
export async function checkGuard(guard: Address): Promise<"ok" | "notGuard"> {
  const code = await pub.getCode({ address: guard });
  if (!code || code === "0x") return "notGuard";
  const r = await pub.multicall({
    contracts: [
      { address: guard, abi: guardAbi, functionName: "usdc" },
      { address: guard, abi: guardAbi, functionName: "vault" },
      { address: guard, abi: guardAbi, functionName: "EXIT_DELAY" },
    ],
  });
  const ok = r[0].status === "success" && r[0].result === USDC && r[1].status === "success" && r[1].result === VAULT && r[2].status === "success" && r[2].result === 604800n;
  return ok ? "ok" : "notGuard";
}

/** Rate over the last 7 days from the vault's share price, in % a year. Needs an archive read, which the public RPC serves. */
export async function readApy(head: bigint): Promise<number> {
  const at = (blockNumber: bigint) => pub.multicall({
    blockNumber, allowFailure: false,
    contracts: [
      { address: VAULT, abi: vaultAbi, functionName: "convertToAssets", args: [10n ** 24n] },
      { address: MULTICALL3, abi: mc3Abi, functionName: "getCurrentBlockTimestamp" },
    ],
  });
  const [[a1, t1], [a0, t0]] = [await at(head), await at(head - 1_186_000n)]; // ≈ 7 days at 0.51 s a block
  const growth = Number((a1 * 10n ** 15n) / a0) / 1e15;
  return (growth ** (365 * 86400 / Number(t1 - t0)) - 1) * 100;
}

export const toShares = (assets: bigint) => pub.readContract({ address: VAULT, abi: vaultAbi, functionName: "convertToShares", args: [assets] });
export const allowance = (owner: Address, guard: Address) => pub.readContract({ address: USDC, abi: usdcAbi, functionName: "allowance", args: [owner, guard] });
export const isBlocked = (a: Address) => pub.readContract({ address: USDC, abi: usdcAbi, functionName: "isBlacklisted", args: [a] });
export const digestOf = (guard: Address, owner: Address, actionHash: Hex, deadline: bigint) =>
  pub.readContract({ address: guard, abi: guardAbi, functionName: "digest", args: [owner, actionHash, deadline] });

/** Arc's built-in post-quantum checker, called read-only: no wallet, no fee, no receipt. */
export const pqVerify = (pubKey: Uint8Array, msg: Uint8Array, sig: Uint8Array) =>
  pub.readContract({ address: PQ, abi: pqAbi, functionName: "verifySlhDsaSha2128s", args: [toHex(pubKey), toHex(msg), toHex(sig)] });

/** keccak256(abi.encode(...)) exactly as ArcGuard builds each action. */
export const actionHash = {
  withdraw: (to: Address, lockerAmount: bigint, shares: bigint) =>
    keccak256(encodeAbiParameters([{ type: "string" }, { type: "address" }, { type: "uint256" }, { type: "uint256" }], ["withdraw", to, lockerAmount, shares])),
  cancelExit: () => keccak256(encodeAbiParameters([{ type: "string" }], ["cancel-exit"])),
};

/* ---------- passbook: the owner's events, read in chunks and cached ---------- */
const CHUNK = 9_999n; // the public RPC refuses 10,000-block ranges
type LogCache = { from: string; to: string; logs: RpcLog[]; done: boolean };

/** First block with the contract's code: NEXT_PUBLIC_ARC_GUARD_DEPLOY_BLOCK, else a binary search (cached). */
async function deployBlock(guard: Address, head: bigint): Promise<bigint> {
  if (ENV_DEPLOY_BLOCK !== null) return ENV_DEPLOY_BLOCK;
  const key = `ag:deploy:${guard}`, hit = localStorage.getItem(key);
  if (hit) return BigInt(hit);
  let lo = 0n, hi = head;
  while (lo < hi) {
    const mid = (lo + hi) / 2n, code = await pub.getCode({ address: guard, blockNumber: mid });
    if (code && code !== "0x") hi = mid; else lo = mid + 1n;
  }
  localStorage.setItem(key, String(lo));
  return lo;
}

const OPENED_TOPIC = keccak256(toHex("Opened(address,bytes32)"));

async function getLogs(guard: Address, owner: Address, a: bigint, b: bigint) {
  const logs = await pub.request({
    method: "eth_getLogs",
    params: [{ address: guard, topics: [null, pad(owner)], fromBlock: toHex(a), toBlock: toHex(b) }],
  });
  // Arc's RPC stamps each log with blockTimestamp; other nodes (a local fork) may not.
  const missing = [...new Set(logs.filter((l) => !l.blockTimestamp && l.blockNumber).map((l) => l.blockNumber!))];
  const ts: Record<string, Hex> = {};
  for (const n of missing) ts[n] = toHex((await pub.getBlock({ blockNumber: BigInt(n) })).timestamp);
  return logs.map((l) => (l.blockTimestamp || !l.blockNumber ? l : { ...l, blockTimestamp: ts[l.blockNumber] }));
}

/**
 * Reads every event for `owner`: new blocks first, then back in time until the box's Opened line
 * (or the deploy block). Calls `onLogs` after each chunk with everything read so far, oldest first.
 */
export async function readLogs(guard: Address, owner: Address, head: bigint, onLogs: (logs: RpcLog[], done: boolean) => void) {
  const key = `ag:pb:${guard}:${owner}`, empty = (): LogCache => ({ from: String(head + 1n), to: String(head), logs: [], done: false });
  let c: LogCache;
  try { c = JSON.parse(localStorage.getItem(key) || "null") ?? empty(); } catch { c = empty(); }
  const save = () => { try { localStorage.setItem(key, JSON.stringify(c)); } catch { /* full or disabled: reread next time */ } onLogs(c.logs, c.done); };
  if (c.logs.length) onLogs(c.logs, c.done);
  for (let a = BigInt(c.to) + 1n; a <= head; a += CHUNK) {
    const b = a + CHUNK - 1n < head ? a + CHUNK - 1n : head;
    c.logs = [...c.logs, ...(await getLogs(guard, owner, a, b))];
    c.to = String(b);
    save();
  }
  if (c.done) return;
  const floor = await deployBlock(guard, head);
  while (!c.done) {
    const b = BigInt(c.from) - 1n;
    if (b < floor) { c.done = true; save(); break; }
    const a = b - CHUNK + 1n > floor ? b - CHUNK + 1n : floor;
    const logs = await getLogs(guard, owner, a, b);
    c.logs = [...logs, ...c.logs];
    c.from = String(a);
    c.done = logs.some((l) => l.topics[0] === OPENED_TOPIC) || a === floor;
    save();
  }
}

export const decodeLog = (l: RpcLog) => decodeEventLog({ abi: guardAbi, data: l.data, topics: l.topics });

/* ---------- wallet ---------- */
export const eth = (): EIP1193Provider | undefined => window.ethereum;
const walletClient = () => createWalletClient({ chain: arc, transport: custom(eth()!) });

export async function accounts(ask: boolean): Promise<Address[]> {
  const a = await eth()!.request({ method: ask ? "eth_requestAccounts" : "eth_accounts" });
  return a.map((x) => getAddress(x));
}
export const chainIdOf = async () => Number(await eth()!.request({ method: "eth_chainId" }));

/** Switch the wallet to Arc, adding the network if the wallet doesn't know it. */
export async function ensureArc() {
  if ((await chainIdOf()) === arc.id) return;
  try {
    await eth()!.request({ method: "wallet_switchEthereumChain", params: [{ chainId: toHex(arc.id) }] });
  } catch (e) {
    if (codeOf(e) !== 4902) throw e;
    await eth()!.request({
      method: "wallet_addEthereumChain",
      params: [{ chainId: toHex(arc.id), chainName: "Arc", nativeCurrency: arc.nativeCurrency, rpcUrls: [RPC], blockExplorerUrls: [EXPLORER] }],
    });
  }
}

export type TxPhase = "wallet" | "confirming" | "slow";
export class TxError extends Error {
  constructor(public kind: "reverted" | "dropped" | "timeout", public hash: Hex, public receipt?: TransactionReceipt) { super(kind); }
}

/**
 * The one transaction pattern: simulate (estimateGas decodes reverts), open the wallet, wait for the receipt.
 * Fees: Arc's mempool silently drops anything under 20 gwei, so maxFeePerGas is at least 30 gwei.
 */
export async function sendTx<const abi extends Abi, fn extends ContractFunctionName<abi, "nonpayable">>(
  account: Address,
  call: { address: Address; abi: abi; functionName: fn; args: ContractFunctionArgs<abi, "nonpayable", fn> },
  basefee: bigint,
  on: (phase: TxPhase, hash?: Hex) => void,
): Promise<TransactionReceipt> {
  // viem's contract generics don't survive being forwarded; the call is type-checked at this function's signature.
  const c = { ...call, account } as unknown as EstimateContractGasParameters;
  const gas = await pub.estimateContractGas(c);
  const data = encodeFunctionData(call as unknown as EncodeFunctionDataParameters);
  on("wallet");
  const gwei = 1_000_000_000n, fee = basefee * 2n + gwei;
  const hash = await walletClient().sendTransaction({
    account, to: call.address, data, chain: arc,
    gas: (gas * 5n) / 4n, maxFeePerGas: fee > 30n * gwei ? fee : 30n * gwei, maxPriorityFeePerGas: gwei,
  });
  on("confirming", hash);
  const slow = setTimeout(() => on("slow", hash), 5000);
  try {
    const receipt = await pub.waitForTransactionReceipt({ hash, timeout: 60_000, pollingInterval: 1000 });
    if (receipt.status !== "success") throw new TxError("reverted", hash, receipt);
    return receipt;
  } catch (e) {
    if (!(e instanceof WaitForTransactionReceiptTimeoutError)) throw e;
    const known = await pub.getTransaction({ hash }).then(() => true, () => false);
    throw new TxError(known ? "timeout" : "dropped", hash);
  } finally {
    clearTimeout(slow);
  }
}

/* ---------- errors → copy keys ---------- */
const codeOf = (e: unknown): number | undefined =>
  e && typeof e === "object" && "code" in e && typeof e.code === "number" ? e.code : undefined;

export type Why = { kind: "rejected" | "revert" | "rpc" | "dropped" | "timeout" | "reverted" | "unknown"; name?: string; detail: string };
export function why(e: unknown): Why {
  const detail = e instanceof BaseError ? e.shortMessage : e instanceof Error ? e.message : String(e);
  if (e instanceof TxError) return { kind: e.kind, detail: `${e.kind} · ${e.hash}` };
  if (codeOf(e) === 4001) return { kind: "rejected", detail };
  if (e instanceof BaseError) {
    if (e.walk((x) => x instanceof UserRejectedRequestError || codeOf(x) === 4001)) return { kind: "rejected", detail };
    const rev = e.walk((x) => x instanceof ContractFunctionRevertedError);
    if (rev instanceof ContractFunctionRevertedError) return { kind: "revert", name: rev.data?.errorName ?? rev.reason, detail };
    if (e.walk((x) => x instanceof HttpRequestError || x instanceof TimeoutError || x instanceof LimitExceededRpcError)) return { kind: "rpc", detail };
  }
  return { kind: "unknown", detail };
}
