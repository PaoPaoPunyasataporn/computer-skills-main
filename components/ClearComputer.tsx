'use client';

import { useState } from 'react';

// "Clear this computer": wipes everything the lessons keep in this browser so the next
// child on a shared laptop starts fresh. It never touches certificates — those live on
// the server and are not stored in the browser at all.
const SESSION_KEYS = ['cs_progress', 'cs_daily'];
// Older versions kept these in localStorage; clear them too so nothing is left behind.
const LEGACY_LOCAL_KEYS = ['cs_progress', 'cs_daily', 'cs_compete_me', 'cs_student', 'dlfMute'];

export default function ClearComputer() {
  const [open, setOpen] = useState(false);

  function clearAll() {
    try { SESSION_KEYS.forEach((k) => sessionStorage.removeItem(k)); } catch { /* ignore */ }
    try { LEGACY_LOCAL_KEYS.forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ }
    window.location.reload();
  }

  return (
    <>
      <button type="button" className="btn-ghost3d" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 14 }} onClick={() => setOpen(true)}>
        🧹 ล้างข้อมูลในเครื่องนี้
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-labelledby="clr-title" onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,27,45,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, maxWidth: 440, width: '100%', padding: 24, textAlign: 'left', fontFamily: 'Sarabun, sans-serif', lineHeight: 1.6, color: '#0F1B2D' }}>
            <h2 id="clr-title" style={{ fontFamily: 'Mitr, sans-serif', fontSize: 20, margin: '0 0 8px' }}>🧹 ล้างข้อมูลในเครื่องนี้</h2>
            <p style={{ margin: '0 0 6px' }}><b>สิ่งที่จะถูกลบ</b> (เฉพาะในเครื่อง/เบราว์เซอร์นี้):</p>
            <ul style={{ margin: '0 0 10px 20px', padding: 0 }}>
              <li>ดาวและความคืบหน้าของบทเรียนที่เล่นไปแล้ว</li>
              <li>บันทึกกิจกรรมของวันนี้</li>
              <li>ข้อมูลเก่าที่เคยเก็บไว้ในเครื่อง (ชื่อเล่นในห้องแข่ง ชื่อที่เคยพิมพ์ในบทเรียน และการตั้งค่าเสียง)</li>
            </ul>
            <p style={{ margin: '0 0 6px' }}><b>สิ่งที่ไม่ถูกลบ</b>:</p>
            <ul style={{ margin: '0 0 14px 20px', padding: 0 }}>
              <li>ใบรับรองและรายชื่อผู้ผ่านการรับรอง (เก็บไว้ที่ระบบของครู ไม่ได้อยู่ในเครื่องนี้)</li>
            </ul>
            <p style={{ margin: '0 0 16px', fontSize: 14, opacity: 0.8 }}>เมื่อปิดแท็บหรือปิดเบราว์เซอร์ ความคืบหน้าจะหายไปเองอยู่แล้ว ปุ่มนี้ใช้เมื่อต้องการล้างทันทีโดยไม่ต้องปิด</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button type="button" className="btn-ghost3d" onClick={() => setOpen(false)}>ยกเลิก</button>
              <button type="button" className="btn-ghost3d" style={{ background: '#E5484D', color: '#fff' }} onClick={clearAll}>ล้างเลย</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
