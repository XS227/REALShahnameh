/* ==========================================================================
   REAL Shahnameh — Season 2
   Frontend prototype interactions: orb taps, quiz flow, tabs, share, toasts
   ========================================================================== */

(() => {
  "use strict";

  /* ---------- helpers ---------- */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ===========================================================
     i18n dictionary (EN + FA) + path titles
     =========================================================== */

  const I18N = {
    en: {
      // nav
      play: "Play", heroes: "Heroes", learn: "Learn", earn: "Earn", social: "Social",

      // titles
      play_title: "REAL Shahnameh",
      learn_title: "Shahnameh Journey",
      learn_sub: "Read · Quiz · Reward · Unlock the next age.",
      heroes_title: "Heroes Collection",
      heroes_sub: "Each hero grants a passive that bends the game.",
      earn_title: "Earn REAL",
      earn_sub: "Bring your tribe. Earn forever.",
      social_title: "Social Hub",
      social_sub: "Compete, ally, climb the chronicle together.",

      // top bar / labels
      vip: "VIP",
      season2: "Season 2",
      level: "LVL",
      balance: "Balance",
      profit_hr: "Profit / hr",
      energy: "Energy",
      auto_claim: "REAL · auto-claim",
      today_delta: "+1,240 today",

      // play actions
      boost: "Boost",
      boost_copy: "Multiply tap power 3× for 30 minutes. Stacks with combo critical.",
      activate: "Activate",
      invite: "Invite",
      invite_copy: "Bring allies. Earn 10% of their REAL forever + chest drops.",
      share_link_btn: "Share Link",

      // play stats
      your_edge: "Your edge",
      compare: "Compare ›",
      daily_streak: "Daily streak",
      combo: "Combo",
      referral_real: "Referral REAL",
      xp_to_level: "XP to LVL 18",
      streak_days: "12 days",

      // learn
      chronicle: "Chronicle",
      chronological: "Chronological",
      chronicle_progress: "Chronicle progress",
      chapters_done: "2 of 12 chapters complete",
      story_xp_boost: "+50% Story XP",
      hero_fragments: "Hero fragments",
      boost_drops: "Boost drops",

      // heroes
      collection_count: "7 / 24",
      forge_title: "Hero Forge",
      forge_copy: "Fuse fragments into rare and legendary heroes.",
      forge_btn: "Forge",
      all: "All", people: "People", creatures: "Creatures", places: "Places",
      set_bonus: "Set bonus · Lions of Pars",
      set_bonus_value: "+8% tap power",
      set_collect_msg: "Collect 5 more legendaries to unlock",
      mythic_frame: "Mythic frame",
      upgrade: "Upgrade",
      locked: "Locked",

      // earn
      viral: "VIRAL",
      your_invite_link: "Your invite link",
      share_to_telegram: "Share to Telegram",
      copy_link: "Copy Link",
      lifetime_10: "+10% lifetime",
      season_pts_20: "+20% Season pts",
      chest_drops: "Chest drops",
      team_multiplier: "Team multiplier",
      active_referrals: "Active referrals",
      milestones: "Milestones",
      tap_to_share: "Tap to share",
      real_utility: "REAL Utility",
      airdrop_score: "Airdrop score",
      airdrop_eligible: "Eligibility ascending",
      team_rewards: "Team rewards",
      view_contest: "View Contest",

      // social
      live: "LIVE",
      guild_wars: "Guild Wars · Week 3",
      guild_wars_sub: "Lions of Pars · #12 → push to top 10 for bonus REAL.",
      enter_event: "Enter",
      top_earners: "Top Earners",
      top_learners: "Top Learners",
      top_referrers: "Top Referrers",
      guilds: "Guilds",
      all_guilds: "All guilds ›",
      activity: "Activity",
      events: "Events",
      joined: "Joined", apply: "Apply", full: "Full",

      // path titles
      warrior_of_pars: "⚔ Warrior of Pars",
      heroine_of_pars: "♛ Heroine of Pars",
      kingname_hero: "King Setai",
      kingname_heroine: "Queen Setai",

      // onboarding
      onboarding_welcome: "Welcome to Season 2",
      onboarding_brand: "REAL Shahnameh",
      onboarding_lang_title: "Choose your language",
      onboarding_lang_sub: "You can change this anytime in settings.",
      onboarding_path_title: "Choose your path",
      onboarding_path_sub: "Your path shapes your title and future quests.",
      hero: "Hero",
      heroine: "Heroine",
      hero_sub: "Walk the path of warriors.",
      heroine_sub: "Walk the path of queens and legends.",
      cont: "Continue",
      back: "Back",
      begin: "Begin Season 2",
      english: "English",
      persian: "فارسی",

      // settings
      settings: "Settings",
      language: "Language",
      path: "Path",
      reset_onboarding: "Reset onboarding",
      reset_onboarding_sub: "Choose language and path again.",
      close: "Close",
      saved: "Saved",
      reset_done: "Onboarding reset"
    },
    fa: {
      play: "بازی", heroes: "قهرمانان", learn: "یادگیری", earn: "درآمد", social: "اجتماعی",

      play_title: "ریل شاهنامه",
      learn_title: "سفر شاهنامه",
      learn_sub: "بخوان · پاسخ بده · جایزه بگیر · فصل بعد را باز کن.",
      heroes_title: "مجموعه قهرمانان",
      heroes_sub: "هر قهرمان توانی پنهان به بازی می‌بخشد.",
      earn_title: "کسب REAL",
      earn_sub: "قبیله‌ات را بیاور. تا ابد درآمد بگیر.",
      social_title: "مرکز اجتماعی",
      social_sub: "رقابت، اتحاد، صعود در شاهنامه — همه با هم.",

      vip: "ویژه",
      season2: "فصل دوم",
      level: "سطح",
      balance: "موجودی",
      profit_hr: "درآمد ساعتی",
      energy: "انرژی",
      auto_claim: "REAL · دریافت خودکار",
      today_delta: "+۱٬۲۴۰ امروز",

      boost: "تقویت",
      boost_copy: "قدرت ضربه را ۳ برابر کن، برای ۳۰ دقیقه. با ترکیب بحرانی هم‌افزا می‌شود.",
      activate: "فعال‌سازی",
      invite: "دعوت",
      invite_copy: "هم‌رزمان را بیاور. ۱۰٪ از REAL آن‌ها را تا ابد بگیر و صندوقچه دریافت کن.",
      share_link_btn: "اشتراک لینک",

      your_edge: "برتری شما",
      compare: "مقایسه ›",
      daily_streak: "زنجیره روزانه",
      combo: "ترکیب",
      referral_real: "REAL از معرفی",
      xp_to_level: "XP تا سطح ۱۸",
      streak_days: "۱۲ روز",

      chronicle: "شرح وقایع",
      chronological: "ترتیب تاریخی",
      chronicle_progress: "پیشرفت شاهنامه",
      chapters_done: "۲ از ۱۲ فصل کامل شد",
      story_xp_boost: "+۵۰٪ XP داستانی",
      hero_fragments: "قطعات قهرمان",
      boost_drops: "دریافت تقویتی",

      collection_count: "۷ / ۲۴",
      forge_title: "آهنگری قهرمان",
      forge_copy: "قطعات را در آهنگری به قهرمانان نایاب و افسانه‌ای تبدیل کن.",
      forge_btn: "آهنگری",
      all: "همه", people: "اشخاص", creatures: "موجودات", places: "مکان‌ها",
      set_bonus: "پاداش گروه · شیران پارس",
      set_bonus_value: "+۸٪ قدرت ضربه",
      set_collect_msg: "۵ افسانه‌ای دیگر جمع کن تا باز شود",
      mythic_frame: "قاب اساطیری",
      upgrade: "ارتقا",
      locked: "قفل",

      viral: "وایرال",
      your_invite_link: "لینک دعوت شما",
      share_to_telegram: "اشتراک در تلگرام",
      copy_link: "کپی لینک",
      lifetime_10: "+۱۰٪ مادام‌العمر",
      season_pts_20: "+۲۰٪ امتیاز فصل",
      chest_drops: "صندوقچه‌ها",
      team_multiplier: "ضریب تیمی",
      active_referrals: "معرفی‌های فعال",
      milestones: "نقاط عطف",
      tap_to_share: "برای اشتراک‌گذاری بزن",
      real_utility: "کاربردهای REAL",
      airdrop_score: "امتیاز ایردراپ",
      airdrop_eligible: "واجد شرایط در حال صعود",
      team_rewards: "پاداش تیمی",
      view_contest: "مشاهده مسابقه",

      live: "زنده",
      guild_wars: "جنگ اتحادیه‌ها · هفته ۳",
      guild_wars_sub: "شیران پارس · #۱۲ → به جمع ۱۰ تای برتر برس و REAL پاداش بگیر.",
      enter_event: "ورود",
      top_earners: "برترین درآمدزایان",
      top_learners: "برترین دانش‌آموختگان",
      top_referrers: "برترین معرفان",
      guilds: "اتحادیه‌ها",
      all_guilds: "همه اتحادیه‌ها ›",
      activity: "فعالیت",
      events: "رویدادها",
      joined: "عضو شدی", apply: "درخواست", full: "تکمیل",

      warrior_of_pars: "⚔ قهرمان پارس",
      heroine_of_pars: "♛ قهرمان‌بانو پارس",
      kingname_hero: "شاه ستائی",
      kingname_heroine: "ملکه ستائی",

      onboarding_welcome: "به فصل دوم خوش آمدید",
      onboarding_brand: "ریل شاهنامه",
      onboarding_lang_title: "زبان خود را انتخاب کنید",
      onboarding_lang_sub: "این انتخاب را هرگاه بخواهی از تنظیمات تغییر بده.",
      onboarding_path_title: "مسیر خود را انتخاب کنید",
      onboarding_path_sub: "مسیر تو عنوان و ماجراهای آینده‌ات را شکل می‌دهد.",
      hero: "قهرمان",
      heroine: "قهرمان‌بانو",
      hero_sub: "گام در راه جنگاوران بگذار.",
      heroine_sub: "گام در راه ملکه‌ها و افسانه‌ها بگذار.",
      cont: "ادامه",
      back: "بازگشت",
      begin: "آغاز فصل دوم",
      english: "English",
      persian: "فارسی",

      settings: "تنظیمات",
      language: "زبان",
      path: "مسیر",
      reset_onboarding: "بازنشانی شروع",
      reset_onboarding_sub: "زبان و مسیر را دوباره انتخاب کن.",
      close: "بستن",
      saved: "ذخیره شد",
      reset_done: "بازنشانی انجام شد"
    }
  };

  const LS = {
    LANG: "real_lang",
    PATH: "real_path"
  };

  const getLang = () => {
    const l = localStorage.getItem(LS.LANG);
    return (l === "fa" || l === "en") ? l : null;
  };
  const getPath = () => {
    const p = localStorage.getItem(LS.PATH);
    return (p === "hero" || p === "heroine") ? p : null;
  };
  const t = (key) => {
    const lang = getLang() || "en";
    return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
  };

  const applyLang = (lang) => {
    const html = document.documentElement;
    html.setAttribute("lang", lang === "fa" ? "fa" : "en");
    html.setAttribute("dir", lang === "fa" ? "rtl" : "ltr");

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
          <div class="ob-grid">
            <button class="ob-card" data-pick-lang="en">
              <span class="ob-flag">🇬🇧</span>
              <span class="ob-card-title">English</span>
              <span class="ob-card-sub">Continue in English</span>
            </button>
            <button class="ob-card" data-pick-lang="fa">
              <span class="ob-flag">🇮🇷</span>
              <span class="ob-card-title">فارسی</span>
              <span class="ob-card-sub">ادامه به فارسی</span>
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
        localStorage.setItem(LS.LANG, l);
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
        localStorage.setItem(LS.PATH, p);
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
     Settings (cog) — appears after onboarding
     =========================================================== */

  const mountSettings = () => {
    if (document.querySelector("[data-settings-btn]")) return;
    const btn = document.createElement("button");
    btn.className = "settings-cog";
    btn.setAttribute("data-settings-btn", "");
    btn.setAttribute("aria-label", "Settings");
    btn.innerHTML = "⚙";
    document.body.appendChild(btn);

    const panel = document.createElement("div");
    panel.className = "settings-panel";
    panel.setAttribute("data-settings-panel", "");
    panel.innerHTML = `
      <div class="sp-bg" data-sp-bg></div>
      <div class="sp-card">
        <div class="grabber"></div>
        <h3 data-sp-title>Settings</h3>
        <div class="sp-section">
          <div class="sp-label" data-sp-lang-label>Language</div>
          <div class="sp-row">
            <button class="sp-pick" data-set-lang="en">English</button>
            <button class="sp-pick" data-set-lang="fa">فارسی</button>
          </div>
        </div>
        <div class="sp-section">
          <div class="sp-label" data-sp-path-label>Path</div>
          <div class="sp-row">
            <button class="sp-pick" data-set-path="hero">⚔ <span data-sp-hero>Hero</span></button>
            <button class="sp-pick" data-set-path="heroine">♛ <span data-sp-heroine>Heroine</span></button>
          </div>
        </div>
        <button class="sp-reset" data-sp-reset>
          <span data-sp-reset-title>Reset onboarding</span>
          <span class="sp-reset-sub" data-sp-reset-sub>Choose language and path again.</span>
        </button>
        <button class="ghost-btn btn-block" style="margin-top:10px;" data-sp-close>Close</button>
      </div>
    `;
    document.body.appendChild(panel);

    const refresh = () => {
      const l = getLang() || "en";
      const p = getPath() || "hero";
      const tx = I18N[l];
      panel.querySelector("[data-sp-title]").textContent = tx.settings;
      panel.querySelector("[data-sp-lang-label]").textContent = tx.language;
      panel.querySelector("[data-sp-path-label]").textContent = tx.path;
      panel.querySelector("[data-sp-hero]").textContent = tx.hero;
      panel.querySelector("[data-sp-heroine]").textContent = tx.heroine;
      panel.querySelector("[data-sp-reset-title]").textContent = tx.reset_onboarding;
      panel.querySelector("[data-sp-reset-sub]").textContent = tx.reset_onboarding_sub;
      panel.querySelector("[data-sp-close]").textContent = tx.close;
      // active state
      $$("[data-set-lang]", panel).forEach((b) => b.classList.toggle("active", b.getAttribute("data-set-lang") === l));
      $$("[data-set-path]", panel).forEach((b) => b.classList.toggle("active", b.getAttribute("data-set-path") === p));
    };

    const open = () => { panel.classList.add("open"); refresh(); haptic("light"); };
    const close = () => { panel.classList.remove("open"); };

    btn.addEventListener("click", open);
    panel.querySelector("[data-sp-bg]").addEventListener("click", close);
    panel.querySelector("[data-sp-close]").addEventListener("click", close);

    $$("[data-set-lang]", panel).forEach((b) => {
      b.addEventListener("click", () => {
        const l = b.getAttribute("data-set-lang");
        localStorage.setItem(LS.LANG, l);
        applyLang(l);
        applyPath(getPath() || "hero");
        refresh();
        toast(t("saved"));
        haptic("success");
      });
    });
    $$("[data-set-path]", panel).forEach((b) => {
      b.addEventListener("click", () => {
        const p = b.getAttribute("data-set-path");
        localStorage.setItem(LS.PATH, p);
        applyPath(p);
        refresh();
        toast(t("saved"));
        haptic("success");
      });
    });
    panel.querySelector("[data-sp-reset]").addEventListener("click", () => {
      localStorage.removeItem(LS.LANG);
      localStorage.removeItem(LS.PATH);
      close();
      btn.remove();
      panel.remove();
      buildOnboarding();
      haptic("medium");
    });
  };

  /* ===========================================================
     Bootstrap: apply stored prefs OR show onboarding
     =========================================================== */

  const lang0 = getLang();
  const path0 = getPath();
  if (lang0) applyLang(lang0); else applyLang("en");
  if (path0) applyPath(path0); else applyPath("hero");

  const needsOnboarding = !lang0 || !path0;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (needsOnboarding) buildOnboarding(); else mountSettings();
    });
  } else {
    if (needsOnboarding) buildOnboarding(); else mountSettings();
  }

  const tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
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

  /* ---------- shared: any click on [data-toast-msg] -> toast ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-toast-msg]");
    if (t) {
      toast(t.getAttribute("data-toast-msg"));
      haptic("light");
    }
  });

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
      energy: parseInt(energyEl.textContent, 10) || 720,
      balance: parseInt((balanceEl?.textContent || "0").replace(/[^\d]/g, ""), 10) || 12840,
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
        boostBtn.textContent = "Boost active · 30:00";
        state.base *= 3;
        toast("Boost active · ×3 tap power for 30 min");
        haptic("success");
        let secs = 30 * 60;
        const tick = setInterval(() => {
          secs -= 1;
          const m = String(Math.floor(secs / 60)).padStart(2, "0");
          const s = String(secs % 60).padStart(2, "0");
          boostBtn.textContent = `Boost active · ${m}:${s}`;
          if (secs <= 0) {
            clearInterval(tick);
            state.base = Math.round(state.base / 3);
            boostBtn.disabled = false;
            boostBtn.textContent = "Activate";
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
        const show = f === "all" || cat === f;
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
        elResTitle.textContent = `+${data.xp} XP · +${data.real} REAL`;
        elResBody.textContent = "Chapter rewards locked in.";
        elResRew.innerHTML = `<span class="chip warm">⭐ ${data.xp} XP</span><span class="chip">🪙 ${data.real} REAL</span><span class="chip lush">+1 Hero fragment</span>`;
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
          fireBurst(`Chapter ${next} unlocked`);
        }
      } else {
        btn.classList.add("wrong");
        haptic("error");
        // reveal correct
        const correctBtn = $$(".quiz-option", elOptions)[data.answer];
        if (correctBtn) correctBtn.classList.add("correct");
        elResTitle.textContent = "Re-read and try again";
        elResBody.textContent = "No XP this round — the chronicle awaits.";
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
      if (ch.classList.contains("locked")) {
        toast("Complete the previous chapter to unlock");
        haptic("warning");
        return;
      }
      openModal(ch);
    });
  }

  /* unlock burst overlay */
  const fireBurst = (label = "Unlocked") => {
    if (!burst) return;
    if (burstLb) burstLb.textContent = label;
    burst.classList.add("show");
    haptic("success");
    setTimeout(() => burst.classList.remove("show"), 900);
  };
})();
