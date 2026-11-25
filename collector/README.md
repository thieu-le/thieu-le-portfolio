# One-Trick Stats collector

Crawls Master, Grandmaster and Challenger solo queue players on NA, EUW and KR,
works out who is a one-trick, and stores their games on their main champion in
Supabase. The `/otp` pages read aggregate views over that data.

Everything runs on free tiers: GitHub Actions (public repo), Supabase Free and Vercel Hobby.
China isn't supported because its servers are run by Tencent, not covered by the Riot API.

## How a run works

Goal: some data for every champion first, then more depth. All platforms run in
parallel. Riot rate limits are per routing value, so NA (`na1`/`americas`), EUW
(`euw1`/`europe`) and KR (`kr`/`asia`) each get a full budget. Within a platform, two
lanes also run in parallel because they use different hosts:

**Platform host (cheap)**
1. **Ladders**: 3 calls for the Challenger, Grandmaster and Master lists (LP, wins, losses).
2. **Mastery scan**, highest LP first: 1 call per player for their top champion. Players
   whose top champion is under 30% of their top-10 mastery are ruled out with no match calls.

**Regional host (expensive)**
3. **Coverage**: classify candidates for the champions with the fewest known one-tricks
   first (shared across regions), best LP then most games within a champion. **One-trick**
   means at least 60% of their last 20 solo games (12+ non-remakes) on one champion. A new
   one-trick gets the last 28 days of games on their main backfilled right away.
4. **Refresh** known one-tricks not checked in 24 hours. Misses are never lost: the next
   check pages through everything since the last one.
5. **Depth**: classify remaining candidates for champions that already have 5 one-tricks.
6. **Riot IDs** for display, refreshed weekly.

Then games older than 45 days are pruned to stay under the 500 MB free database.
Runs are hourly, stop starting new work after 50 minutes, and resume where they left off.

## Setup

1. **Supabase**: create a free project, then run
   `supabase/migrations/20261124000000_otp_schema.sql` in the SQL editor.
2. **Riot**: register this as its **own** app at <https://developer.riotgames.com>,
   separate from any other project's key. Use the personal key while building and
   apply for a production key before the page goes public.
3. **GitHub**: in repo Settings → Secrets and variables → Actions, add these secrets:
   - `RIOT_API_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API Keys; never put this in Vercel or the browser)

   Optional repository variables: `SUPABASE_URL` (defaults to the `one-trick-stats` project),
   `OTP_PLATFORMS` (default `na1,euw1,kr`) and `RIOT_RATE_LIMITS`.
4. **Vercel**: nothing to add. The site defaults to the project's public URL and anon key
   (`app/otp/lib/data.ts`), which can only read. `SUPABASE_URL` / `SUPABASE_ANON_KEY` env vars override them.
5. **Run once**: Actions → "One-trick collector" → Run workflow.

## Running locally

Put the three collector variables in `.env.local` and run:

```bash
npm run otp:collect
```

## Settings

| Env var | Default | Meaning |
|---|---|---|
| `OTP_PLATFORMS` | `na1,euw1,kr` | Shards to crawl |
| `RIOT_RATE_LIMITS` | `18:1,90:120` | Per-host windows (`count:seconds`). With a production key use e.g. `450:10,27000:600` |
| `OTP_SHARE` | `0.6` | Share of games on one champion to count as a one-trick |
| `OTP_CLASSIFY_SAMPLE` | `20` | Recent solo games checked per player |
| `OTP_MIN_GAMES` | `12` | Minimum non-remake games in the sample |
| `OTP_MASTERY_PREFILTER` | `0.3` | Top champion's share of top-10 mastery needed before spending match calls |
| `OTP_RECLASSIFY_DAYS` | `7` | How often players are re-evaluated |
| `OTP_CHAMPION_TARGET` | `5` | One-tricks per champion before it loses priority |
| `OTP_BACKFILL_DAYS` | `28` | History pulled for a newly found one-trick |
| `OTP_UPDATE_HOURS` | `24` | Minimum gap between new-game checks per one-trick |
| `OTP_FETCH_TIMELINES` | `true` | Timelines give build order, boots and skill order (doubles match calls) |
| `OTP_RETENTION_DAYS` | `45` | Games older than this are deleted |
| `OTP_MAX_RUNTIME_MINUTES` | `50` | Stop starting new work after this long |
