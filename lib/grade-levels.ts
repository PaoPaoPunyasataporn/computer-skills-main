// The Thai school grade-level scale used on the certification form: primary
// ป.1–ป.6 (Prathom, grades 1-6) then lower-secondary ม.1–ม.3 (Matthayom, grades
// 1-3). Shared between the client (CertificateModal grade picker) and the server
// (app/api/certify validates against this exact list) so they can never drift.
export const GRADE_LEVELS = ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6', 'ม.1', 'ม.2', 'ม.3'] as const;
export type GradeLevel = (typeof GRADE_LEVELS)[number];
export function isGradeLevel(v: unknown): v is GradeLevel {
  return typeof v === 'string' && (GRADE_LEVELS as readonly string[]).includes(v);
}
