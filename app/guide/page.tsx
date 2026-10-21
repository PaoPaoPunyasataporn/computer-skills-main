import Link from 'next/link';
import type { Metadata } from 'next';
import { AREAS, FINAL_BOSS, type Game } from '@/lib/content';
import { LESSON_NOTES, GUIDE_REVIEWED } from '@/lib/teacher-guide';

export const metadata: Metadata = { title: 'คู่มือครู · Computer Skills' };

type Section = { title: string; games: Game[] };

function sections(): Section[] {
  const out: Section[] = [];
  for (const a of AREAS) {
    const games = a.games ?? a.modules?.flatMap((m) => m.games) ?? [];
    out.push({ title: `${a.mascot} ${a.title}`, games });
  }
  out.push({ title: '🏆 ด่านสุดท้าย', games: [FINAL_BOSS] });
  return out;
}

const box: React.CSSProperties = { background: '#fff', border: '1.5px solid var(--line, #EFE7D6)', borderRadius: 16, padding: '14px 16px', marginBottom: 12 };
const lbl: React.CSSProperties = { fontWeight: 700, marginTop: 8 };

export default function GuidePage() {
  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '24px 16px 60px', fontFamily: 'Sarabun, sans-serif', lineHeight: 1.6 }}>
      <Link href="/admin" className="btn-ghost3d" style={{ display: 'inline-block', marginBottom: 12 }}>← กลับหน้าสำหรับครู</Link>
      <h1 style={{ fontFamily: 'Mitr, sans-serif', fontSize: 28 }}>📘 คู่มือครู</h1>
      <p>
        แต่ละบทเรียนมีเวลาโดยประมาณ เป้าหมาย คำถามชวนคุย กิจกรรมที่ไม่ใช้คอมพิวเตอร์ และสิ่งที่ควรระวัง
        กดพิมพ์หน้านี้เป็นใบประกอบการสอนได้เลย
      </p>
      <p style={{ fontSize: 14, opacity: 0.75 }}>ตรวจทานเนื้อหาล่าสุด: {GUIDE_REVIEWED} · เครื่องมือ AI จริงเปลี่ยนเร็ว ควรเปิดดูก่อนสอนทุกครั้ง</p>

      <div style={{ ...box, background: '#FFF8E6' }}>
        <b>เรื่องที่ควรตกลงก่อนเริ่ม</b>
        <ul style={{ margin: '6px 0 0 20px' }}>
          <li>ใบรับรองบันทึกจากด่านสุดท้าย (บอสไฟท์) เท่านั้น ดาวของแต่ละบทเก็บไว้ในเครื่องที่เด็กใช้ ไม่ข้ามเครื่อง</li>
          <li>ส่วน “ลองของจริง” ในบทเรียน AI ต้องได้รับอนุญาตจากโรงเรียน/ผู้ปกครอง และอายุถึงเกณฑ์ของเครื่องมือนั้น</li>
          <li>เด็กไม่ควรพิมพ์ชื่อเต็ม ที่อยู่ เบอร์โทร หรือรหัสผ่านจริงในบทเรียนใด ๆ</li>
        </ul>
      </div>

      {sections().map((s) => (
        <section key={s.title} style={{ marginTop: 24 }}>
          <h2 style={{ fontFamily: 'Mitr, sans-serif', fontSize: 20 }}>{s.title}</h2>
          {s.games.map((g) => {
            const n = LESSON_NOTES[g.code];
            return (
              <article key={g.code} style={box}>
                <div style={{ fontFamily: 'Mitr, sans-serif', fontSize: 17 }}>{g.icon} {g.th}{n ? <span style={{ fontSize: 13, opacity: 0.7 }}> · ประมาณ {n.mins} นาที</span> : null}</div>
                {n ? (
                  <>
                    <div style={lbl}>เป้าหมาย</div><div>{n.goal}</div>
                    <div style={lbl}>คำถามชวนคุย</div>
                    <ul style={{ margin: '0 0 0 20px' }}>{n.ask.map((q) => <li key={q}>{q}</li>)}</ul>
                    <div style={lbl}>กิจกรรมที่ไม่ใช้คอมพิวเตอร์</div><div>{n.offline}</div>
                    <div style={lbl}>ควรระวัง</div><div>{n.watch}</div>
                  </>
                ) : <div style={{ opacity: 0.7 }}>{g.desc}</div>}
              </article>
            );
          })}
        </section>
      ))}
    </main>
  );
}
