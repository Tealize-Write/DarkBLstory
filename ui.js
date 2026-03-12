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
  const baseProps = 'viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
  
  const mysticCircle = `
    <circle cx="32" cy="32" r="30" stroke-width="0.5" stroke-dasharray="2 4"/>
    <circle cx="32" cy="32" r="26" stroke-width="1" stroke-opacity="0.3"/>
  `;

  switch(code) {
    case 'A_CONTROL_1': return `<svg ${baseProps}>${mysticCircle}<g stroke-width="2.5"><path d="M 8 54 Q 32 48 56 56" /><path d="M 44 51 L 50 58" /><path d="M 36 26 C 42 32 44 42 36 50 L 30 60 L 26 54 C 20 46 18 36 24 28" /><path d="M 36 26 C 30 20 24 20 24 28" /><path d="M 26 24 L 12 26 L 24 28 Z" fill="currentColor" stroke="none"/><circle cx="28" cy="24" r="1.5" fill="currentColor" stroke="none"/><path d="M 32 32 C 40 38 40 48 32 54 M 28 36 C 34 42 34 48 28 52" /><path d="M 32 52 L 30 56 M 38 50 L 36 54" /></g></svg>`;
    case 'A_CONTROL_2': return `<svg ${baseProps}>${mysticCircle}<g stroke-width="2.5"><path d="M 12 28 C 12 16 24 18 32 24 C 40 18 52 16 52 28 C 52 40 40 38 32 44 C 24 38 12 40 12 28 Z" /><path d="M 20 28 Q 24 24 28 28 Q 24 32 20 28 Z" stroke-width="1.5"/><path d="M 44 28 Q 40 24 36 28 Q 40 32 44 28 Z" stroke-width="1.5"/><path d="M 32 12 L 35 18 L 32 24 L 29 18 Z" fill="currentColor" stroke="none"/><circle cx="20" cy="28" r="1.5" fill="currentColor" stroke="none"/><circle cx="44" cy="28" r="1.5" fill="currentColor" stroke="none"/></g></svg>`;
    case 'A_CONTROL_3': return `<svg ${baseProps}>${mysticCircle}<g stroke-width="2.5"><path d="M 26 28 L 38 28 L 34 46 Q 32 50 30 46 Z" /><path d="M 30 44 H 34 L 32 48 Z" fill="currentColor" stroke="none"/><path d="M 26 34 L 28 36 M 38 34 L 36 36" /><path d="M 26 28 Q 12 24 10 32 Q 18 32 24 32 M 38 28 Q 52 24 54 32 Q 46 32 40 32" /><path d="M 28 28 C 26 12 16 6 8 4 M 24 18 C 18 14 12 16 12 16 M 26 22 C 20 20 16 24 16 24" /><path d="M 36 28 C 38 12 48 6 56 4 M 40 18 C 46 14 52 16 52 16 M 38 22 C 44 20 48 24 48 24" /></g></svg>`;
    case 'A_SCHEME_1': return `<svg ${baseProps}>${mysticCircle}<g stroke-width="2.5"><ellipse cx="32" cy="32" rx="14" ry="18" /><path d="M 32 20 L 40 25 V 39 L 32 44 L 24 39 V 25 Z" /><path d="M 32 14 V 20 M 40 22 L 46 18 M 40 42 L 46 46 M 32 50 V 44 M 24 42 L 18 46 M 24 22 L 18 18" /><path d="M 28 12 Q 32 4 36 12 Z" /><path d="M 18 24 Q 8 20 12 32" /><path d="M 46 24 Q 56 20 52 32" /><path d="M 22 46 Q 16 56 18 42" /><path d="M 42 46 Q 48 56 46 42" /></g></svg>`;
    case 'A_SCHEME_2': return `<svg ${baseProps}>${mysticCircle}<g stroke-width="2.5"><path d="M 16 10 V 46 C 16 53 20 54 26 54 H 44 V 10 Z" fill="var(--bg)" stroke="none" /><path d="M 22 10 H 16 V 46 C 16 53 20 54 26 54 H 44 V 50 H 26 C 23 50 22 48 22 46 Z" fill="var(--bg)" stroke="currentColor" /><rect x="22" y="10" width="22" height="36" fill="var(--bg)" stroke="currentColor" /><line x1="23" y1="48" x2="44" y2="48" stroke-width="1.5" /><path d="M 28 46 V 58 L 31 55 L 34 58 V 46 Z" fill="var(--bg)" stroke="currentColor" stroke-linejoin="miter" /><rect x="26" y="14" width="14" height="28" stroke-width="1.5" /><rect x="37" y="23" width="10" height="10" fill="var(--bg)" stroke="currentColor" /><rect x="41" y="26" width="3" height="4" rx="1.5" stroke-width="1.5" /><polygon points="33,16 41,28 33,40 25,28" fill="var(--bg)" stroke="currentColor" stroke-linejoin="miter" /><polygon points="33,21 37,28 33,35 29,28" stroke-width="1.5" stroke-linejoin="miter" /></g></svg>`;
    case 'A_SCHEME_3': return `<svg ${baseProps}>${mysticCircle}<g transform="translate(0, 4)" stroke-width="2.5"><path d="M 8 28 C 16 24 26 26 30 30 C 34 26 44 24 56 28 L 54 32 C 46 28 38 30 34 32 C 30 30 22 28 10 32 Z" fill="currentColor" stroke="none"/><path d="M 10 32 C 10 44 28 44 30 30 M 54 32 C 54 44 36 44 34 30" /><path d="M 30 30 C 32 28 34 30 34 30" /><path d="M 8 28 L 4 16 M 56 28 L 60 16" /><path d="M 14 36 L 20 30 M 50 36 L 44 30" /></g></svg>`;
    case 'A_CHAOS_1': return `<svg ${baseProps}>${mysticCircle}<g stroke-width="2.5"><path d="M 32 60 L 26 24 L 32 14 L 38 24 Z" /><line x1="32" y1="14" x2="32" y2="60" stroke-width="1.5"/><line x1="16" y1="24" x2="48" y2="24" /><line x1="22" y1="21" x2="42" y2="21" stroke-width="1.5"/><path d="M 30 21 V 10 H 34 V 21 Z" /><polygon points="32,4 35,8 32,12 29,8" fill="currentColor" stroke="none"/></g></svg>`;
    case 'A_CHAOS_2': return `<svg ${baseProps}>${mysticCircle}<g stroke-width="2.5"><path d="M 28 8 C 36 8 42 16 42 26 C 42 36 34 44 26 44 C 18 44 14 36 16 26" /><path d="M 28 8 C 24 14 24 20 28 26 M 36 12 C 32 18 32 26 36 32 M 16 26 C 20 32 26 36 32 38" /><path d="M 20 18 L 12 20 L 12 24 L 18 26" /><path d="M 26 44 V 58 M 34 40 V 58" /><path d="M 22 58 H 28 M 30 58 H 36" /><path d="M 38 20 C 48 24 50 36 46 46 C 42 54 36 58 36 58" /><path d="M 46 42 C 54 42 58 32 54 26 C 52 24 50 26 52 28" /></g></svg>`;
    case 'A_DEVOTION_1': return `<svg ${baseProps}>${mysticCircle}<g stroke-width="2.5"><path d="M 32 26 C 22 10, 58 -5, 48 -20 C 66 -5, 40 10, 44 22 Q 50 14, 54 12 Q 54 20, 50 26 Q 58 28, 60 32 Q 54 38, 48 38 Q 44 46, 42 50 Q 38 58, 32 60 Q 26 58, 22 50 Q 20 46, 16 38 Q 10 38, 4 32 Q 6 28, 14 26 Q 10 20, 10 12 Q 14 14, 20 22 C 24 10, -2 -5, 16 -20 C 6 -5, 42 10, 32 26 Z" fill="var(--bg)" stroke="currentColor" stroke-linejoin="round"/><polygon points="20,30 28,35 24,40" fill="currentColor" stroke="none"/><polygon points="44,30 36,35 40,40" fill="currentColor" stroke="none"/><polygon points="29,50 25,52 28,55" fill="currentColor" stroke="none"/><polygon points="35,50 39,52 36,55" fill="currentColor" stroke="none"/><path d="M 32 26 V 42" stroke-width="1.5"/><path d="M 28 40 L 32 46 L 36 40" stroke-width="1.5" fill="none" stroke-linecap="round"/></g></svg>`;
    case 'A_DEVOTION_2': return `<svg ${baseProps}>${mysticCircle}<g stroke-width="2.5"><path d="M 20 54 C 20 30 44 30 44 54" stroke-width="1.5" stroke-dasharray="2 4"/><path d="M 32 10 C 22 10 16 22 16 34 C 16 44 12 52 10 56 H 54 C 52 52 48 44 48 34 C 48 22 42 10 32 10 Z" /><path d="M 32 18 C 24 18 22 26 24 34 C 26 40 38 40 40 34 C 42 26 40 18 32 18 Z" fill="currentColor"/><path d="M 32 42 L 34 46 L 38 48 L 34 50 L 32 54 L 30 50 L 26 48 L 30 46 Z" fill="currentColor" stroke="none"/><path d="M 24 56 V 46 M 40 56 V 46 M 32 56 V 52" stroke-width="1.5"/></g></svg>`;
    case 'A_DEVOTION_3': return `<svg ${baseProps}>${mysticCircle}<g stroke-width="2.5"><line x1="12" y1="52" x2="52" y2="12" stroke-width="4" stroke-linecap="round"/><line x1="14" y1="50" x2="50" y2="14" stroke-width="1" stroke="var(--bg)"/><circle cx="24" cy="40" r="1.5" fill="var(--bg)" stroke="currentColor"/><circle cx="30" cy="34" r="1.5" fill="var(--bg)" stroke="currentColor"/><circle cx="36" cy="28" r="1.5" fill="var(--bg)" stroke="currentColor"/><circle cx="42" cy="22" r="1.5" fill="var(--bg)" stroke="currentColor"/><path d="M 46 18 L 50 14" stroke-width="3"/><circle cx="48" cy="16" r="1" fill="var(--bg)" stroke="none"/></g></svg>`;
    
    case 'R_CONTROL_1': return `<svg ${baseProps}>${mysticCircle}<g stroke-width="2.5"><circle cx="32" cy="32" r="20" /><path d="M 22 15 C 32 24 32 40 22 49" stroke-width="2"/><path d="M 42 15 C 32 24 32 40 42 49" stroke-width="2"/><path d="M 24 20 L 18 22 M 26 28 L 20 30 M 27 36 L 21 36 M 25 44 L 19 42" stroke-width="1.5"/><path d="M 40 20 L 46 22 M 38 28 L 44 30 M 37 36 L 43 36 M 39 44 L 45 42" stroke-width="1.5"/></g></svg>`;
    case 'R_CONTROL_2': return `<svg ${baseProps}>${mysticCircle}<g stroke-width="2.5"><path d="M 20 16 C 20 36 32 44 32 44 C 32 44 44 36 44 16" /><path d="M 20 16 C 20 12 44 12 44 16 C 44 20 20 20 20 16" /><path d="M 21 28 C 28 32 36 24 43 28" /><path d="M 32 44 V 56" /><path d="M 24 56 C 24 54 40 54 40 56 Z" fill="currentColor"/><path d="M 24 24 C 24 32 28 38 30 40" /></g></svg>`;
    case 'R_CONTROL_3': return `<svg ${baseProps}>${mysticCircle}<g stroke-width="2.5"><path d="M 16 40 V 46 C 16 46 24 44 32 48 C 40 44 48 46 48 46 V 40 C 48 40 40 38 32 42 C 24 38 16 40 16 40 Z" fill="var(--bg)" stroke="currentColor" stroke-linejoin="round"/><path d="M 16 43 C 24 41 32 45 32 45 M 48 43 C 40 41 32 45 32 45" stroke-width="1.5" /><line x1="32" y1="42" x2="32" y2="48" /><path d="M 38 38 V 53 L 40 50 L 42 53 V 39 Z" fill="var(--bg)" stroke="currentColor" stroke-linejoin="round" /><path d="M 32 42 C 24 38 16 40 16 40 V 16 C 16 16 24 14 32 18 C 40 14 48 16 48 16 V 40 C 48 40 40 38 32 42 Z" fill="var(--bg)" stroke="currentColor" stroke-linejoin="round" /><line x1="32" y1="18" x2="32" y2="42" /><path d="M 20 21 C 26 19 30 21 32 23" stroke-width="1.5"/><path d="M 20 37 C 26 35 30 37 32 39" stroke-width="1.5"/><path d="M 44 21 C 38 19 34 21 32 23" stroke-width="1.5"/><path d="M 44 37 C 38 35 34 37 32 39" stroke-width="1.5"/><circle cx="24" cy="29" r="3" stroke-width="1.5"/><circle cx="24" cy="29" r="1" fill="currentColor" stroke="none"/><polygon points="40,26 41,28 43,29 41,30 40,32 39,30 37,29 39,28" fill="currentColor" stroke="none"/><circle cx="32" cy="12" r="1.5" fill="currentColor" stroke="none"/></g></svg>`;
    case 'R_SCHEME_1': return `<svg ${baseProps}>${mysticCircle}<g stroke-width="2.5"><path d="M 22 28 C 16 28 12 34 16 40 C 20 44 26 42 28 38" /><path d="M 22 28 C 20 16 26 10 32 20 C 34 24 30 28 26 30" /><path d="M 26 26 C 28 14 36 10 40 22 C 40 26 34 30 30 30" /><path d="M 28 32 C 36 30 48 36 48 48 C 48 54 40 56 32 56" /><path d="M 26 40 V 56 M 20 44 V 56" /><path d="M 44 48 C 40 44 34 48 34 54" /><circle cx="48" cy="44" r="4" fill="currentColor" stroke="none"/><path d="M 20 32 L 22 34 L 20 34" /></g></svg>`;
    case 'R_SCHEME_2': return `<svg ${baseProps}>${mysticCircle}<g stroke-width="2.5" fill="none"><rect x="16" y="46" width="32" height="6" fill="currentColor" stroke="none" /><path d="M 16 46 C 10 30 20 24 32 24 C 44 24 54 30 48 46" /><path d="M 24 46 C 22 34 26 28 32 24" /><path d="M 40 46 C 42 34 38 28 32 24" /><path d="M 32 46 V 24" /><path d="M 32 24 V 16 M 28 12 L 36 12 M 32 8 V 16" stroke-width="3.5"/><polygon points="32,12 28,7 36,7" fill="currentColor" stroke="none" /><polygon points="32,12 28,17 36,17" fill="currentColor" stroke="none" /><polygon points="32,12 27,8 27,16" fill="currentColor" stroke="none" /><polygon points="32,12 37,8 37,16" fill="currentColor" stroke="none" /></g></svg>`;
    case 'R_CHAOS_1': return `<svg ${baseProps}>${mysticCircle}<g stroke-width="2.5"><path d="M 12 40 L 9 40 C 10 44 14 44 16 46" /><path d="M 12 40 C 16 32 26 30 36 34 C 46 38 48 46 44 48 H 16" /><path d="M 24 34 C 20 26 28 20 32 26 C 34 30 30 34 26 36" /><path d="M 44 46 C 54 46 60 40 56 34 C 52 28 48 32 50 36" /></g></svg>`;
    case 'R_CHAOS_2': return `<svg ${baseProps}>${mysticCircle}<g stroke-width="2.5"><path d="M 20 22 C 10 22 14 36 24 46 C 30 52 32 56 32 56 C 32 56 34 52 40 46 C 50 36 54 22 44 22 C 38 22 34 28 32 30 C 30 28 26 22 20 22 Z" /><path d="M 28 16 C 28 8 36 8 36 16 M 24 18 V 10" /><path d="M 32 56 L 30 60 A 2 2 0 0 0 34 60 Z" fill="currentColor" stroke="none"/><path d="M 22 50 L 20 54 A 2 2 0 0 0 24 54 Z" fill="currentColor" stroke="none"/></g></svg>`;
    case 'R_DEVOTION_1': return `<svg ${baseProps}>${mysticCircle}<g stroke-width="2.5"><line x1="32" y1="44" x2="32" y2="62" stroke-width="4"/><line x1="26" y1="44" x2="38" y2="44" /><path d="M32 46 C 20 40, 12 52, 26 54 L 32 46 L 38 54 C 52 52, 44 40, 32 46 Z" fill="rgba(255,255,255,0.1)"/><circle cx="32" cy="24" r="18" fill="rgba(255,255,255,0.05)"/><path d="M32 24 C 32 18, 26 18, 26 24 C 26 32, 38 32, 38 24 C 38 14, 20 14, 20 24 C 20 40, 44 40, 44 24 C 44 6, 14 6, 14 24" stroke-width="2.5"/></g></svg>`;
    case 'R_DEVOTION_2': return `<svg ${baseProps}>${mysticCircle}<g stroke-width="2.5"><path d="M 32 16 C 48 10 58 24 52 38 C 48 50 38 54 32 48 C 26 54 16 50 12 38 C 6 24 16 10 32 16 Z" /><path d="M 32 16 C 32 8 36 6 38 4" /><path d="M 36 12 C 46 8 52 14 46 20 C 40 20 34 16 36 12 Z" /><path d="M 20 28 C 18 36 22 44 28 48" /></g></svg>`;
    default: return `<svg ${baseProps}><circle cx="32" cy="32" r="16" /><path d="M 24 32 H 40 M 32 24 V 40"/></svg>`;
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
  
  const label = r.label || code;
  document.getElementById('result-img').src = r.image;
  document.getElementById('r-name').textContent = r.soulName;

  const eyebrow = document.querySelector('.r-eyebrow');
  if (eyebrow) {
    if (r.bookFairy) {
        eyebrow.textContent = `您是《${r.bookFairy}》中的 ──`;
    } else {
        eyebrow.textContent = `揭曉黑暗特質 ──`;
    }
  }

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
  if (typeof trackUserAction === 'function') {
    trackUserAction(code, "book_click");
  }
}
window.trackBookClick    = trackBookClick;
window.shareResultAsImage = shareResultAsImage;
window.shareShortImage    = shareShortImage;

function escapeAttr(str){
  const s = String(str ?? '');
  return s.replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ════════════════════════════════
   SHARE LONG IMAGE (解決長圖灰底問題)
════════════════════════════════ */
async function shareResultAsImage() {
  const code        = _lastResultCode || determineResultCode();
  const btn         = document.querySelector('.share-btn:not(.short-share)');
  const targetEl    = document.getElementById('result');
  const originalText = btn ? btn.textContent : '';
  const SITE_URL    = 'https://tealize-write.github.io/DarkBLstory/';

  if (typeof trackUserAction === 'function') {
      trackUserAction(code, "share_image");
  }
  if(btn){ btn.textContent = "生成專屬圖像中..."; btn.disabled = true; }
  
  // 隱藏所有按鈕列，讓長圖最下方保持乾淨
  const hideEls = targetEl.querySelectorAll('.btn-row, .share-divider');
  hideEls.forEach(el => el.style.display = 'none');

  // 加入 .capturing class，確保手機版 @media 也能觸發高反差文字
  targetEl.classList.add('capturing');

  // 強制寫入絕對純黑無灰底樣式，並把文字強制變白
  const captureStyle = document.createElement('style');
  captureStyle.id = 'capture-override-style';
  captureStyle.innerHTML = `
      #result.capturing {
          background-color: #000000 !important;
          background-image: none !important;
      }
      #result.capturing,
      #result.capturing .r-eyebrow,
      #result.capturing .r-compound,
      #result.capturing .r-name,
      #result.capturing .r-desc,
      #result.capturing .block .txt,
      #result.capturing .block .txt.muted,
      #result.capturing .block .lab,
      #result.capturing .seal .lab,
      #result.capturing .stats,
      #result.capturing .stats strong,
      #result.capturing .cp-label,
      #result.capturing .cp-name,
      #result.capturing .cp-alt,
      #result.capturing .cp-mbti,
      #result.capturing .val,
      #result.capturing #pop-line {
          color: #ffffff !important;
          opacity: 1 !important;
      }
      #result.capturing .seal-ruler-track { background: rgba(255,255,255,.2) !important; }
      #result.capturing .seal-ruler-fill { background: #ffffff !important; box-shadow: none !important; }
      #result.capturing .tarot-frame, 
      #result.capturing .block, 
      #result.capturing .cta a {
          background-color: transparent !important;
          background-image: none !important;
          box-shadow: none !important;
          border-color: rgba(255,255,255,0.3) !important;
      }
      #result.capturing .result-img {
          filter: none !important;
      }
  `;
  document.head.appendChild(captureStyle);

  const animEls = [...targetEl.querySelectorAll('.in')];
  animEls.forEach(el => {
    el.style.animation = 'none';
    el.style.opacity   = '1';
    el.style.transform = 'translateY(0)';
    el.style.filter    = 'none';
  });

  const bgColor = '#000000'; 
  const emblemEl = targetEl.querySelector('.tarot-emblem');
  const emblemEls = emblemEl ? emblemEl.querySelectorAll('[fill="var(--bg)"], [stroke="var(--bg)"]') : [];
  emblemEls.forEach(el => {
    if(el.getAttribute('fill') === 'var(--bg)')   el.setAttribute('fill',   bgColor);
    if(el.getAttribute('stroke') === 'var(--bg)') el.setAttribute('stroke', bgColor);
  });

  const stamp = document.createElement('div');
  stamp.id = '_share_stamp';
  stamp.style.cssText =
    'text-align:center;padding:24px 0 32px;' +
    'font-family:Georgia,serif;font-size:13px;letter-spacing:2px;' +
    'color:rgba(255,255,255,.8);' +
    'background-color:#000000;';
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
      backgroundColor: '#000000', 
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

  // 復原 DOM 狀態
  window.scrollTo(0, originalScrollY);
  animEls.forEach(el => {
    el.style.animation = '';
    el.style.opacity   = '';
    el.style.transform = '';
    el.style.filter    = '';
  });
  emblemEls.forEach(el => {
    if(el.getAttribute('fill')   === bgColor) el.setAttribute('fill',   'var(--bg)');
    if(el.getAttribute('stroke') === bgColor) el.setAttribute('stroke', 'var(--bg)');
  });
  
  const stampEl = document.getElementById('_share_stamp');
  if(stampEl) stampEl.remove();
  
  targetEl.classList.remove('capturing');
  const overrideStyle = document.getElementById('capture-override-style');
  if(overrideStyle) overrideStyle.remove();
  
  // 恢復被隱藏的按鈕
  hideEls.forEach(el => el.style.display = '');
  if(btn){ btn.textContent = originalText; btn.disabled = false; }

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
        if(btn){
          btn.textContent = '✦ 已下載＋複製到剪貼簿！';
          setTimeout(() => { btn.textContent = originalText; }, 2500);
        }
      } catch(e) {
        if(btn){
          btn.textContent = '✦ 圖片已下載！';
          setTimeout(() => { btn.textContent = originalText; }, 2500);
        }
      }
    } else {
      if(btn){
        btn.textContent = '✦ 圖片已下載！';
        setTimeout(() => { btn.textContent = originalText; }, 2500);
      }
    }
  }, 'image/png');
}

/* ════════════════════════════════
   SHARE SHORT IMAGE (動態置中防重疊)
════════════════════════════════ */
async function shareShortImage() {
  const code     = _lastResultCode || determineResultCode();
  const r        = resultsData[code];
  const SITE_URL = 'https://tealize-write.github.io/DarkBLstory/';
  if (!r) return;

  const btn = document.querySelector('.share-btn.short-share');
  const origText = btn ? btn.textContent : '';
  if (btn) { btn.textContent = '生成中…'; btn.disabled = true; }
  
  if (typeof trackUserAction === 'function') {
      trackUserAction(code, 'share_short');
  }

  const CW   = 1080;
  const CH   = 1350;

  const canvas = document.createElement('canvas');
  canvas.width  = CW;
  canvas.height = CH;
  const ctx = canvas.getContext('2d');

  function setShadow(blur = 6) {
    ctx.shadowColor   = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur    = blur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
  function clearShadow() {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur  = 0;
  }
  
  function drawDivider(yPos) {
    const divW = Math.round(CW * 0.6);
    const gradLine = ctx.createLinearGradient((CW - divW)/2, 0, (CW + divW)/2, 0);
    gradLine.addColorStop(0, 'rgba(255,255,255,0)');
    gradLine.addColorStop(0.5, 'rgba(255,255,255,0.4)');
    gradLine.addColorStop(1, 'rgba(255,255,255,0)');
    
    ctx.fillStyle = gradLine;
    ctx.fillRect((CW - divW)/2, yPos - 0.5, divW, 1.5);
    
    const dm = 8;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255,255,255,0.8)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(CW/2,      yPos - dm);
    ctx.lineTo(CW/2 + dm, yPos);
    ctx.lineTo(CW/2,      yPos + dm);
    ctx.lineTo(CW/2 - dm, yPos);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  
  function getWrappedLines(text, maxW) {
    let lines = [];
    let line = '';
    for (const ch of text) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = ch;
      } else { line = test; }
    }
    if (line) lines.push(line);
    return lines;
  }
  
  function fillWrapped(text, startY, maxW, lineH) {
    const lines = getWrappedLines(text, maxW);
    lines.forEach((l, i) => {
        ctx.fillText(l, CW / 2, startY + i * lineH);
    });
    return startY + lines.length * lineH;
  }
  
  async function loadImg(src) {
    const tryLoad = (useCORS) => new Promise((resolve) => {
      const img = new Image();
      if (useCORS) img.crossOrigin = 'anonymous';
      img.onload  = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src + (useCORS ? (src.includes('?') ? '&_c=1' : '?_c=1') : '');
    });
    const imgCORS = await tryLoad(true);
    if (imgCORS) return imgCORS;
    return tryLoad(false); 
  }

  // ════ 1. 全黑底 ════
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CW, CH);

  // ════ 2. 角色圖 (進一步縮小並上移，釋放超級多下方空間) ════
  const maxImgH = Math.round(CH * 0.35); // 高度極限壓縮至 35%
  let imgH = 0;
  let dy = 0; 
  try {
    const img = await loadImg(r.image);
    if(img) {
      const scale = Math.min((CW * 0.85) / img.naturalWidth, maxImgH / img.naturalHeight);
      const sw = Math.round(img.naturalWidth * scale);
      const sh = Math.round(img.naturalHeight * scale);
      const dx = (CW - sw) / 2;
      ctx.drawImage(img, dx, dy, sw, sh);
      imgH = sh;
    }
  } catch(e) {
    console.warn('圖片載入失敗', e);
  }

  // ════ 3. 圖片底部淡出漸層 ════
  if (imgH > 0) {
    const fadeStart = Math.max(0, imgH - Math.round(CW * 0.20)); 
    const fadeEnd = imgH + 2;
    const grad = ctx.createLinearGradient(0, fadeStart, 0, fadeEnd);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, fadeStart, CW, fadeEnd - fadeStart);
  }

  // ════ 4. 外框裝飾 (Tarot-style border) ════
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(30, 30, CW - 60, CH - 60);
  
  const cl = 24; 
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath(); ctx.moveTo(30, 30 + cl); ctx.lineTo(30, 30); ctx.lineTo(30 + cl, 30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(CW - 30 - cl, 30); ctx.lineTo(CW - 30, 30); ctx.lineTo(CW - 30, 30 + cl); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(30, CH - 30 - cl); ctx.lineTo(30, CH - 30); ctx.lineTo(30 + cl, CH - 30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(CW - 30 - cl, CH - 30); ctx.lineTo(CW - 30, CH - 30); ctx.lineTo(CW - 30, CH - 30 - cl); ctx.stroke();

  // ════ 5. 上方文字區 (緊湊化以保留台詞空間) ════
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  
  let y = imgH + Math.round(CW * 0.04);

  // ── 稱號：您是《xxx》中的 ──
  ctx.font      = `300 ${Math.round(CW * 0.030)}px "Noto Serif TC", serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  setShadow(8);
  const eyebrowText = r.bookFairy ? `您是《${r.bookFairy}》中的 ──` : `揭曉黑暗特質 ──`;
  ctx.fillText(eyebrowText, CW / 2, y);
  clearShadow();
  
  y += Math.round(CW * 0.050);

  // ── 靈魂名稱 (soulName)
  ctx.font      = `700 ${Math.round(CW * 0.056)}px "Noto Serif TC", serif`;
  ctx.fillStyle = '#ffffff';
  setShadow(12);
  ctx.fillText(r.soulName, CW / 2, y);
  clearShadow();
  
  y += Math.round(CW * 0.065);

  // ── label (一句話描述)
  ctx.font      = `500 ${Math.round(CW * 0.040)}px "Noto Serif TC", serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  y = fillWrapped(r.label || code, y, CW * 0.85, Math.round(CW * 0.058));
  
  y += Math.round(CW * 0.050);

  // ── 菱形分隔線 1
  drawDivider(y);
  y += Math.round(CW * 0.060);

  // ════ 6. 印記 & 黑暗特質 (單排 4 欄配置) ════
  const axisMax = typeof calcAxisMax === 'function' ? calcAxisMax() : {};
  const axisLabel = { opt:'樂觀', crp:'沉淪', frc:'強勢', sed:'引誘', cmp:'共犯', grd:'守護', obs:'執著', pos:'佔有', lsc:'失控', slc:'自制' };
  const validTraits = ['opt', 'crp', 'frc', 'sed', 'cmp', 'grd', 'obs', 'pos', 'lsc', 'slc'];
  const currentScores = typeof axesScore !== 'undefined' ? axesScore : {};
  
  const top2 = Object.entries(currentScores)
    .filter(([k]) => validTraits.includes(k))
    .sort((a,b)=>b[1]-a[1])
    .slice(0,2);

  const darkTraits = top2.map(([k,v]) => ({
    lab: axisLabel[k] || k,
    val: String(v),
    pct: axisMax[k] ? Math.round((v / axisMax[k]) * 100) : 0
  }));

  const seals = [
    { lab: r.attr,     val: r.attrVal,  pct: parseFloat(r.attrFill)   || 0 },
    { lab: '逃脱機率', val: r.escape,   pct: parseFloat(r.escape)     || 0 },
    ...darkTraits
  ];

  const sealW   = Math.round(CW * 0.20); 
  const sealGap = Math.round(CW * 0.04);
  const totalW  = (sealW * 4) + (sealGap * 3);
  const sealX0  = (CW - totalW) / 2;
  const barH    = 3; 
  const barW    = sealW - 20;

  seals.forEach((s, i) => {
    const sx = sealX0 + (i * (sealW + sealGap));
    const sy = y;
    const cx = sx + (sealW / 2);

    ctx.font      = `400 ${Math.round(CW * 0.024)}px "Noto Serif TC", serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.60)';
    ctx.textAlign = 'center';
    setShadow(6);
    ctx.fillText(s.lab, cx, sy);
    clearShadow();

    const barY = sy + Math.round(CW * 0.035);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(sx + 10, barY, barW, barH);

    const fillW = Math.round(barW * Math.min(s.pct, 100) / 100);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.shadowColor = 'rgba(255,255,255,0.5)';
    ctx.shadowBlur = 4;
    ctx.fillRect(sx + 10, barY, fillW, barH);
    ctx.shadowBlur = 0;

    ctx.font      = `700 ${Math.round(CW * 0.030)}px "Noto Serif TC", serif`;
    ctx.fillStyle = '#ffffff';
    setShadow(6);
    ctx.fillText(s.val, cx, barY + Math.round(CW * 0.025));
    clearShadow();
  });

  y += Math.round(CW * 0.10); 

  // ── 菱形分隔線 2
  drawDivider(y);
  const divider2Y = y; // 台詞區絕對置中的頂部起始點

  // ════ 7. 底部資訊 (由底部定錨推算) ════
  const bottomMargin = Math.round(CW * 0.040); 
  const bottomUrlY = CH - bottomMargin; 
  const bottomTitleY = bottomUrlY - Math.round(CW * 0.065); // 底部標題高度

  // ── 《故事另有結局》✦ bookName
  ctx.font      = `500 ${Math.round(CW * 0.038)}px "Noto Serif TC", serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  setShadow(8);
  ctx.fillText(`《故事另有結局》✦ ${r.bookName}`, CW / 2, bottomTitleY);
  clearShadow();

  // ── 網址
  ctx.font         = `300 ${Math.round(CW * 0.022)}px Georgia, serif`;
  ctx.fillStyle    = 'rgba(255,255,255,0.30)';
  ctx.fillText('✦  ' + SITE_URL + '  ✦', CW / 2, bottomUrlY);


  // ════ 8. 專屬台詞 (無敵防壓到演算，自動絕對置中) ════
  ctx.font       = `italic 300 ${Math.round(CW * 0.034)}px "Noto Serif TC", serif`;
  ctx.fillStyle  = 'rgba(255,255,255,0.75)';
  ctx.textBaseline = 'top';

  const quoteMaxW = Math.round(CW * 0.82);
  const quoteLineH = Math.round(CW * 0.052);
  const quoteLines = getWrappedLines(r.quote || '', quoteMaxW);
  const quoteTotalH = quoteLines.length * quoteLineH;

  // 動態尋找剩餘空間的絕對中心點：(第二條線底部 ~ 大標題頂部)
  const spaceTop = divider2Y + 20; 
  const spaceBottom = bottomTitleY - Math.round(CW * 0.04); // 預留安全距離
  
  // 置中算式
  let quoteStartY = spaceTop + (spaceBottom - spaceTop - quoteTotalH) / 2;
  
  // 保底機制：絕對不會重疊
  if (quoteStartY < spaceTop) {
      quoteStartY = spaceTop;
  }

  setShadow(8);
  quoteLines.forEach((l, i) => {
      ctx.fillText(l, CW / 2, quoteStartY + i * quoteLineH);
  });
  clearShadow();


  // ════ 9. 輸出 ════
  const restore = () => { if (btn) { btn.textContent = origText; btn.disabled = false; } };

  const doSaveShort = (blob) => {
    const file = new File([blob], 'dark_result_short.png', { type: 'image/png' });
    const isMobile = window.matchMedia('(pointer:coarse)').matches
                  && navigator.canShare && navigator.canShare({ files: [file] });
    if (isMobile) {
      navigator.share({ files: [file], title: '我的黑暗特質', url: SITE_URL })
        .catch(() => {})
        .finally(() => restore());
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'dark_result_short.png';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (btn) { btn.textContent = '✦ 短圖已下載！'; setTimeout(() => restore(), 2500); }
  };

  try {
    await new Promise((resolve, reject) => {
      try {
        canvas.toBlob((blob) => {
          if (blob) { doSaveShort(blob); resolve(); }
          else reject(new Error('toBlob returned null'));
        }, 'image/png');
      } catch(e) { reject(e); }
    });
  } catch(e) {
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const arr  = dataUrl.split(',');
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8 = new Uint8Array(n);
      while(n--){ u8[n] = bstr.charCodeAt(n); }
      doSaveShort(new Blob([u8], { type: 'image/png' }));
    } catch(e2) {
      alert('無法下載，請使用截圖功能儲存！');
      restore();
    }
  }
}