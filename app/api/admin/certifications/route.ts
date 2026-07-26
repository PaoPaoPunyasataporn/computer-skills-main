import { NextResponse } from 'next/server';
import { listCertifications } from '@/lib/cert-db';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Everyone who has passed the certification. Admin session required.
export async function GET() {
  if (!(await requireAdmin()))
    return NextResponse.json({ ok: false, error: 'ต้องเข้าสู่ระบบก่อน' }, { status: 401 });

  try {
    return NextResponse.json({ ok: true, certifications: await listCertifications() });
  } catch (e) {
    console.error('admin certifications GET failed:', e);
    return NextResponse.json({ ok: false, error: 'server error' }, { status: 500 });
  }
}
