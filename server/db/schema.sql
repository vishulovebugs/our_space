-- Pixel Hall - profiles
-- Run once in the Supabase SQL editor.
--
-- The username regex must stay in sync with USERNAME_PATTERN in
-- shared/validators.js; shared/validators.test.js fails if they drift.

create extension if not exists citext;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username citext unique not null,
  character jsonb,
  created_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[A-Za-z0-9_]{3,16}$')
);

alter table public.profiles enable row level security;

-- Usernames are readable by everyone, including signed-out visitors: the
-- create-account form checks availability before a session exists.
drop policy if exists "profiles are readable by everyone" on public.profiles;
create policy "profiles are readable by everyone"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

drop policy if exists "users insert their own profile" on public.profiles;
create policy "users insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "users update their own profile" on public.profiles;
create policy "users update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Pixel Hall - adventure saves
-- One row per player: their cave state, as the engine serialises it. Only the
-- owner can read or write it; the leaderboard view below exposes name and
-- score only, never the save itself.

create table if not exists public.adventure_saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.adventure_saves enable row level security;

drop policy if exists "players keep their own adventure save" on public.adventure_saves;
create policy "players keep their own adventure save"
  on public.adventure_saves
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Best cavers first. A view runs as its owner, so it may read profiles and
-- saves that the caller's RLS would otherwise hide; it only ever returns a
-- username, a score, a turn count and a timestamp.
create or replace view public.adventure_leaderboard as
select
  s.user_id,
  p.username,
  coalesce((s.state ->> 'score')::int, 0) as score,
  coalesce((s.state ->> 'turns')::int, 0) as turns,
  s.updated_at
from public.adventure_saves s
join public.profiles p on p.id = s.user_id
order by score desc, turns asc, s.updated_at asc
limit 100;

grant select on public.adventure_leaderboard to anon, authenticated;
