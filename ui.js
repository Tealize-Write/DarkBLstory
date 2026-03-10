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
   DYNAMIC EMBLEM SVGs (全面精緻升級版)
════════════════════════════════ */
function getEmblemSVG(bookName) {
  const baseProps = 'viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  switch(bookName) {
    case '《咬了神一口》': // 獅子與鹿
      return `<svg ${baseProps}>
        <path d="M12 28 Q 8 32, 10 36 Q 8 40, 12 44" />
        <path d="M12 28 C 14 26, 18 24, 22 24 C 26 24, 30 26, 32 28" />
        <path d="M32 28 Q 30 32, 28 36" />
        <path d="M28 36 L 20 36" />
        <path d="M20 36 Q 22 40, 24 40 L 28 40" />
        <path d="M28 40 C 26 44, 22 46, 18 46 C 14 46, 12 44, 12 44" />
        <path d="M16 32 C 18 30, 20 32, 18 34" />
        <path d="M18 34 C 16 36, 14 34, 16 32 Z" fill="currentColor"/>
        <path d="M16 28 Q 14 24, 16 20 Q 18 16, 22 18 C 26 20, 30 24, 32 28" />
        <path d="M52 28 Q 56 32, 54 36 Q 56 40, 52 44" />
        <path d="M52 28 C 50 26, 46 24, 42 24 C 38 24, 34 26, 32 28" />
        <path d="M32 28 Q 34 32, 36 36" />
        <path d="M36 36 L 44 36" />
        <path d="M44 36 Q 42 40, 40 40 L 36 40" />
        <path d="M36 40 C 38 44, 42 46, 46 46 C 50 46, 52 44, 52 44" />
        <path d="M48 32 C 46 30, 44 32, 46 34" />
        <path d="M46 34 C 48 36, 50 34, 48 32 Z" fill="currentColor"/>
        <path d="M38 24 Q 38 16, 32 10" />
        <path d="M32 10 Q 30 8, 28 10 C 30 12, 34 12, 32 16" />
        <path d="M42 24 Q 42 16, 48 10" />
        <path d="M48 10 Q 50 8, 52 10 C 50 12, 46 12, 48 16" />
        <path d="M32 20 Q 32 10, 32 6" stroke-width="1.5"/>
        <polygon points="32,6 36,10 32,14 28,10" fill="currentColor"/>
      </svg>`;
      
    case '《消失的終點線》': // 精緻化：龜與兔
      return `<svg ${baseProps}>
        <path d="M10 48 C 10 38, 20 32, 28 36 C 30 42, 24 50, 10 48 Z" fill="rgba(255,255,255,0.05)"/>
        <path d="M14 40 Q 20 36, 24 42" stroke-dasharray="2 2"/>
        <path d="M28 36 Q 34 36, 36 40 Q 32 44, 28 42" />
        <circle cx="32" cy="39" r="1" fill="currentColor"/>
        <path d="M46 36 C 40 36, 34 30, 38 24 C 42 18, 52 20, 54 26 C 56 32, 52 36, 46 36 Z" />
        <path d="M44 24 Q 36 10, 42 6 Q 48 16, 48 22" />
        <path d="M50 24 Q 52 10, 58 8 Q 60 16, 54 26" />
        <circle cx="44" cy="28" r="1.5" fill="currentColor"/>
        <path d="M54 30 Q 62 32, 60 38" />
        <path d="M38 32 Q 30 38, 24 30" stroke-dasharray="2 3"/>
      </svg>`;
      
    case '《糖裹屋》': // 精緻化：童話漩渦棒棒糖
      return `<svg ${baseProps}>
        <line x1="32" y1="44" x2="32" y2="62" stroke-width="4"/>
        <line x1="26" y1="44" x2="38" y2="44" />
        <path d="M32 46 C 20 40, 12 52, 26 54 L 32 46 L 38 54 C 52 52, 44 40, 32 46 Z" fill="rgba(255,255,255,0.1)"/>
        <circle cx="32" cy="24" r="18" fill="rgba(255,255,255,0.05)"/>
        <path d="M32 24 C 32 18, 26 18, 26 24 C 26 32, 38 32, 38 24 C 38 14, 20 14, 20 24 C 20 40, 44 40, 44 24 C 44 6, 14 6, 14 24" stroke-width="2"/>
      </svg>`;
      
    case '《灰燼》': // 精緻化：威尼斯面具與烈火
      return `<svg ${baseProps}>
        <path d="M32 54 C 12 54, 4 36, 14 20 C 20 10, 32 2, 32 2 C 32 2, 44 10, 50 20 C 60 36, 52 54, 32 54 Z" fill="rgba(255,255,255,0.05)" stroke-dasharray="4 3"/>
        <path d="M32 46 C 20 46, 16 32, 22 20 C 26 12, 32 8, 32 8 C 32 8, 38 12, 42 20 C 48 32, 44 46, 32 46 Z" />
        <path d="M12 28 C 12 18, 22 16, 32 22 C 42 16, 52 18, 52 28 C 52 38, 44 44, 32 40 C 20 44, 12 38, 12 28 Z" fill="#000" stroke="currentColor"/>
        <path d="M20 28 C 20 24, 26 24, 26 28 C 26 32, 20 32, 20 28 Z" fill="currentColor"/>
        <path d="M38 28 C 38 24, 44 24, 44 28 C 44 32, 38 32, 38 28 Z" fill="currentColor"/>
        <path d="M52 28 Q 58 24, 62 18" />
        <path d="M12 28 Q 6 24, 2 18" />
      </svg>`;
      
    case '《兩兄弟》': // 精緻化：解剖學心臟與貫穿之劍
      return `<svg ${baseProps}>
        <path d="M32 52 C 32 52, 14 38, 14 24 C 14 14, 24 10, 32 18 C 40 10, 50 14, 50 24 C 50 38, 32 52, 32 52 Z" fill="rgba(255,255,255,0.05)"/>
        <path d="M24 20 C 24 12, 26 6, 32 4" />
        <path d="M40 20 C 40 10, 36 6, 32 4" />
        <path d="M20 30 Q 28 36, 26 44" stroke-dasharray="2 2"/>
        <path d="M44 30 Q 36 36, 38 44" stroke-dasharray="2 2"/>
        <line x1="8" y1="56" x2="56" y2="8" stroke-width="3"/>
        <path d="M4 60 L 16 48 M 2 56 L 10 48" stroke-width="2"/>
        <circle cx="6" cy="58" r="2" fill="currentColor"/>
      </svg>`;
      
    case '《沉睡荊棘》': // 惡龍與蘋果
      return `<svg ${baseProps}>
        <path d="M32 22 C38 14 48 18 48 30 C48 42 40 48 32 46 C24 48 16 42 16 30 C16 18 26 14 32 22 Z" fill="rgba(255,255,255,0.05)"/>
        <path d="M32 22 Q32 10 38 8"/>
        <path d="M38 8 Q46 10 44 18 Q36 16 38 8 Z" fill="currentColor"/>
        <path d="M46 32 C 54 24, 60 28, 60 28 C 56 32, 62 36, 62 36 C 54 40, 46 38, 46 38" />
        <path d="M18 32 C 10 24, 4 28, 4 28 C 8 32, 2 36, 2 36 C 10 40, 18 38, 18 38" />
      </svg>`;
      
    case '《哈梅爾的吹笛手》': // 精緻化：黑死病老鼠
      return `<svg ${baseProps}>
        <path d="M14 46 C 4 46, 6 32, 12 24 C 18 16, 32 18, 40 24 C 48 30, 56 34, 56 42 C 56 48, 44 46, 32 46 Z" fill="rgba(255,255,255,0.05)"/>
        <path d="M56 42 L 62 42 L 56 46" /> <circle cx="48" cy="36" r="1.5" fill="currentColor"/>
        <path d="M40 24 C 40 14, 30 14, 32 22" />
        <path d="M32 22 C 26 12, 18 16, 24 26" />
        <path d="M14 42 C 4 42, 4 54, 14 58 C 24 62, 36 56, 44 52" stroke-dasharray="4 2"/>
        <line x1="56" y1="42" x2="64" y2="40" stroke-width="1"/>
        <line x1="54" y1="44" x2="62" y2="48" stroke-width="1"/>
      </svg>`;
      
    case '《寶石、烏鴉和水瓶》': // 精緻化：古典玻璃瓶與投石烏鴉
      return `<svg ${baseProps}>
        <path d="M26 62 L 38 62 L 42 40 C 46 30, 44 22, 38 22 L 26 22 C 20 22, 18 30, 22 40 Z" fill="rgba(255,255,255,0.05)"/>
        <path d="M26 22 V 12 H 38 V 22" />
        <ellipse cx="32" cy="12" rx="6" ry="2"/>
        <line x1="24" y1="48" x2="40" y2="48" stroke-dasharray="2 3"/>
        <path d="M26 12 C 18 4, 8 8, 4 18 C 0 28, 10 38, 16 38 C 22 38, 26 30, 28 22 Z" fill="currentColor"/>
        <path d="M26 12 L 36 6 L 28 8 Z" fill="currentColor"/>
        <polygon points="34,14 38,16 36,22 32,20" fill="currentColor"/>
        <line x1="34" y1="24" x2="34" y2="34" stroke-dasharray="2 2"/>
      </svg>`;
      
    case '《溫先生他一絲不掛》': // 皇家帝國皇冠
      return `<svg ${baseProps}>
        <path d="M10 48 Q32 54 54 48 Q56 52 52 54 Q32 58 12 54 Q8 52 10 48 Z" fill="rgba(255,255,255,0.1)"/>
        <path d="M22 51v1 M32 52v1 M42 51v1" stroke-width="1.5"/>
        <path d="M12 48 Q32 52 52 48 V40 Q32 44 12 40 Z"/>
        <circle cx="32" cy="45" r="2" fill="currentColor"/>
        <circle cx="20" cy="44" r="1.5"/><circle cx="44" cy="44" r="1.5"/>
        <path d="M14 40 Q32 20 50 40" fill="rgba(255,255,255,0.05)" stroke="currentColor" stroke-dasharray="2 3"/>
        <path d="M12 40 C12 24 26 22 32 22 C38 22 52 24 52 40"/>
        <path d="M22 41 C22 28 28 22 32 22 C36 22 42 28 42 41"/>
        <circle cx="32" cy="18" r="3"/>
        <path d="M32 15 V5 M27 9 H37"/>
      </svg>`;
      
    case '《影子吻了我》': // 精緻化：魔法魔導書與陰影觸手
      return `<svg ${baseProps}>
        <path d="M12 50 Q 6 40 12 30 T 20 10 M52 50 Q 58 40 52 30 T 44 10" stroke="rgba(255,255,255,0.3)" stroke-width="2" stroke-dasharray="4 4"/>
        <path d="M24 58 Q 16 64 8 56 M40 58 Q 48 64 56 56" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
        <path d="M32 54 L 14 48 L 14 22 L 32 28 Z" fill="rgba(255,255,255,0.05)"/>
        <path d="M32 54 L 50 48 L 50 22 L 32 28 Z" fill="rgba(255,255,255,0.05)"/>
        <path d="M14 22 C 14 22, 22 16, 32 28 C 42 16, 50 22, 50 22" />
        <path d="M14 28 C 14 28, 22 22, 32 34 C 42 22, 50 28, 50 28" />
        <path d="M14 34 C 14 34, 22 28, 32 40 C 42 28, 50 34, 50 34" />
        <path d="M14 40 C 14 40, 22 34, 32 46 C 42 34, 50 40, 50 40" />
        <path d="M14 48 C 14 48, 22 42, 32 54 C 42 42, 50 48, 50 48" />
        <line x1="32" y1="28" x2="32" y2="54" />
        <circle cx="23" cy="35" r="3" stroke-dasharray="1 2"/>
        <polygon points="41,32 44,38 38,38"/>
      </svg>`;
      
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