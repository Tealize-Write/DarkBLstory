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
   CP 配對區塊
════════════════════════════════ */
function renderCpBlock(code){
  const r   = resultsData[code];
  const el  = document.getElementById('r-cp');
  if(!el) return;
  if(!r || !r.cp1){ el.innerHTML=''; return; }

  const mbtiLine = r.mbti
    ? `<div class="cp-mbti"><span class="cp-label">MBTI</span><strong>${r.mbti}</strong></div>`
    : '';

  const cp2Html = (r.cp2||[]).map(n=>`<span class="cp-alt">${n}</span>`)
                              .join('<span class="cp-sep">・</span>');

  el.innerHTML =
    `<div class="lab">靈魂配對</div>`
    + mbtiLine
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
    + '✦ 你本次的深淵指紋（核心特質）'
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
  // 加上 onclick="trackBookClick('代碼')" 來觸發背景追蹤
  cta.innerHTML='<a href="'+escapeAttr(r.link)+'" target="_blank" rel="noopener noreferrer" onclick="trackBookClick(\''+code+'\')">'
    +'<span>解鎖你的故事樣本：'+r.bookName+'</span></a>';
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
  const code = _lastResultCode || determineResultCode();
  const btn = document.querySelector('.btn.mini');
  const btnRow = document.querySelector('#result .btn-row'); // 抓取底部按鈕區塊
  const targetElement = document.getElementById('result');
  const originalText = btn.textContent;

  // 1. 發送追蹤紀錄給後端
  trackUserAction(code, "share_image");

  // 2. 按鈕狀態提示，避免使用者重複狂點
  btn.textContent = "生成專屬圖像中...";
  btn.disabled = true;

  // 3. 核心修復：暫時隱藏按鈕區塊，避免按鈕被截進去
  if(btnRow) btnRow.style.display = 'none';

  try {
    // 4. 核心修復：暫時將畫面滾動到最上方，保證 html2canvas 絕不截斷畫面
    const originalScrollY = window.scrollY;
    window.scrollTo(0, 0);

    // 5. 繪製圖片
    const canvas = await html2canvas(targetElement, {
      scale: window.devicePixelRatio || 2, // 自動適配手機視網膜螢幕，更清晰
      backgroundColor: "#000000",
      useCORS: true,
      allowTaint: false,
      logging: false,
      windowHeight: targetElement.scrollHeight // 強制讀取完整高度
    });

    // 繪製完成後，立刻恢復原始畫面狀態
    window.scrollTo(0, originalScrollY);
    if(btnRow) btnRow.style.display = 'flex';
    btn.textContent = originalText;
    btn.disabled = false;

    // 6. 將 Canvas 轉為 Blob 準備分享/下載
    canvas.toBlob(async (blob) => {
      if (!blob) throw new Error("Blob conversion failed");

      const file = new File([blob], 'dark_trait_result.png', { type: 'image/png' });
      let shared = false;

      // 判斷手機瀏覽器是否支援直接「呼叫原生分享面板 (IG/Line等)」
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: '故事另有結局｜黑暗特質心理測驗',
            text: '來看看你的故事結局是什麼？',
            files: [file]
          });
          shared = true;
        } catch (e) {
          console.log("分享被取消或瀏覽器安全阻擋");
        }
      }

      // 如果原生分享失敗（電腦版、Line內部瀏覽器、或被安全機制擋下），無縫切換為「自動下載」
      if (!shared) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dark_trait_result.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // 針對 iOS  Safari 偶爾連下載都不給的狀況，給予友善提示
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIOS) {
           alert("已嘗試為您下載圖片！\n（若沒有自動儲存，建議使用 Safari 開啟，或直接用手機截圖分享）");
        }
      }

    }, 'image/png');

  } catch (error) {
    console.error("圖片生成失敗:", error);
    alert("圖片生成失敗，請稍後再試。");
    // 確保出錯時也能恢復按鈕
    if(btnRow) btnRow.style.display = 'flex';
    btn.textContent = originalText;
    btn.disabled = false;
  }
}