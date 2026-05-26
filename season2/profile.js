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

  const fmtN = (n) => {
    n = Number(n) || 0;
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
    return n.toLocaleString();
  };

  const fmtZar = (n) => {
    n = Number(n) || 0;
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(2) + 'K';
    return n.toFixed(2);
  };

  /* ── Achievements definition ─────────────────────────────────────────── */
  const ACHIEVEMENTS = [
    {
      id:   'first_strike',
      icon: '⚡',
      name: 'First Strike',
      desc: 'Strike the Anvil and earn XP',
      check: u => (u.xp || 0) > 0,
    },
    {
      id:   'clan_founder',
      icon: '🛡',
      name: 'Clan Founder',
      desc: 'Recruit your first warrior',
      check: u => (u.verified_referral_count || 0) >= 1,
    },
    {
      id:   'daily_champion',
      icon: '🔥',
      name: '7-Day Streak',
      desc: 'Login 7 days in a row',
      check: u => (u.daily_streak || 0) >= 7,
    },
    {
      id:   'check_in',
      icon: '📅',
      name: 'Chronicle Keeper',
      desc: 'Claim your daily check-in reward',
      check: u => !!(u.last_checkin_date),
    },
    {
      id:   'rich_warrior',
      icon: null,
      tokenImg: '/assets/images/tokens/realtoken.png',
      name: 'Rich Warrior',
      desc: 'Accumulate 10,000 REAL',
      check: u => Math.max(u.max_real_balance || 0, u.real_balance || 0) >= 10_000,
    },
    {
      id:   'legend',
      icon: '👑',
      name: 'Legend of Pars',
      desc: 'Rise to LVL 10',
      check: u => (u.level || 1) >= 10,
    },
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

    if (avatarEl) {
      const pic = u.profile_pic || (tg && tg.photo_url) || '';
      if (pic) {
        const img = document.createElement('img');
        img.src = pic;
        img.alt = displayName;
        img.onerror = () => {
          img.remove();
          avatarEl.textContent = displayName.charAt(0).toUpperCase();
        };
        avatarEl.innerHTML = '';
        avatarEl.appendChild(img);
      } else {
        avatarEl.textContent = displayName.charAt(0).toUpperCase();
      }
    }

    const path = u.path || 'hero';
    const pathLabel = path === 'heroine' ? '⚜ Heroine' : '⚔ Hero';
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

    if (rateMinEl) rateMinEl.textContent = fmtZar(zarPerMin) + ' ZAR';
    if (rateHrEl)  rateHrEl.textContent  = fmtZar(zarPerHr)  + ' ZAR';

    /* Next payout: every hour on the hour */
    const updatePayout = () => {
      if (!payoutEl) return;
      const now  = new Date();
      const next = new Date(now);
      next.setHours(next.getHours() + 1, 0, 0, 0);
      const diffMs  = next - now;
      const diffMin = Math.floor(diffMs / 60000);
      const diffSec = Math.floor((diffMs % 60000) / 1000);
      payoutEl.textContent = diffMin + 'm ' + String(diffSec).padStart(2, '0') + 's';
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
      if (zarLiveEl) zarLiveEl.textContent = fmtZar(currentZar) + ' ZAR';
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
      { ico: '⭐', lbl: 'XP Earned',    val: fmtN(xpCurr),                          bonus: inClan ? '+5% Clan Power active' : null },
      { ico: '🏆', lbl: 'Level',         val: 'LVL ' + level,                        bonus: null },
      { ico: '🔥', lbl: 'Daily Strike',  val: (u.daily_streak || 1) + ' days',       bonus: null },
      { ico: '👥', lbl: 'Clan Warriors', val: String(u.verified_referral_count || 0), bonus: null },
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
            <div class="badge-name">${a.name}</div>
            <div class="badge-desc">${a.desc}</div>
            ${earned ? '<div class="badge-earned-tag">✓ Earned</div>' : ''}
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
        { ico: '⭐', lbl: 'XP Earned',    val: fmtN(localP.xp || 0)           },
        { ico: '🏆', lbl: 'Level',         val: 'LVL ' + (localP.level || 1)  },
        { ico: '🔥', lbl: 'Daily Strike',  val: (localP.dailyStreak || 1) + ' days' },
        { ico: '👥', lbl: 'Clan Warriors', val: String(localP.referrals || 0) },
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
    /* Always derive zar_per_minute from zar_per_hour to guarantee consistency.
       Use localStorage real_total_zar_hr as fallback for legacy 0-rate heroes. */
    const _localHr  = Number(localStorage.getItem('real_total_zar_hr') || 0);
    const _zarHr    = Math.max(_ms.zar_per_hour || 0, _localHr);
    const _zarMin   = _zarHr / 60;
    startMiningCounter({ zar_per_minute: _zarMin, zar_per_hour: _zarHr, total_zar: _zarStart });
    renderStats(u);
    renderBadges(u);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
