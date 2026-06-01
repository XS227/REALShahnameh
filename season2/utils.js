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
  const formatCryptoValue = (val) =>
    (window.RealI18N && window.RealI18N.compactNumber)
      ? window.RealI18N.compactNumber(val)
      : String(Number(val) || 0);

  /* ── Canonical chapter slug list (matches catalog API order, 25 available chapters) ──
     All other JS files that need to check chapter completion should use this list.
     Source of truth: /api/catalog/chapters — slugs are the keys for real_chapter_done_* flags. */
  const CHAPTER_SLUGS = [
    "keyumars","hushang","tahmuras","jamshid","zahhak",
    "fereydun","manuchehr","nozar","zal","rudabeh",
    "birth-of-rostam","rostam","sohrab","siavash","kay-kavus",
    "kay-khosrow","akvan","bijan-manijeh","great-war-turan","lohrasp",
    "goshtasp","esfandiyar","seven-labours-esp","clash-rostam-esp","simorgh",
  ];

  const isChapterDone = (slug) => {
    try { return localStorage.getItem("real_chapter_done_" + slug) === "1"; } catch { return false; }
  };

  const getChapterDoneCount = () => CHAPTER_SLUGS.filter(isChapterDone).length;

  const getActiveChapterSlug = () =>
    CHAPTER_SLUGS.find(s => !isChapterDone(s)) || CHAPTER_SLUGS[CHAPTER_SLUGS.length - 1];

  /* Derive player level from XP — consistent formula used everywhere */
  const xpToLevel = (xp) => Math.max(1, Math.floor((xp || 0) / 1000));

  window.RealUtils = {
    updateGlobalZar, getAvatarFallback, formatCryptoValue,
    CHAPTER_SLUGS, isChapterDone, getChapterDoneCount, getActiveChapterSlug, xpToLevel,
  };
})();
