/* Printable sheets, loaded only when a student presses a print button (so none of this text is on
 * any lesson page and none of it needs narration). Opens a plain print window; nothing is stored or sent. */
(function(){
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  var CSS = 'body{font-family:Sarabun,Tahoma,sans-serif;max-width:740px;margin:28px auto;padding:0 18px;line-height:1.7;color:#111}'
    + 'h1{font-size:22px;margin:0 0 6px}h2{font-size:16px;margin:18px 0 6px}.meta{margin:8px 0 14px}'
    + '.box{border:1px solid #888;border-radius:8px;padding:12px;min-height:84px;white-space:pre-wrap}'
    + '.prompt{border:1px dashed #888;border-radius:8px;padding:10px;white-space:pre-wrap;background:#f6f6f6}'
    + 'ol{margin:6px 0 6px 22px;padding:0}li{margin-bottom:4px}.chk li{list-style:none;margin-left:-20px}'
    + '.line{border-bottom:1px solid #888;height:30px}.sign{margin-top:26px}@media print{body{margin:0}}';

  function open(title, body){
    var w = window.open('', '_blank');
    if (!w) return;
    w.document.write('<!doctype html><html lang="th"><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>' + CSS + '</style></head><body>' + body + '</body></html>');
    w.document.close();
    w.focus();
    setTimeout(function(){ w.print(); }, 350);
  }
  function today(){ try { return new Date().toLocaleDateString('th-TH', { dateStyle: 'long' }); } catch (e) { return ''; } }

  window.csPrint = {
    // end-of-lesson summary
    reflection: function(text){
      var d = document;
      var title = d.title || '';
      var res = (d.getElementById('resTitle') || {}).textContent || '';
      var stars = (d.getElementById('resStars') || {}).textContent || '';
      var score = (d.getElementById('resScore') || {}).textContent || '';
      open(title,
        '<h1>' + esc(title) + '</h1>'
        + '<div class="meta">ชื่อ ______________________________ ชั้น ________ วันที่ ' + esc(today()) + '</div>'
        + '<h2>ผลที่ได้</h2><div>' + esc(res) + ' ' + esc(stars) + '<br>' + esc(score) + '</div>'
        + '<h2>สิ่งที่ฉันตั้งใจจะทำต่อไป</h2><div class="box">' + esc(text) + '</div>'
        + '<div class="sign">ลายเซ็นครู ______________________________</div>');
    },
    // worksheet for the "try it for real" task
    tryReal: function(c){
      var steps = (c.steps || []).map(function(s){ return '<li>' + esc(s) + '</li>'; }).join('');
      var obs = (c.observe || []).map(function(o){ return '<li>☐ ' + esc(o) + '</li>'; }).join('');
      open(c.title || 'ใบงาน',
        '<h1>' + esc(c.title || '') + '</h1>'
        + '<div class="meta">ชื่อ ______________________________ ชั้น ________ วันที่ ' + esc(today()) + '</div>'
        + (c.intro ? '<div>' + esc(c.intro) + '</div>' : '')
        + (c.prompt ? '<h2>คำสั่งที่ใช้</h2><div class="prompt">' + esc(c.prompt) + '</div>' : '')
        + '<h2>ทำตามนี้ทีละขั้น</h2><ol>' + steps + '</ol>'
        + '<h2>สิ่งที่ต้องสังเกต (ติ๊กเมื่อเช็กแล้ว)</h2><ul class="chk">' + obs + '</ul>'
        + '<h2>สิ่งที่ฉันพบ</h2><div class="box"></div>'
        + (c.note ? '<p>' + esc(c.note) + '</p>' : '')
        + '<div class="sign">ลายเซ็นครู ______________________________</div>');
    }
  };
})();
