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
  const fmtNum = (n) => (window.RealI18N && window.RealI18N.compactNumber)
    ? window.RealI18N.compactNumber(n)
    : (window.RealI18N && window.RealI18N.formatNumber)
    ? window.RealI18N.formatNumber(n) : String(n);

  const escapeHtml = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, m => (
    { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[m]
  ));
  const escapeAttr = (s) => escapeHtml(s);

  /* ── Chapter progression state ─────────────────────────────────────────── */
  /* Full canonical slug list — must match catalog API order. */
  const CHAPTER_SLUGS = [
    "keyumars","hushang","tahmuras","jamshid","zahhak",
    "fereydun","manuchehr","nozar","zal","rudabeh",
    "birth-of-rostam","rostam","sohrab","siavash","kay-kavus",
    "kay-khosrow","akvan","bijan-manijeh","great-war-turan","lohrasp",
    "goshtasp","esfandiyar","seven-labours-esp","clash-rostam-esp","simorgh",
  ];

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
      subEl.textContent = t('journey_xp_quiz_sub',{xp: xpFmt, unit: t('r_xp','XP')});
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
    if (pctEl)  pctEl.textContent  = fmtNum(pct) + '%';
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
            ${c.rewards && c.rewards.real ? `<span class="pill-mini" style="background:rgba(74,216,166,.12); color:var(--jade,#4ad8a6); border-color:rgba(74,216,166,.3);">+${c.rewards.real} ${RT} ${t('currency_name','REAL')}</span>` : ""}
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
    if (levelEl) levelEl.textContent = fmtNum(vipLv);
    const vipPill = $("[data-vip-level]");
    if (vipPill) {
      vipPill.textContent = vipLv === 0 ? 'VIP' : `VIP · Level ${fmtNum(vipLv)}`;
    }

    hydrateBadge(vipLv);
  };

  /* ── Chronicle banner: full on first visit, chip on return ──────────── */
  const hydrateBanner = () => {
    const seen       = lsRead('real_seen_banner') === '1';
    const bannerWrap = $('[data-chronicle-banner]');
    const chip       = $('[data-chronicle-chip]');
    if (bannerWrap) bannerWrap.hidden = seen;
    if (chip)       chip.hidden       = !seen;
    // Mark as seen after 3 s so the user has time to read it
    if (!seen) setTimeout(() => {
      try { localStorage.setItem('real_seen_banner', '1'); } catch {}
    }, 3000);
    // Also mark immediately if they click the CTA
    const cta = $('[data-banner-cta]');
    if (cta) cta.addEventListener('click', () => {
      try { localStorage.setItem('real_seen_banner', '1'); } catch {}
    }, { once: true });
  };

  /* ── Daily quest hydration ───────────────────────────────────────────── */
  const TAP_GOAL = 200;

  const hydrateQuests = (su) => {
    const dk = todayKey();
    const states = {
      read:   !!(su && su.quest_read) || lsRead("real_quest_read_"   + dk) === "true",
      quiz:   !!(su && su.quest_quiz) || lsRead("real_quest_quiz_"   + dk) === "true",
    };
    const serverTaps = (su && su.quest_tap) || 0;
    const localTaps  = parseInt(lsRead("real_daily_taps_" + dk) || "0", 10);
    const tapsToday  = Math.max(serverTaps, localTaps);
    states.tap = tapsToday >= TAP_GOAL;

    Object.entries(states).forEach(([key, done]) => {
      const row = document.querySelector(`[data-quest="${key}"]`);
      if (!row) return;
      row.classList.toggle("done", done);
      const check = row.querySelector(".quest-check");
      if (check) { check.classList.toggle("done", done); check.textContent = done ? "✓" : ""; }
    });

    const tapCount = $("[data-daily-taps]");
    if (tapCount) tapCount.textContent = `${fmtNum(Math.min(tapsToday, TAP_GOAL))} / ${fmtNum(TAP_GOAL)}`;

    /* All-complete bonus row — visibility only; click is wired in wireClaimButton() */
    const allDone        = states.read && states.quiz && states.tap;
    const alreadyClaimed = lsRead("real_daily_bonus_claimed_" + dk) === "1";
    const claimRow       = $("[data-quest-all-complete]");
    if (claimRow) claimRow.hidden = !allDone || alreadyClaimed;
  };

  const claimDailyBonus = () => {
    const key = "real_daily_bonus_claimed_" + todayKey();
    if (lsRead(key) === "1") return;
    const btn = document.querySelector("[data-quest-claim]");
    if (btn) { btn.disabled = true; btn.textContent = "✓ Claimed!"; }
    try { localStorage.setItem(key, "1"); } catch {}
    if (window.RealPlayer) window.RealPlayer.addResource("xp", 200);
    if (window.RealSync)   { window.RealSync.syncQuest("bonus"); window.RealSync.syncBalance(); }
    refreshTreasury();
    const toastEl = document.querySelector("[data-toast]");
    if (toastEl) {
      toastEl.textContent = "+200 XP — Daily Bonus claimed!";
      toastEl.classList.add("show");
      setTimeout(() => toastEl.classList.remove("show"), 2000);
    }
    const claimRow = document.querySelector("[data-quest-all-complete]");
    setTimeout(() => { if (claimRow) claimRow.hidden = true; }, 600);
  };
  const wireClaimButton = () => {
    const btn = document.querySelector("[data-quest-claim]");
    if (btn && !btn.dataset.claimWired) {
      btn.dataset.claimWired = "1";
      btn.addEventListener("click", claimDailyBonus);
    }
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

  /* ── Hero image map — mirrors COLLECTION img fields in heroes.js ──────
     Keeps spotlight from guessing filenames from slugs (they don't match).
     Update whenever a hero's img path changes in heroes.js COLLECTION.    */
  const HERO_IMGS = {
    "keyumars":              "/assets/images/heroes/keyumars-hero.png",
    "siamak":                "/assets/images/heroes/siamak-hero.png",
    "hushang":               "/assets/images/heroes/hushang-hero.png",
    "ahriman":               "/assets/images/enemies/ahriman-boss.png",
    "black-div":             "/assets/images/enemies/black-div-enemy.png",
    "mount-damavand":        "/assets/images/locations/mount-damavand-location.png",
    "royal-court":           "/assets/images/locations/royal-mountain-court.png",
    "ancient-pars":          "/assets/images/locations/ancient-pars-location.png",
    "demon-forest":          "/assets/images/locations/demon-forest-location.png",
    "farr-codex":            "/assets/images/lore/ferdowsi-intro.png",
    "first-calendar":        "/season2/uploads/heroes/first_calender.png",
    "mount-alborz":          "/season2/uploads/heroes/mount_alborz.png",
    "fravahar":              "/season2/uploads/heroes/farvahar.png",
    "leopard-skins":         "/season2/uploads/heroes/leopard_skin.png",
    "black-demon":           "/season2/uploads/heroes/blak_demon.png",
    "discovery-of-fire":     "/season2/uploads/heroes/discovery_of_fire.png",
    "sade-ch2":              "/season2/uploads/heroes/discovery_of_fire.png",
    "first-iron-forge-card": "/season2/uploads/heroes/first_fire_forge.png",
    "iron-axe-card":         "/season2/uploads/heroes/iron_ax_of_hushang.png",
    "cypress-club-card":     "/season2/uploads/heroes/cypres_club.png",
    "thirty-scripts":        "/season2/uploads/heroes/thirty_alphabets.png",
    "crystal-throne-card":   "/season2/uploads/heroes/crystal_throne.png",
    "enchanted-lute":        "/season2/uploads/heroes/festival_of_sade.png",
    "awlad-guide":           "/season2/uploads/heroes/thirty_alphabets.png",
    "arzhang-trophy":        "/season2/uploads/heroes/blak_demon.png",
    "div-e-sepid":           "/season2/uploads/heroes/farvahar.png",
    "rakhsh":                "/season2/uploads/heroes/rostam.png",
    "mystical-ram":          "/season2/uploads/heroes/mount_alborz.png",
    "azhdaha-shield":        "/season2/uploads/heroes/blak_demon.png",
    "tahmuras-hero":         "/season2/uploads/chapters/tahmuras.png",
    "tahmuras-king":         "/season2/uploads/chapters/tahmuras.png",
    "jamshid":               "/season2/uploads/chapters/jamshid.png",
    "zahhak-shadow":         "/season2/uploads/chapters/zahhak.png",
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

    // Upgrade-priority: sort by level ascending so the heroes that need the
    // most work rise to the top. Mark any hero below level 5 as needing upgrade.
    const UPGRADE_THRESHOLD = 5;
    const spotlightHeroes = Object.entries(owned)
      .map(([hero_id, data]) => {
        const cat    = catMap[hero_id];
        const nameEn = (cat && cat.name)    || slugToName(hero_id);
        const nameFa = (cat && cat.name_fa) || SLUG_FA[hero_id];
        const lv     = data.level || 1;
        return {
          slug:        hero_id,
          name:        (fa && nameFa) ? nameFa : nameEn,
          image_url:   HERO_IMGS[hero_id] || (cat && (cat.image_url || cat.img)) || null,
          rarity:      (cat && cat.rarity)    || "",
          playerLevel: lv,
          zarPerHour:  data.zar_per_hour || 0,
          needsUpgrade: lv < UPGRADE_THRESHOLD,
        };
      })
      .sort((a, b) => (a.playerLevel || 1) - (b.playerLevel || 1))  // lowest first
      .slice(0, 3);

    host.innerHTML = spotlightHeroes.map(h => {
      // Build image src — prefer image_url, then known asset paths
      const slug    = h.slug || '';
      const slugEnc = encodeURIComponent(slug);
      const emo     = escapeHtml(heroEmoji(slug));
      let   imgTag  = '';
      if (h.image_url) {
        // image_url is set (prefer webp; fall back to png then jpg if webp fails)
        const fbPng = h.image_url.replace(/\.\w+$/, '.png');
        const fbJpg = h.image_url.replace(/\.\w+$/, '.jpg');
        imgTag = `<img src="${escapeAttr(h.image_url)}" alt="${escapeAttr(h.name)}" onerror="if(!this.dataset.fb1){this.dataset.fb1='1';this.src='${escapeAttr(fbPng)}';}else if(!this.dataset.fb2){this.dataset.fb2='1';this.src='${escapeAttr(fbJpg)}';}else{this.remove();}">`;
      } else {
        // No image_url: try chapters upload (most heroes) → heroes upload variants → asset sprite
        const chapPng = `/season2/uploads/chapters/${slugEnc}.png`;
        const upWebp  = `/season2/uploads/heroes/${slugEnc}.webp`;
        const upPng   = `/season2/uploads/heroes/${slugEnc}.png`;
        const upJpg   = `/season2/uploads/heroes/${slugEnc}.jpg`;
        const asset   = `/assets/images/heroes/${slugEnc}-hero.png`;
        imgTag = `<img src="${escapeAttr(chapPng)}" alt="${escapeAttr(h.name)}" onerror="if(!this.dataset.t1){this.dataset.t1='1';this.src='${escapeAttr(upWebp)}';}else if(!this.dataset.t2){this.dataset.t2='1';this.src='${escapeAttr(upPng)}';}else if(!this.dataset.t3){this.dataset.t3='1';this.src='${escapeAttr(upJpg)}';}else if(!this.dataset.t4){this.dataset.t4='1';this.src='${escapeAttr(asset)}';}else{this.remove();}">`;
      }
      const upgradeUrl = `heroes.html?open=${encodeURIComponent(slug)}`;
      return `
      <a href="${escapeAttr(upgradeUrl)}" class="hs-card${h.needsUpgrade ? ' hs-needs-upgrade' : ''}">
        <div class="hs-cover-img">${emo}${imgTag}</div>
        <div class="hs-cover-overlay">
          ${h.needsUpgrade
            ? `<span class="hs-cover-badge warn">⚠ ${escapeHtml(t('hs_upgrade_to_progress','Upgrade'))}</span>`
            : `<span class="hs-cover-badge">${escapeHtml(t('active_hero_kicker'))}</span>`}
          <div class="hs-cover-name">${escapeHtml(h.name)}</div>
          <div class="hs-cover-meta">
            <span class="hs-cover-lvl">${escapeHtml(t('hs_lvl_lbl'))} ${fmtNum(h.playerLevel || 1)}</span>
            <span class="hs-cover-upgrade">${escapeHtml(t('hero_up_link'))} ›</span>
          </div>
        </div>
      </a>`;
    }).join('');
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

  /* ── Return popups: offline earnings + daily strike ─────────────────── */

  const LAST_SEEN_KEY   = 'real_last_seen_ts';
  const LAST_VISIT_KEY  = 'real_last_visit_date';
  const LOCAL_STREAK_KEY = 'real_local_streak';
  const OFFLINE_SHOWN_KEY = 'real_offline_shown_ts';

  const DAILY_REWARDS = [
    { xp: 50,  zar: 0   },
    { xp: 100, zar: 0   },
    { xp: 150, zar: 50  },
    { xp: 200, zar: 0   },
    { xp: 250, zar: 100 },
    { xp: 300, zar: 0   },
    { xp: 200, zar: 200, gem: 1 },
  ];

  const todayDateStr = () => new Date().toISOString().slice(0, 10);

  const fmtDuration = (ms) => {
    const totalMin = Math.floor(ms / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const animateCount = (el, from, to, duration) => {
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = fmtNum(Math.round(from + (to - from) * p));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // Show a modal, animate amount counting up, then enable collect button
  const showModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) { modal.hidden = false; document.body.classList.add('modal-open'); }
  };
  const hideModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) { modal.hidden = true; document.body.classList.remove('modal-open'); }
  };

  const showOfflinePopup = (zarEarned, msAway, onCollect) => {
    const modal    = document.getElementById('offline-modal');
    if (!modal) return;
    const awayLbl  = modal.querySelector('[data-offline-away-label]');
    const amountEl = modal.querySelector('[data-offline-amount]');
    const xferEl   = modal.querySelector('[data-offline-transfer]');
    const collectBtn = modal.querySelector('[data-collect-offline]');

    if (awayLbl)   awayLbl.textContent  = t('offline_away_tpl', { t: fmtDuration(msAway) });
    if (amountEl)  amountEl.textContent = '0';
    if (xferEl)    xferEl.textContent   = `🪙 ${fmtNum(zarEarned)} ${t('r_zar')}`;

    showModal('offline-modal');
    // Count up animation after a short pause
    setTimeout(() => { if (amountEl) animateCount(amountEl, 0, zarEarned, 1200); }, 300);

    const close = () => { hideModal('offline-modal'); onCollect(); };
    if (collectBtn) collectBtn.onclick = close;
    modal.querySelector('[data-close-offline]').onclick = close;
  };

  const showStrikePopup = (streak, reward, onCollect) => {
    const modal = document.getElementById('strike-modal');
    if (!modal) return;
    const titleEl   = modal.querySelector('[data-strike-title]');
    const subEl     = modal.querySelector('[data-strike-sub]');
    const dotsEl    = modal.querySelector('[data-strike-dots]');
    const rewardEl  = modal.querySelector('[data-strike-rewards]');
    const xferEl    = modal.querySelector('[data-strike-transfer]');
    const collectBtn = modal.querySelector('[data-collect-strike]');

    const dayInCycle = ((streak - 1) % 7) + 1;

    if (titleEl) titleEl.textContent = t('strike_title_tpl', { n: fmtNum(streak) });
    if (subEl)   subEl.textContent   = t('strike_sub_tpl',   { n: fmtNum(streak) });

    // 7-dot progress row
    if (dotsEl) {
      dotsEl.innerHTML = Array.from({ length: 7 }, (_, i) => {
        const cls = i < dayInCycle ? 'sd done' : (i === dayInCycle ? 'sd today' : 'sd');
        return `<span class="${cls}">${i + 1}</span>`;
      }).join('');
    }

    // Reward chips
    let rewardParts = [];
    if (reward.xp)  rewardParts.push(`<span class="rm-chip xp-chip">+${fmtNum(reward.xp)} XP</span>`);
    if (reward.zar) rewardParts.push(`<span class="rm-chip zar-chip">🪙 +${fmtNum(reward.zar)} ${t('r_zar')}</span>`);
    if (reward.gem) rewardParts.push(`<span class="rm-chip gem-chip">💎 +${reward.gem} ${t('r_gems','Gem')}</span>`);
    if (rewardEl) rewardEl.innerHTML = rewardParts.join('');

    const xferParts = [];
    if (reward.xp)  xferParts.push(`+${fmtNum(reward.xp)} XP`);
    if (reward.zar) xferParts.push(`🪙 +${fmtNum(reward.zar)}`);
    if (xferEl) xferEl.textContent = xferParts.join('  ');

    showModal('strike-modal');

    const close = () => { hideModal('strike-modal'); onCollect(); };
    if (collectBtn) collectBtn.onclick = close;
    modal.querySelector('[data-close-strike]').onclick = close;
  };

  const doReturnPopups = () => {
    const now      = Date.now();
    const today    = todayDateStr();

    // Always stamp last-seen (used to calculate offline time next visit)
    try { localStorage.setItem(LAST_SEEN_KEY, String(now)); } catch {}
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden')
        try { localStorage.setItem(LAST_SEEN_KEY, String(Date.now())); } catch {}
    }, { once: true });

    // ── Offline earnings ─────────────────────────────────────────────────
    const lastSeen  = parseInt(lsRead(LAST_SEEN_KEY) || '0', 10);
    const zarPerHr  = parseInt(lsRead('real_total_zar_hr') || '0', 10);
    const msAway    = lastSeen ? Math.max(0, now - lastSeen) : 0;
    const minAway   = msAway / 60000;
    const offlineCollectedKey = OFFLINE_SHOWN_KEY + '_' + today; // per-day collect flag

    let offlineZar = 0;
    if (zarPerHr > 0 && minAway >= 10 && lsRead(offlineCollectedKey) !== '1') {
      const hoursAway = Math.min(minAway / 60, 8);
      const vipBonus  = 1 + (Math.floor(((window.RealPlayer && window.RealPlayer.getResource)
        ? (window.RealPlayer.getResource('xp') || 0) : 0) / 1000)) * 0.05;
      const teamMult  = parseFloat(lsRead('real_team_mult') || '1') || 1;
      offlineZar = Math.max(1, Math.floor(hoursAway * zarPerHr * vipBonus * teamMult));
    }

    // ── Daily strike ─────────────────────────────────────────────────────
    // Use a per-day "claimed" key so the stamp only happens on collect,
    // not on popup-open — prevents broken sessions from eating the reward.
    const strikeClaimKey = 'real_strike_claimed_' + today;
    const strikeAlreadyClaimed = lsRead(strikeClaimKey) === '1';

    const lastVisit = lsRead(LAST_VISIT_KEY) || '';
    let streak = parseInt(lsRead(LOCAL_STREAK_KEY) || '1', 10) || 1;
    if (!strikeAlreadyClaimed) {
      // Recalculate streak based on last collected day
      const yesterday = new Date(now - 86400000).toISOString().slice(0, 10);
      if (lastVisit === yesterday)                     streak = streak + 1;
      else if (lastVisit && lastVisit < yesterday)     streak = 1;
      // else first-ever visit: keep streak = 1
    }

    const reward = DAILY_REWARDS[((streak - 1) % 7)];

    // ── Sequential show ───────────────────────────────────────────────────
    const refreshHud = () => {
      if (window.RealResources) {
        const hud = document.querySelector('[data-resource-hud]');
        if (hud) window.RealResources.refreshHud(hud);
      }
    };

    const showStrike = () => {
      if (strikeAlreadyClaimed) return;
      showStrikePopup(streak, reward, () => {
        // Mark claimed ONLY after collect
        try {
          localStorage.setItem(strikeClaimKey, '1');
          localStorage.setItem(LAST_VISIT_KEY, today);
          localStorage.setItem(LOCAL_STREAK_KEY, String(streak));
        } catch {}
        if (window.RealPlayer) {
          if (reward.xp)  window.RealPlayer.addResource('xp',  reward.xp);
          if (reward.zar) window.RealPlayer.addResource('zar', reward.zar);
          if (reward.gem) window.RealPlayer.addResource('gems', reward.gem);
        }
        if (window.RealSync) window.RealSync.syncBalance();
        refreshHud();
      });
    };

    if (offlineZar > 0) {
      showOfflinePopup(offlineZar, msAway, () => {
        // Mark collected ONLY after collect
        try { localStorage.setItem(offlineCollectedKey, '1'); } catch {}
        if (window.RealPlayer) window.RealPlayer.addResource('zar', offlineZar);
        if (window.RealSync) window.RealSync.syncBalance();
        refreshHud();
        showStrike();
      });
    } else {
      showStrike();
    }
  };

  /* ── Boot ────────────────────────────────────────────────────────────── */
  const bootHomeHydration = () => {
    hydrateProfile();
    hydrateBanner();
    hydrateQuests();
    refreshTreasury();
    updateJourneyCard(null);  // immediate render from localStorage
    wireQuestClicks();
    wireClaimButton();
    wireTreasuryModals();
    // Return popups after page has settled (600 ms)
    setTimeout(doReturnPopups, 600);

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
