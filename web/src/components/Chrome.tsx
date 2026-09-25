// Top bar, the sticky banner (emergency exit first), and the footer links.
import { useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import { EXPLORER, GUARD, SOURCE_URL, addrUrl } from "@/lib/chain";
import { ACT, ERR, S, bannerBox, countdown, cur, exitOf, f2, hasBox, short, total } from "@/lib/store";
import { SFX } from "@/lib/sound";
import { Alert, Ext } from "./bits";

export function Header() {
  const b = cur(), viewing = S.view === "tour" || S.view === "view";
  return <header className="topbar">
    <div className="brand"><span className="brand-name">Arc Guard</span><span className="brand-sub">SAFE DEPOSIT</span></div>
    <div className="topbar-right">
      {hasBox(b) && (viewing || S.view === "box") && <span className="chip chip--box">{viewing ? `No. ${b.no} · view only` : `Box No. ${b.no}`}</span>}
      {S.account
        ? <span className="chip chip--wallet mono">{short(S.account)}{S.chainId === 5042 ? "" : " · wrong network"}</span>
        : <button type="button" className="chip chip--button chip--connect" disabled={S.connecting} onClick={ACT.connect}>{S.connecting ? "Check wallet…" : "Connect wallet"}</button>}
      <button type="button" className="chip chip--button" aria-pressed={SFX.on} onClick={ACT.sound}>Sound {SFX.on ? "on" : "off"}</button>
    </div>
  </header>;
}

export function Banner() {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => { document.documentElement.style.setProperty("--banner-h", `${ref.current?.offsetHeight ?? 0}px`); });
  const xb = bannerBox(), ex = exitOf(xb);
  let body: ReactNode = null;
  if (xb && ex) {
    body = ex.ready
      ? <><Alert /><p><b>Exit open.</b> {f2(total(xb))} USDC → {short(ex.to)}</p>
          <button type="button" className="btn btn--inverse" disabled={S.payBusy} onClick={() => ACT.payout(xb.owner)}>Pay out</button></>
      : <><Alert /><p><b>Exit pending.</b> <time className="mono" dateTime={new Date(ex.readyAt * 1000).toISOString()}>{countdown(ex.readyAt)}</time> → {short(ex.to)}</p>
          <button type="button" className="btn btn--inverse" onClick={() => ACT.exitCancel(xb.owner)}>Cancel exit</button></>;
  } else if (S.err === "rpc") body = <><Alert /><p>{ERR.rpc}</p><button type="button" className="btn" onClick={ACT.clearErr}>Retry</button></>;
  else if (S.err === "network") body = <><Alert /><p>{S.errText || ERR.wrongNetwork}</p><button type="button" className="btn btn--primary" onClick={ACT.switchArc}>Switch to Arc</button></>;
  else if (S.err === "disconnected") body = <><Alert /><p>{ERR.disconnected}</p><button type="button" className="btn btn--primary" onClick={ACT.reconnect}>Reconnect</button></>;
  else if (S.err === "account") body = <p>{S.errText}</p>;
  return <div ref={ref} className={`banner${xb && ex ? " banner--alert" : ""}`} hidden={!body} role={xb && ex ? "alert" : undefined}>
    {body && <div className="banner-in">{body}</div>}
  </div>;
}

export function Footer() {
  const dot = <span aria-hidden="true">·</span>;
  return <footer className="footer"><p className="footer-links">
    <button type="button" className="link" onClick={ACT.risks}>Risks &amp; disclosure</button>{dot}
    <button type="button" className="link" onClick={ACT.plaque}>How it works</button>{dot}
    <Ext className="link" href={SOURCE_URL}>Code</Ext>{dot}
    <Ext className="link" href={GUARD ? addrUrl(GUARD) : EXPLORER}>Contract</Ext>{dot}
    <button type="button" className="link" onClick={ACT.exitStart}>Lost key card?</button>
  </p></footer>;
}
