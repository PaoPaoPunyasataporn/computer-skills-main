import { neon } from '@neondatabase/serverless';

// Returns a Neon SQL client, or null when DATABASE_URL is not configured
// (so the app still deploys and runs — certifications simply are not
// persisted; lesson progress never uses the database). The only server access is the
// certifications table via lib/cert-db.ts. Apply db/schema.sql once to create it.
export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}
