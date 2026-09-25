// Deterministic SLH-DSA-SHA2-128s key + signature, for Foundry tests. Usage: bun scripts/pqfixture.ts <seedHex48> <msgHex32>
import { slh_dsa_sha2_128s as slh } from "@noble/post-quantum/slh-dsa.js";
const hex = (b: Uint8Array) => "0x" + Buffer.from(b).toString("hex");
const un = (h: string) => Uint8Array.from(Buffer.from(h.replace(/^0x/, ""), "hex"));
const [seed, msg] = process.argv.slice(2);
const k = slh.keygen(un(seed));
if (!msg) { console.log(hex(k.publicKey)); process.exit(0); }
console.log(hex(slh.sign(un(msg), k.secretKey)));
