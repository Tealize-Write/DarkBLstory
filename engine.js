/* ── ENGINE ── */

// 1. 定義所有的屬性：直接使用攻受(dom, sub)與 10 項細分特質
const AXES = [
  'dom', 'sub',
  'opt', 'crp', 'frc', 'sed', 'cmp', 
  'grd', 'obs', 'pos', 'lsc', 'slc'
];

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
  for(const k in obj) {
    if(Object.prototype.hasOwnProperty.call(axesScore,k)) {
      axesScore[k]+=obj[k];
    }
  }
}

// ── Result logic
function determineResultCode(){
  // 1) 角色：比較 dom (攻) 與 sub (受)
  let role = (axesScore.dom > axesScore.sub) ? "A" : (axesScore.sub > axesScore.dom ? "R" : (Math.random() < 0.5 ? "A" : "R"));

  // 2) 找出 10 項特質中分數最高的一項
  const traits = ['opt', 'crp', 'frc', 'sed', 'cmp', 'grd', 'obs', 'pos', 'lsc', 'slc'];
  
  // 排序找出最高分的特質（同分時隨機，避免永遠偏向 opt）
  const scored = traits.map(t => ({ trait: t, score: axesScore[t] }))
                       .sort((a, b) => b.score - a.score);
  const maxScore = scored[0].score;
  const topCandidates = scored.filter(t => t.score === maxScore);
  const topTrait = topCandidates[Math.floor(Math.random() * topCandidates.length)].trait;

  return mapToResult(role, topTrait);
}

function mapToResult(role, topTrait){
  // ── A side (攻方) ──
  if(role === "A"){
    switch(topTrait) {
      case 'opt': return "A_DEVOTION_1"; // 樂觀：二哈黑龍攻
      case 'crp': return "A_CHAOS_1";    // 沉淪：無情獸群攻
      case 'frc': return "A_DEVOTION_2"; // 強勢：佔有囚禁攻
      case 'sed': return "A_CHAOS_2";    // 引誘：暴力黑獅攻
      case 'cmp': return "A_SCHEME_1";   // 共犯：腹黑勢利攻
      case 'grd': return "A_SCHEME_3";   // 守護：偏執瘋子攻
      case 'obs': return "A_CONTROL_1";  // 執著：陰鬱偏執攻
      case 'pos': return "A_SCHEME_2";   // 佔有：放蕩影子攻
      case 'lsc': return "A_CONTROL_2";  // 失控：黑化掠奪攻
      case 'slc': return "A_DEVOTION_3"; // 自制：病態攻
      default: return "A_CONTROL_1";
    }
  }

  // ── R side (受方) ──
  if(role === "R"){
    switch(topTrait) {
      case 'opt': return "R_CONTROL_1";  // 樂觀：陽光直男受
      case 'crp': return "R_DEVOTION_1"; // 沉淪：自願沈淪受
      case 'frc': return "A_CONTROL_3";  // 強勢：冰山白神攻 (受方測出強勢，反向分配給神攻)
      case 'sed': return "R_SCHEME_1";   // 引誘：卑劣淫蕩受
      case 'cmp': return "R_CHAOS_2";    // 共犯：自毀抹布受
      case 'grd': return "R_DEVOTION_2"; // 守護：人妻王子受
      case 'obs': return "R_SCHEME_2";   // 執著：廢物美人受
      case 'pos': return "R_CONTROL_2";  // 佔有：清冷自持受
      case 'lsc': return "R_CHAOS_1";    // 失控：斯德哥爾摩受
      case 'slc': return "R_CONTROL_3";  // 自制：禁慾學者受
      default: return "R_CONTROL_1";
    }
  }
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
   GLOBAL EXPORTS
════════════════════════════════ */
window.startQuiz      = startQuiz;
window.confirmRestart = confirmRestart;
window.skipTypewriter = skipTypewriter;
window.shareResultAsImage = typeof shareResultAsImage === 'function' ? shareResultAsImage : function(){};