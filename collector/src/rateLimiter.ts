// Sliding-window rate limiter, one instance per Riot host.
//
// Riot enforces application limits per routing value (americas, na1, euw1...),
// so each host gets its own limiter and hosts run fully in parallel. Requests
// on the same host are queued in order; each waits until every window has room.

import { setTimeout as sleep } from 'node:timers/promises';

export type Window = { count: number; seconds: number };

export class RateLimiter {
  private readonly windows: Window[];
  private readonly stamps: number[] = [];
  private queue: Promise<void> = Promise.resolve();
  private pausedUntil = 0;

  constructor(windows: Window[]) {
    this.windows = windows;
  }

  /** Resolves when the caller may send one request. */
  acquire(): Promise<void> {
    const turn = this.queue.then(() => this.waitForSlot());
    // Keep the chain alive even if a waiter somehow throws.
    this.queue = turn.catch(() => undefined);
    return turn;
  }

  /** Called on a 429: block this host until Riot's Retry-After has passed. */
  pause(ms: number): void {
    this.pausedUntil = Math.max(this.pausedUntil, Date.now() + ms);
  }

  private async waitForSlot(): Promise<void> {
    for (;;) {
      const now = Date.now();
      if (now < this.pausedUntil) {
        await sleep(this.pausedUntil - now);
        continue;
      }

      const longest = Math.max(...this.windows.map((w) => w.seconds)) * 1000;
      while (this.stamps.length && now - this.stamps[0] >= longest) this.stamps.shift();

      let waitMs = 0;
      for (const w of this.windows) {
        const span = w.seconds * 1000;
        const inWindow = this.stamps.filter((t) => now - t < span);
        if (inWindow.length >= w.count) {
          // The oldest request in this window has to age out first.
          waitMs = Math.max(waitMs, inWindow[0] + span - now + 5);
        }
      }

      if (waitMs === 0) {
        this.stamps.push(now);
        return;
      }
      await sleep(waitMs);
    }
  }
}
