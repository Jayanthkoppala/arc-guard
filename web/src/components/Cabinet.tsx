// The hero object: a blue clay cabinet with a round door, a Locker drawer, a Savings jar and two key sockets.
// Every moving part is driven by data-* attributes from S.sock; CSS does the motion.
import { boxNoOf } from "@/lib/card";
import { ACT, S, bannerBox, coinCount, cur, exitLeft, exitOf, f2, own } from "@/lib/store";
import { Alert } from "./bits";

/** Coins fall only when a confirmed move grows the pile (the store opens the drop window). */
function Coins({ v }: { v: number | null }) {
  const n = coinCount(v ?? 0), { from, until } = S.drop, dropping = S.now < until;
  return <div className="coins">{Array.from({ length: n }, (_, i) => {
    const drop = dropping && i >= from;
    return <i key={i} className={`coin${drop ? " coin--drop" : ""}`}
      style={{ bottom: `${0.5 + i * 0.78}em`, left: `calc(50% - 3.1em + ${(((i * 37) % 7) - 3) * 0.12}em)`, animationDelay: drop ? `${(i - from) * 140}ms` : undefined }} />;
  })}</div>;
}

const Label = ({ t, n, className = "" }: { t: string; n: string; className?: string }) =>
  <div className={`tag-label ${className}`}><span className="tag-label__t">{t}</span><span className="tag-label__n">{n}</span><span className="tag-label__u">USDC</span></div>;

export function Cabinet() {
  const k = S.sock, inside = S.view !== "landing" && S.view !== "practice";
  const b = inside ? cur() ?? (S.view === "open" ? own() : null) : null, r = b?.r;
  const xb = bannerBox(), ex = exitOf(xb), L = ex && !ex.ready ? exitLeft(ex.readyAt) : null;
  const plate = S.view === "tour" || S.view === "view" ? b?.no ?? "––––" : S.account ? boxNoOf(S.account) : "––––";
  return <div className="cabinet-wrap">
    <div className="cabinet" data-door={k.door} data-wheel={k.wheel} data-k1={k.k1} data-k2={k.k2} data-i1={k.i1} data-i2={k.i2}
      data-turned={k.turned} data-bolt={k.bolt} data-drawer={k.drawer} data-rattle={k.rattle} data-exit={xb && S.view !== "tour" ? "1" : "0"}>
      <div className="plate" aria-hidden="true"><span className="plate-no">No.</span><span className="plate-num">{plate}</span></div>
      <div className="nameplate" aria-hidden="true">Arc Guard</div>
      <div className="bay">
        <div className="interior" aria-hidden="true">
          <div className="locker"><Label t="LOCKER" n={f2(r?.locker ?? 0n)} /><div className="locker-pull" /></div>
          <span className="bolt-bar" /><span className="bolt" />
          <div className="jar"><div className="jar-lid" /><div className="jar-glass"><Coins v={r ? Number(r.savings) / 1e6 : null} /></div></div>
          <Label t="SAVINGS" n={f2(r?.savings ?? 0n)} className="jar-label" />
        </div>
        <button type="button" className="door" tabIndex={-1} aria-hidden="true" onClick={ACT.leaf}>
          <span className="door-hinge door-hinge--1" /><span className="door-hinge door-hinge--2" />
          <span className="door-disc">
            <svg className="door-handle" viewBox="-60 -60 120 120" aria-hidden="true">
              <g className="door-spokes">
                <g id="spk"><rect x="-5" y="-50" width="10" height="44" rx="5" /><circle cx="0" cy="-49" r="9" /></g>
                <use href="#spk" transform="rotate(120)" /><use href="#spk" transform="rotate(240)" />
              </g>
              <circle className="door-hub" r="15" />
            </svg>
          </span>
        </button>
      </div>
      <div className="sockets" aria-hidden="true">
        {(["Wallet", "Key card"] as const).map((label, i) => <div key={label} className={`socket socket--${i + 1}`}>
          <div className="socket-well">
            <svg className="keyhole" viewBox="0 0 20 20">{i === 0
              ? <path d="M10 3.2a3.3 3.3 0 0 0-1.6 6.2L7.4 16.4h5.2l-1-7A3.3 3.3 0 0 0 10 3.2z" />
              : <><rect x="8.6" y="3" width="2.8" height="14" rx="1.4" /><rect x="4.5" y="8.6" width="11" height="2.8" rx="1.4" /></>}</svg>
            <span className={`key key--${i + 1}`}><b>{i + 1}</b></span>
            <span className="socket-orb">✓</span>
          </div>
          <span className="socket-label">{label}</span>
        </div>)}
      </div>
      <div className="plaque" aria-hidden="true">Second key resists quantum computers</div>
      <div className="exit-tag" aria-hidden="true"><Alert /><b>EXIT PENDING</b><span>{L ? `${L.d}d ${L.h}h` : "OPEN NOW"}</span></div>
    </div>
  </div>;
}
