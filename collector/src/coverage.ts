// Picks which player to classify next so every champion gets data before any
// champion gets more. Champions with the fewest known one-tricks go first;
// within a champion, highest LP then most ranked games.
//
// The "champion" of a candidate is a guess from their top mastery champion,
// which costs one cheap call; the real main is confirmed by match history.
// Counts are shared across regions, so 5 KR one-tricks cover a champion for NA too.

export type Candidate = { puuid: string; champion: number; lp: number; games: number };

export class CoverageQueue {
  private readonly byChampion = new Map<number, Candidate[]>();
  private readonly counts: Map<number, number>;
  private readonly target: number;
  private readonly queued = new Set<string>();

  constructor(counts: Map<number, number>, target: number) {
    this.counts = counts;
    this.target = target;
  }

  add(c: Candidate): void {
    if (this.queued.has(c.puuid)) return;
    this.queued.add(c.puuid);
    const list = this.byChampion.get(c.champion) ?? [];
    list.push(c);
    // Best first; small lists, so sorting on insert is cheap enough.
    list.sort((a, b) => b.lp - a.lp || b.games - a.games);
    this.byChampion.set(c.champion, list);
  }

  get size(): number {
    let n = 0;
    for (const list of this.byChampion.values()) n += list.length;
    return n;
  }

  /**
   * Next candidate for a champion still under the target, or undefined when
   * every champion with candidates is covered (or there are none).
   */
  nextUncovered(): Candidate | undefined {
    return this.take((count) => count < this.target);
  }

  /** Next candidate regardless of coverage, still least-covered first. */
  nextAny(): Candidate | undefined {
    return this.take(() => true);
  }

  /** Call when a one-trick is confirmed, with their actual main champion. */
  recordOneTrick(champion: number): void {
    this.counts.set(champion, (this.counts.get(champion) ?? 0) + 1);
  }

  private take(eligible: (count: number) => boolean): Candidate | undefined {
    let best: number | undefined;
    let bestCount = Infinity;
    for (const [champion, list] of this.byChampion) {
      if (!list.length) continue;
      const count = this.counts.get(champion) ?? 0;
      if (!eligible(count)) continue;
      // Tie-break equal coverage by the strongest waiting player.
      if (count < bestCount || (count === bestCount && best !== undefined && list[0].lp > this.byChampion.get(best)![0].lp)) {
        best = champion;
        bestCount = count;
      }
    }
    if (best === undefined) return undefined;
    return this.byChampion.get(best)!.shift();
  }
}
