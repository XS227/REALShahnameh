/* ==========================================================================
   REAL Shahnameh — Season 2 Sync (sync.js)
   Durable writes: Player state ↔ MongoDB via /api/season2/ endpoints.
   Loaded early (before tap.js / home.js). Exposes window.RealSync.
   ========================================================================== */
(function () {
  'use strict';

  /* ── Debug bridge ──────────────────────────────────────────────────
     2026-07-19, Khabat's black-spinner report: sync.js/home.js had zero
     logging, making on-device root-causing impossible. This tracks the
     last init step reached + any runtime error, logs to console, and
     (when running inside the RealGram WebView) posts to RN via
     ReactNativeWebView.postMessage so a future RN-side error screen can
     read it. Never logs the raw sso token, only its presence/length. */
  const REALDBG = (() => {
    const state = { lastStep: 'sync.js:evaluating', errors: [] };
    const emit = (payload) => {
      try {
        console.log('[S2DBG]', payload.step || ('error: ' + payload.error), payload);
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({ source: 'season2debug' }, payload)));
        }
        /* Server-side beacon (2026-07-19): no device/adb access from the
           backend side, so mirror every step/error to the existing
           ads client-event log via the already-live /ads/client-event
           endpoint (no backend redeploy needed) — readable straight off
           disk while a real device is being tested. */
        const name = payload.step || ('error:' + payload.error);
        fetch('/api/season2/ads/client-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify({
            telegram_id: 's2dbg',
            event: String(name).slice(0, 40),
            detail: JSON.stringify(payload).slice(0, 200),
          }),
        }).catch(() => {});
      } catch (_) {}
    };
    return {
      step(name, extra) { state.lastStep = name; emit(Object.assign({ step: name }, extra)); },
      error(err, extra) {
        const msg = (err && err.message) || String(err);
        state.errors.push(msg);
        emit(Object.assign({ error: msg }, extra));
      },
      get state() { return state; },
    };
  })();
  window.__realDebug = REALDBG;
  window.addEventListener('error', (e) => REALDBG.error(e.error || e.message, { via: 'window.onerror' }));
  window.addEventListener('unhandledrejection', (e) => REALDBG.error(e.reason, { via: 'unhandledrejection' }));
  REALDBG.step('sync.js:parsed');

  const API = {
    userSync:     '/api/season2/user/sync',
    updateQuests: '/api/season2/user/update-quests',
    syncBalance:  '/api/season2/user/sync-balance',
    userHeroes:   '/api/season2/user/heroes',
    reconcileChapterRewards: '/api/season2/user/reconcile-chapter-rewards',
  };

  const tgUser = () => {
    try {
      return window.Telegram
        && window.Telegram.WebApp
        && window.Telegram.WebApp.initDataUnsafe
        && window.Telegram.WebApp.initDataUnsafe.user || null;
    } catch (_) { return null; }
  };

  const POST_TIMEOUT_MS = 10000;

  /* Never hangs: fetch() has no default timeout, and a stalled connection
     (not a fail — a hang) would otherwise leave the caller's Promise
     pending forever with nothing to catch. Always resolves (null on any
     failure/timeout), never rejects. */
  const post = (url, body) => {
    try {
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const tid  = ctrl ? setTimeout(() => ctrl.abort(), POST_TIMEOUT_MS) : null;
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true,
        signal: ctrl ? ctrl.signal : undefined,
      })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null)
        .finally(() => { if (tid) clearTimeout(tid); });
    } catch (_) { return Promise.resolve(null); }
  };

  /* Ready promise — resolves with serverUser (or null on failure) */
  let _resolveReady;
  const _ready = new Promise(r => { _resolveReady = r; });

  /* Set once init() completes a successful SSO login (server-verified
     telegram_id, not the raw token) — every other sync call in this file
     falls back to this when there's no Telegram WebApp context, so an
     SSO session stays authenticated for balance/quest/chapter/hero syncs
     too, not just the initial login ping. */
  let _ssoTelegramId = '';
  const currentTelegramId = () => {
    const u = tgUser();
    if (u && u.id) return String(u.id);
    return _ssoTelegramId || '';
  };

  /* ── Offline bonus banner ──────────────────────────────────────────── */
  const _showOfflineBonus = (zarEarned) => {
    if (document.getElementById('real-offline-bonus')) return;
    const fmt = (n) => (window.RealI18N && window.RealI18N.compactNumber) ? window.RealI18N.compactNumber(n) : String(Math.round(n));
    const el = document.createElement('div');
    el.id = 'real-offline-bonus';
    el.innerHTML =
      '<div class="rob-inner">' +
        '<span class="rob-ico">⛏</span>' +
        '<div class="rob-text">' +
          '<strong>Offline Mining</strong>' +
          '<span>+' + fmt(zarEarned) + ' ZAR earned while away</span>' +
        '</div>' +
        '<button class="rob-close" aria-label="Dismiss">✕</button>' +
      '</div>';
    el.querySelector('.rob-close').addEventListener('click', () => el.remove());
    document.body.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, 8000);
  };

  /* Ecosystem SSO entry (task B-8/B-12): when opened from outside Telegram
     — e.g. the SetaLink/RealGram panel deep-links here with
     ?sso=<jwt>&src=realink — there is no window.Telegram.WebApp context to
     read a user from. Pull the token out of the URL and let the backend
     verify it; we never trust anything else in the URL as identity. */
  const ssoTokenFromUrl = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('sso') || '';
    } catch (_) { return ''; }
  };

  /* device_id from the URL (always present when opened from the RealGram
     app — ShahnamehEmbed.tsx always sets it, whether or not it managed to
     get an sso token too). Root cause of Khabat's 2026-07-21
     "profile_could_not_identify" report: when the app's own sso-token fetch
     fails/times out, ShahnamehEmbed still opens the page — with real_id and
     device_id in the URL, but NO sso param — because it deliberately never
     blocks the page on that fetch. sync.js had no fallback for that case at
     all: no Telegram user, no sso -> straight to no-identity-abort below,
     forever, even though a perfectly good device_id was sitting right in
     the URL the whole time. */
  const deviceIdFromUrl = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('device_id') || '';
    } catch (_) { return ''; }
  };

  /* Mint our own sso token straight from the panel, keyed on device_id —
     the same trusted lookup key and the same endpoint the RN app itself
     uses (services/ssoService.ts). The panel's api.php sends
     Access-Control-Allow-Origin: * (checked 2026-07-21), so this fetch
     works fine from season2's own origin. This is a second, independent
     attempt at the same mint the app already tried — not a lower-trust
     path — the backend still verifies the resulting JWT exactly like any
     other sso_token in /user/sync above. */
  const mintSsoFromDeviceId = async (deviceId) => {
    try {
      const qs = new URLSearchParams({
        mobile: '1', action: 'sso-token', _token: 'setalink-mobile-diag-v1',
        device_id: deviceId, game: '1',
      });
      const resp = await fetch('https://setalink.no/api.php?' + qs.toString(), { cache: 'no-store' });
      if (!resp.ok) return '';
      const data = await resp.json();
      return (data && data.status === 'ok' && data.token) ? data.token : '';
    } catch (err) {
      REALDBG.error(err, { via: 'mintSsoFromDeviceId' });
      return '';
    }
  };

  /* ── init: call once on every page load ──────────────────────────── */
  const init = async () => {
    REALDBG.step('sync.js:init:start');
    const u = tgUser();
    let ssoToken = !u || !u.id ? ssoTokenFromUrl() : '';
    REALDBG.step('sync.js:init:identity-resolved', {
      hasTelegramUser: !!(u && u.id),
      sso: ssoToken ? ('present (' + ssoToken.length + ' chars)') : 'missing',
    });

    if ((!u || !u.id) && !ssoToken) {
      const deviceId = deviceIdFromUrl();
      if (deviceId) {
        REALDBG.step('sync.js:init:no-sso-trying-device-id-fallback', { deviceId });
        ssoToken = await mintSsoFromDeviceId(deviceId);
        REALDBG.step('sync.js:init:device-id-fallback-result', { minted: !!ssoToken });
      }
    }

    if ((!u || !u.id) && !ssoToken) {
      REALDBG.step('sync.js:init:no-identity-abort');
      _resolveReady(null);
      return;
    }

    let startParam = '';
    try {
      startParam = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe
        && window.Telegram.WebApp.initDataUnsafe.start_param) || '';
    } catch (_) {}

    REALDBG.step('sync.js:init:posting-user-sync');
    const data = await post(API.userSync, ssoToken ? {
      sso_token: ssoToken,
    } : {
      telegram_id:   String(u.id),
      first_name:    u.first_name    || '',
      last_name:     u.last_name     || '',
      username:      u.username      || '',
      language_code: u.language_code || 'en',
      photo_url:     u.photo_url     || '',
      start_param:   startParam,
    });

    if (!data || data.status !== 1 || !data.user) {
      REALDBG.step('sync.js:init:user-sync-failed', { status: data && data.status });
      _resolveReady(null);
      return;
    }
    REALDBG.step('sync.js:init:user-sync-ok');

    const su = data.user;
    if (ssoToken && su.telegram_id) _ssoTelegramId = String(su.telegram_id);

    /* Everything below this point is best-effort local-state hydration —
       none of it should ever be able to stop _resolveReady(su) from firing.
       Before this fix, an uncaught throw anywhere here (e.g. RealPlayer.set
       hitting a full localStorage quota) would leave RealSync.ready() —
       a bare `new Promise` with no reject path or timeout — pending
       forever, silently. 2026-07-19, Khabat's black-spinner report. */
    try {
      hydrateLocalStateFrom(su);
    } catch (err) {
      REALDBG.error(err, { via: 'hydrateLocalStateFrom' });
      /* su itself is still valid — resolveReady below regardless */
    }

    REALDBG.step('sync.js:init:ready');
    _resolveReady(su);
  };

  function hydrateLocalStateFrom(su) {
    /* Merge authoritative server values into Player localStorage state.
       Take the higher of server and local for ZAR and balance to prevent
       a stale-DB value from overwriting client-side earnings. */
    if (window.RealPlayer && window.RealPlayer.set) {
      const local = (window.RealPlayer.get && window.RealPlayer.get()) || {};
      const offlineZar = Number(su.offline_zar_earned) || 0;
      const serverZar  = (su.zar || 0) + offlineZar;
      window.RealPlayer.set({
        userId:      su.telegram_id,
        level:       su.level        || 1,
        xp:          Math.max(su.xp || 0, local.xp || 0),
        farr:        Math.max(su.farr || 0, local.farr || 0),
        zar:         Math.max(serverZar, local.zar || 0),
        gems:        Math.max(su.gems || 0, local.gems || 0),
        balance:     Math.max(su.real_balance || 0, local.balance || 0),
        energy:      su.current_energy != null ? su.current_energy : 1000,
        energyMax:   su.energy_max   || 1000,
        dailyStreak: su.daily_streak || 1,
      });
      // Derive energy level from server energy_max and persist to localStorage
      // so app.js (which reads real_energy_level) stays in sync across devices
      if (su.energy_max && su.energy_max > 1000) {
        const derivedLevel = Math.min(5, Math.round((su.energy_max - 1000) / 500));
        try { localStorage.setItem('real_energy_level', String(derivedLevel)); } catch {}
      }
      // Persist opened chests so inventory.js can hide them immediately on load
      // without waiting for the separate /api/season2/inventory fetch
      if (Array.isArray(su.opened_chests) && su.opened_chests.length) {
        try {
          const existing = JSON.parse(localStorage.getItem('real_opened_chests_v1') || '[]');
          const merged = Array.from(new Set([...existing, ...su.opened_chests]));
          localStorage.setItem('real_opened_chests_v1', JSON.stringify(merged));
        } catch {}
      }
      // Notify all pages that authoritative balances have landed
      try { window.dispatchEvent(new CustomEvent('balanceUpdate')); } catch (_) {}
      // Push corrected balance back to server immediately
      syncBalance();
    }

    /* Sync quest flags into localStorage so hydrateQuests() reflects server */
    try {
      const dk = new Date().toISOString().slice(0, 10);
      if (su.quest_read)          localStorage.setItem('real_quest_read_'            + dk, 'true');
      if (su.quest_quiz)          localStorage.setItem('real_quest_quiz_'            + dk, 'true');
      if (su.quest_invite)        localStorage.setItem('real_quest_invite_'          + dk, 'true');
      if (su.quest_tap)           localStorage.setItem('real_daily_taps_'            + dk, String(su.quest_tap));
      if (su.quest_bonus_claimed) {
        localStorage.setItem('real_daily_bonus_claimed_' + dk, '1');
      } else {
        localStorage.removeItem('real_daily_bonus_claimed_' + dk);
      }
      /* Cache profile pic so hydrateProfile() can use it */
      if (su.profile_pic)  localStorage.setItem('real_profile_pic', su.profile_pic);
      /* Cache referral data for earn.js + Final Encounter gate */
      if (su.referral_code) localStorage.setItem('real_referral_code', su.referral_code);
      if (su.verified_referral_count != null) {
        localStorage.setItem('real_verified_referral_count', String(su.verified_referral_count));
      }
      if (su.milestones_claimed) {
        localStorage.setItem('real_milestones_claimed', JSON.stringify(su.milestones_claimed));
      }
      if (su.last_checkin_date != null) localStorage.setItem('real_last_checkin_date', su.last_checkin_date);
      if (su.checkin_streak    != null) localStorage.setItem('real_checkin_streak',    String(su.checkin_streak));
      if (su.completed_tasks) {
        localStorage.setItem('real_completed_tasks', JSON.stringify(su.completed_tasks));
        /* Notify earn.js so it can re-render tasks with the authoritative server list */
        try { window.dispatchEvent(new CustomEvent('shahnama:tasks:synced', { detail: su.completed_tasks })); } catch (_) {}
      }
      if (su.adsgram) {
        localStorage.setItem('real_adsgram_config', JSON.stringify(su.adsgram));
        if (su.adsgram.watch && su.adsgram.watch.blockId) {
          localStorage.setItem('real_ad_block_id', su.adsgram.watch.blockId);
        }
      }
      if (su.max_real_balance != null)  localStorage.setItem('real_max_real_balance',  String(su.max_real_balance));
      if (su.economy)                   localStorage.setItem('real_economy_config',    JSON.stringify(su.economy));
      localStorage.setItem('real_has_clan',       su.clan_id ? '1' : '0');
      localStorage.setItem('real_my_clan_id',    su.clan_id || '');
      localStorage.setItem('real_is_clan_leader',
        (su.clan_id && su.clan_leader_id && String(su.telegram_id) === String(su.clan_leader_id)) ? '1' : '0');
    } catch (_) {}

    /* Show offline mining bonus overlay if earned */
    const offlineZar = Number(su.offline_zar_earned) || 0;
    if (offlineZar >= 1) {
      _showOfflineBonus(offlineZar);
    }
  }

  /* ── Quest sync — called immediately on completion ──────────────── */
  const syncQuest = (quest, tapCount) => {
    const tid = currentTelegramId();
    if (!tid) return;
    const body = { telegram_id: tid, quest };
    if (quest === 'tap' && tapCount != null) body.tap_count = tapCount;
    post(API.updateQuests, body);
  };

  /* ── Balance sync — called every 30 s and on page leave ─────────── */
  const syncBalance = () => {
    const tid = currentTelegramId();
    if (!tid) return;
    const p = (window.RealPlayer && window.RealPlayer.get) ? window.RealPlayer.get() : {};
    post(API.syncBalance, {
      telegram_id:    tid,
      real_balance:   p.balance  || 0,
      current_energy: p.energy   || 0,
      farr:           p.farr     || 0,
      zar:            p.zar      || 0,
      gems:           p.gems     || 0,
      xp:             p.xp       || 0,
    });
  };

  /* Periodic sync + page-leave sync */
  setInterval(syncBalance, 30000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') syncBalance();
  });
  window.addEventListener('pagehide', syncBalance);

  /* ══════════════════════════════════════════════════════════════════
     Chapter progression — server is source of truth, localStorage cache.
     Mirrors the backend merge: sets union, done flags OR, counters max,
     so a stale device can never lose progress in either direction.
     ══════════════════════════════════════════════════════════════════ */
  const CH_API = {
    get:  '/api/season2/user/chapter-progress/get',
    save: '/api/season2/user/chapter-progress/save',
  };
  const CH_TIERS = ['easy', 'medium', 'hard'];

  const _lsGet = (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } };
  const _lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };
  const _lsJSON = (k, fb) => { try { return JSON.parse(_lsGet(k) || fb); } catch (_) { return JSON.parse(fb); } };

  const _union = (a, b) => [...new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])])];

  const _mergeTier = (a, b, tier) => {
    a = a || {}; b = b || {};
    const unlocked = a.locked === false || b.locked === false || tier === 'easy';
    return {
      idx:     Math.max(Number(a.idx) || 0, Number(b.idx) || 0),
      correct: _union(a.correct, b.correct),
      wrong:   _union(a.wrong, b.wrong),
      done:    !!a.done || !!b.done,
      locked:  !unlocked,
      passed:  !!a.passed || !!b.passed,
    };
  };

  const _mergeChapter = (a, b) => {
    a = a || {}; b = b || {};
    const quiz = {};
    CH_TIERS.forEach(t => { quiz[t] = _mergeTier((a.quiz || {})[t], (b.quiz || {})[t], t); });
    return {
      scenes:       _union(a.scenes, b.scenes),
      codex:        _union(a.codex, b.codex),
      quiz,
      fragments:    Math.max(Number(a.fragments) || 0, Number(b.fragments) || 0),
      desk_read:    !!a.desk_read || !!b.desk_read,
      done:         !!a.done || !!b.done,
      rewards_done: !!a.rewards_done || !!b.rewards_done,
      scene_grants: _union(a.scene_grants, b.scene_grants),
      farr_grants:  _union(a.farr_grants, b.farr_grants),
    };
  };

  /* Snapshot one chapter's localStorage state in server format */
  const chapterSnapshot = (slug) => {
    const p = _lsJSON('real_chapter_progress_' + slug, '{}');
    const scenes = Array.isArray(p.scenes) ? p.scenes : [];
    return {
      scenes,
      codex:        Array.isArray(p.codex) ? p.codex : [],
      quiz:         p.quiz || {},
      fragments:    Number(p.fragments) || 0,
      desk_read:    !!p.desk_read,
      done:         _lsGet('real_chapter_done_' + slug) === '1',
      rewards_done: _lsGet('real_chapter_rewards_done_' + slug) === '1',
      scene_grants: scenes.filter(id => _lsGet('real_scene_xp_granted_' + slug + '_' + id) === '1'),
      farr_grants:  CH_TIERS.filter(t => _lsGet('real_quiz_farr_granted_' + slug + '_' + t) === '1'),
    };
  };

  /* Write a merged chapter snapshot back into all its localStorage keys */
  const _applyChapter = (slug, server) => {
    const m = _mergeChapter(chapterSnapshot(slug), server);
    _lsSet('real_chapter_progress_' + slug, JSON.stringify({
      scenes: m.scenes, codex: m.codex, quiz: m.quiz,
      fragments: m.fragments, desk_read: m.desk_read,
    }));
    if (m.done)         _lsSet('real_chapter_done_' + slug, '1');
    if (m.rewards_done) _lsSet('real_chapter_rewards_done_' + slug, '1');
    m.scene_grants.forEach(id => _lsSet('real_scene_xp_granted_' + slug + '_' + id, '1'));
    m.farr_grants.forEach(t  => _lsSet('real_quiz_farr_granted_' + slug + '_' + t, '1'));
    /* §7.9 quiz-gate (learn.js allQuizPassed) reads these flat per-tier keys,
       not the nested quiz object above — keep them in sync with the merged
       server snapshot so the gate is correct even before the whole chapter
       (scenes/codex) is marked done on this device. */
    CH_TIERS.forEach(tier => {
      if (m.quiz[tier] && m.quiz[tier].passed) _lsSet('real_quiz_' + slug + '_' + tier, 'passed');
    });
  };

  const _localChapterSlugs = () => {
    const slugs = new Set();
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) || '';
        if (k.startsWith('real_chapter_progress_')) slugs.add(k.slice(22));
        else if (k.startsWith('real_chapter_done_'))  slugs.add(k.slice(18));
      }
    } catch (_) {}
    return [...slugs];
  };

  let _resolveChReady;
  const _chReady = new Promise(r => { _resolveChReady = r; });

  const initChapterProgress = async () => {
    const tid = currentTelegramId();
    if (!tid) { _resolveChReady(null); return; }
    const data = await post(CH_API.get, { telegram_id: tid });
    if (!data || data.status !== 1) { _resolveChReady(null); return; }

    /* Same guarantee as init() above: nothing past this point may prevent
       _resolveChReady(data) from firing — chapterProgressReady() must
       always settle so a caller awaiting it can always proceed. */
    try {
      const serverChapters = data.chapters || {};
      Object.keys(serverChapters).forEach(slug => _applyChapter(slug, serverChapters[slug]));

      /* Items + tap skins (chapter artifacts) */
      const items = _lsJSON('real_items_v1', '{}');
      Object.keys(data.items || {}).forEach(id => { items[id] = true; });
      _lsSet('real_items_v1', JSON.stringify(items));
      const skins = _union(_lsJSON('real_skin_unlocked_v1', '[]'), data.skins);
      _lsSet('real_skin_unlocked_v1', JSON.stringify(skins));

      /* One-time migration: push local chapters the server doesn't know yet
         (or knows as not-done while this device has them completed). */
      const toPush = _localChapterSlugs().filter(s =>
        !serverChapters[s] || (!serverChapters[s].done && _lsGet('real_chapter_done_' + s) === '1'));
      if (toPush.length) {
        const chapters = {};
        toPush.forEach(s => { chapters[s] = chapterSnapshot(s); });
        post(CH_API.save, { telegram_id: tid, chapters, items, skins });
      }

      /* Forward-fix for the chapter-card-reward gap: grantChapterCard() in
         chapter.js only fires for the page currently open, so chapters that
         arrived via the migration above (or from another device) never get
         their hero card without this sweep. Cheap no-op once nothing's missing. */
      const reconcile = await post(API.reconcileChapterRewards, { telegram_id: tid });
      if (reconcile && reconcile.status === 1 && reconcile.granted && reconcile.granted.length) {
        await syncHeroes();
      }

      window.dispatchEvent(new CustomEvent('real:chapters:synced'));
    } catch (_) { /* data itself is still valid — resolveChReady below regardless */ }

    _resolveChReady(data);
  };

  /* Push one chapter (plus items/skins). Returns the request promise so
     callers that need the server to have committed done:true first (e.g.
     before requesting a chapter's hero-card reward, which the backend now
     validates against ChapterProgress) can await it. */
  const saveChapterProgress = (slug) => {
    const tid = currentTelegramId();
    if (!tid || !slug) return Promise.resolve(null);
    return post(CH_API.save, {
      telegram_id: tid,
      chapters: { [slug]: chapterSnapshot(slug) },
      items: _lsJSON('real_items_v1', '{}'),
      skins: _lsJSON('real_skin_unlocked_v1', '[]'),
    });
  };

  /* ── Load owned heroes and cache in localStorage ─────────────────── */
  const HEROES_LS = 'real_owned_heroes_v1';

  const syncHeroes = async () => {
    const tid = currentTelegramId();
    if (!tid) return {};
    const data = await post(API.userHeroes, { telegram_id: tid });
    if (!data || data.status !== 1) return {};
    const map = {};
    (data.heroes || []).forEach(h => { map[h.hero_id] = { level: h.level, zar_per_hour: h.zar_per_hour }; });
    try { localStorage.setItem(HEROES_LS, JSON.stringify(map)); } catch (_) {}
    return map;
  };

  const getOwnedHeroes = () => {
    try { return JSON.parse(localStorage.getItem(HEROES_LS) || '{}'); } catch { return {}; }
  };

  window.RealSync = {
    init, syncQuest, syncBalance, syncHeroes, getOwnedHeroes,
    ready: () => _ready,
    chapterProgressReady: () => _chReady,
    saveChapterProgress,
    chapterSnapshot,
    // Exposed 2026-07-19 (Khabat: remove Telegram remnants from profile.js/
    // guild.js) so pages other than this one can resolve "who is asking"
    // the same way init() already does internally: live Telegram context
    // first, falling back to the server-verified telegram_id bridged onto
    // a REAL-ID-only account by /user/sync. Await ready() first — this is
    // only populated once that call has actually completed.
    currentTelegramId,
  };

  /* Auto-start: call init() once DOM has loaded and app.js has run */
  const _boot = () => { init(); initChapterProgress(); };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _boot);
  } else {
    _boot();
  }
})();
