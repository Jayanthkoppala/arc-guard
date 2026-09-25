// Emergency exit: start it with the wallet alone, or cancel it with the key card from any wallet.
import { txUrl } from "@/lib/chain";
import { ACT, chainNow, closeSheet, ERR, f2, fmtWhen, own, patch, S, short, total } from "@/lib/store";
import type { CancelSheet, ExitStartSheet } from "@/lib/store";
import { Alert, Details, ErrorLine, Ext, Status } from "./bits";
import { KeyLoader } from "./Withdraw";

export function ExitStart({ E }: { E: ExitStartSheet }) {
  const b = own();
  if (!b) return null;
  if (E.phase !== "explain") return <>
    <div className="confirm"><h3 className="card-title">Start the exit?</h3>
      <p className="mono">{f2(total(b))} USDC → {short(E.toAddr!)}</p>
      <p className="small">Opens {fmtWhen((chainNow() + 7 * 86400) * 1000)}</p></div>
    <ErrorLine msg={E.err} dev={E.dev} />
    {E.phase === "wallet" ? <Status t="Confirm in wallet…" /> : E.phase === "confirming" ? <Status t="Recording on Arc…" />
      : <div className="row"><button type="button" className="btn btn--danger btn--big" onClick={ACT.exitYes}><Alert />Start exit</button><button type="button" className="btn btn--big" onClick={ACT.exitBack}>Back</button></div>}
  </>;
  return <>
    <p className="muted small">Your wallet starts a 7-day exit.</p>
    <fieldset className="choices"><legend className="field-label">Pay to</legend>
      <label className="choice"><input type="radio" name="exto" checked={E.to === "self"} onChange={() => ACT.exTo("self")} />This wallet</label>
      <label className="choice"><input type="radio" name="exto" checked={E.to === "other"} onChange={() => ACT.exTo("other")} />Other address</label>
    </fieldset>
    {E.to === "other" && <>
      <input className="input mono" placeholder="0x…" aria-label="Payout address" value={E.other} onChange={(e) => patch(E, { other: e.target.value, err: null })} />
      <p className="warn small">Check it. Can’t be undone.</p></>}
    <ErrorLine msg={E.err} />
    <button type="button" className="btn btn--danger btn--big" disabled={E.checking} onClick={ACT.exitGo}><Alert />Start exit</button>
    <Details label="Why 7 days?"><ul className="bullets">
      <li>A stolen wallet alone can’t empty the box.</li>
      <li>Your key card can cancel it meanwhile.</li>
      <li>After payout, save with a new wallet.</li>
    </ul></Details>
    <p className="small"><button type="button" className="link" onClick={ACT.withdraw}>Have your card? Withdraw</button></p>
  </>;
}

export function ExitCancel({ C }: { C: CancelSheet }) {
  const b = S.boxes[C.owner];
  if (!b) return null;
  if (C.done) return <>
    <div className="slip slip--stamped"><div className="slip-head"><span>EMERGENCY EXIT</span><span>BOX No. {b.no}</span></div><p className="slip-line">By key card</p><span className="stamp stamp--big stamp--in">CANCELLED</span></div>
    <p className="ok">Exit cancelled.</p>
    <div className="row">{C.tx && <Ext className="btn" href={txUrl(C.tx)}>See on Arc ↗</Ext>}<button type="button" className="btn btn--primary" onClick={closeSheet}>Done</button></div>
  </>;
  const signed = C.k2 === "signed";
  return <>
    <p className="muted small">Key card signs. Any wallet sends.</p>
    <div className={`keyplate${signed ? " keyplate--on" : ""}`}><h3 className="keyplate-title"><span className="mini-key mini-key--2"><i /></span>Key 2 · Key card</h3><KeyLoader K={C} b={b} /></div>
    {C.send === "rejected" && <ErrorLine msg={ERR.rejected} />}
    <ErrorLine msg={C.sendErr} dev={C.dev} />
    {C.send === "wallet" ? <Status t="Confirm in wallet…" /> : C.send === "confirming" ? <Status t={C.slow ? "Still waiting on Arc…" : "Arc is checking…"} />
      : <button type="button" className="btn btn--danger btn--big" disabled={!signed} onClick={ACT.cancelSend}><Alert />Cancel exit</button>}
  </>;
}
