// 產生或讀取專屬裝置 ID
function getClientId() {
  let cid = localStorage.getItem('abyss_client_id');
  if (!cid) {
    cid = 'uid_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('abyss_client_id', cid);
  }
  return cid;
}

// ── 全域變數，預存玩家地點 (預設使用時區作為國家備案)
window.userLocationData = {
  country: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
  city: 'unknown'
};

// ── IP 地理位置（雙服務備援 + 超時保護）────────────────
// 預存 Promise，讓 sendStats 可以 await 同一個結果，不重複 fetch
window._locationReady = (async () => {
  // ✦ 修正 1：每次 race 都產生獨立計時器，避免 Promise 重複使用的問題
  const createTimeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const tryFetch = async (url, parse) => {
    const res  = await fetch(url);
    const data = await res.json();
    return parse(data);
  };

  try {
    const loc = await Promise.race([
      tryFetch('https://ipwho.is/', d =>
        d.success ? { country: d.country, city: d.city } : null
      ),
      createTimeout(1500)
    ]);
    if (loc && loc.city) {
      window.userLocationData.country = loc.country || window.userLocationData.country;
      window.userLocationData.city    = loc.city;
      return;
    }
  } catch (_) {}

  try {
    const loc = await Promise.race([
      tryFetch('https://freeipapi.com/api/json', d =>
        d.countryName ? { country: d.countryName, city: d.cityName } : null
      ),
      createTimeout(1500)
    ]);
    if (loc && loc.city) {
      window.userLocationData.country = loc.country || window.userLocationData.country;
      window.userLocationData.city    = loc.city;
    }
  } catch (_) {}
})();

// ── 輔助函數：打包擴充的分析數據 ──
function getTrackingPayload(code, actionType = "") {
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source') || 'direct';
  const isMobile  = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';

  let timeSpent = 0;
  if (typeof window.quizStartTime !== 'undefined' && window.quizStartTime > 0 && actionType === "") {
    timeSpent = Math.round((Date.now() - window.quizStartTime) / 1000);
  }

  return {
    token:      typeof GAS_TOKEN !== 'undefined' ? GAS_TOKEN : "",
    resultCode: code,
    action:     actionType,
    clientId:   getClientId(),
    source:     utmSource,
    referrer:   document.referrer || 'none',
    device:     isMobile,
    country:    window.userLocationData.country,
    city:       window.userLocationData.city,
    timeSpent:  timeSpent
  };
}

// ── 行為追蹤 (背景靜默發送) ──
function trackUserAction(code, actionType) {
  if (!GAS_URL || GAS_URL.includes("在此貼上")) return;
  fetch(GAS_URL, {
    method: "POST",
    body:   JSON.stringify(getTrackingPayload(code, actionType)),
  }).catch(() => {});
}

// ── 測驗結果統計 ──
// ✦ 修正 4：統一使用 async/await，移除 .then/.catch 混用
async function sendStats(code) {
  const line  = document.getElementById('pop-line');
  const chart = document.getElementById('pop-chart');

  if (!GAS_URL || GAS_URL.includes("在此貼上")) {
    line.textContent = "✦ 尚未串接資料庫，僅顯示本地結果。";
    return;
  }

  await window._locationReady;

  try {
    const r    = await fetch(GAS_URL, {
      method: "POST",
      body:   JSON.stringify(getTrackingPayload(code, "")),
    });
    const data = await r.json();
    if (!data || !data.ok) throw new Error(data?.error ?? "unknown");
    renderStats(data, code);
  } catch (_) {
    line.textContent = "✦ 數據讀取失敗，但黑森林已記住你的選擇。";
    chart.innerHTML  = "";
  }
}

// ── XSS 防護 ──
// ✦ 修正 3：補回 _esc，防止 API 回傳值被注入 HTML
function _esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, m =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])
  );
}

function renderStats(data, code) {
  const line  = document.getElementById('pop-line');
  const chart = document.getElementById('pop-chart');

  const total     = Number(data.total) || 0;
  const counts    = data.countsByKeyword || data.counts || {};
  const myKeyword = (resultsData[code] && resultsData[code].soulName) || code;
  const myCount   = Number(counts[myKeyword] || 0);
  const myPct     = total > 0 ? Number(((myCount / total) * 100).toFixed(1)) : 0;

  const sortedItems = Object.entries(counts)
    .map(([k, v]) => ({ k, v: Number(v) || 0 }))
    .sort((a, b) => b.v - a.v);

  // ✦ 修正 2：findIndex 找不到時回傳 -1，避免顯示「第 0 名」
  const myRankIndex = sortedItems.findIndex(item => item.k === myKeyword);
  const myRankText  = myRankIndex >= 0 ? String(myRankIndex + 1) : "尚未進榜";
  const totalTypes  = 20;

  const rarestItem = sortedItems.filter(i => i.v > 0).pop() || { k: "未知", v: 0 };
  const rarestPct  = total > 0 ? ((rarestItem.v / total) * 100).toFixed(1) : 0;

  const rc   = data.roleCounts || {};
  const aNum = Number(rc.A || 0);
  const rNum = Number(rc.R || 0);
  const aPct = total > 0 ? Math.round(aNum * 1000 / total) / 10 : 0;
  const rPct = total > 0 ? Math.round(rNum * 1000 / total) / 10 : 0;

  line.innerHTML =
    '✦ 目前共有 <strong>' + total + '</strong> 個靈魂墮入黑森林。<br/>'
    + '✦ 你的類型（' + _esc(myKeyword) + '）約佔 <strong>' + myPct + '%</strong>，全站人數排名第 <strong>' + myRankText + '</strong> / ' + totalTypes + '。<br/>'
    + '✦ 最稀有的極端樣本為「' + _esc(rarestItem.k) + '」 (僅 ' + rarestPct + '%)。<br/>'
    + '<span style="opacity:.6;font-size:.85em;display:inline-block;margin-top:6px;">'
    + '(黑森林陣營：攻 ' + aPct + '% ｜ 受 ' + rPct + '%)</span>';

  const items = sortedItems.slice(0, 5);
  const rows  = items.map(({ k, v }) => {
    const pct  = total > 0 ? (v / total) * 100 : 0;
    const isMe = (k === myKeyword);
    return '<div class="seal" style="' + (isMe ? 'border-color:rgba(255,255,255,.65);' : '') + '">'
      + '<div class="lab">' + (isMe ? '✦ ' : '') + _esc(k) + '</div>'
      + buildRuler(pct.toFixed(1) + '%')
      + '<div class="val">' + pct.toFixed(1) + '%</div></div>';
  }).join('');

  chart.innerHTML =
    '<div style="opacity:.9;letter-spacing:2px;font-style:italic;font-size:12px;margin-bottom:4px;margin-top:14px;">'
    + '✦ 全站最高頻樣本 (Top 5)'
    + '</div><div class="seals">' + rows + '</div>';

  animateRulers(chart);
}