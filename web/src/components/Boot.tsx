"use client";
import dynamic from "next/dynamic";

// The app talks to a wallet, the RPC and Web Workers, so it renders in the browser only.
const App = dynamic(() => import("./App"), { ssr: false, loading: () => <main className="boot" aria-busy="true" /> });

export default function Boot() {
  return <App />;
}
