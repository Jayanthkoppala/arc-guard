// Key 2 runs here, off the main thread: keygen from the card's 48-byte seed, then sign or verify.
import { slh_dsa_sha2_128s as slh } from "@noble/post-quantum/slh-dsa.js";

export type SignerRequest =
  | { op: "keygen"; seed: Uint8Array }
  | { op: "sign"; seed: Uint8Array; msg: Uint8Array }
  | { op: "verify"; pub: Uint8Array; msg: Uint8Array; sig: Uint8Array };
export type SignerReply = { pub?: Uint8Array; sig?: Uint8Array; ok?: boolean; error?: string };

self.onmessage = (e: MessageEvent<SignerRequest>) => {
  const r = e.data;
  let reply: SignerReply;
  try {
    if (r.op === "verify") reply = { ok: slh.verify(r.sig, r.msg, r.pub) };
    else {
      const k = slh.keygen(r.seed);
      reply = r.op === "sign" ? { pub: k.publicKey, sig: slh.sign(r.msg, k.secretKey) } : { pub: k.publicKey };
      k.secretKey.fill(0);
    }
  } catch (err) {
    reply = { error: String(err) };
  }
  self.postMessage(reply);
};
