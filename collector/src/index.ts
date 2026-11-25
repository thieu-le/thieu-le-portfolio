// One-trick collector. Run with: node collector/src/index.ts
//
// Each run, per platform (all platforms in parallel, each on its own Riot
// rate-limit budget):
//   1. Refresh the Challenger / Grandmaster / Master ladders (3 calls).
//   2. Pull new solo-queue games for known one-tricks (cheapest, freshest data).
//   3. Fill in Riot IDs for one-tricks that don't have one yet.
//   4. Classify unclassified or stale players with whatever time is left.
// Then prune games older than the retention window.
//
// Runs are resumable: every player stores when it was last checked, so a run
// cut short by OTP_MAX_RUNTIME_MINUTES picks up where the last one stopped.

import { config, type Platform } from './config.ts';
import { remove, select, update, upsert } from './db.ts';
import { loadItemCatalog, type ItemCatalog } from './dataDragon.ts';
import { findParticipant, fromTimeline, isRemake, toGameRow, type GameRow } from './extract.ts';
import { log } from './log.ts';
import {
  getAccount,
  getApexLeague,
  getMatch,
  getSoloMatchIds,
  getTimeline,
  getTopMasteries,
  requestStats,
  RiotNotFound,
  type Match,
} from './riot.ts';

const startedAt = Date.now();
const deadline = startedAt + config.maxRuntimeMinutes * 60_000;
const hasTime = () => Date.now() < deadline;
const nowIso = () => new Date().toISOString();
const daysAgoIso = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

type PlayerRow = {
  puuid: string;
  platform: Platform;
  main_champion_id: number | null;
  last_match_check_at: string | null;
};

// ---- Step 1: apex ladders ----

async function refreshApex(platform: Platform): Promise<number> {
  const seenAt = nowIso();
  let total = 0;
  for (const tier of ['challenger', 'grandmaster', 'master'] as const) {
    const league = await getApexLeague(platform, tier);
    const rows = league.entries
      .filter((e) => e.puuid)
      .map((e) => ({
        puuid: e.puuid,
        platform,
        tier: league.tier,
        league_points: e.leaguePoints,
        last_seen_apex_at: seenAt,
        updated_at: seenAt,
      }));
    await upsert('otp_players', rows);
    total += rows.length;
  }
  return total;
}

// ---- Shared: fetch a match + timeline and build the row ----

async function buildRow(platform: Platform, match: Match, puuid: string, items: ItemCatalog): Promise<GameRow | null> {
  const p = findParticipant(match, puuid);
  if (!p || isRemake(match, p)) return null;
  let derived = null;
  if (config.fetchTimelines) {
    try {
      derived = fromTimeline(await getTimeline(platform, match.metadata.matchId), p.participantId, items);
    } catch (err) {
      if (!(err instanceof RiotNotFound)) throw err;
    }
  }
  return toGameRow(match, p, platform, derived);
}

async function fetchMatch(platform: Platform, matchId: string): Promise<Match | null> {
  try {
    return await getMatch(platform, matchId);
  } catch (err) {
    if (err instanceof RiotNotFound) return null;
    throw err;
  }
}

// ---- Step 2: new games for known one-tricks ----

async function updateOneTricks(platform: Platform, items: ItemCatalog): Promise<number> {
  const players = await select<PlayerRow>(
    'otp_players',
    `select=puuid,platform,main_champion_id,last_match_check_at&platform=eq.${platform}` +
      `&is_one_trick=is.true&last_seen_apex_at=gte.${daysAgoIso(3)}` +
      `&order=last_match_check_at.asc.nullsfirst`,
  );

  let stored = 0;
  for (const player of players) {
    if (!hasTime()) break;
    const checkStartedAt = nowIso();
    const since = player.last_match_check_at ?? daysAgoIso(config.retentionDays);
    const ids = await getSoloMatchIds(platform, player.puuid, {
      count: 100,
      startTime: Math.floor(Date.parse(since) / 1000),
    });

    const rows: GameRow[] = [];
    for (const id of ids) {
      const match = await fetchMatch(platform, id);
      if (!match) continue;
      const p = findParticipant(match, player.puuid);
      if (!p || p.championId !== player.main_champion_id) continue;
      const row = await buildRow(platform, match, player.puuid, items);
      if (row) rows.push(row);
    }
    await upsert('otp_games', rows);
    await update('otp_players', { puuid: `eq.${player.puuid}` }, { last_match_check_at: checkStartedAt });
    stored += rows.length;
  }
  return stored;
}

// ---- Step 3: Riot IDs for display ----

async function fillNames(platform: Platform): Promise<void> {
  const players = await select<{ puuid: string }>(
    'otp_players',
    `select=puuid&platform=eq.${platform}&is_one_trick=is.true` +
      `&or=(last_account_check_at.is.null,last_account_check_at.lt.${daysAgoIso(7)})`,
  );
  for (const { puuid } of players) {
    if (!hasTime()) return;
    try {
      const acct = await getAccount(platform, puuid);
      await update('otp_players', { puuid: `eq.${puuid}` }, {
        game_name: acct.gameName ?? null,
        tag_line: acct.tagLine ?? null,
        last_account_check_at: nowIso(),
      });
    } catch (err) {
      if (!(err instanceof RiotNotFound)) throw err;
    }
  }
}

// ---- Step 4: classification ----

async function classify(platform: Platform, items: ItemCatalog): Promise<{ checked: number; found: number }> {
  const players = await select<{ puuid: string }>(
    'otp_players',
    `select=puuid&platform=eq.${platform}&last_seen_apex_at=gte.${daysAgoIso(3)}` +
      `&or=(last_classified_at.is.null,last_classified_at.lt.${daysAgoIso(config.reclassifyDays)})` +
      `&order=last_classified_at.asc.nullsfirst`,
  );

  let checked = 0;
  let found = 0;
  for (const { puuid } of players) {
    if (!hasTime()) break;
    checked++;
    const classifiedAt = nowIso();
    const notOneTrick = (sample: number | null) =>
      update('otp_players', { puuid: `eq.${puuid}` }, {
        is_one_trick: false,
        main_champion_id: null,
        main_champion_share: null,
        sample_size: sample,
        last_classified_at: classifiedAt,
      });

    // Prefilter: 1 call instead of ~20. Lifetime mastery concentrated on one
    // champion is a good hint that recent games are too.
    const masteries = await getTopMasteries(platform, puuid);
    const totalPoints = masteries.reduce((s, m) => s + m.championPoints, 0);
    if (!masteries.length || masteries[0].championPoints / totalPoints < config.masteryPrefilterShare) {
      await notOneTrick(null);
      continue;
    }

    const ids = await getSoloMatchIds(platform, puuid, { count: config.classifySample });
    const matches: Match[] = [];
    const champCounts = new Map<number, number>();
    for (const id of ids) {
      const match = await fetchMatch(platform, id);
      if (!match) continue;
      const p = findParticipant(match, puuid);
      if (!p || isRemake(match, p)) continue;
      matches.push(match);
      champCounts.set(p.championId, (champCounts.get(p.championId) ?? 0) + 1);
    }

    const [mainChamp, mainGames] = [...champCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [0, 0];
    const share = matches.length ? mainGames / matches.length : 0;
    if (matches.length < config.minSampleGames || share < config.oneTrickShare) {
      await notOneTrick(matches.length);
      continue;
    }

    // One-trick: the sample games on their main are already paid for, keep them.
    const rows: GameRow[] = [];
    for (const match of matches) {
      if (findParticipant(match, puuid)?.championId !== mainChamp) continue;
      const row = await buildRow(platform, match, puuid, items);
      if (row && Date.parse(row.game_start) >= Date.parse(daysAgoIso(config.retentionDays))) rows.push(row);
    }
    await update('otp_players', { puuid: `eq.${puuid}` }, {
      is_one_trick: true,
      main_champion_id: mainChamp,
      main_champion_share: share,
      sample_size: matches.length,
      last_classified_at: classifiedAt,
      last_match_check_at: classifiedAt,
    });
    await upsert('otp_games', rows);
    found++;
  }
  return { checked, found };
}

// ---- Main ----

async function runPlatform(platform: Platform, items: ItemCatalog): Promise<void> {
  const apex = await refreshApex(platform);
  log.info(`[${platform}] ${apex} apex players on the ladder`);

  const stored = await updateOneTricks(platform, items);
  log.info(`[${platform}] stored ${stored} new one-trick games`);

  await fillNames(platform);

  const { checked, found } = await classify(platform, items);
  log.info(`[${platform}] classified ${checked} players, ${found} new or confirmed one-tricks`);
}

async function main(): Promise<void> {
  log.info(`Platforms: ${config.platforms.join(', ')}; stopping new work after ${config.maxRuntimeMinutes} min`);
  const items = await loadItemCatalog();
  log.info(`Data Dragon ${items.version}`);

  const results = await Promise.allSettled(config.platforms.map((p) => runPlatform(p, items)));
  results.forEach((r, i) => {
    if (r.status === 'rejected') log.error(`[${config.platforms[i]}] ${(r.reason as Error)?.stack ?? r.reason}`);
  });

  await remove('otp_games', { game_start: `lt.${daysAgoIso(config.retentionDays)}` });

  const minutes = ((Date.now() - startedAt) / 60_000).toFixed(1);
  log.info(`Done in ${minutes} min. Riot requests per host: ${JSON.stringify(requestStats())}`);
  if (results.some((r) => r.status === 'rejected')) process.exitCode = 1;
}

main().catch((err) => {
  log.error((err as Error).stack ?? String(err));
  process.exit(1);
});
