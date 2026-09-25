// See a real box: the builder's box, read-only, in four stops.
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { SOURCE_URL, txUrl } from "@/lib/chain";
import { ACT, S, cur, f2, hasBox, short, tourWithdrawal } from "@/lib/store";
import type { BoxView } from "@/lib/store";
import { Details, ErrorLine, Ext, Status } from "./bits";
import { Ledger } from "./BoxSide";
import { PracticeCard } from "./Practice";

export function Tour() {
  const st = S.tourStep, b = cur();
  const rail = ["Box", "Two keys", "Passbook", "Lost card"].map((n, i) =>
    <li key={n}><button type="button" className="rail-step" aria-current={st === i + 1 ? "step" : undefined} onClick={() => ACT.tourStep(i + 1)}><span className="rail-num">{i + 1}</span>{n}</button></li>);
  let body: ReactNode;
  if (!b?.r) body = <Status t="Reading the box…" />;
  else if (!hasBox(b)) body = <><ErrorLine msg="Demo box isn't open yet." /><PracticeCard inTour /></>;
  else if (st === 1) body = <><p className="lead">The builder’s box, live.</p><Ledger b={b} limit={3} /><button type="button" className="btn btn--primary btn--big" onClick={() => ACT.tourStep(2)}>Next</button></>;
  else if (st === 2) body = <><Replay b={b} /><PracticeCard inTour /></>;
  else if (st === 3) body = <><Ledger b={b} limit={0} /><button type="button" className="btn btn--primary btn--big" onClick={() => ACT.tourStep(4)}>Next</button></>;
  else body = <LostCard b={b} />;
  return <div className="stack"><p className="ribbon">REAL BOX · VIEW ONLY</p><ol className="rail">{rail}</ol>{body}</div>;
}

function Replay({ b }: { b: BoxView }) {
  const row = tourWithdrawal(), R = S.replay, done = R?.stage === "done";
  const link = useRef<HTMLAnchorElement>(null);
  useEffect(() => { if (done) link.current?.focus({ preventScroll: true }); }, [done]);
  if (!row?.wd) return <section className="card"><h3 className="card-title">A real withdrawal</h3><p className="muted small">None on record yet.</p></section>;
  const amt = f2(row.out), from = row.wd.locker && row.wd.savings ? "Locker + Savings" : row.wd.locker ? "Locker" : "Savings";
  const caps = [`Slip: ${amt} USDC out`, "Key 2 signs", "Key 1 sends", "Arc checks both"];
  return <section className="card">
    <h3 className="card-title">A real withdrawal</h3>
    <div className={`slip${done ? " slip--stamped" : ""}`}><div className="slip-head"><span>WITHDRAWAL SLIP</span><span>BOX No. {b.no}</span></div>
      <p className="slip-line">{amt} USDC · {from}<br />→ {short(row.wd.to)}</p>
      {done && <><span className="stamp stamp--k2">KEY 2 OK</span><span className="stamp stamp--big stamp--in">WITHDRAWN</span></>}</div>
    <ol className="captions">{caps.map((c, i) => <li key={c} className={`caption${(R?.cap ?? 0) > i ? " caption--on" : ""}`}>{c}</li>)}</ol>
    {done ? <>
      <p className="muted small">{new Date(row.ts * 1000).toISOString().slice(0, 16).replace("T", " ")} UTC{R?.fee ? ` · fee ${R.fee}` : ""}</p>
      <div className="row"><a ref={link} className="btn btn--primary" href={txUrl(row.tx)} target="_blank" rel="noopener">See on Arc ↗</a><button type="button" className="btn" onClick={ACT.replay}>Replay</button></div>
      <Details label="What Arc checked"><ul className="bullets"><li>Recipient not on the USDC blocked list</li><li>7,856-byte key-card signature, by Arc’s checker</li><li>Fee paid in USDC</li></ul></Details>
    </> : <button type="button" className="btn btn--primary" disabled={R?.stage === "playing"} onClick={ACT.replay}>{R?.stage === "playing" ? "Replaying…" : "Watch it"}</button>}
  </section>;
}

function LostCard({ b }: { b: BoxView }) {
  const last = (st: string) => [...b.rows].reverse().find((r) => r.st === st);
  const started = last("EXIT STARTED"), cancelled = last("CANCELLED");
  return <>
    <section className="card">
      <h3 className="card-title">Lost your card?</h3>
      <p className="small">A 7-day exit. The card can cancel it.</p>
      {(started || cancelled) && <p className="small">{started && <Ext className="link" href={txUrl(started.tx)}>EXIT STARTED ↗</Ext>}{started && cancelled && " · "}{cancelled && <Ext className="link" href={txUrl(cancelled.tx)}>CANCELLED ↗</Ext>}</p>}
      <Details label="Why 7 days?"><p className="small">So a stolen wallet alone can’t empty the box.</p></Details>
    </section>
    <section className="card">
      <h3 className="card-title">Uses on Arc</h3>
      <ul className="bullets"><li>USDC gas</li><li>PQ checker <span className="mono">0x1800…0004</span></li><li>USDC blocked list</li><li>Sub-second finality</li><li>Morpho vault</li></ul>
      <div className="row"><button type="button" className="btn btn--primary" onClick={ACT.connect}>Open a box</button><Ext className="btn" href={SOURCE_URL}>Code ↗</Ext></div>
    </section>
  </>;
}
