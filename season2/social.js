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
    const container  = document.getElementById('browse-clans');
    const headEl     = document.getElementById('browse-clans-head');
    if (!container) return;

    if (!force && _browseClansDone) return;
    _browseClansDone = true;

    container.innerHTML = '<p class="clan-empty" style="padding:12px 0;">Loading clans…</p>';

    const data = await get('/api/season2/clan/browse');

    if (!data || data.status !== 1 || !(data.clans || []).length) {
      container.innerHTML = '<p class="clan-empty">No clans yet — be the first to found one!</p>';
      if (headEl) headEl.style.display = '';
      return;
    }

    if (headEl) headEl.style.display = '';

    const u        = tgUser();
    const myId     = u ? String(u.id) : null;
    const myClanId = (() => { try { return localStorage.getItem('real_my_clan_id') || ''; } catch { return ''; } })();

    const rows = data.clans.map((c, i) => {
      const isOwn    = myId && c.clan_id === myClanId;
      const inAClan  = !!(myClanId);
      const members  = c.member_count || 1;
      const rankCls  = ['clan-rank-1', 'clan-rank-2', 'clan-rank-3'][i] || '';

      let actionBtn = '';
      if (isOwn) {
        actionBtn = `<span class="clan-browse-badge mine">Your Clan</span>`;
      } else if (inAClan) {
        actionBtn = `<span class="clan-browse-badge taken">Joined</span>`;
      } else {
        actionBtn = `<button class="secondary-btn clan-apply-btn" data-clan-id="${c.clan_id}" data-clan-name="${c.clan_name.replace(/"/g, '&quot;')}">Apply</button>`;
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
          btn.textContent = 'Applied ✓';
          btn.classList.add('clan-browse-badge');
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
      clanEl.innerHTML += `
        <article class="card">
          <p class="clan-empty">No warriors yet. Share your invite link to grow your clan.</p>
        </article>`;
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
    clanEl.innerHTML += `
      <article class="card lb-list clan-list" style="margin-top:0;">${rows}</article>`;
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
          <p class="clan-empty">No pending applications.</p>
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

      const openLink = (url) => {
        if (window.Telegram && window.Telegram.WebApp && url.startsWith('https://t.me/')) {
          window.Telegram.WebApp.openTelegramLink(url);
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
              data-name="${myClan.clan_name.replace(/"/g,'&quot;')}">📢 Share Clan</button>
          </div>
          ${isLeader ? '<button class="secondary-btn" id="manage-clan-btn" style="margin-top:10px;width:100%;">⚔ Manage Clan</button>' : ''}
        </article>`;

      /* Wire Join Chat */
      document.getElementById('clan-join-chat-btn')?.addEventListener('click', (e) => {
        const link = e.currentTarget.dataset.link;
        if (link) openLink(link);
      });

      /* Wire Share */
      document.getElementById('clan-share-btn')?.addEventListener('click', (e) => {
        const name     = e.currentTarget.dataset.name;
        const text     = `Bli med i min klan ${name} i Shahnameh! Vi tjener REAL sammen. ⚔️`;
        const shareUrl = `https://t.me/share/url?url=https%3A%2F%2Ft.me%2Frealshahnamehbot&text=${encodeURIComponent(text)}`;
        openLink(shareUrl);
      });

      /* Leader Dashboard — lazy-loaded on button click */
      if (isLeader) {
        const manageClanEl = document.createElement('div');
        manageClanEl.id = 'leader-dashboard';
        clanEl.appendChild(manageClanEl);

        document.getElementById('manage-clan-btn')?.addEventListener('click', () => {
          loadLeaderDashboard(String(u.id), myClan.clan_id, manageClanEl, tgLink);
        });
      }

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

    document.getElementById('browse-clans-refresh')?.addEventListener('click', (e) => {
      e.preventDefault();
      _browseClansDone = false;
      loadBrowseClans(true);
    });

    await Promise.all([
      loadLb('earners'),
      loadClan(),
      loadBrowseClans(),
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
