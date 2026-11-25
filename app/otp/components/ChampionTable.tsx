"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ChevronRight, ChevronsUpDown, Search, X } from "lucide-react";
import { filterSearch, LANES, parseLane, parseRegions, REGIONS, toggleRegion } from "../lib/filters";

export type ChampionListRow = {
  slug: string;
  name: string;
  icon: string;
  /** [platform, position, games, wins] */
  cells: [string, string, number, number][];
  /** One-tricks per platform. */
  oneTricks: Record<string, number>;
};

type SortKey = "games" | "winRate" | "oneTricks";
type Shown = { slug: string; name: string; icon: string; games: number; winRate: number; oneTricks: number };

export default function ChampionTable({ rows }: { rows: ChampionListRow[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("games");
  // Filters live in the URL so they survive a refresh and carry to champion
  // pages. Next keeps useSearchParams in sync with history.replaceState.
  const searchParams = useSearchParams();
  const platforms = useMemo(() => parseRegions(searchParams.get("region")), [searchParams]);
  const lane = parseLane(searchParams.get("lane"));

  function applyFilters(nextPlatforms: string[], nextLane: string | undefined) {
    window.history.replaceState(null, "", `${window.location.pathname}${filterSearch(nextPlatforms, nextLane)}`);
  }

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out: Shown[] = [];
    for (const r of rows) {
      if (!r.name.toLowerCase().includes(q)) continue;
      let games = 0;
      let wins = 0;
      for (const [platform, position, g, w] of r.cells) {
        if (!platforms.includes(platform) || (lane && position !== lane)) continue;
        games += g;
        wins += w;
      }
      if (!games) continue;
      const oneTricks = platforms.reduce((n, p) => n + (r.oneTricks[p] ?? 0), 0);
      out.push({ slug: r.slug, name: r.name, icon: r.icon, games, winRate: (100 * wins) / games, oneTricks });
    }
    return out.sort((a, b) => b[sort] - a[sort] || a.name.localeCompare(b.name));
  }, [rows, query, sort, platforms, lane]);

  const linkSearch = filterSearch(platforms, lane);

  const header = (key: SortKey, label: string) => (
    <th scope="col" aria-sort={sort === key ? "descending" : undefined}>
      <button type="button" onClick={() => setSort(key)} className="otp-sort" data-active={sort === key}>
        {label}
        {sort === key ? <ArrowDown size={13} aria-hidden /> : <ChevronsUpDown size={13} aria-hidden />}
      </button>
    </th>
  );

  return (
    <div className="otp-panel overflow-hidden">
      <div className="otp-table-toolbar otp-directory-toolbar">
        <div className="otp-search">
          <Search size={17} aria-hidden />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search champions" aria-label="Search champions" />
          {query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")}><X size={16} aria-hidden /></button>}
        </div>
        <div className="otp-sort-options" role="group" aria-label="Lane">
          <button type="button" aria-pressed={!lane} onClick={() => applyFilters(platforms, undefined)}>All lanes</button>
          {LANES.map((l) => (
            <button key={l.position} type="button" aria-pressed={lane === l.position} onClick={() => applyFilters(platforms, l.position)}>
              {l.label}
            </button>
          ))}
        </div>
        <div className="otp-sort-options" role="group" aria-label="Regions">
          {REGIONS.map((r) => (
            <button
              key={r.platform}
              type="button"
              aria-pressed={platforms.includes(r.platform)}
              onClick={() => applyFilters(toggleRegion(platforms, r.platform), lane)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <span aria-live="polite" className="otp-table-count">
          {shown.length.toLocaleString()} {shown.length === 1 ? "champion" : "champions"}
        </span>
      </div>
      <table className="otp-table otp-directory">
        <thead>
          <tr>
            <th scope="col">Champion</th>
            {header("oneTricks", "One-tricks")}
            {header("games", "Games")}
            {header("winRate", "Win rate")}
          </tr>
        </thead>
        <tbody>
          {shown.map((r) => (
            <tr key={r.slug} className="otp-link-row">
              <th scope="row">
                <Link href={`/otp/${r.slug}${linkSearch}`} prefetch={false} className="otp-row-link">
                  <Image src={r.icon} alt="" width={40} height={40} unoptimized className="otp-portrait" />
                  <span>{r.name}</span>
                </Link>
              </th>
              <td>{r.oneTricks.toLocaleString()}</td>
              <td>{r.games.toLocaleString()}</td>
              <td>
                <span className="otp-rate">{r.winRate.toFixed(1)}%</span>
                <ChevronRight size={16} className="otp-row-arrow" aria-hidden />
              </td>
            </tr>
          ))}
          {shown.length === 0 && (
            <tr>
              <td colSpan={4}>
                <div className="otp-empty">
                  <Search size={21} aria-hidden />
                  <p>No champions found</p>
                  <span>Try another name, lane or region.</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
