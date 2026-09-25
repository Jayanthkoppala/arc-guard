// Creates the public demo box on Arc mainnet and runs one real two-key withdrawal.
// Usage: bun --env-file=.env scripts/demo.ts <ArcGuardAddress>
// Needs PRIVATE_KEY (funded with a few USDC on Arc) and DEMO_PQ_SEED (48-byte hex) in .env.
import { createPublicClient, createWalletClient, http, parseAbi, encodeAbiParameters, keccak256, parseGwei, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";
import { slh_dsa_sha2_128s as slh } from "@noble/post-quantum/slh-dsa.js";
import artifact from "../out/ArcGuard.sol/ArcGuard.json";

const arc = defineChain({
  id: 5042,
  name: "Arc",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.mainnet.arc.io"] } },
  blockExplorers: { default: { name: "Arc Explorer", url: "https://explorer.arc.io" } },
});
const USDC = "0x3600000000000000000000000000000000000000";
const usdcAbi = parseAbi(["function approve(address,uint256) returns (bool)", "function balanceOf(address) view returns (uint256)"]);
const abi = artifact.abi;
const guard = process.argv[2] as Hex;
if (!guard) throw new Error("usage: demo.ts <ArcGuardAddress>");

const account = privateKeyToAccount(process.env.PRIVATE_KEY as Hex);
const pub = createPublicClient({ chain: arc, transport: http() });
const wallet = createWalletClient({ account, chain: arc, transport: http() });
const fees = { maxFeePerGas: parseGwei("30"), maxPriorityFeePerGas: parseGwei("1") };
const hexToBytes = (h: string) => Uint8Array.from(Buffer.from(h.replace(/^0x/, ""), "hex"));
const keys = slh.keygen(hexToBytes(process.env.DEMO_PQ_SEED!));
const pqKey = ("0x" + Buffer.from(keys.publicKey).toString("hex")) as Hex;

async function send(label: string, req: Parameters<typeof pub.simulateContract>[0]) {
  const { request } = await pub.simulateContract({ ...req, account, ...fees } as any);
  const hash = await wallet.writeContract(request as any);
  const r = await pub.waitForTransactionReceipt({ hash });
  if (r.status !== "success") throw new Error(`${label} failed: ${hash}`);
  console.log(`${label.padEnd(16)} ${arc.blockExplorers.default.url}/tx/${hash}  gas ${r.gasUsed}`);
  return hash;
}

const box = (await pub.readContract({ address: guard, abi, functionName: "boxes", args: [account.address] })) as readonly unknown[];
if (box[0] === "0x" + "0".repeat(64)) await send("open", { address: guard, abi, functionName: "open", args: [pqKey] });
else if (box[0] !== pqKey) throw new Error("box exists with a different key");

await send("approve", { address: USDC, abi: usdcAbi, functionName: "approve", args: [guard, 3_000000n] });
await send("deposit 3", { address: guard, abi, functionName: "deposit", args: [3_000000n] });
await send("moveToSavings 2", { address: guard, abi, functionName: "moveToSavings", args: [2_000000n] });

// Two-key withdrawal: 0.50 USDC from the Locker back to the owner.
const amount = 500000n;
const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
const action = keccak256(encodeAbiParameters([{ type: "string" }, { type: "address" }, { type: "uint256" }, { type: "uint256" }], ["withdraw", account.address, amount, 0n]));
const digest = (await pub.readContract({ address: guard, abi, functionName: "digest", args: [account.address, action, deadline] })) as Hex;
const t0 = performance.now();
const sig = ("0x" + Buffer.from(slh.sign(hexToBytes(digest), keys.secretKey)).toString("hex")) as Hex;
console.log(`PQ sign          ${(performance.now() - t0).toFixed(0)} ms, ${(sig.length - 2) / 2} bytes`);
await send("withdraw (2 keys)", { address: guard, abi, functionName: "withdraw", args: [account.address, amount, 0n, deadline, sig] });

const [, , , , locker, shares] = (await pub.readContract({ address: guard, abi, functionName: "boxes", args: [account.address] })) as readonly bigint[];
const savings = await pub.readContract({ address: guard, abi, functionName: "savingsValue", args: [account.address] });
console.log(`box: locker ${Number(locker) / 1e6} USDC, savings ${Number(savings) / 1e6} USDC (${shares} shares)`);
