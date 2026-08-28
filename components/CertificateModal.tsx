'use client';

import { useState } from 'react';
import type { BossScore } from '@/components/GameOverlay';
import { GRADE_LEVELS } from '@/lib/grade-levels';

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
// Coordinates for the real 2000×1414 px template, measured directly off the
// template's printed underlines (pixel-scanned: name blank spans x 1271–1651 at
// y≈645; date blank spans x 1356–1696 at y≈787) so the text sits centered on
// each line rather than eyeballed.
const NAME_X = 1461;
const NAME_Y = 632;
const NAME_MAX_WIDTH = 380;
const DATE_X = 1526;
const DATE_Y = 778;
const DATE_MAX_WIDTH = 340;

export default function CertificateModal({ score = null, onClose }: { score?: BossScore | null; onClose: () => void }) {
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [issued, setIssued] = useState('');   // the name once submitted
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [err, setErr] = useState('');

  const scoreText = score ? `${score.correct}/${score.total} (${score.percent}%)` : null;
  const issuedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const previewNameScale = issued ? Math.max(0.52, Math.min(1, 27 / [...issued].length)) : 1;

  async function submit() {
    if (busy) return;   // guard against rapid double-Enter firing two concurrent POSTs
    const clean = name.trim().replace(/\s+/g, ' ').slice(0, 60);
    if (!gradeLevel) { setErr('เลือกระดับชั้นของหนูก่อนนะ'); return; }
    if (!clean) { setErr('พิมพ์ชื่อของหนูก่อนนะ'); return; }
    setBusy(true); setErr('');
    // Show the earned certificate immediately. Recording is deliberately
    // non-blocking so a slow database cannot interrupt this reward moment.
    setIssued(clean);
    setBusy(false);
    try {
      const response = await fetch('/api/certify', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: clean, gradeLevel, score: score ? score.percent : null }),
      });
      if (!response.ok) console.error('Could not record certification');
    } catch {
      console.error('Could not record certification');
    } finally {
      // The certificate remains available even if the optional server record fails.
    }
  }

  async function downloadJpeg() {
    if (!issued || downloading) return;
    setDownloading(true);
    try {
      const image = new Image();
      image.src = CERT_TEMPLATE;
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('template failed to load')); });

      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas unavailable');
      ctx.drawImage(image, 0, 0);

      // Shrink long names until they actually fit inside the printed name line.
      // No floor: fillText's own maxWidth arg is a last-resort horizontal squeeze,
      // not a substitute — by the time it kicks in the text is already illegible,
      // so we keep reducing font size first for as long as that stays readable.
      let size = 30;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#2b3350';
      do {
        ctx.font = `700 ${size}px Sarabun, "Noto Sans Thai", sans-serif`;
        if (ctx.measureText(issued).width <= NAME_MAX_WIDTH || size <= 10) break;
        size -= 1;
      } while (size > 10);
      ctx.fillText(issued, NAME_X, NAME_Y, NAME_MAX_WIDTH);

      ctx.font = '600 22px Sarabun, "Noto Sans Thai", sans-serif';
      ctx.fillStyle = '#5b6a86';
      ctx.fillText(issuedDate, DATE_X, DATE_Y, DATE_MAX_WIDTH);

      const href = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      const safeName = issued.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'student';
      link.href = href;
      link.download = `certificate-${safeName}.jpg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setDownloaded(true);
    } catch {
      setErr('ดาวน์โหลดใบประกาศไม่สำเร็จ ลองอีกครั้งนะ');
    } finally {
      setDownloading(false);
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
          #cert-print-area { background-image: url(${CERT_TEMPLATE}); }
        `}</style>
        <div style={{ width: 'min(760px, 96vw)', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          <div
            id="cert-print-area"
            style={{
              position: 'relative', width: '100%', aspectRatio: '1.414 / 1',
              borderRadius: 14, overflow: 'hidden',
              boxShadow: '0 18px 50px rgba(0,0,0,.4)',
              backgroundSize: 'cover', backgroundPosition: 'center',
            }}
          >
            {/* Name goes on the "...is awarded to ______" blank */}
            <div style={{ position: 'absolute', top: `${(NAME_Y / 1414) * 100}%`, left: `${(NAME_X / 2000) * 100}%`, width: `${(NAME_MAX_WIDTH / 2000) * 100}%`, transform: `translate(-50%, -50%) scaleX(${previewNameScale})`, textAlign: 'center', pointerEvents: 'none' }}>
              <span style={{ fontFamily: 'Sarabun', fontWeight: 700, fontSize: 'clamp(8px,1vw,11px)', color: '#2b3350', whiteSpace: 'nowrap' }}>{issued}</span>
            </div>
            {/* Date goes on the "...was awarded on ______" blank */}
            <div style={{ position: 'absolute', top: `${(DATE_Y / 1414) * 100}%`, left: `${(DATE_X / 2000) * 100}%`, width: `${(DATE_MAX_WIDTH / 2000) * 100}%`, transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
              <span style={{ fontFamily: 'Sarabun', fontWeight: 600, fontSize: 'clamp(7px,1vw,11px)', color: '#5b6a86', whiteSpace: 'nowrap' }}>{issuedDate}</span>
            </div>
            {scoreText && (
              <div style={{ position: 'absolute', bottom: '4%', left: '6%', fontFamily: 'Sarabun', fontWeight: 600, fontSize: 'clamp(9px,1.3vw,12px)', color: '#9aa3b8', pointerEvents: 'none' }}>
                คะแนน {scoreText}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn3d blue" style={{ padding: '12px 22px', fontSize: 16, opacity: downloading ? 0.6 : 1 }} disabled={downloading} onClick={downloadJpeg}>📥 {downloading ? 'กำลังสร้างไฟล์...' : 'ดาวน์โหลดใบประกาศ JPEG'}</button>
            <button className="btn-ghost3d" style={{ padding: '12px 22px', fontSize: 16, opacity: downloaded ? 1 : 0.45 }} disabled={!downloaded} onClick={onClose}>{downloaded ? 'เสร็จแล้ว' : 'ดาวน์โหลดก่อนจึงออกได้'}</button>
          </div>
          {err && <div style={{ color: '#C23B2A', fontFamily: 'Sarabun', fontSize: 14 }}>{err}</div>}
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
        <div style={{ fontFamily: 'Sarabun', fontSize: 14, fontWeight: 600, color: 'var(--muted2)', marginBottom: 8, textAlign: 'left' }}>ระดับชั้นของหนู</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          {GRADE_LEVELS.map((g) => (
            <button
              key={g}
              type="button"
              disabled={busy}
              onClick={() => setGradeLevel(g)}
              style={{
                padding: '10px 6px', borderRadius: 12, fontFamily: 'Mitr', fontWeight: 700, fontSize: 15,
                cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1,
                border: gradeLevel === g ? '2px solid var(--blue, #2E6FE0)' : '1.5px solid var(--line)',
                background: gradeLevel === g ? 'var(--blue-light, #E5EEFF)' : '#FFFDF6',
                color: gradeLevel === g ? 'var(--blue-d, #1E4FB0)' : 'var(--text, #2b3350)',
              }}
            >
              {g}
            </button>
          ))}
        </div>
        <input
          style={{ ...field, opacity: busy ? 0.6 : 1 }}
          placeholder="ชื่อ - นามสกุล"
          value={name}
          autoFocus
          disabled={busy}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        {err && <div style={{ color: '#C23B2A', fontFamily: 'Sarabun', fontSize: 14, marginTop: 10 }}>{err}</div>}
        <button className="btn3d blue" style={{ width: '100%', marginTop: 16, opacity: busy || !gradeLevel ? 0.6 : 1 }} disabled={busy} onClick={submit}>
          {busy ? '...' : 'รับใบประกาศนียบัตร'}
        </button>
      </div>
    </div>
  );
}
