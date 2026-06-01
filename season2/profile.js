/* ==========================================================================
   REAL Shahnameh — Season 2 Profile Page (profile.js)
   All data fetched from /api/season2/user/me — no hardcoding.
   Live updates: balanceUpdate + shahnama:state_sync → instant re-render.
   Server re-fetch: every 30 s → catches streak, referrals, clan changes.
   ========================================================================== */
(function () {
  'use strict';

  /* ── Module state ── */
  let _serverUser = null;   // latest /user/me response
  let _clanData   = null;   // latest /clan/my-clan response
  let _tg         = null;   // Telegram user object
  let _isS1       = false;  // Season 1 Founder status (fetched from legacy API)

  const tgUser = () => {
    try {
      return (window.Telegram && window.Telegram.WebApp
        && window.Telegram.WebApp.initDataUnsafe
        && window.Telegram.WebApp.initDataUnsafe.user) || null;
    } catch (_) { return null; }
  };

  const t  = (k, v) => (window.RealI18N && window.RealI18N.t)  ? window.RealI18N.t(k, v)  : k;
  const pd = (s)    => (window.RealI18N && window.RealI18N.toPersianDigits)
                         ? window.RealI18N.toPersianDigits(String(s)) : String(s);
  const isFa = ()   => (window.RealI18N && window.RealI18N.getLang) ? window.RealI18N.getLang() === 'fa' : false;

  const fmtN = (n) =>
    (window.RealI18N && window.RealI18N.compactNumber)
      ? window.RealI18N.compactNumber(n)
      : (Number(n) || 0).toLocaleString();

  const fmtZar = (n) => {
    n = Number(n) || 0;
    let s;
    if (n >= 1_000_000) s = (n / 1_000_000).toFixed(2) + 'M';
    else if (n >= 1_000) s = (n / 1_000).toFixed(2) + 'K';
    else s = n.toFixed(2);
    return isFa() ? pd(s) : s;
  };

  const apiGet = (url) =>
    fetch(url, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null);

  /* ── Merge server data with live Player state ─────────────────────────── */
  const mergeUser = () => {
    const u = _serverUser || {};
    const p = (window.RealPlayer && window.RealPlayer.get) ? window.RealPlayer.get() : {};
    return {
      ...u,
      xp:      Math.max(u.xp      || 0, p.xp      || 0),
      farr:    Math.max(u.farr    || 0, p.farr    || 0),
      gems:    Math.max(u.gems    || 0, p.gems    || 0),
      balance: Math.max(u.real_balance || 0, p.balance || 0),
      // Derive level from XP (same formula as home.js) — DB 'level' field
      // is initialized to 1 at signup and never updated from XP changes.
      level:         Math.max(1, Math.floor(Math.max(u.xp || 0, p.xp || 0) / 1000)),
      daily_streak:  u.daily_streak            || p.dailyStreak || 1,
      verified_referral_count: u.verified_referral_count || 0,
    };
  };

  /* ── REAL token image helper ──────────────────────────────────────────── */
  const REAL_IMG = '<img src="/assets/images/tokens/realtoken.png" alt="REAL" class="real-tok-img" style="width:14px;height:14px;vertical-align:middle;" onerror="this.outerHTML=\'◆\'">';

  /* ── Achievements ─────────────────────────────────────────────────────── */
  const ACHIEVEMENTS = [
    { id: 'first_strike',  icon: '⚡',  nameKey: 'ach_first_strike_name', descKey: 'ach_first_strike_desc', check: u => (u.xp || 0) > 0 },
    { id: 'season1',       icon: '🏛',  nameKey: 'ach_s1_name',           descKey: 'ach_s1_desc',           check: _u => _isS1 },
    { id: 'clan_founder',  icon: '🛡',  nameKey: 'ach_clan_founder_name', descKey: 'ach_clan_founder_desc', check: _u => !!(_clanData && (_clanData.member_count || 0) >= 3) },
    { id: 'daily_champ',   icon: '🔥',  nameKey: 'ach_7day_name',         descKey: 'ach_7day_desc',         check: u => (u.daily_streak || 0) >= 7 },
    { id: 'check_in',      icon: '📅',  nameKey: 'ach_chronicle_name',    descKey: 'ach_chronicle_desc',    check: u => !!(u.last_checkin_date) },
    { id: 'rich_warrior',  icon: null,  nameKey: 'ach_rich_name',         descKey: 'ach_rich_desc',
      tokenImg: '/assets/images/tokens/realtoken.png',
      check: u => Math.max(u.max_real_balance || 0, u.balance || u.real_balance || 0) >= 1_000_000 },
    { id: 'legend',        icon: '👑',  nameKey: 'ach_legend_name',       descKey: 'ach_legend_desc',       check: u => Math.floor((u.xp || 0) / 1000) >= 10 },
  ];

  /* ── Renderers ────────────────────────────────────────────────────────── */

  const renderIdentity = (u, tg) => {
    const avatarEl   = document.getElementById('profile-avatar');
    const nameEl     = document.getElementById('profile-name');
    const usernameEl = document.getElementById('profile-username');
    const pathTagEl  = document.getElementById('profile-path-tag');
    const pathPill   = document.getElementById('path-pill');
    const trustBadge = document.getElementById('trustai-badge');

    const displayName = u.first_name
      ? (u.first_name + (u.last_name ? ' ' + u.last_name : ''))
      : (u.username ? '@' + u.username : t('fallback_username', 'Warrior'));

    if (nameEl)     nameEl.textContent = displayName;
    if (usernameEl) usernameEl.textContent = u.username ? '@' + u.username : '';
    if (trustBadge) trustBadge.style.display = (u.verified_referral_count || 0) > 0 ? 'inline-flex' : 'none';

    const showFallbackAvatar = () => {
      const fallbackSrc = window.RealUtils && window.RealUtils.getAvatarFallback
        ? window.RealUtils.getAvatarFallback(u.path) : null;
      if (fallbackSrc && avatarEl) {
        const fb = document.createElement('img');
        fb.src = fallbackSrc;
        fb.alt = displayName;
        fb.onerror = () => { fb.remove(); if (avatarEl) avatarEl.textContent = displayName.charAt(0).toUpperCase(); };
        avatarEl.innerHTML = '';
        avatarEl.appendChild(fb);
      } else if (avatarEl) {
        avatarEl.textContent = displayName.charAt(0).toUpperCase();
      }
    };

    if (avatarEl) {
      const pic = u.profile_pic || (tg && tg.photo_url) || '';
      if (pic) {
        const img = document.createElement('img');
        img.src = pic;
        img.alt = displayName;
        img.onerror = () => { img.remove(); showFallbackAvatar(); };
        avatarEl.innerHTML = '';
        avatarEl.appendChild(img);
      } else {
        showFallbackAvatar();
      }
    }

    const path = u.path || 'hero';
    const pathLabel = path === 'heroine' ? t('path_heroine_lbl') : t('path_hero_lbl');
    const pathClass = path === 'heroine' ? 'heroine' : 'hero';
    if (pathTagEl) { pathTagEl.textContent = pathLabel; pathTagEl.className = 'profile-path-tag ' + pathClass; pathTagEl.style.display = 'inline-flex'; }
    if (pathPill)  { pathPill.textContent = pathLabel;  pathPill.style.display = ''; }
  };

  const renderBalanceCard = (u) => {
    const amountEl = document.getElementById('rbc-amount');
    const bonusEl  = document.getElementById('rbc-clan-bonus');
    if (amountEl) amountEl.innerHTML = fmtN(u.balance || u.real_balance || 0) + ' ' + REAL_IMG + ' REAL';
    if (bonusEl)  bonusEl.style.display = (u.clan_id || (_clanData && _clanData.clan_id)) ? '' : 'none';
  };

  const renderStats = (u) => {
    const el = document.getElementById('stats-grid');
    if (!el) return;
    const inClan = !!(u.clan_id || (_clanData && _clanData.clan_id));
    const xp     = u.xp || 0;
    /* Level is derived from XP — DB 'level' field is never updated from XP */
    const level  = Math.max(1, Math.floor(xp / 1000));
    const streak = u.daily_streak || 1;
    const refs   = u.verified_referral_count || 0;
    const stats = [
      { ico: '⭐', lbl: t('stat_xp_lbl'),      val: fmtN(xp),    bonus: inClan ? t('stat_clan_bonus_tag') : null },
      { ico: '🏆', lbl: t('stat_level_lbl'),    val: t('stat_level_val', { n: isFa() ? pd(level) : level }), bonus: null },
      { ico: '🔥', lbl: t('stat_daily_lbl'),    val: t('stat_daily_val', { n: isFa() ? pd(streak) : streak }), bonus: null },
      { ico: '👥', lbl: t('stat_warriors_lbl'), val: isFa() ? pd(refs) : String(refs), bonus: null },
    ];
    el.innerHTML = stats.map(s => `
      <div class="stat-card">
        <span class="stat-ico">${s.ico}</span>
        <span class="stat-val">${s.val}</span>
        <span class="stat-lbl">${s.lbl}</span>
        ${s.bonus ? `<span class="stat-clan-bonus">${s.bonus}</span>` : ''}
      </div>`).join('');
  };

  const renderBadges = (u) => {
    const el = document.getElementById('badge-grid');
    if (!el) return;
    el.innerHTML = ACHIEVEMENTS.map(a => {
      const earned = a.check(u);
      const icoHtml = a.tokenImg
        ? `<img src="${a.tokenImg}" class="badge-token-img" alt="REAL" onerror="this.style.display='none'" />`
        : a.icon;
      return `
        <div class="badge-card ${earned ? 'earned' : 'locked-badge'}">
          <div class="badge-ico-wrap">${icoHtml}</div>
          <div>
            <div class="badge-name">${t(a.nameKey)}</div>
            <div class="badge-desc">${t(a.descKey)}</div>
            ${earned ? `<div class="badge-earned-tag">${t('ach_earned_tag')}</div>` : ''}
          </div>
        </div>`;
    }).join('');
  };

  /* ── Clan photo upload — standalone handler, survives re-renders ─────── */
  /* Uses a persistent <input> appended once to body so it is never
     replaced when renderClan() re-renders the clan card HTML. */
  let _clanUploadInput = null;

  const getClanUploadInput = () => {
    if (!_clanUploadInput) {
      _clanUploadInput = document.createElement('input');
      _clanUploadInput.type = 'file';
      _clanUploadInput.accept = 'image/*';
      _clanUploadInput.style.cssText = 'position:fixed;left:-9999px;opacity:0;';
      _clanUploadInput.id = 'clan-photo-input-persistent';
      document.body.appendChild(_clanUploadInput);

      _clanUploadInput.addEventListener('change', async () => {
        const file = _clanUploadInput.files && _clanUploadInput.files[0];
        _clanUploadInput.value = ''; // reset so same file can be reselected
        if (!file) return;

        const myId = String((_serverUser && _serverUser.telegram_id) || (_tg && _tg.id) || '');
        if (!myId) { _showToast('Could not identify user. Open via Telegram.'); return; }

        /* Show loading state on the upload button */
        const uploadLabel = document.getElementById('clan-upload-label');
        if (uploadLabel) { uploadLabel.textContent = '⏳'; uploadLabel.style.pointerEvents = 'none'; }

        try {
          const fd = new FormData();
          fd.append('photo', file);
          fd.append('telegram_id', myId);

          const r = await fetch('/api/season2/clan/upload-photo', { method: 'POST', body: fd });
          const d = await r.json();

          if (d.status === 1 && d.url) {
            _clanData = { ..._clanData, clan_photo: d.url };
            renderClan(_clanData);
            _showToast('✓ Clan photo updated!');
          } else {
            _showToast(d.error === 'not_leader' ? 'Only the clan leader can change the photo.'
                     : d.error === 'not_in_clan' ? 'You must be in a clan first.'
                     : `Upload failed: ${d.error || 'unknown error'}`);
            if (uploadLabel) { uploadLabel.textContent = '📷'; uploadLabel.style.pointerEvents = ''; }
          }
        } catch (err) {
          _showToast('Network error — could not upload photo.');
          if (uploadLabel) { uploadLabel.textContent = '📷'; uploadLabel.style.pointerEvents = ''; }
        }
      });
    }
    return _clanUploadInput;
  };

  const _showToast = (msg) => {
    const el = document.querySelector('[data-toast]');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(_showToast._t);
    _showToast._t = setTimeout(() => el.classList.remove('show'), 3000);
  };

  const renderClan = (clan, opts = {}) => {
    const el = document.getElementById('profile-clan-card');
    if (!el) return;

    if (!clan) {
      el.className = 'card clan-cta-card';
      if (opts.isVisitor) {
        el.innerHTML = `
          <div class="clan-cta-left">
            <div class="clan-cta-ico">⚔</div>
            <div>
              <div class="clan-cta-title" style="font-size:13px;color:var(--muted);">${t('no_clan_yet', 'Not a member of any clan yet')}</div>
            </div>
          </div>
          ${opts.inviteBtn || ''}`;
      } else {
        el.innerHTML = `
          <div class="clan-cta-left">
            <div class="clan-cta-ico">⚔</div>
            <div>
              <div class="clan-cta-title">${t('found_clan_title')}</div>
              <div class="clan-cta-sub">${t('clan_no_clan_sub')}</div>
            </div>
          </div>
          <a href="social.html#clan" class="clan-btn clan-btn-apply" style="text-decoration:none;">⚔ ${t('your_clan_header')}</a>`;
      }
      return;
    }

    const myId      = String((_serverUser && _serverUser.telegram_id) || (_tg && _tg.id) || '');
    const isLeader  = !!(clan.leader_id && myId && clan.leader_id === myId);
    const memberCount = clan.member_count || 1;
    const zarHr     = clan.total_zar_per_hour || 0;
    const earned    = clan.total_real_earned  || 0;
    const photoSrc  = clan.clan_photo || '';

    const photoHtml = photoSrc
      ? `<img src="${escHtml(photoSrc)}" class="clan-photo-img" alt="" onerror="this.style.display='none'">`
      : `<div class="clan-badge-large">${clan.clan_name.charAt(0).toUpperCase()}</div>`;

    /* Upload button triggers the persistent input (not replaced on re-render) */
    const uploadBtn = isLeader
      ? `<label id="clan-upload-label" class="clan-photo-upload-btn"
           title="${t('clan_photo_upload_lbl')}" style="cursor:pointer;">📷</label>`
      : '';

    el.className = 'card clan-founded-card';
    el.innerHTML = `
      <div class="clan-founded-header">
        <div class="clan-avatar-wrap" style="position:relative;flex-shrink:0;">
          ${photoHtml}
          ${uploadBtn}
        </div>
        <div style="flex:1;min-width:0;">
          <div class="clan-founded-name">${escHtml(clan.clan_name)}</div>
          ${clan.motto ? `<div class="clan-founded-motto">${escHtml(clan.motto)}</div>` : ''}
          ${isLeader ? `<span class="clan-tag" style="margin-top:4px;display:inline-block;">👑 ${t('clan_leader_tag')}</span>` : ''}
        </div>
      </div>
      <div class="clan-founded-stats" style="margin-top:10px;">
        <div class="clan-stat-item">
          <span class="clan-stat-ico">👥</span>
          <span class="clan-stat-val">${isFa() ? pd(memberCount) : memberCount}</span>
          <span class="clan-stat-lbl">${t('clan_members_lbl')}</span>
        </div>
        <div class="clan-stat-item">
          <span class="clan-stat-ico">🪙</span>
          <span class="clan-stat-val">${fmtZar(zarHr)}</span>
          <span class="clan-stat-lbl">${t('r_zar')}/hr</span>
        </div>
        <div class="clan-stat-item">
          <span class="clan-stat-ico">${REAL_IMG}</span>
          <span class="clan-stat-val">${fmtN(earned)}</span>
          <span class="clan-stat-lbl">${t('clan_earned_lbl')}</span>
        </div>
      </div>
      <a href="social.html#clan" class="clan-btn clan-btn-manage btn-block" style="margin-top:12px;text-decoration:none;">
        ⚔ ${t('your_clan_header')} →
      </a>`;

    /* Wire the upload label to trigger the persistent input element */
    if (isLeader) {
      const label = el.querySelector('#clan-upload-label');
      if (label) {
        label.addEventListener('click', (e) => {
          e.preventDefault();
          getClanUploadInput().click();
        });
      }
    }
  };

  const escHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, m =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[m]);

  /* ── renderAll — single entry point used by live refresh ─────────────── */
  const renderAll = () => {
    const u = mergeUser();
    renderBalanceCard(u);
    renderStats(u);
    renderBadges(u);
    renderClan(_clanData, {});
  };

  /* ── Mining counter ───────────────────────────────────────────────────── */
  let _zarTimer = null;

  const startMiningCounter = (mining) => {
    if (_zarTimer) clearInterval(_zarTimer);
    const zarLiveEl = document.getElementById('em-zar-live');
    const rateMinEl = document.getElementById('em-rate-min');
    const rateHrEl  = document.getElementById('em-rate-hr');
    const payoutEl  = document.getElementById('em-payout');

    const zarPerMin = mining.zar_per_minute || 0;
    const zarPerHr  = mining.zar_per_hour   || 0;
    if (rateMinEl) rateMinEl.textContent = fmtZar(zarPerMin) + ' ' + t('unit_zar');
    if (rateHrEl)  rateHrEl.textContent  = fmtZar(zarPerHr)  + ' ' + t('unit_zar');

    const updatePayout = () => {
      if (!payoutEl) return;
      const now  = new Date();
      const next = new Date(now);
      next.setHours(next.getHours() + 1, 0, 0, 0);
      const diffMs  = next - now;
      const diffMin = Math.floor(diffMs / 60000);
      const diffSec = Math.floor((diffMs % 60000) / 1000);
      payoutEl.textContent = t('payout_fmt', {
        m: isFa() ? pd(diffMin)   : diffMin,
        s: isFa() ? pd(String(diffSec).padStart(2, '0')) : String(diffSec).padStart(2, '0'),
      });
    };

    let currentZar = mining.total_zar || 0;
    const zarPerSec = zarPerMin / 60;
    let lastTick = Date.now();

    const tick = () => {
      const now = Date.now();
      currentZar += zarPerSec * (now - lastTick) / 1000;
      lastTick = now;
      if (zarLiveEl) zarLiveEl.textContent = fmtZar(currentZar) + ' ' + t('unit_zar');
      updatePayout();
    };

    tick();
    _zarTimer = setInterval(tick, 1000);
  };

  /* ── Inviter attribution ──────────────────────────────────────────────── */
  const renderInviter = () => {
    const el = document.getElementById('profile-inviter');
    if (!el) return;
    try {
      const name = localStorage.getItem('real_inviter_name');
      const id   = localStorage.getItem('real_inviter_id');
      if (name || id) {
        const label = t('invited_by_label') || 'Invited by';
        el.textContent = `${label}: ${name || ('Warrior #' + id)}`;
        el.style.display = '';
      }
    } catch {}
  };

  /* ── Clan invites inbox ──────────────────────────────────────────────── */
  const loadClanInvites = async (tgId) => {
    const section  = document.getElementById('clan-invites-section');
    const listEl   = document.getElementById('clan-invites-list');
    const countEl  = document.getElementById('clan-invites-count');
    if (!section || !listEl) return;

    const data = await apiGet('/api/season2/clan/my-invites?telegram_id=' + encodeURIComponent(tgId));
    const invites = (data && data.status === 1) ? data.invites : [];
    if (!invites.length) { section.style.display = 'none'; return; }

    section.style.display = '';
    if (countEl) countEl.textContent = invites.length + ' pending';

    listEl.innerHTML = invites.map(inv => `
      <article class="card" style="padding:12px 14px;margin-bottom:8px;" data-invite-id="${escHtml(inv.invite_id)}">
        <div style="display:flex;align-items:center;gap:10px;">
          ${inv.clan_photo
            ? `<img src="${escHtml(inv.clan_photo)}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" alt="" onerror="this.outerHTML='<div class=clan-badge-large style=width:40px;height:40px;font-size:16px;>${escHtml(inv.clan_name.charAt(0).toUpperCase())}</div>'">`
            : `<div style="width:40px;height:40px;border-radius:50%;background:var(--card2,#1a1c2e);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:var(--gold);">${escHtml(inv.clan_name.charAt(0).toUpperCase())}</div>`
          }
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;font-size:13px;">${escHtml(inv.clan_name)}</div>
            <div style="font-size:11px;color:var(--muted);">Invited by ${escHtml(inv.inviter_name)} · ${inv.member_count} members</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:10px;">
          <button class="clan-btn clan-btn-join invite-accept-btn" data-id="${escHtml(inv.invite_id)}">⚔ Join Clan</button>
          <button class="clan-btn clan-btn-decline-soft invite-decline-btn" data-id="${escHtml(inv.invite_id)}">✗ Decline</button>
        </div>
      </article>`).join('');

    listEl.querySelectorAll('.invite-accept-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const inviteId = btn.dataset.id;
        btn.disabled = true; btn.textContent = '…';
        const res = await fetch('/api/season2/clan/accept-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegram_id: tgId, invite_id: inviteId }),
        }).then(r => r.json()).catch(() => null);

        if (res && res.status === 1) {
          _showToast('You joined ' + (res.clan_name || 'the clan') + '!');
          listEl.querySelector(`[data-invite-id="${inviteId}"]`)?.remove();
          if (!listEl.querySelector('[data-invite-id]')) section.style.display = 'none';
          serverRefresh();
        } else {
          const msg = {
            already_in_clan: 'You are already in a clan.',
            clan_full:       'That clan is now full.',
            invite_not_found:'Invite no longer available.',
          }[res?.error] || 'Could not join. Try again.';
          _showToast(msg);
          btn.disabled = false; btn.textContent = '✓ Join Clan';
        }
      });
    });

    listEl.querySelectorAll('.invite-decline-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const inviteId = btn.dataset.id;
        btn.disabled = true; btn.textContent = '…';
        const res = await fetch('/api/season2/clan/decline-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegram_id: tgId, invite_id: inviteId }),
        }).then(r => r.json()).catch(() => null);

        if (res && res.status === 1) {
          listEl.querySelector(`[data-invite-id="${inviteId}"]`)?.remove();
          if (!listEl.querySelector('[data-invite-id]')) section.style.display = 'none';
        } else {
          btn.disabled = false; btn.textContent = '✗ Decline';
        }
      });
    });
  };

  /* ── Season 1 legacy check ───────────────────────────────────────────── */
  const fetchLegacyS1 = async (telegramId) => {
    try {
      const r = await fetch(
        '/api/basic/legacy-profile?chatId=' + encodeURIComponent(String(telegramId)),
        { cache: 'no-store' }
      ).then(x => x.ok ? x.json() : null).catch(() => null);
      return !!(r && r.status === 1 && r.legacy && r.legacy.isSeason1);
    } catch { return false; }
  };

  /* ── Fetch helpers ────────────────────────────────────────────────────── */
  const fetchUser = async () => {
    const tg = _tg;
    if (!tg || !tg.id) return null;
    const qs = new URLSearchParams({ telegram_id: String(tg.id) });
    const resp = await apiGet('/api/season2/user/me?' + qs.toString());
    return (resp && resp.status === 1) ? resp.user : null;
  };

  const fetchClan = async () => {
    const tg = _tg;
    if (!tg || !tg.id) return null;
    const qs = new URLSearchParams({ telegram_id: String(tg.id) });
    const resp = await apiGet('/api/season2/clan/my-clan?' + qs.toString());
    return (resp && resp.status === 1) ? resp.clan : null;
  };

  /* ── Server re-fetch (every 30 s) — catches streak/referral/clan changes */
  const serverRefresh = async () => {
    const [u, clan] = await Promise.all([fetchUser(), fetchClan()]);
    if (u)    { _serverUser = u; }
    if (clan !== undefined) { _clanData = clan; }
    renderAll();
  };

  /* ── Offline / no-Telegram fallback ──────────────────────────────────── */
  const renderFallback = (tg) => {
    const nameEl   = document.getElementById('profile-name');
    const avatarEl = document.getElementById('profile-avatar');
    const name = tg ? (tg.first_name || tg.username || t('fallback_username', 'Warrior')) : t('fallback_username', 'Warrior');
    if (nameEl)   nameEl.textContent = name;
    if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();

    const liveP  = (window.RealPlayer && window.RealPlayer.get) ? window.RealPlayer.get() : {};
    const localP = (() => { try { return JSON.parse(localStorage.getItem('real_player_state_v1') || '{}'); } catch { return {}; } })();
    const _offlineXp = Math.max(liveP.xp || 0, localP.xp || 0);
    _serverUser = {
      xp:           _offlineXp,
      balance:      Math.max(liveP.balance  || 0, localP.balance  || 0),
      real_balance: Math.max(liveP.balance  || 0, localP.balance  || 0),
      farr:         Math.max(liveP.farr     || 0, localP.farr     || 0),
      gems:         Math.max(liveP.gems     || 0, localP.gems     || 0),
      zar:          Math.max(liveP.zar      || 0, localP.zar      || 0),
      level:        Math.max(1, Math.floor(_offlineXp / 1000)),
      daily_streak: liveP.dailyStreak || localP.dailyStreak || 1,
      verified_referral_count: liveP.referrals || localP.referrals || 0,
      last_checkin_date: localStorage.getItem('real_last_checkin_date') || '',
      max_real_balance: Math.max(
        Number(localStorage.getItem('real_max_real_balance') || 0),
        liveP.balance || 0,
        localP.balance || 0
      ),
      clan_id: '',
    };

    const zarHr = Number(localStorage.getItem('real_total_zar_hr') || 0);
    startMiningCounter({ total_zar: _serverUser.zar, zar_per_minute: zarHr / 60, zar_per_hour: zarHr });

    renderAll();
    renderInviter();

    window.addEventListener('balanceUpdate',       renderAll);
    window.addEventListener('shahnama:state_sync', renderAll);
  };

  /* ── Visitor mode helpers ────────────────────────────────────────────── */
  const _visitUid = new URLSearchParams(location.search).get('uid') || '';
  const _isVisitor = !!_visitUid;

  /* In visitor mode: hide private sections, show back button */
  const applyVisitorMode = () => {
    if (!_isVisitor) return;
    /* Swap the back button text and make it explicit */
    const backBtn = document.getElementById('back-btn');
    if (backBtn) backBtn.textContent = '← Chronicle';
    /* Hide earnings meter and REAL balance card (private financial data) */
    const earningsSection = document.querySelector('.section-head + .card.earnings-meter-card')
      || document.querySelector('.earnings-meter-card');
    if (earningsSection) earningsSection.style.display = 'none';
    const earningsHead = document.querySelector('.section-head');
    if (earningsHead && earningsHead.textContent.includes('Earnings'))
      earningsHead.style.display = 'none';
  };

  /* ── Main load ────────────────────────────────────────────────────────── */
  const load = async () => {
    _tg = tgUser();

    /* ── Visitor mode: viewing another player's profile ── */
    if (_isVisitor) {
      applyVisitorMode();
      const visitedQs = new URLSearchParams({ telegram_id: _visitUid });
      const myTg      = tgUser();
      const myQs      = myTg ? new URLSearchParams({ telegram_id: String(myTg.id) }) : null;

      const [resp, clanResp, myClanResp, s1] = await Promise.all([
        fetch('/api/season2/user/me?' + visitedQs.toString(), { cache: 'no-store' })
          .then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/season2/clan/my-clan?' + visitedQs.toString(), { cache: 'no-store' })
          .then(r => r.ok ? r.json() : null).catch(() => null),
        myQs
          ? fetch('/api/season2/clan/my-clan?' + myQs.toString(), { cache: 'no-store' })
              .then(r => r.ok ? r.json() : null).catch(() => null)
          : Promise.resolve(null),
        fetchLegacyS1(_visitUid),
      ]);

      if (!resp || resp.status !== 1 || !resp.user) {
        const nameEl = document.getElementById('profile-name');
        if (nameEl) nameEl.textContent = 'Profile not found';
        return;
      }

      _isS1 = s1;
      const visitedUser = resp.user;
      _serverUser = visitedUser;
      _clanData   = clanResp && clanResp.status === 1 ? clanResp.clan : null;

      /* Update clan section header to reflect the visited player, not "Your Clan" */
      const clanHead = document.getElementById('clan-section-head');
      const visitedName = visitedUser.first_name || visitedUser.username || 'Player';
      if (clanHead) clanHead.textContent = visitedName + "'s Clan";

      /* Determine if the current viewer is a clan leader who can invite */
      const myClan = myClanResp && myClanResp.status === 1 ? myClanResp.clan : null;
      const myId   = myTg ? String(myTg.id) : '';
      const amLeader = !!(myClan && myClan.leader_id && myId && myClan.leader_id === myId);
      const targetHasNoClan = !_clanData;

      let inviteBtn = '';
      if (amLeader && targetHasNoClan && myId !== _visitUid) {
        inviteBtn = `<button id="invite-to-clan-btn" class="clan-btn clan-btn-invite">
          ⚔ Invite to ${escHtml(myClan.clan_name)}
        </button>`;
      }

      /* Show visitor's identity — pass null as tg so we use DB name/pic */
      renderIdentity(visitedUser, null);
      /* Show read-only stats, badges, clan — no live updates for visitor view */
      renderStats(mergeUser());
      renderBadges(mergeUser());
      renderClan(_clanData, { isVisitor: true, inviteBtn });

      /* Wire invite button */
      if (amLeader && targetHasNoClan) {
        const btn = document.getElementById('invite-to-clan-btn');
        if (btn) {
          btn.addEventListener('click', async () => {
            btn.disabled = true;
            btn.textContent = 'Inviting…';
            try {
              const r = await fetch('/api/season2/clan/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegram_id: myId, target_telegram_id: _visitUid }),
              }).then(x => x.json());
              if (r.status === 1) {
                _showToast('Invite sent to ' + (r.clan_name || 'your clan') + '!');
                btn.disabled = true;
                btn.textContent = t('invite_sent_label', 'Invite Sent ✓');
              } else {
                const msg = {
                  not_leader: 'You are not a clan leader.',
                  not_in_clan: 'You are not in a clan.',
                  clan_full: 'Your clan is full (50/50).',
                  already_in_clan: 'Player is already in a clan.',
                  user_not_found: 'Player not found.',
                }[r.error] || ('Error: ' + (r.error || 'unknown'));
                _showToast(msg);
                btn.disabled = false;
                btn.textContent = '⚔ Invite to ' + (myClan.clan_name || 'Clan');
              }
            } catch {
              _showToast('Network error. Try again.');
              btn.disabled = false;
              btn.textContent = '⚔ Invite to ' + (myClan.clan_name || 'Clan');
            }
          });
        }
      }

      /* Hide balance card and earnings meter for visitor */
      ['real-balance-card', 'earnings-meter-section'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
      document.querySelectorAll('.section-head h3').forEach(h => {
        if (h.textContent.includes('Earnings')) h.closest('.section-head').style.display = 'none';
      });
      document.querySelector('.earnings-meter-card')?.style?.setProperty('display', 'none');
      return;
    }

    /* ── Own profile ── */
    if (!_tg || !_tg.id) {
      renderFallback(null);
      const nameEl = document.getElementById('profile-name');
      if (nameEl) nameEl.textContent = 'Open via Telegram';
      return;
    }

    /* Fetch user, clan, and Season 1 status in parallel */
    const [u, clan, s1Own] = await Promise.all([
      fetchUser(),
      fetchClan(),
      fetchLegacyS1(String(_tg.id)),
    ]);

    if (!u) {
      renderFallback(_tg);
      return;
    }

    _serverUser = u;
    _clanData   = clan;
    _isS1       = s1Own;

    /* Persist S1 status to localStorage so earn page / app.js stay in sync */
    try {
      if (s1Own) localStorage.setItem('isSeason1Player', 'true');
    } catch (_) {}

    renderIdentity(u, _tg);
    renderInviter();

    /* Start mining counter */
    const ms = u.mining_stats || { total_zar: u.zar || 0, zar_per_minute: 0, zar_per_hour: 0 };
    const zarStart = window.RealUtils
      ? window.RealUtils.updateGlobalZar(ms)
      : Math.max(ms.total_zar, (window.RealPlayer && window.RealPlayer.get ? (window.RealPlayer.get().zar || 0) : 0));
    const localHr  = Number(localStorage.getItem('real_total_zar_hr') || 0);
    const baseHr   = Math.max(ms.zar_per_hour || 0, localHr);
    const clanMult = (u.clan_id || clan) ? 1.05 : 1;
    startMiningCounter({ zar_per_minute: (baseHr * clanMult) / 60, zar_per_hour: baseHr * clanMult, total_zar: zarStart });

    /* Initial render */
    renderAll();

    /* Load pending clan invites (only shown when player has no clan yet) */
    if (!clan) loadClanInvites(String(_tg.id));

    /* Live update on client-side state changes (instant) */
    window.addEventListener('balanceUpdate',       renderAll);
    window.addEventListener('shahnama:state_sync', renderAll);

    /* Server re-fetch every 30 s — catches streak, referrals, clan changes */
    setInterval(serverRefresh, 30_000);
  };

  /* Re-render on bfcache restore (back navigation) */
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      const p = (window.RealPlayer && window.RealPlayer.get) ? window.RealPlayer.get() : {};
      if (window.RealPlayer && window.RealPlayer.set) {
        window.RealPlayer.set({ balance: p.balance || 0, zar: p.zar || 0, xp: p.xp || 0, farr: p.farr || 0, gems: p.gems || 0 });
      }
      renderAll();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
