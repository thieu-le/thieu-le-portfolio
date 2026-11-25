import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Crosshair } from "lucide-react";
import "./otp.css";

export const metadata: Metadata = {
  title: "One-Trick Stats | Masters+ builds and win rates",
  description:
    "Ad-free League of Legends builds, runes and win rates taken only from Master, Grandmaster and Challenger one-tricks on NA, EUW and KR.",
};

export default function OtpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="otp flex min-h-screen flex-col font-sans">
      <header className="otp-header">
        <nav aria-label="One-Trick Stats" className="otp-wrap flex min-h-17 items-center justify-between gap-4">
          <Link href="/otp" className="flex items-center gap-3 rounded-md font-semibold tracking-tight">
            <span className="otp-mark"><Crosshair size={20} aria-hidden /></span>
            One-Trick Stats
          </Link>
          <Link href="/" className="otp-quiet-link">
            Portfolio <ArrowUpRight size={15} aria-hidden />
          </Link>
        </nav>
      </header>

      <main className="otp-wrap flex-1 py-6 sm:py-9">{children}</main>

      <footer className="otp-footer mt-14">
        <div className="otp-wrap flex flex-wrap justify-between gap-x-10 gap-y-4 py-7 text-xs leading-relaxed">
          <p className="max-w-2xl">
            One-Trick Stats isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the views or opinions of
            Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games,
            and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
          </p>
          <p>Built by <Link href="/" className="otp-quiet-link inline-flex">Thieu Le</Link>.</p>
        </div>
      </footer>
    </div>
  );
}
