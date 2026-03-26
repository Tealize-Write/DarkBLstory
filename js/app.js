/* ══════════════════════════════════════
   Tealize Base v3 - Core Script
   i18n 翻譯字典已拆至 js/i18n.js
   ══════════════════════════════════════ */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const html = document.documentElement;
  const body = document.body;
  const isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  let canvas, ctx, particles = [], animationId;

  // 從 i18n.js 讀取字典（i18n.js 必須在 app.js 之前載入）
  const i18nData = window.i18nData || {};

  // 2. 定義所有核心函式
  function setLang(lang) {
    html.lang = lang;
    lsSet("tealize.lang", lang);
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      if (i18nData[lang] && i18nData[lang][key]) el.innerHTML = i18nData[lang][key];
    });
    const langBtnSpan = document.querySelector("#langBtn span") || document.getElementById("langBtnLabel");
    if (langBtnSpan) langBtnSpan.textContent = html.lang === "zh" ? "EN" : "中文";
  }

  function toggleMode() {
    // ✅ 修正：讀取與寫入 html 的 data-mode
    const currentMode = html.getAttribute("data-mode");
    const newMode = currentMode === "visual" ? "code" : "visual";
    html.setAttribute("data-mode", newMode);
    lsSet("tealize.mode", newMode);
    
    if (newMode === "visual") initCanvas();
    else stopCanvas();
    updateVisualMode(newMode === "visual");
  }
  
  function updateVisualMode(isVisual) {
    const modeBtnIcon = document.querySelector("#modeBtn i");
    if (modeBtnIcon) modeBtnIcon.className = isVisual ? "fa-solid fa-terminal" : "fa-solid fa-wand-magic-sparkles";

    const visualContainer = document.getElementById("visual-mode");
    const codeContainer = document.getElementById("code-mode");

    if (visualContainer) {
      if (isVisual) visualContainer.classList.remove("hidden");
      else visualContainer.classList.add("hidden");
    }

    if (codeContainer) {
      if (isVisual) {
        codeContainer.classList.add("hidden");
      } else {
        codeContainer.classList.remove("hidden");
        if (typeof playCodeModeAnimation === "function") playCodeModeAnimation();
      }
    }
    // 游標完全不碰，讓 initCustomCursor 獨立管理
  }

  function playCodeModeAnimation() {
    const codeTitle = document.getElementById("code-title");
    const codeBio = document.getElementById("code-bio");
    const codeIntro = document.getElementById("code-intro");
    const codeContent = document.querySelector(".code-content");

    if (!codeTitle) return;

    if (codeTitle.dataset.typed === "true") {
      if (codeBio) codeBio.style.opacity = "1";
      if (codeIntro) codeIntro.style.opacity = "1";
      if (codeContent) codeContent.style.opacity = "1";
      return;
    }

    codeTitle.dataset.typed = "true";
    codeTitle.textContent = "";
    const text = "TEALIZE.HUB()";
    let i = 0;
    
    function typeWriter() {
      if (i < text.length) {
        codeTitle.textContent += text.charAt(i);
        i++;
        setTimeout(typeWriter, 80);
      } else {
        if (codeBio) codeBio.style.opacity = "1";
        if (codeIntro) codeIntro.style.opacity = "1";
        if (codeContent) codeContent.style.opacity = "1";
      }
    }
    setTimeout(typeWriter, 300);
  }

  function toggleTheme() {
    // ✅ 修正：讀取與寫入 html 的 data-theme
    const currentTheme = html.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", newTheme);
    lsSet("tealize.theme", newTheme);
    refreshAccentCache(); // ✅ 主題切換後刷新粒子顏色快取
    syncIcons();
  }

  function syncIcons() {
    const avatarImg = document.getElementById("avatar-img") || document.getElementById("avatarImg");
    const themeBtnIcon = document.querySelector("#themeBtn i");
    const isDark = html.getAttribute("data-theme") === "dark";
    
    if (avatarImg) avatarImg.src = isDark ? "img/avatar_black.jpg" : "img/avatar_white.jpg";
    if (themeBtnIcon) themeBtnIcon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
  }

  // ── 動態計算資歷年數 ──
  (function updateCareerYears() {
    const now = new Date();
    const yr  = now.getFullYear();
    const mo  = now.getMonth() + 1; // 1-12

    function yearsFrom(startY, startM = 1) {
      const diff = (yr - startY) + (mo - startM) / 12;
      return Math.floor(diff);
    }

    const elWriting = document.getElementById("career-writing");
    const elMis     = document.getElementById("career-mis");
    const elPenana  = document.getElementById("career-penana");

    if (elWriting) elWriting.textContent = yearsFrom(2007);
    if (elMis)     elMis.textContent     = yearsFrom(2019, 7);
    if (elPenana) {
      const y = yearsFrom(2025, 6);
      elPenana.textContent = y < 1 ? "<1" : y;
      // 滿 1 年後單位顯示「年+」
      const unitEl = elPenana.nextElementSibling;
      if (unitEl && y >= 1) unitEl.textContent = " 年+";
    }
  })();

  // ── Header 漸層隨滾動加深 ──
  const controlPanel = document.querySelector(".control-panel");
  document.querySelectorAll(".view-mode").forEach(container => {
    container.addEventListener("scroll", () => {
      if (!controlPanel) return;
      const scrolled = container.scrollTop > 10;
      controlPanel.style.backdropFilter = scrolled ? "blur(8px)" : "blur(0px)";
      controlPanel.style.webkitBackdropFilter = scrolled ? "blur(8px)" : "blur(0px)";
    }, { passive: true });
  });

  // ── 平滑滾動與回頂端按鈕 ──
  const backToTopBtn = document.getElementById("backToTop");

  // 1. 目錄按鈕點擊：精準滾動到對應區塊
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
     anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const targetId = this.getAttribute("href");
        if (targetId === "#") return;
        const target = document.querySelector(targetId);
        
        if (target) {
           // 找出當前真正產生滾動軸的容器 (視覺模式 或 程式模式)
           const scrollContainer = document.querySelector('.view-mode:not(.hidden)');
           if (scrollContainer) {
             // target.getBoundingClientRect().top 是目標相對視窗頂部的距離
             // 加上容器目前的 scrollTop，再扣掉 80px 的上方緩衝空間
             const targetPosition = scrollContainer.scrollTop + target.getBoundingClientRect().top - 80;
             scrollContainer.scrollTo({ top: targetPosition, behavior: "smooth" });
           }
        }
     });
  });

  // 2. 監聽滾動：控制回頂端按鈕的浮現與隱藏
  document.querySelectorAll('.view-mode').forEach(container => {
    container.addEventListener("scroll", () => {
      if (!backToTopBtn) return;
      // 只要往下滾動超過 400px，就顯示按鈕
      if (container.scrollTop > 400) {
        backToTopBtn.classList.add("show");
      } else {
        backToTopBtn.classList.remove("show");
      }
    }, { passive: true });
  });

  // 3. 回頂端按鈕點擊：捲回最上方
  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", () => {
      const scrollContainer = document.querySelector('.view-mode:not(.hidden)');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  // ── 咬了神一口：防雷彈窗邏輯 ──
  const spoilerBtn = document.getElementById("lagAfterwordBtn");
  const spoilerOverlay = document.getElementById("spoilerOverlay");
  if (spoilerBtn && spoilerOverlay) {
    const spoilerCancel = document.getElementById("spoilerCancel");
    const spoilerConfirm = document.getElementById("spoilerConfirm");

    const openModal = () => {
      spoilerOverlay.classList.add("active");
      spoilerOverlay.setAttribute("aria-hidden", "false");
      body.style.overflow = "hidden";
    };
    const closeModal = () => {
      spoilerOverlay.classList.remove("active");
      spoilerOverlay.setAttribute("aria-hidden", "true");
      body.style.overflow = "";
    };

    spoilerBtn.addEventListener("click", openModal);
    if (spoilerCancel) spoilerCancel.addEventListener("click", closeModal);
    if (spoilerConfirm) spoilerConfirm.addEventListener("click", () => {
      closeModal();
      window.open("lag-afterword.html", "_blank", "noopener,noreferrer");
    });
    spoilerOverlay.addEventListener("click", (e) => { if (e.target === spoilerOverlay) closeModal(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && spoilerOverlay.classList.contains("active")) closeModal(); });
  }

  // ── Canvas 背景粒子特效 ──
  function initCanvas() {
    canvas = document.getElementById("particlesCanvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    createParticles();
    animateCanvas();
  }

  function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }

  function createParticles() {
    particles = [];
    const count = window.innerWidth > 768 ? 50 : 25;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        r: Math.random() * 2 + 1, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.4 + 0.2
      });
    }
  }

  // ── 顏色輔助：快取 accent color，只在主題切換時刷新，避免每幀 reflow ──
  let _cachedAccentRGB = null;
  function refreshAccentCache() {
    const probe = document.createElement("div");
    probe.style.cssText = "display:none;color:" + getComputedStyle(html).getPropertyValue("--accent-color").trim();
    body.appendChild(probe);
    _cachedAccentRGB = getComputedStyle(probe).color; // 瀏覽器回傳 "rgb(r, g, b)"
    body.removeChild(probe);
  }
  function getAccentRGBA(opacity) {
    if (!_cachedAccentRGB) refreshAccentCache();
    return _cachedAccentRGB.replace("rgb(", "rgba(").replace(")", ", " + opacity + ")");
  }

  function animateCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = getAccentRGBA(p.opacity);
      ctx.fill();
    });
    animationId = requestAnimationFrame(animateCanvas);
  }

  function stopCanvas() {
    if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
    // ⚠️ _outlineRafId 不在這裡取消，游標圓圈要跨模式持續運作
    if (canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      window.removeEventListener("resize", resizeCanvas);
    }
  }

  // ── 自訂游標 (強化版防干擾) ──
  let _outlineRafId = null;
  function initCustomCursor() {
    const dot = document.querySelector(".cursor-dot");
    const outline = document.querySelector(".cursor-outline");
    if (!dot || !outline) return;

    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    let outlineX = mouseX, outlineY = mouseY;
    let cursorEnabled = false;

    window.addEventListener("mousemove", (e) => {
      if (!cursorEnabled) {
        body.dataset.cursor = "on";
        dot.style.display = "block";
        outline.style.display = "block";
        cursorEnabled = true;
      }
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = mouseX + "px";
      dot.style.top  = mouseY + "px";
    }, { passive: true });

    function animateOutline() {
      if (cursorEnabled) {
        outlineX += (mouseX - outlineX) * 0.15;
        outlineY += (mouseY - outlineY) * 0.15;
        outline.style.left = outlineX + "px";
        outline.style.top  = outlineY + "px";
      }
      _outlineRafId = requestAnimationFrame(animateOutline);
    }
    animateOutline();

    document.querySelectorAll("a, button, .link-card, .neon-tag, .bubble-link, .control-btn").forEach(el => {
      el.addEventListener("mouseenter", () => { if (cursorEnabled) body.classList.add("cursor-active"); });
      el.addEventListener("mouseleave", () => body.classList.remove("cursor-active"));
    });
  }

  // 3. 讀取儲存的狀態並開始執行
  // ── localStorage 安全存取（防無痕模式 SecurityError）──
  function lsGet(key, fallback = null) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } }
  function lsSet(key, val)             { try { localStorage.setItem(key, val); } catch {} }

  const savedMode     = lsGet("tealize.mode")  || html.getAttribute("data-mode")  || "visual";
  const savedThemeStr = lsGet("tealize.theme") || html.getAttribute("data-theme") || "dark";
  html.setAttribute("data-mode", savedMode);
  html.setAttribute("data-theme", savedThemeStr);
  
  const savedLang = lsGet("tealize.lang") || (navigator.language.startsWith("en") ? "en" : "zh");
  setLang(savedLang);

  syncIcons();
  refreshAccentCache();
  initCustomCursor();
  updateVisualMode(savedMode === "visual");
  if (savedMode === "visual") initCanvas();

  // ── 按鈕事件綁定 ──
  const btnTheme = document.getElementById("themeBtn");
  if (btnTheme) btnTheme.addEventListener("click", toggleTheme);

  const btnMode = document.getElementById("modeBtn");
  if (btnMode) btnMode.addEventListener("click", toggleMode);

  const btnLang = document.getElementById("langBtn");
  if (btnLang) btnLang.addEventListener("click", () => {
      const currentLang = html.lang;
      const nextLang = currentLang.includes("zh") ? "en" : "zh";
      setLang(nextLang);
  });

  // ── 右側藤蔓導航：SVG 繪製 + 滾動 active 偵測 ──
  function initSideNav() {
    const nav      = document.getElementById("sideNav");
    const svg      = document.getElementById("sideVineSvg");
    const bubbles  = document.querySelectorAll(".side-bubble");
    const container = document.querySelector(".view-mode:not(.hidden)") || document.getElementById("visual-mode");
    if (!nav || !svg || !bubbles.length) return;

    // ── 繪製 SVG 藤蔓 ──
    function drawVine() {
      const bubblesEl   = document.getElementById("sideBubbles");
      if (!bubblesEl) return;
      const totalH      = bubblesEl.offsetHeight;
      const svgW        = 80;
      svg.setAttribute("viewBox", `0 0 ${svgW} ${totalH}`);
      svg.style.height  = totalH + "px";

      // 主幹：從頂部彎曲到底部，靠右側
      const cx1 = svgW * 0.2, cy1 = totalH * 0.3;
      const cx2 = svgW * 0.7, cy2 = totalH * 0.7;
      const mainPath = `M ${svgW*0.55},0 C ${cx1},${cy1} ${cx2},${cy2} ${svgW*0.45},${totalH}`;

      // 裝飾虛線
      const dashPath = `M ${svgW*0.4},${totalH*0.1} C ${svgW*0.8},${totalH*0.35} ${svgW*0.15},${totalH*0.65} ${svgW*0.6},${totalH*0.9}`;

      // 小葉片們
      const leaves = [
        { x: svgW*0.38, y: totalH*0.18, r: 6, a: -30 },
        { x: svgW*0.62, y: totalH*0.42, r: 5, a: 20  },
        { x: svgW*0.30, y: totalH*0.60, r: 7, a: -20 },
        { x: svgW*0.55, y: totalH*0.78, r: 4, a: 35  },
      ];

      const accentNovel = getComputedStyle(document.documentElement).getPropertyValue("--accent-color").trim() || "#00c8ff";
      const accentGame  = "#ff6b4a";

      let svgHTML = `
        <path d="${mainPath}"
              stroke="${accentNovel}" stroke-width="1.8" fill="none" opacity="0.45"
              stroke-linecap="round"/>
        <path d="${dashPath}"
              stroke="${accentNovel}" stroke-width="1" fill="none" opacity="0.25"
              stroke-dasharray="6 5" stroke-linecap="round"/>
      `;

      // 底部遊戲段用紅橙色加深
      const gameLine = `M ${svgW*0.45},${totalH*0.72} C ${svgW*0.2},${totalH*0.82} ${svgW*0.75},${totalH*0.88} ${svgW*0.45},${totalH}`;
      svgHTML += `<path d="${gameLine}" stroke="${accentGame}" stroke-width="1.5" fill="none" opacity="0.4" stroke-linecap="round"/>`;

      // 葉片
      leaves.forEach((l, i) => {
        const col = i >= 2 ? accentGame : accentNovel;
        const op  = i >= 2 ? 0.55 : 0.5;
        svgHTML += `
          <g transform="translate(${l.x},${l.y}) rotate(${l.a})">
            <ellipse cx="0" cy="0" rx="${l.r}" ry="${l.r*1.7}"
                     fill="${col}" opacity="${op}"/>
            <line x1="0" y1="${-l.r*1.7}" x2="0" y2="${l.r*1.7}"
                  stroke="${col}" stroke-width="0.6" opacity="0.6"/>
          </g>`;
      });

      // 發光節點（氣泡接點）
      const nodeYs = [totalH*0.12, totalH*0.28, totalH*0.46, totalH*0.72, totalH*0.88];
      nodeYs.forEach((y, i) => {
        const col = i >= 3 ? accentGame : accentNovel;
        svgHTML += `<circle cx="${svgW*0.5}" cy="${y}" r="3" fill="${col}" opacity="0.8"/>
                    <circle cx="${svgW*0.5}" cy="${y}" r="6" fill="${col}" opacity="0.18"/>`;
      });

      svg.innerHTML = svgHTML;
    }

    drawVine();
    window.addEventListener("resize", drawVine, { passive: true });

    // ── 手機版 toggle ──
    const toggleBtn    = document.getElementById("sideNavToggle");
    const toggleIcon   = document.getElementById("sideNavToggleIcon");
    const bubblesPanel = document.getElementById("sideBubbles");

    function isMobileNav() { return window.innerWidth <= 768; }

    function openNav() {
      bubblesPanel.classList.add("is-open");
      toggleBtn.setAttribute("aria-expanded", "true");
      toggleBtn.setAttribute("aria-label", "收起導航");
      toggleIcon.className = "fa-solid fa-chevron-up";
    }
    function closeNav() {
      bubblesPanel.classList.remove("is-open");
      toggleBtn.setAttribute("aria-expanded", "false");
      toggleBtn.setAttribute("aria-label", "展開導航");
      toggleIcon.className = "fa-solid fa-chevron-down";
    }

    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        if (bubblesPanel.classList.contains("is-open")) closeNav();
        else openNav();
      });
    }

    // 點氣泡後自動收合（手機版）
    bubbles.forEach(bubble => {
      bubble.addEventListener("click", e => {
        e.preventDefault();
        const targetId = bubble.dataset.section;
        const target   = document.getElementById(targetId);
        if (!target) return;
        const scrollEl = document.querySelector(".view-mode:not(.hidden)");
        if (scrollEl) {
          const pos = scrollEl.scrollTop + target.getBoundingClientRect().top - 90;
          scrollEl.scrollTo({ top: pos, behavior: "smooth" });
        }
        // 手機版：跳轉後自動收起
        if (isMobileNav()) closeNav();
      });
    });

    // ── 滾動偵測：點亮當前區塊對應的氣泡 ──
    const sections = ["section-sc","section-lag","section-soil","section-game"]
      .map(id => document.getElementById(id)).filter(Boolean);

    function updateActive() {
      const scrollEl = document.querySelector(".view-mode:not(.hidden)");
      if (!scrollEl) return;
      const scrollTop = scrollEl.scrollTop;
      const vh = scrollEl.clientHeight;
      let current = null;

      sections.forEach(sec => {
        const rect = sec.getBoundingClientRect();
        // 區塊進入視窗上半部就算 active
        if (rect.top < vh * 0.55 && rect.bottom > 0) current = sec.id;
      });

      bubbles.forEach(b => {
        b.classList.toggle("is-active", b.dataset.section === current);
      });
    }

    const scrollEl = document.querySelector(".view-mode:not(.hidden)") || document.getElementById("visual-mode");
    if (scrollEl) scrollEl.addEventListener("scroll", updateActive, { passive: true });
    updateActive();
  }

  // 初始化（在 visual mode 時執行）
  if (savedMode === "visual") initSideNav();

  // mode 切換時也重跑
  const _origToggleMode = toggleMode;
  // 在 toggleMode 後補掛 initSideNav
  document.getElementById("modeBtn")?.addEventListener("click", () => {
    setTimeout(() => {
      if (html.getAttribute("data-mode") === "visual") initSideNav();
    }, 100);
  }, { once: false });
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").then(() => console.log("SW registered")).catch(() => {});
    });
  }
  
  // ── 記錄進站人數 (PageView) ──
  const API_URL = "https://script.google.com/macros/s/AKfycbxx9-JwDwcQ-XPm4I782i9z0JfYpvw0em4ugiCPI28NR9pKyniRyebA1pTHWSJ6fGJ0/exec";
  const visitorNumberEl = document.getElementById("visitorNumber");

  if (visitorNumberEl) {
    const isNewView = !sessionStorage.getItem("tealize.viewed");
    const action = isNewView ? "view" : "get";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    fetch(`${API_URL}?action=${encodeURIComponent(action)}`, { signal: controller.signal })
      .then(res => { clearTimeout(timeoutId); return res.json(); })
      .then(data => {
        if (data && typeof data.views === "number") {
          visitorNumberEl.textContent = data.views.toLocaleString();
          if (isNewView) sessionStorage.setItem("tealize.viewed", "true");
        }
      })
      .catch(err => {
        clearTimeout(timeoutId);
        if (err.name !== "AbortError") console.log("無法獲取瀏覽人數", err);
        visitorNumberEl.textContent = "—";
      });
  }

  // ══════════════════════════════════════
  // 訪客追蹤系統
  // ══════════════════════════════════════
  (function initTracking() {

    // ── clientId：掃描所有 localStorage value，找 uid_/ag_ 前綴 ──
    function getClientId() {
      try {
        // 掃描所有 value（不是 key），找出已知前綴
        for (const prefix of ["uid_", "ag_"]) {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            const v = localStorage.getItem(k) || "";
            if (v.startsWith(prefix)) return v;
          }
        }
        // 找自建的 tw_ tealize id
        const existing = localStorage.getItem("tw_tealize_id");
        if (existing) return existing;
        // 都沒有就建立新的
        const newId = "tw_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
        localStorage.setItem("tw_tealize_id", newId);
        return newId;
      } catch { return "unknown"; }
    }

    // ── UTC+8 時間字串 ──
    function toTW8(ts) {
      return new Date(ts + 8 * 3600000)
        .toISOString().replace("T", " ").slice(0, 19);
    }

    const tzOffset  = new Date().getTimezoneOffset(); // 分鐘，UTC+8 = -480
    const clientId  = getClientId();
    const enterTime = Date.now();
    const enterStr  = toTW8(enterTime);

    // ── 點擊追蹤 ──
    const clickLog = [];

    const TRACKED = [
      { sel: 'a[href*="framer.app"]',             label: "咬了神一口官網" },
      { sel: 'a[href*="kadokado"][href*="1425"]',  label: "字命覺醒VOL1" },
      { sel: 'a[href*="kadokado"][href*="42308"]', label: "字命覺醒VOL2" },
      { sel: 'a[href*="kadokado"][href*="65322"]', label: "字命覺醒Extra" },
      { sel: 'a[href*="kadokado"][href*="60627"]', label: "穿越者KadoKado" },
      { sel: 'a[href*="wixsite"]',                 label: "反轉的真實官網" },
      { sel: 'a[href*="gamer.com"]',               label: "反轉的真實巴哈" },
      { sel: 'a[href*="story-command-academy"]',   label: "字命覺醒測驗" },
      { sel: 'a[href*="DarkBLstory"]',             label: "黑暗特質測驗" },
      { sel: '#lagAfterwordBtn',                   label: "閱讀後記btn" },
      { sel: '#spoilerConfirm',                    label: "後記確認進入" },
      { sel: '#langBtn',                           label: "切換語言" },
      { sel: '#themeBtn',                          label: "切換主題" },
      { sel: '#modeBtn',                           label: "切換終端機" },
      { sel: '[data-section="section-sc"]',        label: "nav:字命覺醒" },
      { sel: '[data-section="section-lag"]',       label: "nav:咬了神一口" },
      { sel: '[data-section="section-soil"]',      label: "nav:穿越者" },
      { sel: '[data-section="section-game"]',      label: "nav:反轉的真實" },
    ];

    TRACKED.forEach(({ sel, label }) => {
      document.querySelectorAll(sel).forEach(el => {
        el.addEventListener("click", () => { clickLog.push(label); }, { passive: true });
      });
    });

    // ── 離開時 POST 送出紀錄 ──
    function sendVisit(reason) {
      const exitTime    = Date.now();
      const staySeconds = Math.round((exitTime - enterTime) / 1000);
      clickLog.push(`X:${reason}`);

      // source / referrer / device
      const urlParams = new URLSearchParams(window.location.search);
      const source    = urlParams.get("utm_source") || "direct";
      const referrer  = document.referrer || "none";
      const device    = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
                          .test(navigator.userAgent) ? "Mobile" : "Desktop";

      const payload = JSON.stringify({
        action:    "visit",
        clientId:  clientId,
        tz:        String(tzOffset),
        enterTime: enterStr,
        exitTime:  toTW8(exitTime),
        stay:      staySeconds,
        clicks:    clickLog.join(","),
        source:    source,
        referrer:  referrer,
        device:    device
      });

      // sendBeacon 用 POST + Blob（GAS 要對應 doPost）
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(API_URL, blob);
      } else {
        try { fetch(API_URL, { method: "POST", body: payload, keepalive: true }); } catch {}
      }
    }

    let sent = false;
    function onLeave(reason) {
      if (sent) return;
      sent = true;
      sendVisit(reason);
    }

    window.addEventListener("beforeunload", () => onLeave("close"));
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") onLeave("hidden");
    });

  })();
});