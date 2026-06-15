/* ==========================================================================
   REAL Shahnameh — Season 2 AdService (adsgram.js)
   Single rewarded-ad type: 100 REAL/watch · 30 min cooldown · 5/day cap.
   5th watch of the day also gives 1 Gem.
   Block ID pushed from server via sync → localStorage('real_ad_block_id').
   ========================================================================== */
(function () {
  'use strict';

  const AD_REAL         = 100;
  const AD_COOLDOWN_SEC = 1800;  /* 30 minutes */
  const AD_DAILY_LIMIT  = 5;
  const AD_GEM_FIFTH    = 1;     /* bonus gem on the 5th watch */
  const LS_KEY          = 'real_ads_watch';

  const todayStr = () => new Date().toISOString().slice(0, 10);

  /* State persisted in localStorage: { date, used, lastTs } */
  const readState = () => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.date === todayStr()) return s;
      }
    } catch (_) {}
    return { date: todayStr(), used: 0, lastTs: 0 };
  };

  const saveState = (s) => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (_) {}
  };

  const getBlockId = () => localStorage.getItem('real_ad_block_id') || '';

  /* Fetch block ID from server if localStorage is empty (e.g. first load
     before sync.js has run, or non-Telegram browser test). */
  const ensureBlockId = async () => {
    if (getBlockId()) return;
    try {
      const r = await fetch('/api/season2/ads/config', { cache: 'no-store' });
      if (!r.ok) return;
      const d = await r.json();
      const id = d && d.adsgram && d.adsgram.watch && d.adsgram.watch.blockId;
      if (id) localStorage.setItem('real_ad_block_id', id);
    } catch (_) {}
  };

  const tgUserId = () => {
    try {
      const u = window.Telegram
        && window.Telegram.WebApp
        && window.Telegram.WebApp.initDataUnsafe
        && window.Telegram.WebApp.initDataUnsafe.user;
      return u ? String(u.id) : null;
    } catch (_) { return null; }
  };

  /* Public: current watch state for UI rendering */
  const getWatchState = () => {
    const s           = readState();
    const now         = Date.now();
    const msSinceLast = s.lastTs ? (now - s.lastTs) : AD_COOLDOWN_SEC * 1000;
    const cooldownMs  = Math.max(0, AD_COOLDOWN_SEC * 1000 - msSinceLast);
    const remaining   = Math.max(0, AD_DAILY_LIMIT - s.used);
    return {
      used:        s.used,
      remaining,
      cooldownSecs: Math.ceil(cooldownMs / 1000),
      nextIsGem:   remaining === 1,  /* next watch will be the 5th */
      configured:  !!getBlockId(),
    };
  };

  /* Public: show an ad, resolve with { rewards } on success */
  const showAd = () => new Promise(async (resolve, reject) => {
    await ensureBlockId();
    const ws = getWatchState();

    if (ws.remaining <= 0) {
      reject({ type: 'daily_limit' });
      return;
    }
    if (ws.cooldownSecs > 0) {
      reject({ type: 'cooldown', wait_seconds: ws.cooldownSecs });
      return;
    }

    const blockId = getBlockId();
    if (!blockId) {
      reject({ type: 'not_configured' });
      return;
    }
    if (!window.Adsgram) {
      reject({ type: 'sdk_missing' });
      return;
    }

    let controller;
    try {
      controller = window.Adsgram.init({ blockId });
    } catch (e) {
      reject({ type: 'error', error: String(e) });
      return;
    }

    controller.show().then(async (result) => {
      if (!result || !result.done) {
        reject({ type: 'skipped' });
        return;
      }

      /* Update local state immediately so cooldown ticks without waiting for server */
      const s = readState();
      s.used++;
      s.lastTs = Date.now();
      saveState(s);

      /* Call backend to log claim and get authoritative gem-on-fifth */
      let gems = 0;
      const uid = tgUserId();
      if (uid) {
        try {
          const resp = await fetch('/api/season2/ads/verify-reward', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegram_id: uid, tier: 'watch' }),
            keepalive: true,
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data.status === 1 && data.rewards && data.rewards.gems) {
              gems = data.rewards.gems;
            }
          }
        } catch (_) {}
      } else {
        /* Offline: compute gem from local count */
        if (s.used === AD_DAILY_LIMIT) gems = AD_GEM_FIFTH;
      }

      const rewards = { real: AD_REAL, gems };

      if (window.RealPlayer) {
        window.RealPlayer.addResource('real', AD_REAL);
        if (gems) window.RealPlayer.addResource('gems', gems);
        if (window.RealSync) window.RealSync.syncBalance();
      }

      resolve({ rewards });
    }).catch((err) => {
      reject({ type: 'ad_error', error: err });
    });
  });

  /* Pre-fetch block ID on load so the Watch button shows immediately */
  ensureBlockId().then(() => {
    try { window.dispatchEvent(new CustomEvent('real:adservice:ready')); } catch (_) {}
  });

  window.RealAdService = { showAd, getWatchState };
})();
