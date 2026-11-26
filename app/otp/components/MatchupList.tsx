"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { Rate, signed } from "./StatDisplay";

export type MatchupRow = {
  slug: string;
  name: string;
  icon: string;
  games: number;
  winRate: number;
  laneWinRate: number | null;
  /** Gold + XP lead at 15:00, shrunk toward 0 for small samples; used for sorting. */
  laneLead: number | null;
  goldDiff15: number | null;
  xpDiff15: number | null;
};

type Sort = "games" | "hardest" | "easiest";

const SORTS: { key: Sort; label: string }[] = [
  { key: "games", label: "Most played" },
  { key: "hardest", label: "Hardest" },
  { key: "easiest", label: "Easiest" },
];

function showMatchup() {
  const panel = document.getElementById("matchup-detail");
  if (!panel) return;

  panel.focus({ preventScroll: true });
  panel.scrollIntoView({ block: "start" });
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
  const pendingMobileMatchup = useRef<string | null>(null);

  useEffect(() => {
    if (selected && pendingMobileMatchup.current === selected) {
      pendingMobileMatchup.current = null;
      showMatchup();
    }
  }, [selected]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((r) => r.name.toLowerCase().includes(q));
    if (sort === "games") return list.sort((a, b) => b.games - a.games);
    // Hardest = biggest gold + XP deficit at 15:00. Matchups without lane data go last.
    const dir = sort === "hardest" ? 1 : -1;
    return list.sort((a, b) => {
      if (a.laneLead === null || b.laneLead === null) return (a.laneLead === null ? 1 : 0) - (b.laneLead === null ? 1 : 0);
      return dir * (a.laneLead - b.laneLead) || b.games - a.games;
    });
  }, [rows, query, sort]);

  return (
    <div className="otp-panel overflow-hidden">
      <div className="otp-table-toolbar">
        <div className="otp-search">
          <Search size={17} aria-hidden />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find an opponent" aria-label="Find an opponent" />
          {query && <button type="button" aria-label="Clear opponent search" onClick={() => setQuery("")}><X size={16} aria-hidden /></button>}
        </div>
        <div className="otp-sort-options" role="group" aria-label="Sort matchups">
          {SORTS.map((s) => (
            <button key={s.key} type="button" onClick={() => setSort(s.key)} aria-pressed={sort === s.key}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[32rem] overflow-auto" role="region" aria-label="Opponent statistics" tabIndex={0}>
        <table className="otp-table">
          <thead className="sticky top-0 z-10">
            <tr>
              <th scope="col">Opponent</th>
              <th scope="col">Games</th>
              <th scope="col">Game WR</th>
              <th scope="col">Lane WR</th>
              <th scope="col" className="hidden sm:table-cell">Gold @15</th>
              <th scope="col" className="hidden sm:table-cell">XP @15</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const active = r.slug === selected;
              const smallSample = r.games < minGames;
              return (
                <tr key={r.slug} className="otp-link-row" data-selected={active}>
                  <th scope="row">
                    <Link
                      href={`${baseHref}${baseHref.includes("?") ? "&" : "?"}vs=${r.slug}#matchup`}
                      prefetch={false}
                      scroll={false}
                      aria-current={active ? "true" : undefined}
                      onNavigate={() => {
                        if (!window.matchMedia("(width < 70rem)").matches) {
                          pendingMobileMatchup.current = null;
                        } else if (active) {
                          showMatchup();
                        } else {
                          pendingMobileMatchup.current = r.slug;
                        }
                      }}
                      className="otp-row-link"
                    >
                      <Image src={r.icon} alt="" width={30} height={30} unoptimized className="otp-portrait" />
                      <span>{r.name}</span>
                    </Link>
                  </th>
                  <td>
                    {r.games.toLocaleString()}
                    {smallSample && <span title="Small sample">*</span>}
                  </td>
                  <td><Rate value={r.winRate} /></td>
                  <td><Rate value={r.laneWinRate} /></td>
                  <td className="hidden sm:table-cell">{signed(r.goldDiff15)}</td>
                  <td className="hidden sm:table-cell">{signed(r.xpDiff15)}</td>
                </tr>
              );
            })}
            {shown.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="otp-empty">
                    <Search size={21} aria-hidden />
                    <p>No matching opponents</p>
                    <span>Try a different champion name.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="border-t border-[var(--otp-line)] px-4 py-3 text-xs leading-relaxed text-[var(--otp-muted)]">
        * Under {minGames} games, a small sample. Hardest and easiest sort by the combined gold and XP
        lead at 15 minutes, pulled toward even for small samples. A lead in both counts as a lane win; mixed leads count as half.
      </p>
    </div>
  );
}
