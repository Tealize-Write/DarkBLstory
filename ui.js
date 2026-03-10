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
   DYNAMIC EMBLEM SVGs (黑暗塔羅精緻專屬版)
════════════════════════════════ */
function getEmblemSVG(code) {
  const baseProps = 'viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';
  
  switch(code) {
    /* ══ 攻方對應 ══ */
    case 'A_CONTROL_1': // 烏鴉
      return `<svg ${baseProps}>
        <path d="M 16 48 L 48 48" stroke-dasharray="2 3"/>
        <path d="M 24 40 C 20 30, 16 24, 26 14 C 36 4, 46 12, 42 22 C 38 32, 44 40, 44 40 Z" fill="rgba(255,255,255,0.05)"/>
        <path d="M 42 22 Q 48 18, 52 20 L 56 18 L 46 26 Z" fill="currentColor"/>
        <path d="M 24 40 L 26 48 M 44 40 L 42 48" />
        <path d="M 26 14 C 20 18, 20 28, 26 32" stroke-dasharray="2 2"/>
        <circle cx="38" cy="18" r="1.5" fill="currentColor"/>
      </svg>`;
      
    case 'A_CONTROL_2': // 面具
      return `<svg ${baseProps}>
        <path d="M 32 54 C 12 54, 8 36, 16 20 C 22 10, 32 6, 32 6 C 32 6, 42 10, 48 20 C 56 36, 52 54, 32 54 Z" fill="rgba(255,255,255,0.03)" stroke-dasharray="4 2"/>
        <path d="M 32 46 C 20 46, 16 32, 22 20 C 26 12, 32 8, 32 8 C 32 8, 38 12, 42 20 C 48 32, 44 46, 32 46 Z" />
        <path d="M 20 28 Q 26 24, 28 30 Q 24 32, 20 28 Z" fill="currentColor"/>
        <path d="M 44 28 Q 38 24, 36 30 Q 40 32, 44 28 Z" fill="currentColor"/>
        <path d="M 32 8 V 16 M 32 54 V 60" />
      </svg>`;
      
    case 'A_CONTROL_3': // 鹿神
      return `<svg ${baseProps}>
        <path d="M 32 32 C 24 32, 20 42, 24 50 L 32 56 L 40 50 C 44 42, 40 32, 32 32 Z" fill="rgba(255,255,255,0.05)"/>
        <path d="M 32 32 Q 32 20, 20 12 M 26 22 L 14 18 M 22 16 L 16 6" />
        <path d="M 32 32 Q 32 20, 44 12 M 38 22 L 50 18 M 42 16 L 48 6" />
        <circle cx="32" cy="24" r="3" fill="currentColor"/>
        <path d="M 28 40 L 26 42 M 36 40 L 38 42" />
        <path d="M 32 56 V 62 M 32 50 L 32 52" />
      </svg>`;
      
    case 'A_SCHEME_1': // 烏龜
      return `<svg ${baseProps}>
        <circle cx="32" cy="32" r="18" fill="rgba(255,255,255,0.05)"/>
        <path d="M 32 14 Q 32 6, 32 6 M 32 50 Q 32 58, 32 58" />
        <path d="M 14 32 L 8 32 M 50 32 L 56 32" />
        <path d="M 20 20 L 14 14 M 44 44 L 50 50 M 44 20 L 50 14 M 20 44 L 14 50" />
        <polygon points="32,20 42,26 42,38 32,44 22,38 22,26" />
        <line x1="32" y1="20" x2="32" y2="44" stroke-dasharray="2 2"/>
      </svg>`;
      
    case 'A_SCHEME_2': // 書 (只有邊框)
      return `<svg ${baseProps}>
        <path d="M 32 46 C 24 42, 12 44, 8 48 V 16 C 12 12, 24 10, 32 14 C 40 10, 52 12, 56 16 V 48 C 52 44, 40 42, 32 46 Z" stroke-dasharray="3 3"/>
        <line x1="32" y1="14" x2="32" y2="46" stroke-dasharray="2 2"/>
        <path d="M 16 24 H 26 M 16 32 H 24 M 38 24 H 48 M 40 32 H 48" stroke-width="1"/>
        <path d="M 32 52 Q 32 58, 32 62" />
        <circle cx="32" cy="6" r="1.5" fill="currentColor"/>
      </svg>`;
      
    case 'A_SCHEME_3': // 眼鏡
      return `<svg ${baseProps}>
        <circle cx="20" cy="32" r="10" fill="rgba(255,255,255,0.03)"/>
        <circle cx="44" cy="32" r="10" fill="rgba(255,255,255,0.03)"/>
        <path d="M 30 32 Q 32 26, 34 32" />
        <path d="M 10 32 Q 6 32, 4 36 M 54 32 Q 58 32, 60 36" />
        <path d="M 20 28 Q 20 36, 20 36 M 44 28 Q 44 36, 44 36" stroke-dasharray="1 2"/>
        <path d="M 44 42 Q 44 54, 56 58" stroke-dasharray="2 3"/>
      </svg>`;
      
    case 'A_CHAOS_1': // 劍
      return `<svg ${baseProps}>
        <line x1="32" y1="12" x2="32" y2="52" stroke-width="2"/>
        <path d="M 28 16 L 32 8 L 36 16 Z" fill="currentColor" stroke="none"/>
        <line x1="20" y1="40" x2="44" y2="40" stroke-width="2"/>
        <circle cx="32" cy="40" r="3" fill="currentColor"/>
        <line x1="32" y1="40" x2="32" y2="56" stroke-width="3"/>
        <path d="M 16 20 L 24 28 M 48 20 L 40 28" stroke-dasharray="2 2"/>
      </svg>`;
      
    case 'A_CHAOS_2': // 獅子
      return `<svg ${baseProps}>
        <path d="M 32 16 C 44 16, 50 26, 46 38 C 42 50, 22 50, 18 38 C 14 26, 20 16, 32 16 Z" fill="rgba(255,255,255,0.05)"/>
        <path d="M 32 24 L 26 36 H 38 Z" />
        <path d="M 26 36 L 32 44 L 38 36" />
        <path d="M 24 28 L 28 30 M 40 28 L 36 30" />
        <path d="M 32 44 V 48" />
        <path d="M 18 20 L 14 14 M 46 20 L 50 14 M 14 36 L 8 36 M 50 36 L 56 36" stroke-dasharray="2 2"/>
      </svg>`;
      
    case 'A_DEVOTION_1': // 龍
      return `<svg ${baseProps}>
        <path d="M 32 14 C 52 14, 56 26, 50 42 C 44 56, 20 56, 14 42 C 8 28, 16 18, 26 18" />
        <path d="M 26 18 L 22 12 L 18 16 L 20 22 Z" fill="rgba(255,255,255,0.05)"/>
        <path d="M 36 14 L 38 8 M 48 20 L 54 16 M 50 36 L 58 36 M 38 52 L 42 58 M 22 52 L 18 58" />
        <circle cx="32" cy="34" r="6" stroke-dasharray="2 2"/>
      </svg>`;
      
    case 'A_DEVOTION_2': // 巫師斗篷
      return `<svg ${baseProps}>
        <path d="M 32 10 C 24 10, 20 20, 20 28 C 20 40, 12 50, 12 56 H 52 C 52 50, 44 40, 44 28 C 44 20, 40 10, 32 10 Z" fill="rgba(255,255,255,0.03)"/>
        <path d="M 32 10 C 28 10, 26 18, 26 24 C 26 28, 38 28, 38 24 C 38 18, 36 10, 32 10 Z" fill="#000" stroke="currentColor"/>
        <path d="M 26 36 C 26 46, 20 56, 20 56 M 38 36 C 38 46, 44 56, 44 56" />
        <circle cx="32" cy="36" r="2" fill="currentColor"/>
        <path d="M 32 38 V 56" stroke-dasharray="2 3"/>
      </svg>`;
      
    case 'A_DEVOTION_3': // 長笛
      return `<svg ${baseProps}>
        <line x1="8" y1="56" x2="56" y2="8" stroke-width="3"/>
        <path d="M 12 52 L 16 56" />
        <circle cx="44" cy="20" r="1.5" fill="currentColor"/>
        <circle cx="38" cy="26" r="1.5" fill="currentColor"/>
        <circle cx="32" cy="32" r="1.5" fill="currentColor"/>
        <circle cx="26" cy="38" r="1.5" fill="currentColor"/>
        <path d="M 24 20 Q 30 14, 38 18 Q 46 22, 52 16" stroke-dasharray="2 3"/>
        <path d="M 14 30 Q 20 24, 28 28 Q 36 32, 42 26" stroke-dasharray="1 3"/>
      </svg>`;

    /* ══ 受方對應 ══ */
    case 'R_CONTROL_1': // 棒球
      return `<svg ${baseProps}>
        <circle cx="32" cy="32" r="16" fill="rgba(255,255,255,0.05)"/>
        <path d="M 20 22 C 28 22, 32 16, 32 16 M 44 42 C 36 42, 32 48, 32 48" stroke-dasharray="2 2"/>
        <path d="M 20 22 C 20 30, 16 32, 16 32 M 44 42 C 44 34, 48 32, 48 32" stroke-dasharray="2 2"/>
        <path d="M 12 52 L 20 44 M 6 46 L 14 38 M 52 12 L 44 20 M 58 18 L 50 26" stroke-width="1"/>
      </svg>`;
      
    case 'R_CONTROL_2': // 酒杯
      return `<svg ${baseProps}>
        <path d="M 20 16 L 24 34 C 26 40, 38 40, 40 34 L 44 16 Z" fill="rgba(255,255,255,0.05)"/>
        <line x1="32" y1="40" x2="32" y2="56" />
        <line x1="22" y1="56" x2="42" y2="56" stroke-width="2"/>
        <path d="M 22 24 Q 32 28, 42 24" />
        <circle cx="32" cy="32" r="1.5" fill="currentColor"/>
        <path d="M 28 10 Q 32 4, 36 10" stroke-dasharray="2 2"/>
      </svg>`;
      
    case 'R_CONTROL_3': // 魔法書
      return `<svg ${baseProps}>
        <path d="M 16 18 H 48 L 44 50 H 12 Z" fill="rgba(255,255,255,0.03)"/>
        <path d="M 16 18 V 12 L 48 12 V 18" stroke-width="1"/>
        <path d="M 12 50 V 44 L 16 44" stroke-width="1"/>
        <circle cx="30" cy="34" r="6" stroke-dasharray="2 2"/>
        <path d="M 30 28 L 34 40 L 24 32 H 36 L 26 40 Z" fill="currentColor" stroke="none"/>
        <line x1="40" y1="24" x2="44" y2="24" />
        <line x1="38" y1="44" x2="42" y2="44" />
      </svg>`;
      
    case 'R_SCHEME_1': // 兔子
      return `<svg ${baseProps}>
        <path d="M 16 42 Q 18 32, 26 34 Q 30 38, 26 42 Z" fill="rgba(255,255,255,0.05)"/>
        <path d="M 24 34 Q 28 30, 30 32 Q 32 36, 28 38" />
        <path d="M 28 32 Q 24 20, 30 18 Q 32 24, 30 32 M 26 32 Q 22 24, 26 22 Q 28 26, 28 32" />
        <path d="M 16 42 Q 12 46, 8 42" />
        <circle cx="42" cy="24" r="8" stroke-dasharray="2 3"/>
        <path d="M 42 24 L 42 20 M 42 24 L 46 26" />
      </svg>`;
      
    case 'R_SCHEME_2': // 皇冠
      return `<svg ${baseProps}>
        <path d="M 16 48 L 12 24 L 24 36 L 32 16 L 40 36 L 52 24 L 48 48 Z" fill="rgba(255,255,255,0.05)"/>
        <line x1="18" y1="42" x2="46" y2="42" stroke-dasharray="2 2"/>
        <circle cx="12" cy="24" r="2" fill="currentColor"/>
        <circle cx="32" cy="16" r="3" fill="currentColor"/>
        <circle cx="52" cy="24" r="2" fill="currentColor"/>
        <path d="M 32 30 L 28 36 H 36 Z" />
        <line x1="14" y1="54" x2="50" y2="54" stroke-width="2"/>
      </svg>`;
      
    case 'R_CHAOS_1': // 老鼠
      return `<svg ${baseProps}>
        <path d="M 26 40 C 20 40, 14 30, 24 22 C 32 14, 42 20, 42 28 C 42 36, 34 40, 26 40 Z" fill="rgba(255,255,255,0.05)"/>
        <path d="M 42 28 L 50 30 L 44 34" />
        <path d="M 40 22 A 3 3 0 0 1 44 22" />
        <circle cx="44" cy="28" r="1.5" fill="currentColor"/>
        <path d="M 18 36 Q 8 42, 14 50 Q 22 58, 30 52" />
        <path d="M 26 40 L 26 46 M 34 38 L 34 44" stroke-width="1"/>
      </svg>`;
      
    case 'R_CHAOS_2': // 心臟(流血)
      return `<svg ${baseProps}>
        <path d="M 32 24 C 20 24, 16 36, 24 46 C 30 52, 32 56, 32 56 C 32 56, 34 52, 40 46 C 48 36, 44 24, 32 24 Z" fill="rgba(255,255,255,0.05)"/>
        <path d="M 28 24 V 14 C 28 10, 36 10, 36 14 V 24" />
        <path d="M 24 24 L 22 18 M 40 24 L 42 18" />
        <path d="M 32 56 L 32 62 M 26 48 L 26 56 M 38 48 L 38 52" stroke-dasharray="2 2" stroke-width="2"/>
      </svg>`;
      
    case 'R_DEVOTION_1': // 棒棒糖
      return `<svg ${baseProps}>
        <circle cx="32" cy="24" r="14" fill="rgba(255,255,255,0.05)"/>
        <path d="M 32 24 C 32 18, 26 18, 26 24 C 26 32, 38 32, 38 24 C 38 12, 18 12, 18 24" stroke-dasharray="4 2"/>
        <line x1="32" y1="38" x2="32" y2="60" stroke-width="2"/>
        <path d="M 24 42 Q 32 38, 40 42 Q 32 46, 24 42 Z" fill="currentColor"/>
        <path d="M 24 42 L 18 48 M 40 42 L 46 48" />
      </svg>`;
      
    case 'R_DEVOTION_2': // 蘋果
      return `<svg ${baseProps}>
        <path d="M 32 50 C 18 50, 18 30, 32 30 C 46 30, 46 50, 32 50 Z" fill="rgba(255,255,255,0.05)"/>
        <path d="M 32 30 Q 32 22, 38 20" />
        <path d="M 38 20 Q 42 22, 42 26 Q 38 26, 38 20 Z" fill="currentColor"/>
        <path d="M 32 50 Q 32 56, 32 60 M 26 48 L 26 54 M 38 48 L 38 52" stroke-dasharray="2 2"/>
      </svg>`;
      
    default:
      return `<svg ${baseProps}><circle cx="32" cy="32" r="16" fill="rgba(255,255,255,0.05)"/><path d="M32 8v48M8 32h48M20 20l24 24M20 44l24-24"/></svg>`;
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
        ${getEmblemSVG(code)}
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