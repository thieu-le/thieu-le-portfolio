import ChampionTable, { type ChampionListRow } from "./components/ChampionTable";
import SetupNotice from "./components/SetupNotice";
import { getChampionStats, getStaticData, isConfigured, winRate } from "./lib/data";

export const revalidate = 3600;

export default async function OtpHome() {
  if (!isConfigured()) return <SetupNotice />;

  const [stats, dd] = await Promise.all([getChampionStats(), getStaticData()]);
  const rows: ChampionListRow[] = stats.flatMap((s) => {
    const c = dd.championsByKey.get(s.champion_id);
    if (!c) return [];
    return [{
      slug: c.id.toLowerCase(),
      name: c.name,
      icon: dd.championIcon(c),
      games: s.games,
      winRate: winRate(s),
      oneTricks: s.one_tricks,
    }];
  });
  const totalGames = stats.reduce((n, s) => n + s.games, 0);
  const totalOtps = stats.reduce((n, s) => n + s.one_tricks, 0);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Builds from players who only play one champion</h1>
      <p className="mt-2 text-zinc-400 max-w-2xl">
        Every number here comes from Master, Grandmaster and Challenger solo queue players whose recent games
        are mostly on a single champion. Builds, runes and skill orders are what they actually do on their
        main.
      </p>
      <p className="mt-4 text-sm text-zinc-500">
        {totalOtps.toLocaleString()} one-tricks · {totalGames.toLocaleString()} games · patch{" "}
        {stats[0]?.latest_patch ?? "n/a"} · updated hourly
      </p>
      <div className="mt-8">
        {rows.length ? (
          <ChampionTable rows={rows} />
        ) : (
          <p className="text-zinc-400">No games collected yet. The collector fills this in over the first few runs.</p>
        )}
      </div>
    </div>
  );
}
