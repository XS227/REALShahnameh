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
    bronze: { blockId: 'bot-32855', real: 0,    gems: 0, farr: 0, energy: true,  cooldown: 300  },
    silver: { blockId: 'bot-32855', real: 0,    gems: 1, farr: 0, energy: false, cooldown: 600  },
    gold:   { blockId: 'bot-32855', real: 5000, gems: 0, farr: 0, energy: false, cooldown: 1800 },
  };

  const getConfig = () => {
    try {
      const raw = localStorage.getItem('real_adsgram_config');
      if (raw) {
        const saved = JSON.parse(raw);
        const merge = (tier) => {
          const merged = Object.assign({}, DEFAULT_CONFIG[tier], saved[tier]);
          /* Always fall back to hardcoded blockId if server config has none */
          if (!merged.blockId) merged.blockId = DEFAULT_CONFIG[tier].blockId;
          return merged;
        };
        return { bronze: merge('bronze'), silver: merge('silver'), gold: merge('gold') };
      }
    } catch (_) {}
    return DEFAULT_CONFIG;
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

      controller.show().then((result) => {
        if (!result || !result.done) {
          reject({ type: 'skipped' });
          return;
        }

        cooldownEnds[tier] = Date.now() + tierCfg.cooldown * 1000;

        /* Credit locally from tierCfg — server-side double-verification will
           be wired via /api/ads/callback in the Adsgram dashboard later.    */
        const rewards = {
          real:   tierCfg.real   || 0,
          gems:   tierCfg.gems   || 0,
          farr:   tierCfg.farr   || 0,
          energy: !!tierCfg.energy,
        };

        if (window.RealPlayer) {
          if (rewards.real)   window.RealPlayer.addResource('real', rewards.real);
          if (rewards.gems)   window.RealPlayer.addResource('gems', rewards.gems);
          if (rewards.farr)   window.RealPlayer.addResource('farr', rewards.farr);
          if (rewards.energy) {
            const p   = window.RealPlayer.get();
            const max = p.energyMax || 1000;
            const cur = p.energy    || 0;
            const add = max - cur;
            if (add > 0) window.RealPlayer.addResource('energy', add);
            rewards.energyFilled = max;
          }
          if (window.RealSync) window.RealSync.syncBalance();
        }

        resolve({ tier, rewards });
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
