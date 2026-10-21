/* Keeps a student's reflection instead of throwing it away.
 * - saves what they typed in #reflText to THIS browser (localStorage) as they type, and restores it
 * - shows it back on the results screen as "what I'll do next"
 * - offers a printable summary sheet (loaded only when clicked) the teacher can sign
 * Nothing leaves the browser. */
(function(){
  var ta = document.getElementById('reflText');
  if (!ta) return;
  var KEY = 'cs_refl:' + location.pathname.split('/').pop();
  try { var saved = localStorage.getItem(KEY); if (saved) ta.value = saved; } catch (e) {}
  ta.addEventListener('input', function(){ try { localStorage.setItem(KEY, ta.value); } catch (e) {} });

  var LBL = 'สิ่งที่ฉันตั้งใจจะทำต่อไป';
  var PRINT = '🖨️ พิมพ์ใบสรุปของฉัน';

  function loadPrinter(cb){
    if (window.csPrint) return cb();
    var s = document.createElement('script');
    s.src = '_lib/print-sheet.js';
    s.onload = cb;
    document.head.appendChild(s);
  }

  function show(){
    var done = document.getElementById('done');
    var box = document.getElementById('myRefl');
    if (!done || !done.classList.contains('active')) return;
    if (box) { var t0 = (ta.value || '').trim(); box.querySelector('.myrefl-text').textContent = t0; box.querySelector('.myrefl-head').style.display = t0 ? '' : 'none'; box.querySelector('.myrefl-text').style.display = t0 ? '' : 'none'; return; }
    box = document.createElement('div');
    box.id = 'myRefl';
    box.style.cssText = 'margin:10px 0 16px;text-align:left;';
    var head = document.createElement('div');
    head.className = 'myrefl-head';
    head.style.cssText = 'font-family:Mitr,sans-serif;font-weight:600;font-size:13px;margin-bottom:4px;';
    head.textContent = LBL;
    var body = document.createElement('div');
    body.className = 'rtag myrefl-text';   // .rtag = shown but never narrated (it is the student's own text)
    body.style.cssText = 'font-family:Sarabun,sans-serif;font-weight:400;color:var(--text,#0F1B2D);font-size:14px;line-height:1.6;white-space:pre-wrap;background:#fff;border:1.5px dashed var(--border,#ddd);border-radius:14px;padding:12px 14px;margin-bottom:10px;';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn ghost';
    btn.textContent = PRINT;
    btn.onclick = function(){ loadPrinter(function(){ window.csPrint.reflection((ta.value || '').trim()); }); };
    box.appendChild(head); box.appendChild(body); box.appendChild(btn);
    var sc = document.getElementById('resScore');
    if (sc && sc.parentNode) sc.parentNode.insertBefore(box, sc.nextSibling); else done.appendChild(box);
    var t = (ta.value || '').trim();
    body.textContent = t; head.style.display = t ? '' : 'none'; body.style.display = t ? '' : 'none';
  }
  new MutationObserver(show).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
  show();
})();
