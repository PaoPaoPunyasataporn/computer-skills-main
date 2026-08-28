// Data access via the Neon owner-role client (lib/db.ts, DATABASE_URL).
// When DATABASE_URL is unset every function no-ops so the app still runs — in
// that case certifications simply are not persisted server-side.
//
// This app keeps exactly one kind of record: a certification (a child's name,
// score, and the moment they cleared the final boss fight). No student/teacher
// accounts.
import { getSql } from './db';

export type Certification = { id: number; name: string; score: number | null; grade_level: string | null; created_at: string };

// Record that someone passed the certification. `score` is a percent (0-100) or
// null if the game did not report one. `gradeLevel` is one of GRADE_LEVELS (see
// lib/grade-levels.ts) or null. Returns the new row's id, or null when the
// database is not configured.
export async function addCertification(name: string, gradeLevel: string | null, score: number | null): Promise<number | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = (await sql`
    insert into certifications (name, grade_level, score) values (${name}, ${gradeLevel}, ${score})
    returning id`) as { id: number }[];
  return rows[0]?.id ?? null;
}

// Everyone who has passed, newest first — for the admin dashboard.
export async function listCertifications(): Promise<Certification[]> {
  const sql = getSql();
  if (!sql) return [];
  return (await sql`
    select id, name, grade_level, score, created_at
    from certifications
    order by created_at desc, id desc`) as Certification[];
}
