-- Region and lane filters: every rollup table and public view gains `platform`
-- (na1 / euw1 / kr) and `position` (TOP / JUNGLE / MIDDLE / BOTTOM / UTILITY)
-- columns, so the pages can show any mix of regions for one lane. Filtering by
-- lane also keeps off-role games (a top-lane one-trick's occasional support
-- game) out of a champion's lane matchups.
--
-- The rollup tables were still empty when this was written, so they are
-- recreated with the new keys rather than migrated.

drop view if exists public.otp_champion_stats, public.otp_build_stats, public.otp_boots_stats,
  public.otp_rune_stats, public.otp_skill_stats, public.otp_player_stats, public.otp_matchup_stats,
  public.otp_matchup_build_stats, public.otp_matchup_rune_stats, public.otp_matchup_skill_stats,
  public.otp_champion_one_tricks;

drop function if exists public.otp_rollup_games(timestamptz, integer);

drop table if exists public.otp_rollup_champion, public.otp_rollup_builds, public.otp_rollup_runes,
  public.otp_rollup_skills, public.otp_rollup_boots, public.otp_rollup_matchups, public.otp_rollup_players;

create table public.otp_rollup_champion (
  champion_id integer not null,
  platform    text    not null,
  position    text    not null,
  patch       text    not null,
  games       integer not null,
  wins        integer not null,
  primary key (champion_id, platform, position, patch)
);

create table public.otp_rollup_builds (
  champion_id integer   not null,
  opponent_id integer   not null,
  platform    text      not null,
  position    text      not null,
  patch       text      not null,
  core_items  integer[] not null,
  games       integer   not null,
  wins        integer   not null,
  primary key (champion_id, opponent_id, platform, position, patch, core_items)
);

create table public.otp_rollup_runes (
  champion_id   integer   not null,
  opponent_id   integer   not null,
  platform      text      not null,
  position      text      not null,
  patch         text      not null,
  keystone      integer   not null,
  primary_style integer   not null,
  sub_style     integer   not null,
  perks         integer[] not null,
  games         integer   not null,
  wins          integer   not null,
  primary key (champion_id, opponent_id, platform, position, patch, primary_style, sub_style, perks)
);

create table public.otp_rollup_skills (
  champion_id integer not null,
  opponent_id integer not null,
  platform    text    not null,
  position    text    not null,
  patch       text    not null,
  skill_max   text    not null,
  games       integer not null,
  wins        integer not null,
  primary key (champion_id, opponent_id, platform, position, patch, skill_max)
);

create table public.otp_rollup_boots (
  champion_id integer not null,
  platform    text    not null,
  position    text    not null,
  patch       text    not null,
  boots       integer not null,
  games       integer not null,
  wins        integer not null,
  primary key (champion_id, platform, position, patch, boots)
);

create table public.otp_rollup_matchups (
  champion_id integer not null,
  opponent_id integer not null,
  platform    text    not null,
  position    text    not null,
  patch       text    not null,
  games       integer not null,
  wins        integer not null,
  lane_games  integer not null,
  lane_wins   integer not null,
  lane_losses integer not null,
  gold_diff_15_sum bigint not null,
  xp_diff_15_sum   bigint not null,
  primary key (champion_id, opponent_id, platform, position, patch)
);

create table public.otp_rollup_players (
  champion_id integer not null,
  puuid       text    not null references public.otp_players (puuid) on delete cascade,
  position    text    not null,
  patch       text    not null,
  games       integer not null,
  wins        integer not null,
  primary key (champion_id, puuid, position, patch)
);

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

create index if not exists otp_games_champion_position_idx on public.otp_games (champion_id, team_position, platform);

-- Fold games older than `cutoff` into the rollups and delete them, then drop
-- rollup rows for patches older than the newest `keep_patches`. One
-- transaction, so a game is never counted twice or lost. Returns games moved.
create function public.otp_rollup_games(cutoff timestamptz, keep_patches integer default 6)
returns integer
language plpgsql
set search_path = public
as $$
declare
  moved integer;
begin
  create temp table _otp_old on commit drop as
    select g.*, coalesce(nullif(g.team_position, ''), 'NONE') as position
    from otp_games g where g.game_start < cutoff;

  insert into otp_rollup_champion (champion_id, platform, position, patch, games, wins)
    select champion_id, platform, position, patch, count(*), count(*) filter (where win)
    from _otp_old group by 1, 2, 3, 4
  on conflict (champion_id, platform, position, patch) do update
    set games = otp_rollup_champion.games + excluded.games, wins = otp_rollup_champion.wins + excluded.wins;

  insert into otp_rollup_builds (champion_id, opponent_id, platform, position, patch, core_items, games, wins)
    select champion_id, coalesce(opponent_champion_id, 0), platform, position, patch, core_items,
           count(*), count(*) filter (where win)
    from _otp_old where core_items is not null and cardinality(core_items) = 3 group by 1, 2, 3, 4, 5, 6
  on conflict (champion_id, opponent_id, platform, position, patch, core_items) do update
    set games = otp_rollup_builds.games + excluded.games, wins = otp_rollup_builds.wins + excluded.wins;

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
                                   lane_games, lane_wins, lane_losses, gold_diff_15_sum, xp_diff_15_sum)
    select champion_id, opponent_champion_id, platform, position, patch, count(*), count(*) filter (where win),
           count(*) filter (where gold_diff_15 is not null and xp_diff_15 is not null),
           count(*) filter (where gold_diff_15 > 0 and xp_diff_15 > 0),
           count(*) filter (where gold_diff_15 < 0 and xp_diff_15 < 0),
           coalesce(sum(gold_diff_15) filter (where gold_diff_15 is not null and xp_diff_15 is not null), 0),
           coalesce(sum(xp_diff_15) filter (where gold_diff_15 is not null and xp_diff_15 is not null), 0)
    from _otp_old where opponent_champion_id is not null group by 1, 2, 3, 4, 5
  on conflict (champion_id, opponent_id, platform, position, patch) do update set
    games = otp_rollup_matchups.games + excluded.games,
    wins = otp_rollup_matchups.wins + excluded.wins,
    lane_games = otp_rollup_matchups.lane_games + excluded.lane_games,
    lane_wins = otp_rollup_matchups.lane_wins + excluded.lane_wins,
    lane_losses = otp_rollup_matchups.lane_losses + excluded.lane_losses,
    gold_diff_15_sum = otp_rollup_matchups.gold_diff_15_sum + excluded.gold_diff_15_sum,
    xp_diff_15_sum = otp_rollup_matchups.xp_diff_15_sum + excluded.xp_diff_15_sum;

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

-- ---- Views: raw + rolled-up, one row per champion x platform x position x key ----
-- The site sums rows across the regions and lane the visitor picked.

create view public.otp_champion_stats with (security_invoker = true) as
select
  champion_id, platform, position,
  sum(games)::int as games,
  sum(wins)::int  as wins,
  (array_agg(patch order by string_to_array(patch, '.')::int[] desc))[1] as latest_patch
from (
  select champion_id, platform, coalesce(nullif(team_position, ''), 'NONE') as position, patch,
         count(*) as games, count(*) filter (where win) as wins
  from public.otp_games group by 1, 2, 3, 4
  union all
  select champion_id, platform, position, patch, games, wins from public.otp_rollup_champion
) s
group by champion_id, platform, position;

create view public.otp_champion_one_tricks with (security_invoker = true) as
select main_champion_id as champion_id, platform, count(*)::int as one_tricks
from public.otp_players
where is_one_trick and main_champion_id is not null
group by 1, 2;

create view public.otp_build_stats with (security_invoker = true) as
select champion_id, platform, position, core_items, sum(games)::int as games, sum(wins)::int as wins
from (
  select champion_id, platform, coalesce(nullif(team_position, ''), 'NONE') as position, core_items,
         1 as games, case when win then 1 else 0 end as wins
  from public.otp_games where core_items is not null and cardinality(core_items) = 3
  union all
  select champion_id, platform, position, core_items, games, wins from public.otp_rollup_builds
) s
group by champion_id, platform, position, core_items;

create view public.otp_boots_stats with (security_invoker = true) as
select champion_id, platform, position, boots, sum(games)::int as games, sum(wins)::int as wins
from (
  select champion_id, platform, coalesce(nullif(team_position, ''), 'NONE') as position, boots,
         1 as games, case when win then 1 else 0 end as wins
  from public.otp_games where boots is not null
  union all
  select champion_id, platform, position, boots, games, wins from public.otp_rollup_boots
) s
group by champion_id, platform, position, boots;

create view public.otp_rune_stats with (security_invoker = true) as
select champion_id, platform, position, keystone, primary_style, sub_style, perks,
       sum(games)::int as games, sum(wins)::int as wins
from (
  select champion_id, platform, coalesce(nullif(team_position, ''), 'NONE') as position,
         keystone, primary_style, sub_style, perks, 1 as games, case when win then 1 else 0 end as wins
  from public.otp_games
  union all
  select champion_id, platform, position, keystone, primary_style, sub_style, perks, games, wins
  from public.otp_rollup_runes
) s
group by champion_id, platform, position, keystone, primary_style, sub_style, perks;

create view public.otp_skill_stats with (security_invoker = true) as
select champion_id, platform, position, skill_max, sum(games)::int as games, sum(wins)::int as wins
from (
  select champion_id, platform, coalesce(nullif(team_position, ''), 'NONE') as position, skill_max,
         1 as games, case when win then 1 else 0 end as wins
  from public.otp_games where skill_max is not null
  union all
  select champion_id, platform, position, skill_max, games, wins from public.otp_rollup_skills
) s
group by champion_id, platform, position, skill_max;

create view public.otp_player_stats with (security_invoker = true) as
select
  s.champion_id, s.position, p.puuid, p.platform, p.game_name, p.tag_line, p.tier, p.league_points,
  sum(s.games)::int as games, sum(s.wins)::int as wins
from (
  select champion_id, puuid, coalesce(nullif(team_position, ''), 'NONE') as position,
         1 as games, case when win then 1 else 0 end as wins
  from public.otp_games
  union all
  select champion_id, puuid, position, games, wins from public.otp_rollup_players
) s
join public.otp_players p on p.puuid = s.puuid
group by s.champion_id, s.position, p.puuid, p.platform, p.game_name, p.tag_line, p.tier, p.league_points;

create view public.otp_matchup_stats with (security_invoker = true) as
with s as (
  select
    champion_id, opponent_champion_id, platform, coalesce(nullif(team_position, ''), 'NONE') as position,
    1 as games,
    case when win then 1 else 0 end as wins,
    case when gold_diff_15 is not null and xp_diff_15 is not null then 1 else 0 end as lane_games,
    case when gold_diff_15 > 0 and xp_diff_15 > 0 then 1 else 0 end as lane_wins,
    case when gold_diff_15 < 0 and xp_diff_15 < 0 then 1 else 0 end as lane_losses,
    case when gold_diff_15 is not null and xp_diff_15 is not null then gold_diff_15 else 0 end::bigint as gold_sum,
    case when gold_diff_15 is not null and xp_diff_15 is not null then xp_diff_15 else 0 end::bigint as xp_sum
  from public.otp_games where opponent_champion_id is not null
  union all
  select champion_id, opponent_id, platform, position, games, wins, lane_games, lane_wins, lane_losses,
         gold_diff_15_sum, xp_diff_15_sum
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
  sum(xp_sum)::bigint   as xp_diff_15_sum
from s
group by champion_id, opponent_champion_id, platform, position;

create view public.otp_matchup_build_stats with (security_invoker = true) as
select champion_id, opponent_champion_id, platform, position, core_items, sum(games)::int as games, sum(wins)::int as wins
from (
  select champion_id, opponent_champion_id, platform, coalesce(nullif(team_position, ''), 'NONE') as position,
         core_items, 1 as games, case when win then 1 else 0 end as wins
  from public.otp_games
  where opponent_champion_id is not null and core_items is not null and cardinality(core_items) = 3
  union all
  select champion_id, opponent_id, platform, position, core_items, games, wins
  from public.otp_rollup_builds where opponent_id <> 0
) s
group by champion_id, opponent_champion_id, platform, position, core_items;

create view public.otp_matchup_rune_stats with (security_invoker = true) as
select champion_id, opponent_champion_id, platform, position, keystone, primary_style, sub_style, perks,
       sum(games)::int as games, sum(wins)::int as wins
from (
  select champion_id, opponent_champion_id, platform, coalesce(nullif(team_position, ''), 'NONE') as position,
         keystone, primary_style, sub_style, perks, 1 as games, case when win then 1 else 0 end as wins
  from public.otp_games where opponent_champion_id is not null
  union all
  select champion_id, opponent_id, platform, position, keystone, primary_style, sub_style, perks, games, wins
  from public.otp_rollup_runes where opponent_id <> 0
) s
group by champion_id, opponent_champion_id, platform, position, keystone, primary_style, sub_style, perks;

create view public.otp_matchup_skill_stats with (security_invoker = true) as
select champion_id, opponent_champion_id, platform, position, skill_max, sum(games)::int as games, sum(wins)::int as wins
from (
  select champion_id, opponent_champion_id, platform, coalesce(nullif(team_position, ''), 'NONE') as position,
         skill_max, 1 as games, case when win then 1 else 0 end as wins
  from public.otp_games where opponent_champion_id is not null and skill_max is not null
  union all
  select champion_id, opponent_id, platform, position, skill_max, games, wins
  from public.otp_rollup_skills where opponent_id <> 0
) s
group by champion_id, opponent_champion_id, platform, position, skill_max;

grant select on public.otp_champion_stats, public.otp_champion_one_tricks, public.otp_build_stats,
  public.otp_boots_stats, public.otp_rune_stats, public.otp_skill_stats, public.otp_player_stats,
  public.otp_matchup_stats, public.otp_matchup_build_stats, public.otp_matchup_rune_stats,
  public.otp_matchup_skill_stats to anon, authenticated;
