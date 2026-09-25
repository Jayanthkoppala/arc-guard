"use client";
import dynamic from "next/dynamic";

const Hall = dynamic(() => import("./Hall"), { ssr: false, loading: () => <main className="boot" aria-busy="true" /> });

export default function HallBoot() {
  return <Hall />;
}
