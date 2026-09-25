// Under the cabinet: the three actions, the total, and the Locker and Savings compartments with the live heartbeat.
import { ACT, S, YEAR, cur, exitOf, f2, f6, hasBox, short, sig2, total } from "@/lib/store";
import { Alert, Heartbeat, RISK, Status, rateText } from "./bits";

export function BoxPanel() {
  const b = cur();
  if ((S.view !== "box" && S.view !== "tour" && S.view !== "view") || !b) return <div className="box-panel" />;
  if (!b.r) return <div className="box-panel"><Status t="Reading the box…" /><Heartbeat /></div>;
  if (!hasBox(b)) return <div className="box-panel"><p className="box-total">No box here.</p><Heartbeat /></div>;
  const r = b.r, viewing = S.view !== "box", tot = total(b), ex = !!exitOf(b) && !viewing;
  const earned = b.basis !== null && r.shares > 0n ? r.savings - b.basis : null;
  const mins = S.apy && r.savings ? Math.round((1e-6 * YEAR) / 60 / ((Number(r.savings) / 1e6) * (S.apy / 100))) : null;
  return <div className="box-panel">
    <div className={`box-actions${viewing ? "" : " box-actions--dock"}${ex ? " box-actions--x4" : ""}`}>
      {ex && <button type="button" className="btn btn--danger" onClick={() => ACT.exitCancel(b.owner)}><Alert />Cancel exit</button>}
      <button type="button" className="btn btn--primary" disabled={viewing} aria-describedby={viewing ? "view-only" : undefined} onClick={ACT.deposit}>Deposit</button>
      <button type="button" className="btn btn--primary" disabled={viewing || !tot} onClick={ACT.move}>Move</button>
      <button type="button" className="btn btn--primary" disabled={viewing || !tot} onClick={ACT.withdraw}>Withdraw</button>
    </div>
    {viewing && <p className="box-note" id="view-only">View only.</p>}
    <p className="box-total"><b className="amount">{f2(tot)}</b> USDC{viewing && <> · holder <span className="mono">{short(b.owner)}</span></>}{!tot && " · empty"}</p>
    <div className="compartments">
      <section className="compartment"><h3 className="compartment-title">Locker <span className="amount">{f2(r.locker)}</span></h3></section>
      <section className="compartment compartment--savings">
        <h3 className="compartment-title">Savings <span className="amount" aria-label="Savings balance, updating as it earns">{f2(r.savings)}</span></h3>
        <p className="rate small">{rateText()}</p>
        {earned !== null && earned >= -2n && <p className="earned small"><span className="mono">+{f6(earned > 0n ? earned : 0n)}</span> earned{" "}
          <button type="button" className="q" aria-expanded={S.why} aria-label="Why isn't it moving?" onClick={ACT.why}>?</button></p>}
        {earned !== null && earned < -2n && <p className="warn small"><Alert />Worth {f6(r.savings)}, below {f6(b.basis!)} moved in.</p>}
        {S.why && mins !== null && <p className="why small">+0.000001 about every {mins.toLocaleString("en-US")} min at {sig2(S.apy!)}%. Shown as Arc reports it.</p>}
        <p className="risk small">{RISK}</p>
        <Heartbeat />
      </section>
    </div>
    {!viewing && <p className="box-minor"><button type="button" className="link" onClick={ACT.exitStart}>Lost key card?</button></p>}
  </div>;
}
