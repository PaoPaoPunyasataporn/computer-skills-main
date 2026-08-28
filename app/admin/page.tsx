'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type Cert = { id: number; name: string; score: number | null; grade_level: string | null; created_at: string };

const field: React.CSSProperties = { padding: '12px 14px', border: '1.5px solid var(--line)', borderRadius: 12, fontFamily: 'Sarabun', fontSize: 16, background: '#FFFDF6', width: '100%' };

function fmt(ts: string): string {
  try {
    return new Date(ts).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
  } catch { return ts; }
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null); // null = still checking
  const [certs, setCerts] = useState<Cert[]>([]);
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const r = await fetch('/api/admin/certifications');
      if (r.status === 401) { setAuthed(false); setBusy(false); return; }
      const d = await r.json();
      if (d.ok) { setAuthed(true); setCerts(d.certifications || []); }
    } catch { setErr('เชื่อมต่อไม่ได้'); }
    setBusy(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  async function signIn() {
    setErr(''); setBusy(true);
    try {
      const r = await fetch('/api/admin/auth', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const d = await r.json().catch(() => ({ ok: false, error: 'เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง' }));
      if (!d.ok) { setErr(d.error || 'เข้าสู่ระบบไม่ได้'); setBusy(false); return; }
      setPassword('');
      // The auth response has set the HttpOnly session cookie. Show the dashboard
      // immediately, then load the records in the background instead of making the
      // login button appear frozen while a second request is in flight.
      setAuthed(true);
      setBusy(false);
      void load();
    } catch { setErr('เชื่อมต่อไม่ได้'); setBusy(false); }
  }

  async function signOut() {
    await fetch('/api/logout', { method: 'POST' });
    setAuthed(false); setCerts([]);
  }

  if (authed === null) {
    return <Shell><div style={{ padding: 40, textAlign: 'center', fontFamily: 'Sarabun', color: 'var(--muted2)' }}>กำลังโหลด…</div></Shell>;
  }

  if (!authed) {
    return (
      <Shell>
        <div style={{ maxWidth: 420, margin: '30px auto' }}>
          <div style={{ background: '#fff', border: '2px solid var(--line)', borderBottomWidth: 5, borderRadius: 20, padding: 26 }}>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{ fontSize: 46 }}>🔐</div>
              <h1 style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 24, margin: '6px 0 2px' }}>แดชบอร์ดผู้ดูแล</h1>
              <p style={{ fontFamily: 'Sarabun', fontSize: 14, color: 'var(--muted2)' }}>ใส่รหัสผ่านผู้ดูแลเพื่อดูรายชื่อผู้ผ่านการรับรอง</p>
            </div>
            <input style={field} type="password" placeholder="รหัสผ่านผู้ดูแล" autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && signIn()} />
            {err && <div style={{ color: '#C23B2A', fontFamily: 'Sarabun', fontSize: 14, marginTop: 8 }}>{err}</div>}
            <button className="btn3d blue" style={{ width: '100%', marginTop: 14, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={signIn}>
              {busy ? '...' : 'เข้าสู่ระบบ'}
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 18 }}>
            <Link className="btn-ghost3d" href="/" style={{ display: 'inline-flex' }}>← กลับหน้าหลัก</Link>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell right={
      <button className="btn-ghost3d" style={{ padding: '9px 16px', fontSize: 14 }} onClick={signOut}>ออกจากระบบ</button>
    }>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 24, flex: 1 }}>🏆 ผู้ผ่านการรับรอง</h2>
        <span style={{ fontFamily: 'Sarabun', fontSize: 14, color: 'var(--muted2)' }}>ทั้งหมด {certs.length} คน</span>
        <button className="btn-ghost3d" style={{ padding: '9px 16px', fontSize: 14 }} disabled={busy} onClick={load}>{busy ? '...' : 'รีเฟรช ↻'}</button>
      </div>

      <div className="card3d" style={{ padding: 0, overflow: 'hidden', borderBottomColor: 'var(--line-d)' }}>
        {certs.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted2)', fontFamily: 'Sarabun' }}>
            ยังไม่มีใครผ่านบอสไฟท์สุดท้าย — เมื่อมีนักเรียนผ่าน ชื่อจะปรากฏที่นี่
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Sarabun' }}>
              <thead>
                <tr style={{ background: 'var(--cream)', textAlign: 'left', fontFamily: 'Mitr', fontSize: 14, color: 'var(--muted2)' }}>
                  <th style={{ padding: '12px 16px', width: 60 }}>#</th>
                  <th style={{ padding: '12px 16px' }}>ชื่อนักเรียน</th>
                  <th style={{ padding: '12px 16px', width: 90 }}>ระดับชั้น</th>
                  <th style={{ padding: '12px 16px', width: 110 }}>คะแนน</th>
                  <th style={{ padding: '12px 16px', width: 240 }}>วันที่ผ่าน</th>
                </tr>
              </thead>
              <tbody>
                {certs.map((c, i) => (
                  <tr key={c.id} style={{ borderTop: '1px solid var(--line)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--muted2)', fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 16 }}>{c.name}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted2)' }}>{c.grade_level ?? '—'}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--green-d)', fontWeight: 700 }}>{c.score == null ? '—' : `${c.score}%`}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted2)' }}>{fmt(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="page">
      <div className="shell">
        <div className="appwin">
          <div className="topbar">
            <Link href="/" className="brand">
              <span className="brand-logo"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg></span>
              <span className="brand-name">แดชบอร์ด<span>ผู้ดูแล</span></span>
            </Link>
            {right}
          </div>
          <div className="appbody">{children}</div>
        </div>
      </div>
    </div>
  );
}
