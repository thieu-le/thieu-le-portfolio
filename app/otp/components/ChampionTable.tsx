"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export type ChampionListRow = {
  slug: string;
  name: string;
  icon: string;
  games: number;
  winRate: number;
  oneTricks: number;
};

type SortKey = "games" | "winRate" | "oneTricks";

export default function ChampionTable({ rows }: { rows: ChampionListRow[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("games");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => !q || r.name.toLowerCase().includes(q))
      .sort((a, b) => b[sort] - a[sort]);
  }, [rows, query, sort]);

  const header = (key: SortKey, label: string) => (
    <th className="px-3 py-2 text-right font-medium">
      <button
        onClick={() => setSort(key)}
        className={sort === key ? "text-amber-400" : "text-zinc-400 hover:text-zinc-200"}
      >
        {label}
      </button>
    </th>
  );

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search champions"
        aria-label="Search champions"
        className="mb-4 w-full sm:w-72 rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm outline-none focus:border-amber-400"
      />
      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-zinc-400">Champion</th>
              {header("oneTricks", "One-tricks")}
              {header("games", "Games")}
              {header("winRate", "Win rate")}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.slug} className="border-t border-zinc-800 hover:bg-zinc-900/60">
                <td className="px-3 py-2">
                  <Link href={`/otp/${r.slug}`} className="flex items-center gap-3">
                    <Image src={r.icon} alt="" width={32} height={32} unoptimized className="rounded" />
                    <span className="font-medium">{r.name}</span>
                  </Link>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{r.oneTricks}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.games.toLocaleString()}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.winRate.toFixed(1)}%</td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-zinc-500">
                  No champions match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
