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
    { scenes: [], codex: [], quiz: _defaultQuiz(), fragments: 0 },
    readProgress()
  );

  const saveProgress = () => writeProgress(progress);

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
          <div class="era">${escapeHtml(pick(s, "era"))}</div>
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

    const reqs = battle.requirements || [];
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
        // New tier format: easy tier must be done
        if (progress.quiz && progress.quiz.easy !== undefined)
          return !!(progress.quiz.easy && progress.quiz.easy.done);
        // Legacy flat format fallback
        return !!(progress.quiz && progress.quiz.done);
      }
      return false;
    };

    const pillKey = {
      level: "req_player_gate",
      character: "req_recruit",
      item: "req_item",
      quiz: "req_knowledge",
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
    const ctaLabel = allMet
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
      <button class="battle-cta ${allMet ? "ready" : ""}" data-battle-cta ${allMet ? "" : "disabled"}>
        ${escapeHtml(ctaLabel)}
      </button>
    `;

    const cta = $("[data-battle-cta]", host);
    if (cta) {
      cta.addEventListener("click", () => {
        if (!allMet) return;
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
    try { localStorage.setItem(`real_chapter_done_${SLUG}`, "1"); } catch {}
    try {
      const items = JSON.parse(localStorage.getItem("real_items_v1") || "{}");
      let changed = false;
      ((lore && lore.battle && lore.battle.requirements) || [])
        .filter(r => r.kind === "item" && r.grant_on === "quiz" && !items[r.target])
        .forEach(r => { items[r.target] = true; changed = true; });
      if (changed) localStorage.setItem("real_items_v1", JSON.stringify(items));
    } catch {}
  };

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

      /* Tier mastered screen (no replay) */
      if (tp.done) {
        if (activeTier === "easy") { grantQuizRewards(lore); paintBattle(lore); }

        const totalReward = qs.reduce((acc, q) => {
          acc.xp   += (q.reward && q.reward.xp)   || 0;
          acc.real += (q.reward && q.reward.real) || 0;
          return acc;
        }, { xp: 0, real: 0 });

        const nextTier = activeTier === "easy" ? "medium" : activeTier === "medium" ? "hard" : null;
        const nextAvail = nextTier && !progress.quiz[nextTier].done && !progress.quiz[nextTier].locked && tierQs[nextTier].length;

        host.innerHTML = `
          ${tierTabsHTML()}
          <div class="quiz-complete">
            <div class="badge">${TIER_ICONS[activeTier]}</div>
            <h3>${escapeHtml(tr(TIER_LABEL_KEY[activeTier]))} — ${escapeHtml(tr("quiz_tier_mastered"))}</h3>
            <p>${escapeHtml(tr("quiz_complete_line", { n: fmtNum(qs.length) }))}</p>
            <div class="quiz-rewards">
              ${totalReward.xp   ? `<span class="reward-pill">${escapeHtml(tr("quiz_xp_earned", { xp: fmtNum(totalReward.xp) }))}</span>` : ""}
              ${totalReward.real ? `<span class="reward-pill">+${fmtNum(totalReward.real)} REAL</span>` : ""}
            </div>
            ${nextAvail ? `
              <button class="primary-btn btn-block" data-next-tier="${nextTier}" style="margin-top:12px;">
                ${escapeHtml(tr("quiz_start_next_tier", { tier: tr(TIER_LABEL_KEY[nextTier]) }))}
              </button>` : ""}
            ${activeTier === "easy" ? `
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
        btn.addEventListener("click", () => {
          const picked  = parseInt(btn.getAttribute("data-opt"), 10);
          const correct = picked === q.correct_answer;
          if (correct) {
            btn.classList.add("correct");
            tp.correct = Array.from(new Set([...(tp.correct || []), q.id]));
            saveProgress();
            haptic("success");
            const ex = document.createElement("div");
            ex.className = "quiz-explain";
            ex.innerHTML = `<span class="qx-mark">✓</span><span>${escapeHtml(explanation)}</span>`;
            host.appendChild(ex);
            setTimeout(() => {
              const next = (tp.idx || 0) + 1;
              if (next >= qs.length) {
                tp.done = true;
                tp.idx  = next;
                saveProgress();
                try { localStorage.setItem(`real_quiz_${SLUG}_${activeTier}`, "passed"); } catch {}
                if (activeTier === "easy") {
                  grantQuizRewards(lore);
                  if (progress.quiz.medium) progress.quiz.medium.locked = false;
                  saveProgress();
                  paintBattle(lore);
                } else if (activeTier === "medium") {
                  if (progress.quiz.hard) progress.quiz.hard.locked = false;
                  saveProgress();
                }
                if (progEl) progEl.textContent = `${fmtNum(qs.length)} / ${fmtNum(qs.length)}`;
              } else {
                tp.idx = next;
                saveProgress();
                if (progEl) progEl.textContent = `${fmtNum((tp.correct || []).length)} / ${fmtNum(qs.length)}`;
              }
              render();
            }, 1100);
          } else {
            btn.classList.add("wrong");
            tp.wrong = Array.from(new Set([...(tp.wrong || []), q.id]));
            saveProgress();
            haptic("warning");
            setTimeout(() => btn.classList.remove("wrong"), 600);
          }
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
    eraEl.textContent   = pick(s, "era");
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
    if (s.image) {
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
      saveProgress();
      // show reward burst
      rewardEl.hidden = false;
      xpEl.textContent = fmtNum((s.reward && s.reward.xp) || 0);
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

  /* ---------- bootstrap: fetch all 3 sources in parallel ---------- */
  Promise.all([
    fetch("/season2/data/chapters.json", { cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(`/season2/data/lore/${encodeURIComponent(SLUG)}.json`, { cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch("/season2/data/quizzes.json", { cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null)
  ]).then(([chaptersBody, lore, quizzesBody]) => {
    const allChapters = (chaptersBody && chaptersBody.chapters) || [];
    const chapterMeta = allChapters.find(c => c.slug === SLUG) || null;
    const quizzes = (quizzesBody && quizzesBody.quizzes) || [];

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
    render({ chapterMeta, lore, quizzes });
  });
})();
