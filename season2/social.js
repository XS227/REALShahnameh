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

  /* ── MY CLAN ─────────────────────────────────────────────────────────── */

  const renderWarriorList = (members, verifiedCount, totalCount, clanEl) => {
    if (members.length === 0) {
      clanEl.innerHTML += `
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
      return `<div class="clan-row">
          <div class="clan-avatar">${initial}</div>
          <div class="clan-info">
            <div class="clan-name">${name}</div>
            <div class="clan-stats">LVL ${m.level || 1} · ${m.xp || 0} XP</div>
          </div>${tag}</div>`;
    }).join('');
    clanEl.innerHTML += `
      <article class="card lb-list clan-list" style="margin-top:0;">${rows}</article>`;
  };

  const loadClan = async () => {
    const clanEl = document.getElementById('my-clan');
    if (!clanEl) return;

    const u = tgUser();
    if (!u || !u.id) {
      clanEl.innerHTML = '<p class="clan-empty">Open via Telegram to see your clan.</p>';
      return;
    }

    clanEl.innerHTML = '<p class="clan-empty" style="padding:12px 0;">Loading your clan…</p>';

    /* Fetch clan membership and referral list in parallel */
    const [clanData, refData] = await Promise.all([
      get('/api/season2/clan/my-clan?' + new URLSearchParams({ telegram_id: String(u.id) })),
      post('/api/season2/social/referrals', { telegram_id: String(u.id) }),
    ]);

    clanEl.innerHTML = '';

    /* Update referral count cache */
    if (refData && refData.status === 1) {
      const vc = refData.verified_count || 0;
      try {
        localStorage.setItem('real_verified_referral_count', String(vc));
        window.dispatchEvent(new CustomEvent('real:referral:update'));
      } catch (_) {}
    }

    const myClan = clanData && clanData.status === 1 ? clanData.clan : null;

    /* ── Has a clan: show clan card ── */
    if (myClan) {
      const initial = myClan.clan_name.charAt(0).toUpperCase();
      clanEl.innerHTML = `
        <div class="section-head">
          <h3>Your Clan</h3>
          <span class="more">${myClan.member_count} member${myClan.member_count === 1 ? '' : 's'}</span>
        </div>
        <article class="card clan-founded-card">
          <div class="clan-founded-header">
            <div class="clan-badge-large">${initial}</div>
            <div>
              <div class="clan-founded-name">${myClan.clan_name}</div>
              ${myClan.motto ? `<div class="clan-founded-motto">"${myClan.motto}"</div>` : ''}
            </div>
          </div>
          <div class="clan-founded-stats">
            <span>👥 ${myClan.member_count} warriors</span>
            <span>◆ ${fmtN(myClan.total_real_earned)} REAL earned</span>
          </div>
        </article>`;

      /* Show warriors below the clan card */
      if (refData && refData.status === 1) {
        const members = refData.members || [];
        const vc      = refData.verified_count || 0;
        const tot     = refData.total_count    || 0;
        clanEl.innerHTML += `<div class="section-head" style="margin-top:16px;"><h3>Warriors</h3><span class="more">${vc} / ${tot} active</span></div>`;
        renderWarriorList(members, vc, tot, clanEl);
      }
      return;
    }

    /* ── No clan yet: show warriors + Create Clan prompt ── */
    const members       = (refData && refData.status === 1) ? (refData.members || [])       : [];
    const verifiedCount = (refData && refData.status === 1) ? (refData.verified_count || 0) : 0;
    const totalCount    = (refData && refData.status === 1) ? (refData.total_count    || 0) : 0;

    clanEl.innerHTML = `
      <div class="section-head">
        <h3>Your Clan</h3>
        <span class="more">${verifiedCount} / ${totalCount} active</span>
      </div>`;
    renderWarriorList(members, verifiedCount, totalCount, clanEl);

    /* Create Clan CTA */
    clanEl.innerHTML += `
      <article class="card clan-create-cta" id="clan-create-cta">
        <div class="clan-cta-left">
          <div class="clan-cta-ico">⚔</div>
          <div>
            <div class="clan-cta-title">Found Your Own Clan</div>
            <div class="clan-cta-sub">Rally warriors under your banner · 50,000 REAL</div>
          </div>
        </div>
        <button class="primary-btn" id="open-clan-modal">Create</button>
      </article>`;

    document.getElementById('open-clan-modal')?.addEventListener('click', openClanModal);
  };

  /* ── CLAN CREATION MODAL ─────────────────────────────────────────────── */

  let _nameCheckTimer = null;

  const openClanModal = () => {
    const modal    = document.getElementById('clan-modal');
    const nameInp  = document.getElementById('clan-name-input');
    const balRow   = document.getElementById('modal-balance-row');
    if (!modal) return;

    /* Show current balance */
    const localP = (() => { try { return JSON.parse(localStorage.getItem('real_player_state_v1') || '{}'); } catch { return {}; } })();
    const bal    = localP.balance || 0;
    if (balRow) balRow.innerHTML = `Your balance: <b style="color:var(--gold);">${fmtN(bal)} REAL</b>${bal < 50000 ? ' <span style="color:var(--ember);">· Insufficient</span>' : ''}`;

    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    nameInp?.focus();
  };

  const closeClanModal = () => {
    const modal = document.getElementById('clan-modal');
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    const nameInp  = document.getElementById('clan-name-input');
    const mottoInp = document.getElementById('clan-motto-input');
    const btn      = document.getElementById('clan-create-btn');
    const checkMsg = document.getElementById('name-check-msg');
    const checkIco = document.getElementById('name-check-icon');
    if (nameInp)  nameInp.value  = '';
    if (mottoInp) mottoInp.value = '';
    if (btn)      btn.disabled   = true;
    if (checkMsg) { checkMsg.textContent = ''; checkMsg.className = 'name-check-msg'; }
    if (checkIco) checkIco.textContent = '';
  };

  const checkClanName = async (name) => {
    const checkMsg = document.getElementById('name-check-msg');
    const checkIco = document.getElementById('name-check-icon');
    const btn      = document.getElementById('clan-create-btn');

    if (!name || name.length < 3) {
      if (checkMsg) { checkMsg.textContent = name ? 'Name must be at least 3 characters.' : ''; checkMsg.className = 'name-check-msg error'; }
      if (checkIco) checkIco.textContent = '';
      if (btn)      btn.disabled = true;
      return;
    }
    if (checkMsg) { checkMsg.textContent = 'Checking…'; checkMsg.className = 'name-check-msg muted'; }
    if (checkIco) checkIco.textContent = '⏳';

    const data = await get('/api/season2/clan/check-name?' + new URLSearchParams({ name }));
    if (!data || data.status !== 1) {
      if (checkMsg) { checkMsg.textContent = 'Could not verify name.'; checkMsg.className = 'name-check-msg error'; }
      if (btn)      btn.disabled = true;
      return;
    }
    if (data.available) {
      if (checkMsg) { checkMsg.textContent = '✓ Name is available!'; checkMsg.className = 'name-check-msg ok'; }
      if (checkIco) checkIco.textContent = '✓';
      if (btn)      btn.disabled = false;
    } else {
      const reason = data.reason === 'too_short' ? 'Too short.' : data.reason === 'too_long' ? 'Too long.' : data.reason === 'invalid_chars' ? 'Invalid characters.' : 'Name already taken.';
      if (checkMsg) { checkMsg.textContent = reason; checkMsg.className = 'name-check-msg error'; }
      if (checkIco) checkIco.textContent = '✗';
      if (btn)      btn.disabled = true;
    }
  };

  const wireClanModal = () => {
    const closeBtn = document.getElementById('clan-modal-close');
    const nameInp  = document.getElementById('clan-name-input');
    const createBtn = document.getElementById('clan-create-btn');
    const overlay  = document.getElementById('clan-modal');

    closeBtn?.addEventListener('click', closeClanModal);
    overlay?.addEventListener('click', (e) => { if (e.target === overlay) closeClanModal(); });

    nameInp?.addEventListener('input', () => {
      clearTimeout(_nameCheckTimer);
      _nameCheckTimer = setTimeout(() => checkClanName(nameInp.value.trim()), 500);
    });

    createBtn?.addEventListener('click', async () => {
      const u = tgUser();
      if (!u || !u.id) return;
      const name  = document.getElementById('clan-name-input')?.value.trim()  || '';
      const motto = document.getElementById('clan-motto-input')?.value.trim() || '';

      createBtn.disabled = true;
      createBtn.textContent = 'Creating…';

      const data = await post('/api/season2/clan/create', { telegram_id: String(u.id), clan_name: name, motto });

      if (!data || data.status !== 1) {
        const msg = {
          insufficient_balance: `Insufficient REAL. Need 50,000.`,
          name_taken:           `"${name}" is already taken.`,
          already_in_clan:      'You are already in a clan.',
          name_too_short:       'Name is too short.',
          name_too_long:        'Name is too long.',
        }[data?.error] || 'Failed to create clan. Try again.';
        const checkMsg = document.getElementById('name-check-msg');
        if (checkMsg) { checkMsg.textContent = msg; checkMsg.className = 'name-check-msg error'; }
        createBtn.disabled = false;
        createBtn.textContent = 'Create Clan';
        return;
      }

      /* Update local balance */
      try {
        const ps = JSON.parse(localStorage.getItem('real_player_state_v1') || '{}');
        ps.balance = data.new_balance;
        localStorage.setItem('real_player_state_v1', JSON.stringify(ps));
      } catch (_) {}

      closeClanModal();
      /* Reload clan section to show new clan card */
      loadClan();
    });
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
    wireClanModal();
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
