/* ==========================================================================
   REAL Shahnameh — Season 2 Social Hub (social.js)
   All data comes from live API calls. No hardcoded placeholder content.
   ========================================================================== */
(function () {
  'use strict';

  /* ── helpers ──────────────────────────────────────────────────────────── */

  const get = (url) =>
    fetch(url, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);

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

  const tgUser = () => {
    try {
      return (window.Telegram && window.Telegram.WebApp
        && window.Telegram.WebApp.initDataUnsafe
        && window.Telegram.WebApp.initDataUnsafe.user) || null;
    } catch (_) { return null; }
  };

  const fmtN = (n) => {
    n = Number(n) || 0;
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
    return String(Math.round(n));
  };

  const relTime = (ts) => {
    const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (s < 60)    return s + 's';
    if (s < 3600)  return Math.floor(s / 60) + 'm';
    if (s < 86400) return Math.floor(s / 3600) + 'h';
    return Math.floor(s / 86400) + 'd';
  };

  const displayName = (u) =>
    u.username ? '@' + u.username : (u.first_name || 'Warrior');

  /* ── LIVE pill ────────────────────────────────────────────────────────── */

  let _liveOn = false;
  const setLive = (on) => {
    if (_liveOn === on) return;
    _liveOn = on;
    const pill = document.querySelector('[data-live-pill]');
    if (!pill) return;
    pill.classList.toggle('live-off', !on);
  };

  /* ── LEADERBOARD ─────────────────────────────────────────────────────── */

  const lbCache = {};
  const lbPanels = () => ({
    earners:   document.getElementById('lb-earners'),
    learners:  document.getElementById('lb-learners'),
    referrers: document.getElementById('lb-referrers'),
  });

  const lbSkeleton = () =>
    Array.from({ length: 5 }, (_, i) => `
      <div class="lb-row ${i < 3 ? 'top' + (i + 1) : ''}">
        <span class="lb-rank">${i + 1}</span>
        <div>
          <div class="lb-name skel skel-name"></div>
          <div class="lb-sub skel skel-sub"></div>
        </div>
        <span class="lb-pts skel skel-pts"></span>
      </div>`).join('');

  const scoreOf = (type, r) => {
    if (type === 'learners')  return fmtN(r.xp) + ' XP';
    if (type === 'referrers') return (r.verified_referral_count || 0) + ' warriors';
    return fmtN(r.real_balance) + ' REAL';
  };

  const renderLb = (panel, type, data) => {
    if (!panel) return;
    if (!data || data.status !== 1) {
      panel.innerHTML = '<p class="clan-empty">Could not load leaderboard.</p>';
      return;
    }

    const rows   = data.rows || [];
    const u      = tgUser();
    const myId   = u ? String(u.id) : null;
    const rankCls = (i) => ['top1', 'top2', 'top3'][i] || '';

    let html = rows.map((r, i) => {
      const isMe = myId && r.telegram_id === myId;
      return `
        <div class="lb-row ${rankCls(i)}${isMe ? ' lb-me' : ''}">
          <span class="lb-rank">${i + 1}</span>
          <div>
            <div class="lb-name">${displayName(r)}${isMe ? ' <span class="you-tag">You</span>' : ''}</div>
            <div class="lb-sub">LVL ${r.level || 1}</div>
          </div>
          <span class="lb-pts">${scoreOf(type, r)}</span>
        </div>`;
    }).join('');

    if (!rows.length) {
      html = '<p class="clan-empty">No players yet — be the first!</p>';
    }

    /* Append "You" row if current user is outside top 10 */
    const myRank = data.my_rank;
    const myUser = data.my_user;
    const inTop  = rows.some(r => myId && r.telegram_id === myId);
    if (myRank && myUser && !inTop) {
      const gap = myRank > rows.length ? myRank - rows.length : 0;
      html += `
        <div class="lb-row lb-me" style="background:rgba(244,197,107,.06);">
          <span class="lb-rank">${myRank}</span>
          <div>
            <div class="lb-name">You · ${myUser.first_name || 'Warrior'}</div>
            <div class="lb-sub">${gap > 0 ? 'Climb ' + gap + ' to enter top' : ''}</div>
          </div>
          <span class="lb-pts">${scoreOf(type, myUser)}</span>
        </div>`;
    } else if (!myId) {
      html += '<p class="clan-empty" style="margin:10px 16px 4px;font-size:12px;">Open via Telegram to see your rank.</p>';
    }

    panel.innerHTML = html;
  };

  const loadLb = async (type) => {
    const panels = lbPanels();
    const panel  = panels[type];
    if (!panel) return;

    if (lbCache[type]) {
      renderLb(panel, type, lbCache[type]);
      return;
    }

    panel.innerHTML = lbSkeleton();

    const u  = tgUser();
    const qs = new URLSearchParams({ type });
    if (u && u.id) qs.set('telegram_id', String(u.id));
    const data = await get('/api/season2/social/leaderboard?' + qs.toString());
    lbCache[type] = data;
    renderLb(panel, type, data);
    if (data && data.status === 1) setLive(true);
  };

  /* Tab switching */
  const wireTabs = () => {
    const tabs = document.querySelectorAll('[data-lb-tabs] .tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const type = tab.getAttribute('data-lb');
        const panels = lbPanels();
        Object.values(panels).forEach(p => { if (p) p.style.display = 'none'; });
        const panel = panels[type];
        if (panel) panel.style.display = '';
        loadLb(type);
      });
    });
  };

  /* ── MY CLAN (referrals) ─────────────────────────────────────────────── */

  const loadClan = async () => {
    const clanEl = document.getElementById('my-clan');
    if (!clanEl) return;

    const u = tgUser();
    if (!u || !u.id) {
      clanEl.innerHTML = '<p class="clan-empty">Open via Telegram to see your clan.</p>';
      return;
    }

    clanEl.innerHTML = '<p class="clan-empty">Loading your clan…</p>';
    const data = await post('/api/season2/social/referrals', { telegram_id: String(u.id) });

    if (!data || data.status !== 1) {
      clanEl.innerHTML = `
        <div class="section-head"><h3>Your Clan</h3></div>
        <article class="card"><p class="clan-empty">Could not load clan data.</p></article>`;
      return;
    }

    const members       = data.members       || [];
    const verifiedCount = data.verified_count || 0;
    const totalCount    = data.total_count    || 0;

    try {
      localStorage.setItem('real_verified_referral_count', String(verifiedCount));
      window.dispatchEvent(new CustomEvent('real:referral:update'));
    } catch (_) {}

    if (members.length === 0) {
      clanEl.innerHTML = `
        <div class="section-head"><h3>Your Clan</h3><span class="more">0 warriors</span></div>
        <article class="card">
          <p class="clan-empty">No warriors yet. Share your invite link to grow your clan.</p>
        </article>`;
      return;
    }

    const rows = members.map(m => {
      const name    = m.username ? '@' + m.username : (m.first_name || 'Warrior');
      const initial = name.replace('@', '').charAt(0).toUpperCase();
      const tag     = m.verified
        ? '<span class="clan-tag clan-verified">✓ Active</span>'
        : '<span class="clan-tag clan-pending">⌛ Pending</span>';
      return `
        <div class="clan-row">
          <div class="clan-avatar">${initial}</div>
          <div class="clan-info">
            <div class="clan-name">${name}</div>
            <div class="clan-stats">LVL ${m.level || 1} · ${m.xp || 0} XP</div>
          </div>
          ${tag}
        </div>`;
    }).join('');

    clanEl.innerHTML = `
      <div class="section-head">
        <h3>Your Clan</h3>
        <span class="more">${verifiedCount} / ${totalCount} active</span>
      </div>
      <article class="card lb-list clan-list">${rows}</article>`;
  };

  /* ── ACTIVITY FEED ───────────────────────────────────────────────────── */

  const loadActivity = async () => {
    const feedEl = document.getElementById('activity-feed');
    if (!feedEl) return;

    feedEl.innerHTML = '<p class="clan-empty" style="padding:12px 16px;">Loading activity…</p>';
    const data = await get('/api/season2/social/activity');

    if (!data || data.status !== 1 || !(data.events || []).length) {
      feedEl.innerHTML = '<p class="clan-empty" style="padding:12px 16px;">No activity yet — start playing to appear here!</p>';
      return;
    }

    feedEl.innerHTML = data.events.map(ev => `
      <div class="feed-row">
        <span class="feed-icon" style="color:${ev.color || 'var(--gold)'};">${ev.icon || '📜'}</span>
        <div class="text"><b>${ev.user}</b> ${ev.detail}</div>
        <span class="time">${relTime(ev.ts)}</span>
      </div>`).join('');

    if (data.status === 1) setLive(true);
  };

  /* ── GUILDS ──────────────────────────────────────────────────────────── */

  const loadGuilds = async () => {
    const data = await get('/api/season2/social/guilds');
    if (!data || data.status !== 1) return;
    const g = data.guilds || {};
    const update = (id) => {
      const el = document.querySelector(`[data-guild-members="${id}"]`);
      if (!el || !g[id]) return;
      el.textContent = `${g[id].members} / ${g[id].max} members`;
    };
    ['lions', 'simorgh', 'rostam'].forEach(update);
  };

  /* ── TOURNAMENT TIMER ────────────────────────────────────────────────── */

  const startTournamentTimer = () => {
    const el = document.getElementById('tournament-timer');
    if (!el) return;

    const nextSundayEnd = () => {
      const d = new Date();
      d.setUTCHours(23, 59, 59, 0);
      const day = d.getUTCDay(); /* 0 = Sun */
      const daysLeft = day === 0 ? 7 : 7 - day;
      d.setUTCDate(d.getUTCDate() + daysLeft);
      return d;
    };

    const fmt = (s) => {
      const d = Math.floor(s / 86400);
      const h = Math.floor((s % 86400) / 3600);
      const m = Math.floor((s % 3600) / 60);
      if (d > 0) return `${d}d ${h}h`;
      if (h > 0) return `${h}h ${m}m`;
      return `${m}m`;
    };

    const tick = () => {
      const diff = Math.max(0, Math.floor((nextSundayEnd().getTime() - Date.now()) / 1000));
      el.textContent = 'Ends in ' + fmt(diff);
    };
    tick();
    setInterval(tick, 60_000);
  };

  /* ── INIT ─────────────────────────────────────────────────────────────── */

  const init = async () => {
    setLive(false);
    wireTabs();
    await Promise.all([
      loadLb('earners'),
      loadClan(),
      loadActivity(),
      loadGuilds(),
    ]);
    startTournamentTimer();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
