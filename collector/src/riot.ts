// Minimal Riot API client. Every request goes through the limiter for its host,
// and 429s pause that host for Retry-After seconds before retrying.

import { setTimeout as sleep } from 'node:timers/promises';
import { config, REGIONAL_FOR, type Platform, type Regional } from './config.ts';
import { RateLimiter } from './rateLimiter.ts';
import { log } from './log.ts';

const limiters = new Map<string, RateLimiter>();
const requestCounts = new Map<string, number>();

function limiterFor(host: string): RateLimiter {
  let l = limiters.get(host);
  if (!l) {
    l = new RateLimiter(config.rateLimits);
    limiters.set(host, l);
  }
  return l;
}

export function requestStats(): Record<string, number> {
  return Object.fromEntries(requestCounts);
}

export class RiotNotFound extends Error {}

async function riotGet<T>(host: Platform | Regional, path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`https://${host}.api.riotgames.com${path}`);
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, String(v));

  const limiter = limiterFor(host);
  for (let attempt = 1; ; attempt++) {
    await limiter.acquire();
    requestCounts.set(host, (requestCounts.get(host) ?? 0) + 1);

    let res: Response;
    try {
      res = await fetch(url, {
        headers: { 'X-Riot-Token': config.riotApiKey },
        signal: AbortSignal.timeout(15_000),
      });
    } catch (err) {
      if (attempt >= 4) throw err;
      log.warn(`${host} network error (${(err as Error).message}), retry ${attempt}`);
      await sleep(1000 * attempt);
      continue;
    }

    if (res.ok) return (await res.json()) as T;
    if (res.status === 404) throw new RiotNotFound(`404 ${url.pathname}`);

    if (res.status === 429 && attempt < 6) {
      const retryAfter = Number(res.headers.get('retry-after') ?? '1');
      const ms = Math.max(1, Number.isFinite(retryAfter) ? retryAfter : 1) * 1000;
      log.warn(`${host} 429 (${res.headers.get('x-rate-limit-type') ?? 'unknown'}), pausing ${ms}ms`);
      limiter.pause(ms);
      continue;
    }
    if (res.status >= 500 && attempt < 4) {
      await sleep(1500 * attempt);
      continue;
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Riot API returned ${res.status}: is RIOT_API_KEY valid and not expired?`);
    }
    throw new Error(`Riot ${res.status} for ${url.pathname}`);
  }
}

// ---- Types: only the fields the collector reads. ----

export type LeagueEntry = { puuid: string; leaguePoints: number };
export type LeagueList = { tier: string; entries: LeagueEntry[] };

export type ChampionMastery = { championId: number; championPoints: number };

export type Account = { puuid: string; gameName?: string; tagLine?: string };

export type MatchParticipant = {
  puuid: string;
  participantId: number;
  championId: number;
  teamPosition: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  item0: number; item1: number; item2: number; item3: number; item4: number; item5: number;
  summoner1Id: number;
  summoner2Id: number;
  gameEndedInEarlySurrender?: boolean;
  perks: {
    statPerks: { offense: number; flex: number; defense: number };
    styles: { style: number; selections: { perk: number }[] }[];
  };
};

export type Match = {
  metadata: { matchId: string };
  info: {
    gameVersion: string;
    gameStartTimestamp: number;
    gameDuration: number;
    queueId: number;
    participants: MatchParticipant[];
  };
};

export type TimelineEvent = {
  type: string;
  timestamp: number;
  participantId?: number;
  itemId?: number;
  beforeId?: number;
  afterId?: number;
  skillSlot?: number;
  levelUpType?: string;
};

export type Timeline = { info: { frames: { events: TimelineEvent[] }[] } };

// ---- Endpoints ----

const SOLO = 'RANKED_SOLO_5x5';
export const SOLO_QUEUE_ID = 420;

export function getApexLeague(platform: Platform, tier: 'challenger' | 'grandmaster' | 'master') {
  return riotGet<LeagueList>(platform, `/lol/league/v4/${tier}leagues/by-queue/${SOLO}`);
}

export function getTopMasteries(platform: Platform, puuid: string, count = 10) {
  return riotGet<ChampionMastery[]>(
    platform,
    `/lol/champion-mastery/v4/champion-masteries/by-puuid/${encodeURIComponent(puuid)}/top`,
    { count },
  );
}

export function getSoloMatchIds(platform: Platform, puuid: string, opts: { count: number; startTime?: number }) {
  const params: Record<string, number> = { queue: SOLO_QUEUE_ID, start: 0, count: opts.count };
  if (opts.startTime) params.startTime = opts.startTime;
  return riotGet<string[]>(
    REGIONAL_FOR[platform],
    `/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids`,
    params,
  );
}

export function getMatch(platform: Platform, matchId: string) {
  return riotGet<Match>(REGIONAL_FOR[platform], `/lol/match/v5/matches/${encodeURIComponent(matchId)}`);
}

export function getTimeline(platform: Platform, matchId: string) {
  return riotGet<Timeline>(REGIONAL_FOR[platform], `/lol/match/v5/matches/${encodeURIComponent(matchId)}/timeline`);
}

export function getAccount(platform: Platform, puuid: string) {
  // account-v1 accepts any regional host; reuse the platform's so its budget is shared.
  return riotGet<Account>(REGIONAL_FOR[platform], `/riot/account/v1/accounts/by-puuid/${encodeURIComponent(puuid)}`);
}
