'use client';

import Link from 'next/link';
import type { AREAS, Game } from '@/lib/content';

type Style = { orb: string; accent: string; accentL: string; edge: string; desc: string };

export const AREA_STYLE: Record<number, Style> = {
  0: { orb: 'linear-gradient(135deg,#DCE9FF,#A9CCFF)', accent: '#3A82F6', accentL: '#5CA0FF', edge: '#2E64D6', desc: 'รู้จักเครื่อง · เมาส์ · แป้นพิมพ์' },
  1: { orb: 'linear-gradient(135deg,#CFE9FF,#9CCBFF)', accent: '#2E9BFF', accentL: '#4FB0FF', edge: '#2277CC', desc: 'ค้นหา · ดูว่าจริงหรือหลอก · จัดเก็บ' },
  2: { orb: 'linear-gradient(135deg,#DFF6E4,#B0EAC1)', accent: '#38A93A', accentL: '#5CD35B', edge: '#2E8B30', desc: 'คุย · แบ่งปัน · มารยาท · ตัวตนดิจิทัล' },
  3: { orb: 'linear-gradient(135deg,#ECE0FF,#C9AEFF)', accent: '#9A5CF0', accentL: '#B583F5', edge: '#7C3EE0', desc: 'สร้างงาน · ลิขสิทธิ์ · เขียนโปรแกรม' },
  4: { orb: 'linear-gradient(135deg,#FFE2DF,#FFC0B9)', accent: '#F0982E', accentL: '#FFB456', edge: '#D07E1E', desc: 'ปกป้องเครื่อง · ข้อมูล · สุขภาพ · สิ่งแวดล้อม' },
  5: { orb: 'linear-gradient(135deg,#D9F3E0,#B4E6C2)', accent: '#2E9A57', accentL: '#46BD73', edge: '#227A44', desc: 'แก้ปัญหาเครื่อง · เลือกเครื่องมือ · คิดใหม่' },
  6: { orb: 'linear-gradient(135deg,#CFF4EE,#8FE0D1)', accent: '#0D9488', accentL: '#2DD4BF', edge: '#0B7A70', desc: 'ตรวจสอบก่อนเชื่อ · รู้ทันมิจฉาชีพ · สั่งงาน AI เป็น' },
};

export default function AreaCard({ area, onDirectOpen }: { area: (typeof AREAS)[number]; onDirectOpen: (area: number, game: Game) => void }) {
  const st = AREA_STYLE[area.num];
  const lbl = area.num === 0 ? 'เริ่มต้น' : area.num === 6 ? 'ทักษะพิเศษ' : `ด้านที่ ${area.num}`;
  const directGame = area.num !== 0 && area.games.length === 1 ? area.games[0] : null;

  const inner = (
    <>
      <div className="unit-top">
        <span className="unit-orb" style={{ background: st.orb }}>{area.mascot}</span>
        <div>
          <div className="unit-lbl" style={{ color: st.accent }}>{lbl}</div>
          <div className="unit-name">{area.title}</div>
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted2)', margin: '2px 0 14px' }}>
        {st.desc}
        {area.games && area.games.length > 0 && (
          <span style={{ display: 'inline-block', marginLeft: 8, padding: '1px 8px', borderRadius: 10, background: '#FFF0D6', color: '#C58A00', fontWeight: 700, fontSize: 11 }}>🎮 {area.games.length} เกม</span>
        )}
      </div>
      <div className="unit-foot" style={{ justifyContent: 'flex-end' }}>
        <span className="unit-go" style={{ background: `linear-gradient(135deg,${st.accentL},${st.accent})`, boxShadow: `0 5px 0 ${st.edge}` }}>▶</span>
      </div>
    </>
  );

  if (directGame) {
    return (
      <button
        type="button"
        className="card3d unit"
        onClick={() => onDirectOpen(area.num, directGame)}
        style={{ borderBottomColor: st.edge, textAlign: 'left', cursor: 'pointer' }}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link className="card3d unit" href={`/area/${area.num}`} style={{ borderBottomColor: st.edge }}>
      {inner}
    </Link>
  );
}
