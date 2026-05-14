/* Home (index.html) hydration — pulls heroes + chapters from the
   server catalog and paints the horizontal strips. Read-only; the
   admin still owns mutations. Failures keep static markup empty so
   the page never blanks out. */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);

  const heroHost    = $("[data-home-heroes]");
  const chapterHost = $("[data-home-chapters]");

  const t = (k, v) => (window.RealI18N && window.RealI18N.t(k, v)) || k;
  const locF = (obj, field) => (window.RealI18N && window.RealI18N.locField)
    ? window.RealI18N.locField(obj, field) : (obj && obj[field] != null ? obj[field] : "");

  const escapeHtml = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, m => (
    { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[m]
  ));
  const escapeAttr = (s) => escapeHtml(s);

  /* Map rarity value (which may be "Legendary" or "legend") to a t() key */
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

  /* Build the inner HTML for a hero portrait.
     Priority: explicit image_url → auto .png → auto .jpg → emoji */
  const heroPortraitHtml = (h) => {
    if (h.image_url) {
      return `<img src="${escapeAttr(h.image_url)}" alt="${escapeAttr(h.name)}" loading="lazy">`;
    }
    const slug = encodeURIComponent(h.slug || "");
    const png  = `/season2/uploads/heroes/${slug}.png`;
    const jpg  = `/season2/uploads/heroes/${slug}.jpg`;
    const emo  = escapeHtml(heroEmoji(h.slug));
    return `<img src="${png}" alt="${escapeAttr(h.name)}" loading="lazy" `
         + `onerror="if(!this.dataset.tried){this.dataset.tried='1';this.src='${escapeAttr(jpg)}';}else{this.outerHTML='${emo}';}">`;
  };

  /* Build the inner HTML for a chapter banner.
     Priority: explicit image_url → auto .png → auto .jpg → 📜 emoji */
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
    akvan: "🌪", esfandiyar: "🏹", persepolis: "🏛"
  })[slug] || "⚔";

  const renderHeroes = (heroes) => {
    if (!heroHost) return;
    if (!Array.isArray(heroes) || heroes.length === 0) {
      heroHost.innerHTML = `<div style="padding:14px; color:var(--muted, #6c7287); font-size:12px;">${t("home_no_heroes")}</div>`;
      return;
    }
    // Top 8 by power (or active first).
    const list = heroes
      .filter(h => h.status !== "locked")
      .slice()
      .sort((a, b) => (b.power || 0) - (a.power || 0))
      .slice(0, 8);
    heroHost.innerHTML = list.map(h => `
      <a class="hero-mini ${rarityClass(h.rarity)}" href="heroes.html#${escapeAttr(h.slug)}">
        <div class="portrait">${heroPortraitHtml(h)}</div>
        <div class="info">
          <div class="name">${escapeHtml(h.name)}</div>
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
            ${c.rewards && c.rewards.real ? `<span class="pill-mini" style="background:rgba(74,216,166,.12); color:var(--jade,#4ad8a6); border-color:rgba(74,216,166,.3);">+${c.rewards.real} REAL</span>` : ""}
          </div>
        </div>
      </a>`;
    }).join("");
  };

  /* Day X of journey — match learn.html behaviour. */
  const renderJourneyProgress = (totalDays) => {
    const STARTED_KEY = "real_journey_started_at";
    let started = parseInt(localStorage.getItem(STARTED_KEY) || "0", 10);
    if (!started) {
      started = Date.now();
      try { localStorage.setItem(STARTED_KEY, String(started)); } catch {}
    }
    const dayNum = Math.max(1, Math.floor((Date.now() - started) / 86400e3) + 1);
    const dayEl  = document.querySelector("[data-journey-day-num]");
    const fillEl = document.querySelector("[data-journey-fill]");
    if (dayEl)  dayEl.textContent = dayNum;
    if (fillEl) fillEl.style.width = Math.max(0.4, Math.min(100, (dayNum / (totalDays || 270)) * 100)) + "%";
  };

  /* Treasury HUD — five resources (Farr / Zar / Gems / XP) with REAL as a
     quiet ecosystem row beneath. Filled from Player state via resources.js. */
  const mountTreasury = () => {
    const host = document.querySelector("[data-resource-hud]");
    if (!host || !window.RealResources) return;
    window.RealResources.mountHud(host);
    // mountHud injects fresh DOM nodes whose .r-cell-lbl carry the localized
    // resource names. Re-apply locale so any data-i18n inside the cells
    // (currently none, but future cells may add some) get picked up.
    if (window.RealI18N && window.RealI18N.applyLocale) {
      window.RealI18N.applyLocale();
    }
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountTreasury);
  } else {
    mountTreasury();
  }

  /* Fire both fetches in parallel. Both are best-effort; failures
     don't blank the page, they just leave the strip empty. */
  fetch("/api/catalog/heroes",   { cache: "no-store" })
    .then(r => r.ok ? r.json() : null)
    .then(b => renderHeroes(b && b.heroes))
    .catch(() => renderHeroes([]));

  fetch("/api/catalog/chapters", { cache: "no-store" })
    .then(r => r.ok ? r.json() : null)
    .then(b => {
      renderChapters(b && b.chapters, b && b.seasonLengthDays);
      renderJourneyProgress(b && b.seasonLengthDays);
    })
    .catch(() => { renderChapters([]); renderJourneyProgress(270); });
})();
