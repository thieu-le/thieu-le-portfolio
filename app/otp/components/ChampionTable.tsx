"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ChevronRight, ChevronsUpDown, Search, X } from "lucide-react";

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
      .filter((r) => r.name.toLowerCase().includes(q))
      .sort((a, b) => b[sort] - a[sort] || a.name.localeCompare(b.name));
  }, [rows, query, sort]);

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
                <Link href={`/otp/${r.slug}`} prefetch={false} className="otp-row-link">
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
                  <span>Try a different champion name.</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
