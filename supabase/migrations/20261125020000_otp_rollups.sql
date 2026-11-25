-- Rollups: keep per-game rows only for a recent window (OTP_RAW_DAYS), and
-- fold older games into small summary tables keyed by patch. The pages only
-- ever show summary numbers, so nothing visible is lost, and history can run
-- for months inside the 500 MB free tier.
--
-- opponent_id = 0 means "no clear lane opponent" (it has to be part of the
-- primary key, so it can't be null). The public views merge raw + rolled-up
-- rows and keep the same columns as before.

create table if not exists public.otp_rollup_champion (
  champion_id integer not null,
  patch       text    not null,
  games       integer not null,
  wins        integer not null,
  primary key (champion_id, patch)
);

create table if not exists public.otp_rollup_builds (
  champion_id integer   not null,
  opponent_id integer   not null,
  patch       text      not null,
  core_items  integer[] not null,
  games       integer   not null,
  wins        integer   not null,
  primary key (champion_id, opponent_id, patch, core_items)
);

create table if not exists public.otp_rollup_runes (
  champion_id   integer   not null,
  opponent_id   integer   not null,
  patch         text      not null,
  keystone      integer   not null,
  primary_style integer   not null,
  sub_style     integer   not null,
  perks         integer[] not null,
  games         integer   not null,
  wins          integer   not null,
  primary key (champion_id, opponent_id, patch, primary_style, sub_style, perks)
);

create table if not exists public.otp_rollup_skills (
  champion_id integer not null,
  opponent_id integer not null,
  patch       text    not null,
  skill_max   text    not null,
  games       integer not null,
  wins        integer not null,
  primary key (champion_id, opponent_id, patch, skill_max)
);

create table if not exists public.otp_rollup_boots (
  champion_id integer not null,
  patch       text    not null,
  boots       integer not null,
  games       integer not null,
  wins        integer not null,
  primary key (champion_id, patch, boots)
);

create table if not exists public.otp_rollup_matchups (
  champion_id integer not null,
  opponent_id integer not null,
  patch       text    not null,
  games       integer not null,
  wins        integer not null,
  lane_games  integer not null,
  lane_wins   integer not null,
  lane_losses integer not null,
  gold_diff_15_sum bigint not null,
  xp_diff_15_sum   bigint not null,
  primary key (champion_id, opponent_id, patch)
);

create table if not exists public.otp_rollup_players (
  champion_id integer not null,
  puuid       text    not null references public.otp_players (puuid) on delete cascade,
  patch       text    not null,
  games       integer not null,
  wins        integer not null,
  primary key (champion_id, puuid, patch)
);

-- Public read, no public writes (same as the raw tables).
do $$
declare t text;
begin
  foreach t in array array[
    'otp_rollup_champion', 'otp_rollup_builds', 'otp_rollup_runes', 'otp_rollup_skills',
    'otp_rollup_boots', 'otp_rollup_matchups', 'otp_rollup_players'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s public read" on public.%I', t, t);
    execute format('create policy "%s public read" on public.%I for select to anon, authenticated using (true)', t, t);
  end loop;
end $$;

-- Fold games older than `cutoff` into the rollups and delete them, then drop
-- rollup rows for patches older than the newest `keep_patches`. Runs in one
-- transaction, so a game is never counted twice or lost. Returns games moved.
create or replace function public.otp_rollup_games(cutoff timestamptz, keep_patches integer default 6)
returns integer
language plpgsql
set search_path = public
as $$
declare
  moved integer;
begin
  create temp table _otp_old on commit drop as
    select * from otp_games where game_start < cutoff;

  insert into otp_rollup_champion (champion_id, patch, games, wins)
    select champion_id, patch, count(*), count(*) filter (where win) from _otp_old group by 1, 2
  on conflict (champion_id, patch) do update
    set games = otp_rollup_champion.games + excluded.games, wins = otp_rollup_champion.wins + excluded.wins;

  insert into otp_rollup_builds (champion_id, opponent_id, patch, core_items, games, wins)
    select champion_id, coalesce(opponent_champion_id, 0), patch, core_items, count(*), count(*) filter (where win)
    from _otp_old where core_items is not null and cardinality(core_items) = 3 group by 1, 2, 3, 4
  on conflict (champion_id, opponent_id, patch, core_items) do update
    set games = otp_rollup_builds.games + excluded.games, wins = otp_rollup_builds.wins + excluded.wins;

  insert into otp_rollup_runes (champion_id, opponent_id, patch, keystone, primary_style, sub_style, perks, games, wins)
    select champion_id, coalesce(opponent_champion_id, 0), patch, keystone, primary_style, sub_style, perks,
           count(*), count(*) filter (where win)
    from _otp_old group by 1, 2, 3, 4, 5, 6, 7
  on conflict (champion_id, opponent_id, patch, primary_style, sub_style, perks) do update
    set games = otp_rollup_runes.games + excluded.games, wins = otp_rollup_runes.wins + excluded.wins;

  insert into otp_rollup_skills (champion_id, opponent_id, patch, skill_max, games, wins)
    select champion_id, coalesce(opponent_champion_id, 0), patch, skill_max, count(*), count(*) filter (where win)
    from _otp_old where skill_max is not null group by 1, 2, 3, 4
  on conflict (champion_id, opponent_id, patch, skill_max) do update
    set games = otp_rollup_skills.games + excluded.games, wins = otp_rollup_skills.wins + excluded.wins;

  insert into otp_rollup_boots (champion_id, patch, boots, games, wins)
    select champion_id, patch, boots, count(*), count(*) filter (where win)
    from _otp_old where boots is not null group by 1, 2, 3
  on conflict (champion_id, patch, boots) do update
    set games = otp_rollup_boots.games + excluded.games, wins = otp_rollup_boots.wins + excluded.wins;

  insert into otp_rollup_matchups (champion_id, opponent_id, patch, games, wins, lane_games, lane_wins, lane_losses,
                                   gold_diff_15_sum, xp_diff_15_sum)
    select champion_id, opponent_champion_id, patch, count(*), count(*) filter (where win),
           count(*) filter (where gold_diff_15 is not null and xp_diff_15 is not null),
           count(*) filter (where gold_diff_15 > 0 and xp_diff_15 > 0),
           count(*) filter (where gold_diff_15 < 0 and xp_diff_15 < 0),
           coalesce(sum(gold_diff_15) filter (where gold_diff_15 is not null and xp_diff_15 is not null), 0),
           coalesce(sum(xp_diff_15) filter (where gold_diff_15 is not null and xp_diff_15 is not null), 0)
    from _otp_old where opponent_champion_id is not null group by 1, 2, 3
  on conflict (champion_id, opponent_id, patch) do update set
    games = otp_rollup_matchups.games + excluded.games,
    wins = otp_rollup_matchups.wins + excluded.wins,
    lane_games = otp_rollup_matchups.lane_games + excluded.lane_games,
    lane_wins = otp_rollup_matchups.lane_wins + excluded.lane_wins,
    lane_losses = otp_rollup_matchups.lane_losses + excluded.lane_losses,
    gold_diff_15_sum = otp_rollup_matchups.gold_diff_15_sum + excluded.gold_diff_15_sum,
    xp_diff_15_sum = otp_rollup_matchups.xp_diff_15_sum + excluded.xp_diff_15_sum;

  insert into otp_rollup_players (champion_id, puuid, patch, games, wins)
    select champion_id, puuid, patch, count(*), count(*) filter (where win) from _otp_old group by 1, 2, 3
  on conflict (champion_id, puuid, patch) do update
    set games = otp_rollup_players.games + excluded.games, wins = otp_rollup_players.wins + excluded.wins;

  delete from otp_games g using _otp_old o where g.match_id = o.match_id and g.puuid = o.puuid;
  get diagnostics moved = row_count;

  -- Keep only the newest `keep_patches` patches of history.
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

-- Only the collector (service_role) may run it.
revoke all on function public.otp_rollup_games(timestamptz, integer) from public, anon, authenticated;
grant execute on function public.otp_rollup_games(timestamptz, integer) to service_role;

-- ---- Views: raw + rolled-up, same columns as before ----

create or replace view public.otp_champion_stats with (security_invoker = true) as
with g as (
  select champion_id, count(*) as games, count(*) filter (where win) as wins from public.otp_games group by 1
  union all
  select champion_id, sum(games), sum(wins) from public.otp_rollup_champion group by 1
)
select
  g.champion_id,
  sum(g.games)::int as games,
  sum(g.wins)::int  as wins,
  (select count(*) from public.otp_players p where p.is_one_trick and p.main_champion_id = g.champion_id)::int as one_tricks,
  coalesce(
    (select x.patch from public.otp_games x where x.champion_id = g.champion_id order by x.game_start desc limit 1),
    (select r.patch from public.otp_rollup_champion r where r.champion_id = g.champion_id
       order by string_to_array(r.patch, '.')::int[] desc limit 1)
  ) as latest_patch
from g
group by g.champion_id;

create or replace view public.otp_build_stats with (security_invoker = true) as
select champion_id, core_items, sum(games)::int as games, sum(wins)::int as wins
from (
  select champion_id, core_items, 1 as games, case when win then 1 else 0 end as wins
  from public.otp_games where core_items is not null and cardinality(core_items) = 3
  union all
  select champion_id, core_items, games, wins from public.otp_rollup_builds
) s
group by champion_id, core_items;

create or replace view public.otp_boots_stats with (security_invoker = true) as
select champion_id, boots, sum(games)::int as games, sum(wins)::int as wins
from (
  select champion_id, boots, 1 as games, case when win then 1 else 0 end as wins
  from public.otp_games where boots is not null
  union all
  select champion_id, boots, games, wins from public.otp_rollup_boots
) s
group by champion_id, boots;

create or replace view public.otp_rune_stats with (security_invoker = true) as
select champion_id, keystone, primary_style, sub_style, perks, sum(games)::int as games, sum(wins)::int as wins
from (
  select champion_id, keystone, primary_style, sub_style, perks, 1 as games, case when win then 1 else 0 end as wins
  from public.otp_games
  union all
  select champion_id, keystone, primary_style, sub_style, perks, games, wins from public.otp_rollup_runes
) s
group by champion_id, keystone, primary_style, sub_style, perks;

create or replace view public.otp_skill_stats with (security_invoker = true) as
select champion_id, skill_max, sum(games)::int as games, sum(wins)::int as wins
from (
  select champion_id, skill_max, 1 as games, case when win then 1 else 0 end as wins
  from public.otp_games where skill_max is not null
  union all
  select champion_id, skill_max, games, wins from public.otp_rollup_skills
) s
group by champion_id, skill_max;

create or replace view public.otp_player_stats with (security_invoker = true) as
select
  s.champion_id, p.puuid, p.platform, p.game_name, p.tag_line, p.tier, p.league_points,
  sum(s.games)::int as games, sum(s.wins)::int as wins
from (
  select champion_id, puuid, 1 as games, case when win then 1 else 0 end as wins from public.otp_games
  union all
  select champion_id, puuid, games, wins from public.otp_rollup_players
) s
join public.otp_players p on p.puuid = s.puuid
group by s.champion_id, p.puuid, p.platform, p.game_name, p.tag_line, p.tier, p.league_points;

create or replace view public.otp_matchup_stats with (security_invoker = true) as
with s as (
  select
    champion_id, opponent_champion_id,
    1 as games,
    case when win then 1 else 0 end as wins,
    case when gold_diff_15 is not null and xp_diff_15 is not null then 1 else 0 end as lane_games,
    case when gold_diff_15 > 0 and xp_diff_15 > 0 then 1 else 0 end as lane_wins,
    case when gold_diff_15 < 0 and xp_diff_15 < 0 then 1 else 0 end as lane_losses,
    case when gold_diff_15 is not null and xp_diff_15 is not null then gold_diff_15 else 0 end::bigint as gold_sum,
    case when gold_diff_15 is not null and xp_diff_15 is not null then xp_diff_15 else 0 end::bigint as xp_sum
  from public.otp_games where opponent_champion_id is not null
  union all
  select champion_id, opponent_id, games, wins, lane_games, lane_wins, lane_losses, gold_diff_15_sum, xp_diff_15_sum
  from public.otp_rollup_matchups
)
select
  champion_id,
  opponent_champion_id,
  sum(games)::int       as games,
  sum(wins)::int        as wins,
  sum(lane_games)::int  as lane_games,
  sum(lane_wins)::int   as lane_wins,
  sum(lane_losses)::int as lane_losses,
  round(sum(gold_sum)::numeric / nullif(sum(lane_games), 0))::int as avg_gold_diff_15,
  round(sum(xp_sum)::numeric / nullif(sum(lane_games), 0))::int   as avg_xp_diff_15
from s
group by champion_id, opponent_champion_id;

create or replace view public.otp_matchup_build_stats with (security_invoker = true) as
select champion_id, opponent_champion_id, core_items, sum(games)::int as games, sum(wins)::int as wins
from (
  select champion_id, opponent_champion_id, core_items, 1 as games, case when win then 1 else 0 end as wins
  from public.otp_games
  where opponent_champion_id is not null and core_items is not null and cardinality(core_items) = 3
  union all
  select champion_id, opponent_id, core_items, games, wins from public.otp_rollup_builds where opponent_id <> 0
) s
group by champion_id, opponent_champion_id, core_items;

create or replace view public.otp_matchup_rune_stats with (security_invoker = true) as
select champion_id, opponent_champion_id, keystone, primary_style, sub_style, perks,
       sum(games)::int as games, sum(wins)::int as wins
from (
  select champion_id, opponent_champion_id, keystone, primary_style, sub_style, perks,
         1 as games, case when win then 1 else 0 end as wins
  from public.otp_games where opponent_champion_id is not null
  union all
  select champion_id, opponent_id, keystone, primary_style, sub_style, perks, games, wins
  from public.otp_rollup_runes where opponent_id <> 0
) s
group by champion_id, opponent_champion_id, keystone, primary_style, sub_style, perks;

create or replace view public.otp_matchup_skill_stats with (security_invoker = true) as
select champion_id, opponent_champion_id, skill_max, sum(games)::int as games, sum(wins)::int as wins
from (
  select champion_id, opponent_champion_id, skill_max, 1 as games, case when win then 1 else 0 end as wins
  from public.otp_games where opponent_champion_id is not null and skill_max is not null
  union all
  select champion_id, opponent_id, skill_max, games, wins from public.otp_rollup_skills where opponent_id <> 0
) s
group by champion_id, opponent_champion_id, skill_max;
