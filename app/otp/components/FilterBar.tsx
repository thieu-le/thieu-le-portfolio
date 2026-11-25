import Link from "next/link";
import { filterSearch, LANES, REGIONS, toggleRegion } from "../lib/filters";

/** Region toggles and lane tabs as plain links, so filters survive sharing a URL. */
export default function FilterBar({
  basePath,
  platforms,
  position,
  laneGames,
  keep = {},
}: {
  basePath: string;
  platforms: string[];
  position: string;
  /** Games per lane in the selected regions; lanes with none are hidden. */
  laneGames: Map<string, number>;
  /** Extra params to keep when switching region, e.g. the selected opponent. */
  keep?: Record<string, string>;
}) {
  const total = [...laneGames.values()].reduce((n, g) => n + g, 0);

  return (
    <div className="otp-filter-bar">
      <nav className="otp-sort-options" aria-label="Lane">
        {LANES.filter((l) => laneGames.get(l.position) || l.position === position).map((l) => {
          const games = laneGames.get(l.position) ?? 0;
          const share = total ? Math.round((100 * games) / total) : 0;
          return (
            <Link
              key={l.position}
              href={`${basePath}${filterSearch(platforms, l.position)}`}
              scroll={false}
              prefetch={false}
              aria-current={l.position === position ? "page" : undefined}
              title={`${games.toLocaleString()} games`}
            >
              {l.label} <span className="otp-filter-share">{share}%</span>
            </Link>
          );
        })}
      </nav>
      <nav className="otp-sort-options" aria-label="Regions">
        {REGIONS.map((r) => {
          const on = platforms.includes(r.platform);
          const next = toggleRegion(platforms, r.platform);
          return (
            <Link
              key={r.platform}
              href={`${basePath}${filterSearch(next, position, keep)}`}
              scroll={false}
              prefetch={false}
              aria-current={on ? "true" : undefined}
              aria-label={`${r.label}${on ? " (shown)" : " (hidden)"}`}
            >
              {r.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
