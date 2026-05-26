/* ==========================================================================
   REAL Shahnameh — Season 2
   Frontend prototype interactions: orb taps, quiz flow, tabs, share, toasts
   ========================================================================== */

(() => {
  "use strict";

  /* ---------- helpers ---------- */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* Single source of truth for the Telegram bot identity. Migrating
     to a new bot? Change BOT_USERNAME and every invite/share link
     in Season 2 follows. */
  const BOT_USERNAME = "shahnameh_bot";
  const DEFAULT_INVITE_SLUG = "warrior_setai";
  const inviteLink = (slug) =>
    `https://t.me/${BOT_USERNAME}?start=${encodeURIComponent(slug || DEFAULT_INVITE_SLUG)}`;

  /* ===========================================================
     Debug logger — console-only in production.
     Visual overlay appears ONLY when URL hash contains "debug"
     and APP_DEBUG meta tag is present (developer opt-in only).
     =========================================================== */

  const APP_DEBUG = location.hash.includes("debug");

  const Debug = (() => {
    let host = null;
    let log  = null;

    const ensureHost = () => {
      if (host) return host;
      host = document.createElement("div");
      host.setAttribute("data-debug-overlay", "");
      host.style.cssText = [
        "position:fixed", "left:0", "right:0", "bottom:0",
        "max-height:35vh", "overflow:auto",
        "background:rgba(8,10,18,.92)", "color:#ffd28a",
        "font:11px/1.4 ui-monospace,Menlo,Consolas,monospace",
        "padding:8px 12px 10px", "border-top:1px solid rgba(244,197,107,.4)",
        "z-index:2147483647", "white-space:pre-wrap", "word-break:break-word"
      ].join(";");
      const close = document.createElement("button");
      close.textContent = "×";
      close.setAttribute("aria-label", "Close debug overlay");
      close.style.cssText = "position:absolute;top:4px;right:8px;background:none;border:0;color:#ffd28a;font-size:16px;cursor:pointer";
      close.addEventListener("click", () => { host.remove(); host = null; });
      log = document.createElement("div");
      host.appendChild(close);
      host.appendChild(log);
      const attach = () => { if (document.body) document.body.appendChild(host); };
      if (document.body) attach(); else document.addEventListener("DOMContentLoaded", attach, { once: true });
      return host;
    };

    const lines = [];
    const render = () => {
      if (!APP_DEBUG) return;
      ensureHost();
      log.textContent = lines.slice(-30).join("\n");
    };

    return {
      push(label, detail) {
        const msg = `${label}${detail ? ": " + detail : ""}`;
        console.error("[Shahnameh]", msg);
        lines.push(msg);
        try { render(); } catch (_) {}
      },
      info(msg) {
        if (APP_DEBUG) console.log("[Shahnameh]", msg);
        lines.push(msg);
        try { render(); } catch (_) {}
      }
    };
  })();

  window.addEventListener("error", (e) => {
    const where = e.filename ? `${e.filename}:${e.lineno}` : "unknown";
    Debug.push("JS error", `${e.message} @ ${where}`);
  });
  window.addEventListener("unhandledrejection", (e) => {
    const reason = (e.reason && (e.reason.stack || e.reason.message)) || String(e.reason);
    Debug.push("Promise rejected", reason);
  });

  /* ===========================================================
     Telegram Mini App bootstrap — runs immediately so the
     WebView shell dismisses its loading screen ASAP.
     Falls back safely when running outside Telegram.
     =========================================================== */

  const tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;

  if (tg) {
    try {
      tg.ready();
      try { tg.expand(); } catch (_) { /* older clients */ }
      // Theme-aware background so the splash → app handoff stays dark.
      try { if (typeof tg.setBackgroundColor === "function") tg.setBackgroundColor("#04050b"); } catch (_) {}
      try { if (typeof tg.setHeaderColor === "function") tg.setHeaderColor("#04050b"); } catch (_) {}
      Debug.info(`Telegram init ok — platform=${tg.platform || "?"} v=${tg.version || "?"}`);
    } catch (err) {
      Debug.push("Telegram init failed", err && err.message);
    }
  } else {
    console.log("Telegram WebApp not detected — running in plain browser");
    Debug.info("Telegram WebApp not detected — running in plain browser");
  }

  const haptic = (style = "light") => {
    try {
      if (tg && tg.HapticFeedback) {
        if (style === "success" || style === "error" || style === "warning") {
          tg.HapticFeedback.notificationOccurred(style);
        } else {
          tg.HapticFeedback.impactOccurred(style);
        }
      } else if (navigator.vibrate) {
        navigator.vibrate(style === "heavy" ? 18 : style === "medium" ? 10 : 6);
      }
    } catch (_) { /* noop */ }
  };

  /* ===========================================================
     i18n dictionary (EN + FA) + path titles
     =========================================================== */

  // Translations live in season2/i18n/{en,fa,tg}.js (registered on
  // window.RealI18NLocales). This adapter keeps the legacy I18N[lang][key]
  // call shape so existing app.js code below does not need to change.
  const I18N = {
    get en() { return (window.RealI18NLocales && window.RealI18NLocales.en) || {}; },
    get fa() { return (window.RealI18NLocales && window.RealI18NLocales.fa) || {}; },
    get tg() { return (window.RealI18NLocales && window.RealI18NLocales.tg) || {}; },
  }

  const LS = {
    LANG: "real_lang",
    PATH: "real_path",
    PLAYER: "real_player_state_v1",
    S1_FLAG: "isSeason1Player",
    SKIN: "real_tap_skin_v1",
  };

  /* Minimal skin catalogue — mirrors tap.js SKINS but lives in app.js
     so the Settings panel can render the picker on any page. */
  const SKIN_CATALOGUE = [
    { id: "real",     nameKey: "skin_real",     emoji: "◆",  locked: false },
    { id: "keyumars", nameKey: "skin_keyumars",  emoji: "👑", locked: false },
    { id: "hushang",  nameKey: "skin_hushang",   emoji: "🔥", locked: true  },
    { id: "zahhak",   nameKey: "skin_zahhak",    emoji: "🐍", locked: true  },
    { id: "rostam",   nameKey: "skin_rostam",    emoji: "⚔",  locked: true  },
    { id: "simorgh",  nameKey: "skin_simorgh",   emoji: "🦅", locked: true  },
    { id: "royal",    nameKey: "skin_royal",     emoji: "🔱", locked: true  },
  ];

  /* ===========================================================
     Player state — single source of truth for the prototype.
     Persisted to localStorage today; the Player.get / Player.set /
     Player.claimSeason1Bonus contract is what backend should
     replace later. Storage adapter is intentionally narrow:
     swap the three calls in Storage.* to fetch/POST to switch
     transports without touching call sites.
     =========================================================== */

  const Storage = {
    read(key) {
      try { return localStorage.getItem(key); } catch { return null; }
    },
    write(key, val) {
      try { localStorage.setItem(key, val); } catch { /* quota / private mode */ }
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch { /* noop */ }
    }
  };

  const Player = {
    SCHEMA_VERSION: 2,

    /* Default profile for a fresh Season 2 entrant. Season 1
       players also start from scratch — they get a bonus card
       on top, not pre-filled progress. */
    defaults() {
      return {
        schemaVersion: Player.SCHEMA_VERSION,
        userId: null,                 // populated by Telegram WebApp later
        username: null,
        language: Storage.read(LS.LANG) || "en",
        path: Storage.read(LS.PATH) || "hero",
        level: 1,
        xp: 0,
        /* === Layered resources (Season 2 economy rework) ===
           - farr: prestige / divine glory; earned from chapters, streaks, hero ownership
           - zar:  gold of Pars; primary tap reward, daily quests, upgrades currency
           - gems: rare artifacts; invite milestones, special drops, relic crafting
           - balance: REAL — ecosystem layer, kept here for backwards compat
        */
        farr: 0,
        zar: 0,
        gems: 0,
        balance: 0,
        energy: 1000,
        energyMax: 1000,
        dailyStreak: 1,
        chapterProgress: { 1: { unlocked: true, completed: false } },
        heroes: {},                   // { rostam: { level, fragments } ... }
        referrals: 0,
        season1BonusClaimed: false,
        isSeason1Player: Storage.read(LS.S1_FLAG) === "true",
        earlySupporterMultiplier: 1,
        badges: [],
        createdAt: Date.now()
      };
    },

    /* Convenience: read/add to any resource by canonical name.
       Resources: "farr" | "zar" | "gems" | "xp" | "real" (real → balance). */
    _resourceField(kind) {
      return kind === "real" ? "balance" : kind;
    },
    getResource(kind) {
      const p = Player.get();
      return p[Player._resourceField(kind)] || 0;
    },
    addResource(kind, amount) {
      if (!amount) return Player.get();
      const field = Player._resourceField(kind);
      const cur = Player.get()[field] || 0;
      return Player.set({ [field]: cur + amount });
    },

    _load() {
      const raw = Storage.read(LS.PLAYER);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return null;
        return parsed;
      } catch { return null; }
    },

    _persist(state) {
      Storage.write(LS.PLAYER, JSON.stringify(state));
      // mirror legacy keys so the i18n / onboarding code stays simple
      if (state.language) Storage.write(LS.LANG, state.language);
      if (state.path)     Storage.write(LS.PATH, state.path);
    },

    get() {
      const stored = Player._load();
      if (!stored) {
        const fresh = Player.defaults();
        Player._persist(fresh);
        return fresh;
      }
      // backfill missing keys from defaults so older saves keep working
      const merged = { ...Player.defaults(), ...stored };
      // re-read external single-key flags every time so demo toggles win
      merged.isSeason1Player = Storage.read(LS.S1_FLAG) === "true" || !!merged.isSeason1Player;
      merged.language = Storage.read(LS.LANG) || merged.language;
      merged.path     = Storage.read(LS.PATH) || merged.path;
      return merged;
    },

    set(patch) {
      const next = { ...Player.get(), ...patch };
      Player._persist(next);
      return next;
    },

    /* Season 1 bonus award. Returns { ok, reason?, reward? }.
       This shape is what backend should mirror. */
    claimSeason1Bonus() {
      const p = Player.get();
      if (!p.isSeason1Player) return { ok: false, reason: "not_eligible" };
      if (p.season1BonusClaimed) return { ok: false, reason: "already_claimed" };
      const reward = {
        real: 500,
        badges: ["og_founder", "season1_frame"],
        chest: "founder_chest",
        multiplier: 1.05
      };
      const next = Player.set({
        season1BonusClaimed: true,
        balance: (p.balance || 0) + reward.real,
        badges: Array.from(new Set([...(p.badges || []), ...reward.badges])),
        earlySupporterMultiplier: reward.multiplier
      });
      return { ok: true, reward, state: next };
    },

    /* Demo helper — flips Season 1 eligibility for testing. Backend
       will own this flag in production; this lives behind a settings
       toggle for now. */
    setSeason1Demo(on) {
      if (on) {
        Storage.write(LS.S1_FLAG, "true");
        Player.set({ isSeason1Player: true });
      } else {
        Storage.remove(LS.S1_FLAG);
        Player.set({ isSeason1Player: false, season1BonusClaimed: false });
      }
    },

    /* Future swap-in: replace the bodies of these with API calls.
       Keep the same shapes; the rest of the app already awaits them. */
    api: {
      fetch: () => Promise.resolve(Player.get()),
      save: (patch) => Promise.resolve(Player.set(patch)),
      claimSeason1Bonus: () => Promise.resolve(Player.claimSeason1Bonus())
    }
  };

  // expose for console/demo only
  if (typeof window !== "undefined") window.RealPlayer = Player;

  /* ── Sovereign Economy ─────────────────────────────────────────────────
     VIP Level: every 1000 XP earned = +1 VIP Level.
     Passive Zar income: heroes generate Zar/hr; tick every 60s,
     with +5% bonus per VIP level applied to all Zar income.         */
  Player.vipLevel = () => Math.floor((Player.getResource("xp") || 0) / 1000);

  setInterval(() => {
    try {
      const zarHr = parseInt(localStorage.getItem("real_total_zar_hr") || "0", 10);
      if (!zarHr) return;
      const vipBonus  = 1 + Player.vipLevel() * 0.05;
      const teamMult  = parseFloat(localStorage.getItem("real_team_mult") || "1") || 1;
      const gain = Math.max(1, Math.floor((zarHr / 60) * vipBonus * teamMult));
      Player.addResource("zar", gain);
      if (window.RealResources) {
        const hud = document.querySelector("[data-resource-hud]");
        if (hud) window.RealResources.refreshHud(hud);
      }
    } catch (_) {}
  }, 60000);
  /* ───────────────────────────────────────────────────────────────────── */

  // Mirror Telegram user identity into Player state once it's available.
  try {
    const tgUser = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
    if (tgUser && tgUser.id) {
      Player.set({
        userId: String(tgUser.id),
        username: tgUser.username || tgUser.first_name || null
      });
      // Honor Telegram's UI language hint when the user hasn't picked one yet.
      // Telegram uses "fa" for Persian and "tg" for Tajik (per ISO 639-1).
      if (!Storage.read(LS.LANG)) {
        if (tgUser.language_code === "fa") Player.set({ language: "fa" });
        else if (tgUser.language_code === "tg") Player.set({ language: "tg" });
      }
    }
  } catch (err) {
    Debug.push("Player.set(tg user) failed", err && err.message);
  }

  const getLang = () => {
    const l = Storage.read(LS.LANG);
    return (l === "fa" || l === "en" || l === "tg") ? l : null;
  };
  const getPath = () => {
    const p = Storage.read(LS.PATH);
    return (p === "hero" || p === "heroine") ? p : null;
  };
  const t = (key) => {
    const lang = getLang() || "en";
    return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
  };

  const applyLang = (lang) => {
    const html = document.documentElement;
    // Persian is RTL; Tajik is Cyrillic LTR; English is LTR.
    html.setAttribute("lang", lang === "fa" ? "fa" : (lang === "tg" ? "tg" : "en"));
    html.setAttribute("dir",  lang === "fa" ? "rtl" : "ltr");

    // text content
    $$("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const val = (I18N[lang] && I18N[lang][key]);
      if (val != null) el.textContent = val;
    });
    // attribute swaps: data-i18n-attr="aria-label:close,placeholder:foo"
    $$("[data-i18n-attr]").forEach((el) => {
      const spec = el.getAttribute("data-i18n-attr");
      spec.split(",").forEach((pair) => {
        const [attr, key] = pair.split(":").map((s) => s.trim());
        const val = I18N[lang] && I18N[lang][key];
        if (val != null) el.setAttribute(attr, val);
      });
    });
  };

  const applyPath = (path) => {
    const lang = getLang() || "en";
    const titleKey = path === "heroine" ? "heroine_of_pars" : "warrior_of_pars";
    const nameKey  = path === "heroine" ? "kingname_heroine" : "kingname_hero";
    $$("[data-path-title]").forEach((el) => { el.textContent = (I18N[lang][titleKey]); });
    $$("[data-path-name]").forEach((el)  => { el.textContent = (I18N[lang][nameKey]);  });
  };

  /* ---------- toast (used by onboarding too, declared early) ---------- */
  const toast = (msg) => {
    const el = $("[data-toast]");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 1800);
  };

  /* ===========================================================
     Onboarding overlay
     =========================================================== */

  const buildOnboarding = () => {
    const lang = getLang(); // may be null
    const startStep = lang ? 2 : 1;

    const node = document.createElement("div");
    node.className = "onboarding";
    node.innerHTML = `
      <div class="ob-bg"></div>
      <div class="ob-shell">
        <div class="ob-brand">
          <div class="ob-crest">⚔</div>
          <div class="ob-brand-name" data-ob-brand>REAL Shahnameh</div>
          <div class="ob-brand-sub" data-ob-welcome>Welcome to Season 2</div>
        </div>

        <div class="ob-step" data-step="1">
          <h2 class="ob-h" data-ob-title>Choose your language</h2>
          <p class="ob-sub" data-ob-sub>You can change this anytime in settings.</p>
          <div class="ob-grid ob-grid-lang">
            <button class="ob-card" data-pick-lang="en">
              <span class="ob-flag">🇬🇧</span>
              <span class="ob-card-title">English</span>
              <span class="ob-card-sub">Continue in English</span>
            </button>
            <button class="ob-card" data-pick-lang="fa">
              <span class="ob-flag">🇮🇷</span>
              <span class="ob-card-title" lang="fa" dir="rtl">فارسی</span>
              <span class="ob-card-sub" lang="fa" dir="rtl">ادامه به فارسی</span>
            </button>
            <button class="ob-card" data-pick-lang="tg">
              <span class="ob-flag">🇹🇯</span>
              <span class="ob-card-title">Тоҷикӣ</span>
              <span class="ob-card-sub">Идома бо забони тоҷикӣ</span>
            </button>
          </div>
        </div>

        <div class="ob-step" data-step="2" hidden>
          <h2 class="ob-h" data-ob-title-2>Choose your path</h2>
          <p class="ob-sub" data-ob-sub-2>Your path shapes your title and future quests.</p>
          <div class="ob-grid">
            <button class="ob-card path" data-pick-path="hero">
              <span class="ob-emblem">⚔</span>
              <span class="ob-card-title" data-ob-hero>Hero</span>
              <span class="ob-card-sub" data-ob-hero-sub>Walk the path of warriors.</span>
            </button>
            <button class="ob-card path" data-pick-path="heroine">
              <span class="ob-emblem">♛</span>
              <span class="ob-card-title" data-ob-heroine>Heroine</span>
              <span class="ob-card-sub" data-ob-heroine-sub>Walk the path of queens and legends.</span>
            </button>
          </div>
          <div class="ob-foot">
            <button class="ghost-btn" data-ob-back>Back</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(node);
    document.body.classList.add("ob-open");

    const setStep = (n) => {
      $$(".ob-step", node).forEach((s) => {
        s.hidden = String(n) !== s.getAttribute("data-step");
      });
    };

    const refreshCopy = () => {
      const l = getLang() || "en";
      const tx = I18N[l];
      node.querySelector("[data-ob-brand]").textContent = tx.onboarding_brand;
      node.querySelector("[data-ob-welcome]").textContent = tx.onboarding_welcome;
      node.querySelector("[data-ob-title]").textContent = tx.onboarding_lang_title;
      node.querySelector("[data-ob-sub]").textContent = tx.onboarding_lang_sub;
      node.querySelector("[data-ob-title-2]").textContent = tx.onboarding_path_title;
      node.querySelector("[data-ob-sub-2]").textContent = tx.onboarding_path_sub;
      node.querySelector("[data-ob-hero]").textContent = tx.hero;
      node.querySelector("[data-ob-hero-sub]").textContent = tx.hero_sub;
      node.querySelector("[data-ob-heroine]").textContent = tx.heroine;
      node.querySelector("[data-ob-heroine-sub]").textContent = tx.heroine_sub;
      node.querySelector("[data-ob-back]").textContent = tx.back;
    };

    setStep(startStep);
    if (lang) { applyLang(lang); refreshCopy(); }

    // language picks
    $$("[data-pick-lang]", node).forEach((b) => {
      b.addEventListener("click", () => {
        const l = b.getAttribute("data-pick-lang");
        Player.set({ language: l });
        applyLang(l);
        refreshCopy();
        haptic("medium");
        setStep(2);
      });
    });

    // path picks
    $$("[data-pick-path]", node).forEach((b) => {
      b.addEventListener("click", () => {
        const p = b.getAttribute("data-pick-path");
        Player.set({ path: p });
        applyPath(p);
        haptic("success");
        node.classList.add("closing");
        setTimeout(() => {
          node.remove();
          document.body.classList.remove("ob-open");
          mountSettings();
          toast(t("saved"));
        }, 320);
      });
    });

    // back
    node.querySelector("[data-ob-back]").addEventListener("click", () => {
      setStep(1);
      haptic("light");
    });
  };

  /* ===========================================================
     Hamburger navigation menu — replaces settings cog
     Includes: all nav links + inline settings (language, path, skin, reset)
     =========================================================== */

  const mountSettings = () => {
    if (document.querySelector("[data-hamburger-btn]")) return;

    /* ── Hamburger button ── */
    const btn = document.createElement("button");
    btn.className = "hamburger-btn";
    btn.setAttribute("data-hamburger-btn", "");
    btn.setAttribute("data-settings-btn", ""); // legacy alias
    btn.setAttribute("aria-label", "Menu");
    btn.innerHTML = "&#9776;";
    document.body.appendChild(btn);

    /* ── Detect active page ── */
    const pagePath = window.location.pathname.split("/").pop() || "index.html";
    const isActive = (file) => pagePath === file || (file === "index.html" && pagePath === "");

    /* ── Nav links definition ── */
    const NAV_LINKS = [
      { file: "index.html",           ico: "🏠", key: "home",          section: "main" },
      { file: "learn.html",           ico: "📜", key: "learn",         section: "main" },
      { file: "tap.html",             ico: "⚡", key: "tap",           section: "main" },
      { file: "heroes.html",          ico: "⚔",  key: "heroes",        section: "main" },
      { file: "earn.html",            ico: "💎", key: "earn",          section: "main" },
      { file: "social.html",          ico: "👥", key: "social",        section: "main" },
      { file: "regions.html",         ico: "🗺", key: "nav_regions",   section: "world" },
      { file: "historical-sites.html",ico: "🏛", key: "nav_sites",     section: "world" },
      { file: "timeline.html",        ico: "⏳", key: "nav_timeline",  section: "world" },
      { file: "persia-map.html",      ico: "🌍", key: "nav_map",       section: "world" },
      { file: "offerings.html",       ico: "🔥", key: "nav_offerings", section: "world" },
      { file: "hakim.html",           ico: "🤖", key: "nav_hakim",     section: "world", cls: "hakim-link" },
      { file: null,                   ico: "⚔",  key: "guild",         section: "more",  coming: true },
      { file: null,                   ico: "🛒", key: "market",        section: "more",  coming: true },
      { file: null,                   ico: "📦", key: "inventory",     section: "more",  coming: true },
      { file: "profile.html",         ico: "👤", key: "profile",       section: "more"  },
    ];

    const buildNavLinks = (tx) => {
      let html = "";
      let lastSection = null;
      NAV_LINKS.forEach((n) => {
        if (n.section !== lastSection) {
          const sectionLabelMap = {
            main:  tx.explore || "Navigate",
            world: tx.nav_world || "World",
            more:  tx.coming_soon || "Coming Soon",
          };
          html += `<div class="hmenu-section-label">${sectionLabelMap[n.section] || n.section}</div>`;
          lastSection = n.section;
        }
        const active = n.file && isActive(n.file) ? "active" : "";
        const coming = n.coming ? "coming" : "";
        const cls = [n.cls || "", active, coming].filter(Boolean).join(" ");
        const href = n.file ? `href="${n.file}"` : "";
        const chip = n.coming ? `<span class="hmenu-chip">${tx.coming_soon || "Soon"}</span>` : "";
        html += `
          <a ${href} class="hmenu-link ${cls}" data-hmenu-link>
            <span class="hmenu-link-ico">${n.ico}</span>
            <span data-hmenu-label="${n.key}">${tx[n.key] || n.key}</span>
            ${chip}
          </a>`;
      });
      return html;
    };

    /* ── Menu overlay ── */
    const overlay = document.createElement("div");
    overlay.className = "hmenu-overlay";
    overlay.setAttribute("data-settings-panel", ""); // legacy alias
    overlay.innerHTML = `
      <div class="hmenu-backdrop" data-hmenu-backdrop></div>
      <div class="hmenu-panel" role="dialog" aria-modal="true" aria-label="Navigation menu">
        <div class="hmenu-head">
          <span class="hmenu-brand">REAL Shahnameh</span>
          <button class="hmenu-close" data-hmenu-close aria-label="Close menu">&#xd7;</button>
        </div>
        <div class="hmenu-body" data-hmenu-body></div>
        <div class="hmenu-settings">
          <div class="hmenu-settings-label" data-sp-lang-label>Language</div>
          <div class="hmenu-lang-row">
            <button class="hmenu-pick" data-set-lang="en">English</button>
            <button class="hmenu-pick" data-set-lang="fa" lang="fa" dir="rtl">فارسی</button>
            <button class="hmenu-pick" data-set-lang="tg">Тоҷикӣ</button>
          </div>
          <div class="hmenu-settings-label" style="margin-top:10px;" data-sp-path-label>Path</div>
          <div class="hmenu-path-row">
            <button class="hmenu-pick" data-set-path="hero">⚔ <span data-sp-hero>Hero</span></button>
            <button class="hmenu-pick" data-set-path="heroine">♛ <span data-sp-heroine>Heroine</span></button>
          </div>
          <div class="hmenu-settings-label" style="margin-top:10px;" data-sp-skins-label>Tap Icon</div>
          <div class="sp-skin-row" data-sp-skin-row style="flex-wrap:wrap; display:flex; gap:6px; margin-bottom:4px;"></div>
          <div class="hmenu-settings-label" style="margin-top:10px;" data-sp-s1-label>Demo</div>
          <button class="hmenu-pick sp-toggle" data-sp-s1-toggle style="width:100%; text-align:left; justify-content:space-between; display:flex; align-items:center;">
            <span data-sp-s1-text>Toggle Season 1 player</span>
            <span class="sp-toggle-state" data-sp-s1-state>OFF</span>
          </button>
          <div class="hmenu-settings-label" style="margin-top:10px;" data-sp-audio-label>Ambient Sound</div>
          <div class="hmenu-audio-row">
            <button class="hmenu-audio-btn" data-audio-toggle aria-pressed="false">
              <span data-audio-icon>🔇</span>
              <span data-audio-label>Sound Off</span>
            </button>
          </div>
          <button class="hmenu-reset" data-sp-reset>
            <span data-sp-reset-title>Reset onboarding</span>
            <span class="hmenu-reset-sub" data-sp-reset-sub>Choose language and path again.</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const body = overlay.querySelector("[data-hmenu-body]");

    const refresh = () => {
      const l = getLang() || "en";
      const p = getPath() || "hero";
      const isS1 = Player.get().isSeason1Player;
      const tx = I18N[l] || I18N.en || {};

      /* Nav links */
      body.innerHTML = buildNavLinks(tx);
      /* Prevent click on coming-soon links */
      $$("[data-hmenu-link].coming", overlay).forEach((a) => {
        a.addEventListener("click", (e) => e.preventDefault());
      });

      /* Settings labels */
      overlay.querySelector("[data-sp-lang-label]").textContent = tx.language || "Language";
      overlay.querySelector("[data-sp-path-label]").textContent = tx.path || "Path";
      overlay.querySelector("[data-sp-skins-label]").textContent = tx.tap_icon_section || "Tap Icon";
      overlay.querySelector("[data-sp-s1-label]").textContent = tx.demo || "Demo";
      overlay.querySelector("[data-sp-s1-text]").textContent = tx.toggle_s1_demo || "Toggle Season 1";
      overlay.querySelector("[data-sp-s1-state]").textContent = isS1 ? (tx.s1_demo_on || "ON") : (tx.s1_demo_off || "OFF");
      overlay.querySelector("[data-sp-hero]").textContent = tx.hero || "Hero";
      overlay.querySelector("[data-sp-heroine]").textContent = tx.heroine || "Heroine";
      overlay.querySelector("[data-sp-reset-title]").textContent = tx.reset_onboarding || "Reset onboarding";
      overlay.querySelector("[data-sp-reset-sub]").textContent = tx.reset_onboarding_sub || "Choose language and path again.";
      overlay.querySelector("[data-sp-audio-label]").textContent = tx.audio_section || "Ambient Sound";
      const audioEnabled = (window.RealAudio && window.RealAudio.isEnabled()) || localStorage.getItem("real_audio_enabled") === "true";
      const audioBtn = overlay.querySelector("[data-audio-toggle]");
      if (audioBtn) {
        audioBtn.classList.toggle("active", audioEnabled);
        audioBtn.setAttribute("aria-pressed", String(audioEnabled));
        const aIco = audioBtn.querySelector("[data-audio-icon]");
        if (aIco) aIco.textContent = audioEnabled ? "🔊" : "🔇";
        const aLbl = audioBtn.querySelector("[data-audio-label]");
        if (aLbl) aLbl.textContent = audioEnabled ? (tx.audio_on || "Sound On") : (tx.audio_off || "Sound Off");
      }

      /* Skin grid */
      const activeSkinId = Storage.read(LS.SKIN) || "real";
      const skinRow = overlay.querySelector("[data-sp-skin-row]");
      skinRow.innerHTML = "";
      SKIN_CATALOGUE.forEach((s) => {
        const b = document.createElement("button");
        b.className = ["sp-skin-btn", s.locked ? "locked" : "", (!s.locked && s.id === activeSkinId) ? "active" : ""].filter(Boolean).join(" ");
        b.setAttribute("data-sp-skin-id", s.id);
        b.title = tx[s.nameKey] || s.id;
        b.innerHTML = s.emoji + (s.locked ? "<span class='sp-skin-lock'>🔒</span>" : "");
        skinRow.appendChild(b);
      });

      /* Active states */
      $$("[data-set-lang]", overlay).forEach((b) => b.classList.toggle("active", b.getAttribute("data-set-lang") === l));
      $$("[data-set-path]", overlay).forEach((b) => b.classList.toggle("active", b.getAttribute("data-set-path") === p));
      overlay.querySelector("[data-sp-s1-toggle]").classList.toggle("active", isS1);
    };

    const open = () => { overlay.classList.add("open"); refresh(); haptic("light"); };
    const close = () => { overlay.classList.remove("open"); };

    btn.addEventListener("click", open);
    overlay.querySelector("[data-hmenu-backdrop]").addEventListener("click", close);
    overlay.querySelector("[data-hmenu-close]").addEventListener("click", close);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("open")) close();
    });

    $$("[data-set-lang]", overlay).forEach((b) => {
      b.addEventListener("click", () => {
        const l = b.getAttribute("data-set-lang");
        Player.set({ language: l });
        applyLang(l);
        applyPath(getPath() || "hero");
        renderSeason1Card();
        refresh();
        toast(t("saved"));
        haptic("success");
      });
    });
    $$("[data-set-path]", overlay).forEach((b) => {
      b.addEventListener("click", () => {
        const p = b.getAttribute("data-set-path");
        Player.set({ path: p });
        applyPath(p);
        refresh();
        toast(t("saved"));
        haptic("success");
      });
    });
    overlay.querySelector("[data-sp-s1-toggle]").addEventListener("click", () => {
      const next = !Player.get().isSeason1Player;
      Player.setSeason1Demo(next);
      renderSeason1Card();
      refresh();
      toast(next ? t("s1_demo_on") : t("s1_demo_off"));
      haptic("medium");
    });
    overlay.querySelector("[data-sp-skin-row]").addEventListener("click", (e) => {
      const b = e.target.closest("[data-sp-skin-id]");
      if (!b) return;
      const id = b.getAttribute("data-sp-skin-id");
      const skin = SKIN_CATALOGUE.find((s) => s.id === id);
      if (!skin || skin.locked) { toast(t("skin_locked_toast")); return; }
      Storage.write(LS.SKIN, id);
      if (window.RealSkins) window.RealSkins.apply(id);
      refresh();
      toast(t("saved"));
      haptic("success");
    });
    overlay.querySelector("[data-sp-reset]").addEventListener("click", () => {
      Storage.remove(LS.LANG);
      Storage.remove(LS.PATH);
      Storage.remove(LS.PLAYER);
      Storage.remove(LS.S1_FLAG);
      close();
      btn.remove();
      overlay.remove();
      buildOnboarding();
      haptic("medium");
    });
  };

  /* ===========================================================
     Season 1 bonus card render + claim
     =========================================================== */

  const renderSeason1Card = () => {
    const card = $("[data-s1-card]");
    if (!card) return;
    const lang = getLang() || "en";
    const tx = I18N[lang];
    const p = Player.get();

    const subEl    = card.querySelector("[data-s1-sub]");
    const btnEl    = card.querySelector("[data-s1-claim]");
    const claimedEl = card.querySelector("[data-s1-claimed-tag]");

    card.classList.remove("eligible", "ineligible", "claimed");

    if (!p.isSeason1Player) {
      card.classList.add("ineligible");
      if (subEl) subEl.textContent = tx.season1_card_ineligible_sub;
      if (btnEl) {
        btnEl.disabled = true;
        btnEl.textContent = tx.not_eligible;
      }
      if (claimedEl) claimedEl.hidden = true;
    } else if (p.season1BonusClaimed) {
      card.classList.add("claimed");
      if (subEl) subEl.textContent = tx.season1_card_claimed_sub;
      if (btnEl) {
        btnEl.disabled = true;
        btnEl.textContent = tx.claimed;
      }
      if (claimedEl) {
        claimedEl.hidden = false;
        claimedEl.textContent = tx.claimed_tag;
      }
    } else {
      card.classList.add("eligible");
      if (subEl) subEl.textContent = tx.season1_card_eligible_sub;
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.textContent = tx.claim_bonus;
      }
      if (claimedEl) claimedEl.hidden = true;
    }
  };

  // claim handler — single delegated listener so the card can re-render freely
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-s1-claim]");
    if (!btn || btn.disabled) return;
    const result = Player.claimSeason1Bonus();
    if (result.ok) {
      renderSeason1Card();
      fireBurst(t("bonus_claimed_toast"));
      toast(t("bonus_claimed_toast"));
      haptic("success");
    } else if (result.reason === "not_eligible") {
      toast(t("season1_card_ineligible_sub"));
      haptic("warning");
    } else {
      toast(t("season1_card_claimed_sub"));
      haptic("light");
    }
  });

  /* ===========================================================
     Bootstrap: apply stored prefs OR show onboarding
     =========================================================== */

  const lang0 = getLang();
  const path0 = getPath();
  if (lang0) applyLang(lang0); else applyLang("en");
  if (path0) applyPath(path0); else applyPath("hero");

  const needsOnboarding = !lang0 || !path0;
  const bootChrome = () => {
    if (needsOnboarding) buildOnboarding(); else mountSettings();
    renderSeason1Card();
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootChrome);
  } else {
    bootChrome();
  }

  /* ---------- shared: any click on [data-toast-msg] -> toast ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-toast-msg]");
    if (t) {
      toast(t.getAttribute("data-toast-msg"));
      haptic("light");
    }
  });

  /* ---------- invite link: rewrite all surfaces from BOT_USERNAME ---------- */
  const populateInviteLinks = () => {
    const p = (typeof Player !== "undefined") ? Player.get() : {};
    const slug = (p.username && String(p.username).replace(/[^a-z0-9_]/gi, "_")) || DEFAULT_INVITE_SLUG;
    const url  = inviteLink(slug);
    $$("[data-link]").forEach((el) => { el.textContent = url; });
    $$("[data-copy-link]").forEach((el) => { el.setAttribute("data-copy-link", url); });
  };
  populateInviteLinks();

  /* ---------- copy referral link ---------- */
  $$("[data-copy-link]").forEach((btn) => {
    const original = btn.textContent;
    btn.addEventListener("click", async () => {
      const value = btn.getAttribute("data-copy-link") || $("[data-link]")?.textContent || "";
      try {
        await navigator.clipboard.writeText(value);
        btn.textContent = "Copied ✓";
        toast("Invite link copied");
        haptic("success");
      } catch {
        btn.textContent = "Copy manually";
      }
      setTimeout(() => (btn.textContent = original), 1500);
    });
  });

  /* ---------- share button (Telegram or system) ---------- */
  $$("[data-share]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const url = $("[data-link]")?.textContent.trim() || location.href;
      const text = "Join me on REAL Shahnameh — Persian myths, real rewards. ⚔";
      if (tg && tg.openTelegramLink) {
        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
      } else if (navigator.share) {
        try { await navigator.share({ title: "REAL Shahnameh", text, url }); }
        catch (_) { /* dismissed */ }
      } else {
        try { await navigator.clipboard.writeText(`${text} ${url}`); toast("Link copied — paste anywhere"); }
        catch { toast("Copy this link"); }
      }
      haptic("medium");
      // Mark "invite" quest complete for today
      try { localStorage.setItem("real_quest_invite_" + new Date().toISOString().slice(0, 10), "true"); } catch (_) {}
      if (window.RealSync) window.RealSync.syncQuest("invite");
    });
  });

  /* ===========================================================
     PLAY: Energy Core orb
     - tap: spend energy, +N REAL, combo, occasional crit
     - regen: +1 every 3s up to max
     =========================================================== */

  const orb       = $("[data-energy-orb]");
  const coreWrap  = $("[data-core]");
  const energyEl  = $("[data-energy]");
  const fillEl    = $("[data-energy-fill]");
  const balanceEl = $("[data-balance]");
  const comboEl   = $("[data-combo]");

  if (orb && coreWrap && energyEl && fillEl) {
    const state = {
      max: 1000,
      energy: Player.get().energy || 1000,
      balance: Player.getResource("real") || 0,
      combo: 1,
      lastTap: 0,
      tapCost: 1,
      base: 12,
    };

    const renderEnergy = () => {
      energyEl.textContent = state.energy;
      fillEl.style.width = `${(state.energy / state.max) * 100}%`;
    };
    const renderBalance = () => {
      if (!balanceEl) return;
      balanceEl.innerHTML = `${state.balance.toLocaleString()}<small> REAL</small>`;
      balanceEl.classList.remove("flash");
      void balanceEl.offsetWidth;
      balanceEl.classList.add("flash");
    };
    const renderCombo = () => {
      if (!comboEl) return;
      comboEl.textContent = state.combo.toFixed(1);
    };

    /* drift particles */
    const spawnParticles = () => {
      if (document.hidden) return;
      const rect = coreWrap.getBoundingClientRect();
      const count = 10;
      for (let i = 0; i < count; i++) {
        const p = document.createElement("span");
        p.className = "particle";
        const size = Math.random() * 5 + 2;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.left = `${Math.random() * 100}%`;
        p.style.bottom = `${Math.random() * 30 + 30}%`;
        p.style.animationDuration = `${Math.random() * 3 + 2.4}s`;
        p.style.opacity = `${Math.random() * 0.5 + 0.4}`;
        coreWrap.appendChild(p);
        setTimeout(() => p.remove(), 6000);
      }
    };
    spawnParticles();
    const particleTimer = setInterval(spawnParticles, 2200);

    /* tap */
    const tap = (event) => {
      if (state.energy < state.tapCost) {
        toast("Out of energy — wait for regen or use Boost");
        haptic("warning");
        return;
      }
      const now = performance.now();
      // combo: chain taps within 800ms
      if (now - state.lastTap < 800) {
        state.combo = Math.min(state.combo + 0.1, 5);
      } else {
        state.combo = 1;
      }
      state.lastTap = now;

      const crit = Math.random() < 0.08;
      const reward = Math.round(state.base * state.combo * (crit ? 3 : 1));

      state.energy = Math.max(0, state.energy - state.tapCost);
      state.balance += reward;

      // Persist tap reward and energy to Player state so Treasury + sync stay correct
      Player.addResource("real", reward);
      Player.set({ energy: state.energy });

      // Daily tap counter for home quest tracker + server sync
      try {
        const _dk  = new Date().toISOString().slice(0, 10);
        const _key = "real_daily_taps_" + _dk;
        const _newCount = (parseInt(localStorage.getItem(_key) || "0", 10) + 1);
        localStorage.setItem(_key, String(_newCount));
        // Push tap count to server every 10 taps to stay durable
        if (_newCount % 10 === 0 && window.RealSync) {
          window.RealSync.syncQuest("tap", _newCount);
        }
      } catch (_) {}

      renderEnergy();
      renderBalance();
      renderCombo();

      // floating spark
      const spark = document.createElement("span");
      spark.className = `spark${crit ? " crit" : ""}`;
      spark.textContent = `+${reward}${crit ? " ⚡" : ""}`;
      const rect = coreWrap.getBoundingClientRect();
      const x = (event && event.clientX != null) ? event.clientX - rect.left : rect.width / 2;
      const y = (event && event.clientY != null) ? event.clientY - rect.top : rect.height / 2;
      spark.style.left = `${x - 12}px`;
      spark.style.top  = `${y - 18}px`;
      coreWrap.appendChild(spark);
      setTimeout(() => spark.remove(), 900);

      // floating ◆ coin from orb center
      const coin = document.createElement("span");
      coin.className = "coin-float";
      coin.textContent = "◆";
      coin.style.left = `${rect.width / 2 - 10}px`;
      coin.style.top  = `${rect.height / 2 - 20}px`;
      coreWrap.appendChild(coin);
      setTimeout(() => coin.remove(), 900);

      // combo popup
      if (state.combo >= 1.5 && !coreWrap.querySelector(".combo-pop")) {
        const cp = document.createElement("span");
        cp.className = "combo-pop";
        cp.textContent = `Combo ×${state.combo.toFixed(1)}`;
        coreWrap.appendChild(cp);
        setTimeout(() => cp.remove(), 1100);
      }

      // tap squish
      orb.animate([
        { transform: "scale(1)" },
        { transform: "scale(0.94)" },
        { transform: "scale(1.04)" },
        { transform: "scale(1)" }
      ], { duration: 220, easing: "ease-out" });

      haptic(crit ? "heavy" : "light");

      coreWrap.classList.add("tapped");
      setTimeout(() => coreWrap.classList.remove("tapped"), 200);
      if (crit) {
        coreWrap.classList.add("crit-burst");
        setTimeout(() => coreWrap.classList.remove("crit-burst"), 500);
      }
    };

    orb.addEventListener("click", tap);
    orb.addEventListener("touchstart", (e) => {
      const t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      tap({ clientX: t.clientX, clientY: t.clientY });
    }, { passive: true });

    /* regen */
    const regenTimer = setInterval(() => {
      if (state.energy < state.max) {
        state.energy = Math.min(state.max, state.energy + 1);
        renderEnergy();
      }
    }, 3000);

    /* boost button on Play */
    const boostBtn = $("[data-action=\"boost\"]");
    if (boostBtn) {
      boostBtn.addEventListener("click", () => {
        if (boostBtn.disabled) return;
        boostBtn.disabled = true;
        boostBtn.textContent = t("boost_active_timer_tpl").replace("{t}", "30:00");
        state.base *= 3;
        toast(t("boost_active_toast"));
        haptic("success");
        let secs = 30 * 60;
        const tick = setInterval(() => {
          secs -= 1;
          const m = String(Math.floor(secs / 60)).padStart(2, "0");
          const s = String(secs % 60).padStart(2, "0");
          boostBtn.textContent = t("boost_active_timer_tpl").replace("{t}", `${m}:${s}`);
          if (secs <= 0) {
            clearInterval(tick);
            state.base = Math.round(state.base / 3);
            boostBtn.disabled = false;
            boostBtn.textContent = t("activate");
          }
        }, 1000);
      });
    }

    window.addEventListener("beforeunload", () => {
      clearInterval(particleTimer);
      clearInterval(regenTimer);
    });
  }

  /* ===========================================================
     HEROES: hydrate portraits from the server catalog.
     /api/catalog/heroes is the source of truth (admin writes,
     season2 reads). Slug = first word of the card's <h3>,
     lowercased letters only. Failures keep the emoji fallback.
     =========================================================== */
  (() => {
    const cards = $$(".hero-card");
    if (cards.length === 0) return;
    const slugify = (s) => String(s || "").toLowerCase().replace(/[^a-z]/g, "").slice(0, 32);
    fetch("/api/catalog/heroes", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(body => {
        if (!body || !body.status || !Array.isArray(body.heroes)) return;
        const bySlug = new Map(body.heroes.map(h => [h.slug, h]));
        if (bySlug.size === 0) return;
        cards.forEach(card => {
          const h3 = card.querySelector("h3");
          if (!h3) return;
          const slug = slugify(h3.firstChild ? h3.firstChild.textContent : h3.textContent);
          const hero = bySlug.get(slug);
          if (!hero) return;
          // image: explicit url → auto .png → auto .jpg → emoji stays
          const portrait = card.querySelector(".portrait");
          if (portrait) {
            const _slug = encodeURIComponent(hero.slug || "");
            const src = hero.image_url || `/season2/uploads/heroes/${_slug}.png`;
            const jpg = hero.image_url ? null : `/season2/uploads/heroes/${_slug}.jpg`;
            const img = new Image();
            img.alt = hero.name || "";
            img.loading = "lazy";
            img.decoding = "async";
            img.onload = () => { portrait.textContent = ""; portrait.appendChild(img); };
            if (jpg) img.onerror = () => { img.onerror = null; img.src = jpg; };
            img.src = src;
          }
          // description swap (subtle — only if .role exists and isn't already custom)
          const role = card.querySelector(".role");
          if (role && hero.bonus) {
            const r = String(hero.rarity || "").toLowerCase();
            const rKey = r === "legendary" ? "rarity_legend" : r ? "rarity_" + r : "";
            const rLabel = rKey ? (t(rKey) !== rKey ? t(rKey) : hero.rarity) : "";
            role.textContent = `${rLabel} · ${hero.bonus}`;
          }
        });
      })
      .catch(() => { /* offline — keep static markup */ });
  })();

  /* ===========================================================
     EARN: rewarded ad placeholder.
     Buttons opt-in via [data-ad="energy|gems|real"]. The flow shows
     a fullscreen "Ad loading…" stage, then on completion calls the
     server /api/ads/claim endpoint which enforces the daily limit
     and writes to ad-rewards.json. No real ad SDK is wired — the
     stub provider is intentional and visible in the audit log.
     =========================================================== */
  (() => {
    const buttons = $$("[data-ad]");
    if (buttons.length === 0) return;
    const overlay = $("[data-ad-overlay]");
    const stage   = $("[data-ad-stage]");
    const label   = $("[data-ad-label]");
    const close   = $("[data-ad-close]");
    const remEl   = $("[data-ad-remaining]");
    if (!overlay || !stage) return;

    const tgUserId = (window.Telegram && window.Telegram.WebApp
      && window.Telegram.WebApp.initDataUnsafe
      && window.Telegram.WebApp.initDataUnsafe.user
      && window.Telegram.WebApp.initDataUnsafe.user.id) || null;
    const localId = (() => {
      let s = localStorage.getItem("real_local_id");
      if (!s) { s = "u_" + Math.random().toString(36).slice(2, 10); try { localStorage.setItem("real_local_id", s); } catch {} }
      return s;
    })();

    const refreshStatus = async () => {
      try {
        const url = "/api/ads/status" + (tgUserId ? "?telegram_id=" + tgUserId : "");
        const r = await fetch(url);
        const j = await r.json();
        if (remEl && j && j.status) {
          remEl.textContent = `${j.remaining} / ${j.dailyLimit} today`;
          buttons.forEach(b => { b.disabled = j.remaining <= 0; });
        }
      } catch {}
    };
    refreshStatus();

    const closeOverlay = () => { overlay.classList.remove("open"); overlay.setAttribute("aria-hidden", "true"); stage.classList.remove("success"); };
    if (close) close.addEventListener("click", closeOverlay);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeOverlay(); });

    const grant = async (type) => {
      // Show "Ad loading…" stub for ~1.5s, then claim.
      stage.classList.remove("success");
      label.textContent = "Ad loading…";
      overlay.classList.add("open"); overlay.setAttribute("aria-hidden", "false");
      await new Promise(r => setTimeout(r, 1500));
      try {
        const body = { reward_type: type, user_id: localId };
        if (tgUserId) body.telegram_id = String(tgUserId);
        const r = await fetch("/api/ads/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        const j = await r.json();
        if (!r.ok || !j.status) {
          label.textContent = (j && j.error) || "Reward unavailable";
          toast(label.textContent);
          return;
        }
        stage.classList.add("success");
        const amt = j.claim && j.claim.reward_amount;
        const labelMap = { energy: amt + " ⚡ added", gems: amt + " 💎 added", real: "+" + amt + " REAL" };
        label.textContent = labelMap[type] || "Reward granted";
        toast(label.textContent);
        refreshStatus();
        setTimeout(closeOverlay, 1400);
      } catch (e) {
        label.textContent = "Network error";
        toast("Could not reach reward server");
      }
    };

    buttons.forEach(b => b.addEventListener("click", () => grant(b.dataset.ad)));
  })();

  /* ===========================================================
     LEARN: hydrate chapters from server catalog + show Season 2
     "Day X of journey" progression. The catalog is the source of
     truth — admin edits flow into chapter cards on next page view.
     Falls back silently to the static markup when the catalog is
     unreachable.
     =========================================================== */
  const SERVER_QUIZZES = { byChapter: new Map(), byChapterSlug: new Map() };

  (() => {
    const map = $("[data-chapter-map]");
    if (!map) return;
    const chapterCards = $$(".chapter", map);

    fetch("/api/catalog/chapters", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(body => {
        if (!body || !body.status || !Array.isArray(body.chapters)) return;
        const byId = new Map(body.chapters.map(c => [String(c.id), c]));

        chapterCards.forEach(card => {
          const id = card.getAttribute("data-chapter");
          const ch = byId.get(String(id));
          if (!ch) return;
          // title + copy
          const h4 = card.querySelector("h4");
          const copy = card.querySelector(".copy");
          if (h4)   h4.textContent   = ch.title || h4.textContent;
          if (copy) copy.textContent = ch.summary || ch.story?.slice(0, 140) + "…" || copy.textContent;
          // status -> classes
          card.classList.remove("done", "active", "locked");
          if (ch.status === "completed")       card.classList.add("done");
          else if (ch.status === "available" || ch.status === "published") card.classList.add("active");
          else                                  card.classList.add("locked");
          // node text
          const node = card.querySelector(".node");
          if (node) {
            if (card.classList.contains("done")) node.textContent = "✓";
            else node.textContent = String(ch.id || ch.order || id);
          }
          // chapter slug for quiz lookup
          if (ch.slug) card.setAttribute("data-chapter-slug", ch.slug);
          // image: explicit url → auto .png → auto .jpg → no thumb (static layout unchanged)
          if (!card.querySelector(".thumb")) {
            const _slug = encodeURIComponent(ch.slug || "");
            const src = ch.image_url || `/season2/uploads/chapters/${_slug}.png`;
            const jpg = ch.image_url ? null : `/season2/uploads/chapters/${_slug}.jpg`;
            const img = new Image();
            img.className = "thumb";
            img.alt = ch.title || "";
            img.loading = "lazy";
            img.decoding = "async";
            img.onload = () => { if (h4) h4.before(img); };
            if (jpg) img.onerror = () => { img.onerror = null; img.src = jpg; };
            img.src = src;
          }
        });

        // Progress card
        const total = body.totalChapters || body.chapters.length;
        const done  = body.chapters.filter(c => c.status === "completed").length;
        const pct   = total ? Math.round((done / total) * 100) : 0;
        const elDone = $("[data-chapters-done]");
        const elPct  = $("[data-chapters-pct]");
        const elFill = $("[data-chapters-fill]");
        const fmtN = (n) => (window.RealI18N && window.RealI18N.formatNumber) ? window.RealI18N.formatNumber(n) : String(n);
        if (elDone) elDone.textContent = t("chapters_progress_tpl").replace("{done}", fmtN(done)).replace("{total}", fmtN(total));
        if (elPct)  elPct.textContent  = fmtN(pct) + "%";
        if (elFill) elFill.style.width = pct + "%";

        // Day X of journey: clamp by today's date once a journey-start
        // is recorded locally; default to 1 for fresh players. The
        // chapter unlock_day field drives "Complete today's story to
        // unlock tomorrow's legend" UX.
        const STARTED_KEY = "real_journey_started_at";
        let started = parseInt(localStorage.getItem(STARTED_KEY) || "0", 10);
        if (!started) {
          started = Date.now();
          try { localStorage.setItem(STARTED_KEY, String(started)); } catch {}
        }
        const dayNum = Math.max(1, Math.floor((Date.now() - started) / 86400e3) + 1);
        const seasonLen = body.seasonLengthDays || 270;
        const dayPill = $("[data-journey-day]");
        if (dayPill) {
          dayPill.textContent = `Day ${dayNum} of ${seasonLen} · 9-month journey`;
        }
      })
      .catch(() => { /* offline — keep static fallback */ });

    fetch("/api/catalog/quizzes", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(body => {
        if (!body || !body.status || !Array.isArray(body.quizzes)) return;
        body.quizzes.forEach(q => {
          if (!SERVER_QUIZZES.byChapterSlug.has(q.chapter_slug)) {
            SERVER_QUIZZES.byChapterSlug.set(q.chapter_slug, []);
          }
          SERVER_QUIZZES.byChapterSlug.get(q.chapter_slug).push(q);
        });
      })
      .catch(() => {});
  })();

  /* ===========================================================
     HEROES: tab filtering
     =========================================================== */

  const heroTabs = $("[data-hero-tabs]");
  const heroList = $("[data-hero-list]");
  if (heroTabs && heroList) {
    heroTabs.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab");
      if (!btn) return;
      $$(".tab", heroTabs).forEach((t) => t.classList.remove("active"));
      btn.classList.add("active");
      const f = btn.getAttribute("data-filter");
      $$(".hero-card", heroList).forEach((card) => {
        const cat = card.getAttribute("data-cat");
        // "all" excludes special cards; "special" shows only special
        const show = f === "special" ? cat === "special" : (f === "all" ? cat !== "special" : cat === f);
        card.style.display = show ? "" : "none";
      });
      haptic("light");
    });
  }

  /* upgrade buttons on hero cards */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".hero-upgrade");
    if (!btn || btn.disabled) return;
    btn.animate([{ transform: "scale(1)" }, { transform: "scale(0.95)" }, { transform: "scale(1)" }],
      { duration: 180 });
    toast("Hero upgraded — passive +1 tier");
    haptic("success");
  });

  /* ===========================================================
     SOCIAL: leaderboard tab switching
     =========================================================== */

  const lbTabs = $("[data-lb-tabs]");
  if (lbTabs) {
    lbTabs.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab");
      if (!btn) return;
      const key = btn.getAttribute("data-lb");
      $$(".tab", lbTabs).forEach((t) => t.classList.remove("active"));
      btn.classList.add("active");
      $$("[data-lb-panel]").forEach((p) => {
        p.style.display = p.getAttribute("data-lb-panel") === key ? "" : "none";
      });
      haptic("light");
    });
  }

  /* ===========================================================
     LEARN: chapter open / quiz flow
     =========================================================== */

  const QUIZ = {
    1:  { title: "Keyumars — The First King", story: "From the mountains of Pars, Keyumars rules a world still soft with dawn. He clothes himself in leopard skin and the beasts bow.", q: "What does Keyumars wear as his royal mantle?", opts: ["Lion mane", "Leopard skin", "Eagle feathers", "Iron mail"], answer: 1, xp: 200, real: 80 },
    2:  { title: "Hushang — The Spark of Fire", story: "Hushang strikes flint at a serpent and instead wakes the eternal flame. Sade, the festival of fire, is born.", q: "What festival does Hushang's fire create?", opts: ["Mehregan", "Nowruz", "Sade", "Yalda"], answer: 2, xp: 250, real: 100 },
    3:  { title: "Tahmuras — Binder of Demons", story: "Tahmuras the Div-band rides through smoke and chains the demons. They beg for life and trade their secret: writing.", q: "What knowledge do the demons teach Tahmuras to keep their lives?", opts: ["Mining iron", "The art of writing", "Sailing", "Falconry"], answer: 1, xp: 300, real: 120 },
    4:  { title: "Jamshid — The Golden Throne", story: "Jamshid divides the people into four crafts and sits a kingdom of crystal. Pride finally outshines the sun.", q: "Why does Jamshid lose the divine grace (farr)?", opts: ["He refuses fire", "He claims to be a god", "He kills a demon", "He forgets Sade"], answer: 1, xp: 350, real: 150 },
    5:  { title: "Zahhak — The Serpent King", story: "Two serpents grow from Zahhak's shoulders. Their daily price is two human brains. A thousand years of darkness.", q: "Where do Zahhak's serpents grow from?", opts: ["His crown", "His shoulders", "His belt", "His shadow"], answer: 1, xp: 400, real: 180 },
    6:  { title: "Fereydun — The Liberator", story: "Kaveh the blacksmith raises his apron as a banner. Fereydun's bull-headed mace ends a tyrant.", q: "What weapon does Fereydun use to defeat Zahhak?", opts: ["Spear of fire", "Bow of dawn", "Bull-head mace", "Crystal sword"], answer: 2, xp: 450, real: 200 },
    7:  { title: "Zal — The Albino Prince", story: "Born white-haired, cast to the mountain, raised by Simorgh, Zal returns to Pars on wings of myth.", q: "Which mythical creature raises Zal?", opts: ["Dragon", "Simorgh", "Akvan Div", "Rakhsh"], answer: 1, xp: 500, real: 230 },
    8:  { title: "Rostam — Pahlavan of the Age", story: "Seven labours, one Rakhsh, no equal under the sky. Rostam becomes the world's pillar of arms.", q: "How many labours (Haft Khan) does Rostam complete?", opts: ["Three", "Five", "Seven", "Twelve"], answer: 2, xp: 600, real: 260 },
    9:  { title: "Sohrab — Son of the Storm", story: "Two armies camp on opposite shores. Father and son, unknowing, raise blades against each other.", q: "Who is Sohrab's father?", opts: ["Zal", "Esfandiyar", "Rostam", "Fereydun"], answer: 2, xp: 650, real: 280 },
    10: { title: "Esfandiyar — The Brazen-Bodied", story: "Steel cannot cut him, except where his eyes can be reached.", q: "Where is Esfandiyar vulnerable?", opts: ["His heels", "His eyes", "His left arm", "His back"], answer: 1, xp: 700, real: 320 },
    11: { title: "Simorgh — The Phoenix Council", story: "Wings the colour of the sun. The mountain remembers a wisdom older than language.", q: "Whose family does Simorgh protect across generations?", opts: ["Jamshid", "Zal and Rostam", "Fereydun", "Keyumars"], answer: 1, xp: 800, real: 360 },
    12: { title: "The Final War — Ages End", story: "The chronicle closes where it began: with fire, with iron, with kings.", q: "Who is the legendary author of the Shahnameh?", opts: ["Rumi", "Hafez", "Ferdowsi", "Saadi"], answer: 2, xp: 1500, real: 600 }
  };

  const map     = $("[data-chapter-map]");
  const modal   = $("[data-modal]");
  const burst   = $("[data-burst]");
  const burstLb = $("[data-burst-label]");

  if (map && modal) {
    const elTitle    = $("[data-modal-title]", modal);
    const elSub      = $("[data-modal-sub]", modal);
    const elStory    = $("[data-modal-story]", modal);
    const elQuestion = $("[data-modal-question]", modal);
    const elOptions  = $("[data-modal-options]", modal);
    const elResult   = $("[data-modal-result]", modal);
    const elResTitle = $("[data-result-title]", modal);
    const elResBody  = $("[data-result-body]", modal);
    const elResRew   = $("[data-result-rewards]", modal);
    const elNext     = $("[data-modal-next]", modal);
    const elActions  = $("[data-modal-actions]", modal);
    const elClose    = $("[data-modal-close]", modal);

    let currentChapterEl = null;
    let currentId = null;

    const openModal = (chapterEl) => {
      const id = parseInt(chapterEl.getAttribute("data-chapter"), 10);
      const data = QUIZ[id];
      if (!data) return;
      currentChapterEl = chapterEl;
      currentId = id;

      elTitle.textContent = data.title;
      elSub.textContent = chapterEl.classList.contains("done")
        ? "Reread the passage and revisit the quiz."
        : "Read the cinematic and answer to claim rewards.";
      elStory.textContent = data.story;
      elQuestion.textContent = data.q;
      elOptions.innerHTML = "";
      data.opts.forEach((opt, idx) => {
        const b = document.createElement("button");
        b.className = "quiz-option";
        b.innerHTML = `<span>${opt}</span><span style="opacity:.5; font-size:11px;">${String.fromCharCode(65 + idx)}</span>`;
        b.addEventListener("click", () => answer(idx, b, data));
        elOptions.appendChild(b);
      });
      elResult.classList.remove("show");
      elActions.style.display = "";
      elOptions.style.display = "";
      elQuestion.style.display = "";

      modal.classList.add("open");
      document.body.style.overflow = "hidden";
      haptic("light");

      // Mark "read a scene" quest — award XP for reading
      try { localStorage.setItem("real_quest_read_" + new Date().toISOString().slice(0, 10), "true"); } catch (_) {}
      Player.addResource("xp", 25);
      if (window.RealSync) window.RealSync.syncQuest("read");
      window.dispatchEvent(new CustomEvent("real:quest:read", { detail: { xp: 25 } }));
    };

    const closeModal = () => {
      modal.classList.remove("open");
      document.body.style.overflow = "";
      currentChapterEl = null;
      currentId = null;
    };

    const answer = (idx, btn, data) => {
      $$(".quiz-option", elOptions).forEach((b) => b.classList.add("disabled"));
      const correct = idx === data.answer;
      if (correct) {
        btn.classList.add("correct");
        haptic("success");
        // Mark quiz done — credit XP, REAL, and Farr to Player
        try { localStorage.setItem("real_quest_quiz_" + new Date().toISOString().slice(0, 10), "true"); } catch (_) {}
        Player.addResource("xp",   data.xp);
        Player.addResource("real", data.real);
        Player.addResource("farr", 1);
        // Write chapter-done flag consumed by heroes.js prereq system
        try {
          const _cs = { 1:"keyumars", 2:"hushang", 3:"tahmuras", 4:"jamshid", 5:"zahhak" };
          if (_cs[currentId]) localStorage.setItem("real_chapter_done_" + _cs[currentId], "1");
        } catch (_) {}
        if (window.RealSync) { window.RealSync.syncQuest("quiz"); window.RealSync.syncBalance(); }
        window.dispatchEvent(new CustomEvent("real:quest:quiz", { detail: { xp: data.xp, real: data.real, farr: 1 } }));
        elResTitle.textContent = `+${data.xp} ${t("r_xp")} · +${data.real} REAL · ✦1 ${t("r_farr")}`;
        elResBody.textContent = t("chapter_rewards_locked");
        elResRew.innerHTML = `<span class="chip warm">⭐ ${data.xp} ${t("r_xp")}</span><span class="chip">◆ ${data.real} REAL</span><span class="chip gold">✦1 ${t("r_farr")}</span>`;
        elResult.classList.add("show");
        // mark chapter done
        if (currentChapterEl) {
          currentChapterEl.classList.remove("active", "locked");
          currentChapterEl.classList.add("done");
          const node = currentChapterEl.querySelector(".node");
          if (node) node.textContent = "✓";
        }
        // unlock the next chapter
        const next = currentId + 1;
        const nextEl = map.querySelector(`[data-chapter="${next}"]`);
        if (nextEl && nextEl.classList.contains("locked")) {
          nextEl.classList.remove("locked");
          nextEl.classList.add("active");
          fireBurst(t("chapter_next_unlocked").replace("{n}", next));
        }
      } else {
        btn.classList.add("wrong");
        haptic("error");
        // reveal correct
        const correctBtn = $$(".quiz-option", elOptions)[data.answer];
        if (correctBtn) correctBtn.classList.add("correct");
        elResTitle.textContent = t("quiz_reread_title");
        elResBody.textContent = t("quiz_no_xp_round");
        elResRew.innerHTML = "";
        elResult.classList.add("show");
      }
    };

    elNext.addEventListener("click", closeModal);
    elClose.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
    });

    map.addEventListener("click", (e) => {
      const ch = e.target.closest(".chapter");
      if (!ch) return;
      // learn.js renders available chapters as <a> elements — let the browser navigate.
      if (ch.tagName === "A") return;
      if (ch.classList.contains("locked")) {
        toast("Complete the previous chapter to unlock");
        haptic("warning");
        return;
      }
      openModal(ch);
    });
  }

  /* ── Chapter 1 Final Encounter ──────────────────────────── */
  const feCard = document.getElementById("ch1-final-encounter");
  if (feCard) {
    const FE_KEY = "real_ch1_final_encounter_done";

    const renderFinalEncounter = () => {
      const ch1Done      = (() => { try { return localStorage.getItem("real_chapter_done_keyumars") === "1"; } catch { return false; } })();
      const owned        = window.RealSync ? window.RealSync.getOwnedHeroes() : {};
      const keyLv        = owned["keyumars"] ? (owned["keyumars"].level || 0) : 0;
      const siamakIn     = !!owned["siamak"];
      const verifiedRef  = (() => { try { return parseInt(localStorage.getItem("real_verified_referral_count") || "0", 10); } catch { return 0; } })();
      const alreadyDone  = (() => { try { return localStorage.getItem(FE_KEY) === "1"; } catch { return false; } })();

      if (alreadyDone) {
        feCard.innerHTML = `
          <div class="fe-card fe-complete">
            <div class="fe-icon">🏆</div>
            <div class="fe-body">
              <div class="fe-kicker">${t("fe_chapter_complete_kicker")}</div>
              <div class="fe-title">${t("fe_ch1_complete_title")}</div>
              <div class="fe-sub">${t("fe_ch1_complete_sub")}</div>
            </div>
          </div>`;
        return;
      }

      const reqs = [
        { key: "fe_req_quiz",     done: ch1Done,           note: "" },
        { key: "fe_req_keyumars", done: keyLv >= 5,         note: ` (${t("fe_current")} Lv.${keyLv})` },
        { key: "fe_req_siamak",   done: siamakIn,           note: "" },
        { key: "fe_req_clan",     done: verifiedRef >= 1,   note: ` (${verifiedRef}/1)` },
      ];
      const allMet = reqs.every(r => r.done);

      feCard.innerHTML = `
        <div class="fe-card ${allMet ? "fe-active" : "fe-locked"}">
          <div class="fe-top">
            <span class="fe-icon">${allMet ? "⚔" : "🔒"}</span>
            <div class="fe-body">
              <div class="fe-kicker">${t("fe_kicker")}</div>
              <div class="fe-title">${t("fe_ch1_title")}</div>
            </div>
          </div>
          <div class="fe-reqs">
            ${reqs.map(r => `<div class="fe-req ${r.done ? "fe-done" : ""}">
              <span class="fe-check">${r.done ? "✓" : "○"}</span>
              <span>${t(r.key)}${r.note}</span>
            </div>`).join("")}
          </div>
          <button class="fe-btn${allMet ? "" : " fe-btn-locked"}" id="fe-trigger"${allMet ? "" : " disabled"}>
            ${allMet ? t("fe_btn_active") : t("fe_btn_locked")}
          </button>
        </div>`;

      if (allMet) {
        document.getElementById("fe-trigger").addEventListener("click", completeFinalEncounter);
      }
    };

    const completeFinalEncounter = () => {
      try { localStorage.setItem(FE_KEY, "1"); } catch (_) {}
      Player.addResource("farr", 1);
      if (window.RealSync) window.RealSync.syncBalance();
      fireBurst(t("fe_burst_label"));
      renderFinalEncounter();
    };

    /* Render immediately; re-check when quiz or referrals update */
    renderFinalEncounter();
    window.addEventListener("real:quest:quiz",      renderFinalEncounter);
    window.addEventListener("real:referral:update", renderFinalEncounter);
  }

  /* unlock burst overlay */
  const fireBurst = (label = "Unlocked") => {
    if (!burst) return;
    if (burstLb) burstLb.textContent = label;
    burst.classList.add("show");
    haptic("success");
    setTimeout(() => burst.classList.remove("show"), 900);
  };

  /* Allow earn.js / social.js to trigger burst via custom event */
  window.addEventListener("real:burst", (e) => {
    fireBurst((e && e.detail && e.detail.label) || "Unlocked");
  });
})();
