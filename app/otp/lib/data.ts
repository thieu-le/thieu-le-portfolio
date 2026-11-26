// Server-only data access for /otp. Reads the public Supabase views with the
// anon key and Data Dragon for names and icons. Everything is cached for an
// hour so most visits never touch Supabase (free tier: 5 GB egress / month).
// Import only from server components: the env vars aren't NEXT_PUBLIC.

const REVALIDATE = 3600;
const DDRAGON = "https://ddragon.leagueoflegends.com";

export type StatRow = { games: number; wins: number };
/** One row per champion x region x lane. */
export type ChampionStat = StatRow & { champion_id: number; platform: string; position: string; latest_patch: string };
export type OneTrickCount = { champion_id: number; platform: string; one_tricks: number };
/**
 * Win probability sums for WPA (see docs/WPA.md): games with a game-state
 * snapshot when the first core item was finished, their wins, and the summed
 * win probability at that moment.
 */
export type WpSums = { wp_games: number; wp_wins: number; wp_sum: number };
export type BuildStat = StatRow & Partial<WpSums> & { core_items: number[] };
export type BootsStat = StatRow & { boots: number };
export type RuneStat = StatRow & { keystone: number; primary_style: number; sub_style: number; perks: number[] };
export type SkillStat = StatRow & { skill_max: string };
export type PlayerStat = StatRow & {
  puuid: string;
  platform: string;
  game_name: string | null;
  tag_line: string | null;
  tier: string;
  league_points: number;
};

// The project URL and anon key are public by design: the anon role can only
// SELECT (enforced by RLS, see supabase/migrations). Env vars override them.
const SUPABASE_URL = process.env.SUPABASE_URL || "https://fakrushrdxmwqijzoakn.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZha3J1c2hyZHhtd3FpanpvYWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU1NzIwNzksImV4cCI6MjExMTE0ODA3OX0.o9R_nuukH08c_k6TE0dEjhhgcVgsXvyv3bZFqvAOaCk";

export function isConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

async function view<T>(name: string, query: string): Promise<T[]> {
  const url = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${name}?${query}`;
  const key = SUPABASE_ANON_KEY;
  const res = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    next: { revalidate: REVALIDATE, tags: ["otp"] },
  });
  if (!res.ok) throw new Error(`Supabase ${name} ${res.status}: ${await res.text()}`);
  return res.json();
}

/** Like `view`, but pages past PostgREST's 1000-row cap. `query` needs a stable order. */
async function viewAll<T>(name: string, query: string): Promise<T[]> {
  const out: T[] = [];
  for (let offset = 0; ; offset += 1000) {
    const rows = await view<T>(name, `${query}&limit=1000&offset=${offset}`);
    out.push(...rows);
    if (rows.length < 1000) return out;
  }
}

/** Sums rows that share a key (the same build across regions), most games first. */
const SUMMED = ["games", "wins", "wp_games", "wp_wins", "wp_sum"] as const;

export function merge<T extends StatRow>(rows: T[], key: (r: T) => string, limit = Infinity): T[] {
  const byKey = new Map<string, T>();
  for (const r of rows) {
    const k = key(r);
    const seen = byKey.get(k) as Record<string, unknown> | undefined;
    if (seen) {
      for (const f of SUMMED) {
        const v = (r as Record<string, unknown>)[f];
        if (typeof v === "number") seen[f] = ((seen[f] as number | undefined) ?? 0) + v;
      }
    } else {
      byKey.set(k, { ...r });
    }
  }
  return [...byKey.values()].sort((a, b) => b.games - a.games).slice(0, limit);
}

const scope = (championId: number, platforms: string[], position: string) =>
  `champion_id=eq.${championId}&platform=in.(${platforms.join(",")})&position=eq.${position}`;

/** Every champion x region x lane row, plus one-trick counts per region. Filtered on the page. */
export async function getChampionOverview() {
  const [stats, oneTricks] = await Promise.all([
    viewAll<ChampionStat>("otp_champion_stats", "select=*&order=champion_id,platform,position"),
    viewAll<OneTrickCount>("otp_champion_one_tricks", "select=*&order=champion_id,platform"),
  ]);
  return { stats, oneTricks };
}

/** One champion's rows for every region and lane: picks the lane tabs and the default lane. */
export async function getChampionSummary(championId: number) {
  const c = `champion_id=eq.${championId}`;
  const [stats, oneTricks] = await Promise.all([
    view<ChampionStat>("otp_champion_stats", `select=*&${c}`),
    view<OneTrickCount>("otp_champion_one_tricks", `select=*&${c}`),
  ]);
  return { stats, oneTricks };
}

export async function getChampionDetail(championId: number, platforms: string[], position: string) {
  const c = scope(championId, platforms, position);
  const [builds, boots, runes, skills, players] = await Promise.all([
    view<BuildStat>("otp_build_stats", `select=core_items,games,wins,wp_games,wp_wins,wp_sum&${c}&order=games.desc&limit=300`),
    view<BootsStat>("otp_boots_stats", `select=boots,games,wins&${c}&order=games.desc&limit=60`),
    view<RuneStat>("otp_rune_stats", `select=keystone,primary_style,sub_style,perks,games,wins&${c}&order=games.desc&limit=300`),
    view<SkillStat>("otp_skill_stats", `select=skill_max,games,wins&${c}&order=games.desc&limit=60`),
    view<PlayerStat>("otp_player_stats", `select=puuid,platform,game_name,tag_line,tier,league_points,games,wins&${c}&order=games.desc&limit=300`),
  ]);
  return {
    builds: merge(builds, (b) => b.core_items.join("-"), 8),
    boots: merge(boots, (b) => String(b.boots), 4),
    runes: merge(runes, (r) => `${r.primary_style}-${r.sub_style}-${r.perks.join("-")}`, 5),
    skills: merge(skills, (s) => s.skill_max, 3),
    players: merge(players, (p) => p.puuid, 25),
  };
}

export type MatchupStat = StatRow & {
  opponent_champion_id: number;
  lane_games: number;
  lane_wins: number;
  lane_losses: number;
  gold_diff_15_sum: number;
  xp_diff_15_sum: number;
  /** Games with a 15:00 game state, and their summed win probability then. */
  wp15_games: number;
  wp15_sum: number;
  /** Average leads at 15:00 over games with lane data. */
  avg_gold_diff_15: number | null;
  avg_xp_diff_15: number | null;
};

export async function getMatchups(championId: number, platforms: string[], position: string): Promise<MatchupStat[]> {
  const rows = await view<MatchupStat>("otp_matchup_stats", `select=*&${scope(championId, platforms, position)}&limit=1000`);
  const byOpponent = new Map<number, MatchupStat>();
  for (const r of rows) {
    const m = byOpponent.get(r.opponent_champion_id);
    if (!m) {
      byOpponent.set(r.opponent_champion_id, {
        ...r,
        gold_diff_15_sum: Number(r.gold_diff_15_sum),
        xp_diff_15_sum: Number(r.xp_diff_15_sum),
        wp15_games: r.wp15_games ?? 0,
        wp15_sum: r.wp15_sum ?? 0,
      });
      continue;
    }
    m.games += r.games;
    m.wins += r.wins;
    m.lane_games += r.lane_games;
    m.lane_wins += r.lane_wins;
    m.lane_losses += r.lane_losses;
    m.gold_diff_15_sum += Number(r.gold_diff_15_sum);
    m.xp_diff_15_sum += Number(r.xp_diff_15_sum);
    m.wp15_games += r.wp15_games ?? 0;
    m.wp15_sum += r.wp15_sum ?? 0;
  }
  return [...byOpponent.values()]
    .map((m) => ({
      ...m,
      avg_gold_diff_15: m.lane_games ? Math.round(m.gold_diff_15_sum / m.lane_games) : null,
      avg_xp_diff_15: m.lane_games ? Math.round(m.xp_diff_15_sum / m.lane_games) : null,
    }))
    .sort((a, b) => b.games - a.games);
}

export async function getMatchupDetail(championId: number, opponentId: number, platforms: string[], position: string) {
  const c = `${scope(championId, platforms, position)}&opponent_champion_id=eq.${opponentId}`;
  const [builds, runes, skills] = await Promise.all([
    view<BuildStat>("otp_matchup_build_stats", `select=core_items,games,wins,wp_games,wp_wins,wp_sum&${c}&order=games.desc&limit=200`),
    view<RuneStat>("otp_matchup_rune_stats", `select=keystone,primary_style,sub_style,perks,games,wins&${c}&order=games.desc&limit=200`),
    view<SkillStat>("otp_matchup_skill_stats", `select=skill_max,games,wins&${c}&order=games.desc&limit=60`),
  ]);
  return {
    builds: merge(builds, (b) => b.core_items.join("-"), 5),
    runes: merge(runes, (r) => `${r.primary_style}-${r.sub_style}-${r.perks.join("-")}`, 4),
    skills: merge(skills, (s) => s.skill_max, 3),
  };
}

/**
 * Lane win rate from gold and XP leads at 15:00: ahead in both counts as a
 * win, behind in both as a loss, mixed as half. Null without lane data.
 */
export function laneWinRate(m: Pick<MatchupStat, "lane_games" | "lane_wins" | "lane_losses">): number | null {
  if (!m.lane_games) return null;
  const even = m.lane_games - m.lane_wins - m.lane_losses;
  return (100 * (m.lane_wins + even / 2)) / m.lane_games;
}

/** Below this many games a win rate is shown greyed out and not trusted for sorting. */
export const MIN_WR_GAMES = 20;

/**
 * Win rate pulled toward `baseline` (the champion's overall win rate) by
 * `weight` phantom games, so a 4-1 matchup doesn't rank as the hardest counter.
 */
export function adjustedWinRate(s: StatRow, baseline: number, weight = MIN_WR_GAMES): number {
  return (s.wins + (weight * baseline) / 100) / (s.games + weight) * 100;
}

/**
 * Combined gold + XP lead at 15:00, pulled toward 0 by `weight` phantom even
 * games so a +2000 lead over 2 games doesn't rank as the easiest lane.
 */
export function adjustedLaneLead(m: Pick<MatchupStat, "lane_games" | "gold_diff_15_sum" | "xp_diff_15_sum">, weight = 10): number | null {
  if (!m.lane_games) return null;
  return (m.gold_diff_15_sum + m.xp_diff_15_sum) / (m.lane_games + weight);
}

// ---- Win probability added (docs/WPA.md) ----

/** Below this many games with a game state, WPA is marked as a small sample. */
export const MIN_WPA_GAMES = 20;

/**
 * Win probability added, in percentage points per game: wins minus the win
 * probability the model gave when the first core item was finished. Null
 * without snapshots.
 */
export function wpa(s: Partial<WpSums>): number | null {
  if (!s.wp_games) return null;
  return (100 * ((s.wp_wins ?? 0) - (s.wp_sum ?? 0))) / s.wp_games;
}

/** Average win probability when the first core item was finished, in percent. */
export function wpAtPurchase(s: Partial<WpSums>): number | null {
  if (!s.wp_games) return null;
  return (100 * (s.wp_sum ?? 0)) / s.wp_games;
}

/** Win probability at 15:00 minus 50%: how much the laning phase moved the game. */
export function laneWpa(m: Pick<MatchupStat, "wp15_games" | "wp15_sum">): number | null {
  if (!m.wp15_games) return null;
  return 100 * (m.wp15_sum / m.wp15_games - 0.5);
}

/** laneWpa pulled toward 0 by `weight` phantom even games, for sorting. */
export function adjustedLaneWpa(m: Pick<MatchupStat, "wp15_games" | "wp15_sum">, weight = 10): number | null {
  if (!m.wp15_games) return null;
  return (100 * (m.wp15_sum - 0.5 * m.wp15_games)) / (m.wp15_games + weight);
}

export type WinModel = { trained_at: string; samples: number; accuracy: number | null; ece: number | null };

/** The newest win probability model's stats, or null before the first training. */
export async function getWinModel(): Promise<WinModel | null> {
  const [model] = await view<WinModel>("otp_wp_model", "select=trained_at,samples,accuracy,ece&order=trained_at.desc&limit=1");
  return model ?? null;
}

// ---- Data Dragon ----

type DDChampion = { id: string; key: string; name: string; title: string };
type DDRune = { id: number; key: string; name: string; icon: string };
type DDTree = DDRune & { slots: { runes: DDRune[] }[] };

async function dd<T>(path: string): Promise<T> {
  const res = await fetch(`${DDRAGON}${path}`, { next: { revalidate: 86_400 } });
  if (!res.ok) throw new Error(`Data Dragon ${path} ${res.status}`);
  return res.json();
}

export async function getStaticData() {
  const [version] = await dd<string[]>("/api/versions.json");
  const [champs, items, trees] = await Promise.all([
    dd<{ data: Record<string, DDChampion> }>(`/cdn/${version}/data/en_US/champion.json`),
    dd<{ data: Record<string, { name: string }> }>(`/cdn/${version}/data/en_US/item.json`),
    dd<DDTree[]>(`/cdn/${version}/data/en_US/runesReforged.json`),
  ]);

  const championsByKey = new Map<number, DDChampion>();
  const championsBySlug = new Map<string, DDChampion>();
  for (const c of Object.values(champs.data)) {
    championsByKey.set(Number(c.key), c);
    championsBySlug.set(c.id.toLowerCase(), c);
  }

  const runes = new Map<number, DDRune>();
  for (const tree of trees) {
    runes.set(tree.id, tree);
    for (const slot of tree.slots) for (const r of slot.runes) runes.set(r.id, r);
  }

  return {
    version,
    championsByKey,
    championsBySlug,
    itemName: (id: number) => items.data[String(id)]?.name ?? `Item ${id}`,
    rune: (id: number) => runes.get(id),
    championIcon: (c: DDChampion) => `${DDRAGON}/cdn/${version}/img/champion/${c.id}.png`,
    championSplash: (c: DDChampion) => `${DDRAGON}/cdn/img/champion/splash/${c.id}_0.jpg`,
    itemIcon: (id: number) => `${DDRAGON}/cdn/${version}/img/item/${id}.png`,
    runeIcon: (r: DDRune) => `${DDRAGON}/cdn/img/${r.icon}`,
  };
}

export const winRate = (s: StatRow) => (s.games ? (100 * s.wins) / s.games : 0);

export const PLATFORM_LABEL: Record<string, string> = { na1: "NA", euw1: "EUW", kr: "KR" };
