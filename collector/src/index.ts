// One-trick collector. Run with: node collector/src/index.ts
//
// Goal: data for every champion first, then depth. Per platform (NA, EUW, KR
// in parallel, each on its own Riot rate-limit budget), with two lanes that
// also run in parallel because they use different Riot hosts:
//
//   Platform host (na1, euw1, kr): cheap
//     1. Refresh the Challenger / Grandmaster / Master ladders (3 calls).
//     2. Mastery scan, highest LP first: 1 call per player gives their top
//        champion. Players without a dominant champion are ruled out here.
//
//   Regional host (americas, europe, asia): expensive match history
//     3. Coverage: classify candidates for the champions with the fewest
//        known one-tricks first. New one-tricks get OTP_BACKFILL_DAYS of games.
//     4. Refresh known one-tricks not checked in OTP_UPDATE_HOURS.
//     5. Keep classifying candidates for already-covered champions.
//     6. Fill in Riot IDs for display.
//
// Then prune games older than the retention window. Every player stores when
// it was last checked, so a run cut short picks up where the last one stopped.

import { setTimeout as sleep } from 'node:timers/promises';
import { config, type Platform } from './config.ts';
import { CoverageQueue } from './coverage.ts';
import { rpc, select, update, upsert } from './db.ts';
import { loadItemCatalog, type ItemCatalog } from './dataDragon.ts';
import { findLaneOpponent, findParticipant, fromTimeline, isRemake, toGameRow, type GameRow } from './extract.ts';
import { log } from './log.ts';
import {
  getAccount,
  getApexLeague,
  getMatch,
  getSoloMatchIds,
  getSoloMatchIdsSince,
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
const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);
const daysAgoIso = (days: number) => daysAgo(days).toISOString();
const isStale = (iso: string | null, days: number) => !iso || Date.parse(iso) < daysAgo(days).getTime();
const APEX_RECENT_DAYS = 3;

type PlayerRow = {
  puuid: string;
  league_points: number;
  wins: number | null;
  losses: number | null;
  top_mastery_champion_id: number | null;
  top_mastery_share: number | null;
  last_classified_at: string | null;
  last_mastery_check_at: string | null;
};

type OneTrickRow = { puuid: string; main_champion_id: number; last_match_check_at: string | null };

// ---- Shared helpers ----

async function fetchMatch(platform: Platform, matchId: string): Promise<Match | null> {
  try {
    return await getMatch(platform, matchId);
  } catch (err) {
    if (err instanceof RiotNotFound) return null;
    throw err;
  }
}

async function buildRow(platform: Platform, match: Match, puuid: string, items: ItemCatalog): Promise<GameRow | null> {
  const p = findParticipant(match, puuid);
  if (!p || isRemake(match, p)) return null;
  // Never store games older than the raw window: they may already be rolled up.
  if (match.info.gameStartTimestamp < daysAgo(config.rawDays).getTime()) {
    return null;
  }
  let derived = null;
  if (config.fetchTimelines) {
    try {
      const opponent = findLaneOpponent(match, p);
      derived = fromTimeline(await getTimeline(platform, match.metadata.matchId), p.participantId, items, opponent?.participantId);
    } catch (err) {
      if (!(err instanceof RiotNotFound)) throw err;
    }
  }
  return toGameRow(match, p, platform, derived);
}

/** Fetch these matches and store the ones played on `champion`. Returns rows stored. */
async function storeMainGames(
  platform: Platform,
  puuid: string,
  champion: number,
  matchIds: string[],
  items: ItemCatalog,
  known = new Map<string, Match>(),
): Promise<number> {
  const rows: GameRow[] = [];
  let stored = 0;
  for (const id of matchIds) {
    if (!hasTime()) break;
    const match = known.get(id) ?? (await fetchMatch(platform, id));
    if (!match || findParticipant(match, puuid)?.championId !== champion) continue;
    const row = await buildRow(platform, match, puuid, items);
    if (row) rows.push(row);
    // Write in chunks so a run cut short keeps what it paid for.
    if (rows.length >= 25) {
      stored += rows.length;
      await upsert('otp_games', rows.splice(0));
    }
  }
  await upsert('otp_games', rows);
  return stored + rows.length;
}

// ---- Platform lane ----

async function refreshApex(platform: Platform): Promise<void> {
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
        wins: e.wins,
        losses: e.losses,
        last_seen_apex_at: seenAt,
        updated_at: seenAt,
      }));
    await upsert('otp_players', rows);
    total += rows.length;
  }
  log.info(`[${platform}] ${total} apex players on the ladder`);
}

const isCandidate = (p: Pick<PlayerRow, 'top_mastery_share' | 'last_classified_at'>) =>
  (p.top_mastery_share ?? 0) >= config.masteryPrefilterShare && isStale(p.last_classified_at, config.reclassifyDays);

const toCandidate = (p: PlayerRow) => ({
  puuid: p.puuid,
  champion: p.top_mastery_champion_id!,
  lp: p.league_points,
  games: (p.wins ?? 0) + (p.losses ?? 0),
});

/** Mastery for every apex player not scanned this week, highest LP first. Feeds the queue as it goes. */
async function masteryScan(platform: Platform, players: PlayerRow[], queue: CoverageQueue): Promise<void> {
  const due = players
    .filter((p) => isStale(p.last_mastery_check_at, config.reclassifyDays))
    .sort((a, b) => b.league_points - a.league_points);
  let scanned = 0;
  for (const p of due) {
    if (!hasTime()) break;
    const masteries = await getTopMasteries(platform, p.puuid);
    const total = masteries.reduce((s, m) => s + m.championPoints, 0);
    const top = masteries[0];
    const share = top && total ? top.championPoints / total : 0;
    const checkedAt = nowIso();
    const patch: Record<string, unknown> = {
      top_mastery_champion_id: top?.championId ?? null,
      top_mastery_share: share,
      last_mastery_check_at: checkedAt,
    };
    if (share < config.masteryPrefilterShare) {
      // Ruled out without spending any match-history calls.
      Object.assign(patch, { is_one_trick: false, main_champion_id: null, last_classified_at: checkedAt });
    }
    await update('otp_players', { puuid: `eq.${p.puuid}` }, patch);
    scanned++;
    const next = { ...p, top_mastery_champion_id: top?.championId ?? null, top_mastery_share: share };
    if (top && isCandidate(next)) queue.add(toCandidate(next));
  }
  log.info(`[${platform}] mastery-scanned ${scanned} players`);
}

// ---- Regional lane ----

/** Classify one player; on a hit, backfill their main-champion games. Returns the main champion or null. */
async function classify(platform: Platform, puuid: string, items: ItemCatalog): Promise<number | null> {
  const classifiedAt = nowIso();
  const ids = await getSoloMatchIds(platform, puuid, { count: config.classifySample });
  const sample = new Map<string, Match>();
  const champCounts = new Map<number, number>();
  for (const id of ids) {
    const match = await fetchMatch(platform, id);
    if (!match) continue;
    const p = findParticipant(match, puuid);
    if (!p || isRemake(match, p)) continue;
    sample.set(id, match);
    champCounts.set(p.championId, (champCounts.get(p.championId) ?? 0) + 1);
  }

  const [main, mainGames] = [...champCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [0, 0];
  const share = sample.size ? mainGames / sample.size : 0;
  if (sample.size < config.minSampleGames || share < config.oneTrickShare) {
    await update('otp_players', { puuid: `eq.${puuid}` }, {
      is_one_trick: false,
      main_champion_id: null,
      main_champion_share: null,
      sample_size: sample.size,
      last_classified_at: classifiedAt,
    });
    return null;
  }

  // Mark first so the player shows up on the site even if the backfill is cut short.
  await update('otp_players', { puuid: `eq.${puuid}` }, {
    is_one_trick: true,
    main_champion_id: main,
    main_champion_share: share,
    sample_size: sample.size,
    last_classified_at: classifiedAt,
  });

  // One extra call so the site can show their Riot ID right away.
  await fetchName(platform, puuid);

  const backfillIds = await getSoloMatchIdsSince(platform, puuid, daysAgo(Math.min(config.backfillDays, config.rawDays)));
  const allIds = [...new Set([...ids, ...backfillIds])];
  const stored = await storeMainGames(platform, puuid, main, allIds, items, sample);
  // Only advance the checkpoint if the whole backfill made it in.
  if (hasTime()) await update('otp_players', { puuid: `eq.${puuid}` }, { last_match_check_at: classifiedAt });
  log.info(`[${platform}] one-trick on champion ${main} (${Math.round(share * 100)}%), ${stored} games`);
  return main;
}

async function classifyFrom(
  platform: Platform,
  queue: CoverageQueue,
  pick: () => ReturnType<CoverageQueue['nextAny']>,
  items: ItemCatalog,
  waitFor?: Promise<unknown>,
): Promise<{ checked: number; found: number }> {
  let scanDone = !waitFor;
  waitFor?.finally(() => (scanDone = true));
  let checked = 0;
  let found = 0;
  while (hasTime()) {
    const next = pick();
    if (!next) {
      // The mastery scan may still be adding candidates; wait for it.
      if (scanDone) break;
      await sleep(2000);
      continue;
    }
    checked++;
    const main = await classify(platform, next.puuid, items);
    if (main !== null) {
      queue.recordOneTrick(main);
      found++;
    }
  }
  return { checked, found };
}

async function refreshOneTricks(platform: Platform, items: ItemCatalog): Promise<number> {
  const due = await select<OneTrickRow>(
    'otp_players',
    `select=puuid,main_champion_id,last_match_check_at&platform=eq.${platform}` +
      `&is_one_trick=is.true&last_seen_apex_at=gte.${daysAgoIso(APEX_RECENT_DAYS)}` +
      `&or=(last_match_check_at.is.null,last_match_check_at.lt.${new Date(Date.now() - config.updateHours * 3_600_000).toISOString()})` +
      `&order=last_match_check_at.asc.nullsfirst`,
  );
  let stored = 0;
  for (const p of due) {
    if (!hasTime()) break;
    const checkedAt = nowIso();
    const since = new Date(Math.max(
      p.last_match_check_at ? Date.parse(p.last_match_check_at) : 0,
      daysAgo(config.rawDays).getTime(),
    ));
    const ids = await getSoloMatchIdsSince(platform, p.puuid, since);
    stored += await storeMainGames(platform, p.puuid, p.main_champion_id, ids, items);
    if (hasTime()) await update('otp_players', { puuid: `eq.${p.puuid}` }, { last_match_check_at: checkedAt });
  }
  return stored;
}

async function fetchName(platform: Platform, puuid: string): Promise<void> {
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

/** Riot IDs for known one-tricks: missing ones first, then any older than a week (names can change). */
async function fillNames(platform: Platform): Promise<void> {
  const players = await select<{ puuid: string }>(
    'otp_players',
    `select=puuid&platform=eq.${platform}&is_one_trick=is.true` +
      `&or=(last_account_check_at.is.null,last_account_check_at.lt.${daysAgoIso(7)})` +
      '&order=game_name.nullsfirst',
  );
  for (const { puuid } of players) {
    if (!hasTime()) return;
    await fetchName(platform, puuid);
  }
  if (players.length) log.info(`[${platform}] refreshed ${players.length} Riot IDs`);
}

// ---- Main ----

async function runPlatform(platform: Platform, queue: CoverageQueue, items: ItemCatalog): Promise<void> {
  await refreshApex(platform);

  const players = await select<PlayerRow>(
    'otp_players',
    'select=puuid,league_points,wins,losses,top_mastery_champion_id,top_mastery_share,last_classified_at,last_mastery_check_at' +
      `&platform=eq.${platform}&last_seen_apex_at=gte.${daysAgoIso(APEX_RECENT_DAYS)}`,
  );
  // Candidates already mastery-scanned in an earlier run.
  for (const p of players) {
    if (p.top_mastery_champion_id && !isStale(p.last_mastery_check_at, config.reclassifyDays) && isCandidate(p)) {
      queue.add(toCandidate(p));
    }
  }

  const scan = masteryScan(platform, players, queue);
  const regional = (async () => {
    // Names first: coverage work always fills the rest of the run, so
    // anything scheduled after it may never get a turn.
    await fillNames(platform);

    const coverage = await classifyFrom(platform, queue, () => queue.nextUncovered(), items, scan);
    log.info(`[${platform}] coverage: classified ${coverage.checked}, found ${coverage.found} one-tricks`);

    const stored = await refreshOneTricks(platform, items);
    log.info(`[${platform}] refreshed known one-tricks, ${stored} new games`);

    const extra = await classifyFrom(platform, queue, () => queue.nextAny(), items);
    log.info(`[${platform}] depth: classified ${extra.checked}, found ${extra.found} one-tricks`);
  })();

  await Promise.all([scan, regional]);
}

async function main(): Promise<void> {
  log.info(`Platforms: ${config.platforms.join(', ')}; stopping new work after ${config.maxRuntimeMinutes} min`);
  const items = await loadItemCatalog();
  log.info(`Data Dragon ${items.version}`);

  // One-trick counts per champion, shared by every region's queue.
  const counts = new Map<number, number>();
  const known = await select<{ main_champion_id: number }>('otp_players', 'select=main_champion_id&is_one_trick=is.true');
  for (const { main_champion_id: c } of known) counts.set(c, (counts.get(c) ?? 0) + 1);
  log.info(`${known.length} known one-tricks across ${counts.size} champions`);

  const results = await Promise.allSettled(
    config.platforms.map((p) => runPlatform(p, new CoverageQueue(counts, config.championTarget), items)),
  );
  results.forEach((r, i) => {
    if (r.status === 'rejected') log.error(`[${config.platforms[i]}] ${(r.reason as Error)?.stack ?? r.reason}`);
  });

  // Fold games older than the raw window into the per-patch rollups.
  const rolled = await rpc<number>('otp_rollup_games', {
    cutoff: daysAgoIso(config.rawDays),
    keep_patches: config.keepPatches,
  });
  log.info(`Rolled up ${rolled} games older than ${config.rawDays} days`);

  const covered = [...counts.values()].filter((n) => n >= config.championTarget).length;
  const minutes = ((Date.now() - startedAt) / 60_000).toFixed(1);
  log.info(`Champions at target (${config.championTarget}+ one-tricks): ${covered}. Done in ${minutes} min.`);
  log.info(`Riot requests per host: ${JSON.stringify(requestStats())}`);
  if (results.some((r) => r.status === 'rejected')) process.exitCode = 1;
}

main().catch((err) => {
  log.error((err as Error).stack ?? String(err));
  process.exit(1);
});
