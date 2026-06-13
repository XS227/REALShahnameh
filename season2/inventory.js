/* ==========================================================================
   REAL Shahnameh — Inventory Page (inventory.js)
   ========================================================================== */
(() => {
  'use strict';

  const RT = '<img src="/assets/images/tokens/realtoken.png" alt="REAL" class="real-tok-img" onerror="this.outerHTML=\'◆\'">';

  /* ── Helpers ─────────────────────────────────────────────────────────── */

  /* t(key, fallback?) — proper fallback: if key not found RealI18N returns the
     key string itself (truthy), so || k won't help. Compare the result instead. */
  const t = (k, fallback) => {
    if (!window.RealI18N) return fallback || k;
    const r = typeof fallback === 'object'
      ? window.RealI18N.t(k, fallback)   // variable substitution
      : window.RealI18N.t(k);
    return r !== k ? r : (fallback && typeof fallback === 'string' ? fallback : k);
  };
  const fmtN = (n)   => (window.RealI18N && window.RealI18N.compactNumber)
    ? window.RealI18N.compactNumber(n) : String(Number(n) || 0);
  const fmtNF = (n)  => (window.RealI18N && window.RealI18N.formatNumber)
    ? window.RealI18N.formatNumber(Number(n) || 0) : String(Number(n) || 0);

  const get = (url) => fetch(url, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null);
  const post = (url, body) => fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body), keepalive: true,
  }).then(r => r.ok ? r.json() : null).catch(() => null);

  const tgUser = () => {
    try { return window.Telegram?.WebApp?.initDataUnsafe?.user || null; } catch { return null; }
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
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove('show'), 2800);
  };

  const currentSkin = () => {
    try { return localStorage.getItem('real_tap_skin_v1') || 'real'; } catch { return 'real'; }
  };

  /* ── Skin catalogue (mirrors tap.js) ─────────────────────────────────── */

  const SKINS = [
    { id: 'real',     name: 'REAL Token', rarity: 'default', emoji: '◆',  img: '/assets/images/tokens/realtoken.png', price: null,  chapter_unlock: null },
    { id: 'keyumars', name: 'Keyumars',   rarity: 'rare',    emoji: '👑', img: null,                                  price: null,  chapter_unlock: 'keyumars' },
    { id: 'hushang',  name: 'Hushang',    rarity: 'epic',    emoji: '🔥', img: '/season2/uploads/chapters/hushang.png', price: 2500,  chapter_unlock: 'hushang' },
    { id: 'zahhak',   name: 'Zahhak',     rarity: 'legend',  emoji: '🐍', img: '/season2/uploads/chapters/zahhak.jpg',  price: 5000,  chapter_unlock: 'zahhak' },
    { id: 'rostam',   name: 'Rostam',     rarity: 'legend',  emoji: '⚔',  img: '/season2/uploads/chapters/rostam.png',  price: 10000, chapter_unlock: 'rostam' },
    { id: 'simorgh',  name: 'Simorgh',    rarity: 'mythic',  emoji: '🦅', img: '/season2/uploads/chapters/simorgh.png', price: null,  chapter_unlock: 'simorgh', coming: true },
    { id: 'royal',    name: 'Royal Seal', rarity: 'mythic',  emoji: '🔱', img: null,                                    price: null,  chapter_unlock: null,      coming: true },
  ];

  const CHEST_DEFS = {
    founder_chest: {
      name: 'Founder\'s Chest',
      icon: '📦',
      desc: 'A reward for early believers of the Shahnameh. Contains REAL tokens and XP.',
    },
  };

  /* ── Tab management ─────────────────────────────────────────────────── */

  const TABS = ['skins', 'chests', 'boosts'];

  const showTab = (name) => {
    document.querySelectorAll('.inv-tab').forEach(b => b.classList.toggle('active', b.dataset.invTab === name));
    TABS.forEach(n => {
      const p = document.getElementById(`inv-panel-${n}`);
      if (p) p.style.display = n === name ? '' : 'none';
    });
  };

  /* ── Skins tab (unified: purchase + chapter unlock + equip) ─────────── */

  const CHAPTER_SKIN_UNLOCKS = {
    keyumars: 'keyumars', hushang: 'hushang', zahhak: 'zahhak',
    rostam: 'rostam', simorgh: 'simorgh',
  };

  const checkAndGrantRetroactiveSkins = () => {
    try {
      const stored  = JSON.parse(localStorage.getItem('real_skin_unlocked_v1') || '[]');
      const granted = new Set(stored);
      let changed   = false;
      Object.entries(CHAPTER_SKIN_UNLOCKS).forEach(([slug, skinId]) => {
        if (!granted.has(skinId) && localStorage.getItem(`real_chapter_done_${slug}`) === '1') {
          granted.add(skinId); changed = true;
        }
      });
      if (changed) localStorage.setItem('real_skin_unlocked_v1', JSON.stringify([...granted]));
      return [...granted];
    } catch { return []; }
  };

  const buildSkins = (serverUnlockedSkins, playerBalance) => {
    const panel = document.getElementById('inv-panel-skins');
    if (!panel) return;

    const chapterUnlocked = checkAndGrantRetroactiveSkins();
    const equipped = currentSkin();
    const owned    = new Set(['real', 'keyumars', ...serverUnlockedSkins, ...chapterUnlocked]);

    const cards = SKINS.map(skin => {
      const isOwned    = owned.has(skin.id);
      const isEquipped = skin.id === equipped;
      const canAfford  = playerBalance >= (skin.price || 0);

      const orbClass = `skin-orb skin-orb-${skin.rarity}`;
      const imgHtml  = skin.img
        ? `<img src="${skin.img}" alt="${skin.name}" onerror="this.style.display='none';this.nextElementSibling.style.display=''"><span style="display:none;font-size:30px;">${skin.emoji}</span>`
        : `<span>${skin.emoji}</span>`;

      let cardClass = 'skin-card';
      if (isEquipped)   cardClass += ' equipped';
      else if (isOwned) cardClass += ' owned';
      else if (skin.coming) cardClass += ' coming';
      else              cardClass += ' locked';

      let actionHtml = '';
      if (isEquipped) {
        actionHtml = `<div class="skin-action equipped-badge">${t('inv_equipped','✓ Equipped')}</div>`;
      } else if (isOwned) {
        actionHtml = `<button class="skin-action equip" data-equip="${skin.id}">${t('inv_equip','Equip')}</button>`;
      } else if (skin.coming) {
        actionHtml = `<div class="skin-action coming-soon">${t('coming_soon','Soon')}</div>`;
      } else if (skin.price) {
        actionHtml = `<button class="skin-action buy" data-buy="${skin.id}"
          ${!canAfford ? 'style="opacity:.5;"' : ''}
          title="${canAfford ? '' : t('inv_need_real','Not enough REAL')}">
          ${fmtNF(skin.price)} ${RT}
        </button>`;
        if (skin.chapter_unlock) {
          actionHtml += `<div class="tapicon-hint" style="margin-top:4px;">${t('tapicon_unlock_ch','Complete: ')}<em>${skin.chapter_unlock}</em></div>`;
        }
      } else if (skin.chapter_unlock) {
        actionHtml = `<div class="tapicon-hint">${t('tapicon_unlock_ch','Complete: ')}<em>${skin.chapter_unlock}</em></div>`;
      }

      return `
        <div class="${cardClass}">
          ${isEquipped ? '<div class="skin-equipped-ring">✓</div>' : ''}
          <div class="${orbClass}">${imgHtml}</div>
          <div class="skin-name">${skin.name}</div>
          <div class="skin-rarity r-${skin.rarity}">${skin.rarity}</div>
          ${actionHtml}
        </div>`;
    }).join('');

    panel.innerHTML = `<div class="skin-grid">${cards}</div>`;

    panel.querySelectorAll('[data-equip]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.equip;
        try { localStorage.setItem('real_tap_skin_v1', id); } catch (_) {}
        window.dispatchEvent(new CustomEvent('real:skin:changed', { detail: { skin_id: id } }));
        buildSkins(serverUnlockedSkins, localPlayer().balance || 0);
        showToast(`${SKINS.find(s => s.id === id)?.name} ${t('inv_skin_equipped_toast', 'equipped!')}`);
      });
    });

    panel.querySelectorAll('[data-buy]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const u = tgUser();
        if (!u?.id) { showToast(t('open_in_telegram', 'Open via Telegram.')); return; }
        const skin = SKINS.find(s => s.id === btn.dataset.buy);
        const bal  = localPlayer().balance || 0;
        if (!skin || bal < skin.price) {
          showToast(t('inv_need_real', `Need ${fmtNF(skin?.price || 0)} REAL.`));
          return;
        }
        btn.disabled = true; btn.innerHTML = '…';
        const res = await post('/api/season2/inventory/buy-skin', { telegram_id: String(u.id), skin_id: skin.id });
        if (res?.status === 1) {
          try {
            const ps = JSON.parse(localStorage.getItem('real_player_state_v1') || '{}');
            ps.balance = res.new_balance;
            localStorage.setItem('real_player_state_v1', JSON.stringify(ps));
            window.dispatchEvent(new CustomEvent('shahnama:state_sync'));
          } catch (_) {}
          serverUnlockedSkins.push(skin.id);
          showToast(`${skin.name} ${t('inv_skin_unlocked_toast', 'unlocked!')}`);
          buildSkins(serverUnlockedSkins, res.new_balance);
        } else {
          const msg = {
            insufficient_balance: t('inv_need_real', 'Not enough REAL.'),
            already_owned:        t('inv_already_owned', 'Already owned.'),
          }[res?.error] || t('inv_buy_failed', 'Purchase failed.');
          showToast(msg);
          btn.disabled = false;
          btn.innerHTML = `${fmtNF(skin.price)} ${RT}`;
        }
      });
    });
  };

  /* ── Chests tab ─────────────────────────────────────────────────────── */

  const OPENED_CHESTS_KEY = 'real_opened_chests_v1';

  const lsOpenedChests = () => {
    try { return JSON.parse(localStorage.getItem(OPENED_CHESTS_KEY) || '[]'); } catch { return []; }
  };

  const lsMarkChestOpened = (id) => {
    try {
      const arr = lsOpenedChests();
      if (!arr.includes(id)) { arr.push(id); localStorage.setItem(OPENED_CHESTS_KEY, JSON.stringify(arr)); }
    } catch {}
  };

  const buildChests = (openedChests) => {
    const panel = document.getElementById('inv-panel-chests');
    if (!panel) return;

    /* Which chests does the user currently have (not yet opened) */
    const items = (() => {
      try { return JSON.parse(localStorage.getItem('real_items_v1') || '{}'); } catch { return {}; }
    })();

    const available = Object.keys(CHEST_DEFS).filter(id => items[id] && !openedChests.includes(id));

    if (!available.length) {
      panel.innerHTML = `
        <div style="text-align:center;padding:40px 16px;color:var(--muted);">
          <div style="font-size:48px;margin-bottom:12px;">📦</div>
          <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:6px;">${t('inv_no_chests','No chests')}</div>
          <p style="font-size:12px;margin:0;">${t('inv_no_chests_sub','Complete quests and milestones to earn chests.')}</p>
        </div>`;
      return;
    }

    panel.innerHTML = available.map(id => {
      const def = CHEST_DEFS[id];
      return `
        <div class="chest-card" id="chest-${id}">
          <div class="chest-icon">${def.icon}</div>
          <div class="chest-info">
            <div class="chest-name">${def.name}</div>
            <div class="chest-desc">${def.desc}</div>
            <button class="chest-open-btn" data-open-chest="${id}">${t('inv_open_chest','Open Chest')}</button>
          </div>
        </div>`;
    }).join('');

    panel.querySelectorAll('[data-open-chest]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const u = tgUser();
        if (!u?.id) { showToast(t('open_in_telegram', 'Open via Telegram.')); return; }
        const chestId = btn.dataset.openChest;
        btn.disabled = true; btn.textContent = '…';

        const res = await post('/api/season2/inventory/open-chest', { telegram_id: String(u.id), chest_id: chestId });

        if (res?.status === 1) {
          /* Update local balance + XP */
          try {
            const ps = JSON.parse(localStorage.getItem('real_player_state_v1') || '{}');
            ps.balance = res.new_balance;
            ps.xp      = res.new_xp;
            localStorage.setItem('real_player_state_v1', JSON.stringify(ps));
            window.dispatchEvent(new CustomEvent('shahnama:state_sync'));
          } catch (_) {}

          /* Reveal animation */
          const card = document.getElementById(`chest-${chestId}`);
          if (card) {
            card.innerHTML = `
              <div class="chest-reward-reveal" style="width:100%;">
                <div class="chest-reward-icon">✨</div>
                <div class="chest-reward-line">+${fmtNF(res.real)} ${RT} REAL</div>
                <div class="chest-reward-line" style="font-size:15px;color:var(--violet);">+${fmtNF(res.xp)} XP</div>
                <div class="chest-reward-sub">${t('inv_chest_opened','Chest opened!')}</div>
              </div>`;
          }
          openedChests.push(chestId);
          lsMarkChestOpened(chestId);
        } else {
          const msg = res?.error === 'already_opened'
            ? t('inv_already_opened', 'This chest was already opened.')
            : t('inv_open_failed', 'Could not open chest. Try again.');
          showToast(msg);
          btn.disabled = false;
          btn.textContent = t('inv_open_chest', 'Open Chest');
        }
      });
    });
  };

  /* ── Boosts tab ─────────────────────────────────────────────────────── */

  const AUTOCLICKER_PRICE = 50000;

  const getAutoclickerExpiry = () => {
    try { return parseInt(localStorage.getItem('real_autoclicker_expires_at') || '0', 10); } catch { return 0; }
  };

  const buildBoosts = (serverAutoclickerExpiry) => {
    const panel = document.getElementById('inv-panel-boosts');
    if (!panel) return;

    const p      = localPlayer();
    const streak = p.daily_streak || p.dailyStreak || 1;
    const bal    = p.balance || 0;

    /* Tap boost — stored as boost_expires_at in player state */
    const boostExp  = p.boost_expires_at || 0;
    const boostLeft = Math.max(0, Math.floor((boostExp - Date.now()) / 1000));
    const boostActive = boostLeft > 0;

    /* Auto-clicker — trust server if provided, else use localStorage */
    if (serverAutoclickerExpiry) {
      try { localStorage.setItem('real_autoclicker_expires_at', String(serverAutoclickerExpiry)); } catch {}
    }
    const acExp    = getAutoclickerExpiry();
    const acActive = acExp > Date.now();

    /* Hero ZAR/hr from sync */
    const heroMap = (() => {
      try { return JSON.parse(localStorage.getItem('real_owned_heroes_v1') || '{}'); } catch { return {}; }
    })();
    const totalZarHr = Object.values(heroMap).reduce((s, h) => s + (h.zar_per_hour || 0), 0);
    const heroCount  = Object.keys(heroMap).length;

    const fmtDuration = (s) => {
      if (s <= 0) return '—';
      const m = Math.floor(s / 60), h = Math.floor(m / 60);
      if (h > 0) return `${h}h ${m % 60}m`;
      return `${m}m ${s % 60}s`;
    };

    const canAffordAC = bal >= AUTOCLICKER_PRICE;

    panel.innerHTML = `
      <div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:8px;">${t('inv_active_boosts','Active Boosts')}</div>
        <div class="boost-card">
          <div class="boost-icon${boostActive ? ' active' : ''}">⚡</div>
          <div class="boost-info">
            <div class="boost-name">${t('inv_boost_tap','Tap Boost ×3')}</div>
            <div class="boost-sub">${boostActive ? t('inv_boost_active','Active — 3× forge output') : t('inv_boost_inactive','Activate from the Forge page')}</div>
          </div>
          <div class="boost-val${boostActive ? '' : ' inactive'}" id="boost-timer">
            ${boostActive ? fmtDuration(boostLeft) : t('inv_boost_off','Inactive')}
          </div>
        </div>
      </div>

      <div style="margin-top:18px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:8px;">${t('inv_shop','Shop')}</div>

        <div class="boost-card ac-shop-card" style="flex-direction:column;align-items:stretch;gap:10px;padding:14px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="boost-icon${acActive ? ' active' : ''}" style="font-size:24px;">🤖</div>
            <div class="boost-info" style="flex:1;">
              <div class="boost-name">${t('inv_autoclicker_name','Auto-Clicker')}</div>
              <div class="boost-sub">${acActive
                ? t('inv_autoclicker_active','Tapping for you all season · uses energy like real taps')
                : t('inv_autoclicker_desc','Taps automatically for the whole season · uses energy like real taps')}</div>
            </div>
            <div class="boost-val${acActive ? '' : ' inactive'}">
              ${acActive ? `<span style="color:var(--jade);font-size:11px;font-weight:700;">${t('inv_autoclicker_owned','OWNED')}</span>` : '—'}
            </div>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <div style="font-size:11px;color:var(--muted);">
              ${acActive
                ? t('inv_autoclicker_season_item','Season item — active for the rest of Season 2')
                : `${fmtNF(AUTOCLICKER_PRICE)} ${RT} · ${t('inv_autoclicker_one_time','one-time purchase')}`}
            </div>
            <button class="skin-action buy" id="ac-buy-btn"
              style="white-space:nowrap;${acActive ? 'opacity:.45;cursor:default;' : !canAffordAC ? 'opacity:.45;' : ''}"
              ${acActive ? 'disabled' : !canAffordAC ? `title="${t('inv_need_real','Not enough REAL')}"` : ''}>
              ${acActive ? t('inv_autoclicker_owned_btn','Owned') : t('inv_autoclicker_buy','Activate · 50K')} ${acActive ? '' : RT}
            </button>
          </div>
        </div>
      </div>

      <div style="margin-top:18px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:8px;">${t('inv_passive','Passive Income')}</div>
        <div class="boost-card">
          <div class="boost-icon active">⚔</div>
          <div class="boost-info">
            <div class="boost-name">${t('inv_hero_income','Hero ZAR/hr')}</div>
            <div class="boost-sub">${heroCount > 0 ? `${fmtNF(heroCount)} hero${heroCount === 1 ? '' : 'es'} deployed` : t('inv_no_heroes','No heroes unlocked yet')}</div>
          </div>
          <div class="boost-val">${fmtN(totalZarHr)} <span style="font-size:10px;font-weight:400;color:var(--muted);">/hr</span></div>
        </div>
        <div class="boost-card">
          <div class="boost-icon active">🔥</div>
          <div class="boost-info">
            <div class="boost-name">${t('inv_streak','Daily Streak')}</div>
            <div class="boost-sub">${t('inv_streak_sub','+5% ZAR bonus per day checked in')}</div>
          </div>
          <div class="boost-val">${fmtNF(streak)} <span style="font-size:10px;font-weight:400;color:var(--muted);">days</span></div>
        </div>
      </div>`;

    /* Live boost timer countdown */
    if (boostActive) {
      const timerEl = document.getElementById('boost-timer');
      const tick = () => {
        const left = Math.max(0, Math.floor((boostExp - Date.now()) / 1000));
        if (timerEl) timerEl.textContent = left > 0 ? fmtDuration(left) : t('inv_boost_off','Inactive');
        if (left > 0) setTimeout(tick, 1000);
      };
      setTimeout(tick, 1000);
    }

    /* Buy button */
    const acBtn = document.getElementById('ac-buy-btn');
    if (acBtn) {
      acBtn.addEventListener('click', async () => {
        const u = tgUser();
        if (!u?.id) { showToast(t('open_in_telegram', 'Open via Telegram.')); return; }
        const curBal = localPlayer().balance || 0;
        if (curBal < AUTOCLICKER_PRICE) {
          showToast(t('inv_need_real', `Need ${fmtNF(AUTOCLICKER_PRICE)} REAL.`));
          return;
        }
        acBtn.disabled = true; acBtn.innerHTML = '…';
        const res = await post('/api/season2/inventory/buy-autoclicker', { telegram_id: String(u.id) });
        if (res?.status === 1) {
          try {
            const ps = JSON.parse(localStorage.getItem('real_player_state_v1') || '{}');
            ps.balance = res.new_balance;
            localStorage.setItem('real_player_state_v1', JSON.stringify(ps));
            localStorage.setItem('real_autoclicker_expires_at', String(res.autoclicker_expires_at));
            window.dispatchEvent(new CustomEvent('shahnama:state_sync'));
            window.dispatchEvent(new CustomEvent('real:autoclicker:started', { detail: { expires_at: res.autoclicker_expires_at } }));
          } catch (_) {}
          showToast(t('inv_autoclicker_toast', '🤖 Auto-Clicker activated for the season!'));
          buildBoosts(res.autoclicker_expires_at);
        } else if (res?.error === 'already_owned') {
          /* Sync the expiry locally if somehow out of date */
          if (res.autoclicker_expires_at) {
            try { localStorage.setItem('real_autoclicker_expires_at', String(res.autoclicker_expires_at)); } catch {}
            window.dispatchEvent(new CustomEvent('real:autoclicker:started', { detail: { expires_at: res.autoclicker_expires_at } }));
          }
          buildBoosts(res.autoclicker_expires_at);
        } else {
          const msg = {
            insufficient_balance: t('inv_need_real', 'Not enough REAL.'),
          }[res?.error] || t('inv_buy_failed', 'Purchase failed.');
          showToast(msg);
          acBtn.disabled = false;
          acBtn.innerHTML = `${t('inv_autoclicker_buy','Activate · 50K')} ${RT}`;
        }
      });
    }
  };

  /* ── Init ────────────────────────────────────────────────────────────── */

  const init = async () => {
    /* Wire tabs */
    document.querySelectorAll('.inv-tab').forEach(btn => {
      btn.addEventListener('click', () => showTab(btn.dataset.invTab));
    });

    const u = tgUser();

    /* Fetch server inventory (owned skins, opened chests) */
    let unlockedSkins  = [];
    let openedChests   = lsOpenedChests(); /* start with local cache so chests stay hidden on refresh */
    let serverACExpiry = null;
    if (u?.id) {
      const inv = await get('/api/season2/inventory?' + new URLSearchParams({ telegram_id: String(u.id) }));
      if (inv?.status === 1) {
        unlockedSkins  = inv.unlocked_skins        || [];
        serverACExpiry = inv.autoclicker_expires_at || null;
        /* Merge server list into local cache (server is authoritative, union wins) */
        const serverOpened = inv.opened_chests || [];
        serverOpened.forEach(id => lsMarkChestOpened(id));
        openedChests = lsOpenedChests();
      }
    }

    const balance = localPlayer().balance || 0;

    buildSkins(unlockedSkins, balance);
    buildChests(openedChests);
    buildBoosts(serverACExpiry);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
