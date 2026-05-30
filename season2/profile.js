/* ==========================================================================
   REAL Shahnameh — Season 2 Profile Page (profile.js)
   All data fetched from /api/season2/user/me — no hardcoding.
   ========================================================================== */
(function () {
  'use strict';

  const tgUser = () => {
    try {
      return (window.Telegram && window.Telegram.WebApp
        && window.Telegram.WebApp.initDataUnsafe
        && window.Telegram.WebApp.initDataUnsafe.user) || null;
    } catch (_) { return null; }
  };

  /* i18n helpers — fall back gracefully if RealI18N not ready */
  const t  = (k, v) => (window.RealI18N && window.RealI18N.t)  ? window.RealI18N.t(k, v)  : k;
  const pd = (s)    => (window.RealI18N && window.RealI18N.toPersianDigits)
                         ? window.RealI18N.toPersianDigits(String(s)) : String(s);
  const isFa = ()   => (window.RealI18N && window.RealI18N.getLang) ? window.RealI18N.getLang() === 'fa' : false;

  const fmtN = (n) => {
    n = Number(n) || 0;
    let s;
    if (n >= 1_000_000) s = (n / 1_000_000).toFixed(1) + 'M';
    else if (n >= 1_000) s = (n / 1_000).toFixed(1) + 'K';
    else s = n.toLocaleString();
    return isFa() ? pd(s) : s;
  };

  const fmtZar = (n) => {
    n = Number(n) || 0;
    let s;
    if (n >= 1_000_000) s = (n / 1_000_000).toFixed(2) + 'M';
    else if (n >= 1_000) s = (n / 1_000).toFixed(2) + 'K';
    else s = n.toFixed(2);
    return isFa() ? pd(s) : s;
  };

  /* ── Achievements definition ─────────────────────────────────────────── */
  const ACHIEVEMENTS = [
    { id: 'first_strike',  icon: '⚡',  nameKey: 'ach_first_strike_name', descKey: 'ach_first_strike_desc', check: u => (u.xp || 0) > 0 },
    { id: 'clan_founder',  icon: '🛡',  nameKey: 'ach_clan_founder_name', descKey: 'ach_clan_founder_desc', check: u => (u.verified_referral_count || 0) >= 1 },
    { id: 'daily_champ',   icon: '🔥',  nameKey: 'ach_7day_name',         descKey: 'ach_7day_desc',         check: u => (u.daily_streak || 0) >= 7 },
    { id: 'check_in',      icon: '📅',  nameKey: 'ach_chronicle_name',    descKey: 'ach_chronicle_desc',    check: u => !!(u.last_checkin_date) },
    { id: 'rich_warrior',  icon: null,  nameKey: 'ach_rich_name',         descKey: 'ach_rich_desc',
      tokenImg: '/assets/images/tokens/realtoken.png',
      check: u => Math.max(u.max_real_balance || 0, u.real_balance || 0) >= 10_000 },
    { id: 'legend',        icon: '👑',  nameKey: 'ach_legend_name',       descKey: 'ach_legend_desc',       check: u => (u.level || 1) >= 10 },
  ];

  /* ── Render identity card ─────────────────────────────────────────────── */
  const renderIdentity = (u, tg) => {
    const avatarEl   = document.getElementById('profile-avatar');
    const nameEl     = document.getElementById('profile-name');
    const usernameEl = document.getElementById('profile-username');
    const pathTagEl  = document.getElementById('profile-path-tag');
    const pathPill   = document.getElementById('path-pill');

    const displayName = u.first_name
      ? (u.first_name + (u.last_name ? ' ' + u.last_name : ''))
      : (u.username ? '@' + u.username : 'Warrior');

    if (nameEl)     nameEl.textContent = displayName;
    if (usernameEl) usernameEl.textContent = u.username ? '@' + u.username : '';

    const showFallbackAvatar = () => {
      const fallbackSrc = window.RealUtils && window.RealUtils.getAvatarFallback
        ? window.RealUtils.getAvatarFallback(u.path)
        : null;
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

    /* TrustAI Verified Human badge — appears when player has ≥1 verified referral */
    const trustBadge = document.getElementById('trustai-badge');
    if (trustBadge) {
      trustBadge.style.display = (u.verified_referral_count || 0) > 0 ? 'inline-flex' : 'none';
    }

    const path = u.path || 'hero';
    const pathLabel = path === 'heroine' ? t('path_heroine_lbl') : t('path_hero_lbl');
    const pathClass = path === 'heroine' ? 'heroine' : 'hero';
    if (pathTagEl) {
      pathTagEl.textContent = pathLabel;
      pathTagEl.className   = 'profile-path-tag ' + pathClass;
      pathTagEl.style.display = 'inline-flex';
    }
    if (pathPill) {
      pathPill.textContent  = pathLabel;
      pathPill.style.display = '';
    }
  };

  /* ── Render REAL balance card ─────────────────────────────────────────── */
  const renderBalanceCard = (u) => {
    const amountEl   = document.getElementById('rbc-amount');
    const bonusEl    = document.getElementById('rbc-clan-bonus');

    /* Use the higher of API value and local Player state to guard against
       a stale-zero DB value overriding client-side earned balance. */
    const localBal  = (window.RealPlayer && window.RealPlayer.get)
      ? (window.RealPlayer.get().balance || 0) : 0;
    const displayBal = Math.max(u.real_balance || 0, localBal);
    if (amountEl) amountEl.textContent = fmtN(displayBal) + ' REAL';

    if (bonusEl) {
      if (u.clan_id) {
        bonusEl.style.display = '';
      } else {
        bonusEl.style.display = 'none';
      }
    }
  };

  /* ── Inviter attribution ─────────────────────────────────────────────── */
  const renderInviter = () => {
    const el = document.getElementById('profile-inviter');
    if (!el) return;
    try {
      const inviterName = localStorage.getItem('real_inviter_name');
      const inviterId   = localStorage.getItem('real_inviter_id');
      if (inviterName || inviterId) {
        const label = (window.RealI18N && window.RealI18N.t)
          ? window.RealI18N.t('invited_by_label') : 'Invited by';
        el.textContent = `${label}: ${inviterName || ('Warrior #' + inviterId)}`;
        el.style.display = '';
      }
    } catch {}
  };

  /* ── Live ZAR mining counter ──────────────────────────────────────────── */
  let _zarTimer = null;

  const startMiningCounter = (mining) => {
    if (_zarTimer) clearInterval(_zarTimer);

    const zarLiveEl  = document.getElementById('em-zar-live');
    const rateMinEl  = document.getElementById('em-rate-min');
    const rateHrEl   = document.getElementById('em-rate-hr');
    const payoutEl   = document.getElementById('em-payout');

    const zarPerMin = mining.zar_per_minute || 0;
    const zarPerHr  = mining.zar_per_hour  || 0;

    if (rateMinEl) rateMinEl.textContent = fmtZar(zarPerMin) + ' ' + t('unit_zar');
    if (rateHrEl)  rateHrEl.textContent  = fmtZar(zarPerHr)  + ' ' + t('unit_zar');

    /* Next payout: every hour on the hour */
    const updatePayout = () => {
      if (!payoutEl) return;
      const now  = new Date();
      const next = new Date(now);
      next.setHours(next.getHours() + 1, 0, 0, 0);
      const diffMs  = next - now;
      const diffMin = Math.floor(diffMs / 60000);
      const diffSec = Math.floor((diffMs % 60000) / 1000);
      payoutEl.textContent = t('payout_fmt', { m: isFa() ? pd(diffMin) : diffMin, s: isFa() ? pd(String(diffSec).padStart(2, '0')) : String(diffSec).padStart(2, '0') });
    };

    /* Accumulate ZAR in real time from the server-side snapshot */
    let currentZar = mining.total_zar || 0;
    const zarPerSec = zarPerMin / 60;
    let lastTick = Date.now();

    const tick = () => {
      const now  = Date.now();
      const dt   = (now - lastTick) / 1000;
      lastTick   = now;
      currentZar += zarPerSec * dt;
      if (zarLiveEl) zarLiveEl.textContent = fmtZar(currentZar) + ' ' + t('unit_zar');
      updatePayout();
    };

    tick();
    _zarTimer = setInterval(tick, 1000);
  };

  /* ── Render stats grid ────────────────────────────────────────────────── */
  const renderStats = (u) => {
    const el = document.getElementById('stats-grid');
    if (!el) return;

    const level  = u.level || 1;
    const xpCurr = u.xp || 0;
    const inClan = !!(u.clan_id);

    const stats = [
      { ico: '⭐', lbl: t('stat_xp_lbl'),       val: fmtN(xpCurr),                                   bonus: inClan ? t('stat_clan_bonus_tag') : null },
      { ico: '🏆', lbl: t('stat_level_lbl'),     val: t('stat_level_val', { n: isFa() ? pd(level) : level }), bonus: null },
      { ico: '🔥', lbl: t('stat_daily_lbl'),     val: t('stat_daily_val', { n: isFa() ? pd(u.daily_streak || 1) : (u.daily_streak || 1) }), bonus: null },
      { ico: '👥', lbl: t('stat_warriors_lbl'),  val: isFa() ? pd(u.verified_referral_count || 0) : String(u.verified_referral_count || 0), bonus: null },
    ];

    el.innerHTML = stats.map(s => `
      <div class="stat-card">
        <span class="stat-ico">${s.ico}</span>
        <span class="stat-val">${s.val}</span>
        <span class="stat-lbl">${s.lbl}</span>
        ${s.bonus ? `<span class="stat-clan-bonus">${s.bonus}</span>` : ''}
      </div>`).join('');
  };

  /* ── Render achievement badges ────────────────────────────────────────── */
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

  /* ── Error / offline fallback ─────────────────────────────────────────── */
  const renderFallback = (tg) => {
    const nameEl    = document.getElementById('profile-name');
    const avatarEl  = document.getElementById('profile-avatar');
    const statsEl   = document.getElementById('stats-grid');
    const badgeEl   = document.getElementById('badge-grid');
    const amountEl  = document.getElementById('rbc-amount');

    const name = tg ? (tg.first_name || tg.username || 'Warrior') : 'Warrior';
    if (nameEl)   nameEl.textContent = name;
    if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();

    const localP = (() => {
      try { return JSON.parse(localStorage.getItem('real_player_state_v1') || '{}'); } catch { return {}; }
    })();

    if (amountEl) amountEl.textContent = fmtN(localP.balance || 0) + ' REAL';

    /* Local mining rate from heroes.js localStorage key */
    const zarHr = Number(localStorage.getItem('real_total_zar_hr') || 0);
    startMiningCounter({ total_zar: localP.zar || 0, zar_per_minute: zarHr / 60, zar_per_hour: zarHr });

    if (statsEl) {
      const stats = [
        { ico: '⭐', lbl: t('stat_xp_lbl'),      val: fmtN(localP.xp || 0) },
        { ico: '🏆', lbl: t('stat_level_lbl'),    val: t('stat_level_val', { n: isFa() ? pd(localP.level || 1) : (localP.level || 1) }) },
        { ico: '🔥', lbl: t('stat_daily_lbl'),    val: t('stat_daily_val', { n: isFa() ? pd(localP.dailyStreak || 1) : (localP.dailyStreak || 1) }) },
        { ico: '👥', lbl: t('stat_warriors_lbl'), val: isFa() ? pd(localP.referrals || 0) : String(localP.referrals || 0) },
      ];
      statsEl.innerHTML = stats.map(s => `
        <div class="stat-card">
          <span class="stat-ico">${s.ico}</span>
          <span class="stat-val">${s.val}</span>
          <span class="stat-lbl">${s.lbl}</span>
        </div>`).join('');
    }

    if (badgeEl) {
      const cachedMaxBal = Number(localStorage.getItem('real_max_real_balance') || 0);
      const fakeUser = {
        xp: localP.xp || 0,
        real_balance: localP.balance || 0,
        max_real_balance: Math.max(cachedMaxBal, localP.balance || 0),
        level: localP.level || 1,
        daily_streak: localP.dailyStreak || 1,
        verified_referral_count: localP.referrals || 0,
        last_checkin_date: '',
        clan_id: '',
      };
      renderBadges(fakeUser);
    }
    renderInviter();
  };

  /* ── Main load ────────────────────────────────────────────────────────── */
  const load = async () => {
    const tg = tgUser();

    if (!tg || !tg.id) {
      renderFallback(null);
      const nameEl = document.getElementById('profile-name');
      if (nameEl) nameEl.textContent = 'Open via Telegram';
      return;
    }

    const qs   = new URLSearchParams({ telegram_id: String(tg.id) });
    const resp = await fetch('/api/season2/user/me?' + qs.toString(), { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);

    if (!resp || resp.status !== 1 || !resp.user) {
      renderFallback(tg);
      return;
    }

    const u = resp.user;
    renderIdentity(u, tg);
    renderBalanceCard(u);
    const _ms = u.mining_stats || { total_zar: u.zar || 0, zar_per_minute: 0, zar_per_hour: 0 };
    /* Sync global ZAR: takes max(server, local) so profile always matches home */
    const _zarStart = window.RealUtils
      ? window.RealUtils.updateGlobalZar(_ms)
      : Math.max(_ms.total_zar, (window.RealPlayer && window.RealPlayer.get ? (window.RealPlayer.get().zar || 0) : 0));
    /* Derive zar_per_minute from zar_per_hour; localStorage fallback for legacy heroes.
       Apply +5% clan bonus when user is a clan member. */
    const _localHr      = Number(localStorage.getItem('real_total_zar_hr') || 0);
    const _baseHr       = Math.max(_ms.zar_per_hour || 0, _localHr);
    const _clanMultiplier = u.clan_id ? 1.05 : 1;
    const _zarHr        = _baseHr * _clanMultiplier;
    const _zarMin       = _zarHr / 60;
    startMiningCounter({ zar_per_minute: _zarMin, zar_per_hour: _zarHr, total_zar: _zarStart });
    renderStats(u);
    renderBadges(u);
    renderInviter();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
