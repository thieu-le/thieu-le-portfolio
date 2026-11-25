// Reads and validates collector settings from the environment. Fails fast so a
// misconfigured scheduled run dies in the first second, not an hour in.

export type Platform = 'na1' | 'euw1' | 'kr' | 'eun1' | 'br1' | 'la1' | 'la2' | 'oc1' | 'tr1' | 'ru' | 'jp1' | 'vn2' | 'sg2' | 'tw2';
export type Regional = 'americas' | 'europe' | 'asia' | 'sea';

// Platform shard -> regional host for match-v5 and account-v1.
// China is not here on purpose: its servers are run by Tencent and the Riot
// API has no endpoints for them.
export const REGIONAL_FOR: Record<Platform, Regional> = {
  na1: 'americas',
  br1: 'americas',
  la1: 'americas',
  la2: 'americas',
  oc1: 'sea',
  euw1: 'europe',
  eun1: 'europe',
  tr1: 'europe',
  ru: 'europe',
  kr: 'asia',
  jp1: 'asia',
  vn2: 'sea',
  sg2: 'sea',
  tw2: 'sea',
};

function required(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing required env var ${name}`);
  return v;
}

function optional(name: string, fallback: string): string {
  const v = process.env[name]?.trim();
  return v ? v : fallback;
}

function num(name: string, fallback: number): number {
  const raw = optional(name, String(fallback));
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`${name} must be a number (got "${raw}")`);
  return n;
}

/** "18:1,90:120" -> [{ count: 18, seconds: 1 }, { count: 90, seconds: 120 }] */
function parseLimits(raw: string): { count: number; seconds: number }[] {
  return raw.split(',').map((part) => {
    const [count, seconds] = part.split(':').map(Number);
    if (!(count > 0) || !(seconds > 0)) throw new Error(`Bad RIOT_RATE_LIMITS entry "${part}"`);
    return { count, seconds };
  });
}

const platforms = optional('OTP_PLATFORMS', 'na1,euw1,kr')
  .split(',')
  .map((p) => p.trim().toLowerCase())
  .filter(Boolean) as Platform[];
for (const p of platforms) {
  if (!(p in REGIONAL_FOR)) throw new Error(`Unknown platform "${p}" in OTP_PLATFORMS`);
}

export const config = Object.freeze({
  riotApiKey: required('RIOT_API_KEY'),
  supabaseUrl: optional('SUPABASE_URL', 'https://fakrushrdxmwqijzoakn.supabase.co').replace(/\/$/, ''),
  supabaseServiceKey: required('SUPABASE_SERVICE_ROLE_KEY'),

  platforms,

  // Per-host limits, kept ~10% under Riot's personal-key limits
  // (20 req / 1 s and 100 req / 2 min, enforced per routing value).
  // With a production key, raise to e.g. "450:10,27000:600".
  rateLimits: parseLimits(optional('RIOT_RATE_LIMITS', '18:1,90:120')),

  // A player is a one-trick when their most-played champion is at least this
  // share of their last CLASSIFY_SAMPLE ranked solo games...
  oneTrickShare: num('OTP_SHARE', 0.6),
  classifySample: num('OTP_CLASSIFY_SAMPLE', 20),
  // ...and they have at least this many games in the sample.
  minSampleGames: num('OTP_MIN_GAMES', 12),
  // Cheap prefilter before spending ~20 match calls on a player: their top
  // champion must hold this share of their top-10 mastery points.
  masteryPrefilterShare: num('OTP_MASTERY_PREFILTER', 0.3),
  reclassifyDays: num('OTP_RECLASSIFY_DAYS', 7),

  // Coverage first: a champion stops getting priority once it has this many
  // known one-tricks. Until every champion's candidates are exhausted or
  // covered, known one-tricks are only refreshed with leftover time.
  championTarget: num('OTP_CHAMPION_TARGET', 5),
  // How far back to pull a newly found one-trick's games.
  // Capped at OTP_RAW_DAYS: older games would be rolled up straight away, and
  // never fetching games older than the raw window is what keeps rollups from
  // double counting.
  backfillDays: num('OTP_BACKFILL_DAYS', 14),
  // Minimum gap between new-game checks for a known one-trick.
  updateHours: num('OTP_UPDATE_HOURS', 24),

  fetchTimelines: optional('OTP_FETCH_TIMELINES', 'true') === 'true',
  // Per-game rows are kept this long, then folded into per-patch rollup tables
  // (otp_rollup_games in Postgres). Rollups keep the newest OTP_KEEP_PATCHES patches.
  rawDays: num('OTP_RAW_DAYS', 14),
  keepPatches: num('OTP_KEEP_PATCHES', 6),

  // Stop starting new work after this long so a scheduled run never overlaps
  // the next one. In-flight requests still finish.
  maxRuntimeMinutes: num('OTP_MAX_RUNTIME_MINUTES', 50),
});
