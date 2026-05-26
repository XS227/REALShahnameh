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
    userHeroes:   '/api/season2/user/heroes',
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

    let startParam = '';
    try {
      startParam = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe
        && window.Telegram.WebApp.initDataUnsafe.start_param) || '';
    } catch (_) {}

    const data = await post(API.userSync, {
      telegram_id:   String(u.id),
      first_name:    u.first_name    || '',
      last_name:     u.last_name     || '',
      username:      u.username      || '',
      language_code: u.language_code || 'en',
      photo_url:     u.photo_url     || '',
      start_param:   startParam,
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
      if (su.completed_tasks)           localStorage.setItem('real_completed_tasks',   JSON.stringify(su.completed_tasks));
      if (su.adsgram)                   localStorage.setItem('real_adsgram_config',    JSON.stringify(su.adsgram));
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

  /* ── Load owned heroes and cache in localStorage ─────────────────── */
  const HEROES_LS = 'real_owned_heroes_v1';

  const syncHeroes = async () => {
    const u = tgUser();
    if (!u || !u.id) return {};
    const data = await post(API.userHeroes, { telegram_id: String(u.id) });
    if (!data || data.status !== 1) return {};
    const map = {};
    (data.heroes || []).forEach(h => { map[h.hero_id] = { level: h.level, zar_per_hour: h.zar_per_hour }; });
    try { localStorage.setItem(HEROES_LS, JSON.stringify(map)); } catch (_) {}
    return map;
  };

  const getOwnedHeroes = () => {
    try { return JSON.parse(localStorage.getItem(HEROES_LS) || '{}'); } catch { return {}; }
  };

  window.RealSync = { init, syncQuest, syncBalance, syncHeroes, getOwnedHeroes, ready: () => _ready };

  /* Auto-start: call init() once DOM has loaded and app.js has run */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
