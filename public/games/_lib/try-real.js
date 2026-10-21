/* "ลองของจริง" card — shared by the AI lessons.
 * Each lesson sets window.TRY_REAL = { title, intro, links[], promptLabel?, prompt?, steps[], observe[], note? }
 * and has an empty <div id="tryReal"></div> in its reflection step. Nothing here talks to an AI:
 * it hands the student a ready prompt + a link to the real tool and a checklist of what to look for. */
(function(){
  var C = window.TRY_REAL;
  if (!C) return;

  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // A copy-paste prompt is something to paste, not narration — keep the speaker button
  // off it so it never has to fall back to the browser's speech engine.
  window.DLF_CONFIG = window.DLF_CONFIG || {};
  window.DLF_CONFIG.extraNonDecorateSelectors = (window.DLF_CONFIG.extraNonDecorateSelectors ? window.DLF_CONFIG.extraNonDecorateSelectors + ',' : '') + '.tr-prompt';

  var css = ''
  + '.tr-card{margin:14px 0 6px;border:2px dashed var(--primary,#4f7cff);background:var(--primary-light,#eef3ff);border-radius:18px;padding:16px 16px 14px;text-align:left}'
  + '.tr-tag{display:inline-block;font-family:Mitr,sans-serif;font-size:12px;font-weight:600;color:var(--primary-dark,#2a4fb8);background:#fff;border-radius:999px;padding:3px 10px;margin-bottom:8px}'
  + '.tr-title{font-family:Mitr,sans-serif;font-size:17px;font-weight:600;color:var(--text,#0F1B2D);margin-bottom:4px}'
  + '.tr-intro{font-size:14px;line-height:1.55;color:var(--text2,#54677E);margin-bottom:10px}'
  + '.tr-links{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}'
  + '.tr-link{display:inline-block;text-decoration:none;font-family:Mitr,sans-serif;font-size:13px;font-weight:500;background:var(--primary,#4f7cff);color:#fff;border-radius:12px;padding:8px 14px}'
  + '.tr-link:hover{filter:brightness(1.08)}'
  + '.tr-lbl{font-family:Mitr,sans-serif;font-size:13px;font-weight:600;color:var(--text,#0F1B2D);margin:12px 0 4px}'
  + '.tr-prompt{white-space:pre-wrap;word-break:break-word;font-size:14px;line-height:1.55;background:#fff;border:1.5px solid var(--border,#EFE7D6);border-radius:12px;padding:10px 12px;color:var(--text,#0F1B2D);user-select:all}'
  + '.tr-copy{margin-top:8px;font-family:Mitr,sans-serif;font-size:13px;font-weight:500;background:#fff;color:var(--primary-dark,#2a4fb8);border:1.5px solid var(--primary,#4f7cff);border-radius:10px;padding:6px 12px;cursor:pointer}'
  + '.tr-steps{margin:0 0 0 20px;padding:0;font-size:14px;line-height:1.6;color:var(--text,#0F1B2D)}'
  + '.tr-steps li{margin-bottom:3px}'
  + '.tr-obs{display:flex;flex-direction:column;gap:6px}'
  + '.tr-obs label{display:flex;gap:8px;align-items:flex-start;font-size:14px;line-height:1.5;color:var(--text,#0F1B2D);cursor:pointer}'
  + '.tr-obs input{margin-top:4px;flex:none}'
  + '.tr-note{font-size:12.5px;line-height:1.5;color:var(--text2,#54677E);margin-top:12px;padding-top:10px;border-top:1px solid var(--border,#EFE7D6)}';

  function copyText(text, btn){
    function done(ok){ var old = btn.getAttribute('data-l') || btn.textContent; btn.setAttribute('data-l', old); btn.textContent = ok ? '✅ คัดลอกแล้ว' : 'แตะที่กล่องคำสั่งเพื่อเลือก แล้วคัดลอกเอง'; setTimeout(function(){ btn.textContent = old; }, 1800); }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(text).then(function(){ done(true); }, function(){ done(false); }); return; }
    } catch(e){}
    done(false);
  }

  // Fixed labels live in their own plain literals so scripts/gen-audio.mjs finds each one
  // as a whole string and records a clip for it (inside a larger HTML literal it cannot).
  var L_TAG = '🌐 ลองของจริง · ไม่บังคับ แต่แนะนำ';
  var L_STEPS = 'ทำตามนี้ทีละขั้น';
  var L_OBS = '🔎 สิ่งที่ต้องสังเกต (ติ๊กเมื่อเช็กแล้ว)';
  // each sentence stays under the generator's 160-character clip limit
  var L_SAFE = ['ใช้เฉพาะเมื่อโรงเรียนหรือผู้ปกครองอนุญาต และอายุถึงเกณฑ์ของเครื่องมือนั้น', 'ไม่พิมพ์ข้อมูลส่วนตัว (ชื่อเต็ม ที่อยู่ เบอร์โทร รหัสผ่าน)', 'ถ้าใช้ไม่ได้ ข้ามส่วนนี้ได้ หรือให้ครูลองให้ดูหน้าห้อง'];

  function render(host){
    var html = '<div class="tr-card">'
      + '<span class="tr-tag">' + L_TAG + '</span>'
      + '<div class="tr-title">' + esc(C.title) + '</div>'
      + '<div class="tr-intro">' + esc(C.intro) + '</div>';
    if (C.links && C.links.length){
      html += '<div class="tr-links">' + C.links.map(function(l){
        return '<a class="tr-link" href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer">' + esc(l.label) + ' ↗</a>';
      }).join('') + '</div>';
    }
    if (C.prompt){
      html += '<div class="tr-lbl">' + esc(C.promptLabel || '📋 คำสั่งที่จะใช้ (แก้ส่วนที่มี [ ] ให้เป็นเรื่องของเรา)') + '</div>'
        + '<div class="tr-prompt" id="trPrompt">' + esc(C.prompt) + '</div>'
        + '<button type="button" class="tr-copy" id="trCopy">📋 คัดลอกคำสั่ง</button>';
    }
    html += '<div class="tr-lbl">' + L_STEPS + '</div><ol class="tr-steps">' + C.steps.map(function(s){ return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>'
      + '<div class="tr-lbl">' + L_OBS + '</div><div class="tr-obs">' + C.observe.map(function(o){
        return '<label><input type="checkbox"><span>' + esc(o) + '</span></label>';
      }).join('') + '</div>'
      + (C.note ? '<div class="tr-note">' + esc(C.note) + '</div>' : '')
      + '<div class="tr-note">' + L_SAFE.map(function(t){ return '<div>' + t + '</div>'; }).join('') + '</div>'
      + '</div>';
    host.innerHTML = html;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var btn = document.getElementById('trCopy');
    if (btn) btn.onclick = function(){ copyText(C.prompt, btn); };
  }

  function mount(){ var host = document.getElementById('tryReal'); if (host) render(host); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
