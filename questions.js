/* ── QUESTIONS ── */
const questions=[
  // ── 第 1 題：control vs manip ────────────────────────────────
  {text:"凌晨三點，你在陌生的昏暗房間醒來。你第一個念頭是：",options:[
    {text:"先找能用的東西。要是他敢再靠近，我會讓他付出代價。",add:{dom:1,control:2}},
    {text:"先弄清楚規則，再決定要不要翻桌。",                   add:{dom:1,manip:2}},
    {text:"門半掩？那就先不走。反正我想看看他想把我玩到哪裡。",add:{sub:1,control:2}},
    {text:"無所謂。先看看他底牌，再決定怎麼讓他欠我一筆。",    add:{sub:1,manip:2}},
  ]},

  // ── 第 2 題：chaos vs devotion ───────────────────────────────
  {text:"那男人出現，氣場壓得你喘不過氣。他把盒子丟到你腳邊。你最希望裡面是：",options:[
    {text:"一把刀或槍。我要的是生死局，刺激到見血那種。",          add:{dom:1,chaos:2}},
    {text:"一副手銬或項圈。不是因為怕，而是我想看誰先失控。",      add:{dom:1,devotion:2}},
    {text:"一份讓我從此消失的文件。好，那就在消失之前把他燒乾淨。",add:{sub:1,chaos:2}},
    {text:"一張黑卡和一張『條款』。我想知道我的身價能賣到哪裡。",  add:{sub:1,devotion:2}},
  ]},

  // ── 第 3 題：control vs chaos ────────────────────────────────
  {text:"他捏住你的下巴逼你抬頭。你會：",options:[
    {text:"盯回去，甚至笑一下。你以為你在審我？",            add:{dom:1,control:2}},
    {text:"讓他看清楚我的眼神，然後讓他後悔這個動作。",      add:{dom:1,chaos:2}},
    {text:"故意轉開視線，讓他更想把我掰回來。",              add:{sub:1,control:2}},
    {text:"顫一下也不遮掩。讓他看清我會被他弄到崩壞。",      add:{sub:1,chaos:2}},
  ]},

  // ── 第 4 題：manip vs devotion ───────────────────────────────
  {text:"他低聲說：「逃吧，被我抓到就別想再看見太陽。」你的反應是：",options:[
    {text:"我會逃，但不是為了自由，是為了讓他追到發瘋。",  add:{dom:1,manip:2}},
    {text:"不逃。先把出口全封死，讓他追不到也甩不掉。",    add:{dom:1,devotion:2}},
    {text:"逃一半。我想看看他瘋起來的樣子。",              add:{sub:1,manip:2}},
    {text:"很好。把我抓回去的時候，記得弄疼一點。",        add:{sub:1,devotion:2}},
  ]},

  // ── 第 5 題：control vs devotion ────────────────────────────
  {text:"你更上癮的，是哪種黑暗特質？",options:[
    {text:"掠奪：他把我的自持一層層剝掉，直到我求饒。",          add:{dom:1,control:2}},
    {text:"偏執：他只對我一個人失去理智。",                      add:{dom:1,devotion:2}},
    {text:"算計：我們互相利用，互相上癮，誰先動心誰就輸。",      add:{sub:1,control:2}},
    {text:"病態：痛和愛混在一起，我分不清我想逃還是想留。",      add:{sub:1,devotion:2}},
  ]},

  // ── 第 6 題：manip vs chaos ──────────────────────────────────
  {text:"當你想要一個人，你更可能怎麼下手？",options:[
    {text:"慢慢設局，讓他以為是自己先主動。",              add:{dom:1,manip:2}},
    {text:"直接逼近，讓他沒得退。我要的是他當場承認。",    add:{dom:1,chaos:2}},
    {text:"把自己變成他拒絕不了的習慣，然後再收網。",      add:{sub:1,manip:2}},
    {text:"把界線推到極限。要嘛一起爽，要嘛一起毀。",      add:{sub:1,chaos:2}},
  ]},

  // ── 第 7 題：control vs manip（決勝輪）────────────────────────
  {text:"你看到心裡那個人對別人笑，你第一個念頭是：",options:[
    {text:"把他拉回來，當著對方的面讓他只看得到我。",        add:{dom:1,control:2}},
    {text:"先記住那個人。之後再慢慢『處理』掉。",            add:{dom:1,manip:2}},
    {text:"裝作沒事，但我會讓他回家後付出代價。",            add:{sub:1,control:2}},
    {text:"我不配。那就讓我自己沉下去，不要打擾他。",        add:{sub:1,manip:2}},
  ]},

  // ── 第 8 題：chaos vs devotion（決勝輪）──────────────────────
  {text:"如果你們的結局註定不健康，你最想要的收尾是：",options:[
    {text:"他跪著求我別走，我踩著他的自尊讓他只剩我。",            add:{dom:1,chaos:2}},
    {text:"我把他鎖進我的世界，讓他習慣得再也不想出來。",          add:{dom:1,devotion:2}},
    {text:"兩敗俱傷。血跟吻混在一起，誰也別想乾淨退場。",          add:{sub:1,chaos:2}},
    {text:"我被圈養到習慣，最後連門開著都不想走。",                add:{sub:1,devotion:2}},
  ]},

  // ── 第 9 題：control vs chaos ────────────────────────────────
  {text:"你被他單獨困在一個地方，出口只有一道他守著的門。你怎麼辦？",options:[
    {text:"不動聲色等機會，時機到了一次翻盤。",              add:{dom:1,control:2}},
    {text:"把局面攪爛，讓他比我更先失去判斷力。",            add:{dom:1,chaos:2}},
    {text:"讓他以為我投降了，再從他的弱點破局。",            add:{sub:1,control:2}},
    {text:"乾脆不走。讓他來說要把我怎樣。",                  add:{sub:1,chaos:2}},
  ]},

  // ── 第 10 題：manip vs devotion ─────────────────────────────
  {text:"他對你說：「你是我見過最難對付的人。」你怎麼解讀這句話？",options:[
    {text:"那是恭維。下一步就是讓他說出『你贏了』。",        add:{dom:1,manip:2}},
    {text:"那是宣戰。很好，我也一直在等他認真。",            add:{dom:1,devotion:2}},
    {text:"那是破口。他對我上心了，我要好好用這一點。",      add:{sub:1,manip:2}},
    {text:"那是告白。他說不出口愛，只能用這種方式靠近我。",  add:{sub:1,devotion:2}},
  ]},

  // ── 第 11 題：control vs devotion ───────────────────────────
  {text:"他在你最脆弱的時候出現，你心裡第一個反應是：",options:[
    {text:"危險。不能讓他看見這個樣子，要立刻重新站起來。",  add:{dom:1,control:2}},
    {text:"終於。我等這個人來看見我等很久了。",              add:{dom:1,devotion:2}},
    {text:"這是機會。讓他以為他救了我，然後我把他留住。",    add:{sub:1,control:2}},
    {text:"算了。讓他看。反正崩掉的部分我一個人撐不住了。",  add:{sub:1,devotion:2}},
  ]},

  // ── 第 12 題：manip vs chaos（最終決勝）──────────────────────
  {text:"在這段關係裡，你最無法接受的是：",options:[
    {text:"被看穿。對方比我更清楚我的底牌。",                add:{dom:1,manip:2}},
    {text:"被掌控。對方讓我覺得自己只是棋子。",              add:{dom:1,chaos:2}},
    {text:"被遺棄。對方在最需要我的時候選擇消失。",          add:{sub:1,manip:2}},
    {text:"被冷靜對待。對方對我始終理智，就是不失控。",      add:{sub:1,chaos:2}},
  ]},
];

