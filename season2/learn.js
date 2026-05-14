/* ==========================================================================
   REAL Shahnameh — Learn page renderer
   Hydrates the 50-level chronicle from /api/catalog/chapters and falls back
   to the bundled JSON. Content is content-gated: only chapters with
   status="available" or status="completed" render full detail. Everything
   else renders as a "Coming soon" placeholder — no rewards, no story,
   no quiz teasers — until the content is actually authored.
   ========================================================================== */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const host = $("[data-chapter-map]");
  if (!host) return;

  const t = (k, v) => (window.RealI18N && window.RealI18N.t(k, v)) || k;
  const locF = (obj, field) => (window.RealI18N && window.RealI18N.locField)
    ? window.RealI18N.locField(obj, field) : (obj && obj[field] != null ? obj[field] : "");

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (m) => (
    { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[m]
  ));

  const isReady = (c) => c && (c.status === "available" || c.status === "completed");

  const chapterHref = (c) => isReady(c) ? `chapter.html?slug=${encodeURIComponent(c.slug)}` : null;

  const render = (chapters, totalChapters) => {
    if (!Array.isArray(chapters) || chapters.length === 0) {
      host.innerHTML = `<div style="padding:14px; color:var(--muted, #6c7287); font-size:12px;">${t("learn_no_chapters")}</div>`;
      return;
    }

    const total = totalChapters || chapters.length;
    const doneCount = chapters.filter((c) => c.status === "completed").length;
    const pct = Math.round((doneCount / total) * 100);
    const doneEl = $("[data-chapters-done]");
    const pctEl  = $("[data-chapters-pct]");
    const fillEl = $("[data-chapters-fill]");
    if (doneEl) doneEl.textContent = t("learn_stories_done_tpl", { done: doneCount, total });
    if (pctEl)  pctEl.textContent  = `${pct}%`;
    if (fillEl) fillEl.style.width = `${Math.max(2, pct)}%`;

    host.innerHTML = chapters.map((c) => {
      const level = c.level || c.order || c.id;
      const localDone = (typeof localStorage !== "undefined") &&
                        localStorage.getItem(`real_chapter_done_${c.slug}`) === "1";
      const ready = isReady(c) || localDone;
      const done  = c.status === "completed" || localDone;
      const cls   = done ? "done" : ready ? "active" : "locked";
      const href  = ready ? `chapter.html?slug=${encodeURIComponent(c.slug)}` : null;

      if (!ready) {
        return `
          <article class="card chapter locked" data-chapter="${esc(level)}" data-slug="${esc(c.slug)}">
            <span class="node">${esc(level)}</span>
            <h4>${esc(t("learn_level_tpl", { level, title: locF(c, "title") }))}</h4>
            <div class="meta">
              <span class="chip">${t("coming_soon")}</span>
              <span class="reward" style="color:var(--muted);">${t("unlocks_when_ready")}</span>
            </div>
          </article>`;
      }

      const rewardLine = c.rewards ? `
        <span class="reward">
          ${c.rewards.xp ? `<i class="s2-icon xp"></i> ${esc(c.rewards.xp)} XP` : ""}
          ${c.rewards.real ? ` · <i class="real-coin"></i> ${esc(c.rewards.real)} REAL` : ""}
        </span>` : "";

      const inner = `
        <span class="node">${done ? "✓" : esc(level)}</span>
        <h4>${esc(t("learn_level_tpl", { level, title: locF(c, "title") }))}</h4>
        ${locF(c, "summary") ? `<p class="copy">${esc(locF(c, "summary"))}</p>` : ""}
        <div class="meta">
          <span class="chip ${done ? "lush" : "warm"}">${done ? t("chapter_completed") : t("open_level")}</span>
          ${rewardLine}
        </div>`;

      return href
        ? `<a class="card chapter ${cls}" data-chapter="${esc(level)}" data-slug="${esc(c.slug)}" href="${esc(href)}" style="text-decoration:none; color:inherit; display:block;">${inner}</a>`
        : `<article class="card chapter ${cls}" data-chapter="${esc(level)}" data-slug="${esc(c.slug)}">${inner}</article>`;
    }).join("");
  };

  const tryFetch = (url) => fetch(url, { cache: "no-store" }).then((r) => r.ok ? r.json() : null).catch(() => null);

  (async () => {
    let payload = await tryFetch("/api/catalog/chapters");
    if (!payload) payload = await tryFetch("/season2/data/chapters.json");
    if (!payload) payload = await tryFetch("data/chapters.json");
    if (!payload) {
      host.innerHTML = `<div style="padding:14px; color:var(--muted, #6c7287); font-size:12px;">${t("learn_no_content")}</div>`;
      return;
    }
    render(payload.chapters || [], payload.totalChapters || 50);
  })();
})();
