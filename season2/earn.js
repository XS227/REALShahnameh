/* ==========================================================================
   REAL Shahnameh — Season 2 Earn Page (earn.js)
   Daily check-in · Social tasks · Partners · Live referrals · Milestones
   ========================================================================== */
(function () {
  'use strict';

  /* ── Helpers ─────────────────────────────────────────────────────────── */
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

  const showToast = (msg) => {
    const el = document.querySelector('[data-toast]');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2800);
  };

  const fireBurst = (label) => {
    try {
      window.dispatchEvent(new CustomEvent('real:burst', { detail: { label: label || 'Claimed!' } }));
    } catch (_) {}
  };

  const todayStr = () => new Date().toISOString().slice(0, 10);

  /* ── Config ──────────────────────────────────────────────────────────── */
  const CHECKIN_REWARDS = [
    { real: 500,  gems: 0 },
    { real: 1000, gems: 0 },
    { real: 1500, gems: 0 },
    { real: 2000, gems: 0 },
    { real: 2500, gems: 0 },
    { real: 3000, gems: 0 },
    { real: 3500, gems: 1 },  // day 7: gem bonus
  ];

  /* Platform brand palettes for task cards */
  const PLATFORM_BRAND = {
    telegram: { bg: 'rgba(40,168,234,.14)', border: 'rgba(40,168,234,.38)', color: '#29a8ea' },
    x:        { bg: 'rgba(255,255,255,.07)', border: 'rgba(255,255,255,.2)',  color: '#e7e7e7' },
    tiktok:   { bg: 'rgba(255,0,80,.10)',    border: 'rgba(255,0,80,.28)',    color: '#ff2d55' },
    youtube:  { bg: 'rgba(255,0,0,.10)',     border: 'rgba(255,0,0,.28)',     color: '#ff4040' },
    dyor:     { bg: 'rgba(74,216,166,.10)',  border: 'rgba(74,216,166,.32)', color: '#4ad8a6' },
  };

  const SOCIAL_TASKS = [
    {
      id: 'follow_tg_channel',
      platform: 'telegram',
      label: 'Follow Official Channel',
      sublabel: '@Shahnameh_news',
      icon: '✈',
      url: 'https://t.me/Shahnameh_news',
      reward_real: 2500, reward_gems: 0,
    },
    {
      id: 'join_tg_support',
      platform: 'telegram',
      label: 'Join Persian Community',
      sublabel: '@shahnameh_persian',
      icon: '✈',
      url: 'https://t.me/shahnameh_persian',
      reward_real: 2500, reward_gems: 0,
    },
    {
      id: 'follow_x',
      platform: 'x',
      label: 'Follow on X',
      sublabel: '@shahnamehgamefi',
      icon: '𝕏',
      url: 'https://x.com/shahnamehgamefi',
      reward_real: 3000, reward_gems: 0,
    },
    {
      id: 'follow_tiktok',
      platform: 'tiktok',
      label: 'Follow REAL Page',
      sublabel: '@shahnamehgamefi227',
      icon: '♬',
      url: 'https://www.tiktok.com/@shahnamehgamefi227',
      reward_real: 2000, reward_gems: 0,
    },
    {
      id: 'subscribe_youtube',
      platform: 'youtube',
      label: 'Subscribe to Channel',
      sublabel: '@shahnamehgamefi',
      icon: '▶',
      url: 'https://youtube.com/@shahnamehgamefi',
      reward_real: 3000, reward_gems: 0,
    },
    {
      id: 'like_dyor',
      platform: 'dyor',
      label: 'Like the DApp on DYOR.io',
      sublabel: 'games/shahnameh',
      icon: '👍',
      url: 'https://dyor.io/dapps/games/shahnameh',
      reward_real: 3000, reward_gems: 0,
    },
  ];
  /* Total: 2500+2500+3000+2000+3000+3000 = 16,000 REAL */

  const PARTNERS = [
    {
      id: 'partner_tonkeeper',
      label: 'Tonkeeper Wallet',
      desc: 'The leading TON wallet',
      icon: '💎',
      url: 'https://t.me/tonkeeper',
      reward_real: 500, reward_gems: 0, reward_farr: 0,
    },
    {
      id: 'partner_blum',
      label: 'Blum',
      desc: 'Trade & earn on Blum',
      icon: '🌸',
      url: 'https://t.me/BlumCryptoBot',
      reward_real: 300, reward_gems: 2, reward_farr: 0,
    },
    {
      id: 'partner_nft_real',
      label: 'REAL NFT — Early Access',
      desc: 'Claim your Shahnameh NFT slot',
      icon: '✦',
      url: 'https://t.me/shahnameh_bot',
      reward_real: 0, reward_gems: 0, reward_farr: 1,
    },
  ];

  const MILESTONES = [
    {
      threshold: 3,
      real: 1000, gems: 0, farr: 0,
      chest: 'founder_chest',                          // vault item
      label: '🎁 1,000 REAL + Founder Chest',
    },
    {
      threshold: 10,
      real: 3000, gems: 0, farr: 0,
      hero_unlock: 'commander_card',                   // hero collection unlock flag
      label: '⚔ 3,000 REAL + Commander Card',
    },
    {
      threshold: 25,
      real: 8000, gems: 0, farr: 0,
      multiplier_asset: 'airdrop_multiplier_s2',       // persisted multiplier asset
      label: '🪂 8,000 REAL + Airdrop Multiplier',
    },
    {
      threshold: 100,
      real: 25000, gems: 0, farr: 0,
      badge: 'shahnameh_immortals',                    // profile badge flag
      label: '👑 25,000 REAL + Immortals Badge',
    },
  ];

  /* ── Daily Check-in ──────────────────────────────────────────────────── */
  const renderCheckin = () => {
    const el = document.getElementById('earn-checkin');
    if (!el) return;

    const streak  = parseInt(localStorage.getItem('real_checkin_streak')    || '0', 10);
    const lastDay = localStorage.getItem('real_last_checkin_date') || '';
    const today   = todayStr();
    const claimed = lastDay === today;

    const nextStreak = claimed ? streak : streak + 1;
    const nextIdx    = Math.min(nextStreak, 7) - 1;
    const nextReward = CHECKIN_REWARDS[nextIdx] || CHECKIN_REWARDS[6];

    /* 7-day strip */
    const days = Array.from({ length: 7 }, (_, i) => {
      const dayNum  = i + 1;
      const r       = CHECKIN_REWARDS[i];
      const rewardTxt = r.real >= 1000 ? (r.real / 1000) + 'k' : r.real + '';
      const gem     = r.gems ? ' +💎' : '';
      const past    = streak >= dayNum;
      const active  = !claimed && (dayNum === nextStreak);
      const cls     = past ? 'ci-day ci-done' : (active ? 'ci-day ci-active' : 'ci-day');
      const ico     = past ? '✓' : (active ? '★' : dayNum);
      return `<div class="${cls}">
        <div class="ci-ico">${ico}</div>
        <div class="ci-lbl">D${dayNum}</div>
        <div class="ci-val">${rewardTxt}◆${gem}</div>
      </div>`;
    }).join('');

    const btnLabel = claimed
      ? '✓ Come back tomorrow'
      : `Claim Day ${nextStreak} · +${nextReward.real} ◆${nextReward.gems ? ' +💎' : ''}`;

    el.innerHTML = `
      <article class="card checkin-card">
        <div class="checkin-top">
          <div class="checkin-streak">
            <span class="ci-streak-num">${streak}</span>
            <span class="ci-streak-lbl">day streak</span>
          </div>
          <button class="primary-btn checkin-btn${claimed ? ' ci-claimed' : ''}" id="ci-btn" ${claimed ? 'disabled' : ''}>
            ${btnLabel}
          </button>
        </div>
        <div class="checkin-days">${days}</div>
      </article>`;

    if (!claimed) {
      document.getElementById('ci-btn').addEventListener('click', doCheckin);
    }
  };

  const doCheckin = async () => {
    const u = tgUser();
    const btn = document.getElementById('ci-btn');
    if (btn) { btn.disabled = true; btn.textContent = '…'; }

    if (!u || !u.id) {
      const streak   = parseInt(localStorage.getItem('real_checkin_streak') || '0', 10);
      const newStreak = streak + 1;
      const idx       = Math.min(newStreak, 7) - 1;
      const reward    = CHECKIN_REWARDS[idx];
      localStorage.setItem('real_checkin_streak',    String(newStreak));
      localStorage.setItem('real_last_checkin_date', todayStr());
      if (window.RealPlayer) {
        window.RealPlayer.addResource('real', reward.real);
        if (reward.gems) window.RealPlayer.addResource('gems', reward.gems);
      }
      showToast(`+${reward.real} ◆ claimed!`);
      fireBurst(`Day ${newStreak} · +${reward.real} REAL`);
      renderCheckin();
      return;
    }

    const data = await post('/api/season2/earn/checkin', { telegram_id: String(u.id) });

    if (!data || data.status !== 1) {
      if (data && data.error === 'already_claimed') {
        localStorage.setItem('real_last_checkin_date', todayStr());
        renderCheckin();
        showToast('Already claimed today!');
      } else {
        showToast('Could not claim. Try again.');
        if (btn) { btn.disabled = false; btn.textContent = 'Retry'; }
      }
      return;
    }

    localStorage.setItem('real_checkin_streak',    String(data.streak));
    localStorage.setItem('real_last_checkin_date', todayStr());
    if (window.RealPlayer) {
      window.RealPlayer.addResource('real', data.reward_real || 0);
      if (data.reward_gems) window.RealPlayer.addResource('gems', data.reward_gems);
      if (window.RealSync) window.RealSync.syncBalance();
    }

    showToast(`+${data.reward_real} ◆${data.reward_gems ? ' +💎' : ''} claimed!`);
    fireBurst(`Day ${data.streak} · +${data.reward_real} REAL`);
    renderCheckin();
  };

  /* ── Social Tasks ────────────────────────────────────────────────────── */
  const completedTasks = () => {
    try { return JSON.parse(localStorage.getItem('real_completed_tasks') || '[]'); }
    catch { return []; }
  };

  /* Per-task pending timer state (survives only in this page session) */
  const pendingTimers = {};

  const renderSocialTasks = (shareUrl) => {
    const el = document.getElementById('social-tasks');
    if (!el) return;

    const done = completedTasks();
    const isFa = window.RealI18N && window.RealI18N.getLang && window.RealI18N.getLang() === 'fa';
    const pd   = (n) => isFa && window.RealI18N && window.RealI18N.formatNumber
      ? window.RealI18N.formatNumber(n) : n.toLocaleString();

    const rows = SOCIAL_TASKS.map(task => {
      const isDone  = done.includes(task.id);
      const taskUrl = task.url;
      const brand   = PLATFORM_BRAND[task.platform] || {};
      const icoStyle = brand.bg
        ? `style="background:${brand.bg};border:1px solid ${brand.border};color:${brand.color}"`
        : '';
      const rewardLabel = task.reward_real
        ? `+${pd(task.reward_real)} ◆`
        : '';

      const btn = isDone
        ? `<button class="task-btn task-done" disabled>✓ Claimed</button>`
        : `<button class="task-btn task-go" data-task-id="${task.id}" data-task-url="${taskUrl || '#'}">Go →</button>`;

      return `<article class="card task-row" data-task="${task.id}">
        <span class="task-ico" ${icoStyle}>${task.icon}</span>
        <div class="task-body">
          <div class="task-label">${task.label}</div>
          <div class="task-sublabel" style="font-size:10px;color:var(--muted);letter-spacing:.4px;margin-top:1px;">${task.sublabel || ''}</div>
          <div class="task-reward">${rewardLabel}</div>
        </div>
        <div class="task-action">${btn}</div>
      </article>`;
    }).join('');

    el.innerHTML = rows;

    el.querySelectorAll('.task-go').forEach(btn => {
      btn.addEventListener('click', () => startTask(btn.dataset.taskId, btn.dataset.taskUrl));
    });
  };

  const startTask = (taskId, taskUrl) => {
    /* Open the external link */
    try {
      const tgWA = window.Telegram && window.Telegram.WebApp;
      if (tgWA && tgWA.openTelegramLink && taskUrl.includes('t.me')) {
        tgWA.openTelegramLink(taskUrl);
      } else if (tgWA && tgWA.openLink) {
        tgWA.openLink(taskUrl);
      } else {
        window.open(taskUrl, '_blank');
      }
    } catch (_) {}

    /* Switch button to countdown */
    const art = document.querySelector(`[data-task="${taskId}"]`);
    if (!art) return;
    const btn = art.querySelector('.task-go');
    if (!btn) return;

    btn.classList.replace('task-go', 'task-pending');
    btn.disabled = true;
    btn.textContent = 'Wait 10s…';

    let countdown = 10;
    pendingTimers[taskId] = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        btn.textContent = `Wait ${countdown}s…`;
      } else {
        clearInterval(pendingTimers[taskId]);
        btn.classList.replace('task-pending', 'task-check');
        btn.disabled = false;
        btn.textContent = 'Verify ✓';
        btn.onclick = () => verifyTask(taskId);
      }
    }, 1000);
  };

  const verifyTask = async (taskId) => {
    const art = document.querySelector(`[data-task="${taskId}"]`);
    const btn = art ? art.querySelector('.task-check, .task-go') : null;
    if (btn) { btn.disabled = true; btn.textContent = '…'; }

    const u = tgUser();
    if (!u || !u.id) {
      /* Offline credit */
      const done = completedTasks();
      if (!done.includes(taskId)) {
        const task = SOCIAL_TASKS.find(t => t.id === taskId);
        done.push(taskId);
        localStorage.setItem('real_completed_tasks', JSON.stringify(done));
        if (window.RealPlayer && task) {
          window.RealPlayer.addResource('real', task.reward_real || 0);
          if (task.reward_gems) window.RealPlayer.addResource('gems', task.reward_gems);
        }
        showToast('Task completed!');
        fireBurst('Task Completed!');
      }
      const refCode = localStorage.getItem('real_referral_code') || '';
      const shareUrl = 'https://t.me/shahnameh_bot?start=' + (refCode || 'warrior_guest');
      renderSocialTasks(shareUrl);
      return;
    }

    const data = await post('/api/season2/earn/complete-task', {
      telegram_id: String(u.id),
      task_id: taskId,
    });

    if (!data || data.status !== 1) {
      if (data && data.error === 'already_completed') {
        const done = completedTasks();
        if (!done.includes(taskId)) done.push(taskId);
        localStorage.setItem('real_completed_tasks', JSON.stringify(done));
        showToast('Already claimed!');
      } else {
        showToast('Could not verify. Try again.');
        if (btn) { btn.disabled = false; btn.textContent = 'Verify ✓'; }
        return;
      }
    } else {
      localStorage.setItem('real_completed_tasks', JSON.stringify(data.completed_tasks || []));
      if (window.RealPlayer) {
        window.RealPlayer.addResource('real', data.rewards.real || 0);
        if (data.rewards.gems) window.RealPlayer.addResource('gems', data.rewards.gems);
        if (data.rewards.farr) window.RealPlayer.addResource('farr', data.rewards.farr);
        if (window.RealSync) window.RealSync.syncBalance();
        /* Notify all views (heroes, tap, home) of the new balance */
        try {
          const p = window.RealPlayer.get();
          window.dispatchEvent(new CustomEvent('shahnama:state_sync', { detail: p }));
          window.dispatchEvent(new CustomEvent('balanceUpdate'));
        } catch (_) {}
      }
      const task = SOCIAL_TASKS.find(t => t.id === taskId);
      showToast(`Task complete! +${(task && task.reward_real) || 0} ◆`);
      fireBurst('Task Complete!');
    }

    const refCode  = localStorage.getItem('real_referral_code') || '';
    const shareUrl = 'https://t.me/shahnameh_bot?start=' + (refCode || 'warrior_guest');
    renderSocialTasks(shareUrl);
  };

  /* ── Partners ────────────────────────────────────────────────────────── */
  const renderPartners = () => {
    const el = document.getElementById('partners');
    if (!el) return;

    const done = completedTasks();

    const rows = PARTNERS.map(p => {
      const isDone = done.includes(p.id);
      const rewardParts = [];
      if (p.reward_real) rewardParts.push(`+${p.reward_real} ◆`);
      if (p.reward_gems) rewardParts.push(`+${p.reward_gems} 💎`);
      if (p.reward_farr) rewardParts.push(`+${p.reward_farr} ✦`);
      const rewardLabel = rewardParts.join(' · ');

      const btn = isDone
        ? `<button class="task-btn task-done" disabled>✓ Claimed</button>`
        : `<button class="task-btn task-go" data-partner-id="${p.id}" data-partner-url="${p.url}">Join & Earn</button>`;

      return `<article class="card task-row partner-row" data-partner="${p.id}">
        <span class="task-ico">${p.icon}</span>
        <div class="task-body">
          <div class="task-label">${p.label}</div>
          <div class="task-reward">${p.desc}</div>
          <div class="task-reward" style="color:var(--gold);margin-top:3px;">${rewardLabel}</div>
        </div>
        <div class="task-action">${btn}</div>
      </article>`;
    }).join('');

    el.innerHTML = rows;

    el.querySelectorAll('.task-go[data-partner-id]').forEach(btn => {
      btn.addEventListener('click', () => startPartner(btn.dataset.partnerId, btn.dataset.partnerUrl));
    });
  };

  const startPartner = (partnerId, url) => {
    try {
      const tgWA = window.Telegram && window.Telegram.WebApp;
      if (tgWA && tgWA.openTelegramLink && url.includes('t.me')) {
        tgWA.openTelegramLink(url);
      } else if (tgWA && tgWA.openLink) {
        tgWA.openLink(url);
      } else {
        window.open(url, '_blank');
      }
    } catch (_) {}

    const art = document.querySelector(`[data-partner="${partnerId}"]`);
    if (!art) return;
    const btn = art.querySelector('.task-go');
    if (!btn) return;

    btn.classList.replace('task-go', 'task-pending');
    btn.disabled = true;
    btn.textContent = 'Wait 10s…';

    let countdown = 10;
    const tid = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        btn.textContent = `Wait ${countdown}s…`;
      } else {
        clearInterval(tid);
        btn.classList.replace('task-pending', 'task-check');
        btn.disabled = false;
        btn.textContent = 'Verify ✓';
        btn.onclick = () => verifyPartner(partnerId);
      }
    }, 1000);
  };

  const verifyPartner = async (partnerId) => {
    const art = document.querySelector(`[data-partner="${partnerId}"]`);
    const btn = art ? art.querySelector('.task-check') : null;
    if (btn) { btn.disabled = true; btn.textContent = '…'; }

    const u = tgUser();
    if (!u || !u.id) {
      const done = completedTasks();
      if (!done.includes(partnerId)) {
        const p = PARTNERS.find(x => x.id === partnerId);
        done.push(partnerId);
        localStorage.setItem('real_completed_tasks', JSON.stringify(done));
        if (window.RealPlayer && p) {
          window.RealPlayer.addResource('real', p.reward_real || 0);
          if (p.reward_gems) window.RealPlayer.addResource('gems', p.reward_gems);
          if (p.reward_farr) window.RealPlayer.addResource('farr', p.reward_farr);
        }
        showToast('Partner reward claimed!');
        fireBurst('Partner Reward!');
      }
      renderPartners();
      return;
    }

    const data = await post('/api/season2/earn/complete-task', {
      telegram_id: String(u.id),
      task_id: partnerId,
    });

    if (!data || data.status !== 1) {
      if (data && data.error === 'already_completed') {
        const done = completedTasks();
        if (!done.includes(partnerId)) done.push(partnerId);
        localStorage.setItem('real_completed_tasks', JSON.stringify(done));
        showToast('Already claimed!');
      } else {
        showToast('Could not verify. Try again.');
        if (btn) { btn.disabled = false; btn.textContent = 'Verify ✓'; }
        return;
      }
    } else {
      localStorage.setItem('real_completed_tasks', JSON.stringify(data.completed_tasks || []));
      if (window.RealPlayer) {
        window.RealPlayer.addResource('real', data.rewards.real || 0);
        if (data.rewards.gems) window.RealPlayer.addResource('gems', data.rewards.gems);
        if (data.rewards.farr) window.RealPlayer.addResource('farr', data.rewards.farr);
        if (window.RealSync) window.RealSync.syncBalance();
      }
      const p = PARTNERS.find(x => x.id === partnerId);
      const earned = p ? [
        p.reward_real ? `+${p.reward_real} ◆` : '',
        p.reward_gems ? `+${p.reward_gems} 💎` : '',
        p.reward_farr ? `+${p.reward_farr} ✦` : '',
      ].filter(Boolean).join(' ') : '';
      showToast(`Partner reward! ${earned}`);
      fireBurst('Partner Reward!');
    }

    renderPartners();
  };

  /* ── Invite link ─────────────────────────────────────────────────────── */
  const bootInviteLink = (u) => {
    const refCode  = localStorage.getItem('real_referral_code') || (u ? 'warrior_' + u.id : '');
    const botUrl   = 'https://t.me/shahnameh_bot?start=' + (refCode || 'warrior_guest');
    const linkEl   = document.querySelector('[data-link]');
    const shareBtn = document.querySelector('[data-share]');
    const copyBtn  = document.querySelector('[data-copy-link]');

    if (linkEl) linkEl.textContent = botUrl;
    if (copyBtn) copyBtn.setAttribute('data-copy-link', botUrl);

    const doCopy = () => {
      try { navigator.clipboard.writeText(botUrl); } catch (_) {}
      showToast('Link copied!');
    };

    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        try {
          const tgWA = window.Telegram && window.Telegram.WebApp;
          if (tgWA && tgWA.openTelegramLink) {
            tgWA.openTelegramLink(
              'https://t.me/share/url?url=' + encodeURIComponent(botUrl)
              + '&text=' + encodeURIComponent('Join me on REAL Shahnameh — The Book of Kings!')
            );
          } else { doCopy(); }
        } catch (_) { doCopy(); }
      });
    }
    if (copyBtn) copyBtn.addEventListener('click', doCopy);
    return botUrl;
  };

  /* ── Team multiplier + referral counter UI ───────────────────────────── */
  const applyTeamMultUI = (verifiedCount) => {
    const teamMult = Math.min(2.0, 1 + verifiedCount * 0.04);
    const multStr  = teamMult.toFixed(2);
    localStorage.setItem('real_team_mult', multStr);

    const multEl  = document.querySelector('[data-team-mult]');
    const refEl   = document.querySelector('[data-referrals]');
    const barFill = document.querySelector('[data-team-bar]');
    if (multEl)  multEl.textContent  = multStr;
    if (refEl)   refEl.textContent   = verifiedCount;
    if (barFill) barFill.style.width = Math.min(100, verifiedCount) + '%';
  };

  /* ── Milestone rendering ─────────────────────────────────────────────── */
  const renderMilestones = (verifiedCount, claimed) => {
    document.querySelectorAll('[data-milestone]').forEach(art => {
      const threshold  = parseInt(art.dataset.milestone, 10);
      const ms         = MILESTONES.find(m => m.threshold === threshold);
      if (!ms) return;

      const progress    = Math.min(threshold, verifiedCount);
      const pct         = Math.round((progress / threshold) * 100);
      const isClaimed   = claimed.includes(threshold);
      const isReachable = verifiedCount >= threshold && !isClaimed;

      const progressEl = art.querySelector('[data-ms-progress]');
      if (progressEl) {
        progressEl.textContent = isClaimed
          ? threshold + ' / ' + threshold + ' — Reward claimed ✓'
          : progress + ' / ' + threshold + (isReachable ? ' — Claim your reward!' : '');
      }

      const fill = art.querySelector('.mini-bar .fill');
      if (fill) fill.style.width = pct + '%';

      art.classList.toggle('done',         isClaimed);
      art.classList.toggle('ms-reachable', isReachable);

      let claimBtn = art.querySelector('.ms-claim-btn');
      if (isReachable) {
        if (!claimBtn) {
          claimBtn = document.createElement('button');
          claimBtn.className = 'ms-claim-btn primary-btn';
          claimBtn.textContent = 'Claim ›';
          art.appendChild(claimBtn);
        }
        claimBtn.onclick = () => claimMilestone(threshold);
      } else if (claimBtn) {
        claimBtn.remove();
      }
    });
  };

  const claimMilestone = async (threshold) => {
    const u = tgUser();
    if (!u || !u.id) { showToast('Open via Telegram to claim'); return; }

    const data = await post('/api/season2/social/claim-milestone', {
      telegram_id: String(u.id), milestone: threshold,
    });

    if (!data || data.status !== 1) {
      const msg = data && data.error === 'already_claimed' ? 'Already claimed!'
        : (data && data.error === 'not_reached' ? 'Not reached yet.' : 'Could not claim. Try again.');
      showToast(msg);
      return;
    }

    const newClaimed = data.milestones_claimed || [];
    localStorage.setItem('real_milestones_claimed', JSON.stringify(newClaimed));

    if (window.RealPlayer) {
      window.RealPlayer.addResource('real', data.rewards.real  || 0);
      window.RealPlayer.addResource('gems', data.rewards.gems  || 0);
      if (data.rewards.farr) window.RealPlayer.addResource('farr', data.rewards.farr);
      if (window.RealSync) window.RealSync.syncBalance();
    }

    /* ── Persist extra milestone assets ── */
    const ms = MILESTONES.find(m => m.threshold === threshold);
    if (ms) {
      try {
        /* Vault: chest item */
        if (ms.chest) {
          const items = JSON.parse(localStorage.getItem('real_items_v1') || '{}');
          items[ms.chest] = true;
          localStorage.setItem('real_items_v1', JSON.stringify(items));
        }
        /* Hero unlock flag */
        if (ms.hero_unlock) {
          localStorage.setItem(`real_hero_unlock_${ms.hero_unlock}`, '1');
        }
        /* Airdrop multiplier asset */
        if (ms.multiplier_asset) {
          localStorage.setItem(`real_asset_${ms.multiplier_asset}`, '1');
        }
        /* Profile badge */
        if (ms.badge) {
          localStorage.setItem(`real_badge_${ms.badge}`, '1');
          /* Also push into Player badges array */
          if (window.RealPlayer) {
            const p = window.RealPlayer.get();
            const badges = Array.from(new Set([...(p.badges || []), ms.badge]));
            window.RealPlayer.set({ badges });
          }
        }
      } catch (_) {}
      /* Dispatch balance + state-sync so all views (including heroes.html)
         immediately reflect the new REAL balance without a page reload. */
      try { window.dispatchEvent(new CustomEvent('balanceUpdate')); } catch (_) {}
      try {
        const p = window.RealPlayer ? window.RealPlayer.get() : {};
        window.dispatchEvent(new CustomEvent('shahnama:state_sync', { detail: p }));
      } catch (_) {}
    }

    const r = data.rewards;
    const msLabel = ms ? ms.label : '';
    const earned = [
      r.real ? `+${r.real} ◆` : '',
      r.gems ? `+${r.gems} 💎` : '',
      r.farr ? `+${r.farr} ✦` : '',
    ].filter(Boolean).join(' · ');
    showToast(msLabel || `Milestone! ${earned}`);
    fireBurst(`${threshold} Warriors!`);

    const verifiedCount = parseInt(localStorage.getItem('real_verified_referral_count') || '0', 10);
    renderMilestones(verifiedCount, newClaimed);
  };

  /* ── Season standing card ────────────────────────────────────────────── */
  const updateSeasonStanding = () => {
    const xp       = parseInt(localStorage.getItem('real_xp') || '0', 10)
                  || (window.RealPlayer ? (window.RealPlayer.getResource('xp') || 0) : 0);
    const refs     = parseInt(localStorage.getItem('real_verified_referral_count') || '0', 10);
    const streak   = parseInt(localStorage.getItem('real_checkin_streak') || '0', 10);
    const score    = xp + refs * 200 + streak * 100;
    const pct      = Math.min(99, Math.round(score / 200));

    const pctEl    = document.getElementById('season-score-pct');
    const valEl    = document.getElementById('season-score-val');
    const meter    = document.querySelector('.airdrop-meter');

    if (pctEl) pctEl.textContent = pct + '%';
    if (valEl) valEl.textContent = score.toLocaleString() + ' pts';
    if (meter) {
      meter.style.background =
        `conic-gradient(var(--gold) ${pct * 3.6}deg, rgba(255,255,255,.06) 0deg)`;
    }
  };

  /* ── Adsgram Watch & Earn ────────────────────────────────────────────── */
  const AD_TIERS = ['bronze', 'silver', 'gold'];

  /* Countdown timers per tier (for the cooldown display) */
  const adCdIntervals = {};

  const updateAdButton = (tier) => {
    const btn = document.querySelector(`[data-ad-trigger="${tier}"]`);
    const cdEl = document.getElementById('cd-' + tier);
    if (!btn) return;

    const svc = window.RealAdService;
    if (!svc) {
      btn.disabled = true;
      btn.textContent = 'Loading…';
      return;
    }

    const cfg = svc.getTierConfig();
    const tierCfg = cfg && cfg[tier];

    /* Not configured yet — grey out silently */
    if (!tierCfg || !tierCfg.blockId) {
      btn.disabled = true;
      btn.textContent = 'Soon';
      if (cdEl) { cdEl.hidden = true; cdEl.textContent = ''; }
      return;
    }

    const remaining = svc.getCooldowns()[tier] || 0;
    if (remaining > 0) {
      btn.disabled = true;
      btn.textContent = 'Watch';
      if (cdEl) {
        cdEl.hidden = false;
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        cdEl.textContent = 'Ready in ' + (mins > 0 ? mins + 'm ' : '') + secs + 's';
      }
    } else {
      btn.disabled = false;
      btn.textContent = 'Watch';
      if (cdEl) { cdEl.hidden = true; cdEl.textContent = ''; }
    }
  };

  const startCooldownTick = (tier) => {
    clearInterval(adCdIntervals[tier]);
    adCdIntervals[tier] = setInterval(() => {
      const rem = (window.RealAdService && window.RealAdService.getCooldowns()[tier]) || 0;
      updateAdButton(tier);
      if (rem <= 0) clearInterval(adCdIntervals[tier]);
    }, 1000);
  };

  const handleAdResult = (tier, result) => {
    const r = result.rewards || {};
    const parts = [];
    if (r.real)   parts.push('+' + r.real + ' ◆');
    if (r.gems)   parts.push('+' + r.gems + ' 💎');
    if (r.farr)   parts.push('+' + r.farr + ' ✦');
    if (r.energy) parts.push('⚡ Energy filled!');
    const label = parts.join(' · ') || 'Reward earned!';
    showToast(label);
    fireBurst(label);
    startCooldownTick(tier);
    updateAdButton(tier);
  };

  const handleAdError = (tier, err) => {
    if (err.type === 'cooldown') {
      showToast('Please wait before watching another ad.');
      startCooldownTick(tier);
    } else if (err.type === 'not_configured') {
      showToast('Ads not available yet.');
    } else if (err.type === 'sdk_missing') {
      showToast('Ad SDK not loaded. Try refreshing.');
    } else if (err.type === 'skipped') {
      showToast('Ad skipped — no reward.');
    } else {
      showToast('Ad unavailable. Try again later.');
    }
    updateAdButton(tier);
  };

  const bootAdsgram = () => {
    /* Initial state update */
    AD_TIERS.forEach(tier => {
      updateAdButton(tier);
      /* If already in cooldown from a previous session, tick it */
      const rem = (window.RealAdService && window.RealAdService.getCooldowns()[tier]) || 0;
      if (rem > 0) startCooldownTick(tier);
    });

    /* Wire click handlers */
    AD_TIERS.forEach(tier => {
      const btn = document.querySelector(`[data-ad-trigger="${tier}"]`);
      if (!btn) return;
      btn.addEventListener('click', () => {
        if (!window.RealAdService) { showToast('Ad service not ready.'); return; }
        btn.disabled = true;
        btn.textContent = 'Loading Ad…';
        window.RealAdService.showAd(tier)
          .then(result => handleAdResult(tier, result))
          .catch(err   => handleAdError(tier, err));
      });
    });
  };

  /* ── Boot ────────────────────────────────────────────────────────────── */
  const boot = async () => {
    const u = tgUser();
    const shareUrl = bootInviteLink(u);

    /* Render with cached data immediately */
    renderCheckin();
    renderSocialTasks(shareUrl);
    renderPartners();
    bootAdsgram();
    updateSeasonStanding();

    const cachedVerified = parseInt(localStorage.getItem('real_verified_referral_count') || '0', 10);
    const cachedClaimed  = (() => { try { return JSON.parse(localStorage.getItem('real_milestones_claimed') || '[]'); } catch { return []; } })();
    applyTeamMultUI(cachedVerified);
    renderMilestones(cachedVerified, cachedClaimed);

    if (!u || !u.id) return;

    /* Fetch live referral count */
    const data = await post('/api/season2/social/referrals', { telegram_id: String(u.id) });
    if (data && data.status === 1) {
      const verifiedCount = data.verified_count || 0;
      localStorage.setItem('real_verified_referral_count', String(verifiedCount));
      try { window.dispatchEvent(new CustomEvent('real:referral:update')); } catch (_) {}
      applyTeamMultUI(verifiedCount);
      const claimed = (() => { try { return JSON.parse(localStorage.getItem('real_milestones_claimed') || '[]'); } catch { return []; } })();
      renderMilestones(verifiedCount, claimed);
      updateSeasonStanding();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
