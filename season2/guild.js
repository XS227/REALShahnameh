/* ==========================================================================
   REAL Shahnameh — Guild Page (guild.js)
   Dedicated full-page view for a player's clan/guild.
   Uses existing /api/season2/clan/* endpoints.
   ========================================================================== */
(() => {
  'use strict';

  const RT = '<img src="/assets/images/tokens/realtoken.png" alt="REAL" class="real-tok-img" onerror="this.outerHTML=\'◆\'">';

  /* ── Helpers ─────────────────────────────────────────────────────────── */

  const t   = (k, v) => (window.RealI18N && window.RealI18N.t(k, v)) || k;
  const fmtN = (n)   => (window.RealI18N && window.RealI18N.compactNumber)
    ? window.RealI18N.compactNumber(n) : String(Number(n) || 0);
  const fmtNF = (n)  => (window.RealI18N && window.RealI18N.formatNumber)
    ? window.RealI18N.formatNumber(Number(n) || 0) : String(Number(n) || 0);

  const get = (url) =>
    fetch(url, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);

  const post = (url, body) =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    }).then(r => r.ok ? r.json() : null).catch(() => null);

  const tgUser = () => {
    try {
      return (window.Telegram?.WebApp?.initDataUnsafe?.user) || null;
    } catch { return null; }
  };

  const localPlayer = () => {
    try { return JSON.parse(localStorage.getItem('real_player_state_v1') || '{}'); }
    catch { return {}; }
  };

  const showToast = (msg) => {
    const el = document.querySelector('[data-toast]');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2800);
  };

  /* ── Guild tier logic ────────────────────────────────────────────────── */

  const GUILD_TIERS = [
    { min: 0,  label: 'Lone Warrior',      icon: '⚔' },
    { min: 3,  label: 'Warband',            icon: '🛡' },
    { min: 10, label: 'Clan',               icon: '🏹' },
    { min: 25, label: 'War Council',        icon: '🦁' },
    { min: 50, label: "Shah's Vanguard",    icon: '👑' },
  ];

  const tierFor = (memberCount) => {
    let cur = GUILD_TIERS[0];
    for (const t of GUILD_TIERS) if (memberCount >= t.min) cur = t;
    return cur;
  };

  /* ── Tab management ─────────────────────────────────────────────────── */

  const showTab = (name) => {
    document.querySelectorAll('.guild-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.guildTab === name);
    });
    document.querySelectorAll('.guild-panel').forEach(panel => {
      panel.style.display = panel.id === `guild-panel-${name}` ? '' : 'none';
    });
  };

  const wireTabs = () => {
    document.querySelectorAll('.guild-tab').forEach(btn => {
      btn.addEventListener('click', () => showTab(btn.dataset.guildTab));
    });
  };

  /* ── Populate guild hero header ──────────────────────────────────────── */

  const populateHero = (clan, u) => {
    const tier    = tierFor(clan.member_count || 1);
    const initial = clan.clan_name.charAt(0).toUpperCase();
    const isLeader = u && clan.leader_id === String(u.id);

    const badgeEl = document.getElementById('guild-hero-badge');
    if (badgeEl) {
      if (clan.clan_photo) {
        badgeEl.innerHTML = `<img src="${clan.clan_photo}" alt="" onerror="this.outerHTML='${initial}'">`;
      } else {
        badgeEl.textContent = initial;
      }
    }

    const nameEl = document.getElementById('guild-hero-name');
    if (nameEl) nameEl.textContent = clan.clan_name;

    const mottoEl = document.getElementById('guild-hero-motto');
    if (mottoEl) mottoEl.textContent = clan.motto ? `"${clan.motto}"` : '';

    const metaEl = document.getElementById('guild-hero-meta');
    if (metaEl) metaEl.textContent = isLeader ? '⚔ Clan Leader' : 'Member';

    const tierLabelEl = document.getElementById('guild-tier-label');
    if (tierLabelEl) tierLabelEl.textContent = tier.label;

    const tierIconEl = document.querySelector('.guild-tier-icon');
    if (tierIconEl) tierIconEl.textContent = tier.icon;
  };

  /* ── Populate stats strip ────────────────────────────────────────────── */

  const populateStats = (clan, warRank) => {
    const members = clan.member_count || 1;
    const real    = clan.total_real_earned || 0;
    const zar     = clan.total_zar_per_hour || 0;

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    set('gstat-members', fmtNF(members));
    set('gstat-real',    fmtN(real));
    set('gstat-zar',     fmtN(zar));
    set('gstat-rank',    warRank ? `#${fmtNF(warRank)}` : '—');
  };

  /* ── Overview tab ────────────────────────────────────────────────────── */

  const buildOverview = async (clan, u) => {
    const panel = document.getElementById('guild-panel-overview');
    if (!panel) return;

    const isLeader = u && clan.leader_id === String(u.id);
    const tgLink   = clan.telegram_group_link || '';

    const openLink = (url) => {
      if (window.Telegram?.WebApp?.openTelegramLink) window.Telegram.WebApp.openTelegramLink(url);
      else window.open(url, '_blank');
    };

    /* Action row */
    let actionsHtml = `<div class="guild-actions-row">`;
    if (tgLink) actionsHtml += `<button class="secondary-btn" id="guild-chat-btn">💬 Clan Chat</button>`;
    actionsHtml += `<button class="secondary-btn" id="guild-share-btn">📢 Share Clan</button>`;
    if (isLeader) actionsHtml += `<button class="secondary-btn" id="guild-manage-btn">⚙ Manage</button>`;
    actionsHtml += `</div>`;

    panel.innerHTML = `
      ${actionsHtml}
      ${isLeader ? `<div id="guild-manage-panel" style="display:none;"></div>` : ''}
      <div>
        <div class="guild-section-head">
          <h4>${t('guild_overview_members','Members')}</h4>
          <span id="guild-member-count">${fmtNF(clan.member_count || 1)} warriors</span>
        </div>
        <article class="card" style="padding:0 16px;" id="guild-member-list">
          <p class="guild-empty">${t('loading_text','Loading…')}</p>
        </article>
      </div>`;

    /* Wire Chat button */
    document.getElementById('guild-chat-btn')?.addEventListener('click', () => openLink(tgLink));

    /* Wire Share button — also marks the daily invite quest */
    document.getElementById('guild-share-btn')?.addEventListener('click', () => {
      const botUrl   = `https://t.me/shahnameh_bot?start=clan_${clan.clan_id}`;
      const text     = `Join my clan ${clan.clan_name} in Shahnameh! We earn REAL together. ⚔️`;
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(botUrl)}&text=${encodeURIComponent(text)}`;
      if (window.Telegram?.WebApp?.openLink) window.Telegram.WebApp.openLink(shareUrl);
      else window.open(shareUrl, '_blank');
      /* Mark daily invite quest complete */
      const dk = new Date().toISOString().slice(0, 10);
      try { localStorage.setItem('real_quest_invite_' + dk, 'true'); } catch (_) {}
      window.dispatchEvent(new CustomEvent('real:quest:invite'));
      if (window.RealSync) window.RealSync.syncQuest('invite');
    });

    /* Wire Manage button — toggle inline panel */
    if (isLeader) {
      let manageLoaded = false;
      let manageOpen   = false;
      document.getElementById('guild-manage-btn')?.addEventListener('click', () => {
        const panel = document.getElementById('guild-manage-panel');
        if (!panel) return;
        manageOpen = !manageOpen;
        panel.style.display = manageOpen ? '' : 'none';
        document.getElementById('guild-manage-btn').textContent = manageOpen ? '✖ Close' : '⚙ Manage';
        if (manageOpen && !manageLoaded) {
          manageLoaded = true;
          buildManagePanel(clan, String(u.id), panel);
        }
      });
    }

    /* Load member list */
    if (!u || !u.id) return;
    const membersData = await get('/api/season2/clan/members?' + new URLSearchParams({ telegram_id: String(u.id) }));
    const listEl      = document.getElementById('guild-member-list');
    if (!listEl) return;

    const members = (membersData?.status === 1) ? (membersData.members || []) : [];

    if (!members.length) {
      listEl.innerHTML = '<p class="guild-empty">No warriors yet. Share your invite link.</p>';
      return;
    }

    listEl.innerHTML = members.map(m => {
      const name   = m.first_name || t('fallback_username', 'Warrior');
      const init   = name.charAt(0).toUpperCase();
      /* Level is computed from XP — DB field is not reliably updated */
      const level  = Math.max(1, Math.floor((m.xp || 0) / 1000));
      const avatar = m.profile_pic
        ? `<div class="guild-member-avatar"><img src="${m.profile_pic}" alt="" onerror="this.parentElement.textContent='${init}'"></div>`
        : `<div class="guild-member-avatar">${init}</div>`;
      const tag = m.is_leader
        ? `<span class="guild-member-tag guild-tag-leader">Leader</span>`
        : `<span class="guild-member-tag guild-tag-member">⚔ Member</span>`;
      const uid = m.telegram_id ? String(m.telegram_id) : '';
      return `<div class="guild-member-row">
        ${uid ? `<a href="profile.html?uid=${uid}" style="display:contents;">` : ''}
        ${avatar}
        <div class="guild-member-info">
          <div class="guild-member-name">${name}</div>
          <div class="guild-member-sub">LVL ${level} · ${fmtN(m.xp || 0)} XP</div>
        </div>
        ${uid ? `</a>` : ''}
        ${tag}
      </div>`;
    }).join('');
  };

  /* ── Leader manage panel (inline in Overview) ────────────────────────── */

  const buildManagePanel = async (clan, leaderId, container) => {
    container.innerHTML = `
      <div style="margin-bottom:12px;">
        <div class="guild-section-head"><h4>⚙ Clan Settings</h4></div>
        <article class="card" style="padding:14px 16px;">
          <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:3px;">💬 Telegram Group Link</div>
          <div style="font-size:11px;color:var(--muted);margin-bottom:8px;">Share your group link with all clan members.</div>
          <div style="display:flex;gap:8px;">
            <input type="url" id="gm-tg-link" class="guild-contrib-input"
              style="flex:1;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:9px 10px;font-size:12px;"
              placeholder="https://t.me/joinchat/…" value="${(clan.telegram_group_link || '').replace(/"/g,'&quot;')}" />
            <button class="secondary-btn" id="gm-tg-save" style="padding:9px 14px;flex:none;font-size:12px;">Save</button>
          </div>
          <div id="gm-tg-msg" style="font-size:11px;margin-top:5px;min-height:16px;"></div>
        </article>
        <div id="gm-applications-wrap">
          <p class="guild-empty">${t('loading_text','Loading…')}</p>
        </div>
      </div>`;

    /* Save TG link */
    document.getElementById('gm-tg-save')?.addEventListener('click', async () => {
      const link   = document.getElementById('gm-tg-link')?.value.trim() || '';
      const msgEl  = document.getElementById('gm-tg-msg');
      const btn    = document.getElementById('gm-tg-save');
      if (link && !link.startsWith('https://t.me/') && !link.startsWith('https://telegram.me/')) {
        if (msgEl) { msgEl.textContent = 'Must start with https://t.me/…'; msgEl.style.color = 'var(--ember)'; }
        return;
      }
      btn.disabled = true; btn.textContent = '…';
      const res = await post('/api/season2/clan/set-telegram-link', { telegram_id: leaderId, telegram_group_link: link });
      if (res?.status === 1) {
        if (msgEl) { msgEl.textContent = link ? '✓ Saved!' : '✓ Cleared.'; msgEl.style.color = 'var(--gold)'; }
        clan.telegram_group_link = link;
        /* Update chat button visibility */
        const chatBtn = document.getElementById('guild-chat-btn');
        if (chatBtn) { chatBtn.style.display = link ? '' : 'none'; chatBtn.dataset.link = link; }
      } else {
        if (msgEl) { msgEl.textContent = res?.error === 'invalid_link' ? 'Invalid Telegram link.' : 'Could not save.'; msgEl.style.color = 'var(--ember)'; }
      }
      btn.disabled = false; btn.textContent = 'Save';
    });

    /* Load applications */
    const appsWrap = document.getElementById('gm-applications-wrap');
    const appsData = await get('/api/season2/clan/applications?' + new URLSearchParams({ telegram_id: leaderId }));
    if (!appsData || appsData.status !== 1 || !appsWrap) return;

    const apps = appsData.applications || [];
    if (!apps.length) {
      appsWrap.innerHTML = `
        <article class="card" style="padding:14px 16px;margin-top:10px;">
          <div class="guild-section-head" style="margin-bottom:6px;"><h4>Applications</h4></div>
          <p class="guild-empty" style="padding:4px 0;">No pending applications.</p>
        </article>`;
      return;
    }

    const rows = apps.map(a => `
      <div class="guild-member-row" id="gm-app-${a.applicant_id}">
        <div class="guild-member-avatar">${(a.name || 'W').charAt(0).toUpperCase()}</div>
        <div class="guild-member-info">
          <div class="guild-member-name">${a.name || 'Warrior'}</div>
          <div class="guild-member-sub">LVL ${Math.max(1, Math.floor((a.xp || 0) / 1000))} · ${fmtN(a.xp || 0)} XP</div>
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0;">
          <button class="guild-upgrade-btn" style="background:rgba(83,215,156,.12);border-color:rgba(83,215,156,.4);color:#53d79c;"
            data-accept="${a.applicant_id}">✓ Accept</button>
          <button class="guild-upgrade-btn" style="background:rgba(255,80,80,.1);border-color:rgba(255,80,80,.3);color:#ff5050;"
            data-reject="${a.applicant_id}">✗ Reject</button>
        </div>
      </div>`).join('');

    appsWrap.innerHTML = `
      <div class="guild-section-head" style="margin-top:10px;">
        <h4>Applications</h4><span>${apps.length} pending</span>
      </div>
      <article class="card" style="padding:0 16px;">${rows}</article>`;

    appsWrap.querySelectorAll('[data-accept]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.accept;
        btn.disabled = true; btn.textContent = '…';
        const res = await post('/api/season2/clan/accept-application', { telegram_id: leaderId, applicant_id: id });
        if (res?.status === 1) {
          showToast('Warrior accepted!');
          document.getElementById(`gm-app-${id}`)?.remove();
          /* Refresh member list */
          const membersData = await get('/api/season2/clan/members?' + new URLSearchParams({ telegram_id: leaderId }));
          const listEl = document.getElementById('guild-member-list');
          if (listEl && membersData?.status === 1) {
            const count = (membersData.members || []).length;
            const countEl = document.getElementById('guild-member-count');
            if (countEl) countEl.textContent = `${fmtNF(count)} warriors`;
            listEl.innerHTML = (membersData.members || []).map(m => {
              const name  = m.first_name || 'Warrior';
              const init  = name.charAt(0).toUpperCase();
              const level = Math.max(1, Math.floor((m.xp || 0) / 1000));
              const avatar = m.profile_pic
                ? `<div class="guild-member-avatar"><img src="${m.profile_pic}" alt="" onerror="this.parentElement.textContent='${init}'"></div>`
                : `<div class="guild-member-avatar">${init}</div>`;
              const tag = m.is_leader
                ? `<span class="guild-member-tag guild-tag-leader">Leader</span>`
                : `<span class="guild-member-tag guild-tag-member">⚔ Member</span>`;
              const uid = m.telegram_id ? String(m.telegram_id) : '';
              return `<div class="guild-member-row">
                ${uid ? `<a href="profile.html?uid=${uid}" style="display:contents;">` : ''}
                ${avatar}
                <div class="guild-member-info">
                  <div class="guild-member-name">${name}</div>
                  <div class="guild-member-sub">LVL ${level} · ${fmtN(m.xp || 0)} XP</div>
                </div>
                ${uid ? `</a>` : ''}
                ${tag}
              </div>`;
            }).join('');
          }
        } else {
          const msg = { clan_full: 'Clan is full.', applicant_already_in_clan: 'Already in a clan.' }[res?.error] || 'Could not accept.';
          showToast(msg);
          btn.disabled = false; btn.textContent = '✓ Accept';
        }
      });
    });

    appsWrap.querySelectorAll('[data-reject]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.reject;
        btn.disabled = true; btn.textContent = '…';
        const res = await post('/api/season2/clan/reject-application', { telegram_id: leaderId, applicant_id: id });
        if (res?.status === 1) {
          showToast('Application rejected.');
          document.getElementById(`gm-app-${id}`)?.remove();
        } else {
          showToast('Could not reject. Try again.');
          btn.disabled = false; btn.textContent = '✗ Reject';
        }
      });
    });
  };

  /* ── Treasury tab ────────────────────────────────────────────────────── */

  const UPGRADES = [
    { id: 'forge',    icon: '⚒',  name: 'War Forge',       desc: '+5% ZAR/hr for all members',   cost: 25000  },
    { id: 'banner',   icon: '🏹',  name: 'Battle Banner',   desc: '+10% hero XP gain',             cost: 50000  },
    { id: 'vault',    icon: '🏛',  name: 'Royal Vault',     desc: 'Treasury cap ×2',               cost: 100000 },
    { id: 'siege',    icon: '🛡',  name: 'Siege Engines',   desc: '+15% in guild wars',            cost: 200000 },
  ];

  const buildTreasury = (clan) => {
    const panel    = document.getElementById('guild-panel-treasury');
    if (!panel) return;

    const treasury = clan.treasury || 0;

    const upgradesHtml = UPGRADES.map(u => {
      const canAfford = treasury >= u.cost;
      return `
        <div class="guild-upgrade-card">
          <div class="guild-upgrade-icon">${u.icon}</div>
          <div class="guild-upgrade-info">
            <div class="guild-upgrade-name">${u.name}</div>
            <div class="guild-upgrade-desc">${u.desc}</div>
            <div class="guild-upgrade-cost">${fmtN(u.cost)} ${RT} required</div>
          </div>
          <button class="guild-upgrade-btn" disabled>${canAfford ? 'Unlock' : 'Locked'}</button>
        </div>`;
    }).join('');

    panel.innerHTML = `
      <div class="guild-treasury-banner">
        <div class="guild-treasury-icon">🏦</div>
        <div class="guild-treasury-amount">${fmtN(treasury)} ${RT}</div>
        <div class="guild-treasury-unit">REAL</div>
        <div class="guild-treasury-sub">${t('guild_treasury_sub','Pooled by all guild members')}</div>
      </div>
      <button class="primary-btn btn-block" id="guild-contrib-open-btn">
        ${t('guild_treasury_contribute','Contribute REAL')}
      </button>
      <div>
        <div class="guild-section-head">
          <h4>Guild Upgrades</h4>
          <span>Coming Soon</span>
        </div>
        ${upgradesHtml}
      </div>`;

    document.getElementById('guild-contrib-open-btn')?.addEventListener('click', openContribModal);
  };

  /* ── Quests tab ──────────────────────────────────────────────────────── */

  const buildQuests = (clan) => {
    const panel = document.getElementById('guild-panel-quests');
    if (!panel) return;

    /* Member count drives collective progress on weekly quests */
    const members = clan.member_count || 1;

    const weeklyQuests = [
      {
        icon: '📜',
        title: 'Chapter Readers',
        desc: 'Guild members complete chapters this week',
        target: 50,
        progress: Math.min(50, members * 2),
        reward: '5,000 REAL each',
      },
      {
        icon: '⚔',
        title: 'Warriors Recruited',
        desc: 'Grow the clan by inviting new warriors',
        target: 10,
        progress: Math.min(10, Math.max(0, members - 1)),
        reward: '2,500 REAL each',
      },
      {
        icon: '💎',
        title: 'Gem Tithe',
        desc: 'Clan members earn gems through heroes',
        target: 100,
        progress: Math.min(100, members * 4),
        reward: '1,000 REAL each',
      },
    ];

    const cardsHtml = weeklyQuests.map(q => {
      const pct = Math.round((q.progress / q.target) * 100);
      return `
        <div class="guild-quest-card">
          <div class="guild-quest-header">
            <div class="guild-quest-icon">${q.icon}</div>
            <div class="guild-quest-title">${q.title}</div>
            <div class="guild-quest-reward">+${q.reward}</div>
          </div>
          <div class="guild-quest-progress-wrap">
            <div class="guild-quest-progress-fill" style="width:${pct}%;"></div>
          </div>
          <div class="guild-quest-meta">
            <span>${q.desc}</span>
            <span>${fmtNF(q.progress)} / ${fmtNF(q.target)}</span>
          </div>
        </div>`;
    }).join('');

    panel.innerHTML = `
      <div class="guild-section-head">
        <h4>${t('guild_quest_weekly','Weekly Guild Quests')}</h4>
        <span>Resets Sunday</span>
      </div>
      ${cardsHtml}
      <p class="guild-empty" style="margin-top:8px;font-size:11px;">Daily tasks and seasonal campaigns — coming soon.</p>`;
  };

  /* ── Wars tab ────────────────────────────────────────────────────────── */

  const buildWars = (myClanId, data) => {
    const panel = document.getElementById('guild-panel-wars');
    if (!panel) return;

    if (!data || data.status !== 1 || !(data.clans || []).length) {
      panel.innerHTML = `
        <div class="guild-wars-coming">
          <div class="guild-wars-coming-icon">⚔</div>
          <div class="guild-wars-coming-title">${t('guild_wars_standings','War Standings')}</div>
          <p>${t('guild_wars_live','Wars coming soon — stay tuned!')}</p>
        </div>`;
      return;
    }

    const rows = data.clans.map((c, i) => {
      const isMe   = c.clan_id === myClanId;
      const badge  = c.clan_photo
        ? `<div class="guild-war-badge"><img src="${c.clan_photo}" alt="" onerror="this.parentElement.textContent='${c.clan_name.charAt(0)}'"></div>`
        : `<div class="guild-war-badge">${c.clan_name.charAt(0).toUpperCase()}</div>`;
      const rankCls = ['guild-war-rank-1','guild-war-rank-2','guild-war-rank-3'][i] || '';
      return `
        <div class="guild-war-row${isMe ? ' guild-war-you' : ''}">
          <div class="guild-war-rank ${rankCls}">${i + 1}</div>
          ${badge}
          <div class="guild-war-info">
            <div class="guild-war-name">${c.clan_name}${isMe ? ' ⚔' : ''}</div>
            <div class="guild-war-sub">👥 ${c.member_count || 1} warriors</div>
          </div>
          <div class="guild-war-score">${fmtN(c.total_real_earned)} ${RT}</div>
        </div>`;
    }).join('');

    panel.innerHTML = `
      <div class="guild-section-head">
        <h4>${t('guild_wars_standings','War Standings')}</h4>
        <span>by REAL earned</span>
      </div>
      <article class="card" style="padding:0 16px;">${rows}</article>
      <p class="guild-empty" style="font-size:11px;margin-top:4px;">Live guild battles — coming soon.</p>`;
  };

  /* ── No-clan state ───────────────────────────────────────────────────── */

  const showNoClan = () => {
    document.getElementById('guild-loading').style.display   = 'none';
    document.getElementById('guild-main').style.display      = 'none';
    document.getElementById('guild-no-clan').style.display   = '';

    const bodyEl = document.getElementById('guild-no-clan-body');
    if (!bodyEl) return;

    bodyEl.innerHTML = `
      <article class="card" style="text-align:center;padding:24px 16px;margin:0;">
        <div style="font-size:48px;margin-bottom:12px;">⚔</div>
        <p style="color:var(--muted);font-size:13px;margin:0 0 20px;">
          ${t('guild_no_clan_sub','Join or found a guild to march together.')}
        </p>
        <div class="guild-no-clan-cta">
          <a href="social.html" class="primary-btn btn-block" style="text-align:center;text-decoration:none;">
            ${t('guild_no_clan_join','Browse Guilds')}
          </a>
          <a href="social.html#create" class="secondary-btn btn-block" style="text-align:center;text-decoration:none;">
            ${t('guild_no_clan_create','Found Your Own')}
          </a>
        </div>
      </article>`;
  };

  /* ── Contribute modal ────────────────────────────────────────────────── */

  let _clanId = null;

  const openContribModal = () => {
    const modal  = document.getElementById('contrib-modal');
    const balEl  = document.getElementById('contrib-balance');
    const inp    = document.getElementById('contrib-amount');
    if (!modal) return;

    const bal = localPlayer().balance || 0;
    if (balEl) balEl.textContent = `Your balance: ${fmtN(bal)} REAL`;
    if (inp)   inp.value = '';
    document.querySelectorAll('.guild-amount-btn').forEach(b => b.classList.remove('active'));

    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    inp?.focus();
  };

  const closeContribModal = () => {
    const modal = document.getElementById('contrib-modal');
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.getElementById('contrib-amount').value = '';
    document.querySelectorAll('.guild-amount-btn').forEach(b => b.classList.remove('active'));
  };

  const wireContribModal = () => {
    document.getElementById('contrib-modal-close')?.addEventListener('click', closeContribModal);

    const overlay = document.getElementById('contrib-modal');
    overlay?.addEventListener('click', (e) => { if (e.target === overlay) closeContribModal(); });

    document.querySelectorAll('.guild-amount-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.guild-amount-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const inp = document.getElementById('contrib-amount');
        if (inp) inp.value = btn.dataset.amount;
      });
    });

    document.getElementById('contrib-confirm-btn')?.addEventListener('click', async () => {
      const u      = tgUser();
      const inp    = document.getElementById('contrib-amount');
      const amount = Math.floor(Number(inp?.value || 0));
      const btn    = document.getElementById('contrib-confirm-btn');

      if (!u || !u.id) {
        closeContribModal();
        showToast('Open via Telegram to contribute.');
        return;
      }
      if (!amount || amount < 100) {
        closeContribModal();
        showToast('Minimum contribution: 100 REAL.');
        return;
      }

      btn.disabled = true;
      btn.textContent = '…';

      const res = await post('/api/season2/clan/contribute', {
        telegram_id: String(u.id),
        amount,
      });

      /* Close modal first so the toast is always visible */
      closeContribModal();

      if (res && res.status === 1) {
        /* Update local balance */
        try {
          const ps = JSON.parse(localStorage.getItem('real_player_state_v1') || '{}');
          ps.balance = res.new_balance;
          localStorage.setItem('real_player_state_v1', JSON.stringify(ps));
          window.dispatchEvent(new CustomEvent('shahnama:state_sync'));
        } catch (_) {}

        showToast(`✓ Contributed ${fmtN(amount)} REAL to the treasury!`);

        /* Refresh treasury display */
        const tp    = document.getElementById('guild-panel-treasury');
        const amtEl = tp?.querySelector('.guild-treasury-amount');
        if (amtEl) {
          const cd = await get('/api/season2/clan/my-clan?' + new URLSearchParams({ telegram_id: String(u.id) }));
          if (cd?.status === 1 && cd.clan) {
            amtEl.innerHTML = `${fmtN(cd.clan.treasury || 0)} ${RT}`;
          }
        }
      } else {
        const msg = {
          insufficient_balance: 'Not enough REAL in your balance.',
          not_in_clan:          'You are not in a clan.',
          minimum_100:          'Minimum is 100 REAL.',
        }[res?.error] || 'Failed to contribute. Try again.';
        showToast(msg);
      }
    });
  };

  /* ── Init ────────────────────────────────────────────────────────────── */

  const init = async () => {
    document.getElementById('guild-loading').style.display  = '';
    document.getElementById('guild-main').style.display     = 'none';
    document.getElementById('guild-no-clan').style.display  = 'none';

    try {
      const u = tgUser();

      if (!u || !u.id) {
        const cachedClanId = localStorage.getItem('real_my_clan_id') || '';
        if (!cachedClanId) { showNoClan(); return; }
      }

      const clanData = u
        ? await get('/api/season2/clan/my-clan?' + new URLSearchParams({ telegram_id: String(u.id) }))
        : null;

      const clan = (clanData?.status === 1) ? clanData.clan : null;

      if (!clan) {
        try { localStorage.setItem('real_my_clan_id', ''); } catch (_) {}
        showNoClan();
        return;
      }

      try {
        localStorage.setItem('real_my_clan_id', clan.clan_id);
        localStorage.setItem('real_has_clan', '1');
      } catch (_) {}

      _clanId = clan.clan_id;

      /* Show the guild view immediately — don't wait for secondary fetches */
      document.getElementById('guild-loading').style.display = 'none';
      document.getElementById('guild-main').style.display    = '';

      populateHero(clan, u);
      populateStats(clan, null);   /* war rank filled in below */
      wireTabs();
      wireContribModal();
      buildTreasury(clan);
      buildQuests(clan);
      buildOverview(clan, u);      /* async, self-contained */
      showTab('overview');

      /* Load war rank + wars tab in the background */
      const browseData = await get('/api/season2/clan/browse');
      if (browseData?.status === 1) {
        const idx = (browseData.clans || []).findIndex(c => c.clan_id === clan.clan_id);
        const warRank = idx >= 0 ? idx + 1 : null;
        populateStats(clan, warRank);
        buildWars(clan.clan_id, browseData);
      }

    } catch (err) {
      console.error('[guild] init error', err);
      /* Show no-clan rather than staying stuck on loading */
      showNoClan();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
