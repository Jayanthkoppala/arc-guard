// Root of the client app. The store (lib/store.ts) holds state; any change calls render(), which re-renders here.
import { useEffect, useReducer } from "react";
import { ACT, RM, S, bannerBox, closeSheet, cur, init, render, setRenderer } from "@/lib/store";
import { SFX } from "@/lib/sound";
import { BoxPanel } from "./BoxPanel";
import { BoxSide } from "./BoxSide";
import { Cabinet } from "./Cabinet";
import { Banner, Footer, Header } from "./Chrome";
import { Landing } from "./Landing";
import { OpenBox } from "./OpenBox";
import { PracticeCard } from "./Practice";
import { SheetView } from "./Sheets";
import { Tour } from "./Tour";

function Panel() {
  switch (S.view) {
    case "landing": return <Landing />;
    case "tour": return <Tour />;
    case "practice": return <div className="stack"><p><button type="button" className="link" onClick={ACT.home}>← Back</button></p><PracticeCard inTour={false} /></div>;
    case "open": return <OpenBox />;
    default: return <BoxSide />;
  }
}

export default function App() {
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    setRenderer(force);
    void init();
    const unlock = () => SFX.unlock();
    const key = (e: KeyboardEvent) => { SFX.unlock(); if (e.key === "Escape") closeSheet(); };
    addEventListener("pointerdown", unlock, { once: true });
    addEventListener("keydown", key);
    RM.addEventListener("change", render);
    return () => { removeEventListener("keydown", key); RM.removeEventListener("change", render); };
  }, []);
  useEffect(() => {
    document.body.classList.toggle("sheet-open", !!S.sheet);
    const xb = bannerBox(), b = cur();
    document.title = xb ? `EXIT PENDING · Box No. ${xb.no}`
      : b && (S.view === "box" || S.view === "tour" || S.view === "view") ? `Box No. ${b.no} · Arc Guard`
      : "Arc Guard: a safe deposit box for your digital dollars";
  });
  return <>
    <Header />
    <Banner />
    <main className="stage">
      <section className="stage-left" aria-label="The box">
        <Cabinet />
        <BoxPanel />
      </section>
      <section className="stage-right">
        <div key={S.view} className="panel enter"><Panel /></div>
        <SheetView />
      </section>
    </main>
    {S.sheet && <div className="scrim" onClick={closeSheet} />}
    <p className="sr-only" aria-live="polite">{S.live}</p>
    <Footer />
  </>;
}
