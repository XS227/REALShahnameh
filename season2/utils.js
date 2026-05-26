/* ==========================================================================
   REAL Shahnameh — Season 2 Shared Utilities (utils.js)
   Exposes window.RealUtils.
   ========================================================================== */
(function () {
  'use strict';

  /* ── updateGlobalZar(miningStats?) ────────────────────────────────────────
     Single authoritative ZAR update call.  Pass the mining_stats object from
     /api/season2/user/me when you have it; omit to just re-render with the
     current Player value.

     Logic:
       • Takes the higher of server total_zar and the locally-accumulated value
         (client heroes accumulate ZAR between sync-balance calls; we never
         want to lose that client-side progress by overwriting with a lower
         server snapshot).
       • Writes back into Player state so every HUD on the page is consistent.
       • Re-renders the Treasury HUD if one is mounted on this page.

     Returns the final (reconciled) ZAR value.                               */
  const updateGlobalZar = (miningStats) => {
    const localZar  = (window.RealPlayer && window.RealPlayer.get)
      ? (window.RealPlayer.get().zar || 0) : 0;
    const serverZar = (miningStats && miningStats.total_zar != null)
      ? Number(miningStats.total_zar) : 0;
    const finalZar  = Math.max(localZar, serverZar);

    if (window.RealPlayer && window.RealPlayer.set) {
      window.RealPlayer.set({ zar: finalZar });
    }

    /* Refresh any Treasury HUD visible on this page */
    const hud = document.querySelector('[data-resource-hud]');
    if (hud && window.RealResources) {
      window.RealResources.refreshHud(hud);
    }

    return finalZar;
  };

  /* ── getAvatarFallback(path) ──────────────────────────────────────────────
     Returns a path-based default avatar image URL when a player has no
     Telegram profile photo. Hero → male Shahnameh warrior; Heroine → female. */
  const getAvatarFallback = (path) => {
    if (path === 'heroine') return '/assets/images/avatars/default-female-avatar.png';
    return '/assets/images/avatars/default-male-avatar.png';
  };

  /* ── formatCryptoValue(val) ──────────────────────────────────────────────
     Compact number formatter for all token amounts in the UI.
       < 1,000        → integer only, no decimals  (757  not 757.3)
       1,000–999,999  → 1k / 1.5k                 (1500 → 1.5k)
       ≥ 1,000,000    → 1M / 2.4M                                          */
  const formatCryptoValue = (val) => {
    const n = Number(val) || 0;
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(Math.floor(n));
  };

  window.RealUtils = { updateGlobalZar, getAvatarFallback, formatCryptoValue };
})();
