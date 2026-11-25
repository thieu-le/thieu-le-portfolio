import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Swords } from "lucide-react";
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
  const featured = rows[0];
  const splashChampion = dd.championsBySlug.get(featured?.slug ?? "ahri");
  const totalGames = stats.reduce((n, s) => n + s.games, 0);
  const totalOtps = stats.reduce((n, s) => n + s.one_tricks, 0);
  const latestPatch = stats[0]?.latest_patch;

  return (
    <>
      <section className="otp-hero otp-panel" aria-labelledby="otp-title">
        <div className="otp-hero-main">
          {splashChampion && (
            <div className="otp-hero-art">
              <Image src={dd.championSplash(splashChampion)} alt="" fill unoptimized preload sizes="(max-width: 700px) 100vw, 850px" />
            </div>
          )}
          <div className="otp-hero-copy">
            <div className="otp-eyebrow"><Swords size={15} aria-hidden /> League of Legends · Master+ solo queue</div>
            <h1 id="otp-title" className="otp-title">How <span className="whitespace-nowrap">one-tricks</span><br className="hidden sm:block" /> <em>build.</em></h1>
            <p className="max-w-md text-sm leading-relaxed sm:text-base">
              Explore builds, runes and lane matchups from Master, Grandmaster and Challenger players who main one champion.
            </p>
          </div>
          {featured && (
            <Link href={`/otp/${featured.slug}`} className="otp-featured">
              <Image src={featured.icon} alt="" width={36} height={36} unoptimized className="otp-portrait" />
              <span>
                <span className="block text-xs text-[var(--otp-muted)]">Most tracked games</span>
                <strong className="block text-sm font-semibold">{featured.name}</strong>
              </span>
              <ArrowUpRight size={16} aria-hidden />
            </Link>
          )}
        </div>
        <dl className="otp-hero-stats">
          <div><dt>Tracked games</dt><dd>{totalGames.toLocaleString()}</dd></div>
          <div><dt>One-tricks</dt><dd>{totalOtps.toLocaleString()}</dd></div>
          <div><dt>Regions</dt><dd>NA · EUW · KR</dd></div>
          <div><dt>Latest patch</dt><dd>{latestPatch ?? "—"}</dd></div>
        </dl>
      </section>

      <section className="otp-section" aria-labelledby="champion-directory">
        <div className="otp-section-heading">
          <div>
            <h2 id="champion-directory">Champion directory</h2>
            <p>Find a champion to see what their one-tricks play.</p>
          </div>
          <span className="otp-update"><span aria-hidden /> Updated hourly</span>
        </div>
        {rows.length ? (
          <ChampionTable rows={rows} />
        ) : (
          <div className="otp-panel otp-empty">
            <Swords size={23} aria-hidden />
            <p>No games collected yet</p>
            <span>Champions will appear here as games are collected.</span>
          </div>
        )}
      </section>
    </>
  );
}
