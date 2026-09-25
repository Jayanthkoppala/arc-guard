// Open a box in four steps: wallet, cut the key card, save and check it, then open() on Arc.
import { useRef } from "react";
import { txUrl } from "@/lib/chain";
import { boxNoOf } from "@/lib/card";
import type { IssuedCard } from "@/lib/card";
import { ACT, ERR, S, short } from "@/lib/store";
import type { OpenState } from "@/lib/store";
import { Details, ErrorLine, Ext, Status } from "./bits";

function KeyCard({ c }: { c: IssuedCard }) {
  return <div className="keycard" role="img" aria-label={`Key card for Box No. ${c.box}, card print ${c.print}`}>
    <div className="keycard-head"><span>ARC GUARD</span><span>KEY CARD</span></div>
    <dl className="keycard-fields"><dt>BOX No.</dt><dd>{c.box}</dd><dt>HOLDER</dt><dd>{short(c.owner)}</dd><dt>ISSUED</dt><dd>{c.issued}</dd><dt>PRINT</dt><dd>{c.print}</dd></dl>
    <p className="keycard-note">KEY 2 OF 2 · CODE HIDDEN</p>
  </div>;
}

function SaveCard({ O, c }: { O: OpenState; c: IssuedCard }) {
  const file = useRef<HTMLInputElement>(null);
  return <>
    <div className="tray"><KeyCard c={c} /></div>
    <div className="row">
      <button type="button" className="btn" onClick={ACT.dl}>Download</button>
      <button type="button" className="btn" onClick={ACT.print}>Print</button>
      <button type="button" className="btn" onClick={ACT.copyCard}>Copy</button>
    </div>
    {O.copied && <p className="ok small">Copied.</p>}
    <ErrorLine msg={O.dlErr} />
    <Details label="Keep it safe"><ul className="bullets">
      <li>Key 2: with your wallet, it opens the box.</li>
      <li>Keep it away from your wallet’s device.</li>
      <li>Never share it. Nobody will ask.</li>
      <li>Lost it? Use the 7-day exit.</li>
      <li>No copy exists anywhere else.</li>
    </ul></Details>
    {O.checked ? <p className="ok">Card fits Box No. {c.box}.</p>
      : O.skipped ? <p className="warn small">Skipped. Exit is your only backup.</p>
      : <div className="row"><button type="button" className="btn" onClick={() => file.current?.click()}>Check card</button><button type="button" className="link small" onClick={ACT.skipCheck}>Skip</button></div>}
    <input ref={file} type="file" hidden accept=".json,application/json,text/plain" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void ACT.checkCard(f); }} />
    <ErrorLine msg={O.checkErr} />
    <label className="check"><input type="checkbox" checked={!!O.saved} onChange={(e) => ACT.savedTick(e.target.checked)} /> Saved, away from my wallet</label>
    <label className="check"><input type="checkbox" checked={!!O.remember} onChange={(e) => ACT.rememberTick(e.target.checked)} /> Also keep on this device</label>
    {O.remember && <p className="note-box">Not recommended: both keys on one device.</p>}
  </>;
}

export function OpenBox() {
  const O = S.open, a = S.account;
  if (!O || !a) return null;
  const no = boxNoOf(a);
  if (O.done) return <div className="card">
    <span className="stamp stamp--big stamp--in">OPENED</span>
    <h2 className="section-title">Box No. {no} is open.</h2>
    <div className="row"><button type="button" className="btn btn--primary btn--big" onClick={ACT.firstDeposit}>Deposit</button>{O.tx && <Ext className="link small" href={txUrl(O.tx)}>See on Arc ↗</Ext>}</div>
  </div>;
  const cls = (n: number) => (O.noUsdc ? "step--todo" : O.step === n ? "step--now" : O.step > n ? "step--done" : "step--todo");
  const can4 = O.saved && (O.checked || O.skipped) && !O.sending;
  return <div className="stack">
    <h2 className="section-title">Open your box</h2>
    <p className="muted small">Box <b className="mono">No. {no}</b> · 4 steps</p>
    <ol className="steps">
      <li className="step step--done"><h3 className="step-title">1 · Wallet</h3><p className="small mono">{short(a)}</p>
        {O.noUsdc && <><ErrorLine msg={ERR.noUsdc} /><div className="row"><button type="button" className="btn btn--primary" onClick={ACT.checkAgain}>Check again</button></div></>}</li>
      <li className={`step ${cls(2)}`}><h3 className="step-title">2 · Cut key card</h3>{O.step === 2 && !O.noUsdc && <>
        <button type="button" className="btn btn--primary" disabled={O.cutting} onClick={ACT.cutCard}>{O.cutting ? "Cutting…" : "Cut card"}</button>
        <p className="muted small">Made here. Never uploaded.</p></>}</li>
      <li className={`step ${cls(3)}`}><h3 className="step-title">3 · Save it</h3>{O.step >= 3 && O.card && <SaveCard O={O} c={O.card} />}</li>
      <li className={`step ${O.step >= 3 ? "step--now" : "step--todo"}`}><h3 className="step-title">4 · Open box</h3>{O.step >= 3 && <>
        <button type="button" className="btn btn--primary btn--big" disabled={!can4} onClick={ACT.openBox}>Open box</button>
        {O.sending === "wallet" ? <Status t="Confirm in wallet…" /> : O.sending === "confirming" ? <Status t="Recording on Arc…" /> : null}</>}
        <ErrorLine msg={O.err} dev={O.dev} /></li>
    </ol>
  </div>;
}
