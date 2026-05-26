/* ==========================================================================
   REAL Shahnameh — Season 2 Earn Page (earn.js)
   Live referral data, milestone progress, team multiplier.
   ========================================================================== */
(function () {
  'use strict';

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

  const MILESTONES = [
    { threshold: 3,   real: 500,   gems: 1,  farr: 0 },
    { threshold: 10,  real: 2000,  gems: 3,  farr: 0 },
    { threshold: 25,  real: 5000,  gems: 5,  farr: 1 },
    { threshold: 100, real: 15000, gems: 10, farr: 2 },
  ];

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
              + '&text=' + encodeURIComponent('Join me on REAL Shahnameh!')
            );
          } else {
            doCopy();
          }
        } catch (_) { doCopy(); }
      });
    }
    if (copyBtn) copyBtn.addEventListener('click', doCopy);
  };

  /* ── Team multiplier + referral counter UI ───────────────────────────── */
  const applyTeamMultUI = (verifiedCount) => {
    const teamMult   = Math.min(2.0, 1 + verifiedCount * 0.04);
    const multStr    = teamMult.toFixed(2);
    localStorage.setItem('real_team_mult', multStr);

    const multEl = document.querySelector('[data-team-mult]');
    const refEl  = document.querySelector('[data-referrals]');
    const barFill = document.querySelector('[data-team-bar]');
    if (multEl)  multEl.textContent  = multStr;
    if (refEl)   refEl.textContent   = verifiedCount;
    if (barFill) barFill.style.width = Math.min(100, verifiedCount) + '%';
  };

  /* ── Milestone rendering ─────────────────────────────────────────────── */
  const renderMilestones = (verifiedCount, claimed) => {
    document.querySelectorAll('[data-milestone]').forEach(art => {
      const threshold = parseInt(art.dataset.milestone, 10);
      const ms = MILESTONES.find(m => m.threshold === threshold);
      if (!ms) return;

      const progress   = Math.min(threshold, verifiedCount);
      const pct        = Math.round((progress / threshold) * 100);
      const isClaimed  = claimed.includes(threshold);
      const isReachable = verifiedCount >= threshold && !isClaimed;

      const progressEl = art.querySelector('[data-ms-progress]');
      if (progressEl) {
        if (isClaimed) {
          progressEl.textContent = threshold + ' / ' + threshold + ' — Reward claimed ✓';
        } else {
          progressEl.textContent = progress + ' / ' + threshold
            + (isReachable ? ' — Claim your reward!' : '');
        }
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

  /* ── Milestone claim ─────────────────────────────────────────────────── */
  const claimMilestone = async (threshold) => {
    const u = tgUser();
    if (!u || !u.id) { showToast('Open via Telegram to claim'); return; }

    const data = await post('/api/season2/social/claim-milestone', {
      telegram_id: String(u.id),
      milestone:   threshold,
    });

    if (!data || data.status !== 1) {
      const msg = data && data.error === 'already_claimed'
        ? 'Already claimed!'
        : (data && data.error === 'not_reached' ? 'Not reached yet.' : 'Could not claim. Try again.');
      showToast(msg);
      return;
    }

    const newClaimed = data.milestones_claimed || [];
    localStorage.setItem('real_milestones_claimed', JSON.stringify(newClaimed));

    if (window.RealPlayer) {
      window.RealPlayer.addResource('real',  data.rewards.real  || 0);
      window.RealPlayer.addResource('gems',  data.rewards.gems  || 0);
      if (data.rewards.farr) window.RealPlayer.addResource('farr', data.rewards.farr);
      if (window.RealSync) window.RealSync.syncBalance();
    }

    showToast('+' + data.rewards.real + ' REAL · +' + data.rewards.gems + ' Gems claimed!');

    const verifiedCount = parseInt(localStorage.getItem('real_verified_referral_count') || '0', 10);
    renderMilestones(verifiedCount, newClaimed);
  };

  /* ── Boot ────────────────────────────────────────────────────────────── */
  const boot = async () => {
    const u = tgUser();
    bootInviteLink(u);

    if (!u || !u.id) {
      const cached     = parseInt(localStorage.getItem('real_verified_referral_count') || '0', 10);
      const claimedRaw = localStorage.getItem('real_milestones_claimed');
      const claimed    = claimedRaw ? JSON.parse(claimedRaw) : [];
      applyTeamMultUI(cached);
      renderMilestones(cached, claimed);
      return;
    }

    const data = await post('/api/season2/social/referrals', { telegram_id: String(u.id) });

    const verifiedCount = (data && data.status === 1) ? (data.verified_count || 0)
      : parseInt(localStorage.getItem('real_verified_referral_count') || '0', 10);

    if (data && data.status === 1) {
      localStorage.setItem('real_verified_referral_count', String(verifiedCount));
      try { window.dispatchEvent(new CustomEvent('real:referral:update')); } catch (_) {}
    }

    applyTeamMultUI(verifiedCount);

    const claimedRaw = localStorage.getItem('real_milestones_claimed');
    const claimed    = claimedRaw ? JSON.parse(claimedRaw) : [];
    renderMilestones(verifiedCount, claimed);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
