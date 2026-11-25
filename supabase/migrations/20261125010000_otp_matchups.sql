-- Matchups: who the one-trick laned against and how the lane went.
--
-- Lane result uses gold and XP difference vs the lane opponent at 15:00
-- (from the match timeline): ahead in both = lane win, behind in both = lane
-- loss, mixed = even. Null when there's no timeline, no clear lane opponent,
-- or the game ended before 15:00.

alter table public.otp_games
  add column if not exists opponent_champion_id integer,
  add column if not exists gold_diff_10 integer,
  add column if not exists xp_diff_10 integer,
  add column if not exists gold_diff_15 integer,
  add column if not exists xp_diff_15 integer;

create index if not exists otp_games_matchup_idx
  on public.otp_games (champion_id, opponent_champion_id);

create or replace view public.otp_matchup_stats with (security_invoker = true) as
select
  g.champion_id,
  g.opponent_champion_id,
  count(*)::int                                                          as games,
  count(*) filter (where g.win)::int                                     as wins,
  count(*) filter (where g.gold_diff_15 is not null and g.xp_diff_15 is not null)::int as lane_games,
  count(*) filter (where g.gold_diff_15 > 0 and g.xp_diff_15 > 0)::int   as lane_wins,
  count(*) filter (where g.gold_diff_15 < 0 and g.xp_diff_15 < 0)::int   as lane_losses,
  round(avg(g.gold_diff_15))::int                                        as avg_gold_diff_15,
  round(avg(g.xp_diff_15))::int                                          as avg_xp_diff_15
from public.otp_games g
where g.opponent_champion_id is not null
group by g.champion_id, g.opponent_champion_id;

create or replace view public.otp_matchup_build_stats with (security_invoker = true) as
select
  g.champion_id,
  g.opponent_champion_id,
  g.core_items,
  count(*)::int                        as games,
  count(*) filter (where g.win)::int   as wins
from public.otp_games g
where g.opponent_champion_id is not null
  and g.core_items is not null and cardinality(g.core_items) = 3
group by g.champion_id, g.opponent_champion_id, g.core_items;

create or replace view public.otp_matchup_rune_stats with (security_invoker = true) as
select
  g.champion_id,
  g.opponent_champion_id,
  g.keystone,
  g.primary_style,
  g.sub_style,
  g.perks,
  count(*)::int                        as games,
  count(*) filter (where g.win)::int   as wins
from public.otp_games g
where g.opponent_champion_id is not null
group by g.champion_id, g.opponent_champion_id, g.keystone, g.primary_style, g.sub_style, g.perks;

create or replace view public.otp_matchup_skill_stats with (security_invoker = true) as
select
  g.champion_id,
  g.opponent_champion_id,
  g.skill_max,
  count(*)::int                        as games,
  count(*) filter (where g.win)::int   as wins
from public.otp_games g
where g.opponent_champion_id is not null and g.skill_max is not null
group by g.champion_id, g.opponent_champion_id, g.skill_max;

grant select on
  public.otp_matchup_stats,
  public.otp_matchup_build_stats,
  public.otp_matchup_rune_stats,
  public.otp_matchup_skill_stats
to anon, authenticated;
