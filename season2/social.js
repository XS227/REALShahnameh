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

  const displayName = (u) => u.first_name || 'Warrior';

  const fmtZar = (n) => {
    n = Number(n) || 0;
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
    return n.toFixed(1);
  };

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
      const isMe = r.is_me;
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
    const inTop  = rows.some(r => r.is_me);
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

  /* ── BROWSE CLANS ───────────────────────────────────────────────────── */

  const showToast = (msg) => {
    const el = document.querySelector('[data-toast]');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2800);
  };

  let _browseClansDone = false;

  const loadBrowseClans = async (force) => {
    const container = document.getElementById('browse-clans');
    const headEl    = document.getElementById('browse-clans-head');
    if (!container) return;

    if (!force && _browseClansDone) return;
    _browseClansDone = true;

    if (headEl) headEl.style.display = '';
    container.innerHTML = '<p class="clan-empty" style="padding:12px 0;">Loading clans…</p>';

    const u    = tgUser();
    const myId = u ? String(u.id) : null;
    const qs   = new URLSearchParams();
    if (myId) qs.set('telegram_id', myId);

    const data = await get('/api/season2/clan/browse?' + qs.toString());

    if (!data || data.status !== 1 || !(data.clans || []).length) {
      container.innerHTML = '<p class="clan-empty">No clans yet — be the first to found one!</p>';
      return;
    }

    const rows = data.clans.map((c, i) => {
      const members = c.member_count || 1;
      const rankCls = ['clan-rank-1', 'clan-rank-2', 'clan-rank-3'][i] || '';
      const status  = c.user_status || 'none';

      let actionBtn = '';
      if (status === 'member') {
        actionBtn = `<span class="clan-browse-badge mine">Your Clan</span>`;
      } else if (status === 'other_clan') {
        actionBtn = `<span class="clan-browse-badge taken">Joined</span>`;
      } else if (status === 'pending') {
        actionBtn = `<span class="clan-browse-badge pending">Pending…</span>`;
      } else {
        actionBtn = `<button class="secondary-btn clan-apply-btn"
          data-clan-id="${c.clan_id}"
          data-clan-name="${c.clan_name.replace(/"/g, '&quot;')}">Apply</button>`;
      }

      return `
        <div class="clan-browse-row ${rankCls}">
          <div class="clan-browse-rank">${i + 1}</div>
          <div class="clan-browse-badge-lg">${c.clan_name.charAt(0).toUpperCase()}</div>
          <div class="clan-browse-info">
            <div class="clan-browse-name">${c.clan_name}</div>
            <div class="clan-browse-meta">
              <span>👥 ${members}/50</span>
              <span>◆ ${fmtN(c.total_real_earned)} REAL</span>
              <span>Leader: ${c.leader_name}</span>
            </div>
          </div>
          <div class="clan-browse-action">${actionBtn}</div>
        </div>`;
    }).join('');

    container.innerHTML = `<article class="card lb-list clan-browse-list">${rows}</article>`;

    /* Wire Apply buttons */
    container.querySelectorAll('.clan-apply-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!myId) { showToast('Open via Telegram to apply.'); return; }
        const clanId   = btn.dataset.clanId;
        const clanName = btn.dataset.clanName;
        btn.disabled   = true;
        btn.textContent = '…';

        const res = await post('/api/season2/clan/apply', { telegram_id: myId, clan_id: clanId });

        if (res && res.status === 1) {
          btn.textContent = 'Pending…';
          btn.className = 'clan-browse-badge pending';
          showToast('Application sent to ' + clanName + '!');
        } else {
          const msg = {
            already_in_clan:      'You are already in a clan.',
            cannot_apply_own_clan:'That is your own clan.',
            clan_full:            clanName + ' is full (50/50).',
            clan_not_found:       'Clan not found.',
          }[res?.error] || 'Could not apply. Try again.';
          showToast(msg);
          btn.disabled   = false;
          btn.textContent = 'Apply';
        }
      });
    });
  };

  /* ── MY CLAN ─────────────────────────────────────────────────────────── */

  const renderWarriorList = (members, verifiedCount, totalCount, clanEl) => {
    if (members.length === 0) {
      clanEl.insertAdjacentHTML('beforeend', `
        <article class="card">
          <p class="clan-empty">No warriors yet. Share your invite link to grow your clan.</p>
        </article>`);
      return;
    }
    const rows = members.map(m => {
      const name    = m.first_name || 'Warrior';
      const initial = name.charAt(0).toUpperCase();
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
    clanEl.insertAdjacentHTML('beforeend', `
      <article class="card lb-list clan-list" style="margin-top:0;">${rows}</article>`);
  };

  /* ── LEADER DASHBOARD ────────────────────────────────────────────────── */

  const loadLeaderDashboard = async (leaderId, clanId, containerEl, currentTgLink) => {
    const tgLink = currentTgLink || '';

    /* ── Settings panel ──────────────────────────────────────────────── */
    containerEl.innerHTML = `
      <div class="section-head" style="margin-top:16px;">
        <h3>Leader Dashboard</h3>
      </div>
      <article class="card" style="padding:14px 16px;">
        <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:3px;">💬 Telegram Group Link</div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:8px;">Share your group with all clan members.</div>
        <div style="display:flex;gap:8px;">
          <input type="url" id="tg-link-input" class="modal-input"
            style="flex:1;margin:0;font-size:12px;padding:8px 10px;"
            placeholder="https://t.me/joinchat/…" />
          <button class="secondary-btn" id="tg-link-save" style="padding:8px 14px;font-size:12px;">Save</button>
        </div>
        <div id="tg-link-msg" style="font-size:11px;margin-top:5px;"></div>
      </article>
      <div id="applications-container">
        <p class="clan-empty" style="padding:10px 0 4px;">Loading applications…</p>
      </div>`;

    /* Pre-fill current link */
    const tgInput = document.getElementById('tg-link-input');
    if (tgInput && tgLink) tgInput.value = tgLink;

    /* Save link */
    document.getElementById('tg-link-save')?.addEventListener('click', async () => {
      const link  = document.getElementById('tg-link-input')?.value.trim() || '';
      const msgEl = document.getElementById('tg-link-msg');
      const btn   = document.getElementById('tg-link-save');

      if (link && !link.startsWith('https://t.me/') && !link.startsWith('https://telegram.me/')) {
        if (msgEl) { msgEl.textContent = 'Must start with https://t.me/…'; msgEl.style.color = 'var(--ember)'; }
        return;
      }

      btn.disabled = true; btn.textContent = '…';
      const res = await post('/api/season2/clan/set-telegram-link', { telegram_id: leaderId, telegram_group_link: link });

      if (res && res.status === 1) {
        if (msgEl) { msgEl.textContent = link ? '✓ Link saved!' : '✓ Link cleared.'; msgEl.style.color = 'var(--gold)'; }
        /* Update the Join Chat button in the clan card */
        const joinBtn = document.getElementById('clan-join-chat-btn');
        if (joinBtn) {
          joinBtn.style.display = link ? '' : 'none';
          joinBtn.dataset.link = link;
        }
      } else {
        const msg = { invalid_link: 'Invalid Telegram link.', not_leader: 'Not the clan leader.' }[res?.error] || 'Could not save. Try again.';
        if (msgEl) { msgEl.textContent = msg; msgEl.style.color = 'var(--ember)'; }
      }

      btn.disabled = false; btn.textContent = 'Save';
    });

    /* ── Applications panel ──────────────────────────────────────────── */
    const appsEl = document.getElementById('applications-container');
    if (!appsEl) return;

    const data = await get('/api/season2/clan/applications?' + new URLSearchParams({ telegram_id: leaderId }));

    if (!data || data.status !== 1) {
      appsEl.innerHTML = '<p class="clan-empty">Could not load applications.</p>';
      return;
    }

    const apps = data.applications || [];

    if (!apps.length) {
      appsEl.innerHTML = `
        <article class="card" style="padding:14px 16px;margin-top:10px;">
          <div class="section-head" style="margin:0 0 8px;"><h3>Applications</h3></div>
          <p class="clan-empty">No pending applications. Share your clan link to recruit more warriors! When players apply, their requests will appear here for your approval.</p>
        </article>`;
      return;
    }

    const rows = apps.map(a => `
      <div class="clan-row clan-app-row" data-applicant="${a.applicant_id}">
        <div class="clan-avatar">${(a.name || 'W').charAt(0).toUpperCase()}</div>
        <div class="clan-info">
          <div class="clan-name">${a.name}</div>
          <div class="clan-stats">LVL ${a.level} · ${fmtN(a.xp)} XP</div>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="primary-btn app-accept-btn" data-id="${a.applicant_id}" style="padding:6px 12px;font-size:12px;">✓ Accept</button>
          <button class="secondary-btn app-reject-btn" data-id="${a.applicant_id}" style="padding:6px 12px;font-size:12px;">✗ Reject</button>
        </div>
      </div>`).join('');

    appsEl.innerHTML = `
      <div class="section-head" style="margin-top:10px;">
        <h3>Applications</h3>
        <span class="more">${apps.length} pending</span>
      </div>
      <article class="card lb-list clan-list">${rows}</article>`;

    /* Wire accept/reject */
    appsEl.querySelectorAll('.app-accept-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const applicantId = btn.dataset.id;
        btn.disabled = true; btn.textContent = '…';
        const res = await post('/api/season2/clan/accept-application', { telegram_id: leaderId, applicant_id: applicantId });
        if (res && res.status === 1) {
          showToast('Warrior accepted into the clan!');
          appsEl.querySelector(`.clan-app-row[data-applicant="${applicantId}"]`)?.remove();
        } else {
          const msg = {
            clan_full:                'Clan is full (50/50).',
            applicant_already_in_clan:'Warrior already joined a clan.',
            application_not_found:   'Application no longer pending.',
          }[res?.error] || 'Could not accept. Try again.';
          showToast(msg);
          btn.disabled = false; btn.textContent = '✓ Accept';
        }
      });
    });

    appsEl.querySelectorAll('.app-reject-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const applicantId = btn.dataset.id;
        btn.disabled = true; btn.textContent = '…';
        const res = await post('/api/season2/clan/reject-application', { telegram_id: leaderId, applicant_id: applicantId });
        if (res && res.status === 1) {
          showToast('Application rejected.');
          appsEl.querySelector(`.clan-app-row[data-applicant="${applicantId}"]`)?.remove();
        } else {
          btn.disabled = false; btn.textContent = '✗ Reject';
          showToast('Could not reject. Try again.');
        }
      });
    });
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

    /* Cache clan id so Browse Clans can disable Apply on own/joined clans */
    try { localStorage.setItem('real_my_clan_id', myClan ? myClan.clan_id : ''); } catch (_) {}
    /* Cache for sync.js clan perk check */
    try { localStorage.setItem('real_has_clan', myClan ? '1' : '0'); } catch (_) {}

    /* ── Has a clan: show clan card ── */
    if (myClan) {
      const initial   = myClan.clan_name.charAt(0).toUpperCase();
      const isLeader  = u && myClan.leader_id === String(u.id);
      const tgLink    = myClan.telegram_group_link || '';
      const zarHr     = myClan.total_zar_per_hour  || 0;

      const openTgLink = (url) => {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openTelegramLink) {
          window.Telegram.WebApp.openTelegramLink(url);
        } else {
          window.open(url, '_blank');
        }
      };

      const openLink = (url) => {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openLink) {
          window.Telegram.WebApp.openLink(url);
        } else {
          window.open(url, '_blank');
        }
      };

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
              ${isLeader ? '<div class="clan-leader-tag">⚔ Clan Leader</div>' : ''}
            </div>
          </div>
          <div class="clan-founded-stats">
            <span>👥 ${myClan.member_count} warriors</span>
            <span>◆ ${fmtN(myClan.total_real_earned)} REAL earned</span>
            ${zarHr > 0 ? `<span class="clan-power-stat">⚡ ${fmtZar(zarHr)} ZAR/hr</span>` : ''}
          </div>
          <div class="clan-action-row">
            <button class="secondary-btn clan-chat-btn${tgLink ? '' : ' hidden'}" id="clan-join-chat-btn"
              data-link="${tgLink.replace(/"/g,'&quot;')}"
              style="${tgLink ? '' : 'display:none;'}">💬 Join Clan Chat</button>
            <button class="secondary-btn clan-share-btn" id="clan-share-btn"
              data-name="${myClan.clan_name.replace(/"/g,'&quot;')}"
              data-clan-id="${myClan.clan_id}">📢 Share Clan</button>
          </div>
          ${isLeader ? '<button class="secondary-btn" id="manage-clan-btn" style="margin-top:10px;width:100%;">⚔ Manage Clan</button>' : ''}
        </article>`;

      /* Wire Join Chat — opens t.me group link inside Telegram */
      document.getElementById('clan-join-chat-btn')?.addEventListener('click', (e) => {
        const link = e.currentTarget.dataset.link;
        if (link) openTgLink(link);
      });

      /* Wire Share — use openLink so Telegram shows the sharing UI */
      document.getElementById('clan-share-btn')?.addEventListener('click', (e) => {
        const name     = e.currentTarget.dataset.name;
        const clanId   = e.currentTarget.dataset.clanId;
        const botUrl   = `https://t.me/shahnameh_bot?start=clan_${clanId}`;
        const text     = `Bli med i min klan ${name} i Shahnameh! Vi tjener REAL sammen. ⚔️`;
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(botUrl)}&text=${encodeURIComponent(text)}`;
        openLink(shareUrl);
      });

      /* Leader Dashboard — toggled open/close with animation */
      if (isLeader) {
        const manageClanEl = document.createElement('div');
        manageClanEl.id    = 'leader-dashboard';
        manageClanEl.className = 'leader-dashboard-panel';
        clanEl.appendChild(manageClanEl);

        let dashboardOpen   = false;
        let dashboardLoaded = false;

        document.getElementById('manage-clan-btn')?.addEventListener('click', () => {
          const btn = document.getElementById('manage-clan-btn');
          if (!dashboardOpen) {
            if (!dashboardLoaded) {
              dashboardLoaded = true;
              loadLeaderDashboard(String(u.id), myClan.clan_id, manageClanEl, tgLink);
            }
            manageClanEl.classList.add('open');
            dashboardOpen = true;
            if (btn) btn.textContent = '✖ Close Management';
          } else {
            manageClanEl.classList.remove('open');
            dashboardOpen = false;
            if (btn) btn.textContent = '⚔ Manage Clan';
          }
        });
      }

      /* Show warriors below the clan card — use insertAdjacentHTML to preserve
         the event listeners attached above (Share, Join Chat, Manage Clan).    */
      if (refData && refData.status === 1) {
        const members = refData.members || [];
        const vc      = refData.verified_count || 0;
        const tot     = refData.total_count    || 0;
        clanEl.insertAdjacentHTML('beforeend',
          `<div class="section-head" style="margin-top:16px;"><h3>Warriors</h3><span class="more">${vc} / ${tot} active</span></div>`);
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

  /* ── EVENTS ──────────────────────────────────────────────────────────── */

  let _eventsData = null;

  const fmtCountdown = (s) => {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const startEventTimers = (endsAtMs) => {
    const tick = () => {
      const diff = Math.max(0, Math.floor((endsAtMs - Date.now()) / 1000));
      const label = 'Ends in ' + fmtCountdown(diff);
      document.querySelectorAll('.event-timer').forEach(el => { el.textContent = label; });
    };
    tick();
    setInterval(tick, 60_000);
  };

  const openEventModal = (type) => {
    const modal   = document.getElementById('event-modal');
    const bodyEl  = document.getElementById('event-modal-body');
    const titleEl = document.getElementById('event-modal-title');
    if (!modal || !bodyEl || !_eventsData) return;

    const d = _eventsData;

    if (type === 'tournament') {
      titleEl.textContent = '🏆 Royal Cup Leaderboard';
      const lb = d.tournament.leaderboard || [];
      const rows = lb.map((r, i) => {
        const isMe = r.is_me;
        return `<div class="lb-row ${['top1','top2','top3'][i]||''}${isMe?' lb-me':''}">
          <span class="lb-rank">${i+1}</span>
          <div>
            <div class="lb-name">${r.first_name||'Warrior'}${isMe?' <span class="you-tag">You</span>':''}</div>
          </div>
          <span class="lb-pts">${fmtN(r.real_balance)} REAL</span>
        </div>`;
      }).join('') || '<p class="clan-empty">No players yet.</p>';
      bodyEl.innerHTML = `
        <p class="modal-desc">Top 100 players share 100,000 REAL. Resets every Sunday.</p>
        <article class="card lb-list" style="margin-bottom:0;">${rows}</article>`;

    } else if (type === 'referral') {
      titleEl.textContent = '📣 Referral Contest';
      const rc   = d.referral_contest;
      const lb   = rc.leaderboard || [];
      const rows = lb.map((r, i) => {
        const isMe = r.is_me;
        return `<div class="lb-row ${['top1','top2','top3'][i]||''}${isMe?' lb-me':''}">
          <span class="lb-rank">${i+1}</span>
          <div>
            <div class="lb-name">${r.first_name||'Warrior'}${isMe?' <span class="you-tag">You</span>':''}</div>
          </div>
          <span class="lb-pts">${r.verified_referral_count||0} warriors</span>
        </div>`;
      }).join('') || '<p class="clan-empty">No referrers yet — be the first!</p>';

      const myRank  = rc.my_rank;
      const myCount = rc.my_count || 0;
      const refCode = rc.my_referral_code || '';
      const refUrl  = refCode ? `https://t.me/shahnameh_bot?start=${refCode}` : '';
      const inTop   = lb.some(r => r.is_me);

      let myRow = '';
      if (myRank && !inTop) {
        myRow = `<div class="lb-row lb-me" style="margin-top:8px;background:rgba(244,197,107,.06);">
          <span class="lb-rank">${myRank}</span>
          <div><div class="lb-name">You</div><div class="lb-sub">${myCount} warriors referred</div></div>
          <span class="lb-pts">${myCount} warriors</span>
        </div>`;
      }

      bodyEl.innerHTML = `
        <p class="modal-desc">Top 10 referrers earn the Founder Frame · Ends Sunday.</p>
        <article class="card lb-list" style="margin-bottom:0;">${rows}</article>
        ${myRow}
        ${refUrl ? `<button class="primary-btn btn-block" id="event-invite-btn" style="margin-top:14px;">📲 Share Invite Link</button>` : ''}`;

      if (refUrl) {
        document.getElementById('event-invite-btn')?.addEventListener('click', () => {
          const text = `Join me in Shahnameh! ⚔️ Earn REAL together.`;
          const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refUrl)}&text=${encodeURIComponent(text)}`;
          if (window.Telegram?.WebApp?.openLink) window.Telegram.WebApp.openLink(shareUrl);
          else window.open(shareUrl, '_blank');
        });
      }

    } else if (type === 'learning') {
      const l      = d.learning_race;
      const slugs  = l.chapter_slugs  || [];
      const titles = l.chapter_titles || [];
      const done   = slugs.filter(s => localStorage.getItem(`real_chapter_done_${s}`) === '1').length;
      const pct    = Math.round((done / (l.total_chapters || 6)) * 100);

      titleEl.textContent = '📜 Learning Race';

      const chapterRows = slugs.map((slug, i) => {
        const isDone = localStorage.getItem(`real_chapter_done_${slug}`) === '1';
        return `<div class="event-chapter-row${isDone?' done':''}">
          <span class="event-chapter-check">${isDone ? '✓' : String(i+1)}</span>
          <span>${titles[i] || slug}</span>
        </div>`;
      }).join('');

      bodyEl.innerHTML = `
        <p class="modal-desc">Finish all ${l.total_chapters} chapters first to earn ${fmtN(l.reward_real)} REAL bonus.</p>
        <div class="event-progress-bar-wrap">
          <div class="event-progress-bar" style="width:${pct}%;"></div>
        </div>
        <div class="event-progress-label">${done} / ${l.total_chapters} chapters · ${pct}%</div>
        <div class="event-chapter-list">${chapterRows}</div>
        <a href="learn.html" class="primary-btn btn-block" style="margin-top:14px;display:block;text-align:center;text-decoration:none;">📖 Go to Stories</a>`;
    }

    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
  };

  const closeEventModal = () => {
    const modal = document.getElementById('event-modal');
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  };

  const loadEvents = async () => {
    const container = document.getElementById('events-list');
    if (!container) return;

    container.innerHTML = '<p class="clan-empty" style="padding:12px 0;">Loading events…</p>';

    const u  = tgUser();
    const qs = new URLSearchParams();
    if (u && u.id) qs.set('telegram_id', String(u.id));

    const data = await get('/api/season2/events?' + qs.toString());

    if (!data || data.status !== 1) {
      container.innerHTML = '<article class="card"><p class="clan-empty">Events unavailable.</p></article>';
      return;
    }

    _eventsData = data;

    const t  = data.tournament;
    const l  = data.learning_race;
    const rc = data.referral_contest;

    const doneCount = (l.chapter_slugs || []).filter(
      s => localStorage.getItem(`real_chapter_done_${s}`) === '1'
    ).length;

    const timerLabel = 'Ends in ' + fmtCountdown(t.ends_in_seconds);

    const myRefRank  = rc.my_rank;
    const refSub     = myRefRank ? `Your rank: #${myRefRank}` : 'Top 10 earn the Founder Frame';

    container.innerHTML = `<section class="utility-grid">
      <article class="card utility-row event-card" data-event="tournament">
        <span class="ico" style="background:rgba(244,197,107,.14);border-color:var(--border-gold);color:var(--gold);">🏆</span>
        <div>
          <h5>Weekly Tournament — Royal Cup</h5>
          <p>Top 100 share 100,000 REAL · <span class="event-timer">${timerLabel}</span></p>
        </div>
        <span class="event-chevron">›</span>
      </article>
      <article class="card utility-row event-card" data-event="referral">
        <span class="ico" style="background:rgba(94,162,255,.14);border-color:rgba(94,162,255,.32);color:var(--azure);">📣</span>
        <div>
          <h5>Referral Contest</h5>
          <p>${refSub} · <span class="event-timer">${timerLabel}</span></p>
        </div>
        <span class="event-chevron">›</span>
      </article>
      <article class="card utility-row event-card" data-event="learning">
        <span class="ico">📜</span>
        <div>
          <h5>Learning Race</h5>
          <p>${doneCount}/${l.total_chapters} chapters complete · ${fmtN(l.reward_real)} REAL reward</p>
        </div>
        <span class="event-chevron">›</span>
      </article>
    </section>`;

    container.querySelectorAll('.event-card').forEach(card => {
      card.addEventListener('click', () => openEventModal(card.dataset.event));
    });

    startEventTimers(t.ends_at_ms);
  };

  /* ── INIT ─────────────────────────────────────────────────────────────── */

  const init = async () => {
    setLive(false);
    wireTabs();
    wireClanModal();

    document.getElementById('browse-clans-refresh')?.addEventListener('click', (e) => {
      e.preventDefault();
      _browseClansDone = false;
      loadBrowseClans(true);
    });

    const eventModal = document.getElementById('event-modal');
    document.getElementById('event-modal-close')?.addEventListener('click', closeEventModal);
    eventModal?.addEventListener('click', (e) => { if (e.target === eventModal) closeEventModal(); });

    await Promise.all([
      loadLb('earners'),
      loadClan(),
      loadBrowseClans(),
      loadEvents(),
      loadActivity(),
    ]);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
