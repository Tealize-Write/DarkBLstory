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

  qi = 0;
  answerHistory = [];
  axesScore = {};
  AXES.forEach(k => axesScore[k] = 0);
  _lastResultCode = null;

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
function pick(optionIndex, addObj, btn){
  // 清掉任何殘留打字機
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

// ── Top axes
function renderMyTopAxes(){
  const el = document.getElementById('my-axes');
  if(!el) return;
  const axisMax = calcAxisMax();
  
  // 只列出 10 個核心特質對應的中文
  const axisLabel = {
    opt:'樂觀', crp:'沉淪', frc:'強勢', sed:'引誘', cmp:'共犯',
    grd:'守護', obs:'執著', pos:'佔有', lsc:'失控', slc:'自制'
  };

  // 定義要篩選的 10 個特質（排除 dom 和 sub）
  const validTraits = ['opt', 'crp', 'frc', 'sed', 'cmp', 'grd', 'obs', 'pos', 'lsc', 'slc'];

  // 先過濾出 10 個特質，再依分數由高到低排序，最後取出前三名
  const top3 = Object.entries(axesScore)
    .filter(([k, v]) => validTraits.includes(k))
    .sort((a,b)=>b[1]-a[1])
    .slice(0,3);

  const rows = top3.map(([k,v])=>{
    const pct = axisMax[k] ? Math.round((v/axisMax[k])*100) : 0;
    return '<div class="seal">'
      + '<div class="lab">' + (axisLabel[k]||k) + '</div>'
      + buildRuler(pct+'%')
      + '<div class="val">' + v + '</div>'
      + '</div>';
  }).join('');

  el.innerHTML = '<div style="opacity:.9;letter-spacing:2px;font-style:italic;font-size:12px;margin-bottom:4px;">'
    + '✦ 你本次的黑暗特質'
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
    document.getElementById('pop-line').textContent='✦ 黑森林暫時找不到你的檔案（結果資料缺漏）。';
    console.error('Missing resultsData for code:',code);
    return;
  }
  const label=(RESULT_META[code]&&RESULT_META[code].label)||code;
  document.getElementById('result-img').src=r.image;
  document.getElementById('r-name').textContent='「'+r.soulName+'」';
  document.getElementById('r-compound').textContent=label;
  document.getElementById('r-desc').textContent=r.soulDesc;
  const mbtiEl = document.getElementById('r-mbti');
  if(mbtiEl) mbtiEl.innerHTML = r.mbti ? `<span class="r-mbti-label">MBTI</span><strong>${r.mbti}</strong>` : '';
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
  // 加上 onclick="trackBookClick('代碼')" 來觸發背景追蹤
  const authorLine = r.bookAuthor ? '<span class="cta-author">'+r.bookAuthor+'</span>' : '';
  cta.innerHTML='<a href="'+escapeAttr(r.link)+'" target="_blank" rel="noopener noreferrer" onclick="trackBookClick(\''+code+'\')">'
    +'<span class="cta-book">解鎖你的故事樣本</span>'
    +'<span class="cta-title">'+r.bookName+'</span>'
    +authorLine
    +'</a>';
  renderCpBlock(code);
  renderMyTopAxes();
  sendStats(code);
  window.scrollTo({top:0,behavior:'smooth'});
}

/* ════════════════════════════════
   STATS（POST）
════════════════════════════════ */

// ── Utils

// ── 書籍點擊追蹤
function trackBookClick(code){
  trackUserAction(code, "book_click");
}
window.trackBookClick    = trackBookClick;
window.shareResultAsImage = shareResultAsImage;

function escapeAttr(str){
  const s = String(str ?? '');
  return s.replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ════════════════════════════════
   產生結果圖片與分享 (取代原本的 copyResult)
════════════════════════════════ */
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

  // Fix 2：凍結 .in 動畫終態，避免截圖時 opacity/transform 還在過渡中
  const animEls = [...targetEl.querySelectorAll('.in')];
  animEls.forEach(el => {
    el.style.animation = 'none';
    el.style.opacity   = '1';
    el.style.transform = 'translateY(0)';
    el.style.filter    = 'none';
  });

  // Fix 3：在底部插入網址戳記
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

  // Fix 4：傳入 width/height 確保完整截到整個 section（不只是視窗高度）
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

  // 無論成功失敗，都還原 DOM
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

  // 分享 / 複製 / 下載
  canvas.toBlob(async (blob) => {
    if(!blob){ alert("圖片轉檔失敗"); return; }

    const file    = new File([blob], 'dark_trait_result.png', { type: 'image/png' });
    // pointer:coarse = 觸控裝置（手機/平板），桌機是 pointer:fine
    const isTouchDevice = window.matchMedia('(pointer:coarse)').matches;
    const isMobile = isTouchDevice && navigator.canShare && navigator.canShare({ files: [file] });

    // ── 手機/平板：呼叫原生分享面板（IG / Line）──
    if(isMobile) {
      try {
        await navigator.share({
          title: '故事另有結局｜黑暗特質心理測驗',
          text : '歡迎前往黑森林，測試你的黑暗特質是什麼？',
          url  : SITE_URL,
          files: [file],
        });
      } catch(e) { /* 使用者取消 */ }
      return;
    }

    // ── 電腦版：先下載，同時嘗試複製到剪貼簿 ──
    // 下載作為主要保底，clipboard 成功時額外提示可直接貼上
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href     = objUrl;
    a.download = 'dark_trait_result.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objUrl), 1000);

    // 同時嘗試複製到剪貼簿（成功就額外顯示提示）
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
        // 剪貼簿被擋沒關係，下載已完成
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