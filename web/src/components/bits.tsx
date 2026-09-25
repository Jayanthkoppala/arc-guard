// Small shared pieces: icon, status and error lines, links, disclosures, the heartbeat and the signing bar.
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { HB, S, isPhone, sig2 } from "@/lib/store";

export const Alert = () => (
  <svg className="icon" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M10 2.5 18.5 17.5h-17z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M10 8v4.2M10 14.4v.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export const Status = ({ t }: { t: string }) => <p className="status">{t}</p>;

export function ErrorLine({ msg, dev }: { msg?: string | null; dev?: string }) {
  if (!msg) return null;
  return <>
    <p className="error" role="alert"><Alert />{msg}</p>
    {dev && <details className="dev"><summary>Details for developers</summary><p className="mono small">{dev}</p></details>}
  </>;
}

export const Ext = ({ href, className, children, id }: { href: string; className?: string; children: ReactNode; id?: string }) =>
  <a id={id} className={className} href={href} target="_blank" rel="noopener">{children}</a>;

export const Details = ({ label = "Details", children }: { label?: string; children: ReactNode }) =>
  <details className="details"><summary>{label}</summary>{children}</details>;

export const RISK = "Lends via Morpho. Small extra risk.";
export const rateText = () => (S.apy !== null ? `${sig2(S.apy)}%/yr · Morpho` : S.apyErr ? "Rate unavailable · Morpho" : "Reading rate…");
export const RiskBlock = () => <><p className="rate small">{rateText()}</p><p className="risk small">{RISK}</p></>;

export function Heartbeat() {
  if (!HB.at) return <p className="heartbeat"><i className="heartbeat-dot" aria-hidden="true" />Checking with Arc…</p>;
  const s = Math.max(0, Math.floor((S.now - HB.at) / 1000));
  return <p className={`heartbeat${s > 30 ? " heartbeat--stale" : ""}`}><i key={HB.n} className="heartbeat-dot heartbeat-dot--pulse" aria-hidden="true" />
    Checked with Arc {s} s ago · block {HB.block.toLocaleString("en-US")}</p>;
}

const signMsg = (t: number) => t >= 20 ? "Slow. Wait or cancel." : t >= 8 ? "Nearly there." : t >= 4 ? "Phones take longer." : t >= 1.5 ? "Built heavy on purpose." : "Signing…";

/** Honest estimate curve, never a percentage; the real elapsed time counts up beside it. */
export function Signing({ t0 }: { t0: number }) {
  const fill = useRef<HTMLElement>(null), msg = useRef<HTMLSpanElement>(null), tt = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const est = isPhone() ? 5 : 1;
    let raf = 0;
    const loop = () => {
      const t = (performance.now() - t0) / 1000;
      if (fill.current) fill.current.style.transform = `scaleX(${0.9 * (1 - Math.exp(-t / (est / 2)))})`;
      if (tt.current) tt.current.textContent = `${t.toFixed(1)} s`;
      if (msg.current) msg.current.textContent = signMsg(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [t0]);
  return <div className="signing" role="status" aria-label="Signing with your key card. Nothing has been sent yet.">
    <div className="signing-track" aria-hidden="true"><i ref={fill} className="signing-fill" /></div>
    <div className="signing-meta"><span ref={msg}>Signing…</span><span ref={tt} className="mono">0.0 s</span></div>
  </div>;
}

export function AmountField({ value, locked, onChange }: { value: string; locked?: boolean; onChange: (v: string) => void }) {
  return <label className="field"><span className="field-label">Amount</span><span className="input-wrap">
    <input className="input input--amount mono" inputMode="decimal" autoComplete="off" placeholder="0.00" autoFocus={!locked} value={value} readOnly={locked}
      onChange={(e) => onChange(e.target.value)} />
    <span className="input-unit">USDC</span></span></label>;
}
