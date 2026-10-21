'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

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
      if (d.ok) { setAuthed(true); setErr(''); setCerts(d.certifications || []); }
      else setErr('ดึงรายชื่อไม่ได้ในตอนนี้ กรุณาลองใหม่อีกครั้ง');
    } catch { setErr('เชื่อมต่อไม่ได้'); }
    setBusy(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  // Teacher's view of the list — search / grade filter / sort, all in the browser. Nothing here
  // changes what is stored; it only changes what is shown. (Hooks stay above the early returns.)
  const [q, setQ] = useState('');
  const [grade, setGrade] = useState('all');
  const [sort, setSort] = useState<'newest' | 'name'>('newest');

  const gradeCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of certs) { const g = c.grade_level ?? '—'; m.set(g, (m.get(g) || 0) + 1); }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'th'));
  }, [certs]);

  // Same name more than once = a retake, or two students sharing a name — worth a teacher's eye.
  const repeatedNames = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of certs) { const k = c.name.trim().toLowerCase(); m.set(k, (m.get(k) || 0) + 1); }
    return new Set([...m.entries()].filter(([, n]) => n > 1).map(([k]) => k));
  }, [certs]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const rows = certs.filter((c) => (grade === 'all' || (c.grade_level ?? '—') === grade) && (!needle || c.name.toLowerCase().includes(needle)));
    return sort === 'name' ? [...rows].sort((a, b) => a.name.localeCompare(b.name, 'th')) : rows;
  }, [certs, q, grade, sort]);

  // CSV for Excel / Google Sheets. The leading BOM keeps Thai readable; names that start with
  // = + - @ get a leading apostrophe so a spreadsheet never runs them as formulas.
  function downloadCsv() {
    const cell = (v: string) => '"' + (/^[=+\-@\t\r]/.test(v) ? "'" + v : v).replace(/"/g, '""') + '"';
    const lines = [['ลำดับ', 'ชื่อนักเรียน', 'ระดับชั้น', 'คะแนน (%)', 'วันที่ผ่าน'].map(cell).join(',')];
    shown.forEach((c, i) => lines.push([String(i + 1), c.name, c.grade_level ?? '', c.score == null ? '' : String(c.score), fmt(c.created_at)].map(cell).join(',')));
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ผู้ผ่านการรับรอง-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

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
    return <Shell><div style={{ padding: 40, textAlign: 'center', fontFamily: 'Sarabun', color: 'var(--muted2)' }}>{err ? (<div>{err}<br /><button className="btn-ghost3d" style={{ marginTop: 12 }} onClick={() => void load()}>ลองใหม่</button></div>) : 'กำลังโหลด…'}</div></Shell>;
  }

  if (!authed) {
    return (
      <Shell>
        <div style={{ maxWidth: 420, margin: '30px auto' }}>
          <div style={{ background: '#fff', border: '2px solid var(--line)', borderBottomWidth: 5, borderRadius: 20, padding: 26 }}>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{ fontSize: 46 }}>🔐</div>
              <h1 style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 24, margin: '6px 0 2px' }}>แดชบอร์ดครู</h1>
              <p style={{ fontFamily: 'Sarabun', fontSize: 14, color: 'var(--muted2)' }}>ใส่รหัสผ่านของครูเพื่อดูว่านักเรียนคนไหนผ่านการรับรองแล้ว</p>
            </div>
            <input style={field} type="password" placeholder="รหัสผ่านครู" autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && signIn()} />
            {err && <div style={{ color: '#C23B2A', fontFamily: 'Sarabun', fontSize: 14, marginTop: 8 }}>{err}</div>}
            <button className="btn3d blue" style={{ width: '100%', marginTop: 14, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={signIn}>
              {busy ? '...' : 'เข้าสู่ระบบ'}
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 18 }}>
            <Link className="btn-ghost3d" href="/" style={{ display: 'inline-flex' }}>← กลับหน้าหลัก</Link>
            <Link className="btn-ghost3d" href="/guide" style={{ display: 'inline-flex', marginLeft: 8 }}>📘 คู่มือครู</Link>
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
        <span style={{ fontFamily: 'Sarabun', fontSize: 14, color: 'var(--muted2)' }}>
          {shown.length === certs.length ? `ทั้งหมด ${certs.length} คน` : `แสดง ${shown.length} จาก ${certs.length} คน`}
        </span>
        <button className="btn-ghost3d" style={{ padding: '9px 16px', fontSize: 14 }} disabled={busy} onClick={load}>{busy ? '...' : 'รีเฟรช ↻'}</button>
        <button className="btn-ghost3d" style={{ padding: '9px 16px', fontSize: 14 }} disabled={shown.length === 0} onClick={downloadCsv}>⬇ ดาวน์โหลด CSV</button>
        <Link href="/guide" className="btn-ghost3d" style={{ padding: '9px 16px', fontSize: 14, display: 'inline-flex' }}>📘 คู่มือครู</Link>
      </div>

      {certs.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            style={{ ...field, flex: '1 1 220px', width: 'auto', padding: '10px 14px', fontSize: 15 }}
            type="search" placeholder="🔍 ค้นหาชื่อนักเรียน"
            value={q} onChange={(e) => setQ(e.target.value)}
          />
          <select
            style={{ ...field, width: 'auto', padding: '10px 14px', fontSize: 15 }}
            value={sort} onChange={(e) => setSort(e.target.value as 'newest' | 'name')}
            aria-label="เรียงลำดับ"
          >
            <option value="newest">เรียง: ผ่านล่าสุดก่อน</option>
            <option value="name">เรียง: ชื่อ ก–ฮ</option>
          </select>
        </div>
      )}

      {gradeCounts.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {[['all', `ทุกชั้น (${certs.length})`] as const, ...gradeCounts.map(([g, n]) => [g, `${g} (${n})`] as const)].map(([g, label]) => (
            <button
              key={g} type="button" onClick={() => setGrade(g)}
              style={{ padding: '7px 14px', borderRadius: 99, border: '1.5px solid var(--line)', background: grade === g ? 'var(--green-d, #2E8B30)' : '#fff', color: grade === g ? '#fff' : 'var(--ink)', fontFamily: 'Mitr', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
            >{label}</button>
          ))}
        </div>
      )}

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
                {shown.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--muted2)' }}>ไม่พบชื่อที่ตรงกับการค้นหา</td></tr>
                )}
                {shown.map((c, i) => (
                  <tr key={c.id} style={{ borderTop: '1px solid var(--line)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--muted2)', fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 16 }}>
                      {c.name}
                      {repeatedNames.has(c.name.trim().toLowerCase()) && (
                        <span title="มีชื่อนี้มากกว่า 1 รายการ อาจสอบซ้ำหรือชื่อซ้ำกัน" style={{ marginLeft: 8, padding: '1px 8px', borderRadius: 10, background: '#FFF0D6', color: '#C58A00', fontWeight: 700, fontSize: 11, fontFamily: 'Sarabun' }}>ชื่อซ้ำ</span>
                      )}
                    </td>
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
              <span className="brand-name">แดชบอร์ด<span>ครู</span></span>
            </Link>
            {right}
          </div>
          <div className="appbody">{children}</div>
        </div>
      </div>
    </div>
  );
}
