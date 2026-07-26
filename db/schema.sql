-- ============================================================================
-- Neon schema — SAFE TO RUN REPEATEDLY.
--
-- Every statement is idempotent: running this file against a database that
-- already has these tables changes nothing and destroys nothing. There are no
-- DROP statements here on purpose. If you need to wipe the database, that is a
-- separate, explicit action: see db/reset.sql.
--
--   psql "$DATABASE_URL" -f db/schema.sql      -- or paste into Neon's SQL Editor
--
-- Access model (enforced in the API route handlers, see lib/auth.ts):
--   * There are NO student or teacher accounts. Kids play anonymously; progress
--     lives in the browser (localStorage).
--   * When a child clears the final boss fight they type their name once. That
--     name (plus their score %) is written to `certifications` — the single
--     record this app keeps.
--   * The operator opens /admin (guarded by ADMIN_PASSWORD) to see who passed.
-- ============================================================================

create table if not exists certifications (
  id          serial primary key,
  name        text not null,
  score       integer,                     -- percent 0-100; null if not reported
  created_at  timestamptz not null default now()
);

-- Bring older databases (created before the score column existed) up to date.
alter table certifications add column if not exists score integer;

create index if not exists certifications_created_idx on certifications(created_at desc);

-- ============================================================================
-- Competition area (/compete) — live head-to-head races between students.
--
-- Still NO accounts: a child types a nickname and a 4-character room code. These
-- rows are throwaway scratch state for one race, not a record of anybody. Sweep
-- them whenever you like; nothing else depends on them.
-- ============================================================================

create table if not exists compete_rooms (
  code        text primary key,                       -- 4 chars, e.g. 'K7QP'
  mode        text not null,                          -- 'typing' | 'clicking' | 'quiz'
  status      text not null default 'lobby',          -- 'lobby' | 'running' | 'done'
  seed        bigint not null,                        -- every player derives the same items from this
  rounds      integer not null,
  started_at  timestamptz,
  created_at  timestamptz not null default now()
);

create table if not exists compete_players (
  id          text primary key,
  room_code   text not null references compete_rooms(code) on delete cascade,
  name        text not null,
  avatar      text not null default '🐣',
  score       integer not null default 0,
  progress    integer not null default 0,             -- 0-100, drives the live race bar
  is_host     boolean not null default false,
  finished_at timestamptz,
  last_seen   timestamptz not null default now(),
  joined_at   timestamptz not null default now()
);

create index if not exists compete_players_room_idx on compete_players(room_code, joined_at);
create index if not exists compete_rooms_created_idx on compete_rooms(created_at desc);
