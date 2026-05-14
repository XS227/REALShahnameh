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
  // pick fa or en variant of a data field: pick(obj, "title") → obj.title_fa || obj.title_en
  const pick = (obj, base) => {
    if (!obj) return "";
    const fa = obj[base + "_fa"];
    if (curLang() === "fa" && fa) return fa;
    return obj[base + "_en"] || obj[base] || "";
  };
  // pick the en/fa property of a {en, fa} object (used for lore_summary)
  const pickEnFa = (obj) => {
    if (!obj) return "";
    if (curLang() === "fa" && obj.fa) return obj.fa;
    return obj.en || "";
  };

  const params = new URLSearchParams(location.search);
  const SLUG = params.get("slug") || "keyumars";

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
  const progress = Object.assign(
    { scenes: [], codex: [], quiz: { idx: 0, correct: [], wrong: [], done: false }, fragments: 0 },
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
    paintTimeline(lore);
    paintScenes(lore);
    paintCharacters(lore);
    paintPlaces(lore);
    paintCodex(lore);
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
      if (r.xp)    pills.push(`<span class="reward-pill">+${fmtNum(r.xp)} XP</span>`);
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
  const paintTimeline = (lore) => {
    const host = $("[data-timeline]");
    if (!host) return;
    const t = (lore && lore.timeline) || [];
    if (!t.length) {
      host.innerHTML = `<div style="color:var(--muted);font-size:12px;padding:14px;">${escapeHtml(tr("ch_no_timeline"))}</div>`;
      return;
    }
    host.innerHTML = t.map((e, i) => {
      const boss = (e.side === "dark") || (i === t.length - 1);
      const styleAttr = e.image ? `style="--t-bg:url('${escapeHtml(e.image)}');"` : "";
      const classes = `t-card${boss ? " boss" : ""}${e.image ? " has-bg" : ""}`;
      return `
      <article class="${classes}" ${styleAttr}>
        <span class="year">${escapeHtml(pick(e, "year_label"))}</span>
        <h4>${escapeHtml(pick(e, "title"))}</h4>
        <p>${escapeHtml(pick(e, "body"))}</p>
      </article>`;
    }).join("");
    // Preflight each backdrop and console.warn any 404s.
    t.forEach((e) => {
      if (!e.image) return;
      const img = new Image();
      img.onerror = () => console.warn(`[chapter:${SLUG}] timeline image missing: ${e.image}`);
      img.src = e.image;
    });
  };

  /* ---------- scenes ---------- */
  const paintScenes = (lore) => {
    const host = $("[data-scenes]");
    const progEl = $("[data-scene-progress]");
    if (!host) return;
    const scenes = (lore && lore.scenes) || [];
    if (!scenes.length) { host.innerHTML = ""; return; }

    const readSet = new Set(progress.scenes);
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

  /* ---------- characters ---------- */
  const paintCharacters = (lore) => {
    const host = $("[data-characters]");
    if (!host) return;
    const chars = (lore && lore.characters) || [];
    const codexUnlocked = new Set(progress.codex);
    const unlockedScenes = new Set(progress.scenes);

    const isUnlocked = (c) => {
      if (c.unlocked) return true;
      const via = c.unlock_via;
      if (!via) return false;
      if (via.startsWith("scene:"))   return unlockedScenes.has(via.slice(6));
      if (via.startsWith("codex:"))   return codexUnlocked.has(via.slice(6));
      if (via.startsWith("chapter:")) return false; // future chapter
      return false;
    };

    const rarityClass = (r) => ({
      mythic: "r-mythic", legendary: "r-legend", epic: "r-epic", rare: "r-rare", common: ""
    })[r] || "";

    let unlockedCount = 0;
    const isFa = curLang() === "fa";
    const fallbackGlyph = (side) => side === "dark" ? "☾" : "⚔";
    host.innerHTML = chars.map((c) => {
      const unlocked = isUnlocked(c);
      if (unlocked) unlockedCount++;
      const altName = c.name_en || c.name_fa || "";
      const portrait = c.image
        ? `<img src="${escapeHtml(c.image)}" alt="${escapeHtml(altName)}" loading="lazy"
                onerror="this.style.display='none'; this.nextElementSibling && this.nextElementSibling.removeAttribute('hidden'); console.warn('[chapter:${SLUG}] character image missing: ${escapeHtml(c.image)}');">
           <span class="portrait-emoji-fallback" hidden>${fallbackGlyph(c.side)}</span>`
        : `<span class="portrait-emoji-fallback">${fallbackGlyph(c.side)}</span>`;
      // In FA mode show name_fa as main; show EN underneath. In EN mode keep current EN-on-top, FA-below.
      const mainName = isFa ? (c.name_fa || c.name_en || "") : (c.name_en || "");
      const subName  = isFa ? (c.name_en || "") : (c.name_fa || "");
      const subAttrs = isFa ? "" : ' lang="fa" dir="rtl"';
      const roleText = unlocked ? pick(c, "role") : tr("ch_unlock_by_scenes");
      return `
      <article class="card char-card ${rarityClass(c.rarity)} ${c.side === "dark" ? "dark" : ""} ${unlocked ? "" : "locked"}">
        <span class="rarity-tag">${escapeHtml(c.rarity || "")}</span>
        <div class="portrait">${portrait}</div>
        <h4 class="name">${escapeHtml(mainName)}</h4>
        <p class="name-fa"${subAttrs}>${escapeHtml(subName)}</p>
        <p class="role">${escapeHtml(roleText)}</p>
      </article>`;
    }).join("");

    const progEl = $("[data-char-progress]");
    if (progEl) progEl.textContent = `${fmtNum(unlockedCount)} / ${fmtNum(chars.length)}`;
  };

  /* ---------- places ---------- */
  const paintPlaces = (lore) => {
    const host = $("[data-places]");
    if (!host) return;
    const places = (lore && lore.places) || [];
    const unlockedScenes = new Set(progress.scenes);

    const isUnlocked = (p) => {
      if (p.unlocked) return true;
      const via = p.unlock_via;
      if (via && via.startsWith("scene:")) return unlockedScenes.has(via.slice(6));
      return false;
    };

    let unlockedCount = 0;
    host.innerHTML = places.map((p) => {
      const unlocked = isUnlocked(p);
      if (unlocked) unlockedCount++;
      const altName = p.name_en || p.name_fa || "";
      const placeholder = `<span class="place-placeholder">${escapeHtml(tr("image_coming_soon"))}</span>`;
      const portrait = p.image
        ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(altName)}" loading="lazy"
                onerror="this.classList.add('img-fail'); console.warn('[chapter:${SLUG}] place image missing: ${escapeHtml(p.image)}');">
           ${placeholder}`
        : placeholder;
      const summary = unlocked ? pick(p, "summary") : tr("ch_unlock_related_scene");
      return `
      <article class="card place-card ${unlocked ? "" : "locked"}">
        <div class="map-icon">${portrait}</div>
        <span class="kind">${escapeHtml(pick(p, "kind"))}</span>
        <h4 class="name">${escapeHtml(pick(p, "name"))}</h4>
        <p class="summary">${escapeHtml(summary)}</p>
      </article>`;
    }).join("");

    const progEl = $("[data-place-progress]");
    if (progEl) progEl.textContent = `${fmtNum(unlockedCount)} / ${fmtNum(places.length)}`;
  };

  /* ---------- codex ---------- */
  const paintCodex = (lore) => {
    const host = $("[data-codex]");
    if (!host) return;
    const entries = (lore && lore.codex) || [];
    const unlocked = new Set(progress.codex);

    const seal = {
      artifact: "🜲", place: "✣", creature: "✶", event: "✦", person: "❖", concept: "✜"
    };

    let unlockedCount = 0;
    host.innerHTML = entries.map((e) => {
      const u = unlocked.has(e.id) || e.unlock_via === "intro:complete"; // intro grants Ferdowsi entry by default
      if (u) {
        unlockedCount++;
        if (!unlocked.has(e.id)) {
          progress.codex.push(e.id);
        }
      }
      return `
      <article class="codex-card ${u ? "" : "locked"}" data-cat="${escapeHtml(e.category)}">
        <span class="cat-badge">${escapeHtml(e.category)}</span>
        <div class="seal">${seal[e.category] || "✦"}</div>
        <h4 class="title">${escapeHtml(pick(e, "title"))}</h4>
        <p class="summary">${escapeHtml(pick(e, "summary"))}</p>
      </article>`;
    }).join("");

    const progEl = $("[data-codex-progress]");
    if (progEl) progEl.textContent = `${fmtNum(unlockedCount)} / ${fmtNum(entries.length)}`;

    saveProgress();
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
      if (r.kind === "level")     return false;                    // hooks into player profile later
      if (r.kind === "character") return unlockedChars.has(r.target);
      if (r.kind === "item")      return false;                    // future inventory system
      if (r.kind === "quiz")      return progress.quiz && progress.quiz.done;
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
      return `
        <li class="req-row ${met ? "done" : ""}">
          <span class="req-mark">${met ? "✓" : "·"}</span>
          <span class="req-label">${escapeHtml(pick(r, "label"))}</span>
          <span class="req-pill">${escapeHtml(pill)}</span>
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
        toast(tr("battle_combat_next_update"));
        haptic("warning");
      });
    }

    const progEl = $("[data-req-progress]");
    if (progEl) progEl.textContent = `${fmtNum(metCount)} / ${fmtNum(reqs.length)}`;
  };

  /* ---------- quiz ---------- */
  const paintQuiz = (lore, allQuizzes) => {
    const host = $("[data-quiz]");
    const progEl = $("[data-quiz-progress]");
    if (!host) return;
    const qs = (allQuizzes || []).filter(q => q.chapter_slug === SLUG)
                                 .sort((a, b) => (a.quiz_part || 0) - (b.quiz_part || 0));
    if (!qs.length) {
      host.innerHTML = `<p class="copy" style="color:var(--muted);">${escapeHtml(tr("quiz_no_published"))}</p>`;
      if (progEl) progEl.textContent = `${fmtNum(0)} / ${fmtNum(0)}`;
      return;
    }

    if (progEl) progEl.textContent = `${fmtNum((progress.quiz.correct || []).length)} / ${fmtNum(qs.length)}`;

    const diffKey = (d) => ({
      easy: "difficulty_easy",
      medium: "difficulty_medium",
      hard: "difficulty_hard"
    })[String(d || "easy").toLowerCase()] || "difficulty_easy";

    const renderQuestion = () => {
      // If already done, show completion summary.
      if (progress.quiz.done) {
        const totalReward = qs.reduce((acc, q) => {
          acc.xp   += (q.reward && q.reward.xp)   || 0;
          acc.real += (q.reward && q.reward.real) || 0;
          return acc;
        }, { xp: 0, real: 0 });
        // Persist chapter completion so learn.html can reflect done state.
        try { localStorage.setItem(`real_chapter_done_${SLUG}`, "1"); } catch {}
        host.innerHTML = `
          <div class="quiz-complete">
            <div class="badge">🏆</div>
            <h3>${escapeHtml(tr("quiz_chapter_mastered"))}</h3>
            <p>${escapeHtml(tr("quiz_complete_line", { n: fmtNum(qs.length) }))}</p>
            <div class="quiz-rewards">
              <span class="reward-pill">${escapeHtml(tr("quiz_xp_earned", { xp: fmtNum(totalReward.xp) }))}</span>
              <span class="reward-pill">+${fmtNum(totalReward.real)} <i class="real-coin"></i>${escapeHtml(tr("quiz_real_earned_suffix"))}</span>
            </div>
            <a href="learn.html" class="primary-btn btn-block"
               style="margin-top:12px; display:flex; align-items:center; justify-content:center; text-decoration:none;">
              ${escapeHtml(tr("quiz_return_journey"))}
            </a>
            <button class="ghost-btn" data-quiz-reset style="margin-top:8px;">${escapeHtml(tr("quiz_replay"))}</button>
          </div>`;
        const reset = $("[data-quiz-reset]", host);
        if (reset) reset.addEventListener("click", () => {
          progress.quiz = { idx: 0, correct: [], wrong: [], done: false };
          saveProgress();
          renderQuestion();
          paintBattle(lore); // requirements update
        });
        return;
      }

      const i = progress.quiz.idx || 0;
      const q = qs[i];
      if (!q) return;

      const qText = pick(q, "question") || q.question || "";
      const answers = q.answers_fa && curLang() === "fa" && Array.isArray(q.answers_fa)
        ? q.answers_fa
        : (q.answers || []);
      const explanation = pick(q, "explanation") || q.explanation || tr("quiz_correct_default");
      const xpVal = (q.reward && q.reward.xp) || 0;
      const realVal = (q.reward && q.reward.real) || 0;

      host.innerHTML = `
        <div class="quiz-q-num" style="font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:var(--muted);">
          ${escapeHtml(tr("quiz_question_of", { i: fmtNum(i + 1), n: fmtNum(qs.length) }))}
        </div>
        <h4 class="quiz-q">${escapeHtml(qText)}</h4>
        <div class="quiz-options">
          ${answers.map((a, ai) => `
            <button class="quiz-opt" data-opt="${ai}">${escapeHtml(a)}</button>
          `).join("")}
        </div>
        <div class="quiz-foot">
          <span>+${fmtNum(xpVal)} XP · +${fmtNum(realVal)} REAL</span>
          <span>${escapeHtml(tr(diffKey(q.difficulty)))}</span>
        </div>
      `;

      $$(".quiz-opt", host).forEach((btn) => {
        btn.addEventListener("click", () => {
          const picked = parseInt(btn.getAttribute("data-opt"), 10);
          const correct = picked === q.correct_answer;
          if (correct) {
            btn.classList.add("correct");
            progress.quiz.correct = Array.from(new Set([...(progress.quiz.correct || []), q.id]));
            saveProgress();
            haptic("success");
            // Append explanation, then advance.
            const ex = document.createElement("div");
            ex.className = "quiz-explain";
            ex.innerHTML = `<span class="qx-mark">✓</span><span>${escapeHtml(explanation)}</span>`;
            host.appendChild(ex);
            setTimeout(() => {
              const next = (progress.quiz.idx || 0) + 1;
              if (next >= qs.length) {
                progress.quiz.done = true;
                progress.quiz.idx = next;
                saveProgress();
                paintBattle(lore);
                if (progEl) progEl.textContent = `${fmtNum(qs.length)} / ${fmtNum(qs.length)}`;
              } else {
                progress.quiz.idx = next;
                saveProgress();
                if (progEl) progEl.textContent = `${fmtNum((progress.quiz.correct || []).length)} / ${fmtNum(qs.length)}`;
              }
              renderQuestion();
            }, 1100);
          } else {
            btn.classList.add("wrong");
            progress.quiz.wrong = Array.from(new Set([...(progress.quiz.wrong || []), q.id]));
            saveProgress();
            haptic("warning");
            setTimeout(() => btn.classList.remove("wrong"), 600);
          }
        });
      });
    };

    renderQuestion();
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
      // re-paint sections affected
      paintScenes(modalLore);
      paintCharacters(modalLore);
      paintPlaces(modalLore);
      paintCodex(modalLore);
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
    const chapterMeta = chaptersBody && Array.isArray(chaptersBody.chapters)
      ? chaptersBody.chapters.find(c => c.slug === SLUG) || null
      : null;
    const quizzes = (quizzesBody && quizzesBody.quizzes) || [];
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
