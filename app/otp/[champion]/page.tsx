import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Footprints,
  Layers,
  Swords,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import FilterBar from "../components/FilterBar";
import MatchupList, { type MatchupRow } from "../components/MatchupList";
import SetupNotice from "../components/SetupNotice";
import { Rate, signed } from "../components/StatDisplay";
import {
  adjustedLaneLead,
  getChampionDetail,
  getChampionSummary,
  getMatchupDetail,
  getMatchups,
  getStaticData,
  isConfigured,
  laneWinRate,
  MIN_WR_GAMES,
  PLATFORM_LABEL,
  winRate,
  type BuildStat,
  type MatchupStat,
  type RuneStat,
  type SkillStat,
  type StatRow,
} from "../lib/data";
import { filterSearch, laneLabel, LANES, parseLane, parseRegions, REGIONS } from "../lib/filters";

export const revalidate = 3600;

type Props = {
  params: Promise<{ champion: string }>;
  searchParams: Promise<{ vs?: string | string[]; region?: string | string[]; lane?: string | string[] }>;
};

type StaticData = Awaited<ReturnType<typeof getStaticData>>;
type SetupComparison = { skill?: string; build?: number[]; runes?: number[] };

export async function generateMetadata({ params }: Props) {
  const { champion } = await params;
  const dd = await getStaticData();
  const c = dd.championsBySlug.get(champion.toLowerCase());
  return { title: c ? `${c.name} one-trick builds and matchups | One-Trick Stats` : "One-Trick Stats" };
}

function GameRate({ stat }: { stat: StatRow }) {
  return <Rate value={winRate(stat)} />;
}

function Sample({ stat }: { stat: StatRow }) {
  return (
    <div className="otp-sample">
      <span className="sr-only">Win rate</span>
      <GameRate stat={stat} />
      <span>{stat.games.toLocaleString()} {stat.games === 1 ? "game" : "games"}</span>
    </div>
  );
}

function ItemIcon({ src, name, size }: { src: string; name: string; size: number }) {
  return <Image src={src} alt={name} title={name} width={size} height={size} unoptimized className="otp-item" />;
}

function Card({
  title,
  icon: Icon,
  differs,
  nested,
  children,
}: {
  title: string;
  icon: LucideIcon;
  differs?: boolean;
  nested?: boolean;
  children: React.ReactNode;
}) {
  const Heading = nested ? "h4" : "h3";
  return (
    <section className="otp-panel otp-card">
      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="otp-card-icon"><Icon size={16} aria-hidden /></span>
        <Heading>{title}</Heading>
        {differs && <span className="ml-auto text-xs font-medium text-[var(--otp-accent)]">Differs from usual</span>}
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="otp-metric"><dt>{label}</dt><dd>{value}</dd></div>;
}

function Empty({ children = "Not enough games yet." }: { children?: React.ReactNode }) {
  return <p className="text-sm text-[var(--otp-muted)]">{children}</p>;
}

function Alternatives({ count, children }: { count: number; children: React.ReactNode }) {
  if (!count) return null;

  return (
    <details className="otp-alternatives">
      <summary>{count} {count === 1 ? "alternative" : "alternatives"} <ChevronDown size={16} aria-hidden /></summary>
      <ul className="mt-2">{children}</ul>
    </details>
  );
}

function SkillOrder({ order }: { order: string }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="sr-only">{order.split(">").map((key) => key.trim()).join(", then ")}</span>
      {order.split(">").map((key, index) => (
        <span aria-hidden="true" key={index} className="flex items-center gap-1">
          {index > 0 && <ChevronRight size={12} className="text-[var(--otp-muted)]" />}
          <span className="otp-skill">{key.trim()}</span>
        </span>
      ))}
    </div>
  );
}

function SkillCard({ rows, usual, nested }: { rows: SkillStat[]; usual?: string; nested?: boolean }) {
  const [top, ...rest] = rows;
  return (
    <Card title="Skill order" icon={TrendingUp} nested={nested} differs={Boolean(usual && top && top.skill_max !== usual)}>
      {top ? (
        <>
          <div className="flex items-center justify-between gap-2"><SkillOrder order={top.skill_max} /><Sample stat={top} /></div>
          <p className="otp-recommendation mt-2">Max abilities in this order.</p>
          <Alternatives count={rest.length}>
            {rest.map((s) => (
              <li key={s.skill_max} className="flex items-center justify-between gap-2">
                <SkillOrder order={s.skill_max} /><Sample stat={s} />
              </li>
            ))}
          </Alternatives>
        </>
      ) : <Empty />}
    </Card>
  );
}

function ItemChain({ ids, dd, size }: { ids: number[]; dd: StaticData; size: number }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {ids.map((id, i) => (
        <span key={`${id}-${i}`} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={12} className="text-[var(--otp-muted)]" aria-hidden />}
          <ItemIcon src={dd.itemIcon(id)} name={dd.itemName(id)} size={size} />
        </span>
      ))}
    </div>
  );
}

function BuildCard({ rows, dd, usual, nested }: { rows: BuildStat[]; dd: StaticData; usual?: number[]; nested?: boolean }) {
  const [top, ...rest] = rows;
  const differs = Boolean(usual && top && top.core_items.join("-") !== usual.join("-"));
  return (
    <Card title="Core build" icon={Swords} differs={differs} nested={nested}>
      {top ? (
        <>
          <div className="flex items-center justify-between gap-2"><ItemChain ids={top.core_items} dd={dd} size={34} /><Sample stat={top} /></div>
          <p className="otp-recommendation mt-2">{top.core_items.map(dd.itemName).join(" › ")}</p>
          <Alternatives count={rest.length}>
            {rest.map((b) => (
              <li key={b.core_items.join("-")} className="flex items-center justify-between gap-2">
                <ItemChain ids={b.core_items} dd={dd} size={28} /><Sample stat={b} />
              </li>
            ))}
          </Alternatives>
        </>
      ) : <Empty />}
    </Card>
  );
}

function RuneIcons({ perks, dd, size }: { perks: number[]; dd: StaticData; size: number }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {perks.map((id, i) => {
        const rune = dd.rune(id);
        if (!rune) return null;
        const dimension = i === 0 ? size + 10 : size;
        return <Image key={`${id}-${i}`} src={dd.runeIcon(rune)} alt={rune.name} title={rune.name} width={dimension} height={dimension} unoptimized />;
      })}
    </div>
  );
}

function RuneCard({ rows, dd, usual, nested }: { rows: RuneStat[]; dd: StaticData; usual?: number[]; nested?: boolean }) {
  const [top, ...rest] = rows;
  const differs = Boolean(usual && top && top.perks.join("-") !== usual.join("-"));
  return (
    <Card title="Runes" icon={Layers} differs={differs} nested={nested}>
      {top ? (
        <>
          <div className="flex items-center justify-between gap-2"><RuneIcons perks={top.perks} dd={dd} size={24} /><Sample stat={top} /></div>
          <p className="otp-recommendation mt-2">{top.perks.map((id) => dd.rune(id)?.name ?? id).join(" · ")}</p>
          <Alternatives count={rest.length}>
            {rest.map((r) => (
              <li key={r.perks.join("-")} className="flex items-center justify-between gap-2">
                <RuneIcons perks={r.perks} dd={dd} size={20} /><Sample stat={r} />
              </li>
            ))}
          </Alternatives>
        </>
      ) : <Empty />}
    </Card>
  );
}

export default async function ChampionPage({ params, searchParams }: Props) {
  if (!isConfigured()) return <SetupNotice />;

  const [{ champion: slug }, query] = await Promise.all([params, searchParams]);
  const dd = await getStaticData();
  const champ = dd.championsBySlug.get(slug.toLowerCase());
  if (!champ) notFound();
  const championId = Number(champ.key);
  const champSlug = champ.id.toLowerCase();
  const basePath = `/otp/${champSlug}`;

  // Regions come from the URL; the lane defaults to where this champion's
  // one-tricks play most in those regions.
  const platforms = parseRegions(query.region);
  const summary = await getChampionSummary(championId);
  const inRegions = summary.stats.filter((s) => platforms.includes(s.platform));
  const laneGames = new Map<string, number>();
  for (const s of inRegions) laneGames.set(s.position, (laneGames.get(s.position) ?? 0) + s.games);
  const mainLane = LANES.map((l) => l.position).sort((a, b) => (laneGames.get(b) ?? 0) - (laneGames.get(a) ?? 0))[0];
  const position = parseLane(query.lane) ?? mainLane;
  const laneRows = inRegions.filter((s) => s.position === position);
  const champion: StatRow | null = laneRows.length
    ? { games: laneRows.reduce((n, s) => n + s.games, 0), wins: laneRows.reduce((n, s) => n + s.wins, 0) }
    : null;
  const oneTricks = summary.oneTricks.filter((o) => platforms.includes(o.platform)).reduce((n, o) => n + o.one_tricks, 0);
  const regionLabel = REGIONS.filter((r) => platforms.includes(r.platform)).map((r) => r.label).join(" · ");

  const [{ builds, boots, runes, skills, players }, matchups] = await Promise.all([
    getChampionDetail(championId, platforms, position),
    getMatchups(championId, platforms, position),
  ]);

  const vs = typeof query.vs === "string" ? query.vs : undefined;
  const opponent = vs ? dd.championsBySlug.get(vs.toLowerCase()) : undefined;
  const opponentStats = opponent ? matchups.find((m) => m.opponent_champion_id === Number(opponent.key)) : undefined;
  const matchupDetail = opponent ? await getMatchupDetail(championId, Number(opponent.key), platforms, position) : null;

  const matchupRows: MatchupRow[] = matchups.flatMap((m) => {
    const c = dd.championsByKey.get(m.opponent_champion_id);
    if (!c) return [];
    return [{
      slug: c.id.toLowerCase(),
      name: c.name,
      icon: dd.championIcon(c),
      games: m.games,
      winRate: winRate(m),
      laneWinRate: laneWinRate(m),
      laneLead: adjustedLaneLead(m),
      goldDiff15: m.avg_gold_diff_15,
      xpDiff15: m.avg_xp_diff_15,
    }];
  });

  return (
    <>
      <Link href={`/otp${filterSearch(platforms)}`} className="otp-quiet-link mb-4"><ArrowLeft size={16} aria-hidden /> All champions</Link>

      <section aria-labelledby="champion-name" className="otp-panel otp-champion-banner">
        <div className="otp-hero-art">
          <Image src={dd.championSplash(champ)} alt="" fill unoptimized preload sizes="(max-width: 700px) 75vw, 900px" />
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <Image src={dd.championIcon(champ)} alt="" width={84} height={84} unoptimized className="otp-portrait size-15 sm:size-21" />
          <div>
            <h1 id="champion-name" className="otp-champion-title">{champ.name}</h1>
            <p className="mt-1 text-sm text-[var(--otp-muted)] sm:text-base">{champ.title}</p>
          </div>
        </div>
        {champion && (
          <dl className="mt-5 grid max-w-lg grid-cols-3 gap-2 sm:mt-7">
            <Metric label={`${laneLabel(position)} win rate`} value={<GameRate stat={champion} />} />
            <Metric label="Games" value={champion.games.toLocaleString()} />
            <Metric label="One-tricks" value={oneTricks.toLocaleString()} />
          </dl>
        )}
        <FilterBar
          basePath={basePath}
          platforms={platforms}
          position={position}
          laneGames={laneGames}
          keep={vs ? { vs } : {}}
        />
      </section>

      {!champion ? (
        <div className="otp-panel otp-empty mt-5">
          <Users size={23} aria-hidden />
          <p>No {laneLabel(position).toLowerCase()} games from {champ.name} one-tricks in {regionLabel} yet.</p>
        </div>
      ) : (
        <>
          <section className="otp-section" aria-labelledby="usual-setup">
            <div className="otp-section-heading">
              <div>
                <h2 id="usual-setup">Most-played setup</h2>
                <p>The skill order, items and runes {champ.name} one-tricks use most in {laneLabel(position).toLowerCase()} · {regionLabel}.</p>
              </div>
            </div>
            <div className="grid items-start gap-3 md:grid-cols-3">
              <SkillCard rows={skills} />
              <BuildCard rows={builds} dd={dd} />
              <RuneCard rows={runes} dd={dd} />
            </div>
          </section>

          <section id="matchup" className="otp-section" aria-labelledby="matchup-title">
            <div className="otp-section-heading">
              <div>
                <h2 id="matchup-title">Lane matchups</h2>
                <p>{laneLabel(position)} lane opponents. Choose one to see how {champ.name} one-tricks adapt their setup.</p>
              </div>
            </div>
            <div className={matchupRows.length > 0 ? "otp-matchups" : ""}>
              {matchupRows.length > 0 && (
                <MatchupList
                  rows={matchupRows}
                  selected={opponent ? opponent.id.toLowerCase() : null}
                  baseHref={`${basePath}${filterSearch(platforms, position)}`}
                  minGames={MIN_WR_GAMES}
                />
              )}
              {opponent && matchupDetail ? (
                <MatchupPanel
                  dd={dd}
                  championName={champ.name}
                  opponent={{ name: opponent.name, icon: dd.championIcon(opponent) }}
                  stats={opponentStats}
                  detail={matchupDetail}
                  usual={{ skill: skills[0]?.skill_max, build: builds[0]?.core_items, runes: runes[0]?.perks }}
                />
              ) : (
                <div className="otp-panel otp-empty">
                  <Target size={23} aria-hidden />
                  <h3>{matchupRows.length ? "Choose an opponent" : "No matchup data yet"}</h3>
                  <span>
                    {matchupRows.length
                      ? "Their lane stats and matchup-specific build will appear here."
                      : "Matchups will appear as more games are collected."}
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className="otp-section" aria-labelledby="more-stats">
            <div className="otp-section-heading"><h2 id="more-stats">Boots &amp; players</h2></div>
            <div className="grid items-start gap-3 lg:grid-cols-[1fr_2fr]">
              <Card title="Boots" icon={Footprints}>
                {boots.length ? (
                  <ul className="divide-y divide-[var(--otp-line)]">
                    {boots.map((b) => (
                      <li key={b.boots} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                        <span className="flex items-center gap-2 text-sm">
                          <ItemIcon src={dd.itemIcon(b.boots)} name={dd.itemName(b.boots)} size={32} />
                          <span>{dd.itemName(b.boots)}</span>
                        </span>
                        <Sample stat={b} />
                      </li>
                    ))}
                  </ul>
                ) : <Empty />}
              </Card>
              <Card title={`${champ.name} one-tricks`} icon={Users}>
                {players.length ? (
                  <div className="overflow-x-auto rounded-lg border border-[var(--otp-line)]">
                    <table className="otp-table">
                      <thead>
                        <tr>
                          <th scope="col">Player</th>
                          <th scope="col">Rank</th>
                          <th scope="col">Games</th>
                          <th scope="col">Win rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {players.map((p) => (
                          <tr key={p.puuid}>
                            <th scope="row">
                              <span>{p.game_name || "Unknown"}{p.game_name && p.tag_line && <span className="text-[var(--otp-muted)]">#{p.tag_line}</span>}</span>
                              <span className="block text-xs text-[var(--otp-muted)]">{PLATFORM_LABEL[p.platform] ?? p.platform}</span>
                            </th>
                            <td className="capitalize whitespace-nowrap">{p.tier.toLowerCase()} {p.league_points.toLocaleString()} LP</td>
                            <td>{p.games.toLocaleString()}</td>
                            <td><GameRate stat={p} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <Empty>No player data yet.</Empty>}
              </Card>
            </div>
          </section>
        </>
      )}
    </>
  );
}

function MatchupPanel({
  dd,
  championName,
  opponent,
  stats,
  detail,
  usual,
}: {
  dd: StaticData;
  championName: string;
  opponent: { name: string; icon: string };
  stats: MatchupStat | undefined;
  detail: Awaited<ReturnType<typeof getMatchupDetail>>;
  usual: SetupComparison;
}) {
  return (
    <section id="matchup-detail" tabIndex={-1} aria-labelledby="matchup-detail-title" className="otp-panel otp-matchup-panel space-y-3">
      <div className="flex items-center gap-3">
        <Image src={opponent.icon} alt="" width={46} height={46} unoptimized className="otp-portrait" />
        <div>
          <h3 id="matchup-detail-title" className="text-lg leading-tight font-semibold">{championName} vs {opponent.name}</h3>
          <p className="mt-1 text-xs text-[var(--otp-muted)]">
            {stats?.games.toLocaleString() ?? 0} tracked {stats?.games === 1 ? "game" : "games"}
          </p>
        </div>
      </div>

      {!stats ? (
        <Empty>No games against {opponent.name} yet.</Empty>
      ) : (
        <>
          {stats.games < MIN_WR_GAMES && (
            <p className="rounded-lg bg-[var(--otp-subtle)] px-3 py-2 text-xs text-[var(--otp-muted)]">
              Small sample · under {MIN_WR_GAMES} games
            </p>
          )}
          <dl className="grid grid-cols-2 gap-2 min-[25rem]:grid-cols-4">
            <Metric label="Game WR" value={<GameRate stat={stats} />} />
            <Metric label="Lane WR" value={<Rate value={laneWinRate(stats)} />} />
            <Metric label="Gold @15" value={signed(stats.avg_gold_diff_15)} />
            <Metric label="XP @15" value={signed(stats.avg_xp_diff_15)} />
          </dl>
          <SkillCard rows={detail.skills} usual={usual.skill} nested />
          <BuildCard rows={detail.builds} dd={dd} usual={usual.build} nested />
          <RuneCard rows={detail.runes} dd={dd} usual={usual.runes} nested />
        </>
      )}
    </section>
  );
}
