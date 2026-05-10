/* Home (index.html) hydration — pulls heroes + chapters from the
   server catalog and paints the horizontal strips. Read-only; the
   admin still owns mutations. Failures keep static markup empty so
   the page never blanks out. */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);

  const heroHost    = $("[data-home-heroes]");
  const chapterHost = $("[data-home-chapters]");

  const escapeHtml = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, m => (
    { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[m]
  ));
  const escapeAttr = (s) => escapeHtml(s);

  const rarityClass = (r) => {
    const x = String(r || "").toLowerCase();
    if (x === "mythic")    return "r-mythic";
    if (x === "legendary") return "r-legend";
    if (x === "epic")      return "r-epic";
    if (x === "rare")      return "r-rare";
    return "";
  };

  const heroEmoji = (slug) => ({
    rostam: "⚔", simorgh: "🪶", zal: "🌒", tahmineh: "♛",
    zahhak: "🐍", fereydun: "🛡", kaveh: "⚒", rakhsh: "🐎",
    akvan: "🌪", esfandiyar: "🏹", persepolis: "🏛"
  })[slug] || "⚔";

  const renderHeroes = (heroes) => {
    if (!heroHost) return;
    if (!Array.isArray(heroes) || heroes.length === 0) {
      heroHost.innerHTML = `<div style="padding:14px; color:var(--muted, #6c7287); font-size:12px;">No heroes loaded yet.</div>`;
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
        <div class="portrait">${h.image_url ? `<img src="${escapeAttr(h.image_url)}" alt="${escapeAttr(h.name)}" loading="lazy">` : escapeHtml(heroEmoji(h.slug))}</div>
        <div class="info">
          <div class="name">${escapeHtml(h.name)}</div>
          <div class="rarity">${escapeHtml(h.rarity || "")}</div>
        </div>
      </a>`).join("");
  };

  const renderChapters = (chapters, totalDays) => {
    if (!chapterHost) return;
    if (!Array.isArray(chapters) || chapters.length === 0) {
      chapterHost.innerHTML = `<div style="padding:14px; color:var(--muted, #6c7287); font-size:12px;">No chapters loaded yet.</div>`;
      return;
    }
    chapterHost.innerHTML = chapters.slice(0, 8).map(c => {
      const cls = c.status === "completed" ? "done"
                : c.status === "available" || c.status === "published" ? ""
                : "locked";
      const pillLabel = cls === "done" ? "Completed"
                      : cls === "locked" ? `Day ${c.unlock_day || "?"}`
                      : "Available";
      return `
      <a class="chapter-mini ${cls}" href="learn.html#${escapeAttr(c.slug || c.id)}">
        <div class="banner">${c.image_url ? `<img src="${escapeAttr(c.image_url)}" alt="${escapeAttr(c.title)}" loading="lazy">` : "📜"}</div>
        <div class="info">
          <div class="title">${escapeHtml(c.title)}</div>
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
