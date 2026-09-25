import type { Metadata } from "next";
import { DM_Sans, Nunito } from "next/font/google";
import "./globals.css";

const display = Nunito({ subsets: ["latin"], weight: ["700", "800", "900"], variable: "--font-nunito" });
const body = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-dm-sans" });

export const metadata: Metadata = {
  title: "Arc Guard: a safe deposit box for your digital dollars",
  description: "Keep USDC on Arc behind two keys: your wallet, and a key card built to resist quantum computers. Locker or Savings. Open source.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <div className="blobs" aria-hidden="true"><i className="blob blob--1" /><i className="blob blob--2" /><i className="blob blob--3" /></div>
        {children}
        <noscript><p className="noscript">Arc Guard needs JavaScript to talk to Arc.</p></noscript>
      </body>
    </html>
  );
}
