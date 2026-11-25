// Turns a match (and optionally its timeline) into one otp_games row for a player.

import type { ItemCatalog } from './dataDragon.ts';
import type { Match, MatchParticipant, Timeline } from './riot.ts';

export type GameRow = {
  match_id: string;
  puuid: string;
  platform: string;
  patch: string;
  champion_id: number;
  team_position: string | null;
  win: boolean;
  game_start: string;
  game_duration: number;
  kills: number;
  deaths: number;
  assists: number;
  items: number[];
  boots: number | null;
  core_items: number[] | null;
  skill_order: string | null;
  skill_max: string | null;
  keystone: number;
  primary_style: number;
  sub_style: number;
  perks: number[];
  stat_perks: number[];
  summoner_spells: number[];
};

/** "15.23.712.3456" -> "15.23" */
export function patchOf(gameVersion: string): string {
  return gameVersion.split('.').slice(0, 2).join('.');
}

export function findParticipant(match: Match, puuid: string): MatchParticipant | undefined {
  return match.info.participants.find((p) => p.puuid === puuid);
}

/** Remakes carry no build or win-rate signal. */
export function isRemake(match: Match, p: MatchParticipant): boolean {
  return Boolean(p.gameEndedInEarlySurrender) || match.info.gameDuration < 5 * 60;
}

const SLOT = ['', 'Q', 'W', 'E', 'R'];

type TimelineDerived = {
  core_items: number[] | null;
  boots: number | null;
  skill_order: string | null;
  skill_max: string | null;
};

export function fromTimeline(timeline: Timeline, participantId: number, items: ItemCatalog): TimelineDerived {
  const purchases: number[] = [];
  const skills: string[] = [];

  for (const frame of timeline.info.frames) {
    for (const e of frame.events) {
      if (e.participantId !== participantId) continue;
      if (e.type === 'ITEM_PURCHASED' && e.itemId) {
        purchases.push(e.itemId);
      } else if (e.type === 'ITEM_UNDO' && e.beforeId) {
        // Undo of a purchase: drop the most recent buy of that item.
        const i = purchases.lastIndexOf(e.beforeId);
        if (i !== -1) purchases.splice(i, 1);
      } else if (e.type === 'SKILL_LEVEL_UP' && e.levelUpType === 'NORMAL' && e.skillSlot) {
        skills.push(SLOT[e.skillSlot] ?? '?');
      }
    }
  }

  const core: number[] = [];
  for (const id of purchases) {
    if (items.isCompleted(id) && !items.isBoots(id) && !core.includes(id)) core.push(id);
    if (core.length === 3) break;
  }

  return {
    core_items: core.length === 3 ? core : null,
    boots: purchases.find((id) => items.isBoots(id)) ?? null,
    skill_order: skills.length ? skills.slice(0, 18).join('') : null,
    skill_max: skillMax(skills),
  };
}

/** Order Q/W/E by when each hit 5 points, e.g. "Q>E>W". Null for short games. */
function skillMax(skills: string[]): string | null {
  const maxedAt: Record<string, number> = {};
  const counts: Record<string, number> = { Q: 0, W: 0, E: 0 };
  skills.forEach((s, i) => {
    if (!(s in counts)) return;
    counts[s]++;
    if (counts[s] === 5) maxedAt[s] = i;
  });
  // Need at least the first ability maxed to say anything meaningful.
  if (Object.keys(maxedAt).length === 0) return null;
  return ['Q', 'W', 'E']
    .sort((a, b) => (maxedAt[a] ?? Infinity) - (maxedAt[b] ?? Infinity) || counts[b] - counts[a])
    .join('>');
}

export function toGameRow(
  match: Match,
  p: MatchParticipant,
  platform: string,
  derived: TimelineDerived | null,
): GameRow {
  const [primary, sub] = p.perks.styles;
  return {
    match_id: match.metadata.matchId,
    puuid: p.puuid,
    platform,
    patch: patchOf(match.info.gameVersion),
    champion_id: p.championId,
    team_position: p.teamPosition || null,
    win: p.win,
    game_start: new Date(match.info.gameStartTimestamp).toISOString(),
    game_duration: match.info.gameDuration,
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5],
    boots: derived?.boots ?? null,
    core_items: derived?.core_items ?? null,
    skill_order: derived?.skill_order ?? null,
    skill_max: derived?.skill_max ?? null,
    keystone: primary?.selections[0]?.perk ?? 0,
    primary_style: primary?.style ?? 0,
    sub_style: sub?.style ?? 0,
    perks: [...(primary?.selections ?? []), ...(sub?.selections ?? [])].map((s) => s.perk),
    stat_perks: [p.perks.statPerks.offense, p.perks.statPerks.flex, p.perks.statPerks.defense],
    summoner_spells: [p.summoner1Id, p.summoner2Id],
  };
}
