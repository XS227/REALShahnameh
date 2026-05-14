/* ==========================================================================
   REAL Shahnameh — Resource layer (Season 2 economy rework).

   Five layered resources, exposed as window.RealResources:
     Farr   — divine glory / prestige (✦)
     Zar    — gold of Pars / economy (🪙)
     Gems   — rare artifacts (💎)
     XP     — wisdom of the chronicle (⭐)
     REAL   — ecosystem layer / premium (◆)

   The REAL token is intentionally last in the order and visually
   demoted in the HUD — the strategic direction is that REAL exists
   quietly underneath, not as the headline of the experience.

   Public API:
     RealResources.KINDS                       → ["farr","zar","gems","xp","real"]
     RealResources.icon(kind)                  → emoji/glyph string
     RealResources.label(kind)                 → localized name (via RealI18N.t)
     RealResources.format(kind, amount)        → "+1,200 Zar" (locale-aware digits)
     RealResources.pill(kind, amount)          → small HTML pill, ready for innerHTML
     RealResources.balanceField(kind)          → Player state field name
     RealResources.read(kind)                  → current balance (via RealPlayer)
   ========================================================================== */
(function () {
  "use strict";

  const KINDS = ["farr", "zar", "gems", "xp", "real"];

  /* Iconography. Phase 3 may upgrade these to SVG glyphs; for now Unicode
     covers all platforms reliably with zero extra network cost. */
  const ICON = {
    farr: "✦",
    zar:  "🪙",
    gems: "💎",
    xp:   "⭐",
    real: "◆",
  };

  /* Locale label key — resolves through RealI18N. */
  const LABEL_KEY = {
    farr: "r_farr",
    zar:  "r_zar",
    gems: "r_gems",
    xp:   "r_xp",
    real: "r_real",
  };

  const escapeHtml = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, m =>
    ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[m]);

  const formatN = (n) => {
    if (window.RealI18N && window.RealI18N.formatNumber) {
      return window.RealI18N.formatNumber(n);
    }
    return Number(n).toLocaleString("en-US");
  };

  const t = (key) => {
    if (window.RealI18N && window.RealI18N.t) return window.RealI18N.t(key);
    return key;
  };

  const balanceField = (kind) => kind === "real" ? "balance" : kind;

  const read = (kind) => {
    if (!window.RealPlayer || !window.RealPlayer.get) return 0;
    return window.RealPlayer.get()[balanceField(kind)] || 0;
  };

  const icon  = (kind) => ICON[kind] || "·";
  const label = (kind) => t(LABEL_KEY[kind] || kind);

  /* "+1,234 Zar" / "+۱٬۲۳۴ زَر" / "+1,234 Зар" */
  const format = (kind, amount) => {
    const sign = amount > 0 ? "+" : (amount < 0 ? "−" : "");
    const abs = Math.abs(Number(amount) || 0);
    return `${sign}${formatN(abs)} ${label(kind)}`;
  };

  /* Inline pill markup — safe for innerHTML. */
  const pill = (kind, amount) => {
    const safeKind = escapeHtml(kind);
    const safeAmt  = escapeHtml(formatN(Math.abs(Number(amount) || 0)));
    const safeLbl  = escapeHtml(label(kind));
    return `<span class="r-pill r-${safeKind}">
        <span class="r-ico">${icon(kind)}</span>
        <span class="r-amt">${safeAmt}</span>
        <span class="r-lbl">${safeLbl}</span>
      </span>`;
  };

  /* Render the 4-cell + 1-discreet HUD into a host element. The host should
     have class .resource-hud applied; this fills it with cells.
     Usage:  RealResources.mountHud(document.querySelector("[data-resource-hud]")); */
  const mountHud = (host) => {
    if (!host) return;
    const cells = ["farr", "zar", "gems", "xp"].map((k) => `
      <div class="r-cell r-${k}" data-resource-cell="${k}">
        <div class="r-cell-ico">${icon(k)}</div>
        <div class="r-cell-body">
          <div class="r-cell-amt" data-resource-amt="${k}">${formatN(read(k))}</div>
          <div class="r-cell-lbl">${escapeHtml(label(k))}</div>
        </div>
      </div>
    `).join("");
    const realCell = `
      <div class="r-cell-real" data-resource-cell="real">
        <span class="r-real-ico">${icon("real")}</span>
        <span class="r-real-amt" data-resource-amt="real">${formatN(read("real"))}</span>
        <span class="r-real-lbl">${escapeHtml(label("real"))}</span>
      </div>
    `;
    host.innerHTML = `
      <div class="r-cells">${cells}</div>
      ${realCell}
    `;
  };

  /* Push current balances into a previously-mounted HUD (no rerender). */
  const refreshHud = (host) => {
    if (!host) return;
    KINDS.forEach((k) => {
      const el = host.querySelector(`[data-resource-amt="${k}"]`);
      if (el) el.textContent = formatN(read(k));
    });
  };

  window.RealResources = {
    KINDS, icon, label, format, pill,
    balanceField, read,
    mountHud, refreshHud,
  };
})();
