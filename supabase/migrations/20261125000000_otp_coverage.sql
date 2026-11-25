-- Coverage-first crawling: remember each player's top mastery champion (from a
-- cheap platform-host call) so expensive match crawling can go to champions
-- with the fewest known one-tricks first. Wins/losses come free with the
-- ladder and rank "lots of games" players higher within a champion.

alter table public.otp_players
  add column if not exists wins integer,
  add column if not exists losses integer,
  add column if not exists top_mastery_champion_id integer,
  add column if not exists top_mastery_share real,
  add column if not exists last_mastery_check_at timestamptz;

create index if not exists otp_players_mastery_idx
  on public.otp_players (platform, last_mastery_check_at nulls first);
