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

  /* Raw signed initData (NOT initDataUnsafe) — the server verifies this
     cryptographically before crediting, so a client can't name someone
     else's telegram_id and steal their reward. See season2.js
     /ads/verify-reward and lib/telegramAuth.js. */
  const tgInitData = () => {
    try {
      return (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) || '';
    } catch (_) { return ''; }
  };

  /* Diagnostic-only beacon (2026-07-19): showAd() can fail at several
     points (SDK not loaded, no fill, ad skipped, cooldown) with nothing
     reaching the server — from admin's side that looks identical to "no
     signal at all", indistinguishable from the user never trying. Fired
     best-effort, never blocks/throws into the caller. */
  const logEvent = (event, detail) => {
    try {
      fetch('/api/season2/ads/client-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: tgUserId() || '', event, detail: detail || '' }),
        keepalive: true,
      }).catch(() => {});
    } catch (_) {}
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
      logEvent('ad_reject', 'daily_limit');
      reject({ type: 'daily_limit' });
      return;
    }
    if (ws.cooldownSecs > 0) {
      logEvent('ad_reject', 'cooldown:' + ws.cooldownSecs + 's');
      reject({ type: 'cooldown', wait_seconds: ws.cooldownSecs });
      return;
    }

    const blockId = getBlockId();
    if (!blockId) {
      logEvent('ad_reject', 'not_configured');
      reject({ type: 'not_configured' });
      return;
    }
    if (!window.Adsgram) {
      logEvent('ad_reject', 'sdk_missing');
      reject({ type: 'sdk_missing' });
      return;
    }

    let controller;
    try {
      logEvent('ad_attempt', 'blockId:' + blockId);
      controller = window.Adsgram.init({ blockId });
    } catch (e) {
      logEvent('ad_reject', 'init_error:' + String(e).slice(0, 120));
      reject({ type: 'error', error: String(e) });
      return;
    }

    controller.show().then(async (result) => {
      if (!result || !result.done) {
        logEvent('ad_reject', 'skipped');
        reject({ type: 'skipped' });
        return;
      }

      /* Update local state immediately so cooldown ticks without waiting for server */
      const s = readState();
      s.used++;
      s.lastTs = Date.now();
      saveState(s);

      /* Call backend to log claim and get authoritative gem-on-fifth.
         Exactly one of init_data/sso_token, matching /ads/verify-reward's
         contract — initData for a real Telegram Mini App context, else the
         sso_token sync.js cached from its own server-verified login (2026-
         07-21: this used to fall through to a purely local, unverified
         reward for every non-Telegram — i.e. every RealGram — user, never
         reaching the server at all; see B->A(63) in TASK_SPLIT.md). */
      let gems = 0;
      const initData = tgInitData();
      let ssoToken = !initData && window.RealSync && window.RealSync.currentSsoToken
        ? window.RealSync.currentSsoToken() : '';

      if (initData || ssoToken) {
        const body = initData
          ? { init_data: initData, tier: 'watch' }
          : { sso_token: ssoToken, tier: 'watch' };
        try {
          let resp = await fetch('/api/season2/ads/verify-reward', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            keepalive: true,
          });

          /* sso_token is short-lived (15 min, ad cooldown is 30) — a 401
             here most likely means it outlived its TTL, not a real auth
             failure, so re-mint once via the same device_id fallback
             sync.js's own init() uses and retry before giving up. */
          if (resp.status === 401 && ssoToken && window.RealSync.refreshSsoToken) {
            logEvent('ad_credit_sso_expired', 'retrying_with_fresh_token');
            const fresh = await window.RealSync.refreshSsoToken();
            if (fresh) {
              resp = await fetch('/api/season2/ads/verify-reward', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sso_token: fresh, tier: 'watch' }),
                keepalive: true,
              });
            }
          }

          if (resp.ok) {
            const data = await resp.json();
            if (data.status === 1) {
              if (data.rewards && data.rewards.gems) gems = data.rewards.gems;
            } else {
              /* Server explicitly denied the credit (cooldown/limit out of
                 sync with local state, etc.) — the UI below still shows the
                 reward, so this is the case that most looks like "the ad
                 worked but nothing shows up server-side". */
              logEvent('ad_credit_denied', String(data.error || 'unknown'));
            }
          } else {
            logEvent('ad_credit_http_error', 'status:' + resp.status);
          }
        } catch (e) {
          /* Network/fetch failure — reward still granted client-side below,
             so the user sees the coin animation but the server never
             recorded it. This is the exact "no AdsGram signal in admin"
             symptom when it happens silently. */
          logEvent('ad_credit_fetch_failed', String(e).slice(0, 120));
        }
      } else {
        logEvent('ad_credit_skipped', 'no_init_data_or_sso_token');
        /* No verifiable identity available at all (very old app build that
           never passed sso/device_id, or a bare browser tab with neither) —
           last-resort local-only reward, same as before this fix. */
        if (s.used === AD_DAILY_LIMIT) gems = AD_GEM_FIFTH;
      }

      const rewards = { real: AD_REAL, gems };

      if (window.RealPlayer) {
        window.RealPlayer.addResource('real', AD_REAL);
        if (gems) window.RealPlayer.addResource('gems', gems);
        if (window.RealSync) window.RealSync.syncBalance();
      }

      logEvent('ad_success', 'gems:' + gems);
      resolve({ rewards });
    }).catch((err) => {
      logEvent('ad_reject', 'show_promise_rejected:' + String(err).slice(0, 120));
      reject({ type: 'ad_error', error: err });
    });
  });

  /* Pre-fetch block ID on load so the Watch button shows immediately */
  ensureBlockId().then(() => {
    try { window.dispatchEvent(new CustomEvent('real:adservice:ready')); } catch (_) {}
  });

  window.RealAdService = { showAd, getWatchState };
})();
