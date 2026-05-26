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

  const SOCIAL_TASKS = [
    {
      id: 'follow_telegram',
      label: 'Follow Official Channel',
      icon: '📣',
      url: 'https://t.me/real_shahnameh',
      reward_real: 300, reward_gems: 0,
    },
    {
      id: 'join_channel',
      label: 'Join REAL Updates',
      icon: '📰',
      url: 'https://t.me/realshahnameh',
      reward_real: 200, reward_gems: 0,
    },
    {
      id: 'follow_twitter',
      label: 'Follow on X / Twitter',
      icon: '🐦',
      url: 'https://x.com/RealShahnameh',
      reward_real: 150, reward_gems: 2,
    },
    {
      id: 'share_story',
      label: 'Share Your Chronicle',
      icon: '📜',
      url: '', // set dynamically from invite link
      reward_real: 250, reward_gems: 1,
    },
  ];

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
    { threshold: 3,   real: 500,   gems: 1,  farr: 0 },
    { threshold: 10,  real: 2000,  gems: 3,  farr: 0 },
    { threshold: 25,  real: 5000,  gems: 5,  farr: 1 },
    { threshold: 100, real: 15000, gems: 10, farr: 2 },
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

    const rows = SOCIAL_TASKS.map(task => {
      const isDone = done.includes(task.id);
      const taskUrl = task.id === 'share_story' ? shareUrl : task.url;
      const rewardLabel = task.reward_real
        ? `+${task.reward_real} ◆${task.reward_gems ? ' · +' + task.reward_gems + ' 💎' : ''}`
        : (task.reward_gems ? `+${task.reward_gems} 💎` : '');

      const btn = isDone
        ? `<button class="task-btn task-done" disabled>✓ Claimed</button>`
        : `<button class="task-btn task-go" data-task-id="${task.id}" data-task-url="${taskUrl || '#'}">Go →</button>`;

      return `<article class="card task-row" data-task="${task.id}">
        <span class="task-ico">${task.icon}</span>
        <div class="task-body">
          <div class="task-label">${task.label}</div>
          <div class="task-reward">${rewardLabel}</div>
        </div>
        <div class="task-action">${btn}</div>
      </article>`;
    }).join('');

    el.innerHTML = rows;

    /* Attach click handlers */
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

    const r = data.rewards;
    const earned = [
      r.real ? `+${r.real} ◆` : '',
      r.gems ? `+${r.gems} 💎` : '',
      r.farr ? `+${r.farr} ✦` : '',
    ].filter(Boolean).join(' · ');
    showToast(`Milestone! ${earned}`);
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

  /* ── Boot ────────────────────────────────────────────────────────────── */
  const boot = async () => {
    const u = tgUser();
    const shareUrl = bootInviteLink(u);

    /* Render with cached data immediately */
    renderCheckin();
    renderSocialTasks(shareUrl);
    renderPartners();
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
