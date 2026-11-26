# One-Trick Stats (`/otp`): project context

Everything a new session (local or cloud) needs to keep working on One-Trick Stats.
Read this first, then [WPA.md](WPA.md) for the win probability work and
[collector/README.md](../collector/README.md) for collector settings.

## What it is

An ad-free alternative to op.gg / u.gg at <https://thieu-le-portfolio.vercel.app/otp>,
built **only from Masters+ one-tricks** on **NA, EUW and KR**:

- Champion directory: games, win rate, number of one-tricks, filterable by region and lane.
- Champion page (`/otp/[champion]`):
  - The most-played setup: skill max order, 3-item core build, boots and runes, with alternatives.
  - **Lane matchups**, sortable by most played, hardest or easiest.
  - Per-opponent detail (`?vs=zed`) with that matchup's build, runes and skill order.
- Filters live in the URL: `?region=na,euw&lane=top&vs=zed`. Leaving out `region` means all regions.
  The default lane is the champion's most-played lane.

Data comes from the Riot API only. Never scrape op.gg or u.gg.

## Hard constraints

- **Everything stays free.** Supabase Free has 500 MB of database and 5 GB of egress
  a month; GitHub Actions is free because the repo is public; Vercel is on the Hobby plan.
  Check size impact before adding stored data. The database was 61 MB on 2026-11-26.
- **Secrets never go in code, the browser or chat.** The Supabase `service_role` key
  and the Riot key exist only as GitHub Actions secrets (`SUPABASE_SERVICE_ROLE_KEY`,
  `RIOT_API_KEY`). The anon key in `app/otp/lib/data.ts` is public by design: RLS
  lets anon only `SELECT`.
- **Riot key:** the rate limits (`18:1,90:120`) are personal-key limits. If runs fail
  with 401 or 403, the key has expired or been revoked, and the user must regenerate it
  at developer.riotgames.com and update the secret. You can't do that for them.

## Architecture

```
GitHub Actions (collector, Node 24, no deps)  ──service_role──▶  Supabase Postgres
                                                                    │ views (security_invoker)
Vercel / Next.js 16 App Router (/otp) ◀────────anon key, SELECT────┘ revalidate 3600
```

### Supabase

- Project `one-trick-stats`, id **`fakrushrdxmwqijzoakn`**, <https://fakrushrdxmwqijzoakn.supabase.co>.
- Raw tables:
  - `otp_players`: every apex player seen, with classification, mastery and Riot ID.
  - `otp_games`: one row per (match, one-trick) on their main champion, kept 14 days.
- Rollups: `otp_rollup_*` hold per-patch summaries of older games (newest 6 patches).
  `otp_rollup_games(cutoff, keep_patches)` moves games older than 14 days into the
  rollups and deletes them in one transaction.
- Views (what the site reads) are `otp_champion_stats`, `otp_champion_one_tricks`,
  `otp_build_stats`, `otp_boots_stats`, `otp_rune_stats`, `otp_skill_stats`,
  `otp_player_stats`, `otp_matchup_stats` and `otp_matchup_{build,rune,skill}_stats`.
  - Each unions raw games with rollups and returns one row per champion × `platform` × `position` × key.
  - The site sums rows across the selected regions in JS (`merge()` in `data.ts`).
  - `position` = `coalesce(nullif(team_position,''),'NONE')`; Riot's values are TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY.
- Win probability: `otp_wp_samples`, `otp_wp_model` and the `otp_wp_eval(coef, state)` function. See [WPA.md](WPA.md).
- Migrations are in `supabase/migrations/`, in order. **There's no automatic
  migration runner.** Each file was applied by hand. See "Applying migrations" below.

### Collector (`collector/src/`)

- `index.ts` (main flow), `riot.ts` (API client and types), `rateLimiter.ts`,
  `extract.ts` (match plus timeline into a `GameRow`), `winprob.ts` and `train.ts`
  (WPA), `coverage.ts` (champion priority queue), `db.ts` (PostgREST client), `config.ts` (env settings).
- Each platform runs in parallel. Within a platform, the platform host does the ladder
  and mastery scan while the regional host does, in order:
  1. Riot IDs.
  2. **Coverage**: one-tricks for the champions with the fewest known.
  3. **Refresh**: new games for known one-tricks.
  4. **Depth**.
  5. **WPA state backfill**.
- At the end of a run: retrain the WPA model (at most daily), roll up old games, prune WPA samples.
- One-trick rule: at least 60% of their last 20 solo games (12+ non-remakes) on one champion.
- Runs stop starting new work after 50 minutes.

### Workflow (`.github/workflows/otp-collector.yml`)

- **Self-chaining:** the last step dispatches the next run (`gh workflow run`), so the
  collector runs back to back. The hourly cron is only a backup, because GitHub's cron
  often runs hours late.
- The concurrency group `otp-collector` allows one running and one pending run. A
  "cancelled" run usually means a cron run was replaced by a chained one, which is harmless.
- To pause: set the repository variable `OTP_CHAIN=false`.
- To start manually: `gh workflow run otp-collector.yml --ref main`. To check: `gh run list --workflow otp-collector.yml -L 5`.

### Site (`app/otp/`)

- `page.tsx` (directory), `[champion]/page.tsx` (champion page; server-rendered and
  cached for an hour, so data changes appear within an hour).
- `lib/data.ts`: all Supabase reads, the `merge()` helper, stat helpers (`laneWinRate`,
  `adjustedLaneLead`, `wpa`, `laneWpa`, …) and Data Dragon lookups.
- `lib/filters.ts`: region and lane parsing and URL building.
- Components:
  - `FilterBar` (server links for lane and region).
  - `ChampionTable` (client; filters use `useSearchParams` and `history.replaceState`, wrapped in Suspense).
  - `MatchupList` (client; sorting and search).
  - `StatDisplay` (`Rate`, `Diff`, `Wpa`, all with color tones).
- Styles: `otp.css` (CSS variables `--otp-up`, `--otp-down`, `--otp-muted`, …).

## Product decisions the user has made

Keep these unless the user changes them:

- Win rates are **never greyed out or muted** for small samples. Small samples get a `*` marker instead.
- Rates and leads are color coded: win rate green at 52% or above and red at 48% or
  below; gold and XP leads green at +100 or more and red at −100 or less; WPA green at
  +1 point or more and red at −1 or less.
- Matchups show only same-lane opponents, using the lane filter, so junglers and bot
  laners don't show up against top laners.
- Hardest and Easiest matchups sort by lane strength, not win rate. They use **lane
  WPA** once the model exists, and the combined gold + XP lead at 15:00 before that,
  both pulled toward even for small samples.
- Regions can be combined (NA, EUW, KR in any mix), and lane tabs show each lane's share of games.
- Riot IDs are shown for players (they used to show "Unknown"; that's fixed).
- WPA (win probability added) is shown for builds and lanes, with a "What does WPA mean?"
  explanation. Method credit: xPetu's 2024 thesis. See [WPA.md](WPA.md).

## Working rules

- **Commit and push only when the user asks.** Conventional commits scoped to the
  feature, e.g. `feat(otp): …`, `fix(otp): …`, `ci(otp): …`.
- Never commit `.claude/`, `.env*` or keys.
- Checks before committing:
  ```bash
  npm run otp:typecheck && npx tsc --noEmit -p . && npx eslint app/otp collector
  ```
  `npm run build` is the full check.
- The collector can't run without the Riot and service-role keys, which only exist in
  GitHub secrets. To test collector logic, write a small script that imports the pure
  modules (`winprob.ts`, `extract.ts`) with synthetic data and run it with `node file.ts`
  (Node 24 runs TypeScript directly). Then verify on a real Actions run.
- Read-only database checks: the Supabase MCP `execute_sql` works. For a dry run of
  something that writes, use a `DO` block that ends with `raise exception` to report
  values and roll back.

### Applying migrations

1. Write the migration file in `supabase/migrations/` (timestamped, additive where possible).
2. Try the Supabase MCP `apply_migration`. The user has declined it for migrations before.
3. If it's declined, **ask the user** how to apply it; don't reroute on your own. Locally,
   the user has chosen to have Claude paste it into the Supabase SQL editor in their
   Chrome. A cloud session has no browser, so ask the user to paste the file into the
   SQL editor (Supabase dashboard → SQL Editor) and run it.
4. Verify with a read-only `execute_sql` query, and check anon access with a `curl` using the public anon key.

Order matters: apply a migration **before** pushing collector or site code that uses
it, because the chained collector picks up `main` within the hour.

## Status (2026-11-26)

- **Data:**
  - 1,118 one-tricks across 173 champions (essentially every champion has at least one).
  - About 40k raw games; the database is 61 MB.
  - Champions are starting to reach the 5-one-trick target, so the collector's work is shifting from coverage to depth.
- **Collector chain:** running back to back since 2026-11-26 02:42 UTC.
- **WPA:** shipped in `430611a`; the migration `20261127000000_otp_win_probability.sql` is applied.
  - The first run with the WPA code is Actions run 45856735511, queued about 16:13 UTC.
  - At commit time `otp_games.state_15` and `otp_wp_samples` were empty; they fill from that run on.
  - **To verify:**
    1. Rows with `state_15` / `state_core` appear, and `otp_wp_samples` grows.
    2. After about 5,000 samples, a row appears in `otp_wp_model`. Check its logged
       accuracy (expect about 70–75%) and ECE (expect under about 2%).
    3. The site then shows build WPA and the Lane WPA column.
  - Backfill of the roughly 40k pre-WPA games happens only after coverage, refresh and
    depth finish in a run, so it starts once collection has caught up. That's intended
    (the user asked for "backfill when we catch up").

## Ideas not yet done

- Per-item WPA (each core slot from its own purchase moment), and grouping by "bought
  ahead, even or behind" (see [WPA.md](WPA.md)).
- A reliability diagram for the model on the page.
- A production Riot key, so the collector can make many more requests.
