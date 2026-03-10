/* ── UI ── */

// ── Ruler
function buildRuler(fillPct){
  const numStr = String(fillPct).replace('%','').trim();
  const pct = Math.min(100, Math.max(0, parseFloat(numStr)||0));
  const ticks = Array.from({length:10+1},()=>'<span></span>').join('');
  return '<div class="seal-ruler">'
    + '<div class="seal-ruler-track"></div>'
    + '<div class="seal-ruler-ticks">' + ticks + '</div>'
    + '<div class="seal-ruler-fill" data-fill="' + pct + '%"></div>'
    + '<div class="seal-ruler-pointer" data-fill="' + pct + '%"></div>'
    + '</div>';
}

function animateRulers(root){
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    root.querySelectorAll('.seal-ruler-fill, .seal-ruler-pointer').forEach(el=>{
      const f = el.dataset.fill;
      if(el.classList.contains('seal-ruler-fill')) el.style.width = f;
      if(el.classList.contains('seal-ruler-pointer')) el.style.left = 'calc(' + f + ' - 4px)';
    });
  }));
}

/* ════════════════════════════════
   FLOW
════════════════════════════════ */
function startQuiz(){
  document.getElementById('intro').classList.add('hidden');
  document.getElementById('result').classList.add('hidden');
  document.getElementById('quiz').classList.remove('hidden');
  document.getElementById('quiz').classList.add('in');

  qi = 0;
  answerHistory = [];
  axesScore = {};
  AXES.forEach(k => axesScore[k] = 0);
  _lastResultCode = null;

  const elProgress = document.getElementById('progress');
  elProgress.innerHTML='';
  for(let i=0;i<questions.length;i++){
    const d=document.createElement('div');d.className='seg';elProgress.appendChild(d);
  }
  showQuestion();
  window.scrollTo({top:0,behavior:'smooth'});
}

function updateProgress(){
  document.querySelectorAll('.seg').forEach((s,idx)=>{
    s.classList.remove('done','active');
    if(idx<qi) s.classList.add('done');
    else if(idx===qi) s.classList.add('active');
  });
  document.getElementById('quiz-label').textContent=`Question ${ROMAN[qi]} of ${ROMAN[questions.length-1]}`;
  document.getElementById('qno').textContent=`— ${ROMAN[qi]} —`;
}

/* ════════════════════════════════
   TYPEWRITER
════════════════════════════════ */
let _twTimer = null;   
let _twDone  = false;  

function skipTypewriter(){
  if(_twTimer){ clearInterval(_twTimer); _twTimer=null; }
  _finishTypewriter();
}

function _finishTypewriter(){
  _twDone = true;
  document.getElementById('skip-wrap').style.display='none';

  const el = document.getElementById('qtext');
  const q  = questions[qi];
  el.textContent = q.text;

  const opts = document.getElementById('options');
  opts.innerHTML='';
  q.options.forEach((opt,i)=>{
    const btn=document.createElement('button');
    btn.className='opt';btn.type='button';
    btn.innerHTML=`<span class="bullet"></span><span class="txt">${opt.text}</span>`;
    btn.onclick = () => pick(i, opt.add, btn);
    opts.appendChild(btn);
    setTimeout(()=>btn.classList.add('visible'), 60+i*130);
  });
}

function showQuestion(){
  updateProgress();
  _twDone  = false;
  if(_twTimer){ clearInterval(_twTimer); _twTimer=null; }

  const q   = questions[qi];
  const el  = document.getElementById('qtext');
  const skipWrap = document.getElementById('skip-wrap');

  document.getElementById('options').innerHTML='';
  el.textContent='';
  skipWrap.style.display='block';

  const chars = q.text.split('');
  let idx = 0;
  _twTimer = setInterval(()=>{
    if(idx < chars.length){
      el.textContent += chars[idx];
      idx++;
    } else {
      clearInterval(_twTimer); _twTimer=null;
      _finishTypewriter();
    }
  }, 38); 
}

function pick(optionIndex, addObj, btn){
  if(_twTimer){ clearInterval(_twTimer); _twTimer=null; }
  document.querySelectorAll('.opt').forEach(b => b.disabled = true);
  btn.classList.add('selected');

  answerHistory[qi] = optionIndex;
  addAxisScores(addObj);

  setTimeout(() => {
    qi++;
    qi < questions.length ? showQuestion() : showResult();
  }, 380);
}

function confirmRestart(){
  if(confirm('確定要重新開始？目前進度將清除。')){
    location.reload();
  }
}

/* ════════════════════════════════
   CP 配對區塊
════════════════════════════════ */
function renderCpBlock(code){
  const r   = resultsData[code];
  const el  = document.getElementById('r-cp');
  if(!el) return;
  if(!r || !r.cp1){ el.innerHTML=''; return; }

  const cp2Html = (r.cp2||[]).map(n=>`<span class="cp-alt">${n}</span>`)
                              .join('<span class="cp-sep">・</span>');

  el.innerHTML =
    `<div class="lab">靈魂配對</div>`
    + `<div class="cp-row cp-main"><span class="cp-label">王道 CP</span><span class="cp-name">${r.cp1}</span></div>`
    + `<div class="cp-row cp-subs"><span class="cp-label">次　選</span><span>${cp2Html}</span></div>`;
}

/* ════════════════════════════════
   TOP AXES
════════════════════════════════ */
function getMyTopAxesHTML() {
  const axisMax = calcAxisMax();
  const axisLabel = {
    opt:'樂觀', crp:'沉淪', frc:'強勢', sed:'引誘', cmp:'共犯',
    grd:'守護', obs:'執著', pos:'佔有', lsc:'失控', slc:'自制'
  };
  const validTraits = ['opt', 'crp', 'frc', 'sed', 'cmp', 'grd', 'obs', 'pos', 'lsc', 'slc'];
  const top3 = Object.entries(axesScore)
    .filter(([k, v]) => validTraits.includes(k))
    .sort((a,b)=>b[1]-a[1])
    .slice(0,3);

  return top3.map(([k,v])=>{
    const pct = axisMax[k] ? Math.round((v/axisMax[k])*100) : 0;
    return '<div class="seal">'
      + '<div class="lab">' + (axisLabel[k]||k) + '</div>'
      + buildRuler(pct+'%')
      + '<div class="val">' + v + '</div>'
      + '</div>';
  }).join('');
}

/* ════════════════════════════════
   DYNAMIC EMBLEM SVGs
════════════════════════════════ */
function getEmblemSVG(bookName) {
  const baseProps = 'viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  switch(bookName) {
    case '《咬了神一口》': // 獅子與鹿
      return `<svg ${baseProps}><path d="M32 24v-12M24 18l-4-8l-4 4M40 18l4-8l4 4"/><circle cx="32" cy="40" r="10"/><path d="M32 26v-4M22 40h-4M42 40h4M26 34l-4-4M38 34l4-4M26 46l-4 4M38 46l4 4M32 54v4"/></svg>`;
    case '《消失的終點線》': // 兔子與烏龜
      return `<svg ${baseProps}><path d="M26 32c0-20-6-24-6-8M38 32c0-20 6-24 6-8"/><path d="M16 48c0-16 32-16 32 0z"/><path d="M24 48v-8l8-8 8 8v8M24 40h16"/></svg>`;
    case '《糖裹屋》': // 棒棒糖
      return `<svg ${baseProps}><circle cx="32" cy="24" r="16"/><path d="M32 24c0-4 4-8 8-4 4 4 0 12-8 12-12 0-16-12-8-20 8-8 22 0 20 12"/><line x1="32" y1="40" x2="32" y2="60"/><polygon points="26,44 20,40 20,48" fill="currentColor"/><polygon points="38,44 44,40 44,48" fill="currentColor"/></svg>`;
    case '《灰燼》': // 面具與火焰
      return `<svg ${baseProps}><path d="M16 24c0-8 32-8 32 0 0 16-16 28-16 28S16 40 16 24z"/><path d="M32 16v36"/><circle cx="24" cy="28" r="3"/><circle cx="40" cy="28" r="3"/><path d="M32 16c-4-8 4-12 0-16 8 4 8 12 0 16z" fill="currentColor" stroke="none"/></svg>`;
    case '《兩兄弟》': // 心臟與劍
      return `<svg ${baseProps}><path d="M32 20c0-10-16-10-16 4 0 14 16 28 16 28s16-14 16-28c0-14-16-14-16-4z"/><line x1="12" y1="52" x2="52" y2="12"/><line x1="8" y1="56" x2="16" y2="48"/><line x1="6" y1="58" x2="12" y2="52"/></svg>`;
    case '《沉睡荊棘》': // 蘋果與龍
      return `<svg ${baseProps}><path d="M32 20c16 0 16 28 0 28-16 0-16-28 0-28z"/><path d="M32 20q0-10 8-12"/><path d="M48 34q8-14 12 0q-4 14-12 0z" fill="currentColor"/><path d="M16 34q-8-14-12 0q4 14 12 0z" fill="currentColor"/></svg>`;
    case '《哈梅爾的吹笛手》': // 老鼠
      return `<svg ${baseProps}><path d="M24 40q0-16 16-16q8 0 8 8v8z"/><circle cx="32" cy="24" r="6"/><circle cx="42" cy="34" r="1.5" fill="currentColor" stroke="none"/><path d="M24 40q-12 0-16 8t12 8"/><line x1="48" y1="36" x2="54" y2="34"/><line x1="48" y1="38" x2="54" y2="40"/></svg>`;
    case '《寶石、烏鴉和水瓶》': // 寶石烏鴉水瓶
      return `<svg ${baseProps}><path d="M24 36v20h16V36l-4-8h-8z"/><polygon points="32,8 38,16 32,24 26,16"/><path d="M48 20c8-4 12 4 4 8-4 4-8 0-4-8z"/><path d="M52 28l-8 8"/></svg>`;
    case '《溫先生他一絲不掛》': // 皇冠
      return `<svg ${baseProps}><path d="M12 44l4-24 16 12 16-12 4 24z"/><line x1="12" y1="48" x2="52" y2="48"/><circle cx="16" cy="16" r="3" fill="currentColor" stroke="none"/><circle cx="32" cy="28" r="3" fill="currentColor" stroke="none"/><circle cx="48" cy="16" r="3" fill="currentColor" stroke="none"/></svg>`;
    case '《影子吻了我》': // 魔法書與影子
      return `<svg ${baseProps}><path d="M32 48V24L16 16v24zM32 48V24l16-8v24z"/><path d="M32 16q0-8 8-16M32 16q0-8-8-16M16 16q-8-8-16 0M48 16q8-8 16 0"/></svg>`;
    default:
      return `<svg ${baseProps}><circle cx="32" cy="32" r="16"/><path d="M32 8v48M8 32h48M20 20l24 24M20 44l24-24"/></svg>`;
  }
}

/* ════════════════════════════════
   SHOW RESULT
════════════════════════════════ */
function showResult(){
  const elQuiz = document.getElementById('quiz');
  const elResult = document.getElementById('result');
  elQuiz.classList.add('hidden');
  document.getElementById('intro').classList.add('hidden');
  elResult.classList.remove('hidden');
  elResult.classList.remove('in');
  void elResult.offsetWidth;
  elResult.classList.add('in');
  
  const code = determineResultCode();
  _lastResultCode = code;
  const r = resultsData[code];
  
  if(!r){
    document.getElementById('pop-line').textContent='✦ 黑森林暫時找不到你的檔案（結果資料缺漏）。';
    console.error('Missing resultsData for code:',code);
    return;
  }
  
  const label = (RESULT_META[code] && RESULT_META[code].label) || code;
  document.getElementById('result-img').src = r.image;
  document.getElementById('r-name').textContent = r.soulName;
  document.getElementById('r-compound').textContent = label;
  document.getElementById('r-desc').textContent = r.soulDesc;
  
  const mbtiEl = document.getElementById('r-mbti');
  if(mbtiEl) mbtiEl.innerHTML = r.mbti ? `<span class="r-mbti-label">MBTI</span><strong>${r.mbti}</strong>` : '';
  
  document.getElementById('r-quote').textContent = r.quote;
  document.getElementById('r-guide').textContent = r.guide;

  /* ══ 整合塔羅牌陣數據區塊 ══ */
  const baseStatsHTML =
    '<div class="seal"><div class="lab">危險指數</div>'+buildRuler(r.dangerFill)+'<div class="val">'+r.danger+'</div></div>'
    +'<div class="seal"><div class="lab">'+r.attr+'</div>'+buildRuler(r.attrFill)+'<div class="val">'+r.attrVal+'</div></div>'
    +'<div class="seal"><div class="lab">逃脱機率</div>'+buildRuler(r.escape)+'<div class="val">'+r.escape+'</div></div>';

  const topAxesHTML = getMyTopAxesHTML();

  const tarotHTML = `
    <div class="tarot-star ts-tl"></div>
    <div class="tarot-star ts-tr"></div>
    <div class="tarot-star ts-bl"></div>
    <div class="tarot-star ts-br"></div>
    
    <div class="tarot-pendant top-pendant"></div>
    
    <div class="tarot-emblem">
        ${getEmblemSVG(r.bookName)}
    </div>
    
    <div class="tarot-title">✦ 基礎印記 ✦</div>
    ${baseStatsHTML}
    
    <div class="tarot-divider">
        <svg viewBox="0 0 200 10" preserveAspectRatio="none">
            <line x1="10" y1="5" x2="190" y2="5" stroke="rgba(255,255,255,0.2)" stroke-dasharray="2 4"/>
            <polygon points="100,0 105,5 100,10 95,5" fill="rgba(255,255,255,0.6)"/>
        </svg>
    </div>
    
    <div class="tarot-title">✦ 黑暗特質 ✦</div>
    ${topAxesHTML}
    
    <div class="tarot-pendant bottom-pendant"></div>
  `;

  document.getElementById('seals').innerHTML = tarotHTML;
  animateRulers(document.getElementById('seals')); 

  const cta = document.getElementById('r-cta');
  const tagsHtml = (r.bookTags||[]).map(t=>'<span class="cta-tag">'+t+'</span>').join('');
  const fairyLine = r.bookFairy ? '<span class="cta-fairy">'+r.bookFairy+'</span>' : '';
  cta.innerHTML='<a href="'+escapeAttr(r.link)+'" target="_blank" rel="noopener noreferrer" onclick="trackBookClick(\''+code+'\')">'
    +'<img class="cta-cover" src="https://framerusercontent.com/images/mduS33yvcuc8AhTxWKgAsjOOek.jpg?width=1819&height=2551" alt=""/>'
    +'<div class="cta-info">'
    +  '<div class="cta-meta">'
    +    '<span class="cta-label">解鎖故事樣本</span>'
    +    '<span class="cta-arrow">→</span>'
    +  '</div>'
    +  '<div class="cta-title-row">'
    +    '<span class="cta-title">'+r.bookName+'</span>'
    +    '<span class="cta-author">'+(r.bookAuthor||'')+'</span>'
    +  '</div>'
    +  '<div class="cta-bot">'
    +    fairyLine
    +    '<span class="cta-tags">'+tagsHtml+'</span>'
    +  '</div>'
    +'</div>'
    +'</a>';
    
  renderCpBlock(code);
  sendStats(code);
  window.scrollTo({top:0,behavior:'smooth'});
}

/* ════════════════════════════════
   STATS & SHARE
════════════════════════════════ */
function trackBookClick(code){
  trackUserAction(code, "book_click");
}
window.trackBookClick    = trackBookClick;
window.shareResultAsImage = shareResultAsImage;

function escapeAttr(str){
  const s = String(str ?? '');
  return s.replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

async function shareResultAsImage() {
  const code        = _lastResultCode || determineResultCode();
  const btn         = document.querySelector('.btn.mini');
  const btnRow      = document.querySelector('#result .btn-row');
  const targetEl    = document.getElementById('result');
  const originalText = btn.textContent;
  const SITE_URL    = 'https://tealize-write.github.io/DarkBLstory/';

  trackUserAction(code, "share_image");
  btn.textContent = "生成專屬圖像中...";
  btn.disabled    = true;
  if(btnRow) btnRow.style.display = 'none';

  const animEls = [...targetEl.querySelectorAll('.in')];
  animEls.forEach(el => {
    el.style.animation = 'none';
    el.style.opacity   = '1';
    el.style.transform = 'translateY(0)';
    el.style.filter    = 'none';
  });

  const stamp = document.createElement('div');
  stamp.id = '_share_stamp';
  stamp.style.cssText =
    'text-align:center;padding:14px 0 18px;' +
    'font-family:Georgia,serif;font-size:13px;letter-spacing:2px;' +
    'color:rgba(255,255,255,.5);' +
    'border-top:1px solid rgba(255,255,255,.1);margin-top:24px;';
  stamp.textContent = '✦  ' + SITE_URL + '  ✦';
  targetEl.appendChild(stamp);

  const originalScrollY = window.scrollY;
  window.scrollTo(0, 0);

  const fullH = targetEl.scrollHeight;
  const fullW = targetEl.offsetWidth;

  let canvas = null;
  try {
    canvas = await html2canvas(targetEl, {
      scale          : Math.min(window.devicePixelRatio || 2, 2),
      backgroundColor: '#0a0a0a',
      useCORS        : true,
      allowTaint     : false,
      logging        : false,
      width          : fullW,
      height         : fullH,
      windowWidth    : document.documentElement.offsetWidth,
      windowHeight   : fullH,
      scrollX        : 0,
      scrollY        : 0,
    });
  } catch(err) {
    console.error("html2canvas 失敗:", err);
    alert("圖片生成失敗，請稍後再試。");
  }

  window.scrollTo(0, originalScrollY);
  animEls.forEach(el => {
    el.style.animation = '';
    el.style.opacity   = '';
    el.style.transform = '';
    el.style.filter    = '';
  });
  const stampEl = document.getElementById('_share_stamp');
  if(stampEl) stampEl.remove();
  if(btnRow) btnRow.style.display = 'flex';
  btn.textContent = originalText;
  btn.disabled    = false;

  if(!canvas) return;

  canvas.toBlob(async (blob) => {
    if(!blob){ alert("圖片轉檔失敗"); return; }

    const file    = new File([blob], 'dark_trait_result.png', { type: 'image/png' });
    const isTouchDevice = window.matchMedia('(pointer:coarse)').matches;
    const isMobile = isTouchDevice && navigator.canShare && navigator.canShare({ files: [file] });

    if(isMobile) {
      try {
        await navigator.share({
          title: '故事另有結局｜黑暗特質心理測驗',
          text : '歡迎前往黑森林，測試你的黑暗特質是什麼？',
          url  : SITE_URL,
          files: [file],
        });
      } catch(e) { }
      return;
    }

    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href     = objUrl;
    a.download = 'dark_trait_result.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objUrl), 1000);

    if(navigator.clipboard && navigator.clipboard.write) {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        const miniBtn = document.querySelector('.btn.mini');
        if(miniBtn){
          const prev = miniBtn.textContent;
          miniBtn.textContent = '✦ 已下載＋複製到剪貼簿！';
          setTimeout(() => { miniBtn.textContent = prev; }, 2500);
        }
      } catch(e) {
        const miniBtn = document.querySelector('.btn.mini');
        if(miniBtn){
          const prev = miniBtn.textContent;
          miniBtn.textContent = '✦ 圖片已下載！';
          setTimeout(() => { miniBtn.textContent = prev; }, 2500);
        }
      }
    } else {
      const miniBtn = document.querySelector('.btn.mini');
      if(miniBtn){
        const prev = miniBtn.textContent;
        miniBtn.textContent = '✦ 圖片已下載！';
        setTimeout(() => { miniBtn.textContent = prev; }, 2500);
      }
    }
  }, 'image/png');
}