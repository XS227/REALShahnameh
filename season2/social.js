/* ==========================================================================
   REAL Shahnameh — Season 2 Social Page (social.js)
   My Clan section: shows real referred warriors with live status.
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

  const loadClan = async () => {
    const clanEl = document.getElementById('my-clan');
    if (!clanEl) return;

    const u = tgUser();
    if (!u || !u.id) {
      clanEl.innerHTML = '<p class="clan-empty">Open via Telegram to see your clan.</p>';
      return;
    }

    clanEl.innerHTML = '<p class="clan-empty">Loading your clan…</p>';

    const data = await post('/api/season2/social/referrals', { telegram_id: String(u.id) });

    if (!data || data.status !== 1) {
      clanEl.innerHTML = '<p class="clan-empty">Could not load clan data.</p>';
      return;
    }

    const members      = data.members || [];
    const verifiedCount = data.verified_count || 0;
    const totalCount    = data.total_count || 0;

    // Keep localStorage up to date and notify other listeners
    try {
      localStorage.setItem('real_verified_referral_count', String(verifiedCount));
      window.dispatchEvent(new CustomEvent('real:referral:update'));
    } catch (_) {}

    if (members.length === 0) {
      clanEl.innerHTML = `
        <div class="section-head">
          <h3>Your Clan</h3>
          <span class="more">0 warriors</span>
        </div>
        <article class="card">
          <p class="clan-empty">No warriors yet. Share your invite link to recruit your clan.</p>
        </article>`;
      return;
    }

    const rows = members.map(m => {
      const displayName = m.username ? '@' + m.username : (m.first_name || 'Warrior');
      const initial     = displayName.replace('@', '').charAt(0).toUpperCase();
      const vipLv       = Math.floor((m.xp || 0) / 1000);
      const tag         = m.verified
        ? '<span class="clan-tag clan-verified">✓ Active</span>'
        : '<span class="clan-tag clan-pending">⌛ Pending</span>';
      return `
        <div class="clan-row">
          <div class="clan-avatar">${initial}</div>
          <div class="clan-info">
            <div class="clan-name">${displayName}</div>
            <div class="clan-stats">LVL ${vipLv} · ${m.xp} XP</div>
          </div>
          ${tag}
        </div>`;
    }).join('');

    clanEl.innerHTML = `
      <div class="section-head">
        <h3>Your Clan</h3>
        <span class="more">${verifiedCount} / ${totalCount} active</span>
      </div>
      <article class="card lb-list clan-list">
        ${rows}
      </article>`;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadClan);
  } else {
    loadClan();
  }
})();
