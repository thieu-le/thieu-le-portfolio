-- One-Trick Stats (/otp) schema.
--
-- Raw rows live in two tables written only by the collector (service_role key,
-- which bypasses RLS). The site reads the security_invoker views below with
-- the anon key; RLS lets anon SELECT and nothing else.
--
-- Size budget (Supabase free tier = 500 MB): otp_games is pruned by the
-- collector to the last RETENTION_DAYS (default 45, about 3 patches).

create table if not exists public.otp_players (
  puuid               text primary key,
  platform            text not null,            -- na1 | euw1 | kr
  tier                text not null,            -- CHALLENGER | GRANDMASTER | MASTER
  league_points       integer not null default 0,
  game_name           text,
  tag_line            text,
  is_one_trick        boolean not null default false,
  main_champion_id    integer,                  -- set when is_one_trick
  main_champion_share real,                     -- 0..1 over the classification sample
  sample_size         integer,
  last_seen_apex_at   timestamptz not null default now(),
  last_classified_at  timestamptz,
  last_match_check_at timestamptz,
  last_account_check_at timestamptz,
  updated_at          timestamptz not null default now()
);

create index if not exists otp_players_one_trick_idx
  on public.otp_players (is_one_trick, main_champion_id);
create index if not exists otp_players_classify_idx
  on public.otp_players (platform, last_classified_at nulls first);

-- One row per (match, one-trick) for games played on that player's main.
create table if not exists public.otp_games (
  match_id        text not null,
  puuid           text not null references public.otp_players (puuid) on delete cascade,
  platform        text not null,
  patch           text not null,                -- e.g. '15.23'
  champion_id     integer not null,
  team_position   text,
  win             boolean not null,
  game_start      timestamptz not null,
  game_duration   integer not null,             -- seconds
  kills           smallint not null,
  deaths          smallint not null,
  assists         smallint not null,
  items           integer[] not null,           -- final inventory, slots 0-5 (0 = empty)
  boots           integer,                      -- from the timeline, null without one
  core_items      integer[],                    -- first 3 completed items in purchase order (timeline)
  skill_order     text,                         -- e.g. 'QWEQQRQEQE...' (timeline)
  skill_max       text,                         -- e.g. 'Q>E>W' (timeline)
  keystone        integer not null,
  primary_style   integer not null,
  sub_style       integer not null,
  perks           integer[] not null,           -- 6 rune selections in order
  stat_perks      integer[] not null,           -- offense, flex, defense shards
  summoner_spells integer[] not null,
  primary key (match_id, puuid)
);

create index if not exists otp_games_champion_idx on public.otp_games (champion_id);
create index if not exists otp_games_game_start_idx on public.otp_games (game_start);
create index if not exists otp_games_puuid_idx on public.otp_games (puuid);

-- Row level security: public read, no public writes.
alter table public.otp_players enable row level security;
alter table public.otp_games enable row level security;

drop policy if exists "otp_players public read" on public.otp_players;
create policy "otp_players public read" on public.otp_players
  for select to anon, authenticated using (true);

drop policy if exists "otp_games public read" on public.otp_games;
create policy "otp_games public read" on public.otp_games
  for select to anon, authenticated using (true);

-- Aggregate views. Plain (not materialized) views are fine at this size: a few
-- hundred thousand rows at most, and the site caches responses for an hour.

create or replace view public.otp_champion_stats with (security_invoker = true) as
select
  g.champion_id,
  count(*)::int                        as games,
  count(*) filter (where g.win)::int   as wins,
  count(distinct g.puuid)::int         as one_tricks,
  (array_agg(g.patch order by g.game_start desc))[1] as latest_patch
from public.otp_games g
group by g.champion_id;

create or replace view public.otp_build_stats with (security_invoker = true) as
select
  g.champion_id,
  g.core_items,
  count(*)::int                        as games,
  count(*) filter (where g.win)::int   as wins
from public.otp_games g
where g.core_items is not null and cardinality(g.core_items) = 3
group by g.champion_id, g.core_items;

create or replace view public.otp_boots_stats with (security_invoker = true) as
select
  g.champion_id,
  g.boots,
  count(*)::int                        as games,
  count(*) filter (where g.win)::int   as wins
from public.otp_games g
where g.boots is not null
group by g.champion_id, g.boots;

create or replace view public.otp_rune_stats with (security_invoker = true) as
select
  g.champion_id,
  g.keystone,
  g.primary_style,
  g.sub_style,
  g.perks,
  count(*)::int                        as games,
  count(*) filter (where g.win)::int   as wins
from public.otp_games g
group by g.champion_id, g.keystone, g.primary_style, g.sub_style, g.perks;

create or replace view public.otp_skill_stats with (security_invoker = true) as
select
  g.champion_id,
  g.skill_max,
  count(*)::int                        as games,
  count(*) filter (where g.win)::int   as wins
from public.otp_games g
where g.skill_max is not null
group by g.champion_id, g.skill_max;

create or replace view public.otp_player_stats with (security_invoker = true) as
select
  g.champion_id,
  p.puuid,
  p.platform,
  p.game_name,
  p.tag_line,
  p.tier,
  p.league_points,
  count(*)::int                        as games,
  count(*) filter (where g.win)::int   as wins
from public.otp_games g
join public.otp_players p on p.puuid = g.puuid
group by g.champion_id, p.puuid, p.platform, p.game_name, p.tag_line, p.tier, p.league_points;

grant select on
  public.otp_champion_stats,
  public.otp_build_stats,
  public.otp_boots_stats,
  public.otp_rune_stats,
  public.otp_skill_stats,
  public.otp_player_stats
to anon, authenticated;
