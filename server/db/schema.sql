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
