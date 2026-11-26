-- Win probability added (WPA). Method: docs/WPA.md.
--
-- * otp_games gains two game-state snapshots (see collector/src/winprob.ts):
--   state_core when the first core item is finished, state_15 at 15:00.
--   An empty array means the timeline was unavailable.
-- * otp_wp_samples: one training snapshot per match (blue side's view).
-- * otp_wp_model: logistic regression coefficients, retrained daily by the collector.
-- * otp_wp_eval(coef, state) evaluates the model; it must match features() in winprob.ts.
-- * Build and matchup views and rollups gain win-probability sums.
-- Additive only: no data is dropped.

alter table public.otp_games add column if not exists state_core integer[];
alter table public.otp_games add column if not exists state_15 integer[];

create table if not exists public.otp_wp_samples (
  id       bigint generated always as identity primary key,
  match_id text      not null unique,
  state    integer[] not null,   -- [minute, gold, xp, kills, towers, dragons, grubs, heralds, barons, inhibitors, elders], blue minus red
  win      boolean   not null    -- blue won
);

create table if not exists public.otp_wp_model (
  trained_at timestamptz primary key default now(),
  coef       double precision[] not null,
  samples    integer not null,
  accuracy   double precision,   -- held-out, 1 in 10 matches
  ece        double precision,   -- expected calibration error, 20 bins
  log_loss   double precision
);

alter table public.otp_wp_samples enable row level security;   -- no policy: service role only
alter table public.otp_wp_model enable row level security;
drop policy if exists "otp_wp_model public read" on public.otp_wp_model;
create policy "otp_wp_model public read" on public.otp_wp_model for select to anon, authenticated using (true);
grant select on public.otp_wp_model to anon, authenticated;

-- P(win) for a state. Features: gold and XP leads (thousands) and their
-- interaction with time (minute / 30), then kills, towers, dragons, grubs,
-- heralds, barons, inhibitors and elders. No intercept, so w(-s) = 1 - w(s).
create or replace function public.otp_wp_eval(c double precision[], s integer[])
returns double precision
language sql immutable
set search_path = ''
as $$
  select case when c is null or s is null or cardinality(s) < 11 then null else
    1 / (1 + exp(-greatest(-30, least(30,
        c[1] * (s[2] / 1000.0)::float8
      + c[2] * (s[2] / 1000.0)::float8 * (s[1] / 30.0)::float8
      + c[3] * (s[3] / 1000.0)::float8
      + c[4] * (s[3] / 1000.0)::float8 * (s[1] / 30.0)::float8
      + c[5] * s[4] + c[6] * s[5] + c[7] * s[6] + c[8] * s[7]
      + c[9] * s[8] + c[10] * s[9] + c[11] * s[10] + c[12] * s[11]
    ))))
  end
$$;

alter table public.otp_rollup_builds add column if not exists wp_games integer not null default 0;
alter table public.otp_rollup_builds add column if not exists wp_wins  integer not null default 0;
alter table public.otp_rollup_builds add column if not exists wp_sum   double precision not null default 0;
alter table public.otp_rollup_matchups add column if not exists wp15_games integer not null default 0;
alter table public.otp_rollup_matchups add column if not exists wp15_sum   double precision not null default 0;

-- Views: new columns are appended, so existing queries keep working.
-- wp_games / wp_wins / wp_sum: games with a core-item state, their wins, and
-- the summed win probability when the first core item was finished.
-- WPA = (wp_wins - wp_sum) / wp_games.

create or replace view public.otp_build_stats with (security_invoker = true) as
select champion_id, platform, position, core_items, sum(games)::int as games, sum(wins)::int as wins,
       sum(wp_games)::int as wp_games, sum(wp_wins)::int as wp_wins, sum(wp_sum)::float8 as wp_sum
from (
  select champion_id, platform, coalesce(nullif(team_position, ''), 'NONE') as position, core_items,
         1 as games, case when win then 1 else 0 end as wins,
         case when w is not null then 1 else 0 end as wp_games,
         case when w is not null and win then 1 else 0 end as wp_wins,
         coalesce(w, 0) as wp_sum
  from (
    select g.*, public.otp_wp_eval((select coef from public.otp_wp_model order by trained_at desc limit 1), g.state_core) as w
    from public.otp_games g where g.core_items is not null and cardinality(g.core_items) = 3
  ) g
  union all
  select champion_id, platform, position, core_items, games, wins, wp_games, wp_wins, wp_sum
  from public.otp_rollup_builds
) s
group by champion_id, platform, position, core_items;

create or replace view public.otp_matchup_build_stats with (security_invoker = true) as
select champion_id, opponent_champion_id, platform, position, core_items, sum(games)::int as games, sum(wins)::int as wins,
       sum(wp_games)::int as wp_games, sum(wp_wins)::int as wp_wins, sum(wp_sum)::float8 as wp_sum
from (
  select champion_id, opponent_champion_id, platform, coalesce(nullif(team_position, ''), 'NONE') as position,
         core_items, 1 as games, case when win then 1 else 0 end as wins,
         case when w is not null then 1 else 0 end as wp_games,
         case when w is not null and win then 1 else 0 end as wp_wins,
         coalesce(w, 0) as wp_sum
  from (
    select g.*, public.otp_wp_eval((select coef from public.otp_wp_model order by trained_at desc limit 1), g.state_core) as w
    from public.otp_games g
    where g.opponent_champion_id is not null and g.core_items is not null and cardinality(g.core_items) = 3
  ) g
  union all
  select champion_id, opponent_id, platform, position, core_items, games, wins, wp_games, wp_wins, wp_sum
  from public.otp_rollup_builds where opponent_id <> 0
) s
group by champion_id, opponent_champion_id, platform, position, core_items;

-- wp15_games / wp15_sum: games with a 15:00 state and their summed win
-- probability then. Lane WPA = wp15_sum / wp15_games - 0.5.
create or replace view public.otp_matchup_stats with (security_invoker = true) as
with s as (
  select
    champion_id, opponent_champion_id, platform, coalesce(nullif(team_position, ''), 'NONE') as position,
    1 as games,
    case when win then 1 else 0 end as wins,
    case when gold_diff_15 is not null and xp_diff_15 is not null then 1 else 0 end as lane_games,
    case when gold_diff_15 > 0 and xp_diff_15 > 0 then 1 else 0 end as lane_wins,
    case when gold_diff_15 < 0 and xp_diff_15 < 0 then 1 else 0 end as lane_losses,
    case when gold_diff_15 is not null and xp_diff_15 is not null then gold_diff_15 else 0 end::bigint as gold_sum,
    case when gold_diff_15 is not null and xp_diff_15 is not null then xp_diff_15 else 0 end::bigint as xp_sum,
    case when w15 is not null then 1 else 0 end as wp15_games,
    coalesce(w15, 0) as wp15_sum
  from (
    select g.*, public.otp_wp_eval((select coef from public.otp_wp_model order by trained_at desc limit 1), g.state_15) as w15
    from public.otp_games g where g.opponent_champion_id is not null
  ) g
  union all
  select champion_id, opponent_id, platform, position, games, wins, lane_games, lane_wins, lane_losses,
         gold_diff_15_sum, xp_diff_15_sum, wp15_games, wp15_sum
  from public.otp_rollup_matchups
)
select
  champion_id, opponent_champion_id, platform, position,
  sum(games)::int       as games,
  sum(wins)::int        as wins,
  sum(lane_games)::int  as lane_games,
  sum(lane_wins)::int   as lane_wins,
  sum(lane_losses)::int as lane_losses,
  sum(gold_sum)::bigint as gold_diff_15_sum,
  sum(xp_sum)::bigint   as xp_diff_15_sum,
  sum(wp15_games)::int  as wp15_games,
  sum(wp15_sum)::float8 as wp15_sum
from s
group by champion_id, opponent_champion_id, platform, position;

grant select on public.otp_build_stats, public.otp_matchup_build_stats, public.otp_matchup_stats to anon, authenticated;

create or replace function public.otp_rollup_games(cutoff timestamptz, keep_patches integer default 6)
returns integer
language plpgsql
set search_path = public
as $$
declare
  moved integer;
begin
  -- Win probabilities use the newest model at rollup time (null without one).
  create temp table _otp_old on commit drop as
    select g.*, coalesce(nullif(g.team_position, ''), 'NONE') as position,
           otp_wp_eval(m.coef, g.state_core) as w_core,
           otp_wp_eval(m.coef, g.state_15) as w_15
    from otp_games g
    left join (select coef from otp_wp_model order by trained_at desc limit 1) m on true
    where g.game_start < cutoff;

  insert into otp_rollup_champion (champion_id, platform, position, patch, games, wins)
    select champion_id, platform, position, patch, count(*), count(*) filter (where win)
    from _otp_old group by 1, 2, 3, 4
  on conflict (champion_id, platform, position, patch) do update
    set games = otp_rollup_champion.games + excluded.games, wins = otp_rollup_champion.wins + excluded.wins;

  insert into otp_rollup_builds (champion_id, opponent_id, platform, position, patch, core_items, games, wins,
                                 wp_games, wp_wins, wp_sum)
    select champion_id, coalesce(opponent_champion_id, 0), platform, position, patch, core_items,
           count(*), count(*) filter (where win),
           count(w_core), count(*) filter (where w_core is not null and win), coalesce(sum(w_core), 0)
    from _otp_old where core_items is not null and cardinality(core_items) = 3 group by 1, 2, 3, 4, 5, 6
  on conflict (champion_id, opponent_id, platform, position, patch, core_items) do update set
    games = otp_rollup_builds.games + excluded.games,
    wins = otp_rollup_builds.wins + excluded.wins,
    wp_games = otp_rollup_builds.wp_games + excluded.wp_games,
    wp_wins = otp_rollup_builds.wp_wins + excluded.wp_wins,
    wp_sum = otp_rollup_builds.wp_sum + excluded.wp_sum;

  insert into otp_rollup_runes (champion_id, opponent_id, platform, position, patch, keystone, primary_style,
                                sub_style, perks, games, wins)
    select champion_id, coalesce(opponent_champion_id, 0), platform, position, patch, keystone, primary_style,
           sub_style, perks, count(*), count(*) filter (where win)
    from _otp_old group by 1, 2, 3, 4, 5, 6, 7, 8, 9
  on conflict (champion_id, opponent_id, platform, position, patch, primary_style, sub_style, perks) do update
    set games = otp_rollup_runes.games + excluded.games, wins = otp_rollup_runes.wins + excluded.wins;

  insert into otp_rollup_skills (champion_id, opponent_id, platform, position, patch, skill_max, games, wins)
    select champion_id, coalesce(opponent_champion_id, 0), platform, position, patch, skill_max,
           count(*), count(*) filter (where win)
    from _otp_old where skill_max is not null group by 1, 2, 3, 4, 5, 6
  on conflict (champion_id, opponent_id, platform, position, patch, skill_max) do update
    set games = otp_rollup_skills.games + excluded.games, wins = otp_rollup_skills.wins + excluded.wins;

  insert into otp_rollup_boots (champion_id, platform, position, patch, boots, games, wins)
    select champion_id, platform, position, patch, boots, count(*), count(*) filter (where win)
    from _otp_old where boots is not null group by 1, 2, 3, 4, 5
  on conflict (champion_id, platform, position, patch, boots) do update
    set games = otp_rollup_boots.games + excluded.games, wins = otp_rollup_boots.wins + excluded.wins;

  insert into otp_rollup_matchups (champion_id, opponent_id, platform, position, patch, games, wins,
                                   lane_games, lane_wins, lane_losses, gold_diff_15_sum, xp_diff_15_sum,
                                   wp15_games, wp15_sum)
    select champion_id, opponent_champion_id, platform, position, patch, count(*), count(*) filter (where win),
           count(*) filter (where gold_diff_15 is not null and xp_diff_15 is not null),
           count(*) filter (where gold_diff_15 > 0 and xp_diff_15 > 0),
           count(*) filter (where gold_diff_15 < 0 and xp_diff_15 < 0),
           coalesce(sum(gold_diff_15) filter (where gold_diff_15 is not null and xp_diff_15 is not null), 0),
           coalesce(sum(xp_diff_15) filter (where gold_diff_15 is not null and xp_diff_15 is not null), 0),
           count(w_15), coalesce(sum(w_15), 0)
    from _otp_old where opponent_champion_id is not null group by 1, 2, 3, 4, 5
  on conflict (champion_id, opponent_id, platform, position, patch) do update set
    games = otp_rollup_matchups.games + excluded.games,
    wins = otp_rollup_matchups.wins + excluded.wins,
    lane_games = otp_rollup_matchups.lane_games + excluded.lane_games,
    lane_wins = otp_rollup_matchups.lane_wins + excluded.lane_wins,
    lane_losses = otp_rollup_matchups.lane_losses + excluded.lane_losses,
    gold_diff_15_sum = otp_rollup_matchups.gold_diff_15_sum + excluded.gold_diff_15_sum,
    xp_diff_15_sum = otp_rollup_matchups.xp_diff_15_sum + excluded.xp_diff_15_sum,
    wp15_games = otp_rollup_matchups.wp15_games + excluded.wp15_games,
    wp15_sum = otp_rollup_matchups.wp15_sum + excluded.wp15_sum;

  insert into otp_rollup_players (champion_id, puuid, position, patch, games, wins)
    select champion_id, puuid, position, patch, count(*), count(*) filter (where win)
    from _otp_old group by 1, 2, 3, 4
  on conflict (champion_id, puuid, position, patch) do update
    set games = otp_rollup_players.games + excluded.games, wins = otp_rollup_players.wins + excluded.wins;

  delete from otp_games g using _otp_old o where g.match_id = o.match_id and g.puuid = o.puuid;
  get diagnostics moved = row_count;

  create temp table _otp_keep on commit drop as
    select patch from (
      select patch from otp_rollup_champion union select patch from otp_games
    ) p
    order by string_to_array(patch, '.')::int[] desc
    limit keep_patches;

  delete from otp_rollup_champion where patch not in (select patch from _otp_keep);
  delete from otp_rollup_builds   where patch not in (select patch from _otp_keep);
  delete from otp_rollup_runes    where patch not in (select patch from _otp_keep);
  delete from otp_rollup_skills   where patch not in (select patch from _otp_keep);
  delete from otp_rollup_boots    where patch not in (select patch from _otp_keep);
  delete from otp_rollup_matchups where patch not in (select patch from _otp_keep);
  delete from otp_rollup_players  where patch not in (select patch from _otp_keep);

  return moved;
end;
$$;

revoke all on function public.otp_rollup_games(timestamptz, integer) from public, anon, authenticated;
grant execute on function public.otp_rollup_games(timestamptz, integer) to service_role;

-- Keep the newest `keep` training samples and the 30 newest models.
create or replace function public.otp_prune_wp_samples(keep integer)
returns integer
language plpgsql
set search_path = public
as $$
declare
  pruned integer;
begin
  delete from otp_wp_samples
  where id <= (select id from otp_wp_samples order by id desc offset keep limit 1);
  get diagnostics pruned = row_count;
  delete from otp_wp_model
  where trained_at <= (select trained_at from otp_wp_model order by trained_at desc offset 30 limit 1);
  return pruned;
end;
$$;

revoke all on function public.otp_prune_wp_samples(integer) from public, anon, authenticated;
grant execute on function public.otp_prune_wp_samples(integer) to service_role;
