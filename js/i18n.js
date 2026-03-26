/* ══════════════════════════════════════
   i18n.js — 多語系翻譯字典
   新增語言：在此檔新增一個 key，HTML 加 data-i18n 即可
   ══════════════════════════════════════ */
"use strict";

window.i18nData = {
  zh: {
    "nav-home": "奇想基地", "nav-sc": "字命覺醒", "nav-lag": "咬了神一口", "nav-soil": "穿越者種土裡", "nav-game": "反轉的真實",
    "cat-novel": '<i class="fa-solid fa-book-open"></i> NOVELS | 小說區',
    "cat-novel-short": "NOVELS",
    "cat-game": '<i class="fa-solid fa-gamepad"></i> GAMES | 遊戲區',
    "cat-game-short": "GAMES",
    "tag-capricorn": "魔羯座", "tag-gamemaker": "遊戲 Maker", "tag-art": "繪圖", "tag-creator": "奇幻創作者",

    "sc-title": "NOVEL: 字命覺醒",
    "sc-quote": "「因為是文閉所以會贏。」「冠軍是我們的，你們加油吧。」",
    "sc-sys": "[系統提示] 偵測到高濃度迷因與校園奇幻反應，創作即魔法。",
    "sc-vol1": "VOL.1 小心字穢",
    "sc-vol2": "VOL.2 字者互毆",
    "sc-side": "序曲：北車地下城守則",
    "sc-quiz-title": "🧪 創作者屬性鑑定 (心理測驗)",
    "sc-quiz-btn": '開始測驗 <i class="fa-solid fa-wand-magic-sparkles"></i>',

    "lag-title": "NOVEL: 《咬了神一口》",
    "lag-quote": "「改編自美女與野獸。山上有座不能亂碰的莊園，摘花要付出代價，說謊也有代價。」",
    "lag-subtitle": "A Bite of God &nbsp;·&nbsp; Beauty &amp; the Beast retelling",
    "lag-desc": "山上有座不能亂碰的莊園。<br>摘花要付出代價，說謊也有代價。<br>黎昂只是想把弟弟帶回家。<br>但他從來不是會乖乖服從規則的獅子。<br>於是，他咬了神一口。<br>或許還不只一口。",
    "lag-purchase": '<i class="fa-solid fa-globe"></i> 前往官網',
    "lag-afterword-btn": '<i class="fa-solid fa-scroll"></i> 閱讀後記',
    "lag-quiz-btn": '測測你的黑暗特質 <i class="fa-solid fa-arrow-right"></i>',

    "soil-title": "NOVEL：REVISING (修文施工中)",
    "soil-read": "點擊閱讀",
    "soil-booktitle": "是誰把穿越者種在土裡",
    "soil-sys": "[系統提示] 恐龍注意！",
    "soil-quote": "「17歲的蘇海躍選擇結束生命，卻在陌生山林的泥土裡被挖了出來。」",
    "soil-desc": "一個人類分為 ABO、幽靈依附費洛蒙、恐龍遊蕩於街頭的瘋狂世界。蘇海躍在這個怪異卻溫暖的日常中，遇見了蒼白如鬼的 Alpha 陸翎邑。新聞上另一個「完美的蘇海躍」失蹤案，揭開了橫跨兩個世界的巨大陰謀。",
    "soil-link": '<i class="fa-solid fa-arrow-right"></i> 前往 KadoKado',

    "game-title": "GAME: 恐怖民俗RPG遊戲",
    "game-web": '<i class="fa-solid fa-globe"></i> 遊戲官網',
    "game-forum": '<i class="fa-solid fa-comments"></i> 巴哈姆特',
    "game-warn": '<i class="fa-solid fa-triangle-exclamation"></i> 【系統警告】包含大量紅色顏料與精神污染（開玩笑的，但也許不是）。',

    "modal-title": "⚠ 劇透警告",
    "modal-body": "後記包含《咬了神一口》的劇情劇透，<br>建議閱讀完正文後再前往。",
    "modal-sub": "確定要繼續嗎？",
    "modal-cancel": "返回",
    "modal-confirm": '<i class="fa-solid fa-arrow-right"></i> 我要閱讀'
  },

  en: {
    "nav-home": "Tealize Hub", "nav-sc": "Word Awakening", "nav-lag": "Bitten by God", "nav-soil": "Soil Crossing", "nav-game": "Reversed Truth",
    "cat-novel": '<i class="fa-solid fa-book-open"></i> NOVELS',
    "cat-novel-short": "NOVELS",
    "cat-game": '<i class="fa-solid fa-gamepad"></i> GAMES',
    "cat-game-short": "GAMES",
    "tag-capricorn": "Capricorn", "tag-gamemaker": "Game Maker", "tag-art": "Illustration", "tag-creator": "Fantasy Creator",

    "sc-title": "NOVEL: Word Awakening",
    "sc-quote": '"Because I\'m a closed-writer, I\'ll win." "The championship is ours."',
    "sc-sys": "[System Prompt] High concentration of memes & school fantasy detected.",
    "sc-vol1": "VOL.1 Beware of Word-Filth",
    "sc-vol2": "VOL.2 Writers' Brawl",
    "sc-side": "Prologue: Taipei Main Station Rules",
    "sc-quiz-title": "🧪 Creator Attribute Assessment",
    "sc-quiz-btn": 'Start Test <i class="fa-solid fa-wand-magic-sparkles"></i>',

    "lag-title": "NOVEL: Bitten by God",
    "lag-quote": '"A Beauty and the Beast retelling. There\'s an untouchable manor on the mountain..."',
    "lag-subtitle": "A Bite of God &nbsp;·&nbsp; Beauty &amp; the Beast retelling",
    "lag-desc": "There is a manor on the mountain that shouldn't be touched.<br>Picking flowers has a price, and lying does too.<br>Leon just wanted to bring his brother home.<br>But he's never been an obedient lion.<br>So, he took a bite out of God.<br>Maybe more than one bite.",
    "lag-purchase": '<i class="fa-solid fa-globe"></i> Official Website',
    "lag-afterword-btn": '<i class="fa-solid fa-scroll"></i> Read Afterword',
    "lag-quiz-btn": 'Test Your Dark Traits <i class="fa-solid fa-arrow-right"></i>',

    "soil-title": "NOVEL: REVISING",
    "soil-read": "Click to Read",
    "soil-booktitle": "Who Planted the Time-Traveler in the Soil?",
    "soil-sys": "[System Prompt] Dinosaur Warning!",
    "soil-quote": '"17-year-old Su Hai-Yue chose to end his life, only to be dug out of the soil..."',
    "soil-desc": "A crazy world where humans are divided into ABO, ghosts cling to pheromones, and dinosaurs roam the streets. Su Hai-Yue meets the ghost-pale Alpha, Lu Ling-Yi, uncovering a massive conspiracy spanning two worlds.",
    "soil-link": '<i class="fa-solid fa-arrow-right"></i> Go to KadoKado',

    "game-title": "GAME: Folklore Horror RPG",
    "game-web": '<i class="fa-solid fa-globe"></i> Official Website',
    "game-forum": '<i class="fa-solid fa-comments"></i> Bahamut Forum',
    "game-warn": '<i class="fa-solid fa-triangle-exclamation"></i> [System Warning] Contains a large amount of red paint and mental pollution.',

    "modal-title": "⚠ Spoiler Warning",
    "modal-body": "The afterword contains major plot spoilers for Bitten by God.<br>We recommend reading the main story first.",
    "modal-sub": "Do you want to continue?",
    "modal-cancel": "Return",
    "modal-confirm": '<i class="fa-solid fa-arrow-right"></i> Read Afterword'
  }
};
