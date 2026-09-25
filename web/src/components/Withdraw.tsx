// Withdraw: slip → keys → receipt. The key loader is shared with the cancel-exit sheet.
import { useRef } from "react";
import { txUrl } from "@/lib/chain";
import { ACT, amtEcho, closeSheet, cur, ERR, f2, feeUsdc, patch, S, savedCard, short, total } from "@/lib/store";
import type { BoxView, KeySheet, WithdrawSheet } from "@/lib/store";
import { AmountField, Details, ErrorLine, Ext, Signing, Status } from "./bits";

export function KeyLoader({ K, b }: { K: KeySheet; b: BoxView }) {
  const file = useRef<HTMLInputElement>(null);
  const fits = <p className="ok small">Card fits · {K.print}</p>;
  if (K.k2 === "checking") return <Status t="Checking key card…" />;
  if (K.k2 === "signing") return <>{fits}{K.kerr && <p className="small">{K.kerr}</p>}<Signing t0={K.signT0!} />
    <button type="button" className="link small" onClick={ACT.signCancel}>Cancel</button></>;
  if (K.k2 === "loaded") return <>{fits}<ErrorLine msg={K.kerr} /><button type="button" className="btn" onClick={ACT.signAgain}>Sign</button></>;
  if (K.k2 === "signed") return <div className="signed"><span className="stamp">PQ SIGNED</span><p className="muted small">Signed in {K.signSecs} s. Not sent yet.</p></div>;
  if (K.k2 === "typing") return <>
    <label className="field"><span className="field-label">Card code</span><textarea className="input input--code mono" placeholder="12 groups of 8" value={K.code ?? ""}
      onChange={(e) => patch(K, { code: e.target.value, kerr: null })} /></label>
    <div className="row"><button type="button" className="btn" onClick={ACT.loadTyped}>Load</button><button type="button" className="link small" onClick={ACT.pickCancel}>Cancel</button></div>
    <ErrorLine msg={K.kerr} /></>;
  return <>
    <div className="dropzone" onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("dropzone--over"); }} onDragLeave={(e) => e.currentTarget.classList.remove("dropzone--over")}
      onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("dropzone--over"); const f = e.dataTransfer.files[0]; if (f) void ACT.loadFile(f); }}>
      <p className="muted small">Drop key card here</p>
      <div className="row">
        <button type="button" className="btn" onClick={() => file.current?.click()}>Choose file</button>
        <button type="button" className="btn" onClick={ACT.typeCode}>Type code</button>
        {savedCard(b.owner) && <button type="button" className="btn" onClick={ACT.useSaved}>Use saved</button>}
      </div>
    </div>
    <input ref={file} type="file" hidden accept=".json,application/json,text/plain" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void ACT.loadFile(f); }} />
    <ErrorLine msg={K.kerr} />
  </>;
}

export function Withdraw({ W }: { W: WithdrawSheet }) {
  const b = cur()!, r = b.r!, A = amtEcho(W.amount), from = W.from === "locker" ? "Locker" : "Savings";
  const to = W.toAddr ?? (W.to === "self" ? b.owner : W.other.trim());
  const slip = (stamped: boolean) => <div className={`slip${stamped ? " slip--stamped" : ""}`}><div className="slip-head"><span>WITHDRAWAL SLIP</span><span>BOX No. {b.no}</span></div>
    <p className="slip-line">{stamped ? f2(W.value!) : A} USDC · {from}<br />→ {to.length > 12 ? short(to) : to}</p>
    {stamped ? <><span className="stamp stamp--k2">KEY 2 OK</span><span className="stamp stamp--big stamp--in">WITHDRAWN</span></>
      : W.step === "keys" && !W.busy && W.k2 !== "signing" && W.k2 !== "checking" ? <button type="button" className="link small slip-change" onClick={ACT.wdChange}>Change</button> : null}</div>;
  if (W.step === "slip") {
    const max = W.from === "locker" ? r.locker : r.savings;
    return <>
      <p className="muted small">Needs both keys.</p>
      <fieldset className="choices"><legend className="field-label">From</legend>
        <label className="choice"><input type="radio" name="from" checked={W.from === "locker"} onChange={() => patch(W, { from: "locker", err: null })} />Locker · {f2(r.locker)}</label>
        <label className="choice"><input type="radio" name="from" checked={W.from === "savings"} disabled={!r.savings} onChange={() => patch(W, { from: "savings", err: null })} />Savings · {f2(r.savings)}</label>
      </fieldset>
      <AmountField value={W.amount} onChange={(v) => patch(W, { amount: v, err: null })} />
      <div className="field-meta"><span>Max <span className="mono">{f2(max)}</span></span><button type="button" className="link small" onClick={ACT.wdMax}>Max</button></div>
      <fieldset className="choices"><legend className="field-label">To</legend>
        <label className="choice"><input type="radio" name="to" checked={W.to === "self"} onChange={() => patch(W, { to: "self", err: null })} />My wallet</label>
        <label className="choice"><input type="radio" name="to" checked={W.to === "other"} onChange={() => patch(W, { to: "other", err: null })} />Other address</label>
      </fieldset>
      {W.to === "other" && <>
        <input className="input mono" placeholder="0x…" aria-label="Recipient address" value={W.other} onChange={(e) => patch(W, { other: e.target.value, err: null })} />
        <label className="check"><input type="checkbox" checked={W.otherOk} onChange={(e) => patch(W, { otherOk: e.target.checked })} /> Checked every character</label></>}
      <ErrorLine msg={W.err} />
      <button type="button" className="btn btn--primary btn--big" disabled={W.checking} onClick={ACT.wdNext}>{W.checking ? "Checking…" : "Next"}</button>
      <Details><ul className="bullets"><li>Fee ≈ 0.01 USDC, paid to Arc.</li><li>The card signs this exact slip.</li><li>Valid 15 minutes, single use.</li><li>Wrong addresses can’t be reversed.</li></ul></Details>
    </>;
  }
  if (W.step === "done") return <>
    {slip(true)}
    <h3 className="card-title">Both keys turned.</h3>
    <p className="mono">{f2(W.value!)} USDC → {short(W.toAddr!)}</p>
    <p className="muted small">Left <b className="mono">{f2(total(b))}</b> USDC</p>
    <div className="row"><Ext id="receipt-link" className="btn btn--primary" href={txUrl(W.tx!)}>See on Arc ↗</Ext><button type="button" className="btn" onClick={closeSheet}>Done</button></div>
    <details className="dev"><summary>Details for developers</summary><dl className="facts mono small">
      <div><dt>function</dt><dd>withdraw</dd></div>
      <div><dt>receipt</dt><dd>{short(W.tx!)}</dd></div>
      <div><dt>gas used</dt><dd>{W.gasUsed!.toLocaleString("en-US")}</dd></div>
      <div><dt>fee</dt><dd>{feeUsdc(W.fee!)} USDC</dd></div>
      <div><dt>signature</dt><dd>SLH-DSA-SHA2-128s · {((W.sig!.length - 2) / 2).toLocaleString("en-US")} B</dd></div>
      <div><dt>checker</dt><dd>0x1800…0004</dd></div>
      <div><dt>blocked list</dt><dd>USDC isBlacklisted</dd></div>
      <div><dt>block</dt><dd>{W.block!.toLocaleString("en-US")}</dd></div>
    </dl></details>
  </>;
  const signed = W.k2 === "signed";
  return <>
    {slip(false)}
    <div className="keyplates">
      <div className={`keyplate${S.sock.i1 ? " keyplate--on" : ""}${S.sock.turned ? " keyplate--turned" : ""}`}><h3 className="keyplate-title"><span className="mini-key"><i /></span>Key 1 · Wallet</h3>
        <p className="small mono">{S.account ? short(S.account) : "Not connected"}</p></div>
      <div className={`keyplate${signed ? " keyplate--on" : ""}${S.sock.turned ? " keyplate--turned" : ""}`}><h3 className="keyplate-title"><span className="mini-key mini-key--2"><i /></span>Key 2 · Key card</h3><KeyLoader K={W} b={b} /></div>
    </div>
    {W.send === "rejected" && <ErrorLine msg={ERR.rejected} />}
    <ErrorLine msg={W.sendErr} dev={W.dev} />
    {W.send === "wallet" ? <Status t="Confirm in wallet…" />
      : W.send === "confirming" ? <Status t={W.slow ? "Still waiting on Arc…" : "Arc is checking…"} />
      : W.send === "turning" ? <Status t="Keys turning…" />
      : <button type="button" className="btn btn--primary btn--big" disabled={!signed} onClick={ACT.turnKeys}>Turn both keys</button>}
    {!signed && !W.busy && <p className="small"><button type="button" className="link" onClick={ACT.exitStart}>Lost key card?</button></p>}
  </>;
}
