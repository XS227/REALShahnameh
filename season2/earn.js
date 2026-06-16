/* ==========================================================================
   REAL Shahnameh — Season 2 Earn Page (earn.js)
   Daily check-in · Social tasks · Partners · Live referrals · Milestones
   ========================================================================== */
(function () {
  'use strict';
  const RT = '<img src="/assets/images/tokens/realtoken.png" alt="REAL" class="real-tok-img" onerror="this.outerHTML=\'◆\'">';

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

  const t = (k, v) => (window.RealI18N && window.RealI18N.t(k, v)) || k;
  const fmtN = (n) => (window.RealI18N && window.RealI18N.compactNumber) ? window.RealI18N.compactNumber(n) : String(Number(n) || 0);

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

  /* ── Coin burst particle animation ──────────────────────────────────── */
  const spawnCoinBurst = (sourceEl, amount) => {
    const rect   = sourceEl ? sourceEl.getBoundingClientRect() : null;
    const startX = rect ? rect.left + rect.width  / 2 : window.innerWidth  / 2;
    const startY = rect ? rect.top  + rect.height / 2 : window.innerHeight / 2;
    const count  = Math.min(14, Math.max(6, Math.floor(amount / 1000) + 6));

    for (let i = 0; i < count; i++) {
      const coin = document.createElement('span');
      coin.textContent = '◆';
      coin.style.cssText = [
        'position:fixed',
        `left:${startX}px`,
        `top:${startY}px`,
        'font-size:15px',
        'color:#f4c56b',
        'pointer-events:none',
        'z-index:9998',
        'font-weight:900',
        'text-shadow:0 0 8px rgba(244,197,107,.9)',
        'will-change:transform,opacity',
      ].join(';');
      document.body.appendChild(coin);

      const spreadAngle = (Math.PI * 0.7);
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * spreadAngle;
      const dist  = 80 + Math.random() * 100;
      const endX  = startX + Math.cos(angle) * dist;
      const endY  = Math.max(16, startY - 150 - Math.random() * 80);

      coin.animate([
        { transform: 'translate(0,0) scale(0.4)',                               opacity: 0 },
        { transform: `translate(${endX - startX}px,${endY - startY}px) scale(1.3)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${endX - startX}px,${endY - startY - 30}px) scale(0.2)`, opacity: 0 },
      ], {
        duration: 850 + Math.random() * 350,
        delay:    i * 45,
        easing:   'cubic-bezier(.22,1,.36,1)',
        fill:     'forwards',
      });

      setTimeout(() => coin.remove(), 1500 + i * 50);
    }
  };

  /* ── Premium reward modal ────────────────────────────────────────────── */
  const showRewardModal = (amount, sublabel) => {
    const existing = document.getElementById('earn-reward-modal');
    if (existing) existing.remove();

    /* Inject keyframe once */
    if (!document.getElementById('erm-style')) {
      const s = document.createElement('style');
      s.id = 'erm-style';
      s.textContent = '@keyframes erm-in{from{transform:scale(.82) translateY(12px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}';
      document.head.appendChild(s);
    }

    const fmtA = (n) => (window.RealI18N && window.RealI18N.compactNumber) ? window.RealI18N.compactNumber(n) : String(n);

    const overlay = document.createElement('div');
    overlay.id = 'earn-reward-modal';
    overlay.style.cssText = [
      'position:fixed;inset:0;z-index:9995',
      'display:flex;align-items:center;justify-content:center',
      'background:rgba(4,5,11,.86)',
      'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)',
      'opacity:0;transition:opacity .22s ease',
    ].join(';');

    overlay.innerHTML = `
      <div style="
        text-align:center;max-width:270px;
        padding:30px 22px;
        background:linear-gradient(158deg,#141f3a 0%,#04050b 100%);
        border:1px solid rgba(244,197,107,.5);
        border-radius:22px;
        box-shadow:0 0 60px rgba(244,197,107,.18),0 24px 64px rgba(0,0,0,.65);
        animation:erm-in .4s cubic-bezier(.2,.9,.2,1) both;
      ">
        <div style="font-size:46px;line-height:1;margin-bottom:12px;filter:drop-shadow(0 0 22px rgba(244,197,107,.75));">⚔</div>
        <h3 style="
          margin:0 0 4px;font-size:18px;font-weight:900;letter-spacing:.3px;
          background:linear-gradient(118deg,#fff 0%,#ffe8c0 55%,#f4c56b 100%);
          -webkit-background-clip:text;background-clip:text;color:transparent;">
          Treasure Secured!
        </h3>
        <div style="font-size:30px;font-weight:900;color:#f4c56b;margin:10px 0;
          text-shadow:0 0 28px rgba(244,197,107,.55);">
          +${fmtA(amount)} ${RT} REAL
        </div>
        <p style="font-size:12px;color:var(--muted,#6c7287);margin:0;">added to your Treasury</p>
        ${sublabel ? `<div style="font-size:10px;color:rgba(244,197,107,.55);margin-top:7px;letter-spacing:.5px;">${sublabel}</div>` : ''}
      </div>`;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => { requestAnimationFrame(() => { overlay.style.opacity = '1'; }); });

    try { if (navigator.vibrate) navigator.vibrate([10, 4, 14, 4, 24]); } catch (_) {}

    const dismiss = () => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 220);
    };
    overlay.addEventListener('click', dismiss);
    setTimeout(dismiss, 2600);
  };

  /* ── Task-specific reward modal ─────────────────────────────────────── */
  const showTaskRewardModal = (platformThanks, real, gems, farr) => {
    const existing = document.getElementById('task-reward-modal');
    if (existing) existing.remove();

    if (!document.getElementById('trm-style')) {
      const s = document.createElement('style');
      s.id = 'trm-style';
      s.textContent = '@keyframes trm-in{from{transform:scale(.82) translateY(16px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}';
      document.head.appendChild(s);
    }

    const fmtA = (n) => (window.RealI18N && window.RealI18N.compactNumber) ? window.RealI18N.compactNumber(n) : String(n);

    const rewardLines = [];
    if (real)  rewardLines.push(`<div class="trm-amount">+${fmtA(real)} ${RT} ${t('currency_name','REAL')}</div>`);
    if (gems)  rewardLines.push(`<div class="trm-bonus">+${gems} 💎 ${t('r_gems','Gems')}</div>`);
    if (farr)  rewardLines.push(`<div class="trm-bonus">+${farr} ✦ Farr</div>`);

    const overlay = document.createElement('div');
    overlay.id = 'task-reward-modal';
    overlay.style.cssText = [
      'position:fixed;inset:0;z-index:9996',
      'display:flex;align-items:center;justify-content:center',
      'background:rgba(4,5,11,.88)',
      'backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)',
      'opacity:0;transition:opacity .22s ease',
    ].join(';');

    overlay.innerHTML = `
      <div style="
        text-align:center;max-width:290px;width:90%;
        padding:32px 24px 28px;
        background:linear-gradient(158deg,#0f1d3a 0%,#04050b 100%);
        border:1px solid rgba(244,197,107,.45);
        border-radius:24px;
        box-shadow:0 0 70px rgba(244,197,107,.15),0 28px 72px rgba(0,0,0,.7);
        animation:trm-in .38s cubic-bezier(.2,.9,.2,1) both;">
        <div style="font-size:52px;line-height:1;margin-bottom:14px;filter:drop-shadow(0 0 24px rgba(244,197,107,.7));">⚔</div>
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(244,197,107,.6);margin-bottom:6px;">${t('reward_secured_lbl','Reward Secured')}</div>
        <h3 style="margin:0 0 8px;font-size:17px;font-weight:900;
          background:linear-gradient(118deg,#fff 0%,#ffe8c0 55%,#f4c56b 100%);
          -webkit-background-clip:text;background-clip:text;color:transparent;">
          Thank you!
        </h3>
        <p style="font-size:13px;color:rgba(220,220,235,.75);margin:0 0 18px;line-height:1.5;">
          ${t('loyalty_msg',{platform: platformThanks})}
        </p>
        ${rewardLines.join('')}
        <p style="font-size:11px;color:rgba(180,180,210,.5);margin:16px 0 0;">
          Added to your Treasury · Tap anywhere to close
        </p>
      </div>`;

    overlay.style.cssText += ';cursor:pointer;';
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { requestAnimationFrame(() => { overlay.style.opacity = '1'; }); });

    try { if (navigator.vibrate) navigator.vibrate([12, 4, 18, 4, 28]); } catch (_) {}

    const dismiss = () => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 220);
    };
    overlay.addEventListener('click', dismiss);
    setTimeout(dismiss, 4000);
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

  const SOCIAL_TASKS = () => [
    {
      id: 'follow_tg_channel',
      platform: 'telegram',
      label: t('social_task_channel','Follow Official Channel'),
      sublabel: '@Shahnameh_news',
      icon: '✈',
      url: 'https://t.me/Shahnameh_news',
      reward_real: 2500, reward_gems: 0,
    },
    {
      id: 'join_tg_support',
      platform: 'telegram',
      label: t('social_task_community','Join Persian Community'),
      sublabel: '@shahnameh_persian',
      icon: '✈',
      url: 'https://t.me/shahnameh_persian',
      reward_real: 2500, reward_gems: 0,
    },
    {
      id: 'follow_x',
      platform: 'x',
      label: t('social_task_x','Follow on X'),
      sublabel: '@shahnamehgamefi',
      icon: '𝕏',
      url: 'https://x.com/shahnamehgamefi',
      reward_real: 3000, reward_gems: 0,
    },
    {
      id: 'follow_tiktok',
      platform: 'tiktok',
      label: t('social_task_tiktok','Follow REAL Page'),
      sublabel: '@shahnamehgamefi227',
      icon: '♬',
      url: 'https://www.tiktok.com/@shahnamehgamefi227',
      reward_real: 2000, reward_gems: 0,
    },
    {
      id: 'subscribe_youtube',
      platform: 'youtube',
      label: t('social_task_youtube','Subscribe to Channel'),
      sublabel: '@shahnamehgamefi',
      icon: '▶',
      url: 'https://youtube.com/@shahnamehgamefi',
      reward_real: 3000, reward_gems: 0,
    },
    {
      id: 'like_dyor',
      platform: 'dyor',
      label: t('social_task_dyor','Like the DApp on DYOR.io'),
      sublabel: 'games/shahnameh',
      icon: '👍',
      url: 'https://dyor.io/dapps/games/shahnameh',
      reward_real: 3000, reward_gems: 0,
    },
  ];
  /* Total: 2500+2500+3000+2000+3000+3000 = 16,000 REAL */

  const PARTNERS = () => [
    {
      id: 'partner_tonkeeper',
      label: t('social_task_tonkeeper','Tonkeeper Wallet'),
      desc: 'The leading TON wallet',
      icon: '💎',
      url: 'https://t.me/tonkeeper',
      reward_real: 500, reward_gems: 0, reward_farr: 0,
    },
    {
      id: 'partner_blum',
      label: t('social_task_blum','Blum'),
      desc: 'Trade & earn on Blum',
      icon: '🌸',
      url: 'https://t.me/BlumCryptoBot',
      reward_real: 300, reward_gems: 2, reward_farr: 0,
    },
    {
      id: 'partner_nft_real',
      label: t('social_task_nft','REAL NFT — Early Access'),
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
      labelKey: 'milestone_1k',
    },
    {
      threshold: 10,
      real: 3000, gems: 0, farr: 0,
      hero_unlock: 'commander_card',
      labelKey: 'milestone_3k',
    },
    {
      threshold: 25,
      real: 8000, gems: 0, farr: 0,
      multiplier_asset: 'airdrop_multiplier_s2',
      labelKey: 'milestone_8k',
    },
    {
      threshold: 100,
      real: 25000, gems: 0, farr: 0,
      badge: 'shahnameh_immortals',
      labelKey: 'milestone_25k',
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
      const rewardTxt = fmtN(r.real);
      const gem     = r.gems ? ' +💎' : '';
      const past    = streak >= dayNum;
      const active  = !claimed && (dayNum === nextStreak);
      const cls     = past ? 'ci-day ci-done' : (active ? 'ci-day ci-active' : 'ci-day');
      const ico     = past ? '✓' : (active ? '★' : dayNum);
      return `<div class="${cls}">
        <div class="ci-ico">${ico}</div>
        <div class="ci-lbl">${t('checkin_day_lbl',{n:dayNum})}</div>
        <div class="ci-val">${rewardTxt}${RT}${gem}</div>
      </div>`;
    }).join('');

    const btnLabel = claimed
      ? t('checkin_btn_done')
      : `${t('checkin_btn_claim',{n:nextStreak})} · +${fmtN(nextReward.real)} ${RT}${nextReward.gems ? ' +💎' : ''}` ;

    el.innerHTML = `
      <article class="card checkin-card">
        <div class="checkin-top">
          <div class="checkin-streak">
            <span class="ci-streak-num">${streak}</span>
            <span class="ci-streak-lbl">${t('checkin_streak_lbl')}</span>
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

  /* In-memory cache of completed tasks — authoritative once server confirms */
  let _completedTasksCache = null;

  const completedTasks = () => {
    if (_completedTasksCache !== null) return _completedTasksCache;
    try { return JSON.parse(localStorage.getItem('real_completed_tasks') || '[]'); }
    catch { return []; }
  };

  const setCompletedTasks = (list) => {
    _completedTasksCache = list;
    try { localStorage.setItem('real_completed_tasks', JSON.stringify(list)); } catch (_) {}
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

    const rows = SOCIAL_TASKS().map(task => {
      const isDone  = done.includes(task.id);
      const taskUrl = task.url;
      const brand   = PLATFORM_BRAND[task.platform] || {};
      const icoStyle = brand.bg
        ? `style="background:${brand.bg};border:1px solid ${brand.border};color:${brand.color}"`
        : '';
      const rewardLabel = task.reward_real
        ? `+${pd(task.reward_real)} ${RT}`
        : '';

      const btn = isDone
        ? `<button class="task-btn task-done" disabled>${t('task_btn_claimed')}</button>`
        : `<button class="task-btn task-go" data-task-id="${task.id}" data-task-url="${taskUrl || '#'}">${t('task_btn_go')}</button>`;

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
    btn.textContent = t('task_btn_wait',{n:10});

    let countdown = 10;
    pendingTimers[taskId] = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        btn.textContent = t('task_btn_wait',{n:countdown});
      } else {
        clearInterval(pendingTimers[taskId]);
        btn.classList.replace('task-pending', 'task-check');
        btn.disabled = false;
        btn.textContent = t('task_btn_verify');
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
        const task = SOCIAL_TASKS().find(t => t.id === taskId);
        done.push(taskId);
        setCompletedTasks(done);
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
        /* Task was done on another device or in a previous session —
           sync it locally so this page reflects reality. */
        const done = completedTasks();
        if (!done.includes(taskId)) done.push(taskId);
        setCompletedTasks(done);
        showToast('✓ Already claimed — your reward is in your wallet.');
      } else {
        showToast('Could not verify. Try again in a moment.');
        if (btn) { btn.disabled = false; btn.textContent = t('task_btn_verify'); }
        return;
      }
    } else {
      /* ── Success: grant rewards, persist, notify all views ── */
      setCompletedTasks(data.completed_tasks || []);

      const task      = SOCIAL_TASKS().find(t => t.id === taskId);
      const rewardReal = data.rewards.real || 0;
      const rewardGems = data.rewards.gems || 0;
      const rewardFarr = data.rewards.farr || 0;

      if (window.RealPlayer) {
        if (rewardReal) window.RealPlayer.addResource('real', rewardReal);
        if (rewardGems) window.RealPlayer.addResource('gems', rewardGems);
        if (rewardFarr) window.RealPlayer.addResource('farr', rewardFarr);
        /* Push new balance to server + notify every open view */
        if (window.RealSync) window.RealSync.syncBalance();
        try {
          const p = window.RealPlayer.get();
          window.dispatchEvent(new CustomEvent('shahnama:state_sync', { detail: p }));
          window.dispatchEvent(new CustomEvent('balanceUpdate'));
        } catch (_) {}
      }

      /* ── Rich confirmation ── */
      const taskArt  = document.querySelector(`[data-task="${taskId}"]`);
      const platform = task ? (task.platform || '') : '';
      const taskName = task ? task.label : 'Task';
      const platform_thank = {
        telegram: t('platform_tg_thanks','Following our Telegram channel'),
        x:        t('platform_x_thanks','Following us on X'),
        tiktok:   t('platform_tiktok_thanks','Following us on TikTok'),
        youtube:  'Subscribing to our YouTube',
        dyor:     'Liking our DYOR listing',
      }[platform] || taskName;

      if (rewardReal) {
        spawnCoinBurst(taskArt, rewardReal);
        /* Full-screen reward modal with personal message */
        showTaskRewardModal(platform_thank, rewardReal, rewardGems, rewardFarr);
      } else if (rewardFarr) {
        showToast(`✦ +${rewardFarr} Farr added to your legend! — ${taskName}`);
        fireBurst(`+${rewardFarr} Farr`);
      }
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

    const rows = PARTNERS().map(p => {
      const isDone = done.includes(p.id);
      const rewardParts = [];
      if (p.reward_real) rewardParts.push(`+${p.reward_real} ${RT}`);
      if (p.reward_gems) rewardParts.push(`+${p.reward_gems} 💎`);
      if (p.reward_farr) rewardParts.push(`+${p.reward_farr} ✦`);
      const rewardLabel = rewardParts.join(' · ');

      const btn = isDone
        ? `<button class="task-btn task-done" disabled>${t('task_btn_claimed')}</button>`
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
    btn.textContent = t('task_btn_wait',{n:10});

    let countdown = 10;
    const tid = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        btn.textContent = t('task_btn_wait',{n:countdown});
      } else {
        clearInterval(tid);
        btn.classList.replace('task-pending', 'task-check');
        btn.disabled = false;
        btn.textContent = t('task_btn_verify');
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
        const p = PARTNERS().find(x => x.id === partnerId);
        done.push(partnerId);
        setCompletedTasks(done);
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
        setCompletedTasks(done);
        showToast('Already claimed!');
      } else {
        showToast('Could not verify. Try again.');
        if (btn) { btn.disabled = false; btn.textContent = t('task_btn_verify'); }
        return;
      }
    } else {
      setCompletedTasks(data.completed_tasks || []);
      if (window.RealPlayer) {
        window.RealPlayer.addResource('real', data.rewards.real || 0);
        if (data.rewards.gems) window.RealPlayer.addResource('gems', data.rewards.gems);
        if (data.rewards.farr) window.RealPlayer.addResource('farr', data.rewards.farr);
        if (window.RealSync) window.RealSync.syncBalance();
      }
      const p = PARTNERS().find(x => x.id === partnerId);
      const earned = p ? [
        p.reward_real ? `+${p.reward_real} ${RT}` : '',
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
    const msLabel = ms ? t(ms.labelKey, ms.labelKey) : '';
    const earned = [
      r.real ? `+${r.real} ${RT}` : '',
      r.gems ? `+${r.gems} 💎` : '',
      r.farr ? `+${r.farr} ✦` : '',
    ].filter(Boolean).join(' · ');
    /* Premium visual feedback */
    const msArt = document.querySelector(`[data-milestone="${threshold}"]`);
    if (r.real) {
      spawnCoinBurst(msArt, r.real);
      showRewardModal(r.real, msLabel);
    }
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

  /* ── Airdrop eligibility checklist ─────────────────────────────────── */
  const updateAirdropEligibility = async (telegramId) => {
    const el = document.getElementById('airdrop-eligibility-list');
    if (!el) return;

    /* read client-side state */
    const hasWallet      = !!localStorage.getItem('real_ton_wallet');
    const offs           = (() => { try { return JSON.parse(localStorage.getItem('real_offerings_v1') || '{}'); } catch { return {}; } })();
    const totalOfferings = (offs.zar_count || 0) + (offs.fire_count || 0) + (offs.lore_count || 0);

    let checks = null;
    let daysLeft = null;

    if (telegramId) {
      try {
        const r = await fetch('/api/season2/user/airdrop-eligibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegram_id: String(telegramId), has_wallet: hasWallet, total_offerings: totalOfferings }),
        });
        if (r.ok) {
          const d = await r.json();
          if (d.status === 1) { checks = d.checks; daysLeft = d.days_until_age_gate; }
        }
      } catch (_) {}
    }

    /* fallback: client-only render if backend unavailable */
    const ch50Done = localStorage.getItem('real_chapter_done_ages-end') === '1';
    const hasClan  = localStorage.getItem('real_has_clan') === '1';
    const c = checks || {
      account_age: { met: false, days: 0,              required: 120 },
      ch50_done:   { met: ch50Done },
      clan:        { met: hasClan },
      wallet:      { met: hasWallet },
      offerings:   { met: totalOfferings >= 3, count: totalOfferings, required: 3 },
      no_abuse:    { met: true },
    };

    const row = (met, label, link, linkLabel) => {
      const icon  = met ? '✅' : '🔒';
      const color = met ? 'rgba(200,210,230,.9)' : 'var(--muted)';
      const linkHtml = (!met && link)
        ? `<a href="${link}" style="font-size:11px;color:#5ea2ff;text-decoration:none;white-space:nowrap;">${linkLabel} →</a>`
        : '';
      return `<div style="display:flex;align-items:center;gap:8px;font-size:12px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.06);">
        <span style="font-size:15px;line-height:1;">${icon}</span>
        <span style="flex:1;color:${color};">${label}</span>${linkHtml}
      </div>`;
    };

    const ageLabel = c.account_age.met
      ? `Account age: ${c.account_age.days}d ✓ (min ${c.account_age.required}d)`
      : `Account age: ${c.account_age.days}d / ${c.account_age.required}d required${daysLeft ? ` — ${daysLeft} days left` : ''}`;
    const offsLabel = `Offerings: ${c.offerings.count || totalOfferings}/${c.offerings.required || 3} made`;

    el.innerHTML =
      row(c.account_age.met, ageLabel, null, '') +
      row(c.ch50_done.met,   'Chapter 50 (Ages-End) completed', 'learn.html', 'Learn') +
      row(c.clan.met,        'Clan joined', 'guild.html', 'Guild') +
      row(c.wallet.met,      'TON wallet linked', 'hakim.html', 'Link wallet') +
      row(c.offerings.met,   offsLabel, 'offerings.html', 'Offerings') +
      row(c.no_abuse.met,    'Account standing: clean', null, '');
  };

  /* ── Watch & Earn (single-tier) ─────────────────────────────────────── */
  let _adCdInterval = null;

  const updateWatchBtn = () => {
    const btn     = document.getElementById('we-btn');
    const cdEl    = document.getElementById('we-cooldown');
    const usedEl  = document.getElementById('we-used');
    const dotsEl  = document.getElementById('we-dots');
    const gemHint = document.getElementById('we-gem-hint');

    const svc = window.RealAdService;
    const ws  = svc ? svc.getWatchState() : { used: 0, remaining: 5, cooldownSecs: 0, nextIsGem: false, configured: false };

    if (usedEl) usedEl.textContent = ws.used;

    if (dotsEl) {
      dotsEl.innerHTML = Array.from({ length: 5 }, (_, i) => {
        const cls = i < ws.used
          ? 'we-dot we-dot-done'
          : (i === ws.used && ws.remaining > 0 ? 'we-dot we-dot-next' : 'we-dot');
        return `<span class="${cls}"></span>`;
      }).join('');
    }

    if (gemHint) gemHint.hidden = !(ws.nextIsGem && ws.remaining > 0);

    if (!btn) return;

    if (ws.remaining <= 0) {
      btn.disabled = true;
      btn.textContent = t('watch_earn_done', 'All 5 done for today ✓');
      if (cdEl) cdEl.hidden = true;
      clearInterval(_adCdInterval);
      _adCdInterval = null;
      return;
    }

    if (ws.cooldownSecs > 0) {
      btn.disabled = true;
      btn.textContent = t('btn_watch', 'Watch Now');
      if (cdEl) {
        cdEl.hidden = false;
        const m = Math.floor(ws.cooldownSecs / 60);
        const s = ws.cooldownSecs % 60;
        cdEl.textContent = t('ad_ready_in', 'Ready in') + ' ' + (m > 0 ? m + 'm ' : '') + s + 's';
      }
      if (!_adCdInterval) {
        _adCdInterval = setInterval(() => {
          const rem = window.RealAdService ? window.RealAdService.getWatchState().cooldownSecs : 0;
          updateWatchBtn();
          if (rem <= 0) { clearInterval(_adCdInterval); _adCdInterval = null; }
        }, 1000);
      }
      return;
    }

    btn.disabled = !ws.configured;
    btn.textContent = ws.configured
      ? (ws.nextIsGem ? '💎 ' + t('btn_watch', 'Watch Now') : t('btn_watch', 'Watch Now'))
      : t('btn_soon', 'Soon');
    if (cdEl) cdEl.hidden = true;
  };

  const handleAdResult = (result) => {
    const r     = result.rewards || {};
    const parts = [];
    if (r.real) parts.push('+' + r.real + ' ' + RT + ' REAL');
    if (r.gems) parts.push('+' + r.gems + ' 💎');
    const label = parts.join(' · ') || 'Reward earned!';
    const btn   = document.getElementById('we-btn');
    showToast(label);
    fireBurst(label);
    if (r.real) spawnCoinBurst(btn, r.real);
    updateWatchBtn();
  };

  const handleAdError = (err) => {
    if (err.type === 'cooldown')       showToast(t('ad_cooldown_msg', 'Cooldown — come back soon!'));
    else if (err.type === 'daily_limit') showToast(t('watch_earn_done', 'All 5 ads watched for today!'));
    else if (err.type === 'not_configured') showToast(t('ads_unavailable', 'Ads not available yet.'));
    else if (err.type === 'sdk_missing')    showToast(t('ad_sdk_missing', 'Ad SDK not loaded. Try refreshing.'));
    else if (err.type === 'skipped')        showToast(t('ad_skipped_msg', 'Ad skipped — no reward.'));
    else                                    showToast(t('ad_unavailable_msg', 'Ad unavailable. Try again later.'));
    updateWatchBtn();
  };

  const bootAdsgram = () => {
    updateWatchBtn();
    window.addEventListener('real:adservice:ready', updateWatchBtn);

    const btn = document.getElementById('we-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (!window.RealAdService) { showToast('Ad service not ready.'); return; }
      btn.disabled = true;
      btn.textContent = t('btn_loading_ad', 'Loading…');
      window.RealAdService.showAd()
        .then(result => handleAdResult(result))
        .catch(err   => handleAdError(err));
    });
  };

  /* ── Boot ────────────────────────────────────────────────────────────── */
  const boot = async () => {
    const u = tgUser();
    const shareUrl = bootInviteLink(u);

    /* Pass 1 — immediate render from localStorage cache (feels instant) */
    renderCheckin();
    renderSocialTasks(shareUrl);
    renderPartners();
    bootAdsgram();
    updateSeasonStanding();

    const cachedVerified = parseInt(localStorage.getItem('real_verified_referral_count') || '0', 10);
    const cachedClaimed  = (() => { try { return JSON.parse(localStorage.getItem('real_milestones_claimed') || '[]'); } catch { return []; } })();
    applyTeamMultUI(cachedVerified);
    renderMilestones(cachedVerified, cachedClaimed);

    updateAirdropEligibility(u ? u.id : null);

    if (!u || !u.id) return;

    /* Pass 2 — fetch authoritative server state directly.
       Do NOT rely on sync.js or RealSync.ready() for task state because:
       - sync.js runs in parallel and may overwrite localStorage with stale []
       - timing between sync.js and earn.js is non-deterministic
       Instead, earn.js fetches completed_tasks directly from /user/me and
       re-renders. This is the authoritative source of truth. */
    const [meData, refData] = await Promise.all([
      fetch('/api/season2/user/me?' + new URLSearchParams({ telegram_id: String(u.id) }), { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null).catch(() => null),
      post('/api/season2/social/referrals', { telegram_id: String(u.id) }),
    ]);

    /* Update completed tasks from authoritative server response */
    if (meData && meData.status === 1 && meData.user) {
      const serverTasks = meData.user.completed_tasks || [];
      setCompletedTasks(serverTasks);  /* update in-memory cache + localStorage */
      renderSocialTasks(shareUrl);
      renderPartners();
      renderCheckin();
    }

    /* Update referral count */
    if (refData && refData.status === 1) {
      const verifiedCount = refData.verified_count || 0;
      localStorage.setItem('real_verified_referral_count', String(verifiedCount));
      try { window.dispatchEvent(new CustomEvent('real:referral:update')); } catch (_) {}
      applyTeamMultUI(verifiedCount);
      const claimed = (() => { try { return JSON.parse(localStorage.getItem('real_milestones_claimed') || '[]'); } catch { return []; } })();
      renderMilestones(verifiedCount, claimed);
      updateSeasonStanding();
    }
  };

  /* Also re-render when sync.js fires the tasks-updated event */
  window.addEventListener('shahnama:tasks:synced', (e) => {
    if (e.detail) setCompletedTasks(e.detail);
    const shareUrl = 'https://t.me/shahnameh_bot?start='
      + (localStorage.getItem('real_referral_code') || 'warrior_guest');
    renderSocialTasks(shareUrl);
    renderPartners();
  });

  /* Season standing re-renders instantly whenever any state (XP, balance,
     referrals) changes — no page reload required. */
  window.addEventListener('shahnama:state_sync', updateSeasonStanding);
  window.addEventListener('real:referral:update', updateSeasonStanding);
  window.addEventListener('balanceUpdate', updateSeasonStanding);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
