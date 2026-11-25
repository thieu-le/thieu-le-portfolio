import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "One-Trick Stats | Masters+ builds and win rates",
  description:
    "Ad-free League of Legends builds, runes and win rates taken only from Master, Grandmaster and Challenger one-tricks on NA, EUW and KR.",
};

export default function OtpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/otp" className="font-semibold tracking-tight text-lg">
            One-Trick <span className="text-amber-400">Stats</span>
          </Link>
          <span className="text-xs text-zinc-400">Master+ · NA · EUW · KR · no ads</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>

      <footer className="border-t border-zinc-800 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-xs text-zinc-500 space-y-2">
          <p>
            One-Trick Stats isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the views or opinions of
            Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games,
            and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
          </p>
          <p>
            Built by <Link href="/" className="underline hover:text-zinc-300">Thieu Le</Link>.
          </p>
        </div>
      </footer>
    </div>
  );
}
