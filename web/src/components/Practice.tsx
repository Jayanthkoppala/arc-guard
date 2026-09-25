// Try Key 2: cut a throwaway key, sign a sample slip, and let Arc's precompile check it (read-only), then tamper.
import { ACT, ERR, S } from "@/lib/store";
import { Details, ErrorLine, Signing } from "./bits";

export function PracticeCard({ inTour }: { inTour: boolean }) {
  const P = S.practice, s = P?.stage ?? "idle";
  const check = s === "genuine" ? <span className="stamp">GENUINE {P!.ms}<small className="stamp-unit"> ms</small></span> : s === "refused" ? <span className="stamp stamp--solid">REFUSED</span>
    : s === "checking" ? <span className="muted small">Checking…</span> : s === "rpcErr" ? <span className="muted small">Not checked</span> : null;
  return <section className="card practice" data-stage={s}>
    <h3 className="card-title">Try Key 2</h3>
    <p className="small">Arc checks a signature live.</p>
    <div className="slip"><p className="slip-line">“Pay {P?.tampered ? <span className="changed">90.00</span> : "10.00"} USDC to 0x12ab…90cd”</p></div>
    {!P ? <button type="button" className="btn btn--primary" onClick={ACT.practiceRun}>Cut a card</button> : <ol className="checklist">
      <li className="checklist-item"><span>Cut card</span>{P.cut ? <span className="stamp">CUT</span> : <span className="muted small">Cutting…</span>}</li>
      {P.cut && (s === "signing"
        ? <li className="checklist-item checklist-item--wide"><span>Sign slip</span><Signing t0={P.t0!} /></li>
        : <li className="checklist-item"><span>Sign slip</span>{P.signed && <span className="stamp">SIGNED {P.signed}<small className="stamp-unit"> s</small></span>}</li>)}
      {P.signed && <li className="checklist-item"><span>Arc check</span>{check}</li>}
    </ol>}
    {s === "genuine" && <button type="button" className="btn" onClick={ACT.tamper}>Change one letter</button>}
    {s === "refused" && <p className="warn">Altered slip refused.</p>}
    {s === "rpcErr" && <>
      <ErrorLine msg={ERR.practiceRpc} />
      <button type="button" className="btn" onClick={P?.tampered ? ACT.tamper : ACT.practiceRun}>Retry</button></>}
    <Details><ul className="bullets">
      {P?.print && <li>Practice card {P.print}. Opens no box.</li>}
      <li>Read-only call to 0x1800…0004: no wallet, no fee, no receipt.</li>
      {P?.localMs !== undefined && <li>Checked on this device: {P.localOk ? "genuine" : "not genuine"} ({P.localMs} ms).</li>}
    </ul></Details>
    {!inTour && <button type="button" className="btn btn--primary" disabled={S.guard !== "ok"} onClick={ACT.connect}>Open a box</button>}
  </section>;
}
