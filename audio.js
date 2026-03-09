/* ── AUDIO ── */
(function(){
  const bgm  = document.getElementById('bgm');
  const btn  = document.getElementById('audio-btn');

  bgm.volume = 0.45;

  // ── 動態定位：art-tr 永遠是 top:0 right:0，直接讀 offsetWidth ──
  // symbol viewBox 220×220，原始月亮圓心在 (60,160)
  // 鏡像後在 art-tr 座標：cx = 220-60 = 160，cy = 220-160 = 60
  // art-tr 貼視窗右上，所以：
  //   top  = art-tr.offsetHeight * (60/220)
  //   right = art-tr.offsetWidth * (60/220)   ← 從右邊數 (220-160)/220 = 60/220
  function positionBtn(){
    const artTr = document.querySelector('.art-tr');
    if(!artTr) return;
    const W  = artTr.offsetWidth;
    const H  = artTr.offsetHeight;
    const cy = H * (55/220);
    const cr = W * (54/220);   // 調小 → 往右
    const hw = (btn.offsetWidth  || 36) / 2;
    const hh = (btn.offsetHeight || 36) / 2;
    btn.style.top        = Math.round(cy - hh) + 'px';
    btn.style.right      = Math.round(cr - hw) + 'px';
    btn.style.left       = '';
    btn.style.visibility = 'visible';
  }

  // 頁面載入 + resize 都重新定位
  window.addEventListener('load',   positionBtn);
  window.addEventListener('resize', positionBtn);
  // 也在 DOMContentLoaded 先跑一次（圖形已在 DOM 中）
  document.addEventListener('DOMContentLoaded', positionBtn);

  // 同步按鈕狀態到實際播放狀態
  function syncBtn(){
    if(bgm.paused){
      btn.classList.add('muted');
      btn.setAttribute('aria-label','開啟音樂');
    } else {
      btn.classList.remove('muted');
      btn.setAttribute('aria-label','關閉音樂');
    }
  }

  // 嘗試播放，靜默失敗（autoplay policy）
  const playPromise = bgm.play();
  if(playPromise !== undefined){
    playPromise
      .then(()=>{ syncBtn(); })
      .catch(()=>{
        btn.classList.add('muted');
        const resumeOnInteract = ()=>{
          bgm.play().then(()=>{ syncBtn(); });
          document.removeEventListener('click',      resumeOnInteract);
          document.removeEventListener('touchstart', resumeOnInteract);
        };
        document.addEventListener('click',      resumeOnInteract);
        document.addEventListener('touchstart', resumeOnInteract);
      });
  }

  // nudge：進頁面 1.2 秒後，音符閃白光 + 提示文字出現
  window.addEventListener('load', ()=>{
    setTimeout(()=>{
      const hint     = document.getElementById('audio-hint');
      const artLayer = document.querySelector('.art-layer');
      const isMobile = window.innerWidth <= 768;

      // 定位提示文字：按鈕左側，往下多偏 14px
      if(hint){
        const btnRect = btn.getBoundingClientRect();
        hint.style.top   = Math.round(btnRect.top + btnRect.height/2 - 8 + 14) + 'px';
        hint.style.right = Math.round(window.innerWidth - btnRect.left + 10) + 'px';
        hint.classList.add('show');
      }

      // 音符同步發白光（不管靜音/播放狀態都閃一次）
      btn.classList.add('nudge');

      // 提示消失
      setTimeout(()=>{ btn.classList.remove('nudge'); }, 1600);
      setTimeout(()=>{
        if(hint) hint.classList.remove('show');
        // 手機：提示消失後才壓暗裝飾圖案
        if(artLayer) artLayer.classList.add('dim');
      }, 3200);

    }, 1200);
  });

  window.toggleAudio = function(){
    if(bgm.paused){
      bgm.play().then(()=>syncBtn());
    } else {
      bgm.pause();
      syncBtn();
    }
  };
})();