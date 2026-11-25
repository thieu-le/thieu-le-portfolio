import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import SetupNotice from "../components/SetupNotice";
import {
  getChampionDetail,
  getStaticData,
  isConfigured,
  PLATFORM_LABEL,
  winRate,
  type StatRow,
} from "../lib/data";

export const revalidate = 3600;

type Props = { params: Promise<{ champion: string }> };

export async function generateMetadata({ params }: Props) {
  const { champion } = await params;
  const dd = await getStaticData();
  const c = dd.championsBySlug.get(champion.toLowerCase());
  return { title: c ? `${c.name} one-trick builds | One-Trick Stats` : "One-Trick Stats" };
}

function Pct({ s }: { s: StatRow }) {
  const wr = winRate(s);
  const color = wr >= 52 ? "text-emerald-400" : wr <= 48 ? "text-rose-400" : "text-zinc-200";
  return <span className={`tabular-nums ${color}`}>{wr.toFixed(1)}%</span>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Icon({ src, alt, size = 32 }: { src: string; alt: string; size?: number }) {
  return <Image src={src} alt={alt} title={alt} width={size} height={size} unoptimized className="rounded" />;
}

function Empty() {
  return <p className="text-sm text-zinc-500">Not enough games yet.</p>;
}

export default async function ChampionPage({ params }: Props) {
  if (!isConfigured()) return <SetupNotice />;

  const { champion: slug } = await params;
  const dd = await getStaticData();
  const champ = dd.championsBySlug.get(slug.toLowerCase());
  if (!champ) notFound();

  const { champion, builds, boots, runes, skills, players } = await getChampionDetail(Number(champ.key));

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

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <Section title="Core builds (first 3 items)">
              {builds.length ? (
                <ul className="space-y-2">
                  {builds.map((b) => (
                    <li key={b.core_items.join("-")} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1">
                        {b.core_items.map((id, i) => (
                          <span key={id} className="flex items-center gap-1">
                            {i > 0 && <span className="text-zinc-600">›</span>}
                            <Icon src={dd.itemIcon(id)} alt={dd.itemName(id)} />
                          </span>
                        ))}
                      </div>
                      <Row s={b} />
                    </li>
                  ))}
                </ul>
              ) : <Empty />}
            </Section>

            <Section title="Runes">
              {runes.length ? (
                <ul className="space-y-3">
                  {runes.map((r) => (
                    <li key={r.perks.join("-")} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {r.perks.map((id, i) => {
                          const rune = dd.rune(id);
                          return rune ? (
                            <Icon key={id} src={dd.runeIcon(rune)} alt={rune.name} size={i === 0 ? 36 : 24} />
                          ) : null;
                        })}
                      </div>
                      <Row s={r} />
                    </li>
                  ))}
                </ul>
              ) : <Empty />}
            </Section>

            <Section title="Skill max order">
              {skills.length ? (
                <ul className="space-y-2">
                  {skills.map((s) => (
                    <li key={s.skill_max} className="flex items-center justify-between">
                      <span className="font-mono text-amber-300">{s.skill_max}</span>
                      <Row s={s} />
                    </li>
                  ))}
                </ul>
              ) : <Empty />}
            </Section>

            <Section title="Boots">
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
            </Section>
          </div>

          <div className="mt-4">
            <Section title={`${champ.name} one-tricks`}>
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
                        <td className="py-2 text-right"><Pct s={p} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        </>
      )}
    </div>
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

function Row({ s }: { s: StatRow }) {
  return (
    <span className="text-sm text-right shrink-0">
      <Pct s={s} />
      <span className="text-zinc-500 ml-2 tabular-nums">{s.games} games</span>
    </span>
  );
}
