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
   DYNAMIC EMBLEM SVGs (黑暗塔羅精緻具象版)
════════════════════════════════ */
function getEmblemSVG(code) {
  // 統一使用粗線條 (stroke-width="2") 營造純粹俐落的霓虹發光感
  const baseProps = 'viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  
  // 保留給特定圖案使用的星芒
  const sparkSmall = `<path d="M 12 8 Q 12 12 8 12 Q 12 12 12 16 Q 12 12 16 12 Q 12 12 12 8 Z" fill="currentColor" stroke="none"/>`;

  switch(code) {
    /* ══ 攻方對應 ══ */
    
    case 'A_CONTROL_1': // 烏鴉 (完整的鳥形，停駐在枯枝上)
      return `<svg ${baseProps}>
        <path d="M 8 54 Q 32 48 56 56" />
        <path d="M 44 51 L 50 58" />
        <path d="M 36 26 C 42 32 44 42 36 50 L 30 60 L 26 54 C 20 46 18 36 24 28" />
        <path d="M 36 26 C 30 20 24 20 24 28" />
        <path d="M 26 24 L 12 26 L 24 28 Z" fill="currentColor" stroke="none"/>
        <circle cx="28" cy="24" r="1.5" fill="currentColor" stroke="none"/>
        <path d="M 32 32 C 40 38 40 48 32 54 M 28 36 C 34 42 34 48 28 52" />
        <path d="M 32 52 L 30 56 M 38 50 L 36 54" />
      </svg>`;
      
    case 'A_CONTROL_2': // 面具
      return `<svg ${baseProps}>
        <path d="M 16 16 C 24 8 40 8 48 16" stroke-width="1" stroke-dasharray="2 3"/>
        <path d="M 32 58 L 12 36 C 8 26 14 16 24 16 C 28 16 32 20 32 20 C 32 20 36 16 40 16 C 50 16 56 26 52 36 Z" />
        <path d="M 20 28 Q 24 26 28 28 Q 24 30 20 28 Z" fill="currentColor"/>
        <path d="M 44 28 Q 40 26 36 28 Q 40 30 44 28 Z" fill="currentColor"/>
        <path d="M 24 36 Q 28 42 32 50 Q 36 42 40 36" />
        <line x1="24" y1="36" x2="24" y2="44" stroke-width="1"/>
        <line x1="40" y1="36" x2="40" y2="44" stroke-width="1"/>
        <path d="M 32 22 L 34 26 L 32 30 L 30 26 Z" fill="currentColor" stroke="none"/>
      </svg>`;
      
    case 'A_CONTROL_3': // 鹿神 (正臉、帥氣對稱的鹿角與五官)
      return `<svg ${baseProps}>
        <path d="M 26 28 L 38 28 L 34 46 Q 32 50 30 46 Z" />
        <path d="M 30 44 H 34 L 32 48 Z" fill="currentColor" stroke="none"/> 
        <path d="M 26 34 L 28 36 M 38 34 L 36 36" /> 
        <path d="M 26 28 Q 12 24 10 32 Q 18 32 24 32 M 38 28 Q 52 24 54 32 Q 46 32 40 32" />
        <path d="M 28 28 C 26 12 16 6 8 4 M 24 18 C 18 14 12 16 12 16 M 26 22 C 20 20 16 24 16 24" />
        <path d="M 36 28 C 38 12 48 6 56 4 M 40 18 C 46 14 52 16 52 16 M 38 22 C 44 20 48 24 48 24" />
      </svg>`;
      
    case 'A_SCHEME_1': // 烏龜 (具象的俯視海龜與龜殼幾何)
      return `<svg ${baseProps}>
        <ellipse cx="32" cy="32" rx="14" ry="18" /> 
        <path d="M 32 20 L 40 25 V 39 L 32 44 L 24 39 V 25 Z" />
        <path d="M 32 14 V 20 M 40 22 L 46 18 M 40 42 L 46 46 M 32 50 V 44 M 24 42 L 18 46 M 24 22 L 18 18" />
        <path d="M 28 12 Q 32 4 36 12 Z" />
        <path d="M 18 24 Q 8 20 12 32" /> <path d="M 46 24 Q 56 20 52 32" />
        <path d="M 22 46 Q 16 56 18 42" /> <path d="M 42 46 Q 48 56 46 42" />
      </svg>`;
      
    case 'A_SCHEME_2': // 書 (邊框)
      return `<svg ${baseProps}>
        <path d="M 12 12 L 20 20 M 52 12 L 44 20 M 12 52 L 20 44 M 52 52 L 44 44" stroke-width="1" stroke-dasharray="2 3"/>
        <path d="M 32 48 C 24 44 14 46 14 46 V 18 C 14 18 24 16 32 20 C 40 16 50 18 50 18 V 46 C 50 46 40 44 32 48 Z" />
        <path d="M 32 20 V 48" />
        <path d="M 18 24 C 24 22 28 24 32 26 M 46 24 C 40 22 36 24 32 26" stroke-width="1"/>
        <path d="M 18 32 C 24 30 28 32 32 34 M 46 32 C 40 30 36 32 32 34" stroke-width="1"/>
        <path d="M 32 48 L 36 56 L 32 54 L 28 56 Z" fill="currentColor"/>
        ${sparkSmall}
      </svg>`;
      
    case 'A_SCHEME_3': // 眼鏡 (無鍊子，現代高冷禁慾的半框/眉框眼鏡)
      return `<svg ${baseProps}>
        <g transform="translate(0, 4)">
          <path d="M 8 28 C 16 24 26 26 30 30 C 34 26 44 24 56 28 L 54 32 C 46 28 38 30 34 32 C 30 30 22 28 10 32 Z" fill="currentColor" stroke="none"/>
          <path d="M 10 32 C 10 44 28 44 30 30 M 54 32 C 54 44 36 44 34 30" />
          <path d="M 30 30 C 32 28 34 30 34 30" />
          <path d="M 8 28 L 4 16 M 56 28 L 60 16" />
          <path d="M 14 36 L 20 30 M 50 36 L 44 30" />
        </g>
      </svg>`;
      
    case 'A_CHAOS_1': // 劍
      return `<svg ${baseProps}>
        <circle cx="32" cy="32" r="20" stroke-width="1" stroke-dasharray="1 6"/>
        <path d="M 28 24 L 32 56 L 36 24 Z" />
        <line x1="32" y1="24" x2="32" y2="46" stroke-width="1"/>
        <path d="M 16 22 L 48 22 L 44 26 L 20 26 Z" fill="currentColor"/>
        <path d="M 16 22 Q 12 20 16 18 L 20 22 M 48 22 Q 52 20 48 18 L 44 22" />
        <path d="M 30 22 V 12 H 34 V 22 Z" />
        <path d="M 28 12 L 36 12 L 32 6 Z" fill="currentColor"/>
      </svg>`;
      
    case 'A_CHAOS_2': // 獅子 (全身霸氣坐姿獅，帥氣立體鬃毛)
      return `<svg ${baseProps}>
        <path d="M 28 8 C 36 8 42 16 42 26 C 42 36 34 44 26 44 C 18 44 14 36 16 26" />
        <path d="M 28 8 C 24 14 24 20 28 26 M 36 12 C 32 18 32 26 36 32 M 16 26 C 20 32 26 36 32 38" />
        <path d="M 20 18 L 12 20 L 12 24 L 18 26" />
        <path d="M 26 44 V 58 M 34 40 V 58" />
        <path d="M 22 58 H 28 M 30 58 H 36" /> 
        <path d="M 38 20 C 48 24 50 36 46 46 C 42 54 36 58 36 58" />
        <path d="M 46 42 C 54 42 58 32 54 26 C 52 24 50 26 52 28" />
      </svg>`;
      
    case 'A_DEVOTION_1': // 龍
      return `<svg ${baseProps}>
        <path d="M 32 10 C 44 10 54 20 54 32 C 54 44 44 54 32 54" stroke-width="1" stroke-dasharray="2 3"/>
        <path d="M 24 46 C 16 46 12 40 12 32 C 12 24 16 18 24 18 C 30 18 34 22 34 26 C 34 30 30 34 26 34 L 20 34" />
        <path d="M 20 19 L 26 10 M 24 21 L 32 14" stroke-width="1"/>
        <circle cx="20" cy="26" r="1.5" fill="currentColor" stroke="none"/>
        <path d="M 24 34 C 28 40 36 42 42 36 C 48 30 46 20 38 18" />
        <path d="M 12 32 L 8 30 M 14 40 L 10 42 M 20 45 L 18 49 M 28 46 L 28 50" stroke-width="1"/>
      </svg>`;
      
    case 'A_DEVOTION_2': // 巫師斗篷
      return `<svg ${baseProps}>
        <path d="M 20 54 C 20 30 44 30 44 54" stroke-width="1" stroke-dasharray="2 4"/>
        <path d="M 32 10 C 22 10 16 22 16 34 C 16 44 12 52 10 56 H 54 C 52 52 48 44 48 34 C 48 22 42 10 32 10 Z" />
        <path d="M 32 18 C 24 18 22 26 24 34 C 26 40 38 40 40 34 C 42 26 40 18 32 18 Z" fill="currentColor"/>
        <path d="M 32 42 L 34 46 L 38 48 L 34 50 L 32 54 L 30 50 L 26 48 L 30 46 Z" fill="currentColor" stroke="none"/>
        <path d="M 24 56 V 46 M 40 56 V 46 M 32 56 V 52" stroke-width="1"/>
      </svg>`;

      
    case 'A_DEVOTION_3': // 長笛 (極簡俐落的古典長笛)
      return `<svg ${baseProps}>
        <path d="M 10 14 L 14 10 L 54 50 L 50 54 Z" />
        <line x1="12" y1="12" x2="52" y2="52" />
        <path d="M 18 18 C 20 16 24 20 22 22 Z" fill="currentColor"/>
        <circle cx="28" cy="28" r="1.5" fill="currentColor" stroke="none"/>
        <circle cx="34" cy="34" r="1.5" fill="currentColor" stroke="none"/>
        <circle cx="40" cy="40" r="1.5" fill="currentColor" stroke="none"/>
        <circle cx="46" cy="46" r="1.5" fill="currentColor" stroke="none"/>
        <path d="M 12 32 C 16 26 24 28 28 22" stroke-dasharray="2 4" />
      </svg>`;

    /* ══ 受方對應 ══ */
    
    case 'R_CONTROL_1': // 棒球 (明顯的雙弧線與棒球縫線)
      return `<svg ${baseProps}>
        <circle cx="32" cy="32" r="20" /> 
        <path d="M 22 15 C 32 24 32 40 22 49" stroke-width="1.5"/>
        <path d="M 42 15 C 32 24 32 40 42 49" stroke-width="1.5"/>
        <path d="M 24 20 L 18 22 M 26 28 L 20 30 M 27 36 L 21 36 M 25 44 L 19 42" stroke-width="1.5"/>
        <path d="M 40 20 L 46 22 M 38 28 L 44 30 M 37 36 L 43 36 M 39 44 L 45 42" stroke-width="1.5"/>
      </svg>`;
      
    case 'R_CONTROL_2': // 酒杯 (精緻流暢的高腳杯)
      return `<svg ${baseProps}>
        <path d="M 20 16 C 20 36 32 44 32 44 C 32 44 44 36 44 16" />
        <path d="M 20 16 C 20 12 44 12 44 16 C 44 20 20 20 20 16" />
        <path d="M 21 28 C 28 32 36 24 43 28" />
        <path d="M 32 44 V 56" />
        <path d="M 24 56 C 24 54 40 54 40 56 Z" fill="currentColor"/>
        <path d="M 24 24 C 24 32 28 38 30 40" />
      </svg>`;
      
    case 'R_CONTROL_3': // 魔法書 (★ 完美保留參考圖 1 樣式，帶星芒)
      return `<svg ${baseProps}>
        <path d="M 32 44 L 16 38 V 22 L 32 28 L 48 22 V 38 Z" />
        <path d="M 16 22 Q 24 26 32 28 Q 40 26 48 22" />
        <path d="M 16 27 Q 24 31 32 33 Q 40 31 48 27" />
        <path d="M 16 32 Q 24 36 32 38 Q 40 36 48 32" />
        <line x1="32" y1="28" x2="32" y2="44" />
        <circle cx="24" cy="31" r="3" />
        <path d="M 40 28 L 43 33 H 37 Z" />
        <path d="M 22 14 Q 32 4 42 14" stroke-dasharray="2 4" stroke-width="1.5"/>
        <path d="M 22 52 Q 32 62 42 52" stroke-dasharray="2 4" stroke-width="1.5"/>
        ${sparkSmall}
      </svg>`;
      
    case 'R_SCHEME_1': // 兔子 (整隻完整的優雅坐姿兔，修長雙耳)
      return `<svg ${baseProps}>
        <path d="M 22 28 C 16 28 12 34 16 40 C 20 44 26 42 28 38" />
        <path d="M 22 28 C 20 16 26 10 32 20 C 34 24 30 28 26 30" />
        <path d="M 26 26 C 28 14 36 10 40 22 C 40 26 34 30 30 30" />
        <path d="M 28 32 C 36 30 48 36 48 48 C 48 54 40 56 32 56" />
        <path d="M 26 40 V 56 M 20 44 V 56" /> 
        <path d="M 44 48 C 40 44 34 48 34 54" /> 
        <circle cx="48" cy="44" r="4" fill="currentColor" stroke="none"/> 
        <path d="M 20 32 L 22 34 L 20 34" /> 
      </svg>`;
      
    case 'R_SCHEME_2': // 皇冠 (★ 完美保留參考圖 2 樣式，帶星芒)
      return `<svg ${baseProps}>
        <line x1="32" y1="17" x2="32" y2="7" />
        <line x1="28" y1="12" x2="36" y2="12" />
        <circle cx="32" cy="20" r="3" />
        <path d="M 18 44 C 18 20 46 20 46 44" />
        <line x1="32" y1="23" x2="32" y2="44" />
        <path d="M 18 44 Q 32 48 46 44" />
        <path d="M 14 48 Q 32 52 50 48" />
        <path d="M 24 45 C 24 28 40 28 40 45" stroke-dasharray="3 4" stroke-width="1.5"/>
        <circle cx="24" cy="46.5" r="1.5" fill="currentColor"/>
        <circle cx="40" cy="46.5" r="1.5" fill="currentColor"/>
      </svg>`;
      
    case 'R_CHAOS_1': // 老鼠 (俐落清晰的老鼠全身側影)
      return `<svg ${baseProps}>
        <path d="M 12 40 L 4 42 C 6 46 12 46 16 46" />
        <path d="M 12 40 C 16 32 26 30 36 34 C 46 38 48 46 44 48 H 16" />
        <path d="M 24 34 C 20 26 28 20 32 26 C 34 30 30 34 26 36" /> 
        <path d="M 44 46 C 54 46 60 40 56 34 C 52 28 48 32 50 36" />
      </svg>`;
      
    case 'R_CHAOS_2': // 心臟(流血) (帥氣的解剖心臟)
      return `<svg ${baseProps}>
        <path d="M 20 22 C 10 22 14 36 24 46 C 30 52 32 56 32 56 C 32 56 34 52 40 46 C 50 36 54 22 44 22 C 38 22 34 28 32 30 C 30 28 26 22 20 22 Z" />
        <path d="M 28 16 C 28 8 36 8 36 16 M 24 18 V 10" /> 
        <path d="M 32 56 L 30 60 A 2 2 0 0 0 34 60 Z" fill="currentColor" stroke="none"/>
        <path d="M 22 50 L 20 54 A 2 2 0 0 0 24 54 Z" fill="currentColor" stroke="none"/>
      </svg>`;
      
    case 'R_DEVOTION_1': // 棒棒糖 (帶有漸層半透層的童話漩渦)
      return `<svg ${baseProps}>
        <line x1="32" y1="44" x2="32" y2="62" stroke-width="4"/>
        <line x1="26" y1="44" x2="38" y2="44" />
        <path d="M32 46 C 20 40, 12 52, 26 54 L 32 46 L 38 54 C 52 52, 44 40, 32 46 Z" fill="rgba(255,255,255,0.1)"/>
        <circle cx="32" cy="24" r="18" fill="rgba(255,255,255,0.05)"/>
        <path d="M32 24 C 32 18, 26 18, 26 24 C 26 32, 38 32, 38 24 C 38 14, 20 14, 20 24 C 20 40, 44 40, 44 24 C 44 6, 14 6, 14 24" stroke-width="2"/>
      </svg>`;
      
    case 'R_DEVOTION_2': // 蘋果 (俐落蘋果與反光)
      return `<svg ${baseProps}>
        <path d="M 32 16 C 48 10 58 24 52 38 C 48 50 38 54 32 48 C 26 54 16 50 12 38 C 6 24 16 10 32 16 Z" />
        <path d="M 32 16 C 32 8 36 6 38 4" /> 
        <path d="M 36 12 C 46 8 52 14 46 20 C 40 20 34 16 36 12 Z" /> 
        <path d="M 20 28 C 18 36 22 44 28 48" /> 
      </svg>`;
      
    default:
      return `<svg ${baseProps}><circle cx="32" cy="32" r="16" /><path d="M 24 32 H 40 M 32 24 V 40"/></svg>`;
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