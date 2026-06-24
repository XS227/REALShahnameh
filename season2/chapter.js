/* ==========================================================================
   REAL Shahnameh — Chapter renderer
   Reads ?slug= from URL, fetches:
     - season2/data/chapters.json   (chapter metadata, cover, rewards)
     - season2/data/lore/{slug}.json (scenes, characters, places, codex…)
     - season2/data/quizzes.json    (multiple-choice questions)
   And paints the chapter overview, scene reader, codex, requirements, quiz.
   Persists progress in localStorage so reload retains state.
   ========================================================================== */
(() => {
  "use strict";

  /* ---------- helpers ---------- */
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const $  = (s, r = document) => r.querySelector(s);

  const escapeHtml = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, m =>
    ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[m]);

  /* ---------- i18n helpers ---------- */
  const curLang = () => (window.RealI18N && window.RealI18N.getLang)
    ? window.RealI18N.getLang() : "en";
  const tr = (k, vars) => (window.RealI18N && window.RealI18N.t)
    ? window.RealI18N.t(k, vars) : k;
  const fmtNum = (n) => (window.RealI18N && window.RealI18N.formatNumber)
    ? window.RealI18N.formatNumber(n) : String(n);
  // pick localized variant: pick(obj, "title") → obj.title_fa / obj.title_tg / obj.title
  const pick = (obj, base) => {
    if (!obj) return "";
    const lang = curLang();
    if (lang !== "en") {
      const loc = obj[base + "_" + lang];
      if (loc) return loc;
    }
    return obj[base + "_en"] || obj[base] || "";
  };
  // pick localized property of a {en, fa, tg} object (used for lore_summary)
  const pickEnFa = (obj) => {
    if (!obj) return "";
    const lang = curLang();
    if (lang !== "en" && obj[lang]) return obj[lang];
    return obj.en || "";
  };

  const params = new URLSearchParams(location.search);
  const SLUG = params.get("slug") || "keyumars";

  /* ── URL-based dev reset (?devReset=1) ────────────────────────────────────
     Navigating to chapter.html?slug=keyumars&devReset=1 wipes all chapter
     and quest state then reloads clean — useful for QA and scene testing.  */
  if (params.get("devReset") === "1") {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (k.startsWith("real_chapter_") || k.startsWith("real_quest_") ||
            k.startsWith("real_daily_taps_") || k.startsWith("real_quiz_") ||
            k.startsWith("quiz:") ||
            k === "real_items_v1" || k === "real_boost_state" ||
            k === "real_energy_ts" || k === "real_owned_heroes_v1" ||
            k === "real_total_zar_hr") {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {}
    /* Reload without the devReset param so it doesn't loop */
    const clean = new URL(location.href);
    clean.searchParams.delete("devReset");
    location.replace(clean.toString());
  }

  /* ---------- Telegram WebApp ---------- */
  const tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
  if (tg) {
    try {
      tg.ready(); tg.expand();
      if (tg.setHeaderColor)     tg.setHeaderColor("#04050b");
      if (tg.setBackgroundColor) tg.setBackgroundColor("#04050b");
    } catch { /* nop */ }
  }
  const haptic = (k) => {
    try { tg && tg.HapticFeedback && tg.HapticFeedback.impactOccurred(k || "light"); }
    catch { /* nop */ }
  };

  const tgId = () => {
    try {
      const u = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
      return (u && u.id) ? String(u.id) : null;
    } catch { return null; }
  };

  /* Grade one answer server-side (lib/quizCatalog.js on the backend is the
     source of truth now — see SECURITY note on /user/quiz/answer). Returns
     null on network failure so the caller can refuse to advance rather than
     fall back to trusting the client's own correctness check. */
  const submitQuizAnswer = async (questionId, pickedIndex) => {
    const id = tgId();
    if (!id) return null;
    try {
      const r = await fetch("/season2/user/quiz/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram_id: id, slug: SLUG, question_id: questionId, picked_index: pickedIndex }),
      });
      if (!r.ok) return null;
      const data = await r.json();
      return (data && data.status === 1) ? data : null;
    } catch { return null; }
  };

  const resetQuizTier = async (tier) => {
    const id = tgId();
    if (!id) return false;
    try {
      const r = await fetch("/season2/user/quiz/reset-tier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram_id: id, slug: SLUG, tier }),
      });
      if (!r.ok) return false;
      const data = await r.json();
      return !!(data && data.status === 1);
    } catch { return false; }
  };

  /* Module-level chapter metadata — populated once the catalog fetch resolves */
  let _chapterMeta = null;
  let _quizzes = [];

  /* ---------- progress (localStorage) ---------- */
  const PK = `real_chapter_progress_${SLUG}`;
  const readProgress = () => {
    try { return JSON.parse(localStorage.getItem(PK) || "{}"); }
    catch { return {}; }
  };
  const writeProgress = (next) => {
    try { localStorage.setItem(PK, JSON.stringify(next)); } catch { /* private mode */ }
  };
  const _defaultQuiz = () => ({
    easy:   { idx: 0, correct: [], wrong: [], done: false },
    medium: { idx: 0, correct: [], wrong: [], done: false, locked: true },
    hard:   { idx: 0, correct: [], wrong: [], done: false, locked: true },
  });
  const progress = Object.assign(
    { scenes: [], codex: [], quiz: _defaultQuiz(), fragments: 0, desk_read: false },
    readProgress()
  );

  /* Push the chapter's full state (progress + done/reward flags + grant
     keys + items/skins, collected from localStorage by sync.js) to the
     server. Debounced so rapid scene/quiz updates batch into one POST. */
  let _pushTimer = null;
  const pushProgress = (immediate) => {
    if (!(window.RealSync && window.RealSync.saveChapterProgress)) return Promise.resolve();
    clearTimeout(_pushTimer);
    if (immediate) return window.RealSync.saveChapterProgress(SLUG);
    _pushTimer = setTimeout(() => window.RealSync.saveChapterProgress(SLUG), 1200);
    return Promise.resolve();
  };
  const _flushPendingPush = () => {
    if (_pushTimer) { clearTimeout(_pushTimer); _pushTimer = null;
      if (window.RealSync && window.RealSync.saveChapterProgress) window.RealSync.saveChapterProgress(SLUG);
    }
  };
  window.addEventListener("pagehide", _flushPendingPush);
  /* visibilitychange:hidden fires more reliably on iOS (app-switch / memory kill) */
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") _flushPendingPush();
  });

  const saveProgress = () => { writeProgress(progress); pushProgress(); };

  /* ---------- toast ---------- */
  const toast = (msg) => {
    const el = $("[data-toast]");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 1800);
  };

  /* ---------- main render ---------- */
  const render = ({ chapterMeta, lore, quizzes }) => {
    paintHero(chapterMeta || {}, lore);
    paintLore(lore);
    paintScenes(lore);
    applyCodexAutoUnlocks(lore); // persist intro:complete entries without display
    paintFerdowsiDesk(chapterMeta);
    paintBattle(lore);
    paintQuiz(lore, quizzes);
  };

  /* ---------- hero ---------- */
  const paintHero = (meta, lore) => {
    // Prefer admin upload → lore cover → conventional static path.
    const cover = (meta && meta.image_url) ||
                  (lore && lore.cover) ||
                  `/assets/images/chapters/chapter-1-${SLUG}-cover.png`;
    // FA title comes from chapters.json title_fa; EN title from meta.title.
    const isFa = curLang() === "fa";
    const titleEn = (meta && meta.title) || (lore && lore.lore_summary && SLUG) || tr("ch_loading");
    const titleFa = (meta && meta.title_fa) || "";
    const title = (isFa && titleFa) ? titleFa : titleEn;
    const era = pick(lore && lore.era, "label");

    const heroCover = $("[data-hero-cover]");
    if (heroCover) {
      const probe = new Image();
      probe.onload  = () => { heroCover.style.backgroundImage = `url("${cover}")`; };
      probe.onerror = () => {
        console.warn(`[chapter:${SLUG}] cover missing at ${cover} — falling back to gradient.`);
      };
      probe.src = cover;
    }

    $("[data-era]").textContent = era || tr("ch_season2_chapter");
    $("[data-title]").textContent = title;
    // Always show the Persian title underneath in EN mode; hide when already in FA.
    $("[data-title-fa]").textContent = (isFa ? "" : (titleFa || ""));
    document.title = tr("doc_title_chapter_tpl", { title });

    const rewardsHost = $("[data-rewards]");
    if (rewardsHost) {
      const r = (meta && meta.rewards) || {};
      const pills = [];
      if (r.xp)    pills.push(`<span class="reward-pill">+${fmtNum(r.xp)} ${tr("r_xp")}</span>`);
      if (r.farr)  pills.push(`<span class="reward-pill gold">+${fmtNum(r.farr)} ✦ ${tr("r_farr")}</span>`);
      if (r.real)  pills.push(`<span class="reward-pill gold">+${fmtNum(r.real)} <i class="real-coin"></i>REAL</span>`);
      if (r.energy)pills.push(`<span class="reward-pill"><i class="s2-icon energy"></i>+${fmtNum(r.energy)}</span>`);
      if (r.gems)  pills.push(`<span class="reward-pill"><i class="s2-icon gems"></i>+${fmtNum(r.gems)}</span>`);
      rewardsHost.innerHTML = pills.join("");
    }
  };

  /* ---------- lore summary ---------- */
  const paintLore = (lore) => {
    const summary = pickEnFa(lore && lore.lore_summary);
    $("[data-summary]").textContent = summary || "—";
  };

  /* ---------- timeline strip ---------- */
  /* ---------- scenes ---------- */
  const paintScenes = (lore) => {
    const host = $("[data-scenes]");
    const progEl = $("[data-scene-progress]");
    if (!host) return;
    const scenes = (lore && lore.scenes) || [];
    if (!scenes.length) { host.innerHTML = ""; return; }

    /* Clamp: only count IDs that exist in the current chapter's scene list.
       Legacy localStorage may contain stale IDs from older chapter versions
       (e.g. 8-scene → 14-scene), which would produce "17 / 14" impossible math. */
    const currentSceneIds = new Set(scenes.map(s => s.id));
    const readSet = new Set((progress.scenes || []).filter(id => currentSceneIds.has(id)));
    if (progEl) progEl.textContent = `${fmtNum(readSet.size)} / ${fmtNum(scenes.length)}`;

    host.innerHTML = scenes.map((s, i) => {
      const hasBackdrop = !!s.image;
      const styleAttr = hasBackdrop ? `style="--scene-backdrop:url('${escapeHtml(s.image)}');"` : "";
      const classes = `scene-card${readSet.has(s.id) ? " read" : ""}${hasBackdrop ? " has-backdrop" : ""}`;
      const sceneNum = readSet.has(s.id) ? "✓" : fmtNum(i + 1);
      const body = (pick(s, "body") || "").split("\n")[0];
      return `
      <article class="${classes}"
               data-scene-id="${escapeHtml(s.id)}"
               data-scene-idx="${i}"
               data-atmos="${escapeHtml(s.atmosphere || "")}"
               ${styleAttr}>
        <div class="scene-num">${sceneNum}</div>
        <div class="scene-info">
          <div class="era">🕰 ${escapeHtml(pick(s, "era"))}</div>
          <h4>${escapeHtml(pick(s, "title"))}</h4>
          <p>${escapeHtml(body)}</p>
        </div>
        <div class="scene-arrow">${curLang() === "fa" ? "‹" : "›"}</div>
      </article>`;
    }).join("");

    // wire scene click → modal
    host.querySelectorAll("[data-scene-idx]").forEach((card) => {
      card.addEventListener("click", () => openScene(parseInt(card.getAttribute("data-scene-idx"), 10)));
    });

    // Preflight scene backdrops — console.warn any missing.
    scenes.forEach((s) => {
      if (!s.image) return;
      const img = new Image();
      img.onerror = () => console.warn(`[chapter:${SLUG}] scene "${s.id}" backdrop missing: ${s.image}`);
      img.src = s.image;
    });
  };

  /* ---------- codex auto-unlock (silent — no display) ----------
     Persists intro:complete codex entries into progress so paintBattle
     character-unlock checks stay accurate. Called from render().       */
  const applyCodexAutoUnlocks = (lore) => {
    const entries = (lore && lore.codex) || [];
    const unlocked = new Set(progress.codex);
    let changed = false;
    entries.forEach((e) => {
      if (!unlocked.has(e.id) && e.unlock_via === "intro:complete") {
        progress.codex.push(e.id);
        changed = true;
      }
    });
    if (changed) saveProgress();
  };

  /* ---------- battle teaser overlay ---------- */
  const showBattleTeaser = (bossName) => {
    const existing = document.getElementById("battle-teaser");
    if (existing) existing.remove();

    const el = document.createElement("div");
    el.id = "battle-teaser";
    el.className = "battle-teaser-overlay";
    el.innerHTML = `
      <div class="bt-inner">
        <div class="bt-glyph">☠</div>
        <h3 class="bt-title">${escapeHtml(bossName)}</h3>
        <p class="bt-msg">${escapeHtml(tr("battle_armies_msg"))}</p>
        <button class="primary-btn bt-dismiss">${escapeHtml(tr("battle_prepare_btn"))}</button>
      </div>`;

    document.body.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("open")));

    const close = () => {
      el.classList.remove("open");
      setTimeout(() => el.remove(), 280);
    };
    el.querySelector(".bt-dismiss").addEventListener("click", close);
    el.addEventListener("click", (e) => { if (e.target === el) close(); });
  };

  /* ---------- battle requirements ---------- */
  const paintBattle = (lore) => {
    const host = $("[data-battle]");
    if (!host) return;
    const battle = lore && lore.battle;
    if (!battle) { host.innerHTML = ""; return; }

    /* Always inject Ferdowsi's Desk as first requirement when chronicle data exists */
    const hasDeskData = !!(window._chapterFerdowsiChronicle);
    const deskReq = hasDeskData ? [{
      kind: "desk",
      label:    tr("desk_gate_label"),
      label_fa: "خواندنِ میزِ فردوسی",
      label_tg: "Мизи Фирдавсӣро хондан",
    }] : [];
    /* Auto-inject: read all scenes */
    const scenesReq = currentScenes.length > 0 ? [{
      kind:     "scenes_all",
      label_en: "Read all chapter scenes",
      label_fa: "خواندنِ همه صحنه‌های فصل",
      label_tg: "Хондани ҳамаи саҳнаҳои боб",
      hint_en:  "Read every scene in this chapter — tap each scene card to open and read it.",
      hint_fa:  "همه صحنه‌های این فصل را بخوانید — روی هر کارتِ صحنه بزنید تا باز شود.",
      hint_tg:  "Ҳамаи саҳнаҳои ин бобро бихонед — ҳар картаи саҳнаро пахш кунед то кушода шавад.",
    }] : [];

    /* Auto-inject: all three quiz tiers required for every chapter (§7.9 — Dr. Dadashi) */
    const hasEasyQs   = _quizzes.some(q => q.chapter_slug === SLUG && q.difficulty === "easy");
    const hasMediumQs = _quizzes.some(q => q.chapter_slug === SLUG && q.difficulty === "medium");
    const hasHardQs   = _quizzes.some(q => q.chapter_slug === SLUG && q.difficulty === "hard");
    const easyQuizReq = hasEasyQs ? [{
      kind:     "quiz",
      tier:     "easy",
      label_en: "Pass Easy quiz tier",
      label_fa: "گذراندنِ آزمونِ آسان",
      label_tg: "Гузаштани санҷиши осон",
      hint_en:  "Scroll to the Quiz section and complete the Easy difficulty tier.",
      hint_fa:  "به بخش آزمون بروید و سطح آسان را کامل کنید.",
      hint_tg:  "Ба бахши Имтиҳон равед ва сатҳи осонро иҷро кунед.",
    }] : [];
    const mediumQuizReq = hasMediumQs ? [{
      kind:     "quiz",
      tier:     "medium",
      label_en: "Pass Medium quiz tier",
      label_fa: "گذراندنِ آزمونِ متوسط",
      label_tg: "Гузаштани санҷиши миёна",
      hint_en:  "Scroll to the Quiz section and complete the Medium difficulty tier.",
      hint_fa:  "به بخش آزمون بروید و سطح متوسط را کامل کنید.",
      hint_tg:  "Ба бахши Имтиҳон равед ва сатҳи миёнаро иҷро кунед.",
    }] : [];
    const hardQuizReq = hasHardQs ? [{
      kind:     "quiz",
      tier:     "hard",
      label_en: "Pass Hard quiz tier",
      label_fa: "گذراندنِ آزمونِ سخت",
      label_tg: "Гузаштани санҷиши душвор",
      hint_en:  "Scroll to the Quiz section and complete the Hard difficulty tier.",
      hint_fa:  "به بخش آزمون بروید و سطح سخت را کامل کنید.",
      hint_tg:  "Ба бахши Имтиҳон равед ва сатҳи душворро иҷро кунед.",
    }] : [];

    const reqs = [...deskReq, ...scenesReq, ...(battle.requirements || []), ...easyQuizReq, ...mediumQuizReq, ...hardQuizReq];
    const unlockedScenes = new Set(progress.scenes);
    const unlockedChars  = new Set(); // populated below

    // Mirror character unlocking logic for the requirements list
    (lore.characters || []).forEach((c) => {
      const via = c.unlock_via;
      const u = c.unlocked
        || (via && via.startsWith("scene:") && unlockedScenes.has(via.slice(6)));
      if (u) unlockedChars.add(c.slug);
    });

    const reqMet = (r) => {
      if (r.kind === "level") {
        try {
          const owned = JSON.parse(localStorage.getItem("real_owned_heroes_v1") || "{}");
          const heroId = r.hero_id || SLUG;
          const heroLevel = (owned[heroId] && owned[heroId].level) || 0;
          return heroLevel >= (r.target || 1);
        } catch { return false; }
      }
      if (r.kind === "character") return unlockedChars.has(r.target);
      if (r.kind === "item") {
        try {
          const items = JSON.parse(localStorage.getItem("real_items_v1") || "{}");
          return !!items[r.target];
        } catch { return false; }
      }
      if (r.kind === "quiz") {
        const tier = r.tier || "easy";
        const state = progress.quiz && progress.quiz[tier];
        // Require passed (≥ 60%) not just done; undefined passed = legacy save, treat as passed
        if (state) return !!(state.done && state.passed !== false);
        if (tier === "easy") return !!(progress.quiz && progress.quiz.done);
        return false;
      }
      if (r.kind === "desk") return !!progress.desk_read;
      if (r.kind === "scenes_all") {
        if (!currentScenes.length) return false;
        const validIds = new Set(currentScenes.map(s => s.id));
        const readCount = (progress.scenes || []).filter(id => validIds.has(id)).length;
        return readCount >= currentScenes.length;
      }
      if (r.kind === "farr") {
        try {
          const p = window.RealPlayer ? window.RealPlayer.get() : {};
          return (p.farr || 0) >= (r.target || 1);
        } catch { return false; }
      }
      if (r.kind === "owned_heroes") {
        try {
          const owned = JSON.parse(localStorage.getItem("real_owned_heroes_v1") || "{}");
          return Object.keys(owned).length >= (r.target || 1);
        } catch { return false; }
      }
      return false;
    };

    const pillKey = {
      level:        "req_player_gate",
      character:    "req_recruit",
      item:         "req_item",
      quiz:         "req_knowledge",
      scenes_all:   "req_scenes",
      desk:         "req_goal",
      farr:         "req_farr",
      owned_heroes: "req_heroes",
    };

    let metCount = 0;
    const rows = reqs.map((r) => {
      const met = reqMet(r);
      if (met) metCount++;
      const pill = tr(pillKey[r.kind] || "req_goal");
      const hint = !met ? pick(r, "hint") : "";
      const hasHint = !!hint;
      return `
        <li class="req-row ${met ? "done" : ""} ${hasHint ? "has-hint" : ""}"
            ${hasHint ? 'role="button" tabindex="0"' : ""}>
          <span class="req-mark">${met ? "✓" : "·"}</span>
          <span class="req-label">${escapeHtml(pick(r, "label"))}</span>
          <span class="req-pill">${escapeHtml(pill)}</span>
          ${hasHint ? `<p class="req-hint-body">${escapeHtml(hint)}</p>` : ""}
        </li>`;
    }).join("");

    const allMet = metCount === reqs.length && reqs.length > 0;
    const isFa = curLang() === "fa";

    const bossNameMain = isFa
      ? (battle.boss_name_fa || battle.boss_name_en || "")
      : (battle.boss_name_en || "");
    const bossNameSub = isFa
      ? (battle.boss_name_en || "")
      : (battle.boss_name_fa || "");
    const subAttrs = isFa ? "" : ' lang="fa" dir="rtl"';

    const bossPortrait = battle.boss_image
      ? `<img src="${escapeHtml(battle.boss_image)}" alt="${escapeHtml(bossNameMain)}"
              onerror="this.classList.add('img-fail'); console.warn('[chapter:${SLUG}] boss image missing: ${escapeHtml(battle.boss_image)}');">`
      : "";
    const masterBlock = battle.boss_master_image
      ? `<div class="b-master">
           <div class="b-master-portrait">
             <img src="${escapeHtml(battle.boss_master_image)}" alt="${escapeHtml(tr("boss_ahriman_lord"))}"
                  onerror="this.classList.add('img-fail'); console.warn('[chapter:${SLUG}] master image missing: ${escapeHtml(battle.boss_master_image)}');">
           </div>
           <div>
             <div class="b-master-label">${escapeHtml(tr("boss_sent_by"))}</div>
             <div class="b-master-name">${escapeHtml(tr("boss_ahriman_lord"))}</div>
           </div>
         </div>`
      : "";
    const isChapterDone = localStorage.getItem(`real_chapter_done_${SLUG}`) === "1";
    const ctaLabel = isChapterDone
      ? tr("battle_chapter_complete")
      : allMet
        ? tr("battle_challenge_tpl", { boss: bossNameMain || tr("ch_final_encounter_fallback") })
        : tr("battle_locked");

    const headTitle = bossNameMain || tr("ch_final_encounter_fallback");
    const introText = pick(battle, "intro");

    host.innerHTML = `
      <div class="b-head">
        <div class="b-glyph">${bossPortrait || "☠"}</div>
        <div>
          <h4>${escapeHtml(headTitle)}</h4>
          <p class="b-sub"${subAttrs}>${escapeHtml(bossNameSub)}</p>
        </div>
      </div>
      <p class="intro">${escapeHtml(introText)}</p>
      <ul class="req-list">${rows}</ul>
      ${masterBlock}
      <button class="battle-cta ${isChapterDone ? "ready chapter-done" : allMet ? "ready" : ""}" data-battle-cta ${allMet || isChapterDone ? "" : "disabled"}>
        ${escapeHtml(ctaLabel)}
      </button>
    `;

    const cta = $("[data-battle-cta]", host);
    if (cta) {
      cta.addEventListener("click", () => {
        if (!allMet && !isChapterDone) return;
        if (allMet && !isChapterDone) {
          markChapterComplete();
          paintBattle(lore);
        }
        showBattleTeaser(headTitle);
        haptic("warning");
      });
    }

    /* Clickable hint rows — toggle hint body on tap */
    $$(".req-row.has-hint", host).forEach((row) => {
      row.addEventListener("click", () => {
        const isOpen = row.classList.toggle("hint-open");
        haptic("light");
        if (isOpen) {
          /* close any other open hint rows */
          $$(".req-row.has-hint.hint-open", host)
            .filter(r => r !== row)
            .forEach(r => r.classList.remove("hint-open"));
        }
      });
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); row.click(); }
      });
    });

    const progEl = $("[data-req-progress]");
    if (progEl) progEl.textContent = `${fmtNum(metCount)} / ${fmtNum(reqs.length)}`;
  };

  /* ---------- quiz reward helper (idempotent) ---------- */
  const grantQuizRewards = (lore) => {
    /* Mark the daily Quiz quest done — chapter.js is the full quiz experience
       and must set this; the home-page card quiz also sets it but users may
       only use this page. Idempotent per calendar day. */
    try {
      const dk = new Date().toISOString().slice(0, 10);
      const qKey = `real_quest_quiz_${dk}`;
      if (localStorage.getItem(qKey) !== "true") {
        localStorage.setItem(qKey, "true");
        if (window.RealSync) window.RealSync.syncQuest("quiz");
        try { window.dispatchEvent(new CustomEvent("real:quest:quiz")); } catch {}
      }
    } catch {}
    /* Grant items that unlock on quiz completion (e.g. fire-rune in ch1) */
    try {
      const items = JSON.parse(localStorage.getItem("real_items_v1") || "{}");
      let changed = false;
      ((lore && lore.battle && lore.battle.requirements) || [])
        .filter(r => r.kind === "item" && r.grant_on === "quiz" && !items[r.target])
        .forEach(r => { items[r.target] = true; changed = true; });
      if (changed) localStorage.setItem("real_items_v1", JSON.stringify(items));
    } catch {}
    pushProgress();
  };

  /* Called when player clicks the boss challenge CTA with all requirements met.
     Sets the chapter-done flag and grants completion rewards (idempotent).
     Pushes done:true to the server BEFORE granting rewards: grant-hero now
     requires the server to already see this chapter as done (security fix
     2026-06-24), so the card request must not race ahead of the save. */
  const markChapterComplete = async () => {
    try { localStorage.setItem(`real_chapter_done_${SLUG}`, "1"); } catch {}
    await pushProgress(true);
    grantChapterCompletionRewards();
  };

  /* Hero cards granted for free upon beating a chapter's Final Encounter */
  const CHAPTER_CARD_REWARDS = {
    /* ch1–25 (retroactive: also granted on page-load for already-completed chapters) */
    'keyumars':          { id: 'keyumars',              zar: 12,  name: 'Keyumars — The First King' },
    'hushang':           { id: 'hushang',               zar: 15,  name: 'Hushang — Lord of the Forge' },
    'tahmuras':          { id: 'tahmuras-king',         zar: 18,  name: 'Tahmuras — Binder of Demons' },
    'jamshid':           { id: 'jamshid',               zar: 22,  name: 'Jamshid — Bearer of the Farr' },
    'zahhak':            { id: 'zahhak-shadow',         zar: 28,  name: 'Zahhak — The Serpent Throne' },
    'fereydun':          { id: 'fereydun-liberator',    zar: 32,  name: 'Fereydun — The Liberator' },
    'manuchehr':         { id: 'manuchehr-avenger',     zar: 35,  name: 'Manuchehr — The Avenger' },
    'nozar':             { id: 'nozar',                 zar: 30,  name: 'Nozar — The Divided Crown' },
    'zal':               { id: 'zal-prince',            zar: 38,  name: 'Zal — The White-Haired Prince' },
    'rudabeh':           { id: 'rudabeh-princess',      zar: 40,  name: 'Rudabeh — Princess of Kabul' },
    'birth-of-rostam':   { id: 'sam-warrior',           zar: 42,  name: 'Sam — Champion of Zabolestan' },
    'rostam':            { id: 'rostam-young',          zar: 55,  name: 'Rostam — Pahlavan of the Age' },
    'sohrab':            { id: 'sohrab-storm',          zar: 50,  name: 'Sohrab — Son of the Storm' },
    'siavash':           { id: 'siavash',               zar: 58,  name: 'Siavash — The Pure Prince' },
    'kay-kavus':         { id: 'kay-kavus-king',        zar: 45,  name: 'Kay Kavus — The Reckless King' },
    'kay-khosrow':       { id: 'kay-khosrow',           zar: 62,  name: 'Kay Khosrow — The Chosen King' },
    'akvan':             { id: 'akvan-div',             zar: 48,  name: 'Akvan Div — Demon of the Lake' },
    'bijan-manijeh':     { id: 'bijan-hero',            zar: 55,  name: 'Bijan — Prisoner of Pashang' },
    'great-war-turan':   { id: 'piran-wise',            zar: 60,  name: 'Piran Wisah — General of Turan' },
    'lohrasp':           { id: 'lohrasp-king',          zar: 45,  name: 'Lohrasp — The Humble King' },
    'goshtasp':          { id: 'goshtasp-king',         zar: 55,  name: 'Goshtasp — Champion of the Faith' },
    'esfandiyar':        { id: 'esfandiyar-young',      zar: 68,  name: 'Esfandiyar — The Brazen-Bodied' },
    'seven-labours-esp': { id: 'esfandiyar-young',      zar: 70,  name: 'Esfandiyar — Champion of Seven' },
    'clash-rostam-esp':  { id: 'rostam-elder',          zar: 75,  name: 'Rostam — The Ageing Champion' },
    'simorgh':           { id: 'esp-simorgh',           zar: 80,  name: 'Simorgh — Guide of Champions' },
    /* ch26 */
    'rostams-end':       { id: 'rostam-elder',          zar: 185, name: 'Rostam — The Last Champion' },
    /* ch27–42 (existing) */
    'bahman':            { id: 'bahman-avenger',      zar: 30,  name: 'Bahman — The Avenger' },
    'homay':             { id: 'homay-queen',          zar: 58,  name: 'Homay — The Warrior Queen' },
    'darab':             { id: 'darab-foundling',      zar: 32,  name: 'Darab — The Foundling Prince' },
    'dara':              { id: 'dara-last',             zar: 72,  name: 'Dara — Last of the Achaemenids' },
    'alexander':         { id: 'eskandar',             zar: 105, name: 'Eskandar — The Two-Horned' },
    'ashkanian-age':     { id: 'ashk-founder',         zar: 80,  name: 'Arsaces — Founder of Arsacids' },
    'ardavan':           { id: 'ardavan-last',          zar: 82,  name: 'Ardavan — The Last Arsacid' },
    'ardeshir':          { id: 'ardeshir-founder',     zar: 88,  name: 'Ardeshir — Founder of Sassan' },
    'shapur':            { id: 'shapur-great',          zar: 100, name: 'Shapur the Great' },
    'bahram-gur':        { id: 'bahram-gur',            zar: 105, name: 'Bahram Gur — The Lion Hunter' },
    'yazdegerd-sinner':  { id: 'yazdegerd-sinner',     zar: 88,  name: 'Yazdegerd — The Tolerant King' },
    'bahram-chubin':     { id: 'bahram-chubin',         zar: 95,  name: 'Bahram Chubin — The Rebel General' },
    'anushirvan':        { id: 'anushirvan',             zar: 155, name: 'Anushirvan — The Just' },
    'nushzad':           { id: 'nushzad',                 zar: 65,  name: 'Nushzad — The Rebel Prince' },
    'hormuz':            { id: 'hormuz-iv',              zar: 75,  name: 'Hormuz — The Crumbling Crown' },
    'khosrow-parviz':    { id: 'khosrow-parviz',        zar: 120, name: 'Khosrow Parviz — The Conqueror' },
    /* ch43–50 */
    'shirin':            { id: 'shirin',                  zar: 145, name: 'Shirin — Queen of Love' },
    'crumbling-crown':   { id: 'purandokht',              zar: 110, name: 'Purandokht — The Warrior Queen' },
    'yazdegerd-iii':     { id: 'yazdegerd-iii',           zar: 155, name: 'Yazdegerd III — The Last King' },
    'arab-conquest':     { id: 'rustam-farrokhzad',       zar: 165, name: 'Rustam Farrokhzad — The Last Wall' },
    'mourning-pars':     { id: 'piruz-resistance',        zar: 125, name: 'Piruz — The Undying Resistance' },
    'memory-over-sword': { id: 'ferdowsi-writing',        zar: 130, name: 'Ferdowsi — The Poem Against Forgetting' },
    'ferdowsi-legacy':   { id: 'ferdowsi-complete',       zar: 175, name: 'Ferdowsi — The Poem Is Finished' },
    'ages-end':          { id: 'farr-of-iran',            zar: 200, name: 'The Farr of Iran — Eternal' },
  };

  /* Grant the chapter's hero card reward — uses its own key so it can be
     called retroactively for chapters completed before this reward existed. */
  const grantChapterCard = () => {
    const cardReward = CHAPTER_CARD_REWARDS[SLUG];
    if (!cardReward) return;
    const cardKey = `real_chapter_card_done_${SLUG}`;
    try { if (localStorage.getItem(cardKey) === "1") return; } catch {}
    try {
      const owned = JSON.parse(localStorage.getItem("real_owned_heroes_v1") || "{}");
      if (!owned[cardReward.id]) {
        owned[cardReward.id] = { level: 1, zar_per_hour: cardReward.zar };
        localStorage.setItem("real_owned_heroes_v1", JSON.stringify(owned));
        setTimeout(() => toast(`🃏 Hero Card Earned: ${cardReward.name}!`), 3200);
        try {
          const u = window.Telegram && window.Telegram.WebApp
            && window.Telegram.WebApp.initDataUnsafe
            && window.Telegram.WebApp.initDataUnsafe.user;
          if (u && u.id) {
            fetch("/api/season2/user/grant-hero", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ telegram_id: String(u.id), hero_id: cardReward.id, zar_per_hour: cardReward.zar, source: "chapter_reward" }),
              keepalive: true,
            });
          }
        } catch (_) {}
      }
      localStorage.setItem(cardKey, "1");
    } catch (_) {}
  };

  const grantChapterCompletionRewards = () => {
    const doneKey = `real_chapter_rewards_done_${SLUG}`;
    try { if (localStorage.getItem(doneKey) === "1") return; } catch {}
    const meta = _chapterMeta;
    if (!meta || !meta.rewards) return;
    try {
      const r = meta.rewards;
      if (window.RealPlayer) {
        if (r.xp)     window.RealPlayer.addResource("xp",     r.xp);
        if (r.gems)   window.RealPlayer.addResource("gems",   r.gems);
        if (r.farr)   window.RealPlayer.addResource("farr",   r.farr);
        if (r.real)   window.RealPlayer.addResource("real",   r.real);
        if (r.energy) window.RealPlayer.addResource("energy", Math.min(r.energy,
          (window.RealPlayer.get().energyMax || 1000) - (window.RealPlayer.get().energy || 0)));
      }
      localStorage.setItem(doneKey, "1");
      /* Dispatch events so home treasury and heroes page refresh instantly */
      try { window.dispatchEvent(new CustomEvent("shahnama:state_sync",
        { detail: window.RealPlayer ? window.RealPlayer.get() : {} })); } catch {}
      try { window.dispatchEvent(new CustomEvent("balanceUpdate")); } catch {}
      /* Flash a toast so the player knows what they earned */
      const parts = [
        r.xp    ? `+${fmtNum(r.xp)} XP`    : "",
        r.gems  ? `+${fmtNum(r.gems)} 💎`  : "",
        r.farr  ? `+${fmtNum(r.farr)} ✦ Farr` : "",
        r.real  ? `+${fmtNum(r.real)} REAL` : "",
      ].filter(Boolean);
      if (parts.length) toast(`⚔ Chapter Rewards: ${parts.join(" · ")}`);
    } catch {}

    /* Auto-unlock tap icon skin tied to this chapter */
    const CHAPTER_SKIN_UNLOCKS = {
      keyumars: "keyumars", hushang: "hushang", zahhak: "zahhak",
      rostam: "rostam", simorgh: "simorgh",
    };
    const skinId = CHAPTER_SKIN_UNLOCKS[SLUG];
    if (skinId) {
      try {
        const key = "real_skin_unlocked_v1";
        const unlocked = JSON.parse(localStorage.getItem(key) || "[]");
        if (!unlocked.includes(skinId)) {
          unlocked.push(skinId);
          localStorage.setItem(key, JSON.stringify(unlocked));
          setTimeout(() => toast(`🎭 Tap icon unlocked: ${skinId}! Find it in Inventory.`), 2600);
        }
      } catch {}
    }
    /* Hero card chapter reward */
    grantChapterCard();
    /* pushProgress intentionally omitted here — markChapterComplete calls it
       once after all localStorage writes (done flag + rewards + skins) are done. */
  };

  /* Grant farr for completing a quiz tier — idempotent per tier per chapter */
  const FARR_PER_TIER = { easy: 0, medium: 1, hard: 2 };

  const grantTierFarr = (tier) => {
    const farr = FARR_PER_TIER[tier] || 0;
    if (!farr) return;
    const key = `real_quiz_farr_granted_${SLUG}_${tier}`;
    try { if (localStorage.getItem(key) === "1") return; } catch {}
    if (window.RealPlayer) {
      window.RealPlayer.addResource("farr", farr);
      try { localStorage.setItem(key, "1"); } catch {}
      try { window.dispatchEvent(new CustomEvent("balanceUpdate")); } catch {}
      try { window.dispatchEvent(new CustomEvent("shahnama:state_sync",
        { detail: window.RealPlayer.get() })); } catch {}
      toast(`✦ +${farr} Farr — ${tier === "hard" ? "Mastery" : "Scholar"} reward`);
      pushProgress();
    }
  };

  /* ---------- Ferdowsi's Desk ---------- */
  const paintFerdowsiDesk = (meta) => {
    const head      = $("[data-desk-head]");
    const container = $("[data-desk-container]");
    const statusEl  = $("[data-desk-status]");
    if (!head || !container) return;

    const chronicle = meta && meta.ferdowsi_chronicle;
    if (!chronicle) { head.style.display = "none"; container.innerHTML = ""; return; }

    /* Expose for paintBattle's desk requirement check */
    window._chapterFerdowsiChronicle = chronicle;

    head.style.display = "";
    const isRead = !!progress.desk_read;
    if (statusEl) statusEl.textContent = isRead ? tr("desk_status_read") : "";

    const lang  = curLang();
    const pick3 = (key) => {
      if (lang !== "en" && chronicle[key + "_" + lang]) return chronicle[key + "_" + lang];
      return chronicle[key] || "";
    };

    container.innerHTML = `
      <div class="desk-card card ${isRead ? "desk-card-done" : ""}">
        <div class="desk-card-left">
          <span class="desk-card-icon">${isRead ? "✦" : "🪶"}</span>
        </div>
        <div class="desk-card-body">
          <div class="desk-card-kicker">${escapeHtml(tr("desk_card_kicker"))}</div>
          <div class="desk-card-title">${escapeHtml(tr("desk_card_title"))}</div>
          <div class="desk-card-meta">
            <span>${escapeHtml(chronicle.year || "")}</span>
            <span>${escapeHtml(tr("desk_age_tpl", { age: chronicle.age || "" }))}</span>
          </div>
          <p class="desk-card-preview">${escapeHtml(pick3("historical_context").split(".")[0] + ".")}</p>
        </div>
        <div class="desk-card-arrow">${curLang() === "fa" ? "‹" : "›"}</div>
      </div>`;

    container.querySelector(".desk-card").addEventListener("click", () => {
      openDeskModal(chronicle, meta);
    });
  };

  const openDeskModal = (chronicle, meta) => {
    const modal    = $("[data-desk-modal]");
    const card     = $("[data-desk-palette]", modal);
    if (!modal || !card) return;

    const palette  = chronicle.palette || "normal";
    card.setAttribute("data-desk-palette", palette);

    const lang  = curLang();
    const pick3 = (key) => {
      if (lang !== "en" && chronicle[key + "_" + lang]) return chronicle[key + "_" + lang];
      return chronicle[key] || "";
    };

    $("[data-desk-year]",       modal).textContent = chronicle.year || "";
    $("[data-desk-age]",        modal).textContent = tr("desk_age_tpl", { age: chronicle.age || "" });
    $("[data-desk-historical]", modal).textContent = pick3("historical_context");
    $("[data-desk-challenge]",  modal).textContent = pick3("personal_challenge");
    $("[data-desk-impact]",     modal).textContent = pick3("lore_impact");

    const readBtn = $("[data-desk-read-btn]", modal);
    if (readBtn) {
      readBtn.textContent = progress.desk_read
        ? tr("desk_read_done")
        : tr("desk_read_btn");
      readBtn.onclick = () => {
        if (!progress.desk_read) {
          progress.desk_read = true;
          saveProgress();
          /* Grant a small XP reward for reading the desk */
          if (window.RealPlayer) {
            window.RealPlayer.addResource("xp", 50);
            try { window.dispatchEvent(new CustomEvent("balanceUpdate")); } catch {}
          }
          toast(tr("desk_read_toast"));
        }
        closeDeskModal();
        /* Refresh battle requirements panel */
        paintFerdowsiDesk(meta);
        if (window._modalLore) paintBattle(window._modalLore);
      };
    }

    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    haptic("light");
  };

  const closeDeskModal = () => {
    const modal = $("[data-desk-modal]");
    if (!modal) return;
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  $$("[data-desk-close]").forEach(el => el.addEventListener("click", closeDeskModal));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $("[data-desk-modal]").getAttribute("aria-hidden") === "false")
      closeDeskModal();
  });

  /* ---------- quiz ---------- */
  /* ── Quiz tier definitions ── */
  const TIERS = ["easy", "medium", "hard"];
  const TIER_ICONS = { easy: "🏆", medium: "⚔", hard: "👑" };
  const TIER_LABEL_KEY = { easy: "difficulty_easy", medium: "difficulty_medium", hard: "difficulty_hard" };

  const paintQuiz = (lore, allQuizzes) => {
    const host   = $("[data-quiz]");
    const progEl = $("[data-quiz-progress]");
    if (!host) return;

    /* Split questions by difficulty */
    const byDiff = (d) => (allQuizzes || [])
      .filter(q => q.chapter_slug === SLUG && (q.difficulty || "easy").toLowerCase() === d)
      .sort((a, b) => (a.quiz_part || 0) - (b.quiz_part || 0));
    const tierQs = { easy: byDiff("easy"), medium: byDiff("medium"), hard: byDiff("hard") };

    if (!TIERS.some(d => tierQs[d].length)) {
      host.innerHTML = `<p class="copy" style="color:var(--muted);">${escapeHtml(tr("quiz_no_published"))}</p>`;
      if (progEl) progEl.textContent = `${fmtNum(0)} / ${fmtNum(0)}`;
      return;
    }

    /* ── Migrate legacy flat quiz state ── */
    if (progress.quiz && typeof progress.quiz.done === "boolean") {
      const wasDone = progress.quiz.done;
      progress.quiz = {
        easy:   { idx: progress.quiz.idx || 0, correct: progress.quiz.correct || [], wrong: progress.quiz.wrong || [], done: wasDone },
        medium: { idx: 0, correct: [], wrong: [], done: false, locked: !wasDone },
        hard:   { idx: 0, correct: [], wrong: [], done: false, locked: true },
      };
      if (wasDone) {
        try { localStorage.setItem(`real_quiz_${SLUG}_easy`, "passed"); } catch {}
      }
      saveProgress();
    }

    /* Ensure all tier keys exist */
    TIERS.forEach(d => {
      if (!progress.quiz[d]) progress.quiz[d] = { idx: 0, correct: [], wrong: [], done: false, locked: d !== "easy" };
    });

    /* Propagate unlocks */
    if (progress.quiz.easy.done   && progress.quiz.medium.locked) { progress.quiz.medium.locked = false; saveProgress(); }
    if (progress.quiz.medium.done && progress.quiz.hard.locked)   { progress.quiz.hard.locked   = false; saveProgress(); }

    /* Active tier — persisted on the host element across repaints */
    const firstIncomplete = TIERS.find(d => !progress.quiz[d].done) || "hard";
    if (!host.dataset.activeTier || !TIERS.includes(host.dataset.activeTier))
      host.dataset.activeTier = firstIncomplete;
    let activeTier = host.dataset.activeTier;

    const syncProgEl = () => {
      if (!progEl) return;
      const tp = progress.quiz[activeTier];
      const tq = tierQs[activeTier];
      progEl.textContent = `${fmtNum((tp.correct || []).length)} / ${fmtNum(tq.length)}`;
    };
    syncProgEl();

    /* ── Tier tab strip (shown once easy is done) ── */
    const tierTabsHTML = () => {
      if (!progress.quiz.easy.done) return "";
      return `<div class="quiz-tier-tabs">${TIERS.map(d => {
        const tp = progress.quiz[d];
        const isActive = d === activeTier;
        const ico = tp.done ? "✓ " : tp.locked ? "🔒 " : "";
        return `<button class="quiz-tier-tab${isActive ? " active" : ""}${tp.done ? " done" : ""}${tp.locked ? " locked" : ""}"
          data-tier="${d}" ${tp.locked ? "disabled" : ""} aria-pressed="${isActive}">
          ${ico}${escapeHtml(tr(TIER_LABEL_KEY[d]))}
        </button>`;
      }).join("")}</div>`;
    };

    const wireTierTabs = () => {
      $$("[data-tier]", host).forEach(btn => {
        if (btn.dataset.wired) return;
        btn.dataset.wired = "1";
        btn.addEventListener("click", () => {
          const d = btn.getAttribute("data-tier");
          if (!d || btn.disabled) return;
          activeTier = d;
          host.dataset.activeTier = activeTier;
          syncProgEl();
          render();
        });
      });
    };

    /* ── Main render ── */
    const render = () => {
      const tp = progress.quiz[activeTier];
      const qs = tierQs[activeTier];

      /* Tier results screen */
      if (tp.done) {
        if (activeTier === "easy") { grantQuizRewards(lore); paintBattle(lore); }

        let nCorrect = (tp.correct || []).filter(id => qs.some(q => q.id === id)).length;
        const total  = qs.length;
        /* Backward-compat: old saves where all answered correctly also count as passed */
        const passed = tp.passed !== undefined ? tp.passed : (nCorrect / Math.max(total, 1) >= 0.6);
        /* If IDs from old stub questions no longer match current set, nCorrect is 0
           even though the player passed. Show the minimum plausible passing score. */
        if (passed && total > 0 && nCorrect / total < 0.6) nCorrect = Math.ceil(total * 0.6);

        /* Grant farr only on pass */
        if (passed) grantTierFarr(activeTier);

        const totalReward = qs.reduce((acc, q) => {
          acc.xp   += (q.reward && q.reward.xp)   || 0;
          acc.real += (q.reward && q.reward.real) || 0;
          return acc;
        }, { xp: 0, real: 0 });

        const nextTier  = activeTier === "easy" ? "medium" : activeTier === "medium" ? "hard" : null;
        const nextAvail = nextTier && !progress.quiz[nextTier].done && !progress.quiz[nextTier].locked && tierQs[nextTier].length;

        host.innerHTML = `
          ${tierTabsHTML()}
          <div class="quiz-complete ${passed ? "quiz-result-pass" : "quiz-result-fail"}">
            <div class="quiz-score-ring">
              <span class="qsr-num">${fmtNum(nCorrect)}</span>
              <span class="qsr-sep">/</span>
              <span class="qsr-total">${fmtNum(total)}</span>
            </div>
            <div class="quiz-verdict ${passed ? "qv-pass" : "qv-fail"}">
              ${escapeHtml(passed ? tr("quiz_passed") : tr("quiz_failed"))}
            </div>
            <div class="quiz-rewards" style="margin-top:10px;">
              ${totalReward.xp   ? `<span class="reward-pill">${escapeHtml(tr("quiz_xp_earned", { xp: fmtNum(totalReward.xp) }))}</span>` : ""}
              ${totalReward.real ? `<span class="reward-pill">+${fmtNum(totalReward.real)} REAL</span>` : ""}
            </div>
            ${nextAvail && passed ? `
              <button class="primary-btn btn-block" data-next-tier="${nextTier}" style="margin-top:14px;">
                ${escapeHtml(tr("quiz_start_next_tier", { tier: tr(TIER_LABEL_KEY[nextTier]) }))}
              </button>` : ""}
            ${!passed ? `
              <button class="ghost-btn btn-block quiz-retry-btn" style="margin-top:14px;">
                ${escapeHtml(tr("quiz_retry_btn"))}
              </button>` : ""}
            ${activeTier === "easy" && passed ? `
              <a href="learn.html" class="ghost-btn btn-block"
                 style="margin-top:8px;display:flex;align-items:center;justify-content:center;text-decoration:none;">
                ${escapeHtml(tr("quiz_return_journey"))}
              </a>` : ""}
          </div>`;

        wireTierTabs();
        const nextBtn = $("[data-next-tier]", host);
        if (nextBtn) nextBtn.addEventListener("click", () => {
          activeTier = nextBtn.getAttribute("data-next-tier");
          host.dataset.activeTier = activeTier;
          syncProgEl();
          render();
        });
        const retryBtn = $(".quiz-retry-btn", host);
        if (retryBtn) retryBtn.addEventListener("click", async () => {
          retryBtn.disabled = true;
          const ok = await resetQuizTier(activeTier);
          if (!ok) {
            retryBtn.disabled = false;
            toast(tr("quiz_network_error"));
            return;
          }
          progress.quiz[activeTier] = { idx: 0, correct: [], wrong: [], done: false, locked: progress.quiz[activeTier].locked };
          saveProgress();
          syncProgEl();
          render();
        });
        return;
      }

      /* Questions */
      if (!qs.length) {
        host.innerHTML = `${tierTabsHTML()}<p class="copy" style="color:var(--muted);padding:14px 0;">
          ${escapeHtml(tr("quiz_no_published"))}</p>`;
        wireTierTabs();
        return;
      }

      const i  = tp.idx || 0;
      const q  = qs[i];
      if (!q) return;

      const qText = pick(q, "question") || q.question || "";
      const lang  = curLang();
      const localAnswers = lang !== "en" && Array.isArray(q["answers_" + lang]) ? q["answers_" + lang] : null;
      const answers     = localAnswers || (q.answers || []);
      const explanation = pick(q, "explanation") || q.explanation || tr("quiz_correct_default");
      const xpVal   = (q.reward && q.reward.xp)   || 0;
      const realVal = (q.reward && q.reward.real) || 0;

      host.innerHTML = `
        ${tierTabsHTML()}
        <div class="quiz-q-num" style="font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:var(--muted);">
          ${escapeHtml(tr("quiz_question_of", { i: fmtNum(i + 1), n: fmtNum(qs.length) }))}
        </div>
        <h4 class="quiz-q">${escapeHtml(qText)}</h4>
        <div class="quiz-options">
          ${answers.map((a, ai) => `<button class="quiz-opt" data-opt="${ai}">${escapeHtml(a)}</button>`).join("")}
        </div>
        <div class="quiz-foot">
          <span>+${fmtNum(xpVal)} ${tr("r_xp")} · +${fmtNum(realVal)} REAL</span>
          <span>${escapeHtml(tr(TIER_LABEL_KEY[q.difficulty] || TIER_LABEL_KEY.easy))}</span>
        </div>`;

      wireTierTabs();

      $$(".quiz-opt", host).forEach(btn => {
        btn.addEventListener("click", async () => {
          /* Prevent double-answer */
          $$(".quiz-opt", host).forEach(b => { b.disabled = true; });

          const picked = parseInt(btn.getAttribute("data-opt"), 10);

          /* Server grades the answer now (lib/quizCatalog.js) — the client
             no longer self-reports correctness/done/passed. On network
             failure, re-enable the buttons and let the player retry the
             click rather than silently falling back to local trust. */
          const result = await submitQuizAnswer(q.id, picked);
          if (!result) {
            $$(".quiz-opt", host).forEach(b => { b.disabled = false; });
            toast(tr("quiz_network_error"));
            return;
          }
          const { correct } = result;

          if (correct) {
            tp.correct = Array.from(new Set([...(tp.correct || []), q.id]));
            haptic("success");
            /* Grant per-question rewards (idempotent) */
            const qGrantKey = `real_quiz_q_granted_${SLUG}_${q.id}`;
            if (localStorage.getItem(qGrantKey) !== "1") {
              if (xpVal && window.RealPlayer)   window.RealPlayer.addResource("xp",  xpVal);
              if (realVal && window.RealPlayer)  window.RealPlayer.addResource("real", realVal);
              try { localStorage.setItem(qGrantKey, "1"); } catch {}
              try { window.dispatchEvent(new CustomEvent("balanceUpdate")); } catch {}
            }
          } else {
            tp.wrong = Array.from(new Set([...(tp.wrong || []), q.id]));
            haptic("warning");
          }

          /* Always advance — no per-answer colour feedback. done/passed/idx
             come from the server's verdict, not a local recomputation. */
          tp.idx    = result.idx;
          tp.done   = result.done;
          tp.passed = result.passed;
          const next = tp.idx;
          if (tp.done) {
            saveProgress();
            try { localStorage.setItem(`real_quiz_${SLUG}_${activeTier}`, tp.passed ? "passed" : "attempted"); } catch {}
            if (activeTier === "easy") {
              grantQuizRewards(lore);
              if (progress.quiz.medium) progress.quiz.medium.locked = false;
              saveProgress();
              paintBattle(lore);
            } else if (activeTier === "medium") {
              if (progress.quiz.hard) progress.quiz.hard.locked = false;
              saveProgress();
              paintBattle(lore);
            } else if (activeTier === "hard") {
              paintBattle(lore);
            }
            if (progEl) progEl.textContent = `${fmtNum(next)} / ${fmtNum(qs.length)}`;
          } else {
            saveProgress();
            if (progEl) progEl.textContent = `${fmtNum(next)} / ${fmtNum(qs.length)}`;
          }
          render();
        });
      });
    };

    render();
  };

  /* ---------- scene reader modal ---------- */
  const SCENE_EMOJI = {
    "dark":  "☾",
    "dawn":  "☀",
    "fated": "✶",
    "warm":  "🔥",
    "wild":  "🐾",
    "court": "👑"
  };

  let currentScenes = [];
  let sceneIdx = 0;
  let modalLore = null;

  const openScene = (i) => {
    sceneIdx = i;
    const modal = $("[data-scene-modal]");
    if (!modal) return;
    paintSceneModal();
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    haptic("light");
  };

  const closeScene = () => {
    const modal = $("[data-scene-modal]");
    if (!modal) return;
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  const paintSceneModal = () => {
    const s = currentScenes[sceneIdx];
    if (!s) return;
    const eraEl   = $("[data-scene-era]");
    const titleEl = $("[data-scene-title]");
    const titleFa = $("[data-scene-title-fa]");
    const textEl  = $("[data-scene-text]");
    const imgHost = $("[data-scene-image]");
    const rewardEl = $("[data-scene-reward]");
    const xpEl     = $("[data-scene-xp]");
    const codexMeta = $("[data-scene-codex-meta]");
    const prevBtn = $("[data-scene-prev]");
    const nextBtn = $("[data-scene-next]");

    const isFa = curLang() === "fa";
    eraEl.textContent   = "🕰 " + pick(s, "era");
    titleEl.textContent = isFa
      ? (s.title_fa || s.title_en || "")
      : (s.title_en || "");
    // Show the parallel-language title underneath; in FA mode show EN underneath, otherwise FA.
    titleFa.textContent = isFa
      ? (s.title_en || "")
      : (s.title_fa || "");
    textEl.textContent  = pick(s, "body");

    // Reset image host then build fresh — atmosphere class drives the gradient.
    imgHost.className = `scene-modal-image atmos-${s.atmosphere || "dawn"}`;
    imgHost.innerHTML = `<span class="scene-placeholder">${escapeHtml(tr("image_coming_soon"))}</span>`;
    if (s.video_url) {
      const placeholder = imgHost.querySelector(".scene-placeholder");
      if (placeholder) placeholder.hidden = true;
      // Google Drive share/view URLs → use preview iframe for reliable playback
      const gdMatch = s.video_url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (gdMatch) {
        const iframe = document.createElement("iframe");
        iframe.src = `https://drive.google.com/file/d/${gdMatch[1]}/preview`;
        iframe.title = s.title_en || "";
        iframe.allow = "autoplay; fullscreen; encrypted-media";
        iframe.allowFullscreen = true;
        imgHost.appendChild(iframe);
      } else {
        // Direct video URL — HTML5 video
        // video_audio:true → keep sound, show controls (no muted)
        // default         → silent background loop (autoplay muted)
        const video = document.createElement("video");
        video.src = s.video_url;
        video.loop = true;
        video.playsInline = true;
        if (s.video_audio) {
          video.controls = true;
          video.autoplay = true;   // will play if browser permits; controls shown as fallback
        } else {
          video.autoplay = true;
          video.muted = true;
        }
        if (s.image) video.poster = s.image;
        imgHost.appendChild(video);
      }
    } else if (s.image) {
      const img = document.createElement("img");
      img.alt = "";
      img.src = s.image;
      img.onerror = () => {
        img.classList.add("img-fail");
        console.warn(`[chapter:${SLUG}] scene "${s.id}" hero image missing: ${s.image}`);
      };
      imgHost.appendChild(img);
    }

    // Mark scene as read + unlock codex
    const wasRead = progress.scenes.includes(s.id);
    if (!wasRead) {
      progress.scenes.push(s.id);
      const newlyUnlocked = (s.unlocks_codex || []).filter(id => !progress.codex.includes(id));
      progress.codex.push(...newlyUnlocked);

      /* Mark the daily Read quest done — idempotent per day.
         chapter.js is the primary scene-reading experience; must set this
         so the home-page daily quest reflects actual reading activity. */
      try {
        const dk = new Date().toISOString().slice(0, 10);
        const rKey = `real_quest_read_${dk}`;
        if (localStorage.getItem(rKey) !== "true") {
          localStorage.setItem(rKey, "true");
          if (window.RealSync) window.RealSync.syncQuest("read");
          try { window.dispatchEvent(new CustomEvent("real:quest:read", { detail: { xp: 25 } })); } catch {}
        }
      } catch {}
      saveProgress();

      // Grant XP for this scene (idempotent via grant key)
      const xpAmount = (s.reward && s.reward.xp) || 0;
      const sceneGrantKey = `real_scene_xp_granted_${SLUG}_${s.id}`;
      if (xpAmount && window.RealPlayer && localStorage.getItem(sceneGrantKey) !== "1") {
        window.RealPlayer.addResource("xp", xpAmount);
        try { localStorage.setItem(sceneGrantKey, "1"); } catch {}
        try { window.dispatchEvent(new CustomEvent("balanceUpdate")); } catch {}
      }

      // show reward burst
      rewardEl.hidden = false;
      xpEl.textContent = fmtNum(xpAmount);
      codexMeta.textContent = newlyUnlocked.length
        ? (newlyUnlocked.length === 1
            ? tr("ch_codex_one_entry")
            : tr("ch_codex_n_entries", { n: fmtNum(newlyUnlocked.length) }))
        : tr("ch_scene_completed");
      // re-paint sections affected by scene completion
      paintScenes(modalLore);
      paintBattle(modalLore);
    } else {
      rewardEl.hidden = true;
    }

    prevBtn.disabled = sceneIdx === 0;
    nextBtn.textContent = sceneIdx === currentScenes.length - 1
      ? tr("ch_close")
      : tr("ch_next_scene");
  };

  /* ---------- bind modal controls ---------- */
  $$("[data-scene-close]").forEach(el =>
    el.addEventListener("click", closeScene)
  );
  $("[data-scene-prev]").addEventListener("click", () => {
    if (sceneIdx > 0) { sceneIdx--; paintSceneModal(); }
  });
  $("[data-scene-next]").addEventListener("click", () => {
    if (sceneIdx < currentScenes.length - 1) { sceneIdx++; paintSceneModal(); }
    else closeScene();
  });
  document.addEventListener("keydown", (e) => {
    const open = $("[data-scene-modal]").getAttribute("aria-hidden") === "false";
    if (!open) return;
    if (e.key === "Escape") closeScene();
    else if (e.key === "ArrowLeft" && sceneIdx > 0) { sceneIdx--; paintSceneModal(); }
    else if (e.key === "ArrowRight" && sceneIdx < currentScenes.length - 1) { sceneIdx++; paintSceneModal(); }
  });

  /* ---------- replay intro ---------- */
  $("[data-replay-intro]").addEventListener("click", () => {
    location.href = `intro.html`;
  });

  /* ---------- bootstrap: fetch all sources in parallel ----------
     Server chapter progress must land before the gate check + render so a
     device with evicted localStorage sees its real journey. Capped at 4s —
     if the API is slow/unreachable we fall back to the local cache. */
  const progressSync = (window.RealSync && window.RealSync.chapterProgressReady)
    ? Promise.race([window.RealSync.chapterProgressReady(), new Promise(r => setTimeout(r, 4000))])
    : Promise.resolve(null);

  Promise.all([
    fetch("/season2/data/chapters.json", { cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(`/season2/data/lore/${encodeURIComponent(SLUG)}.json`, { cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(`/season2/data/quizzes/${encodeURIComponent(SLUG)}.json`, { cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null),
    progressSync
  ]).then(([chaptersBody, lore, quizzesBody]) => {
    /* Re-read progress now that sync.js may have merged server state into
       localStorage (the module-level object was built before that). */
    Object.assign(progress, readProgress());

    const allChapters = (chaptersBody && chaptersBody.chapters) || [];
    const chapterMeta = allChapters.find(c => c.slug === SLUG) || null;
    _chapterMeta = chapterMeta; // expose to grantChapterCompletionRewards()
    const quizzes = (quizzesBody && quizzesBody.quizzes) || [];
    _quizzes = quizzes;

    /* ── Hard chapter gate ── */
    const reqPrev = chapterMeta && chapterMeta.required_previous_chapter;
    if (reqPrev && localStorage.getItem(`real_chapter_done_${reqPrev}`) !== "1") {
      const prevMeta = allChapters.find(c => c.slug === reqPrev);
      const prevTitle = (curLang() === "fa" && prevMeta && prevMeta.title_fa)
        ? prevMeta.title_fa : (prevMeta && prevMeta.title) || reqPrev;
      const gate = document.getElementById("chapter-gate");
      if (gate) {
        gate.hidden = false;
        gate.innerHTML = `
          <div class="cg-inner">
            <div class="cg-lock">🔒</div>
            <h2 class="cg-title">${escapeHtml(tr("gate_locked_title"))}</h2>
            <p class="cg-msg">${escapeHtml(tr("gate_locked_msg", { chapter: prevTitle }))}</p>
            <a href="chapter.html?slug=${encodeURIComponent(reqPrev)}" class="primary-btn cg-btn">
              ${escapeHtml(tr("gate_go_prev", { chapter: prevTitle }))}
            </a>
            <a href="learn.html" class="ghost-btn cg-btn" style="margin-top:8px;">
              ${escapeHtml(tr("gate_back_journey"))}
            </a>
          </div>`;
        /* Hide the rest of the page content */
        $$("section, .ch-lore, .section-head, .scene-list, .battle-card, .quiz-card, .ch-crumbs", document.querySelector("main")).forEach(el => { el.hidden = true; });
      }
      return;
    }

    if (!lore) {
      console.error(`[chapter:${SLUG}] lore JSON missing — expected /season2/data/lore/${SLUG}.json`);
      $("[data-summary]").textContent = tr("ch_no_lore");
      return;
    }
    currentScenes = lore.scenes || [];
    modalLore = lore;
    window._modalLore = lore;
    render({ chapterMeta, lore, quizzes });

    /* ── Refresh Final Encounter checks with authoritative server state ──
       farr/owned-hero requirements read localStorage, which Telegram's
       WebView can evict — players who met them server-side were wrongly
       blocked. Re-paint once RealSync delivers fresh balances + heroes. */
    if (window.RealSync) {
      if (window.RealSync.ready)      window.RealSync.ready().then(() => paintBattle(lore));
      if (window.RealSync.syncHeroes) window.RealSync.syncHeroes().then(() => paintBattle(lore));
    }
    window.addEventListener("balanceUpdate", () => paintBattle(lore));

    /* ── Retroactive catch-up ─────────────────────────────────────────────
       Grants XP/REAL owed from scenes and quiz questions that were completed
       before the grant bug was fixed.  Idempotent: each grant key is written
       once so this is safe to run on every page load.                      */
    let retroXp = 0, retroReal = 0;

    // Scenes already read but never rewarded
    const readSet = new Set(progress.scenes || []);
    (lore.scenes || []).forEach((sc) => {
      const gk = `real_scene_xp_granted_${SLUG}_${sc.id}`;
      if (readSet.has(sc.id) && localStorage.getItem(gk) !== "1") {
        retroXp += (sc.reward && sc.reward.xp) || 0;
        try { localStorage.setItem(gk, "1"); } catch {}
      }
    });

    // Quiz questions already answered correctly but never rewarded
    ["easy", "medium", "hard"].forEach((tier) => {
      const tp = progress.quiz && progress.quiz[tier];
      if (!tp) return;
      (tp.correct || []).forEach((qid) => {
        const gk = `real_quiz_q_granted_${SLUG}_${qid}`;
        if (localStorage.getItem(gk) !== "1") {
          const qObj = quizzes.find((q) => q.id === qid);
          if (qObj) {
            retroXp  += (qObj.reward && qObj.reward.xp)   || 0;
            retroReal += (qObj.reward && qObj.reward.real) || 0;
          }
          try { localStorage.setItem(gk, "1"); } catch {}
        }
      });
    });

    // Farr owed from completed quiz tiers (retroactive for tiers done before farr was implemented)
    let retroFarr = 0;
    ["easy", "medium", "hard"].forEach((tier) => {
      const tp = progress.quiz && progress.quiz[tier];
      if (!tp || !tp.done) return;
      const farrKey = `real_quiz_farr_granted_${SLUG}_${tier}`;
      if (localStorage.getItem(farrKey) !== "1") {
        retroFarr += FARR_PER_TIER[tier] || 0;
        try { localStorage.setItem(farrKey, "1"); } catch {}
      }
    });

    // Chapter completion farr (retroactive)
    const chapterFarrKey = `real_chapter_farr_retro_${SLUG}`;
    if (localStorage.getItem(`real_chapter_rewards_done_${SLUG}`) === "1"
        && localStorage.getItem(chapterFarrKey) !== "1"
        && _chapterMeta && _chapterMeta.rewards && _chapterMeta.rewards.farr) {
      retroFarr += _chapterMeta.rewards.farr;
      try { localStorage.setItem(chapterFarrKey, "1"); } catch {}
    }

    // Hero card for chapters completed before this reward existed
    if (localStorage.getItem(`real_chapter_rewards_done_${SLUG}`) === "1") {
      grantChapterCard();
    }

    if ((retroXp || retroReal || retroFarr) && window.RealPlayer) {
      if (retroXp)   window.RealPlayer.addResource("xp",   retroXp);
      if (retroReal) window.RealPlayer.addResource("real",  retroReal);
      if (retroFarr) window.RealPlayer.addResource("farr",  retroFarr);
      try { window.dispatchEvent(new CustomEvent("balanceUpdate")); } catch {}
      const parts = [
        retroXp   ? `+${fmtNum(retroXp)} XP`       : "",
        retroFarr ? `+${fmtNum(retroFarr)} ✦ Farr` : "",
        retroReal ? `+${fmtNum(retroReal)} REAL`    : "",
      ].filter(Boolean);
      if (parts.length) toast(`⚔ Rewards restored: ${parts.join(" · ")}`);
    }
  });
})();
