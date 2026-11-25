// Server-only data access for /otp. Reads the public Supabase views with the
// anon key and Data Dragon for names and icons. Everything is cached for an
// hour so most visits never touch Supabase (free tier: 5 GB egress / month).
// Import only from server components: the env vars aren't NEXT_PUBLIC.

const REVALIDATE = 3600;
const DDRAGON = "https://ddragon.leagueoflegends.com";

export type StatRow = { games: number; wins: number };
export type ChampionStat = StatRow & { champion_id: number; one_tricks: number; latest_patch: string };
export type BuildStat = StatRow & { core_items: number[] };
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

export const getChampionStats = () =>
  view<ChampionStat>("otp_champion_stats", "select=*&order=games.desc");

export async function getChampionDetail(championId: number) {
  const c = `champion_id=eq.${championId}`;
  const [champion, builds, boots, runes, skills, players] = await Promise.all([
    view<ChampionStat>("otp_champion_stats", `select=*&${c}`),
    view<BuildStat>("otp_build_stats", `select=core_items,games,wins&${c}&order=games.desc&limit=8`),
    view<BootsStat>("otp_boots_stats", `select=boots,games,wins&${c}&order=games.desc&limit=4`),
    view<RuneStat>("otp_rune_stats", `select=keystone,primary_style,sub_style,perks,games,wins&${c}&order=games.desc&limit=5`),
    view<SkillStat>("otp_skill_stats", `select=skill_max,games,wins&${c}&order=games.desc&limit=3`),
    view<PlayerStat>("otp_player_stats", `select=*&${c}&order=games.desc&limit=25`),
  ]);
  return { champion: champion[0] ?? null, builds, boots, runes, skills, players };
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
    itemIcon: (id: number) => `${DDRAGON}/cdn/${version}/img/item/${id}.png`,
    runeIcon: (r: DDRune) => `${DDRAGON}/cdn/img/${r.icon}`,
  };
}

export const winRate = (s: StatRow) => (s.games ? (100 * s.wins) / s.games : 0);

export const PLATFORM_LABEL: Record<string, string> = { na1: "NA", euw1: "EUW", kr: "KR" };
