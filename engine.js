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
let answerHistory=[]; // 每題記錄玩家選了哪一個 option index
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

const TRAITS = ['opt', 'crp', 'frc', 'sed', 'cmp', 'grd', 'obs', 'pos', 'lsc', 'slc'];

// 設定結算加成倍率 (沒寫到的特質預設為 1 倍)
const TRAIT_MULTIPLIER = {
  opt: 1.8, // 樂觀
  crp: 1.5, // 沉淪
  sed: 1.2, // 引誘
  frc: 1.2, // 強勢
  slc: 0.7  // 自制
};

// 全部回溯完仍同分時的保底順序
const TRAIT_FALLBACK_PRIORITY = ['opt', 'crp', 'sed', 'frc', 'obs', 'lsc', 'pos', 'slc', 'cmp', 'grd'];

function getAnswerAddByHistoryIndex(questionIndex){
  const optionIndex = answerHistory[questionIndex];
  if(optionIndex == null) return null;

  const q = questions[questionIndex];
  if(!q || !Array.isArray(q.options)) return null;

  const opt = q.options[optionIndex];
  return opt && opt.add ? opt.add : null;
}

function determineRoleDeterministic(){
  if(axesScore.dom > axesScore.sub) return "A";
  if(axesScore.sub > axesScore.dom) return "R";

  // 平手時：從最後一題往前找，第一個能分出 dom / sub 的作答決定陣營
  for(let i = answerHistory.length - 1; i >= 0; i--){
    const add = getAnswerAddByHistoryIndex(i);
    if(!add) continue;

    const dom = Number(add.dom || 0);
    const sub = Number(add.sub || 0);

    if(dom > sub) return "A";
    if(sub > dom) return "R";
  }

  // 理論上不太會發生，保底
  return "A";
}

function breakTraitTieDeterministic(candidates){
  // 複製一份候選名單，隨著回溯不斷縮小範圍
  let currentCandidates = [...candidates]; 

  for(let i = answerHistory.length - 1; i >= 0; i--){
    const add = getAnswerAddByHistoryIndex(i);
    if(!add) continue;

    let bestScore = -1;
    let winners = [];

    for(const trait of currentCandidates){
      const score = Number(add[trait] || 0);

      if(score > bestScore){
        bestScore = score;
        winners = [trait];
      }else if(score === bestScore){
        winners.push(trait);
      }
    }

    // 這一題有得分，且有分出勝負或縮小了範圍
    if(bestScore > 0){
      if(winners.length === 1){
        return winners[0]; // 成功決出唯一勝者
      } else {
        currentCandidates = winners; // 依然平手，但淘汰掉分數較低的特質
      }
    }
  }

  // 全部回溯完仍同分，才用固定優先序保底
  return TRAIT_FALLBACK_PRIORITY.find(trait => currentCandidates.includes(trait)) || currentCandidates[0];
}

// ── Result logic
function determineResultCode(){
  // 1) 攻受判定
  const role = determineRoleDeterministic();

  // 2) 找出 10 項特質中分數最高的一項 (這裡加上倍率加權)
  const scored = TRAITS.map(trait => {
    const mult = TRAIT_MULTIPLIER[trait] || 1;
    return {
      trait,
      score: Number(axesScore[trait] || 0) * mult
    };
  });

  const maxScore = Math.max(...scored.map(x => x.score));
  const topCandidates = scored
    .filter(x => x.score === maxScore)
    .map(x => x.trait);

  // 3) 若只有一個最高分，直接用；若有多個同分，走 deterministic tie-break
  const topTrait = (topCandidates.length === 1)
    ? topCandidates[0]
    : breakTraitTieDeterministic(topCandidates);

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
      case 'cmp': return "A_SCHEME_1";   // 共犯：腹黑謀略攻
      case 'grd': return "A_SCHEME_3";   // 守護：偏執瘋子攻
      case 'obs': return "A_CONTROL_1";  // 執著：陰鬱偏執攻
      case 'pos': return "A_SCHEME_2";   // 佔有：不羈影子攻
      case 'lsc': return "A_CONTROL_2";  // 失控：黑化掠奪攻
      case 'slc': return "A_DEVOTION_3"; // 自制：病態攻
      default: return "A_CONTROL_1";
    }
  }

  // ── R side (受方) ──
  if(role === "R"){
    switch(topTrait) {
      case 'opt': return "R_CONTROL_1";  // 樂觀：陽光直男受
      case 'crp': return "R_DEVOTION_1"; // 沉淪：自願沉淪受
      case 'frc': return "A_CONTROL_3";  // 強勢：冰山白神攻 (受方測出強勢，反向分配給神攻)
      case 'sed': return "R_SCHEME_1";   // 引誘：恣情魅惑受
      case 'cmp': return "R_CHAOS_2";    // 共犯：殉道自我奉獻受
      case 'grd': return "R_DEVOTION_2"; // 守護：人妻王子受
      case 'obs': return "R_SCHEME_2";   // 執著：隱忍美人受
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
// shareResultAsImage is defined and exported in ui.js