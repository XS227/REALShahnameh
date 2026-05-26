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
      icon: '💎',
      name: 'Rich Warrior',
      desc: 'Accumulate 10,000 REAL',
      check: u => (u.real_balance || 0) >= 10_000,
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

    /* Avatar: try profile_pic, fall back to initial */
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

    /* Path tag */
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

  /* ── Render stats grid ────────────────────────────────────────────────── */
  const renderStats = (u) => {
    const el = document.getElementById('stats-grid');
    if (!el) return;

    const level = u.level || 1;
    const xpNext = level * 1000;
    const xpCurr = u.xp || 0;

    const stats = [
      { ico: '◆', lbl: 'REAL Balance',  val: fmtN(u.real_balance || 0) },
      { ico: '⭐', lbl: 'XP Earned',    val: fmtN(xpCurr) },
      { ico: '🏆', lbl: 'Level',         val: 'LVL ' + level },
      { ico: '🔥', lbl: 'Login Streak',  val: (u.daily_streak || 1) + ' days' },
      { ico: '👥', lbl: 'Clan Warriors', val: String(u.verified_referral_count || 0) },
      { ico: '📅', lbl: 'Check-in Streak', val: (u.checkin_streak || 0) + ' days' },
    ];

    el.innerHTML = stats.map(s => `
      <div class="stat-card">
        <span class="stat-ico">${s.ico}</span>
        <span class="stat-val">${s.val}</span>
        <span class="stat-lbl">${s.lbl}</span>
      </div>`).join('');
  };

  /* ── Render achievement badges ────────────────────────────────────────── */
  const renderBadges = (u) => {
    const el = document.getElementById('badge-grid');
    if (!el) return;

    el.innerHTML = ACHIEVEMENTS.map(a => {
      const earned = a.check(u);
      return `
        <div class="badge-card ${earned ? 'earned' : 'locked-badge'}">
          <div class="badge-ico-wrap">${a.icon}</div>
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
    const nameEl = document.getElementById('profile-name');
    const avatarEl = document.getElementById('profile-avatar');
    const statsEl = document.getElementById('stats-grid');
    const badgeEl = document.getElementById('badge-grid');

    const name = tg ? (tg.first_name || tg.username || 'Warrior') : 'Warrior';
    if (nameEl)   nameEl.textContent = name;
    if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();

    const localP = (() => {
      try { return JSON.parse(localStorage.getItem('real_player_state_v1') || '{}'); } catch { return {}; }
    })();

    if (statsEl) {
      const stats = [
        { ico: '◆', lbl: 'REAL Balance', val: fmtN(localP.balance || 0) },
        { ico: '⭐', lbl: 'XP Earned',   val: fmtN(localP.xp || 0) },
        { ico: '🏆', lbl: 'Level',        val: 'LVL ' + (localP.level || 1) },
        { ico: '🔥', lbl: 'Login Streak', val: (localP.dailyStreak || 1) + ' days' },
        { ico: '👥', lbl: 'Clan Warriors', val: String(localP.referrals || 0) },
        { ico: '📅', lbl: 'Check-in Streak', val: '—' },
      ];
      statsEl.innerHTML = stats.map(s => `
        <div class="stat-card">
          <span class="stat-ico">${s.ico}</span>
          <span class="stat-val">${s.val}</span>
          <span class="stat-lbl">${s.lbl}</span>
        </div>`).join('');
    }

    if (badgeEl) {
      const fakeUser = { xp: localP.xp || 0, real_balance: localP.balance || 0, level: localP.level || 1, daily_streak: localP.dailyStreak || 1, verified_referral_count: localP.referrals || 0, last_checkin_date: '', checkin_streak: 0 };
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
    renderStats(u);
    renderBadges(u);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
