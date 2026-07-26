'use client';

import { useState } from 'react';
import type { BossScore } from '@/components/GameOverlay';

// Shown after a child clears the final boss fight. They type their name once;
// we record it (POST /api/certify) and render it onto a certificate. If the boss
// reported a score, we save and show it too.
//
// ─── DROPPING IN THE REAL TEMPLATE ────────────────────────────────────────────
// The operator will supply a certificate image later. Save it to
//   public/certificate-template.png   (or .jpg — update CERT_TEMPLATE below)
// and it becomes the certificate background automatically. Until then a built-in
// decorative fallback is shown. Nudge NAME_TOP to line the name up with the blank
// line on the real template.
const CERT_TEMPLATE = '/certificate-template.png';
const NAME_TOP = '52%'; // vertical position of the name over the template

export default function CertificateModal({ score = null, onClose }: { score?: BossScore | null; onClose: () => void }) {
  const [name, setName] = useState('');
  const [issued, setIssued] = useState('');   // the name once submitted
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const scoreText = score ? `${score.correct}/${score.total} (${score.percent}%)` : null;

  async function submit() {
    const clean = name.trim().replace(/\s+/g, ' ').slice(0, 60);
    if (!clean) { setErr('พิมพ์ชื่อของหนูก่อนนะ'); return; }
    setBusy(true); setErr('');
    try {
      // Record the pass. Even if the server is unreachable, still show the
      // certificate — the child earned it.
      await fetch('/api/certify', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: clean, score: score ? score.percent : null }),
      }).catch(() => {});
    } finally {
      setIssued(clean);
      setBusy(false);
    }
  }

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(20,10,40,.72)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  };
  const field: React.CSSProperties = {
    padding: '14px 16px', border: '1.5px solid var(--line)', borderRadius: 12,
    fontFamily: 'Sarabun', fontSize: 18, background: '#FFFDF6', width: '100%', textAlign: 'center',
  };

  // ── Certificate view (after the name is submitted) ──────────────────────────
  if (issued) {
    return (
      <div style={overlay}>
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            #cert-print-area, #cert-print-area * { visibility: visible !important; }
            #cert-print-area { position: fixed; inset: 0; margin: 0; box-shadow: none; }
          }
        `}</style>
        <div style={{ width: 'min(760px, 96vw)', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          <div
            id="cert-print-area"
            style={{
              position: 'relative', width: '100%', aspectRatio: '1.414 / 1',
              borderRadius: 14, overflow: 'hidden',
              background: 'linear-gradient(135deg,#FFFDF4,#FBF3D9)',
              boxShadow: '0 18px 50px rgba(0,0,0,.4)',
              border: '10px double #C9A227',
              backgroundImage: `url(${CERT_TEMPLATE})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '8%', pointerEvents: 'none' }}>
              <div style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 'clamp(20px,4vw,34px)', color: '#7C3EE0' }}>ใบประกาศนียบัตร</div>
              <div style={{ fontFamily: 'Sarabun', fontSize: 'clamp(11px,1.8vw,15px)', color: '#8A6D1E', marginTop: 6 }}>ทักษะคอมพิวเตอร์ · DigComp 3.0</div>
              <div style={{ fontFamily: 'Sarabun', fontSize: 'clamp(11px,1.8vw,15px)', color: '#5a4a2a', marginTop: 'auto' }}>มอบให้แก่</div>
            </div>
            <div style={{ position: 'absolute', top: NAME_TOP, left: 0, right: 0, transform: 'translateY(-50%)', textAlign: 'center', padding: '0 8%' }}>
              <span style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 'clamp(26px,5.5vw,52px)', color: '#2b1a52' }}>{issued}</span>
            </div>
            <div style={{ position: 'absolute', bottom: '8%', left: 0, right: 0, textAlign: 'center', fontFamily: 'Sarabun', fontSize: 'clamp(10px,1.6vw,14px)', color: '#5a4a2a', pointerEvents: 'none' }}>
              ผ่านบอสไฟท์สุดท้ายครบทุกด้าน 🏆{scoreText ? ` · คะแนน ${scoreText}` : ''}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn3d blue" style={{ padding: '12px 22px', fontSize: 16 }} onClick={() => window.print()}>🖨️ พิมพ์ / บันทึกใบประกาศ</button>
            <button className="btn-ghost3d" style={{ padding: '12px 22px', fontSize: 16 }} onClick={onClose}>เสร็จแล้ว</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Name entry (before submitting) ─────────────────────────────────────────
  return (
    <div style={overlay}>
      <div style={{ width: 'min(440px, 96vw)', background: '#fff', border: '2px solid var(--line)', borderBottomWidth: 6, borderRadius: 22, padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 54 }}>🏆</div>
        <h2 style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 24, margin: '8px 0 4px' }}>เก่งมาก! ผ่านด่านสุดท้ายแล้ว</h2>
        <p style={{ fontFamily: 'Sarabun', fontSize: 15, color: 'var(--muted2)', marginBottom: 18 }}>พิมพ์ชื่อของหนูเพื่อรับใบประกาศนียบัตร</p>
        {scoreText && (
          <div style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 18, color: 'var(--green-d)', marginBottom: 14 }}>คะแนนของหนู: {scoreText}</div>
        )}
        <input
          style={field}
          placeholder="ชื่อ - นามสกุล"
          value={name}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        {err && <div style={{ color: '#C23B2A', fontFamily: 'Sarabun', fontSize: 14, marginTop: 10 }}>{err}</div>}
        <button className="btn3d blue" style={{ width: '100%', marginTop: 16, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={submit}>
          {busy ? '...' : 'รับใบประกาศนียบัตร'}
        </button>
        <button className="btn-ghost3d" style={{ width: '100%', marginTop: 10, fontSize: 14 }} onClick={onClose}>ข้าม</button>
      </div>
    </div>
  );
}
