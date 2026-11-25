"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export type MatchupRow = {
  slug: string;
  name: string;
  icon: string;
  games: number;
  winRate: number;
  /** Win rate shrunk toward the champion's average; used for sorting. */
  adjustedWinRate: number;
  laneWinRate: number | null;
  goldDiff15: number | null;
  xpDiff15: number | null;
};

type Sort = "games" | "hardest" | "easiest";

const SORTS: { key: Sort; label: string }[] = [
  { key: "games", label: "Most played" },
  { key: "hardest", label: "Hardest" },
  { key: "easiest", label: "Easiest" },
];

function signed(n: number | null) {
  if (n === null) return "–";
  return `${n > 0 ? "+" : ""}${n.toLocaleString()}`;
}

function rateClass(rate: number | null, games: number, minGames: number) {
  if (rate === null || games < minGames) return "text-zinc-500";
  if (rate >= 52) return "text-emerald-400";
  if (rate <= 48) return "text-rose-400";
  return "text-zinc-200";
}

export default function MatchupList({
  rows,
  selected,
  baseHref,
  minGames,
}: {
  rows: MatchupRow[];
  selected: string | null;
  baseHref: string;
  minGames: number;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("games");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((r) => !q || r.name.toLowerCase().includes(q));
    if (sort === "games") return list.sort((a, b) => b.games - a.games);
    const dir = sort === "hardest" ? 1 : -1;
    return list.sort((a, b) => dir * (a.adjustedWinRate - b.adjustedWinRate));
  }, [rows, query, sort]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find an opponent"
          aria-label="Find an opponent"
          className="w-full sm:w-60 rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm outline-none focus:border-amber-400"
        />
        <div className="flex gap-1 text-sm" role="group" aria-label="Sort matchups">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              aria-pressed={sort === s.key}
              className={`rounded-md px-3 py-1.5 border ${
                sort === s.key
                  ? "border-amber-400 text-amber-300"
                  : "border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800 max-h-[32rem] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-zinc-400 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-medium">vs</th>
              <th className="px-3 py-2 text-right font-medium">Games</th>
              <th className="px-3 py-2 text-right font-medium">Game WR</th>
              <th className="px-3 py-2 text-right font-medium">Lane WR</th>
              <th className="px-3 py-2 text-right font-medium hidden sm:table-cell">Gold @15</th>
              <th className="px-3 py-2 text-right font-medium hidden sm:table-cell">XP @15</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const active = r.slug === selected;
              return (
                <tr
                  key={r.slug}
                  className={`border-t border-zinc-800 ${active ? "bg-amber-400/10" : "hover:bg-zinc-900/60"}`}
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`${baseHref}?vs=${r.slug}#matchup`}
                      scroll={false}
                      aria-current={active ? "true" : undefined}
                      className="flex items-center gap-2"
                    >
                      <Image src={r.icon} alt="" width={28} height={28} unoptimized className="rounded" />
                      <span className={active ? "text-amber-300 font-medium" : "font-medium"}>{r.name}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.games}
                    {r.games < minGames && <span className="ml-1 text-xs text-zinc-500" title="Small sample">*</span>}
                  </td>
                  <td className={`px-3 py-2 text-right tabular-nums ${rateClass(r.winRate, r.games, minGames)}`}>
                    {r.winRate.toFixed(1)}%
                  </td>
                  <td className={`px-3 py-2 text-right tabular-nums ${rateClass(r.laneWinRate, r.games, minGames)}`}>
                    {r.laneWinRate === null ? "–" : `${r.laneWinRate.toFixed(1)}%`}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums hidden sm:table-cell">{signed(r.goldDiff15)}</td>
                  <td className="px-3 py-2 text-right tabular-nums hidden sm:table-cell">{signed(r.xpDiff15)}</td>
                </tr>
              );
            })}
            {shown.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-zinc-500">
                  No matchups match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        * Fewer than {minGames} games: win rates are greyed out and pulled toward the champion&apos;s average when
        sorting. Lane WR counts ahead in both gold and XP at 15:00 as a win and mixed leads as half.
      </p>
    </div>
  );
}
