// Win probability: game-state snapshots from Riot timelines, and a logistic
// regression w(state) ~ P(win). Method and reasoning: docs/WPA.md.
//
// A state is one team's view of the game at a moment, every count being
// "this team minus the enemy":
//   [minute, gold, xp, kills, towers, dragons, grubs, heralds, barons, inhibitors, elders]
// Postgres evaluates the model with public.otp_wp_eval(coef, state), which must
// apply exactly the same features() transform as below.

import type { Match, Timeline } from './riot.ts';

export type State = number[];

export const STATE_FIELDS = [
  'minute', 'gold', 'xp', 'kills', 'towers', 'dragons', 'grubs', 'heralds', 'barons', 'inhibitors', 'elders',
] as const;

/** Model inputs. Mirror any change in otp_wp_eval (supabase/migrations). */
export function features(s: State): number[] {
  const t = s[0] / 30;
  const gold = s[1] / 1000;
  const xp = s[2] / 1000;
  return [gold, gold * t, xp, xp * t, s[3], s[4], s[5], s[6], s[7], s[8], s[9], s[10]];
}

export function predict(coef: number[], s: State): number {
  const f = features(s);
  let z = 0;
  for (let i = 0; i < f.length; i++) z += coef[i] * f[i];
  z = Math.max(-30, Math.min(30, z));
  return 1 / (1 + Math.exp(-z));
}

/** participantId -> teamId (100 blue, 200 red). */
export function teamsOf(match: Match): Map<number, number> {
  return new Map(match.info.participants.map((p) => [p.participantId, p.teamId]));
}

/**
 * The state for `teamId` at `atMs` into the game. Gold and XP come from the
 * last minute snapshot at or before `atMs`; events count up to `atMs`.
 * Null when the timeline has no frame for that moment.
 */
export function teamState(timeline: Timeline, teams: Map<number, number>, atMs: number, teamId: number): State | null {
  const frames = timeline.info.frames;
  if (!frames.length || atMs < 0) return null;
  const frame = frames[Math.min(Math.floor(atMs / 60_000), frames.length - 1)];
  const pf = frame?.participantFrames;
  if (!pf) return null;

  const s: State = [Math.floor(atMs / 60_000), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (const [id, f] of Object.entries(pf)) {
    const sign = teams.get(Number(id)) === teamId ? 1 : -1;
    s[1] += sign * f.totalGold;
    s[2] += sign * f.xp;
  }

  for (const fr of frames) {
    if (fr.timestamp > atMs + 60_000) break;
    for (const e of fr.events) {
      if (e.timestamp > atMs) continue;
      if (e.type === 'CHAMPION_KILL' && e.victimId) {
        s[3] += teams.get(e.victimId) === teamId ? -1 : 1;
      } else if (e.type === 'BUILDING_KILL' && e.teamId) {
        // teamId is the team that lost the building.
        const sign = e.teamId === teamId ? -1 : 1;
        if (e.buildingType === 'TOWER_BUILDING') s[4] += sign;
        else if (e.buildingType === 'INHIBITOR_BUILDING') s[9] += sign;
      } else if (e.type === 'ELITE_MONSTER_KILL' && e.killerTeamId) {
        const sign = e.killerTeamId === teamId ? 1 : -1;
        if (e.monsterType === 'DRAGON') {
          if (e.monsterSubType === 'ELDER_DRAGON') s[10] += sign;
          else s[5] += sign;
        } else if (e.monsterType === 'HORDE') s[6] += sign;
        else if (e.monsterType === 'RIFTHERALD') s[7] += sign;
        else if (e.monsterType === 'BARON_NASHOR') s[8] += sign;
      }
    }
  }
  return s;
}

/** Stable 32-bit hash, so a match always yields the same snapshot and split. */
export function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type Sample = { match_id: string; state: State; win: boolean };

/**
 * One training snapshot per match, at a minute picked by hashing the match ID
 * (uniform over the game, never the final frame). Blue side's view.
 */
export function trainingSample(match: Match, timeline: Timeline): Sample | null {
  const last = timeline.info.frames.length - 1;
  if (last < 3) return null;
  const minute = 1 + (hash(match.metadata.matchId) % (last - 1));
  const state = teamState(timeline, teamsOf(match), minute * 60_000, 100);
  const blue = match.info.participants.find((p) => p.teamId === 100);
  if (!state || !blue) return null;
  return { match_id: match.metadata.matchId, state, win: blue.win };
}

// ---- Fitting ----

export type Fit = { coef: number[]; iterations: number };

/**
 * Logistic regression without an intercept (states are differences, so a
 * mirrored state gets exactly 1 - w), fitted by Newton's method with a small
 * L2 penalty for stability.
 */
export function fitLogistic(X: number[][], y: number[], l2 = 1, maxIter = 30): Fit {
  const k = X[0]?.length ?? 0;
  const coef = new Array<number>(k).fill(0);
  let iterations = 0;
  for (; iterations < maxIter; iterations++) {
    const grad = coef.map((c) => -l2 * c);
    const hess = Array.from({ length: k }, (_, i) => Array.from({ length: k }, (_, j) => (i === j ? l2 : 0)));
    for (let n = 0; n < X.length; n++) {
      const x = X[n];
      let z = 0;
      for (let i = 0; i < k; i++) z += coef[i] * x[i];
      const p = 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, z))));
      const w = p * (1 - p);
      const r = y[n] - p;
      for (let i = 0; i < k; i++) {
        grad[i] += r * x[i];
        const wi = w * x[i];
        for (let j = i; j < k; j++) hess[i][j] += wi * x[j];
      }
    }
    for (let i = 0; i < k; i++) for (let j = 0; j < i; j++) hess[i][j] = hess[j][i];
    const step = solve(hess, grad);
    let size = 0;
    for (let i = 0; i < k; i++) {
      coef[i] += step[i];
      size = Math.max(size, Math.abs(step[i]));
    }
    if (size < 1e-6) break;
  }
  return { coef, iterations };
}

/** Solves A x = b by Gaussian elimination with partial pivoting. */
function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let pivot = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[pivot][c])) pivot = r;
    [M[c], M[pivot]] = [M[pivot], M[c]];
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c];
      for (let j = c; j <= n; j++) M[r][j] -= f * M[c][j];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let j = r + 1; j < n; j++) s -= M[r][j] * x[j];
    x[r] = s / M[r][r];
  }
  return x;
}

export type Evaluation = { accuracy: number; ece: number; logLoss: number; n: number };

/** Accuracy, expected calibration error (20 equal-width bins) and log loss. */
export function evaluate(p: number[], y: number[], bins = 20): Evaluation {
  const n = p.length;
  let correct = 0;
  let loss = 0;
  const count = new Array<number>(bins).fill(0);
  const sumP = new Array<number>(bins).fill(0);
  const sumY = new Array<number>(bins).fill(0);
  for (let i = 0; i < n; i++) {
    if ((p[i] >= 0.5 ? 1 : 0) === y[i]) correct++;
    const q = Math.min(1 - 1e-9, Math.max(1e-9, p[i]));
    loss -= y[i] * Math.log(q) + (1 - y[i]) * Math.log(1 - q);
    const b = Math.min(bins - 1, Math.floor(p[i] * bins));
    count[b]++;
    sumP[b] += p[i];
    sumY[b] += y[i];
  }
  let ece = 0;
  for (let b = 0; b < bins; b++) if (count[b]) ece += Math.abs(sumY[b] - sumP[b]) / n;
  return { accuracy: correct / n, ece, logLoss: loss / n, n };
}
