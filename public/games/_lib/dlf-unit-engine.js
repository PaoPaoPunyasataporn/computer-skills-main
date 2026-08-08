
(function(){
  const dlf=window.dlf={};
  let muted=false; try{localStorage.removeItem('dlfMute');}catch(e){}

  // text -> audio src (data URI or "audio/xxx.mp3" path). Keyed by md5(text)[:12].
  let AUD={}; try{AUD=JSON.parse(document.getElementById('dlfAudioData').textContent)||{};}catch(e){AUD={};}

  // tiny synchronous md5 (for key lookup) -----------------------------------
  function md5(s){function rl(n,c){return(n<<c)|(n>>>(32-c));}function au(x,y){var l=(x&0xFFFF)+(y&0xFFFF),m=(x>>16)+(y>>16)+(l>>16);return(m<<16)|(l&0xFFFF);}
    function cmn(q,a,b,x,s,t){return au(rl(au(au(a,q),au(x,t)),s),b);}
    function ff(a,b,c,d,x,s,t){return cmn((b&c)|(~b&d),a,b,x,s,t);}
    function gg(a,b,c,d,x,s,t){return cmn((b&d)|(c&~d),a,b,x,s,t);}
    function hh(a,b,c,d,x,s,t){return cmn(b^c^d,a,b,x,s,t);}
    function ii(a,b,c,d,x,s,t){return cmn(c^(b|~d),a,b,x,s,t);}
    function tb(str){var n=str.length,b=[];for(var i=0;i<n*8;i+=8)b[i>>5]|=(str.charCodeAt(i/8)&255)<<(i%32);return b;}
    function u8(str){var u=unescape(encodeURIComponent(str));return u;}
    function hex(num){var s='',j;for(j=0;j<=3;j++)s+=('0'+((num>>(j*8+4))&15).toString(16)+((num>>(j*8))&15).toString(16)).slice(-2);return s;}
    s=u8(s);var x=tb(s),len=s.length*8;x[len>>5]|=0x80<<(len%32);x[(((len+64)>>>9)<<4)+14]=len;
    var a=1732584193,b=-271733879,c=-1732584194,d=271733878;
    for(var i=0;i<x.length;i+=16){var oa=a,ob=b,oc=c,od=d;
      a=ff(a,b,c,d,x[i],7,-680876936);d=ff(d,a,b,c,x[i+1],12,-389564586);c=ff(c,d,a,b,x[i+2],17,606105819);b=ff(b,c,d,a,x[i+3],22,-1044525330);
      a=ff(a,b,c,d,x[i+4],7,-176418897);d=ff(d,a,b,c,x[i+5],12,1200080426);c=ff(c,d,a,b,x[i+6],17,-1473231341);b=ff(b,c,d,a,x[i+7],22,-45705983);
      a=ff(a,b,c,d,x[i+8],7,1770035416);d=ff(d,a,b,c,x[i+9],12,-1958414417);c=ff(c,d,a,b,x[i+10],17,-42063);b=ff(b,c,d,a,x[i+11],22,-1990404162);
      a=ff(a,b,c,d,x[i+12],7,1804603682);d=ff(d,a,b,c,x[i+13],12,-40341101);c=ff(c,d,a,b,x[i+14],17,-1502002290);b=ff(b,c,d,a,x[i+15],22,1236535329);
      a=gg(a,b,c,d,x[i+1],5,-165796510);d=gg(d,a,b,c,x[i+6],9,-1069501632);c=gg(c,d,a,b,x[i+11],14,643717713);b=gg(b,c,d,a,x[i],20,-373897302);
      a=gg(a,b,c,d,x[i+5],5,-701558691);d=gg(d,a,b,c,x[i+10],9,38016083);c=gg(c,d,a,b,x[i+15],14,-660478335);b=gg(b,c,d,a,x[i+4],20,-405537848);
      a=gg(a,b,c,d,x[i+9],5,568446438);d=gg(d,a,b,c,x[i+14],9,-1019803690);c=gg(c,d,a,b,x[i+3],14,-187363961);b=gg(b,c,d,a,x[i+8],20,1163531501);
      a=gg(a,b,c,d,x[i+13],5,-1444681467);d=gg(d,a,b,c,x[i+2],9,-51403784);c=gg(c,d,a,b,x[i+7],14,1735328473);b=gg(b,c,d,a,x[i+12],20,-1926607734);
      a=hh(a,b,c,d,x[i+5],4,-378558);d=hh(d,a,b,c,x[i+8],11,-2022574463);c=hh(c,d,a,b,x[i+11],16,1839030562);b=hh(b,c,d,a,x[i+14],23,-35309556);
      a=hh(a,b,c,d,x[i+1],4,-1530992060);d=hh(d,a,b,c,x[i+4],11,1272893353);c=hh(c,d,a,b,x[i+7],16,-155497632);b=hh(b,c,d,a,x[i+10],23,-1094730640);
      a=hh(a,b,c,d,x[i+13],4,681279174);d=hh(d,a,b,c,x[i],11,-358537222);c=hh(c,d,a,b,x[i+3],16,-722521979);b=hh(b,c,d,a,x[i+6],23,76029189);
      a=hh(a,b,c,d,x[i+9],4,-640364487);d=hh(d,a,b,c,x[i+12],11,-421815835);c=hh(c,d,a,b,x[i+15],16,530742520);b=hh(b,c,d,a,x[i+2],23,-995338651);
      a=ii(a,b,c,d,x[i],6,-198630844);d=ii(d,a,b,c,x[i+7],10,1126891415);c=ii(c,d,a,b,x[i+14],15,-1416354905);b=ii(b,c,d,a,x[i+5],21,-57434055);
      a=ii(a,b,c,d,x[i+12],6,1700485571);d=ii(d,a,b,c,x[i+3],10,-1894986606);c=ii(c,d,a,b,x[i+10],15,-1051523);b=ii(b,c,d,a,x[i+1],21,-2054922799);
      a=ii(a,b,c,d,x[i+8],6,1873313359);d=ii(d,a,b,c,x[i+15],10,-30611744);c=ii(c,d,a,b,x[i+6],15,-1560198380);b=ii(b,c,d,a,x[i+13],21,1309151649);
      a=ii(a,b,c,d,x[i+4],6,-145523070);d=ii(d,a,b,c,x[i+11],10,-1120210379);c=ii(c,d,a,b,x[i+2],15,718787259);b=ii(b,c,d,a,x[i+9],21,-343485551);
      a=au(a,oa);b=au(b,ob);c=au(c,oc);d=au(d,od);}
    return hex(a)+hex(b)+hex(c)+hex(d);}

  let curAudio=null;
  function stopAudio(){if(curAudio){try{curAudio.pause();}catch(e){}curAudio=null;}try{speechSynthesis.cancel();}catch(e){}}

  // device-voice fallback
  let thaiVoice=null;
  function pickVoice(){if(!('speechSynthesis'in window))return;const vs=speechSynthesis.getVoices();
    thaiVoice=vs.find(v=>v.lang&&v.lang.toLowerCase().startsWith('th'))||vs.find(v=>/thai/i.test(v.name))||null;}
  if('speechSynthesis'in window){pickVoice();speechSynthesis.onvoiceschanged=pickVoice;}
  // Speaking is fiddlier than it looks, and both of these bite in the classroom:
  //  * Chrome silently DROPS an utterance spoken in the same tick as cancel(),
  //    and stays mute forever if the queue was left paused. So: reset, then speak
  //    on a later tick.
  //  * On a machine with no Thai voice installed (plenty of school Windows boxes),
  //    a th-TH utterance just errors and you hear nothing. So: fall back to
  //    whatever voice the device does have rather than staying silent.
  function tts(text,opts){
    if(!('speechSynthesis'in window)||!text)return;
    var sp=window.speechSynthesis, rate=(opts&&opts.rate)||.92;
    function say(){
      try{
        var u=new SpeechSynthesisUtterance(text);
        if(thaiVoice){u.voice=thaiVoice;u.lang=thaiVoice.lang||'th-TH';}else{u.lang='th-TH';}
        u.rate=rate;u.pitch=1.05;
        u.onerror=function(ev){
          if(ev&&ev.error==='canceled'||ev&&ev.error==='interrupted')return;
          try{var f=new SpeechSynthesisUtterance(text);f.rate=rate;f.pitch=1.05;sp.speak(f);}catch(e){}
        };
        sp.speak(u);
        if(sp.paused){try{sp.resume();}catch(e){}}
      }catch(e){}
    }
    try{sp.cancel();}catch(e){}
    if(!sp.getVoices().length){
      var fired=false, go=function(){if(fired)return;fired=true;pickVoice();say();};
      try{sp.addEventListener('voiceschanged',go,{once:true});}catch(e){}
      setTimeout(go,250);
    }else{
      setTimeout(say,60);
    }
  }

  function dlfCleanKey(s){if(!s)return '';
    s=s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}\u200d\u20e3\u2122\u2139\u2194-\u21AA]/gu,'');
    s=s.replace(/🔊/g,'');s=s.replace(/[""''`]/g,'');s=s.replace(/\s+/g,' ').trim();return s;}
  function dlfSrc(t){var c=dlfCleanKey(t);return AUD[md5(c).slice(0,12)]||AUD[c]||null;}
  function dlfPlaySrc(src,onend){try{var a=new Audio(src);curAudio=a;a.onended=onend||null;a.play().catch(function(){if(onend)onend();});return true;}catch(e){return false;}}
  // split composite text into chunks that each have a clip; play in sequence
  function dlfChunks(text){
    var c=dlfCleanKey(text);
    if(dlfSrc(c)) return [c];
    // split on Thai/ASCII sentence punctuation & long spaces, keep order
    var parts=c.split(/(?<=[?!\.\u0E2F])\s+|\s{2,}|\s*[:：]\s*|\s*\(/).map(function(s){return dlfCleanKey(s.replace(/\)$/,''));}).filter(Boolean);
    var have=parts.filter(function(p){return dlfSrc(p);});
    if(have.length) return have;
    // last resort: try splitting by ' ' into the longest matching prefixes
    return [c];
  }
  dlf.speak=function(text,opts){opts=opts||{};if(muted||!text)return;
    var clean=dlfCleanKey(text);stopAudio();
    var direct=dlfSrc(clean)||AUD[md5(text.trim()).slice(0,12)]||AUD[text];
    if(direct){dlfPlaySrc(direct);return;}
    var chunks=dlfChunks(text), i=0;
    function nxt(){ if(i>=chunks.length){return;} var s=dlfSrc(chunks[i]); i++; if(s){dlfPlaySrc(s,nxt);} else {nxt();} }
    if(chunks.length && dlfSrc(chunks[0])){ nxt(); } else { tts(clean,opts); }
  };
  dlf.stop=stopAudio;
  dlf.has=function(text){var c=dlfCleanKey(text||'');return !!(AUD[md5(c).slice(0,12)]||AUD[md5((text||'').trim()).slice(0,12)]);};

  const spk=document.getElementById('dlfSpk');
  function paint(){spk.textContent=muted?'🔇':'🔊';spk.classList.toggle('muted',muted);}
  paint();
  spk.addEventListener('click',()=>{muted=!muted;try{localStorage.setItem('dlfMute',muted?'1':'0');}catch(e){}
    if(muted){stopAudio();}else{dlf.speak('เปิดเสียงแล้ว');}paint();});

  const cols=['#F0982E','#38A93A','#3A82F6','#9A5CF0','#FFC24B'];
  function confetti(n){n=n||80;for(let i=0;i<n;i++){const c=document.createElement('div');c.className='dlf-confetti';
    const s=6+Math.random()*8;c.style.width=s+'px';c.style.height=(s*.6)+'px';c.style.left=(Math.random()*100)+'vw';
    c.style.background=cols[Math.floor(Math.random()*cols.length)];c.style.opacity=.9;const d=2.4+Math.random()*1.8;
    c.style.animation=`dlfFall ${d}s linear forwards`;c.style.animationDelay=(Math.random()*.4)+'s';
    document.body.appendChild(c);setTimeout(()=>c.remove(),(d+.6)*1000);}}
  dlf.confetti=confetti;

  const cong=document.getElementById('dlfCong');
  var DLF_CHEER='audio/_cheer.mp3';
  function dlfPlayCheer(){if(muted)return;try{var a=new Audio(DLF_CHEER);a.volume=0.85;a.play().catch(function(){});}catch(e){}}
  // The end-of-game overlay. The PARTY — confetti raining down plus the cheering
  // clip — is reserved for a perfect run: 3 stars and nothing less. Finishing with
  // 1 or 2 stars still gets a warm well-done screen showing the stars actually
  // earned, so the confetti stays worth chasing.
  dlf.bigCongrats=function(o){o=o||{};
    const st=Math.max(0,Math.min(3,o.stars==null?3:(o.stars|0)));
    const perfect=st>=2;   // 2 stars is already worth celebrating: confetti + cheering
    document.getElementById('dlfCongTrophy').textContent=o.trophy||(perfect?'🏆':'🌟');
    document.getElementById('dlfCongTitle').textContent=o.title||(perfect?'เยี่ยมมาก!':'ทำได้ดีมาก!');
    document.getElementById('dlfCongSub').textContent=o.sub||(perfect?'น้องทำสำเร็จแล้ว':'ลองอีกครั้งเพื่อเก็บ 3 ดาวนะ');
    document.getElementById('dlfCongStars').textContent='⭐'.repeat(st)+'☆'.repeat(3-st);
    cong.classList.add('show');
    if(st>=3){try{var _ap=new Audio('/audio/applause.wav');_ap.play().catch(function(){});setTimeout(function(){var steps=20;var i=0;var iv=setInterval(function(){i++;_ap.volume=Math.max(0,1-i/steps);if(i>=steps)clearInterval(iv);},30);},2400);setTimeout(function(){try{_ap.pause();}catch(e){}},3000);}catch(e){}}
    if(perfect){confetti(150);dlfPlayCheer();}
  };
  // How every game says "the child finished, here is how well they did".
  dlf.celebrate=function(stars,o){o=o||{};o.stars=stars;dlf.bigCongrats(o);};
  dlf.closeCong=function(){cong.classList.remove('show');stopAudio();};

  const mini=document.getElementById('dlfMini');let miniT;
  dlf.cheer=function(msg,voice){mini.textContent=msg;mini.classList.add('show');confetti(28);
    dlfPlayCheer();clearTimeout(miniT);
    miniT=setTimeout(()=>mini.classList.remove('show'),1600);};

  const praises=['เก่งมาก!','สุดยอด!','เยี่ยมเลย!','ทำได้ดีมาก!','ยอดเยี่ยม!'];
  let lastCorrect=-1,lastStreak=-1,congShownFor=null;
  function gvar(n){try{const v=window[n];return typeof v==='number'?v:null;}catch(e){return null;}}
  function poll(){const c=gvar('correct');
    if(c!=null&&c!==lastCorrect){if(c>0&&c%3===0&&c>lastCorrect){const p=praises[Math.floor(Math.random()*praises.length)];dlf.cheer('🎉 '+p,p);}lastCorrect=c;}
    const s=gvar('streak');if(s!=null){if(s>0&&s%5===0&&s!==lastStreak)dlf.cheer('🔥 ต่อเนื่อง '+s+' ครั้ง!','สุดยอด!');lastStreak=s;}}
  setInterval(poll,500);

  const resEl=document.getElementById('results')||document.getElementById('done');
  // How many stars did the child actually earn? The game tells us by setting
  // window.dlfStars just before it shows its results screen. Failing that we read
  // the star row the results screen prints. Only if BOTH are missing do we fall
  // back to assuming a perfect run — which is what this used to do unconditionally,
  // handing out confetti for a one-star finish.
  function dlfEarnedStars(){
    if(typeof window.dlfStars==='number') return Math.max(0,Math.min(3,window.dlfStars|0));
    var el=document.getElementById('resStars');
    if(el){var m=(el.textContent.match(/⭐/g)||[]).length; if(m) return Math.min(3,m);}
    return 3;
  }
  function checkResults(){if(!resEl)return;
    const vis=resEl.classList.contains('active')||(getComputedStyle(resEl).display!=='none'&&resEl.offsetParent!==null);
    if(vis){if(congShownFor!=='on'){congShownFor='on';
      const t=document.getElementById('resTrophy'),ti=document.getElementById('resTitle'),su=document.getElementById('resSub');
      dlf.celebrate(dlfEarnedStars(),{trophy:(t&&t.textContent.trim())||'',title:(ti&&ti.textContent.trim())||'',
        sub:(su&&su.textContent.trim())||''});}}else congShownFor=null;}
  if(resEl){const mo=new MutationObserver(checkResults);
    mo.observe(resEl,{attributes:true,attributeFilter:['class','style']});
    mo.observe(document.body,{attributes:true,subtree:true,attributeFilter:['class','style']});}
  setInterval(checkResults,600);

  var DLF_SELS=['.intro-title','.intro-sub','.id-question','.part-name','.part-desc','.part-fact',
    '.ps-title','.ps-desc','.ps-tip','.mode-title','.mode-desc','.power-section-title','.learn-header','.quiz-header',
    '.hand-title','.lr-title','.lr-desc','.lp-title','.finger-label','.fp-title','.mc-title','.target-url-text','.addr-text',
    '.panel-title','.sc-title','.ans-title','.fail-title','.cc-title','.ch-title','.ch-desc','.hud-title','.match-col-label',
    '.mb-title','.mb-desc','.guide-title','.rank-text','.vp-title','.sp-title','.source-tip','.rc-question','.rc-name',
    '.claim-text','.ht-title','.res-title','.cc-text','.id-item-text','.start-text','.subtitle','.title',
    '.opt-btn','.part-name-en','.hint-text','.tip-text','.q-prompt','.question-text','.fact-text','.card-title','.card-text',
    '.ans-body','.browser-body','.cc-body','.ch-body','.ch-info','.claim','.claim-explain','.content-card','.intro-card','.key-sub','.lesson-card','.lp-sub','.lr-info','.mc-body','.mem-info','.nt-search-box','.panel-sub','.ps-body','.ps-warn','.rc-answer','.rc-body','.res-sub','.sc-body','.start-sub','.warn'];
  // strip emoji/pictographs/symbols + collapse whitespace -> canonical text for keying
  function dlfClean(s){
    if(!s) return '';
    s=s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}\u200d\u20e3\u2122\u2139\u2194-\u21AA]/gu,'');
    s=s.replace(/🔊/g,'');
    s=s.replace(/[""''`]/g,'');
    s=s.replace(/\s+/g,' ').trim();
    return s;
  }
  // read only the element's OWN text (direct text-node children), so we ignore
  // nested counters/score/lives spans that pollute the string
  function dlfOwnText(el){
    var out='';
    el.childNodes.forEach(function(n){
      if(n.nodeType===3) out+=n.textContent;             // text node
      else if(n.nodeType===1 && !n.classList.contains('dlf-say')
              && !n.matches('[class*="score"],[class*="lives"],[class*="timer"],[class*="count"],[class*="label"],[class*="badge"],[class*="num"],[class*="fill"],[class*="bar"]'))
        out+=n.textContent;
    });
    return dlfClean(out);
  }
  // interactive controls we must NOT decorate (the actual game buttons)
  function dlfIsControl(el){
    if(el.matches('button,a,input,textarea,select,label')) return true;
    if(el.closest('button,a[href],input,.opt-btn,.btn,.mode-card,.care-btn,.cc-btn,.tab,.id-option,.ans-btn,.flip-card,.start-btn,.next-btn,.choice,[role="button"],.nav-btn,.new-tab-btn,.browser-toolbar,.browser-titlebar,.tabs-container,.address-bar,[class*="toolbar"],[class*="titlebar"]'+((window.DLF_CONFIG&&window.DLF_CONFIG.extraNonDecorateSelectors)?(','+window.DLF_CONFIG.extraNonDecorateSelectors):''))) return true;
    return false;
  }
  // full text including child <strong>/<span> but excluding counters & our own icon
  function dlfFullText(el){
    var out='';
    el.childNodes.forEach(function(n){
      if(n.nodeType===3) out+=n.textContent;
      else if(n.nodeType===1 && !n.classList.contains('dlf-say')
              && !n.matches('[class*="score"],[class*="lives"],[class*="timer"],[class*="count"],[class*="badge"],[class*="num"],[class*="fill"],[class*="bar"]'))
        out+=n.textContent;
    });
    return dlfClean(out);
  }
  // does this element hold its OWN substantial text (not just wrapping children)?
  function dlfHasOwnText(el){
    for(var i=0;i<el.childNodes.length;i++){
      var n=el.childNodes[i];
      if(n.nodeType===3 && /[\u0E00-\u0E7F]/.test(n.textContent) && n.textContent.trim().length>1) return true;
    }
    return false;
  }
  var DLF_DECSEL='p,li,h1,h2,h3,h4,h5,blockquote,figcaption,dd,dt,div,span,'+DLF_SELS.join(',');
  // own (direct-text-node) Thai character count, ignoring child elements
  function dlfOwnThaiLen(el){var s='';el.childNodes.forEach(function(n){if(n.nodeType===3)s+=n.textContent;});
    var m=dlfClean(s).match(/[฀-๿]/g);return m?m.length:0;}
  // does el contain a descendant that will itself be decorated (so el is a redundant container —
  // this is what caused two 🔊 icons to appear for one piece of text: a wrapper div and its own
  // child paragraph both qualifying for decoration in the same pass)?
  function dlfHasDecoratedChild(el){var ds=el.querySelectorAll(DLF_DECSEL);
    for(var i=0;i<ds.length;i++){var k=ds[i];if(k===el||k.classList.contains('dlf-say'))continue;
      if(dlfHasOwnText(k)&&!dlfIsControl(k))return true;}return false;}
  function readable(el){
    if(!el || el.nodeType!==1) return;
    if(dlfIsControl(el)) return;
    if(el.querySelector('.dlf-say')) return;
    if(el.querySelector('.opt-spk')) return;
    // narrate leaves, not containers: skip wrappers whose text is just their children re-concatenated
    if(dlfOwnThaiLen(el)<12 && dlfHasDecoratedChild(el)) return;
    var txt=dlfFullText(el);
    if(!txt||txt.length<2||txt.length>220) return;
    if(!/[\u0E00-\u0E7F]/.test(txt)) return;
    var b=document.createElement('span');b.className='dlf-say';b.textContent='🔊';b.title='อ่านออกเสียง';
    b.setAttribute('data-dlf', txt);
    b.onclick=function(ev){ev.stopPropagation();
      b.classList.add('playing');dlf.speak(b.getAttribute('data-dlf'));setTimeout(function(){b.classList.remove('playing');},1200);};
    el.appendChild(b);
  }
  // CONTENT-DRIVEN: any paragraph/bullet/heading with its own Thai text gets a button.
  function decorate(){
    // 1) explicit content tags
    try{document.querySelectorAll('p,li,h1,h2,h3,h4,h5,blockquote,figcaption,dd,dt').forEach(function(el){
      if(dlfHasOwnText(el)) readable(el);
    });}catch(e){}
    // 2) leaf DIV/SPAN that directly contain Thai text (cards, body text, etc.)
    try{document.querySelectorAll('div,span').forEach(function(el){
      if(el.classList.contains('dlf-say')) return;
      if(dlfHasOwnText(el)) readable(el);
    });}catch(e){}
    // 3) keep the curated selector list too (covers dynamic-rendered nodes)
    DLF_SELS.forEach(function(sel){try{document.querySelectorAll(sel).forEach(readable);}catch(e){}});
  }
  setInterval(decorate,700);decorate();

  // No greeting and no primer needed — embedded MP3 audio plays directly on any
  // click, including the very first click on a 🔊 button.
})();
