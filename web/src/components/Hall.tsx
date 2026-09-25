"use client";
// The hall: every Arc Guard box and the total USDC held, read straight from Arc.
import { useEffect, useState } from "react";
import { GUARD, addrUrl, readHall, type Hall as HallData } from "@/lib/chain";
import { boxNoOf } from "@/lib/card";
import { f2, short } from "@/lib/store";

export default function Hall() {
  const [hall, setHall] = useState<HallData | null>(null);
  const [found, setFound] = useState(0);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!GUARD) return;
    let live = true;
    const load = () => readHall(GUARD!, (n) => live && setFound(n)).then((h) => live && setHall(h)).catch(() => live && setErr(true));
    load();
    const t = setInterval(load, 30_000);
    return () => { live = false; clearInterval(t); };
  }, []);

  const total = hall ? hall.lockerTotal + hall.savingsTotal : 0n;
  return <main className="hall">
    <header className="topbar">
      <a className="brand" href="/"><span className="brand-name">Arc Guard</span><span className="brand-sub">THE HALL</span></a>
      <div className="topbar-right"><a className="chip chip--button chip--connect" href="/">Open my box</a></div>
    </header>

    <section className="hall-wrap">
      <h1 className="hall-title">All boxes</h1>

      {!GUARD ? <p>Not deployed on Arc yet.</p> : err ? <p>Can&apos;t reach Arc. Try again.</p> : <>
        <div className="hall-stats">
          <div className="card stat"><span className="label">Total held</span><b className="stat-num">{hall ? f2(total) : "…"}</b><span className="small">USDC</span></div>
          <div className="card stat"><span className="label">In Lockers</span><b className="stat-num">{hall ? f2(hall.lockerTotal) : "…"}</b><span className="small">USDC</span></div>
          <div className="card stat"><span className="label">In Savings</span><b className="stat-num">{hall ? f2(hall.savingsTotal) : "…"}</b><span className="small">USDC · Morpho</span></div>
          <div className="card stat"><span className="label">Boxes</span><b className="stat-num">{hall ? hall.boxes.length : found || "…"}</b><span className="small">opened</span></div>
        </div>

        <h2 className="hall-sub">Boxes <span>{hall ? hall.boxes.length : "…"}</span></h2>
        <div className="hall-grid">
          {hall?.boxes.map((b) => {
            const sum = b.locker + b.savings, lockPct = sum ? Number((b.locker * 1000n) / sum) / 10 : 0;
            return <a key={b.owner} className="hall-box" href={`/box?owner=${b.owner}`}>
              <div className="hall-box-top">
                <span className="hall-plate">No. {boxNoOf(b.owner)}</span>
                <span className="hall-holes" aria-hidden="true"><i /><i /></span>
              </div>
              <div className="hall-box-body">
                <b className="hall-amt">{f2(sum)} <small>USDC</small></b>
                <div className="hall-split" aria-hidden="true"><span style={{ width: `${lockPct}%` }} /></div>
                <div className="hall-legend">
                  <span><i className="dot dot--lock" />Locker <b>{f2(b.locker)}</b></span>
                  <span><i className="dot dot--save" />Savings <b>{f2(b.savings)}</b></span>
                </div>
                <div className="hall-foot"><span className="mono">{short(b.owner)}</span><span className="hall-view">View →</span></div>
                {b.exitPending && <span className="hall-flag">EXIT PENDING</span>}
              </div>
            </a>;
          })}
        </div>
        {hall && <p className="small">Live from Arc · block {hall.head.toLocaleString()} · <a className="link" href={addrUrl(GUARD)} target="_blank" rel="noreferrer">contract</a></p>}
      </>}
    </section>
  </main>;
}
