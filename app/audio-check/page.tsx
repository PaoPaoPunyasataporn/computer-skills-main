'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { speak, voiceReport } from '@/lib/speak';
import Speaker from '@/components/Speaker';

// A throwaway diagnostics page for the speaker buttons. If a 🔊 stays silent, this
// says why in one look: whether the browser has any voices at all, whether a Thai
// one is installed, and what the speech engine reports back when we try to speak.
// Safe to delete once the audio is confirmed working on the classroom machines.
export default function AudioCheck() {
  const [report, setReport] = useState<{ total: number; thai: string | null; names: string[]; clips: number }>({ total: 0, thai: null, names: [], clips: 0 });
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const refresh = () => setReport(voiceReport());
    refresh();
    window.speechSynthesis?.addEventListener('voiceschanged', refresh);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', refresh);
  }, []);

  function line(s: string) { setLog((l) => [`${new Date().toLocaleTimeString()} · ${s}`, ...l].slice(0, 12)); }

  // Speak with the raw API and report every event, so we can see exactly where it dies.
  function rawTest(text: string, lang: string) {
    if (!('speechSynthesis' in window)) { line('❌ this browser has no speechSynthesis at all'); return; }
    const sp = window.speechSynthesis;
    sp.cancel();
    setTimeout(() => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.onstart = () => line(`▶️ started speaking (${lang})`);
      u.onend = () => line(`✅ finished (${lang}) — if you heard nothing, the voice is missing/muted`);
      u.onerror = (e) => line(`❌ error (${lang}): ${e.error}`);
      sp.speak(u);
      line(`… asked the browser to speak "${text.slice(0, 20)}" as ${lang}`);
    }, 60);
  }

  // Recorded clips are the real answer: with them, a speaker works even on a machine
  // with no Thai voice at all. The installed-voice check below only matters for text
  // that has no clip yet.
  const ok = report.clips > 0 || report.thai !== null;

  return (
    <div className="page">
      <div className="shell">
        <div className="appwin">
          <div className="appbody">
            <Link className="btn-ghost3d" href="/" style={{ display: 'inline-flex', gap: 8, marginBottom: 20 }}>← กลับหน้าหลัก</Link>
            <h2 style={{ font: "700 26px/1.2 'Mitr'", color: 'var(--ink)', marginBottom: 8 }}>🔊 ตรวจสอบเสียง (audio check)</h2>
            <p style={{ font: "500 15px/1.7 'Sarabun'", color: 'var(--muted)', marginBottom: 22 }}>
              ถ้ากดปุ่มลำโพงแล้วไม่มีเสียง ให้ดูหน้านี้ — จะบอกว่าเครื่องนี้มีเสียงพูดภาษาไทยหรือไม่
            </p>

            <div className="card3d" style={{ marginBottom: 18 }}>
              <div style={{ font: "700 17px/1.4 'Mitr'", color: ok ? 'var(--green-d)' : '#B42318' }}>
                {report.clips > 0
                  ? '✅ มีคลิปเสียงไทยที่อัดไว้แล้ว — ปุ่มลำโพงพูดไทยได้ถูกต้องแม้เครื่องไม่มีเสียงไทย'
                  : '⚠️ ยังไม่พบคลิปเสียงที่อัดไว้ (public/audio/manifest.json)'}
              </div>
              <div style={{ font: "500 14px/1.8 'Sarabun'", color: 'var(--muted)', marginTop: 8 }}>
                คลิปเสียงที่อัดไว้: <b>{report.clips}</b> ประโยค<br />
                เสียงในเครื่อง (สำรอง): <b>{report.total}</b><br />
                เสียงภาษาไทยในเครื่อง: <b>{report.thai ?? '— ไม่มี —'}</b>
              </div>
              {!ok && report.total > 0 && (
                <div style={{ font: "500 14px/1.7 'Sarabun'", color: 'var(--muted2)', marginTop: 10, background: 'var(--cream)', padding: 12, borderRadius: 12 }}>
                  ไม่มีเสียงไทย — ปุ่มลำโพงจะใช้เสียงอื่นที่มีแทน (อ่านไทยได้ไม่ชัด)<br />
                  วิธีแก้บน Windows: Settings → Time &amp; language → Language &amp; region → เพิ่ม <b>ไทย</b> แล้วติดตั้ง <b>Speech</b> จาก Language options
                </div>
              )}
            </div>

            <div className="card3d" style={{ marginBottom: 18 }}>
              <div style={{ font: "700 17px/1.2 'Mitr'", marginBottom: 12 }}>ทดสอบ</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <button className="btn3d" onClick={() => speak('สวัสดี นี่คือเสียงทดสอบ')} style={{ padding: '11px 18px' }}>
                  ปุ่มลำโพงจริง (ไทย)
                </button>
                <button className="btn3d" onClick={() => rawTest('สวัสดี นี่คือเสียงทดสอบ', 'th-TH')} style={{ padding: '11px 18px', background: 'linear-gradient(135deg,#4FB0FF,#2E9BFF)', boxShadow: '0 4px 0 #2277CC' }}>
                  ทดสอบดิบ th-TH
                </button>
                <button className="btn3d" onClick={() => rawTest('Hello, this is a test', 'en-US')} style={{ padding: '11px 18px', background: 'linear-gradient(135deg,#B583F5,#9A5CF0)', boxShadow: '0 4px 0 #7C3EE0' }}>
                  ทดสอบดิบ en-US
                </button>
                <span style={{ font: "600 15px/1 'Sarabun'", color: 'var(--muted)' }}>ตัวอย่างปุ่มในเกม:</span>
                <Speaker say="สวัสดี นี่คือเสียงทดสอบ" />
              </div>
              <div style={{ marginTop: 14, background: 'var(--cream)', borderRadius: 12, padding: 12, minHeight: 60, font: "500 13px/1.8 'Sarabun'", color: 'var(--muted)' }}>
                {log.length === 0 ? 'ยังไม่ได้ทดสอบ' : log.map((l, i) => <div key={i}>{l}</div>)}
              </div>
            </div>

            <details className="card3d">
              <summary style={{ font: "700 16px/1 'Mitr'", cursor: 'pointer' }}>รายชื่อเสียงทั้งหมดในเครื่อง ({report.total})</summary>
              <div style={{ font: "500 13px/1.9 'Sarabun'", color: 'var(--muted)', marginTop: 10 }}>
                {report.names.length === 0 ? 'ไม่พบ' : report.names.map((n, i) => <div key={i}>{n}</div>)}
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
