-- TripMate AI database schema
-- Run this once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- It is safe to re-run: every statement is idempotent.

create extension if not exists "pgcrypto";

-- A trip created by a coordinator. `code` is the short shareable code.
create table if not exists trips (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique,
  name                text not null,
  coordinator_name    text not null,
  expected_travellers integer not null check (expected_travellers between 1 and 50),
  departing_from      text,
  currency            text not null default 'USD',
  created_at          timestamptz not null default now()
);

-- One row per person who has responded to a trip.
-- `name_key` is the lower-cased, trimmed name, so "Priya" and " priya " are the same person
-- and re-submitting with the same name updates the existing response.
create table if not exists participants (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references trips(id) on delete cascade,
  name       text not null,
  name_key   text not null,
  created_at timestamptz not null default now(),
  unique (trip_id, name_key)
);

-- A participant's trip preferences (one row per participant).
create table if not exists preferences (
  id                uuid primary key default gen_random_uuid(),
  participant_id    uuid not null unique references participants(id) on delete cascade,
  budget_max        integer not null check (budget_max > 0),
  available_start   date not null,
  available_end     date not null,
  destination_types text[] not null default '{}',
  trip_styles       text[] not null default '{}',
  must_haves        text not null default '',
  avoid             text not null default '',
  flexibility       text not null check (flexibility in ('Low', 'Medium', 'High')),
  updated_at        timestamptz not null default now(),
  check (available_end >= available_start)
);

-- AI analyses generated for a trip. The latest row is shown on the results page.
create table if not exists analyses (
  id                   uuid primary key default gen_random_uuid(),
  trip_id              uuid not null references trips(id) on delete cascade,
  response_count       integer not null,
  responses_updated_at timestamptz,
  model                text not null,
  result               jsonb not null,
  created_at           timestamptz not null default now()
);

create index if not exists participants_trip_id_idx on participants (trip_id);
create index if not exists analyses_trip_id_created_idx on analyses (trip_id, created_at desc);

-- Row Level Security: enabled with NO policies, so the public anon key can read nothing.
-- The app only talks to the database from the server using the service role key.
alter table trips        enable row level security;
alter table participants enable row level security;
alter table preferences  enable row level security;
alter table analyses     enable row level security;
