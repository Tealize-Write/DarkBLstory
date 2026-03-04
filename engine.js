/* ── ENGINE ── */

// ── State
/* ════════════════════════════════
   STATE
════════════════════════════════ */
let qi=0;
let axesScore={};
let _lastResultCode=null;
AXES.forEach(k=>axesScore[k]=0);

const elIntro  = document.getElementById('intro');
const elQuiz   = document.getElementById('quiz');
const elResult = document.getElementById('result');
const elProgress = document.getElementById('progress');

/* ════════════════════════════════
   UI FLOW
════════════════════════════════ */

// ── Score
function addAxisScores(obj){
  for(const k in obj)
    if(Object.prototype.hasOwnProperty.call(axesScore,k)) axesScore[k]+=obj[k];
}

// ── Result logic
function determineResultCode(){
  const { dom, sub, control, manip, chaos, devotion } = axesScore;

  // 1) 角色：同分時隨機（12題架構已保證 dom/sub 平衡，不再硬偏攻）
  let role = (dom > sub) ? "A" : (sub > dom ? "R" : (Math.random() < 0.5 ? "A" : "R"));

  // 2) core 軸（四大，取最高）
  const core = [
    ["CONTROL",  control],
    ["SCHEME",   manip],
    ["CHAOS",    chaos],
    ["DEVOTION", devotion],
  ].sort((a,b) => b[1] - a[1]);

  const core1    = core[0][0];
  const core2    = core[1][0];
  const core1Val = core[0][1];

  // 3) 強度分段（12 題下 core 最大 12）
  //    0-4: LOW  5-8: MID  9-12: HIGH
  const tier = (core1Val >= 9) ? "HIGH" : (core1Val >= 5 ? "MID" : "LOW");

  return mapToResult(role, core1, core2, tier);
}

function mapToResult(role, core1, core2, tier){
  const tIdx = (tier === "HIGH") ? 2 : (tier === "MID" ? 1 : 0);

  // ── A side (11) ──────────────────────────────
  if(role === "A"){
    if(core1 === "CONTROL"){
      if(tIdx === 2) return "A_CONTROL_3";
      if(tIdx === 1) return (core2 === "SCHEME"   ? "A_CONTROL_2" : "A_CONTROL_1");
      return (core2 === "DEVOTION" ? "A_CONTROL_1" : "A_CONTROL_2");
    }
    if(core1 === "SCHEME"){
      if(tIdx === 2) return "A_SCHEME_3";
      if(tIdx === 1) return (core2 === "CONTROL"  ? "A_SCHEME_1" : "A_SCHEME_2");
      return (core2 === "CHAOS"    ? "A_SCHEME_2" : "A_SCHEME_1");
    }
    if(core1 === "CHAOS"){
      if(tIdx === 2) return "A_CHAOS_2";
      return (core2 === "SCHEME"   ? "A_CHAOS_1"  : "A_CHAOS_2");
    }
    if(core1 === "DEVOTION"){
      if(tIdx === 2) return (core2 === "SCHEME"   ? "A_DEVOTION_3" : "A_DEVOTION_2");
      if(tIdx === 1) return "A_DEVOTION_2";
      return "A_DEVOTION_1";
    }
    return "A_CONTROL_1";
  }

  // ── R side (9) ───────────────────────────────
  if(core1 === "CONTROL"){
    if(tIdx === 2) return "R_CONTROL_2";
    if(tIdx === 1) return (core2 === "CHAOS"    ? "R_CONTROL_3" : "R_CONTROL_1");
    return (core2 === "DEVOTION"  ? "R_CONTROL_1" : "R_CONTROL_3");
  }
  if(core1 === "SCHEME"){
    return (core2 === "CHAOS" || tIdx === 2) ? "R_SCHEME_1" : "R_SCHEME_2";
  }
  if(core1 === "CHAOS"){
    return (core2 === "DEVOTION" || tIdx === 2) ? "R_CHAOS_1" : "R_CHAOS_2";
  }
  if(core1 === "DEVOTION"){
    return (core2 === "CONTROL"  || tIdx === 2) ? "R_DEVOTION_2" : "R_DEVOTION_1";
  }
  return "R_CONTROL_1";
}
/* ════════════════════════════════
   SHARED RULER UTILITIES
════════════════════════════════ */
const TICK_COUNT = 10;

// ── Axis max
function calcAxisMax(){
  const max={};
  AXES.forEach(a=>max[a]=0);
  questions.forEach(q=>{
    AXES.forEach(a=>{
      let best=0;
      q.options.forEach(o=>{ best=Math.max(best,Number((o.add&&o.add[a])||0)); });
      max[a]+=best;
    });
  });
  return max;
}

/* ════════════════════════════════
   MY TOP AXES
════════════════════════════════ */

// ── Window exports
window.startQuiz      = startQuiz;
window.confirmRestart = confirmRestart;
window.skipTypewriter = skipTypewriter;
window.copyResult     = copyResult;
