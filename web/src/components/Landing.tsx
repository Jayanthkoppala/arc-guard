// The door: headline, one line, two buttons and the practice link. Nothing else.
import { GUARD } from "@/lib/chain";
import { ACT, ERR, S, hasBox, own, short } from "@/lib/store";
import { ErrorLine } from "./bits";

export function Landing() {
  const nw = !S.walletFound, ok = S.guard === "ok", ob = own();
  const guardMsg = S.guard === "none" ? "Not deployed on Arc yet." : S.guard === "bad" ? "Invalid contract link."
    : S.guard === "notGuard" ? `No Arc Guard at ${short(GUARD!)}.` : S.guard === "rpc" ? ERR.rpc
    : null;
  const open = <button key="open" type="button" className={`btn btn--big${nw ? "" : " btn--primary"}`} disabled={!ok || S.connecting} onClick={ACT.connect}>
    {S.connecting ? "Check your wallet…" : "Open the door"}</button>;
  const vault = <a key="vault" className={`btn btn--big${nw ? " btn--primary" : ""}`} href="/hall" aria-disabled={!ok}>See the vault</a>;
  return <div className="landing">
    <h1 className="hero-title">Your dollars, behind two keys.</h1>
    <p className="lead">{hasBox(ob) ? `Welcome back · Box No. ${ob.no}` : "A two-key USDC box on Arc."}</p>
    <div className="cta">{nw ? [vault, open] : [open, vault]}</div>
    <ErrorLine msg={guardMsg} />
    <ErrorLine msg={S.landErr} />
    <p><button type="button" className="link" onClick={ACT.practice}>or try Key 2 yourself →</button></p>
  </div>;
}
