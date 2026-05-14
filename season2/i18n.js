/* ==========================================================================
   REAL Shahnameh — i18n RUNTIME
   Translation DATA lives in season2/i18n/{en,fa,tg}.js (each registers
   window.RealI18NLocales[lang] = { key: value, ... } synchronously).
   This file is the runtime: t(), applyLocale(), getLang(), formatNumber().
   Load order on every page:
       <script src="i18n/en.js"></script>
       <script src="i18n/fa.js"></script>
       <script src="i18n/tg.js"></script>
       <script src="i18n.js"></script>            ← (this file)
   ========================================================================== */
(() => {
  "use strict";

  const LANG_LS = "real_lang";
  const SUPPORTED = ["en", "fa", "tg"];
  const isSupported = (l) => SUPPORTED.indexOf(l) !== -1;

  const getLang = () => {
    try {
      const v = localStorage.getItem(LANG_LS);
      return isSupported(v) ? v : "en";
    } catch { return "en"; }
  };

  /* Dictionaries are populated by the per-locale data files BEFORE this
     runtime executes. We hold a reference to the global registry — the
     legacy `STRINGS` accessor on the public API still resolves through it. */
  const LOCALES = () => window.RealI18NLocales || {};

  /* ---- Persian digit table (used for fa output) ---- */
  const FA_DIGITS = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];
  const toPersianDigits = (str) => String(str).replace(/[0-9]/g, (d) => FA_DIGITS[+d]);

  const formatNumber = (n) => {
    const s = Number(n).toLocaleString("en-US");
    return getLang() === "fa" ? toPersianDigits(s) : s;
  };
  const formatPercent = (n) => {
    const s = `${n}%`;
    return getLang() === "fa" ? toPersianDigits(s) : s;
  };

  /* =========================================================
     t(key, vars?) — look up by current lang, fall back to EN,
     finally fall back to the key itself. Supports {placeholder}
     substitution and auto-converts digits to Persian in fa.
     ========================================================= */
  const t = (key, vars) => {
    const lang = getLang();
    const dicts = LOCALES();
    let s = (dicts[lang] && dicts[lang][key])
        || (dicts.en && dicts.en[key])
        || key;
    if (vars && typeof s === "string") {
      s = s.replace(/\{(\w+)\}/g, (m, k) =>
        Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : m);
      if (lang === "fa") s = toPersianDigits(s);
    }
    return s;
  };

  /* =========================================================
     applyLocale — sweep the page swapping data-i18n elements,
     and sync <html lang>/<html dir>. Safe to call multiple times.
     ========================================================= */
  const applyLocale = () => {
    const lang = getLang();
    const dicts = LOCALES();
    const dict = dicts[lang] || dicts.en || {};
    const isFa = (lang === "fa");
    const isRtl = isFa; // Tajik is Cyrillic LTR

    /* Sync <html lang>/<html dir>. app.js also does this, but pages that
       only load i18n.js (e.g. intro.html) rely on us. */
    const htmlEl = document.documentElement;
    if (htmlEl) {
      htmlEl.setAttribute("lang", isFa ? "fa" : (lang === "tg" ? "tg" : "en"));
      htmlEl.setAttribute("dir", isRtl ? "rtl" : "ltr");
    }

    /* data-i18n: replace textContent */
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const val = dict[key];
      if (val != null) el.textContent = val;
    });

    /* data-i18n-html: replace innerHTML */
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.getAttribute("data-i18n-html");
      const val = dict[key];
      if (val != null) el.innerHTML = val;
    });

    /* data-i18n-placeholder: replace placeholder attribute */
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      const val = dict[key];
      if (val != null) el.placeholder = val;
    });

    /* data-i18n-attr: replace one or more attributes
       Format: "aria-label:close,placeholder:foo" */
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      const spec = el.getAttribute("data-i18n-attr") || "";
      spec.split(",").forEach((pair) => {
        const idx = pair.indexOf(":");
        if (idx < 0) return;
        const attr = pair.slice(0, idx).trim();
        const key  = pair.slice(idx + 1).trim();
        const val  = dict[key];
        if (val != null) el.setAttribute(attr, val);
      });
    });

    /* Persian-digit conversion for static markers + dynamic balance fields. */
    if (isFa) {
      document.querySelectorAll("[data-fa-num]").forEach((el) => {
        el.textContent = toPersianDigits(el.textContent);
      });
      const dynamicEls = document.querySelectorAll(
        "[data-balance], [data-energy], [data-combo], [data-level], [data-team-mult], [data-referrals], [data-chapters-done], [data-chapters-pct]"
      );
      dynamicEls.forEach((el) => {
        el.textContent = toPersianDigits(el.textContent);
        const obs = new MutationObserver(() => {
          const raw = el.textContent;
          const conv = toPersianDigits(raw);
          if (raw !== conv) {
            obs.disconnect();
            el.textContent = conv;
            obs.observe(el, { childList: true, subtree: true, characterData: true });
          }
        });
        obs.observe(el, { childList: true, subtree: true, characterData: true });
      });
    }

    /* Per-page document.title fallback for fa/tg if the page didn't override. */
    const page = (location.pathname.split("/").pop() || "index.html").replace(/\?.*/, "");
    const titleByLang = {
      fa: {
        "tap.html":    "ریل شاهنامه — کوره‌ی پارس",
        "learn.html":  "ریل شاهنامه — یادگیری",
        "heroes.html": "ریل شاهنامه — قهرمانان",
        "earn.html":   "ریل شاهنامه — مأموریت‌ها و پاداش‌ها",
        "social.html": "ریل شاهنامه — اجتماعی",
        "index.html":  "ریل شاهنامه",
        "intro.html":  "ریل شاهنامه",
        "chapter.html":"ریل شاهنامه — فصل",
      },
      tg: {
        "tap.html":    "REAL Шоҳнома — Кӯраи Порс",
        "learn.html":  "REAL Шоҳнома — Омӯзиш",
        "heroes.html": "REAL Шоҳнома — Қаҳрамонон",
        "earn.html":   "REAL Шоҳнома — Вазифаҳо ва мукофотҳо",
        "social.html": "REAL Шоҳнома — Иҷтимоӣ",
        "index.html":  "REAL Шоҳнома",
        "intro.html":  "REAL Шоҳнома",
        "chapter.html":"REAL Шоҳнома — Боб",
      },
    };
    if (titleByLang[lang] && titleByLang[lang][page]) {
      document.title = titleByLang[lang][page];
    }
  };

  /* Backwards-compat: a `STRINGS` getter on RealI18N still resolves through
     RealI18NLocales so any code that reads RealI18N.STRINGS.en[key] keeps
     working. */
  const stringsAccessor = {
    get en()  { return (LOCALES().en) || {}; },
    get fa()  { return (LOCALES().fa) || {}; },
    get tg()  { return (LOCALES().tg) || {}; },
  };

  /* pickLocalized(val) — val may be a plain string OR an {en,fa,tg} object.
     Returns the value for the current language, falling back to en, then "". */
  const pickLocalized = (val) => {
    if (!val || typeof val !== "object" || Array.isArray(val)) return String(val == null ? "" : val);
    const lang = getLang();
    return val[lang] != null ? val[lang] : (val.en != null ? val.en : "");
  };

  /* locField(obj, field) — returns obj[field_lang] if lang≠en and exists,
     else obj[field].  Works for string and array fields alike. */
  const locField = (obj, field) => {
    const lang = getLang();
    if (lang !== "en") {
      const lk = field + "_" + lang;
      if (obj[lk] != null) return obj[lk];
    }
    return obj[field] != null ? obj[field] : "";
  };

  window.RealI18N = {
    t, formatNumber, formatPercent, toPersianDigits,
    getLang, applyLocale, pickLocalized, locField,
    SUPPORTED,
    STRINGS: stringsAccessor,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyLocale);
  } else {
    applyLocale();
  }
})();
