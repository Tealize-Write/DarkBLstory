/* ── STATS ── */
function sendStats(code){
  const line  = document.getElementById('pop-line');
  const chart = document.getElementById('pop-chart');

  if(!GAS_URL || GAS_URL.includes("在此貼上")){
    line.textContent="✦ 尚未串接資料庫，僅顯示本地結果。";
    return;
  }

  fetch(GAS_URL, {
    method: "POST",
    body: JSON.stringify({ token: GAS_TOKEN, resultCode: code }),
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

  // 攻受統計（用 soulName 為主鍵）
  const counts = data.countsByKeyword || data.counts || {};

  const myKeyword = (resultsData[code] && resultsData[code].soulName) || code;
  const myCount   = Number(counts[myKeyword]||0);
  const myPct     = total > 0 ? Number(((myCount/total)*100).toFixed(1)) : 0;

  // 攻受比例行
  const rc    = data.roleCounts || {};
  const aNum  = Number(rc.A||0);
  const rNum  = Number(rc.R||0);
  const aPct  = total > 0 ? Math.round(aNum*1000/total)/10 : 0;
  const rPct  = total > 0 ? Math.round(rNum*1000/total)/10 : 0;

  line.innerHTML =
    '✦ 目前共有 <strong>'+total+'</strong> 個靈魂墮入深淵。'
    +'與你同類（'+myKeyword+'）約佔 <strong>'+myPct+'%</strong>。'
    +'<span style="opacity:.6;font-size:.85em;margin-left:10px;">'
    +'攻 '+aPct+'%　受 '+rPct+'%</span>';

  // Top 5 by keyword
  const items = Object.entries(counts)
    .map(([k,v])=>({k,v:Number(v)||0}))
    .sort((a,b)=>b.v-a.v)
    .slice(0,5);

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
    +'✦ 全站分佈（Top 5 結局樣本）'
    +'</div><div class="seals">'+rows+'</div>';

  animateRulers(chart);
}
