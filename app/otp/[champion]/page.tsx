import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import MatchupList, { type MatchupRow } from "../components/MatchupList";
import SetupNotice from "../components/SetupNotice";
import {
  adjustedWinRate,
  getChampionDetail,
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

export const revalidate = 3600;

type Props = {
  params: Promise<{ champion: string }>;
  searchParams: Promise<{ vs?: string }>;
};

type StaticData = Awaited<ReturnType<typeof getStaticData>>;

export async function generateMetadata({ params }: Props) {
  const { champion } = await params;
  const dd = await getStaticData();
  const c = dd.championsBySlug.get(champion.toLowerCase());
  return { title: c ? `${c.name} one-trick builds and matchups | One-Trick Stats` : "One-Trick Stats" };
}

// ---- Small building blocks ----

function Pct({ s, min = MIN_WR_GAMES }: { s: StatRow; min?: number }) {
  const wr = winRate(s);
  const color =
    s.games < min ? "text-zinc-500" : wr >= 52 ? "text-emerald-400" : wr <= 48 ? "text-rose-400" : "text-zinc-200";
  return <span className={`tabular-nums ${color}`}>{wr.toFixed(1)}%</span>;
}

function Row({ s }: { s: StatRow }) {
  return (
    <span className="text-sm text-right shrink-0">
      <Pct s={s} />
      <span className="text-zinc-500 ml-2 tabular-nums">{s.games} games</span>
    </span>
  );
}

function Icon({ src, alt, size = 32 }: { src: string; alt: string; size?: number }) {
  return <Image src={src} alt={alt} title={alt} width={size} height={size} unoptimized className="rounded" />;
}

function Card({ title, badge, children }: { title: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">{title}</h3>
        {badge}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-zinc-500">Not enough games yet.</p>;
}

const DifferentBadge = () => (
  <span className="text-xs rounded-full bg-amber-400/15 text-amber-300 px-2 py-0.5">Differs from usual</span>
);

// ---- Setup lists: the most popular option large, alternatives below ----

function SkillCard({ rows, usual }: { rows: SkillStat[]; usual?: string }) {
  const [top, ...rest] = rows;
  return (
    <Card title="Skill max" badge={usual && top && top.skill_max !== usual ? <DifferentBadge /> : null}>
      {top ? (
        <>
          <div className="flex items-center justify-between">
            <span className="font-mono text-2xl text-amber-300">{top.skill_max}</span>
            <Row s={top} />
          </div>
          {rest.length > 0 && (
            <ul className="mt-3 space-y-1 border-t border-zinc-800 pt-2">
              {rest.map((s) => (
                <li key={s.skill_max} className="flex items-center justify-between text-zinc-400">
                  <span className="font-mono">{s.skill_max}</span>
                  <Row s={s} />
                </li>
              ))}
            </ul>
          )}
        </>
      ) : <Empty />}
    </Card>
  );
}

function ItemChain({ ids, dd, size }: { ids: number[]; dd: StaticData; size: number }) {
  return (
    <div className="flex items-center gap-1">
      {ids.map((id, i) => (
        <span key={id} className="flex items-center gap-1">
          {i > 0 && <span className="text-zinc-600">›</span>}
          <Icon src={dd.itemIcon(id)} alt={dd.itemName(id)} size={size} />
        </span>
      ))}
    </div>
  );
}

function BuildCard({ rows, dd, usual }: { rows: BuildStat[]; dd: StaticData; usual?: number[] }) {
  const [top, ...rest] = rows;
  const differs = usual && top && top.core_items.join("-") !== usual.join("-");
  return (
    <Card title="Core build" badge={differs ? <DifferentBadge /> : null}>
      {top ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <ItemChain ids={top.core_items} dd={dd} size={40} />
            <Row s={top} />
          </div>
          <p className="mt-1 text-xs text-zinc-500">{top.core_items.map(dd.itemName).join(" › ")}</p>
          {rest.length > 0 && (
            <ul className="mt-3 space-y-2 border-t border-zinc-800 pt-2">
              {rest.map((b) => (
                <li key={b.core_items.join("-")} className="flex items-center justify-between gap-3">
                  <ItemChain ids={b.core_items} dd={dd} size={28} />
                  <Row s={b} />
                </li>
              ))}
            </ul>
          )}
        </>
      ) : <Empty />}
    </Card>
  );
}

function RuneIcons({ perks, dd, size }: { perks: number[]; dd: StaticData; size: number }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {perks.map((id, i) => {
        const rune = dd.rune(id);
        return rune ? <Icon key={id} src={dd.runeIcon(rune)} alt={rune.name} size={i === 0 ? size + 12 : size} /> : null;
      })}
    </div>
  );
}

function RuneCard({ rows, dd, usual }: { rows: RuneStat[]; dd: StaticData; usual?: number[] }) {
  const [top, ...rest] = rows;
  const differs = usual && top && top.perks.join("-") !== usual.join("-");
  return (
    <Card title="Runes" badge={differs ? <DifferentBadge /> : null}>
      {top ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <RuneIcons perks={top.perks} dd={dd} size={28} />
            <Row s={top} />
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {top.perks.map((id) => dd.rune(id)?.name ?? id).join(" · ")}
          </p>
          {rest.length > 0 && (
            <ul className="mt-3 space-y-2 border-t border-zinc-800 pt-2">
              {rest.map((r) => (
                <li key={r.perks.join("-")} className="flex items-center justify-between gap-3">
                  <RuneIcons perks={r.perks} dd={dd} size={20} />
                  <Row s={r} />
                </li>
              ))}
            </ul>
          )}
        </>
      ) : <Empty />}
    </Card>
  );
}

// ---- Page ----

export default async function ChampionPage({ params, searchParams }: Props) {
  if (!isConfigured()) return <SetupNotice />;

  const [{ champion: slug }, { vs }] = await Promise.all([params, searchParams]);
  const dd = await getStaticData();
  const champ = dd.championsBySlug.get(slug.toLowerCase());
  if (!champ) notFound();
  const championId = Number(champ.key);

  const [{ champion, builds, boots, runes, skills, players }, matchups] = await Promise.all([
    getChampionDetail(championId),
    getMatchups(championId),
  ]);

  const opponent = vs ? dd.championsBySlug.get(vs.toLowerCase()) : undefined;
  const opponentStats = opponent ? matchups.find((m) => m.opponent_champion_id === Number(opponent.key)) : undefined;
  const matchupDetail = opponent ? await getMatchupDetail(championId, Number(opponent.key)) : null;

  const baseline = champion ? winRate(champion) : 50;
  const matchupRows: MatchupRow[] = matchups.flatMap((m) => {
    const c = dd.championsByKey.get(m.opponent_champion_id);
    if (!c) return [];
    return [{
      slug: c.id.toLowerCase(),
      name: c.name,
      icon: dd.championIcon(c),
      games: m.games,
      winRate: winRate(m),
      adjustedWinRate: adjustedWinRate(m, baseline),
      laneWinRate: laneWinRate(m),
      goldDiff15: m.avg_gold_diff_15,
      xpDiff15: m.avg_xp_diff_15,
    }];
  });

  return (
    <div>
      <Link href="/otp" className="text-sm text-zinc-400 hover:text-zinc-200">
        ← All champions
      </Link>

      <div className="mt-4 flex items-center gap-4">
        <Icon src={dd.championIcon(champ)} alt={champ.name} size={72} />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{champ.name}</h1>
          <p className="text-zinc-400 text-sm capitalize">{champ.title}</p>
        </div>
      </div>

      {!champion ? (
        <p className="mt-8 text-zinc-400">No Master+ one-tricks found for {champ.name} yet.</p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-3 gap-3 max-w-lg">
            <Stat label="Win rate" value={<Pct s={champion} />} />
            <Stat label="Games" value={champion.games.toLocaleString()} />
            <Stat label="One-tricks" value={champion.one_tricks} />
          </div>

          <h2 className="mt-10 text-xl font-semibold">What {champ.name} one-tricks usually run</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <SkillCard rows={skills} />
            <BuildCard rows={builds} dd={dd} />
            <RuneCard rows={runes} dd={dd} />
          </div>

          <h2 id="matchup" className="mt-12 text-xl font-semibold scroll-mt-6">Matchups</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Lane opponents of {champ.name} one-tricks. Pick one to see what they change for it.
          </p>
          <div className="mt-4 grid gap-6 lg:grid-cols-2 items-start">
            <div className="lg:order-last lg:sticky lg:top-4">
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
                <div className="rounded-lg border border-dashed border-zinc-800 p-6 text-sm text-zinc-500">
                  {matchupRows.length
                    ? "Pick an opponent to see the skill max, build and runes one-tricks use into them."
                    : "No matchup data yet. It fills in as the collector gathers games."}
                </div>
              )}
            </div>
            <MatchupList
              rows={matchupRows}
              selected={opponent ? opponent.id.toLowerCase() : null}
              baseHref={`/otp/${champ.id.toLowerCase()}`}
              minGames={MIN_WR_GAMES}
            />
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-2">
            <Card title="Boots">
              {boots.length ? (
                <ul className="space-y-2">
                  {boots.map((b) => (
                    <li key={b.boots} className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Icon src={dd.itemIcon(b.boots)} alt={dd.itemName(b.boots)} />
                        <span className="text-sm">{dd.itemName(b.boots)}</span>
                      </span>
                      <Row s={b} />
                    </li>
                  ))}
                </ul>
              ) : <Empty />}
            </Card>

            <Card title={`${champ.name} one-tricks`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-zinc-400">
                    <tr>
                      <th className="py-1 text-left font-medium">Player</th>
                      <th className="py-1 text-left font-medium">Rank</th>
                      <th className="py-1 text-right font-medium">Games</th>
                      <th className="py-1 text-right font-medium">Win rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((p) => (
                      <tr key={p.puuid} className="border-t border-zinc-800">
                        <td className="py-2">
                          <span className="text-xs text-zinc-500 mr-2">{PLATFORM_LABEL[p.platform] ?? p.platform}</span>
                          {p.game_name ? (
                            <>
                              {p.game_name}
                              <span className="text-zinc-500">#{p.tag_line}</span>
                            </>
                          ) : (
                            <span className="text-zinc-500">Unknown</span>
                          )}
                        </td>
                        <td className="py-2 capitalize">
                          {p.tier.toLowerCase()} {p.league_points} LP
                        </td>
                        <td className="py-2 text-right tabular-nums">{p.games}</td>
                        <td className="py-2 text-right"><Pct s={p} min={10} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
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
  usual: { skill?: string; build?: number[]; runes?: number[] };
}) {
  const lane = stats ? laneWinRate(stats) : null;
  const signed = (n: number | null | undefined) => (n == null ? "–" : `${n > 0 ? "+" : ""}${n.toLocaleString()}`);

  return (
    <div className="rounded-lg border border-amber-400/40 bg-zinc-900/60 p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Icon src={opponent.icon} alt={opponent.name} size={48} />
        <div>
          <h3 className="text-lg font-semibold">
            {championName} vs {opponent.name}
          </h3>
          <p className="text-sm text-zinc-400">
            Sample size: <span className="text-zinc-100 font-medium">{stats?.games ?? 0} games</span>
          </p>
        </div>
      </div>

      {!stats ? (
        <p className="text-sm text-zinc-500">No games against {opponent.name} yet.</p>
      ) : (
        <>
          {stats.games < MIN_WR_GAMES && (
            <p className="text-xs rounded-md bg-zinc-800 text-zinc-300 px-3 py-2">
              Small sample: under {MIN_WR_GAMES} games, so treat the win rates as a rough signal.
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Stat label="Game WR" value={<Pct s={stats} />} />
            <Stat label="Lane WR" value={lane === null ? "–" : `${lane.toFixed(1)}%`} />
            <Stat label="Gold @15" value={signed(stats.avg_gold_diff_15)} />
            <Stat label="XP @15" value={signed(stats.avg_xp_diff_15)} />
          </div>
          <SkillCard rows={detail.skills} usual={usual.skill} />
          <BuildCard rows={detail.builds} dd={dd} usual={usual.build} />
          <RuneCard rows={detail.runes} dd={dd} usual={usual.runes} />
        </>
      )}
    </div>
  );
}
