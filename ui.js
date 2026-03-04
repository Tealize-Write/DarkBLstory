/* ── UI ── */

// ── Ruler
function buildRuler(fillPct){
  const numStr = String(fillPct).replace('%','').trim();
  const pct = Math.min(100, Math.max(0, parseFloat(numStr)||0));
  const ticks = Array.from({length:TICK_COUNT+1},()=>'<span></span>').join('');
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
   AXIS MAX（動態計算各軸理論上限）
════════════════════════════════ */

// ── Flow
function startQuiz(){
  elIntro.classList.add('hidden');
  elResult.classList.add('hidden');
  elQuiz.classList.remove('hidden');
  elQuiz.classList.add('in');
  qi=0; AXES.forEach(k=>axesScore[k]=0);
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
let _twTimer = null;   // 目前打字機 interval
let _twDone  = false;  // 是否已完成

// ── Typewriter
function skipTypewriter(){
  if(_twTimer){ clearInterval(_twTimer); _twTimer=null; }
  _finishTypewriter();
}

// 打字機完成後的共同收尾
function _finishTypewriter(){
  _twDone = true;
  // 隱藏 skip 按鈕
  document.getElementById('skip-wrap').style.display='none';

  // 顯示題目完整文字
  const el = document.getElementById('qtext');
  const q  = questions[qi];
  el.textContent = q.text;

  // 顯示所有選項（依序淡入）
  const opts = document.getElementById('options');
  opts.innerHTML='';
  q.options.forEach((opt,i)=>{
    const btn=document.createElement('button');
    btn.className='opt';btn.type='button';
    btn.innerHTML=`<span class="bullet"></span><span class="txt">${opt.text}</span>`;
    btn.onclick=()=>pick(opt.add,btn);
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

  // 清空選項、顯示 skip
  document.getElementById('options').innerHTML='';
  el.textContent='';
  skipWrap.style.display='block';

  // 逐字打字機
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
  }, 38); // 每字間隔 38ms，約 1 秒打 26 字
}

// ── Pick / Restart
function pick(addObj,btn){
  // 清掉任何殘留打字機
  if(_twTimer){ clearInterval(_twTimer); _twTimer=null; }
  document.querySelectorAll('.opt').forEach(b=>b.disabled=true);
  btn.classList.add('selected');
  addAxisScores(addObj);
  setTimeout(()=>{ qi++; qi<questions.length?showQuestion():showResult(); },380);
}
function confirmRestart(){
  if(confirm('確定要重新開始？目前進度將清除。')){
    location.reload();
  }
}

/* ════════════════════════════════
   TOP AXES
════════════════════════════════ */

// ── Top axes
function renderMyTopAxes(){
  const el = document.getElementById('my-axes');
  if(!el) return;
  const axisMax = calcAxisMax();
  const axisLabel = {
    dom:'DOMINANCE', sub:'SUBMISSION', control:'CONTROL',
    manip:'SCHEME', chaos:'CHAOS', devotion:'DEVOTION'
  };
  const top3 = Object.entries(axesScore).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const rows = top3.map(([k,v])=>{
    const pct = axisMax[k] ? Math.round((v/axisMax[k])*100) : 0;
    return '<div class="seal">'
      + '<div class="lab">' + (axisLabel[k]||k) + '</div>'
      + buildRuler(pct+'%')
      + '<div class="val">' + v + '</div>'
      + '</div>';
  }).join('');
  el.innerHTML = '<div style="opacity:.9;letter-spacing:2px;font-style:italic;font-size:12px;margin-bottom:4px;">'
    + '✦ 你本次的深淵指紋（三大主軸）'
    + '</div>'
    + '<div class="seals">' + rows + '</div>';
  animateRulers(el);
}

/* ════════════════════════════════
   SHOW RESULT
════════════════════════════════ */

// ── showResult
function showResult(){
  elQuiz.classList.add('hidden');
  elIntro.classList.add('hidden');
  elResult.classList.remove('hidden');
  elResult.classList.remove('in');
  void elResult.offsetWidth;
  elResult.classList.add('in');
  const code=determineResultCode();
  _lastResultCode=code;
  const r=resultsData[code];
  if(!r){
    document.getElementById('pop-line').textContent='✦ 深淵暫時找不到你的檔案（結果資料缺漏）。';
    console.error('Missing resultsData for code:',code);
    return;
  }
  const label=(RESULT_META[code]&&RESULT_META[code].label)||code;
  document.getElementById('result-img').src=r.image;
  document.getElementById('r-name').textContent='「'+r.soulName+'」';
  document.getElementById('r-compound').textContent=label;
  document.getElementById('r-desc').textContent=r.soulDesc;
  document.getElementById('r-quote').textContent=r.quote;
  document.getElementById('r-guide').textContent=r.guide;
  document.getElementById('seals').innerHTML=
    '<div class="seal"><div class="lab">危險指數</div>'
    +buildRuler(r.dangerFill)+'<div class="val">'+r.danger+'</div></div>'
    +'<div class="seal"><div class="lab">'+r.attr+'</div>'
    +buildRuler(r.attrFill)+'<div class="val">'+r.attrVal+'</div></div>'
    +'<div class="seal"><div class="lab">逃脱機率</div>'
    +buildRuler(r.escape)+'<div class="val">'+r.escape+'</div></div>';
  animateRulers(document);
  const cta=document.getElementById('r-cta');
  cta.innerHTML='<a href="'+escapeAttr(r.link)+'" target="_blank" rel="noopener noreferrer">'
    +'<span>解鎖你的故事樣本：'+r.bookName+'</span></a>';
  renderMyTopAxes();
  sendStats(code);
  window.scrollTo({top:0,behavior:'smooth'});
}

/* ════════════════════════════════
   STATS（POST）
════════════════════════════════ */

// ── Utils
function escapeAttr(str){
  const s = String(str ?? '');
  return s.replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function copyResult(){
  const code=_lastResultCode||determineResultCode();
  const label=(RESULT_META[code]&&RESULT_META[code].label)||code;
  const name=document.getElementById('r-name').textContent||'';
  const desc=document.getElementById('r-desc').textContent||'';
  const quote=document.getElementById('r-quote').textContent||'';
  const text=`${name}\n類型：${label}\n${desc}\n\n「${quote}」`;
  navigator.clipboard.writeText(text)
    .then(()=>alert('已成功複製結果，快去和朋友分享你的黑暗特質吧！'))
    .catch(()=>alert('複製失敗，請手動複製'));
}