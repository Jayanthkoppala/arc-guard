// Beside the cabinet: the pending-exit card (it takes over) and the passbook built from the box's events.
import { TOUR_OWNER, txUrl } from "@/lib/chain";
import { ACT, S, countdown, cur, exitOf, f2, f6, fmtWhen, hasBox, isMine, short, total } from "@/lib/store";
import type { BoxView, Row } from "@/lib/store";
import { Alert, Details, ErrorLine, Status } from "./bits";

export function BoxSide() {
  const b = cur();
  if (!b) return null;
  const viewing = S.view === "view";
  if (b.r && !hasBox(b)) return <div className="stack"><p className="ribbon">VIEW ONLY</p><ErrorLine msg="No box at this address." />
    {TOUR_OWNER && S.guard === "ok" && <button type="button" className="btn btn--primary" onClick={ACT.tour}>Demo box</button>}</div>;
  return <div className="stack">
    {viewing && <p className="ribbon">REAL BOX · VIEW ONLY</p>}
    {exitOf(b) && <ExitCard b={b} />}
    {hasBox(b) && <Ledger b={b} limit={5} />}
  </div>;
}

function ExitCard({ b }: { b: BoxView }) {
  const ex = exitOf(b)!;
  if (ex.ready) return <section className="card card--alert" role="alert">
    <div className="exit-top"><span className="flag"><Alert />EXIT PENDING</span><span className="countdown">OPEN</span></div>
    <h3 className="card-title">Exit open</h3>
    <p className="mono">{f2(total(b))} USDC → {short(ex.to)}</p>
    <button type="button" className="btn btn--danger btn--big" disabled={S.payBusy} onClick={() => ACT.payout(b.owner)}>{S.payBusy ? "Paying out…" : "Pay out"}</button>
    <ErrorLine msg={S.payErr} />
    <button type="button" className="btn" onClick={() => ACT.exitCancel(b.owner)}>Cancel exit</button>
  </section>;
  return <section className="card card--alert" aria-labelledby="exit-title">
    <div className="exit-top"><span className="flag"><Alert />EXIT PENDING</span><time className="countdown" dateTime={new Date(ex.readyAt * 1000).toISOString()}>{countdown(ex.readyAt)}</time></div>
    <h3 className="card-title" id="exit-title">Exit pending</h3>
    <dl className="facts">
      <div><dt>To</dt><dd><span className="mono">{short(ex.to)}</span> {ex.own ? "· holder" : <b>· NOT the holder</b>}</dd></div>
      <div><dt>Opens</dt><dd>{fmtWhen(ex.readyAt * 1000)}</dd></div>
    </dl>
    {!ex.own && <p className="warn">Not you? Cancel now.</p>}
    <button type="button" className="btn btn--danger btn--big" onClick={() => ACT.exitCancel(b.owner)}><Alert />Cancel exit</button>
    <Details label="Why 7 days?"><ul className="bullets">
      <li>A stolen wallet alone can’t empty the box.</li>
      <li>The key card cancels, from any wallet.</li>
      <li>Both keys can still withdraw meanwhile.</li>
      {!isMine(b) && <li>You’re viewing someone else’s box.</li>}
    </ul></Details>
  </section>;
}

function PassbookRow({ r }: { r: Row }) {
  const amt = r.in ? `+${f2(r.in)}` : r.out ? `−${f2(r.out)}` : "";
  return <li><a className={`passbook-row${r.fresh ? " passbook-row--fresh" : ""}`} href={txUrl(r.tx)} target="_blank" rel="noopener"
    aria-label={`${r.d}, ${r.st}, ${r.p}${amt ? `, ${amt} USDC` : ""}${r.bal !== null ? `, balance ${f2(r.bal)} USDC` : ""}. Receipt on Arc.`}>
    <span className="pb-date">{r.d}</span>
    <span className="pb-stamps"><span className={`stamp${r.ink === "red" ? " stamp--solid" : ""}`}>{r.st}</span>{r.st2 && <span className="stamp">{r.st2}</span>}</span>
    <span className="pb-what">{r.p}</span>
    <span className="pb-in mono">{r.in ? `+${f2(r.in)}` : ""}</span>
    <span className="pb-out mono">{r.out ? `−${f2(r.out)}` : ""}</span>
    <span className="pb-bal mono">{r.bal === null ? "" : f2(r.bal)}</span>
  </a></li>;
}

export function Ledger({ b, limit, flat = false }: { b: BoxView; limit: number; flat?: boolean }) {
  const rows = limit ? b.rows.slice(-limit) : b.rows;
  const earned = b.basis !== null && b.r && b.r.shares > 0n ? b.r.savings - b.basis : null;
  return <section className={`passbook${flat ? " passbook--flat" : ""}`}>
    {!flat && <div className="passbook-head"><h3 className="card-title">Passbook</h3>
      {limit > 0 && b.rows.length > limit && <button type="button" className="link small" onClick={() => ACT.passbook(b.owner)}>All {b.rows.length}</button>}</div>}
    {!b.pbDone && <Status t={b.rows.length ? "Loading older entries…" : "Loading entries…"} />}
    {b.pbErr && <p className="error"><Alert />Couldn’t load entries. <button type="button" className="link" onClick={() => ACT.retryLogs(b.owner)}>Retry</button></p>}
    <div className="passbook-cols" aria-hidden="true"><span>DATE</span><span>ENTRY</span><span>IN</span><span>OUT</span><span>BAL.</span></div>
    <ol className="passbook-rows">{rows.map((r) => <PassbookRow key={r.tx + r.st} r={r} />)}</ol>
    {earned !== null && earned > 0n && <p className="passbook-interest">Interest <span className="mono">+{f6(earned)}</span> · calculated</p>}
  </section>;
}
