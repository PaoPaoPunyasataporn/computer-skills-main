-- ============================================================================
-- ⚠️  DESTRUCTIVE.  THIS DELETES EVERY CERTIFICATION RECORD.  ⚠️
--
-- This file is NOT part of setup. db/schema.sql is safe to run repeatedly and
-- never drops anything. Use this only when you deliberately want an empty
-- database — e.g. clearing test data before a real class starts.
--
-- There is no undo. Before running this against anything real:
--   1. Confirm which database you are pointed at:
--          psql "$DATABASE_URL" -c "select current_database(), current_user;"
--   2. Take a Neon branch as a restore point (instant, copy-on-write):
--          neonctl branches create --name pre-reset-backup
--      If you regret this, you can branch back from that point.
--
-- To actually run it you must uncomment the statements below. That is the
-- safety catch: a stray `psql -f db/reset.sql` does nothing on its own.
-- ============================================================================

-- drop table if exists certifications cascade;

-- Prefer this over dropping the table when you only want to clear data but keep
-- the schema. It also resets the id counter.
--
-- truncate table certifications restart identity;

do $$
begin
  raise notice 'db/reset.sql: nothing ran. Uncomment the statements inside if you really mean to wipe this database.';
end $$;
