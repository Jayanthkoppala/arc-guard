// The counter window: one sheet at a time (deposit, move, withdraw, exit, passbook, info).
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { txUrl } from "@/lib/chain";
import { ACT, amtEcho, closeSheet, cur, f2, patch, S } from "@/lib/store";
import type { DepositSheet, MoveSheet, NoticeSheet, Sheet } from "@/lib/store";
import { AmountField, Details, ErrorLine, Ext, RISK, RiskBlock, Status } from "./bits";
import { Ledger } from "./BoxSide";
import { ExitCancel, ExitStart } from "./Exit";
import { Withdraw } from "./Withdraw";

export function SheetView() {
  const title = useRef<HTMLHeadingElement>(null), key = S.sheetKey;
  useEffect(() => {
    if (!S.sheet) return;
    const receipt = document.getElementById("receipt-link");
    if (receipt) receipt.focus({ preventScroll: true }); else title.current?.focus({ preventScroll: true });
    document.querySelector(".sheet-body")?.scrollTo({ top: 0 });
  }, [key]);
  const sh = S.sheet;
  if (!sh) return null;
  const { title: t, body } = sheetContent(sh), busy = "busy" in sh && !!sh.busy;
  return <aside key={S.sheetKey} className="sheet" role="dialog" aria-labelledby="sheet-title">
    <div className="sheet-card">
      <div className="sheet-head"><h2 id="sheet-title" className="card-title" ref={title} tabIndex={-1}>{t}</h2>
        <button type="button" className="close" aria-label="Close" disabled={busy} onClick={closeSheet}>×</button></div>
      <div className="sheet-body">{body}</div>
    </div>
  </aside>;
}

function sheetContent(sh: Sheet): { title: string; body: ReactNode } {
  switch (sh.type) {
    case "deposit": return { title: "Deposit", body: <Deposit d={sh} /> };
    case "move": return { title: "Move", body: <Move m={sh} /> };
    case "withdraw": return { title: "Withdraw", body: <Withdraw W={sh} /> };
    case "exitStart": return { title: "Lost key card?", body: <ExitStart E={sh} /> };
    case "exitCancel": return { title: "Cancel exit", body: <ExitCancel C={sh} /> };
    case "notice": return { title: sh.title, body: <Notice n={sh} /> };
    case "passbook": { const b = S.boxes[sh.owner]; return { title: `Passbook · No. ${b?.no ?? ""}`, body: b ? <Ledger b={b} limit={0} flat /> : null }; }
    case "plaque": return { title: "How it works", body: <HowItWorks /> };
    case "risks": return { title: "Risks & disclosure", body: <Risks /> };
  }
}


function Deposit({ d }: { d: DepositSheet }) {
  const b = cur()!, A = amtEcho(d.amount), locked = d.phase !== "amount";
  const done = d.phase === "done" || d.phase === "chWait" || d.phase === "chConf" || d.phase === "chLocker" || d.phase === "chSavings";
  const slip = <div className={`slip${done ? " slip--stamped" : ""}`}><div className="slip-head"><span>DEPOSIT SLIP</span><span>BOX No. {b.no}</span></div>
    {done ? <><p className="slip-line">{A} USDC → Locker</p><span className="stamp stamp--big stamp--in">DEPOSITED</span></> : <>
      <AmountField value={d.amount} locked={locked} onChange={(v) => patch(d, { amount: v, err: null })} />
      <div className="field-meta"><span>Wallet <span className="mono">{S.walletBal === null ? "…" : f2(S.walletBal)}</span></span>{!locked && <button type="button" className="link small" onClick={ACT.depMax}>Max</button>}</div></>}</div>;
  if (!done) {
    const s1 = d.phase === "amount" || d.phase === "s1wait" || d.phase === "s1conf";
    return <>
      <p className="muted small">Lands in your Locker first.</p>
      {slip}
      <ErrorLine msg={d.err} dev={d.dev} />
      <ol className="substeps">
        <li className={`substep${s1 ? "" : " substep--done"}`}><p>1 · Allow <b className="mono">{A}</b></p>
          {d.phase === "amount" ? <button type="button" className="btn btn--primary btn--big" onClick={ACT.depApprove}>Allow</button>
            : d.phase === "s1wait" ? <Status t="Confirm in wallet…" /> : d.phase === "s1conf" ? <Status t="Recording on Arc…" />
            : <p className="ok small">{d.skip1 ? "Already allowed." : "Allowed."}</p>}</li>
        <li className={`substep${s1 ? " substep--todo" : ""}`}><p>2 · Deposit <b className="mono">{A}</b></p>
          {d.phase === "s2" ? <button type="button" className="btn btn--primary btn--big" onClick={ACT.depDeposit}>Deposit</button>
            : d.phase === "s2wait" ? <Status t="Confirm in wallet…" /> : d.phase === "s2conf" ? <Status t="Recording on Arc…" /> : null}</li>
      </ol>
      <Details><p className="small">Permission covers this exact amount only. Keep about 0.05 USDC for fees.</p></Details>
    </>;
  }
  const back = <button type="button" className="btn btn--primary btn--big" onClick={closeSheet}>Done</button>;
  const tail = d.phase === "chLocker" ? <><p className="ok">Kept in Locker.</p>{back}</>
    : d.phase === "chSavings" ? <><p className="ok">Earning in Savings.</p>{back}</>
    : <div className="choose">
      <h3 className="card-title">Locker or Savings?</h3>
      <div className="choose-cards">
        <section className="choose-card"><h4>Locker</h4><p className="small">No interest.</p><button type="button" className="btn" disabled={d.busy} onClick={ACT.keepLocker}>Keep</button></section>
        <section className="choose-card choose-card--savings"><h4>Savings</h4><RiskBlock /><button type="button" className="btn btn--primary" disabled={d.busy} onClick={ACT.toSavings}>Move to Savings</button></section>
      </div>
      {d.phase === "chWait" ? <Status t="Confirm in wallet…" /> : d.phase === "chConf" ? <Status t="Moving to Savings…" /> : null}
      <ErrorLine msg={d.err2} dev={d.dev} />
      <Details label="About Savings"><ul className="bullets">
        <li>Galaxy USDC vault on Morpho, run by a third party.</li>
        <li>Borrowers pay the interest.</li>
        <li>Losses or withdrawal delays are possible.</li>
        <li>Change your mind anytime.</li>
      </ul></Details>
    </div>;
  return <>{slip}<p className="ok">Deposited {A} USDC.</p>{tail}</>;
}

function Move({ m }: { m: MoveSheet }) {
  const r = cur()!.r!, A = amtEcho(m.amount), toS = m.dir === "toSavings", lock = !!m.busy || !!m.done;
  return <>
    <p className="muted small">No key card needed.</p>
    <div className="seg" role="radiogroup" aria-label="Direction">
      <label><input type="radio" name="dir" checked={toS} disabled={lock} onChange={() => ACT.moveDir("toSavings")} />Locker → Savings</label>
      <label><input type="radio" name="dir" checked={!toS} disabled={lock} onChange={() => ACT.moveDir("toLocker")} />Savings → Locker</label>
    </div>
    <AmountField value={m.amount} locked={lock} onChange={(v) => patch(m, { amount: v, err: null })} />
    <div className="field-meta"><span>{toS ? "Locker" : "Savings"} <span className="mono">{f2(toS ? r.locker : r.savings)}</span></span>{!lock && <button type="button" className="link small" onClick={ACT.moveMax}>Max</button>}</div>
    {toS && <p className="risk small">{RISK}</p>}
    <ErrorLine msg={m.err} dev={m.dev} />
    {m.done
      ? <><p className="ok">Moved {f2(m.moved!)} USDC.</p><button type="button" className="btn btn--primary btn--big" onClick={closeSheet}>Done</button></>
      : <><button type="button" className="btn btn--primary btn--big" disabled={!!m.busy} onClick={ACT.moveGo}>Move {A}</button>
        {m.busy === "wallet" ? <Status t="Confirm in wallet…" /> : m.busy === "confirming" ? <Status t="Moving…" /> : null}</>}
  </>;
}

function Notice({ n }: { n: NoticeSheet }) {
  const b = cur();
  return <>
    <div className="slip slip--stamped"><div className="slip-head"><span>{n.head}</span><span>BOX No. {b?.no}</span></div><p className="slip-line">{n.line}</p>
      <span className={`stamp stamp--big stamp--in${n.ink === "red" ? " stamp--solid" : ""}`}>{n.stamp}</span></div>
    <p className="ok">{n.text}</p>
    <div className="row">{n.tx && <Ext className="btn" href={txUrl(n.tx)}>See on Arc ↗</Ext>}<button type="button" className="btn btn--primary" onClick={closeSheet}>Done</button></div>
  </>;
}

const HowItWorks = () => <ul className="bullets">
  <li><b>Key 1:</b> your wallet.</li>
  <li><b>Key 2:</b> a key card signing with SLH-DSA (NIST FIPS 205), built to resist quantum computers.</li>
  <li>Arc checks Key 2 itself, every time money leaves.</li>
  <li>Wallet alone: only a 7-day exit, which the card can cancel.</li>
  <li>Both keys stolen: everything is at risk.</li>
  <li>New software; Savings adds Morpho lending risk.</li>
  <li>Open source.</li>
</ul>;

const Risks = () => <ul className="bullets">
  <li>Open-source software (MIT), not a bank.</li>
  <li>Non-custodial: only your two keys move funds. We hold no key.</li>
  <li>Not insured. Not approved, endorsed or run by Circle.</li>
  <li>Savings: Galaxy USDC vault on Morpho, run by third parties. Lending carries risk.</li>
  <li>New, unaudited contract. A bug could lose funds.</li>
  <li>Wallet + key card together can take everything.</li>
  <li>Deposit only what you can afford to lose.</li>
</ul>;
