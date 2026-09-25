// Creates the public demo box on Arc mainnet and runs one real two-key withdrawal.
// Usage: bun --env-file=.env scripts/demo.ts <ArcGuardAddress>
// Needs PRIVATE_KEY (funded with a few USDC on Arc) and DEMO_PQ_SEED (48-byte hex) in .env.
import { createPublicClient, createWalletClient, http, parseAbi, encodeAbiParameters, keccak256, parseGwei, hexToBytes, bytesToHex, type Hex, type Abi } from "viem";
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
const USDC: Hex = "0x3600000000000000000000000000000000000000";
const usdcAbi = parseAbi(["function approve(address,uint256) returns (bool)", "function balanceOf(address) view returns (uint256)"]);
const abi = artifact.abi as Abi;
const guard = process.argv[2] as Hex;
if (!guard) throw new Error("usage: demo.ts <ArcGuardAddress>");

const account = privateKeyToAccount(process.env.PRIVATE_KEY as Hex);
const pub = createPublicClient({ chain: arc, transport: http() });
const wallet = createWalletClient({ account, chain: arc, transport: http() });
const fees = { maxFeePerGas: parseGwei("30"), maxPriorityFeePerGas: parseGwei("1") };
const keys = slh.keygen(hexToBytes(process.env.DEMO_PQ_SEED as Hex));
const pqKey = bytesToHex(keys.publicKey);

// Every write goes through here: fixed fees (Arc drops txs under 20 gwei), wait for the receipt, print the explorer link.
async function send(label: string, address: Hex, contractAbi: Abi, functionName: string, args: readonly unknown[]) {
  const hash = await wallet.writeContract({ address, abi: contractAbi, functionName, args, ...fees });
  const r = await pub.waitForTransactionReceipt({ hash });
  if (r.status !== "success") throw new Error(`${label} failed: ${hash}`);
  console.log(`${label.padEnd(18)} ${arc.blockExplorers.default.url}/tx/${hash}  gas ${r.gasUsed}`);
}

const box = (await pub.readContract({ address: guard, abi, functionName: "boxes", args: [account.address] })) as readonly unknown[];
if (box[0] === "0x" + "0".repeat(64)) await send("open", guard, abi, "open", [pqKey]);
else if (box[0] !== pqKey) throw new Error("box exists with a different key");

await send("approve", USDC, usdcAbi, "approve", [guard, 200000n]);
await send("deposit 0.20", guard, abi, "deposit", [200000n]);
await send("moveToSavings 0.10", guard, abi, "moveToSavings", [100000n]);

// Two-key withdrawal: 0.05 USDC from the Locker back to the owner.
const amount = 50000n;
const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
const action = keccak256(encodeAbiParameters([{ type: "string" }, { type: "address" }, { type: "uint256" }, { type: "uint256" }], ["withdraw", account.address, amount, 0n]));
const digest = (await pub.readContract({ address: guard, abi, functionName: "digest", args: [account.address, action, deadline] })) as Hex;
const t0 = performance.now();
const sig = bytesToHex(slh.sign(hexToBytes(digest), keys.secretKey));
console.log(`PQ sign          ${(performance.now() - t0).toFixed(0)} ms, ${(sig.length - 2) / 2} bytes`);
await send("withdraw (2 keys)", guard, abi, "withdraw", [account.address, amount, 0n, deadline, sig]);

const [, , , , locker, shares] = (await pub.readContract({ address: guard, abi, functionName: "boxes", args: [account.address] })) as readonly bigint[];
const savings = await pub.readContract({ address: guard, abi, functionName: "savingsValue", args: [account.address] });
console.log(`box: locker ${Number(locker) / 1e6} USDC, savings ${Number(savings) / 1e6} USDC (${shares} shares)`);
