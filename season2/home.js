/* Home (index.html) hydration — pulls heroes + chapters from the
   server catalog and paints the horizontal strips. Read-only; the
   admin still owns mutations. Failures keep static markup empty so
   the page never blanks out. */
(() => {
  "use strict";
  const RT = '<img src="/assets/images/tokens/realtoken.png" alt="REAL" class="real-tok-img" onerror="this.outerHTML=\'◆\'">';

  const $ = (s, r = document) => r.querySelector(s);

  const heroHost    = $("[data-home-heroes]");
  const chapterHost = $("[data-home-chapters]");

  const t = (k, v) => (window.RealI18N && window.RealI18N.t(k, v)) || k;
  const locF = (obj, field) => (window.RealI18N && window.RealI18N.locField)
    ? window.RealI18N.locField(obj, field) : (obj && obj[field] != null ? obj[field] : "");
  const isFa   = () => window.RealI18N && window.RealI18N.getLang && window.RealI18N.getLang() === 'fa';
  const fmtNum = (n) => (window.RealI18N && window.RealI18N.formatNumber)
    ? window.RealI18N.formatNumber(n) : String(n);

  const escapeHtml = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, m => (
    { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[m]
  ));
  const escapeAttr = (s) => escapeHtml(s);

  /* ── Chapter progression state ─────────────────────────────────────────── */
  /* Ordered list of chapter slugs as shipped — extend when new chapters go live */
  const CHAPTER_SLUGS = ["keyumars", "hushang", "tahmuras", "jamshid", "zahhak", "fereydun", "manuchehr"];

  /* Minimal fallback data so the journey card renders immediately from localStorage */
  const CHAPTER_FALLBACK = {
    keyumars: { num: 1, title_en: "Keyumars — The First King",     title_fa: "کیومرث — نخستین شاه",     img: "/assets/images/heroes/keyumars-hero.png", xp: 200 },
    hushang:  { num: 2, title_en: "Hushang — The Spark of Fire",   title_fa: "هوشنگ — جرقه‌ی آتش",      img: "/assets/images/heroes/hushang-hero.png",  xp: 250 },
    tahmuras: { num: 3, title_en: "Tahmuras — Binder of Demons",   title_fa: "تهمورث — دیوبند",          img: "/season2/uploads/chapters/tahmuras.png",  xp: 300 },
    jamshid:  { num: 4, title_en: "Jamshid — The Golden Age",      title_fa: "جمشید — عصر طلایی",        img: "/season2/uploads/chapters/jamshid.png",   xp: 350 },
    zahhak:   { num: 5, title_en: "Zahhak — Reign of Serpents",    title_fa: "ضحاک — دوران اژدها",       img: "/season2/uploads/chapters/zahhak.png",    xp: 400 },
  };

  const lsRead  = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const isDone  = (slug) => lsRead(`real_chapter_done_${slug}`) === "1";
  const getDoneCount = () => CHAPTER_SLUGS.filter(isDone).length;

  const getActiveChapter = () => {
    for (const slug of CHAPTER_SLUGS) {
      if (!isDone(slug)) return slug;
    }
    return CHAPTER_SLUGS[CHAPTER_SLUGS.length - 1]; // all unlocked — show last
  };

  /* Module-level cache so pageshow and storage listeners can re-render */
  let _catalogChapters = null;

  /* ── Journey card + chronicle progress updater ─────────────────────────── */
  const updateJourneyCard = (catalogChapters) => {
    if (catalogChapters) _catalogChapters = catalogChapters;
    const chapters   = _catalogChapters;
    const activeSlug = getActiveChapter();
    const doneCount  = getDoneCount();
    const chNum      = (CHAPTER_SLUGS.indexOf(activeSlug) + 1) || 1;
    const fa         = isFa();

    const cat = (chapters || []).find(c => c.slug === activeSlug);
    const fb  = CHAPTER_FALLBACK[activeSlug] || {};

    /* Localized title */
    const title = cat
      ? (fa ? (cat.title_fa || cat.title) : cat.title)
      : (fa ? fb.title_fa : fb.title_en) || activeSlug;

    /* Best image: catalog image_url → uploads path → fallback asset */
    const imgSrc = (cat && cat.image_url)
      || fb.img
      || `/season2/uploads/chapters/${activeSlug}.png`;

    const xp = (cat && cat.rewards && cat.rewards.xp) || fb.xp || 0;

    /* -- Banner background -- */
    const bannerBg = $('[data-banner-bg]');
    if (bannerBg) bannerBg.style.backgroundImage = `url('${imgSrc}')`;

    /* -- Journey thumb -- */
    const thumbEl = $('[data-journey-thumb]');
    if (thumbEl) { thumbEl.src = imgSrc; thumbEl.alt = title; }

    /* -- Label: "Chapter N · Active" or "Chapter N · Completed" -- */
    const labelEl = $('[data-journey-label]');
    if (labelEl) {
      const nFmt = fa ? fmtNum(chNum) : chNum;
      labelEl.textContent = isDone(activeSlug)
        ? `${t('journey_active_tpl', { n: nFmt }).replace('Active', t('chapter_completed') || 'Done')}`
        : t('journey_active_tpl', { n: nFmt });
    }

    /* -- Title -- */
    const titleEl = $('[data-journey-title]');
    if (titleEl) titleEl.textContent = title;

    /* -- Sub-line -- */
    const subEl = $('[data-journey-sub]');
    if (subEl && xp) {
      const xpFmt = fa ? fmtNum(xp) : xp;
      subEl.textContent = `+${xpFmt} XP${(cat && cat.quiz_count) || true ? ' · Quiz' : ''}`;
    }

    /* -- CTA link -- */
    const linkEl = $('[data-journey-link]');
    if (linkEl) linkEl.href = `chapter.html?slug=${encodeURIComponent(activeSlug)}`;

    /* -- Chronicle progress bar + counters -- */
    const TOTAL = 50;
    const pct   = Math.max(1, Math.round((doneCount / TOTAL) * 100));
    const pctEl  = $('[data-chapters-pct]');
    const doneEl = $('[data-chapters-done]');
    const fillEl = $('[data-chapters-fill]');
    if (pctEl)  pctEl.textContent  = fa ? fmtNum(pct) + '%' : pct + '%';
    if (doneEl) doneEl.textContent = t('home_chs_done_tpl', { done: fmtNum(doneCount), total: fmtNum(TOTAL) });
    if (fillEl) fillEl.style.width = pct + '%';

    /* -- Chapter dots -- */
    document.querySelectorAll('.chapter-dot[data-ch]').forEach(dot => {
      const n = parseInt(dot.dataset.ch, 10);
      dot.classList.toggle('done',   n <= doneCount);
      dot.classList.toggle('active', n === chNum && !isDone(activeSlug));
    });
  };

  /* ── Rarity helpers ────────────────────────────────────────────────────── */
  const rarityLabel = (r) => {
    const x = String(r || "").toLowerCase();
    const key = x === "legendary" ? "rarity_legend" : "rarity_" + x;
    const label = t(key);
    return label !== key ? label : r;
  };

  const rarityClass = (r) => {
    const x = String(r || "").toLowerCase();
    if (x === "mythic")    return "r-mythic";
    if (x === "legendary") return "r-legend";
    if (x === "epic")      return "r-epic";
    if (x === "rare")      return "r-rare";
    return "";
  };

  /* ── Hero image helpers ──────────────────────────────────────────────── */
  const heroPortraitHtml = (h) => {
    if (h.image_url) {
      return `<img src="${escapeAttr(h.image_url)}" alt="${escapeAttr(h.name)}" loading="lazy">`;
    }
    const slug    = h.slug || "";
    const slugEnc = encodeURIComponent(slug);
    const asset = `/assets/images/heroes/${slugEnc}-hero.png`;
    const png   = `/season2/uploads/heroes/${slugEnc}.png`;
    const jpg   = `/season2/uploads/heroes/${slugEnc}.jpg`;
    const emo   = escapeHtml(heroEmoji(slug));
    return `<img src="${escapeAttr(asset)}" alt="${escapeAttr(h.name)}" loading="lazy" `
         + `onerror="if(!this.dataset.tried){this.dataset.tried='1';this.src='${escapeAttr(png)}';}else if(!this.dataset.tried2){this.dataset.tried2='1';this.src='${escapeAttr(jpg)}';}else{this.outerHTML='${emo}';}">`;
  };

  const chapterBannerHtml = (c) => {
    if (c.image_url) {
      return `<img src="${escapeAttr(c.image_url)}" alt="${escapeAttr(c.title)}" loading="lazy">`;
    }
    const slug = encodeURIComponent(c.slug || "");
    const png  = `/season2/uploads/chapters/${slug}.png`;
    const jpg  = `/season2/uploads/chapters/${slug}.jpg`;
    return `<img src="${png}" alt="${escapeAttr(c.title)}" loading="lazy" `
         + `onerror="if(!this.dataset.tried){this.dataset.tried='1';this.src='${escapeAttr(jpg)}';}else{this.outerHTML='📜';}">`;
  };

  const heroEmoji = (slug) => ({
    rostam: "⚔", simorgh: "🪶", zal: "🌒", tahmineh: "♛",
    zahhak: "🐍", fereydun: "🛡", kaveh: "⚒", rakhsh: "🐎",
    akvan: "🌪", esfandiyar: "🏹", persepolis: "🏛",
    keyumars: "👑", siamak: "🗡", hushang: "🔥", ahriman: "☠",
    "black-div": "👹", "first-calendar": "📅", "ancient-pars": "🏛",
    "farr-codex": "✦", "demon-forest": "🌲", "black-demon": "🐍",
    "mount-alborz": "⛰", "mount-damavand": "🌋", "leopard-skins": "🐆",
    "royal-court": "⚜", fravahar: "🦅",
  })[slug] || "⚔";

  const slugToName = (slug) => slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  /* ── Catalog renders (chapter strip / hero strip) ───────────────────── */
  const renderHeroes = (heroes) => {
    if (!heroHost) return;
    if (!Array.isArray(heroes) || heroes.length === 0) {
      heroHost.innerHTML = `<div style="padding:14px; color:var(--muted, #6c7287); font-size:12px;">${t("home_no_heroes")}</div>`;
      return;
    }
    const list = heroes
      .filter(h => h.status !== "locked")
      .slice()
      .sort((a, b) => (b.power || 0) - (a.power || 0))
      .slice(0, 8);
    heroHost.innerHTML = list.map(h => `
      <a class="hero-mini ${rarityClass(h.rarity)}" href="heroes.html#${escapeAttr(h.slug)}">
        <div class="portrait">${heroPortraitHtml(h)}</div>
        <div class="info">
          <div class="name">${escapeHtml(locF(h, 'name') || h.name)}</div>
          <div class="rarity">${escapeHtml(rarityLabel(h.rarity))}</div>
        </div>
      </a>`).join("");
  };

  const renderChapters = (chapters, totalDays) => {
    if (!chapterHost) return;
    if (!Array.isArray(chapters) || chapters.length === 0) {
      chapterHost.innerHTML = `<div style="padding:14px; color:var(--muted, #6c7287); font-size:12px;">${t("home_no_chapters")}</div>`;
      return;
    }
    chapterHost.innerHTML = chapters.slice(0, 8).map(c => {
      const cls = c.status === "completed" ? "done"
                : c.status === "available" || c.status === "published" ? ""
                : "locked";
      const pillLabel = cls === "done" ? t("chapter_completed")
                      : cls === "locked" ? t("pill_day_tpl", { n: c.unlock_day || "?" })
                      : t("pill_available");
      return `
      <a class="chapter-mini ${cls}" href="learn.html#${escapeAttr(c.slug || c.id)}">
        <div class="banner">${chapterBannerHtml(c)}</div>
        <div class="info">
          <div class="title">${escapeHtml(locF(c, "title"))}</div>
          <div class="meta">
            <span class="pill-mini">${escapeHtml(pillLabel)}</span>
            ${c.rewards && c.rewards.real ? `<span class="pill-mini" style="background:rgba(74,216,166,.12); color:var(--jade,#4ad8a6); border-color:rgba(74,216,166,.3);">+${c.rewards.real} ${RT} REAL</span>` : ""}
          </div>
        </div>
      </a>`;
    }).join("");
  };

  const renderJourneyProgress = (totalDays) => {
    const STARTED_KEY = "real_journey_started_at";
    let started = parseInt(lsRead(STARTED_KEY) || "0", 10);
    if (!started) {
      started = Date.now();
      try { localStorage.setItem(STARTED_KEY, String(started)); } catch {}
    }
    const dayNum = Math.max(1, Math.floor((Date.now() - started) / 86400e3) + 1);
    const dayEl  = $("[data-journey-day-num]");
    const fillEl = $("[data-journey-fill]");
    if (dayEl)  dayEl.textContent = fmtNum(dayNum);
    if (fillEl) fillEl.style.width = Math.max(0.4, Math.min(100, (dayNum / (totalDays || 270)) * 100)) + "%";
  };

  /* ── Treasury ────────────────────────────────────────────────────────── */
  const mountTreasury = () => {
    const host = $("[data-resource-hud]");
    if (!host || !window.RealResources) return;
    window.RealResources.mountHud(host);
    if (window.RealI18N && window.RealI18N.applyLocale) window.RealI18N.applyLocale();
  };

  const refreshTreasury = () => {
    const host = $("[data-resource-hud]");
    if (host && window.RealResources) window.RealResources.refreshHud(host);
    wireTreasuryModals();
  };

  /* Expose globally so tap.js / heroes.js can call window.updateDashboardTreasury() */
  window.updateDashboardTreasury = refreshTreasury;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountTreasury);
  } else {
    mountTreasury();
  }

  /* ── Profile hydration ───────────────────────────────────────────────── */
  const todayKey = () => new Date().toISOString().slice(0, 10);

  const hydrateProfile = () => {
    const tgUser = window.Telegram && window.Telegram.WebApp
      && window.Telegram.WebApp.initDataUnsafe
      && window.Telegram.WebApp.initDataUnsafe.user;
    const player = (window.RealPlayer && window.RealPlayer.get) ? window.RealPlayer.get() : {};

    const nameEl = $("[data-player-name]");
    if (nameEl) {
      let name = "";
      if (tgUser && tgUser.first_name) {
        name = tgUser.first_name + (tgUser.last_name ? " " + tgUser.last_name : "");
      } else if (player.username) {
        name = player.username;
      }
      if (name) nameEl.textContent = name;
    }

    const avatarImg = $("[data-avatar-img]");
    if (avatarImg) {
      const fallback   = player.path === "heroine"
        ? "/assets/images/avatars/default-female-avatar.png"
        : "/assets/images/avatars/default-male-avatar.png";
      const cachedPic  = (() => { try { return lsRead("real_profile_pic") || ""; } catch { return ""; } })();
      const photoSrc   = (tgUser && tgUser.photo_url) || cachedPic || "";
      avatarImg.onerror = () => { avatarImg.onerror = null; avatarImg.src = fallback; };
      avatarImg.src = photoSrc || fallback;
    }

    const vipLv   = Math.floor((player.xp || 0) / 1000);
    const levelEl = $("[data-level]");
    if (levelEl) levelEl.textContent = vipLv;
    const vipPill = $("[data-vip-level]");
    if (vipPill) {
      vipPill.textContent = vipLv === 0 ? "VIP" : `VIP ${fmtNum(vipLv)}`;
    }

    hydrateBadge(vipLv);
  };

  /* ── Daily quest hydration ───────────────────────────────────────────── */
  const TAP_GOAL = 200;

  const hydrateQuests = (su) => {
    const dk = todayKey();
    /* Always take the most optimistic (truest) value: server OR local.
       Server may lag behind by up to 30 s; localStorage is written immediately
       by chapter.js / tap.js / app.js when quests complete. */
    const states = {
      read:   !!(su && su.quest_read)   || lsRead("real_quest_read_"   + dk) === "true",
      quiz:   !!(su && su.quest_quiz)   || lsRead("real_quest_quiz_"   + dk) === "true",
      invite: !!(su && su.quest_invite) || lsRead("real_quest_invite_" + dk) === "true",
    };
    /* For taps: take whichever is higher — server count or local count */
    const serverTaps = (su && su.quest_tap) || 0;
    const localTaps  = parseInt(lsRead("real_daily_taps_" + dk) || "0", 10);
    const tapsToday  = Math.max(serverTaps, localTaps);
    states.tap = tapsToday >= TAP_GOAL;

    Object.entries(states).forEach(([key, done]) => {
      const row = document.querySelector(`[data-quest="${key}"]`);
      if (!row) return;
      row.classList.toggle("done", done);
      const check = row.querySelector(".quest-check");
      if (check) {
        check.classList.toggle("done", done);
        check.textContent = done ? "✓" : "";
      }
    });

    const tapCount = $("[data-daily-taps]");
    if (tapCount) tapCount.textContent = `${fmtNum(Math.min(tapsToday, TAP_GOAL))} / ${fmtNum(TAP_GOAL)}`;
  };

  /* ── Medallion badge ─────────────────────────────────────────────────── */
  const BADGE_TIERS = [
    { min: 50, icon: "🌟", title: "Legend"    },
    { min: 20, icon: "👑", title: "King"      },
    { min: 10, icon: "⚔",  title: "Champion" },
    { min: 5,  icon: "🛡",  title: "Warrior"  },
    { min: 0,  icon: "⭐",  title: "Seeker"   },
  ];

  const hydrateBadge = (level) => {
    const el = $("[data-player-badge]");
    if (!el) return;
    const lv   = Number(level) || 0;
    const tier = BADGE_TIERS.find(tb => lv >= tb.min) || BADGE_TIERS[BADGE_TIERS.length - 1];
    el.textContent = tier.icon;
    el.title       = tier.title;
  };

  /* ── Hero Spotlight ──────────────────────────────────────────────────── */
  const renderHeroSpotlight = (catalogHeroes) => {
    const host = $("[data-hero-spotlight]");
    if (!host) return;

    const owned = (window.RealSync && window.RealSync.getOwnedHeroes)
      ? window.RealSync.getOwnedHeroes() : {};

    if (!Object.keys(owned).length) {
      host.innerHTML = `<div class="hs-empty">No heroes yet — visit the <a href="heroes.html" style="color:var(--gold)">Heroes page</a> to unlock your first!</div>`;
      return;
    }

    const catMap = {};
    (catalogHeroes || []).forEach(h => { if (h.slug) catMap[h.slug] = h; });

    const SLUG_FA = {
      keyumars: "کیومرث", siamak: "سیامک", hushang: "هوشنگ", ahriman: "اهریمن",
      "black-div": "دیو سیاه", "black-demon": "دیو تاریکی",
      "mount-damavand": "کوه دماوند", "royal-court": "دربار شاهی",
      "ancient-pars": "پارس باستان", "demon-forest": "جنگل دیوان",
      "farr-codex": "فرّ — نور الهی", "mount-alborz": "کوه البرز",
      fravahar: "فَروَهَر", "leopard-skins": "پوست‌های پلنگ",
      "first-calendar": "اولین تقویم", "discovery-of-fire": "کشف آتش",
      rostam: "رستم", simorgh: "سیمرغ", zahhak: "ضحاک",
    };
    const fa = isFa();

    const spotlightHeroes = Object.entries(owned)
      .map(([hero_id, data]) => {
        const cat    = catMap[hero_id];
        const nameEn = (cat && cat.name)    || slugToName(hero_id);
        const nameFa = (cat && cat.name_fa) || SLUG_FA[hero_id];
        return {
          slug:        hero_id,
          name:        (fa && nameFa) ? nameFa : nameEn,
          image_url:   (cat && cat.image_url) || null,
          rarity:      (cat && cat.rarity)    || "",
          playerLevel: data.level        || 1,
          zarPerHour:  data.zar_per_hour || 0,
        };
      })
      .sort((a, b) => (b.playerLevel || 1) - (a.playerLevel || 1))
      .slice(0, 3);

    host.innerHTML = spotlightHeroes.map(h => `
      <div class="hs-card">
        <div class="hs-portrait">${heroPortraitHtml(h)}</div>
        <div class="hs-body">
          <div class="hs-kicker">${escapeHtml(t('active_hero_kicker'))}</div>
          <div class="hs-name">${escapeHtml(h.name)}</div>
          <span class="hs-passive">✦ +${fmtNum(h.zarPerHour)} ${escapeHtml(t('r_zar'))}/hr</span>
        </div>
        <div class="hs-right">
          <div class="hs-lvl-lbl">${escapeHtml(t('hs_lvl_lbl'))}</div>
          <div class="hs-lvl-num">${fmtNum(h.playerLevel || 1)}</div>
          <a href="heroes.html#${escapeAttr(h.slug)}" class="hs-upgrade-link">${escapeHtml(t('hero_up_link'))}</a>
        </div>
      </div>`).join('');
  };

  /* ── Treasury info modals ─────────────────────────────────────────────── */
  const TREASURY_INFO = {
    farr: {
      name: "Farr — Divine Glory",
      uses: "The divine glory of the Pishdadian kings. Farr governs your prestige rank in the Chronicles and gates access to legendary heroes and story branches.",
      tips: ["Complete chapter quizzes with a perfect score", "Build daily quest streaks", "Ascend heroes to unlock their Farr aura"],
    },
    zar: {
      name: "Zar — Gold of Pars",
      uses: "The primary upgrade currency of the realm. Use Zar to level up heroes, unlock chapters, and craft items in the Forge of Pars.",
      tips: ["Tap in The Forge of Pars", "Heroes earn Zar per hour while idle", "Clan bonuses and offline mining rewards"],
    },
    gems: {
      name: "Gems — Kaveh's Vault",
      uses: "Rare artifacts of immense power. Gems unlock premium heroes, purchase special relics, and instantly accelerate upgrades.",
      tips: ["Invite warriors via your referral link", "Complete weekly challenge quests", "Participate in clan wars and tournaments"],
    },
    xp: {
      name: "XP — Chronicle Wisdom",
      uses: "Wisdom earned through the Chronicle. XP raises your VIP level, unlocking exclusive badges, extra hero slots, and story branches.",
      tips: ["Read Chronicle scenes (+50 XP/day)", "Answer chapter quizzes (+100 XP)", "Daily streaks and chapter completions"],
    },
    real: {
      name: "$REAL Token",
      uses: "The on-chain ecosystem token on the TON blockchain. REAL bridges your in-game achievements with real-world DeFi value, staking, and seasonal rewards.",
      tips: ["Tap in The Forge (+80 REAL per 200 taps)", "Chapter completions and milestone rewards", "Clan treasury dividends and seasonal airdrops"],
    },
  };

  const showTreasuryModal = (kind) => {
    const info = TREASURY_INFO[kind];
    if (!info) return;
    const existing = document.getElementById("tm-overlay");
    if (existing) existing.remove();
    const ico     = window.RealResources ? window.RealResources.icon(kind) : "";
    const overlay = document.createElement("div");
    overlay.id = "tm-overlay";
    overlay.className = "tm-overlay";
    overlay.innerHTML = `
      <div class="tm-sheet" role="dialog" aria-modal="true">
        <div class="tm-handle" aria-hidden="true"></div>
        <div class="tm-head">
          <span class="tm-ico">${escapeHtml(ico)}</span>
          <span class="tm-title">${escapeHtml(info.name)}</span>
          <button class="tm-close" aria-label="Close">✕</button>
        </div>
        <div class="tm-body">
          <div class="tm-section-lbl">${escapeHtml(t('treasury_what_it_does'))}</div>
          <p class="tm-text">${escapeHtml(info.uses)}</p>
          <div class="tm-section-lbl" style="margin-top:14px;">${escapeHtml(t('treasury_how_to_earn'))}</div>
          <ul class="tm-tips">${info.tips.map(tip => `<li>${escapeHtml(tip)}</li>`).join("")}</ul>
        </div>
      </div>`;
    overlay.querySelector(".tm-close").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { requestAnimationFrame(() => overlay.classList.add("visible")); });
  };

  const wireTreasuryModals = () => {
    const host = $("[data-resource-hud]");
    if (!host) return;
    host.querySelectorAll("[data-resource-cell]").forEach((cell) => {
      if (cell.dataset.tmWired) return;
      cell.dataset.tmWired = "1";
      cell.style.cursor = "pointer";
      cell.addEventListener("click", () => showTreasuryModal(cell.dataset.resourceCell));
    });
  };

  /* ── Quest click routing — quiz URL is dynamic based on active chapter ── */
  const wireQuestClicks = () => {
    const activeSlug = getActiveChapter();
    const ROUTES = {
      read:   "learn.html",
      quiz:   `chapter.html?slug=${encodeURIComponent(activeSlug)}`,
      tap:    "tap.html",
      invite: "earn.html",
    };
    Object.entries(ROUTES).forEach(([key, url]) => {
      const row = document.querySelector(`[data-quest="${key}"]`);
      if (!row || row.dataset.questWired) return;
      row.dataset.questWired = "1";
      row.addEventListener("click", () => {
        if (row.classList.contains("done")) return;
        window.location.href = url;
      });
    });
  };

  /* ── Boot ────────────────────────────────────────────────────────────── */
  const bootHomeHydration = () => {
    hydrateProfile();
    hydrateQuests();
    refreshTreasury();
    updateJourneyCard(null);  // immediate render from localStorage
    wireQuestClicks();
    wireTreasuryModals();

    if (window.RealSync) {
      window.RealSync.ready().then(async (su) => {
        hydrateProfile();
        hydrateQuests(su);
        hydrateBadge((window.RealPlayer && window.RealPlayer.get)
          ? Math.floor((window.RealPlayer.get().xp || 0) / 1000) : 0);
        if (window.RealUtils) window.RealUtils.updateGlobalZar();
        refreshTreasury();
        wireTreasuryModals();

        /* Sync owned heroes then re-render spotlight with fresh data */
        if (window.RealSync.syncHeroes) {
          await window.RealSync.syncHeroes();
        }
        /* Re-fetch catalog heroes so spotlight has name/image data too */
        fetch("/api/catalog/heroes", { cache: "no-store" })
          .then(r => r.ok ? r.json() : null)
          .then(b => { renderHeroSpotlight((b && b.heroes) || []); })
          .catch(() => renderHeroSpotlight([]));
      });
    }

    /* ── Reactive event listeners ── */

    /* 1. Bfcache restore — restore ALL resources, not just balance+zar */
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) {
        try {
          const ls = JSON.parse(localStorage.getItem("real_player_state_v1") || "{}");
          if (window.RealPlayer && window.RealPlayer.set) {
            window.RealPlayer.set({
              balance: ls.balance || 0,
              zar:     ls.zar     || 0,
              xp:      ls.xp      || 0,
              farr:    ls.farr    || 0,
              gems:    ls.gems    || 0,
            });
          }
        } catch {}
      }
      refreshTreasury();
      hydrateProfile();
      hydrateQuests();
      updateJourneyCard(null);
    });

    /* 2. Balance updated from another component (swap, hero buy, scene read, quiz, etc.) */
    window.addEventListener("balanceUpdate", () => {
      refreshTreasury();
      hydrateProfile();
    });

    /* 2b. Player.set() state-sync — catches xp/farr/gems/balance changes in this tab */
    window.addEventListener("shahnama:state_sync", () => {
      refreshTreasury();
      hydrateProfile();
    });

    /* 3. localStorage changes from other tabs / pages */
    window.addEventListener("storage", (e) => {
      if (!e.key) return;
      if (e.key.startsWith("real_chapter_done_")) {
        updateJourneyCard(null);
        wireQuestClicks();     // re-wire quiz route to new active chapter
      }
      if (e.key.startsWith("real_quest_") || e.key.startsWith("real_daily_taps_")) {
        hydrateQuests();
      }
      if (e.key === "real_player_state_v1" || e.key === "real_owned_heroes_v1") {
        refreshTreasury();
        hydrateProfile();
      }
    });

    /* 4. In-page events dispatched by chapter.js / tap.js / sync.js */
    window.addEventListener("real:quest:quiz",  () => { hydrateQuests(); updateJourneyCard(null); refreshTreasury(); });
    window.addEventListener("real:quest:read",  () => { hydrateQuests(); refreshTreasury(); });
    window.addEventListener("real:quest:tap",   () => { hydrateQuests(); refreshTreasury(); });
    window.addEventListener("real:quest:invite",() => { hydrateQuests(); });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootHomeHydration);
  } else {
    bootHomeHydration();
  }

  /* ── Catalog fetches (best-effort; failures leave static markup) ─────── */
  fetch("/api/catalog/heroes", { cache: "no-store" })
    .then(r => r.ok ? r.json() : null)
    .then(b => {
      const heroes = b && b.heroes;
      renderHeroes(heroes);
      renderHeroSpotlight(heroes || []);
    })
    .catch(() => { renderHeroes([]); renderHeroSpotlight([]); });

  fetch("/api/catalog/chapters", { cache: "no-store" })
    .then(r => r.ok ? r.json() : null)
    .then(b => {
      const chapters = b && b.chapters;
      renderChapters(chapters, b && b.seasonLengthDays);
      renderJourneyProgress(b && b.seasonLengthDays);
      updateJourneyCard(chapters);   // re-render with full catalog titles & images
    })
    .catch(() => { renderChapters([]); renderJourneyProgress(270); updateJourneyCard(null); });
})();
