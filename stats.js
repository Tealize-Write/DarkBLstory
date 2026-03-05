// 產生或讀取專屬裝置 ID
function getClientId() {
  let cid = localStorage.getItem('abyss_client_id');
  if (!cid) {
    cid = 'uid_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('abyss_client_id', cid);
  }
  return cid;
}

// ── 行為追蹤 (背景靜默發送) ──
function trackUserAction(code, actionType) {
  if (!GAS_URL || GAS_URL.includes("在此貼上")) return;
  fetch(GAS_URL, {
    method: "POST",
    body: JSON.stringify({ token: GAS_TOKEN, resultCode: code, action: actionType, clientId: getClientId() }),
  }).catch(() => { /* 靜默失敗 */ });
}

// ── 測驗結果統計 ──
function sendStats(code){
  const line  = document.getElementById('pop-line');
  const chart = document.getElementById('pop-chart');

  if(!GAS_URL || GAS_URL.includes("在此貼上")){
    line.textContent="✦ 尚未串接資料庫，僅顯示本地結果。";
    return;
  }

  fetch(GAS_URL, {
    method: "POST",
    body: JSON.stringify({ token: GAS_TOKEN, resultCode: code, clientId: getClientId() }), 
  })
  .then(r => r.json())
  .then(data => {
    if(!data || !data.ok) throw new Error(data && data.error ? data.error : "unknown");
    renderStats(data, code);
  })
  .catch(()=>{
    line.textContent="✦ 數據讀取失敗，但深淵已記住你的選擇。";
    chart.innerHTML="";
  });
}

function renderStats(data, code){
  const line  = document.getElementById('pop-line');
  const chart = document.getElementById('pop-chart');

  const total = Number(data.total)||0;

  // 攻受統計
  const counts = data.countsByKeyword || data.counts || {};
  const myKeyword = (resultsData[code] && resultsData[code].soulName) || code;
  const myCount   = Number(counts[myKeyword]||0);
  const myPct     = total > 0 ? Number(((myCount/total)*100).toFixed(1)) : 0;

  // 計算趣味數據：稀有度排行與最稀有樣本
  const sortedItems = Object.entries(counts)
    .map(([k,v])=>({k,v:Number(v)||0}))
    .sort((a,b)=>b.v-a.v); // 數量由多到少排序
  
  // 找出玩家的排名
  const myRank = sortedItems.findIndex(item => item.k === myKeyword) + 1;
  const totalTypes = Object.keys(counts).length || 20; // 總共有幾種結果
  
  // 找出最稀有的樣本 (倒數第一名，且數量大於0)
  const rarestItem = sortedItems.filter(i => i.v > 0).pop() || {k: "未知", v: 0};
  const rarestPct  = total > 0 ? ((rarestItem.v/total)*100).toFixed(1) : 0;

  // 攻受比例行
  const rc    = data.roleCounts || {};
  const aNum  = Number(rc.A||0);
  const rNum  = Number(rc.R||0);
  const aPct  = total > 0 ? Math.round(aNum*1000/total)/10 : 0;
  const rPct  = total > 0 ? Math.round(rNum*1000/total)/10 : 0;

  // 更新文案，加入稀有度與攻受比
  line.innerHTML =
    '✦ 目前共有 <strong>'+total+'</strong> 個靈魂墮入深淵。<br/>'
    +'✦ 你的類型（'+myKeyword+'）約佔 <strong>'+myPct+'%</strong>，稀有度排名第 <strong>'+myRank+'</strong> / '+totalTypes+'。<br/>'
    +'✦ 最稀有的極端樣本為「'+rarestItem.k+'」 (僅 '+rarestPct+'%)。<br/>'
    +'<span style="opacity:.6;font-size:.85em;display:inline-block;margin-top:6px;">'
    +'(深淵陣營：攻 '+aPct+'% ｜ 受 '+rPct+'%)</span>';

  // Top 5 by keyword (長條圖保持不變)
  const items = sortedItems.slice(0,5);

  const rows = items.map(({k,v})=>{
    const pct  = total>0?(v/total)*100:0;
    const isMe = (k===myKeyword);
    return '<div class="seal" style="'+(isMe?'border-color:rgba(255,255,255,.65);':'')+'">'
      +'<div class="lab">'+(isMe?'✦ ':'')+k+'</div>'
      +buildRuler(pct.toFixed(1)+'%')
      +'<div class="val">'+pct.toFixed(1)+'%</div></div>';
  }).join('');

  chart.innerHTML=
    '<div style="opacity:.9;letter-spacing:2px;font-style:italic;font-size:12px;margin-bottom:4px;margin-top:14px;">'
    +'✦ 全站最高頻樣本 (Top 5)'
    +'</div><div class="seals">'+rows+'</div>';

  animateRulers(chart);
}