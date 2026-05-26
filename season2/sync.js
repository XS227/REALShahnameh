/* ==========================================================================
   REAL Shahnameh — Season 2 Sync (sync.js)
   Durable writes: Player state ↔ MongoDB via /api/season2/ endpoints.
   Loaded early (before tap.js / home.js). Exposes window.RealSync.
   ========================================================================== */
(function () {
  'use strict';

  const API = {
    userSync:     '/api/season2/user/sync',
    updateQuests: '/api/season2/user/update-quests',
    syncBalance:  '/api/season2/user/sync-balance',
  };

  const tgUser = () => {
    try {
      return window.Telegram
        && window.Telegram.WebApp
        && window.Telegram.WebApp.initDataUnsafe
        && window.Telegram.WebApp.initDataUnsafe.user || null;
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

  /* Ready promise — resolves with serverUser (or null on failure) */
  let _resolveReady;
  const _ready = new Promise(r => { _resolveReady = r; });

  /* ── init: call once on every page load ──────────────────────────── */
  const init = async () => {
    const u = tgUser();
    if (!u || !u.id) { _resolveReady(null); return; }

    const data = await post(API.userSync, {
      telegram_id:   String(u.id),
      first_name:    u.first_name    || '',
      last_name:     u.last_name     || '',
      username:      u.username      || '',
      language_code: u.language_code || 'en',
      photo_url:     u.photo_url     || '',
    });

    if (!data || data.status !== 1 || !data.user) {
      _resolveReady(null);
      return;
    }

    const su = data.user;

    /* Merge authoritative server values into Player localStorage state */
    if (window.RealPlayer && window.RealPlayer.set) {
      // Server-side energy regen is already computed by the backend
      window.RealPlayer.set({
        userId:      su.telegram_id,
        level:       su.level        || 1,
        xp:          su.xp          || 0,
        farr:        su.farr        || 0,
        zar:         su.zar         || 0,
        gems:        su.gems        || 0,
        balance:     su.real_balance || 0,
        energy:      su.current_energy != null ? su.current_energy : 1000,
        energyMax:   su.energy_max   || 1000,
        dailyStreak: su.daily_streak || 1,
      });
    }

    /* Sync quest flags into localStorage so hydrateQuests() reflects server */
    try {
      const dk = new Date().toISOString().slice(0, 10);
      if (su.quest_read)   localStorage.setItem('real_quest_read_'   + dk, 'true');
      if (su.quest_quiz)   localStorage.setItem('real_quest_quiz_'   + dk, 'true');
      if (su.quest_invite) localStorage.setItem('real_quest_invite_' + dk, 'true');
      if (su.quest_tap)    localStorage.setItem('real_daily_taps_'   + dk, String(su.quest_tap));
      /* Cache profile pic so hydrateProfile() can use it */
      if (su.profile_pic)  localStorage.setItem('real_profile_pic', su.profile_pic);
    } catch (_) {}

    _resolveReady(su);
  };

  /* ── Quest sync — called immediately on completion ──────────────── */
  const syncQuest = (quest, tapCount) => {
    const u = tgUser();
    if (!u || !u.id) return;
    const body = { telegram_id: String(u.id), quest };
    if (quest === 'tap' && tapCount != null) body.tap_count = tapCount;
    post(API.updateQuests, body);
  };

  /* ── Balance sync — called every 30 s and on page leave ─────────── */
  const syncBalance = () => {
    const u = tgUser();
    if (!u || !u.id) return;
    const p = (window.RealPlayer && window.RealPlayer.get) ? window.RealPlayer.get() : {};
    post(API.syncBalance, {
      telegram_id:    String(u.id),
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

  window.RealSync = { init, syncQuest, syncBalance, ready: () => _ready };

  /* Auto-start: call init() once DOM has loaded and app.js has run */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
