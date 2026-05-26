/* ==========================================================================
   REAL Shahnameh — Season 2 AdService (adsgram.js)
   Wraps the Adsgram SDK. Exposes window.RealAdService.showAd(tier).
   Requires Adsgram SDK: https://sad.adsgram.ai/js/sad.min.js
   ========================================================================== */
(function () {
  'use strict';

  /* Default tier config — overwritten at runtime from localStorage (sync.js
     caches the server's adsgram block IDs from /user/sync response).       */
  const DEFAULT_CONFIG = {
    bronze: { blockId: '', real: 500,  gems: 0, farr: 0, cooldown: 300  },
    silver: { blockId: '', real: 2000, gems: 0, farr: 0, cooldown: 600  },
    gold:   { blockId: '', real: 5000, gems: 1, farr: 0, cooldown: 1800 },
  };

  const getConfig = () => {
    try {
      const raw = localStorage.getItem('real_adsgram_config');
      if (raw) {
        const saved = JSON.parse(raw);
        return {
          bronze: Object.assign({}, DEFAULT_CONFIG.bronze, saved.bronze),
          silver: Object.assign({}, DEFAULT_CONFIG.silver, saved.silver),
          gold:   Object.assign({}, DEFAULT_CONFIG.gold,   saved.gold),
        };
      }
    } catch (_) {}
    return DEFAULT_CONFIG;
  };

  const tgUser = () => {
    try {
      return (window.Telegram && window.Telegram.WebApp
        && window.Telegram.WebApp.initDataUnsafe
        && window.Telegram.WebApp.initDataUnsafe.user) || null;
    } catch (_) { return null; }
  };

  const post = (url, body) => {
    try {
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true,
      }).then(r => r.ok ? r.json() : null).catch(() => null);
    } catch (_) { return Promise.resolve(null); }
  };

  /* Cooldown state — tracks last ad start time per tier in this session.
     Server is authoritative; this is just a local UI guard.               */
  const cooldownEnds = {};

  const getCooldownRemaining = (tier) => {
    const ends = cooldownEnds[tier] || 0;
    return Math.max(0, Math.ceil((ends - Date.now()) / 1000));
  };

  /* ── Core: show an Adsgram ad for a given tier ───────────────────────── */
  const showAd = (tier) => {
    return new Promise((resolve, reject) => {
      const cfg     = getConfig();
      const tierCfg = cfg[tier];

      if (!tierCfg) {
        reject({ type: 'error', error: 'unknown_tier' });
        return;
      }

      /* Local cooldown guard */
      const remaining = getCooldownRemaining(tier);
      if (remaining > 0) {
        reject({ type: 'cooldown', wait_seconds: remaining });
        return;
      }

      /* No blockId configured yet */
      if (!tierCfg.blockId) {
        reject({ type: 'not_configured' });
        return;
      }

      /* Adsgram SDK must be loaded */
      if (!window.Adsgram) {
        reject({ type: 'sdk_missing' });
        return;
      }

      let controller;
      try {
        controller = window.Adsgram.init({ blockId: String(tierCfg.blockId) });
      } catch (e) {
        reject({ type: 'error', error: String(e) });
        return;
      }

      controller.show().then(async (result) => {
        if (!result || !result.done) {
          reject({ type: 'skipped' });
          return;
        }

        /* Set local cooldown immediately so UI updates without waiting */
        cooldownEnds[tier] = Date.now() + tierCfg.cooldown * 1000;

        /* Server-side verification */
        const u = tgUser();
        if (!u || !u.id) {
          /* Offline — credit locally */
          if (window.RealPlayer) {
            window.RealPlayer.addResource('real', tierCfg.real);
            if (tierCfg.gems) window.RealPlayer.addResource('gems', tierCfg.gems);
            if (tierCfg.farr) window.RealPlayer.addResource('farr', tierCfg.farr);
          }
          resolve({ tier, rewards: { real: tierCfg.real, gems: tierCfg.gems, farr: tierCfg.farr || 0 }, offline: true });
          return;
        }

        const data = await post('/api/season2/ads/verify-reward', {
          telegram_id: String(u.id),
          tier,
        });

        if (!data || data.status !== 1) {
          if (data && data.error === 'cooldown') {
            cooldownEnds[tier] = Date.now() + (data.wait_seconds || tierCfg.cooldown) * 1000;
          }
          reject({ type: data ? data.error : 'server_error', raw: data });
          return;
        }

        /* Credit player resources */
        if (window.RealPlayer) {
          window.RealPlayer.addResource('real', data.rewards.real || 0);
          if (data.rewards.gems) window.RealPlayer.addResource('gems', data.rewards.gems);
          if (data.rewards.farr) window.RealPlayer.addResource('farr', data.rewards.farr);
          if (window.RealSync) window.RealSync.syncBalance();
        }

        resolve({ tier, rewards: data.rewards, new_balance: data.new_balance });
      }).catch((err) => {
        reject({ type: 'ad_error', error: err });
      });
    });
  };

  /* ── Cooldown query ──────────────────────────────────────────────────── */
  const getCooldowns = () => {
    const cfg = getConfig();
    return Object.fromEntries(
      Object.keys(cfg).map(tier => [tier, getCooldownRemaining(tier)])
    );
  };

  /* ── Config query ────────────────────────────────────────────────────── */
  const getTierConfig = () => getConfig();

  window.RealAdService = { showAd, getCooldowns, getTierConfig };
})();
