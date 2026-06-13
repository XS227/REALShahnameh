/* ==========================================================================
   REAL Shahnameh — Tap page: Skin system + Enhanced tap FX
   tap.js — loaded after app.js and market.js
   ========================================================================== */
(() => {
  "use strict";
  const RT = '<img src="/assets/images/tokens/realtoken.png" alt="REAL" class="real-tok-img" onerror="this.outerHTML=\'◆\'">';

  /* ---- Skin catalogue ---- */
  const SKINS = [
    {
      id: "real",
      name: "REAL Token",
      rarity: "default",
      img: "/assets/images/tokens/realtoken.png",
      emoji: "◆",
      locked: false,
      unlock: null
    },
    {
      id: "keyumars",
      name: "Keyumars",
      rarity: "rare",
      img: null,
      emoji: "👑",
      locked: false,
      unlock: null
    },
    {
      id: "hushang",
      name: "Hushang",
      rarity: "epic",
      img: "/season2/uploads/chapters/hushang.png",
      emoji: "🔥",
      locked: true,
      unlock: "Story · Ch. 2"
    },
    {
      id: "zahhak",
      name: "Zahhak",
      rarity: "legend",
      img: "/season2/uploads/chapters/zahhak.jpg",
      emoji: "🐍",
      locked: true,
      unlock: "500 REAL"
    },
    {
      id: "rostam",
      name: "Rostam",
      rarity: "legend",
      img: "/season2/uploads/chapters/rostam.png",
      emoji: "⚔",
      locked: true,
      unlock: "1,000 REAL"
    },
    {
      id: "simorgh",
      name: "Simorgh",
      rarity: "mythic",
      img: "/season2/uploads/chapters/simorgh.png",
      emoji: "🦅",
      locked: true,
      unlock: "Season drop"
    },
    {
      id: "royal",
      name: "Royal Seal",
      rarity: "mythic",
      img: null,
      emoji: "🔱",
      locked: true,
      unlock: "Legendary"
    }
  ];

  const SKIN_LS = "real_tap_skin_v1";

  /* ---- i18n helper (graceful: falls back to key if runtime not ready) ---- */
  const t = (k, v) => (window.RealI18N && window.RealI18N.t(k, v)) || k;

  /* ---- Helpers ---- */
  const getSavedSkin = () => {
    try { return localStorage.getItem(SKIN_LS) || "real"; } catch { return "real"; }
  };
  const saveSkin = (id) => {
    try { localStorage.setItem(SKIN_LS, id); } catch {}
  };

  const showToast = (msg) => {
    const el = document.querySelector("[data-toast]");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove("show"), 2200);
  };
  window._tapShowToast = showToast;

  /* ---- Apply skin to orb ---- */
  const applyOrbSkin = (skin) => {
    const orbImg  = document.querySelector("[data-skin-orb]");
    const orbText = document.querySelector("[data-skin-orb-text]");
    const orb     = document.querySelector("[data-energy-orb]");
    if (!orbImg || !orbText) return;

    /* Keyumars royal-gold visual */
    if (orb) orb.classList.toggle("skin-keyumars-active", skin.id === "keyumars");

    if (skin.img) {
      orbText.style.display = "none";
      orbImg.style.display  = "";
      orbImg.alt = skin.name;
      orbImg.onerror = () => {
        orbImg.style.display = "none";
        orbText.textContent  = skin.emoji || skin.name[0];
        orbText.style.display = "";
      };
      orbImg.src = skin.img;
    } else {
      orbImg.style.display  = "none";
      orbText.textContent   = skin.emoji || skin.name[0];
      orbText.style.display = "";
    }
  };

  /* ============================================================
     Enhanced tap FX — runs alongside app.js tap handler
     ============================================================ */
  const setupEnhancedTapFX = () => {
    const coreWrap = document.querySelector("[data-core]");
    const orb      = document.querySelector("[data-energy-orb]");
    if (!coreWrap || !orb) return;

    let tapCount = 0;
    /* Track ZAR earned per 5-tap batch for the forge history log.
       Accumulates the raw reward dispatched by app.js on each tap. */
    let _batchZarEarned = 0;
    window.addEventListener('real:tap:reward', (e) => {
      _batchZarEarned += (e.detail && e.detail.reward) || 0;
    });

    const spawnFX = (event) => {
      if (document.hidden) return;

      const rect = coreWrap.getBoundingClientRect();
      const cx   = rect.width  / 2;
      const cy   = rect.height / 2;
      const ex   = event && event.clientX != null ? event.clientX - rect.left : cx;
      const ey   = event && event.clientY != null ? event.clientY - rect.top  : cy;

      /* --- Ring burst (throttled: remove previous before adding new) --- */
      const prevRing = coreWrap.querySelector('.tap-ring-burst');
      if (prevRing) prevRing.remove();
      const ring = document.createElement("span");
      ring.className = "tap-ring-burst";
      coreWrap.appendChild(ring);
      setTimeout(() => ring.remove(), 600);

      /* --- Mini REAL coin particles (6 per tap, Web Animations API) --- */
      const count = 6;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * 2 * Math.PI + Math.random() * 0.5;
        const dist  = 55 + Math.random() * 45;
        const endX  = Math.cos(angle) * dist;
        const endY  = Math.sin(angle) * dist - 30;
        const delay = i * 28;
        const dur   = 700 + Math.random() * 200;

        const coin = document.createElement("span");
        coin.className = "real-mini-coin";
        coin.style.left = `${cx - 4}px`;
        coin.style.top  = `${cy - 4}px`;
        coreWrap.appendChild(coin);

        coin.animate([
          { transform: "translate(0,0) scale(0.7)", opacity: 1 },
          { transform: `translate(${endX}px, ${endY * 0.4}px) scale(1)`, opacity: 0.9, offset: 0.4 },
          { transform: `translate(${endX * 1.2}px, ${endY + 20}px) scale(0.3)`, opacity: 0 }
        ], { duration: dur, delay, easing: "cubic-bezier(.22,1,.36,1)", fill: "forwards" });

        setTimeout(() => coin.remove(), dur + delay + 50);
      }

      /* --- +ZAR label --- */
      const rl = document.createElement("span");
      rl.className = "real-label-float";
      rl.textContent = "+" + t('r_zar');
      rl.style.left = `${ex - 22}px`;
      rl.style.top  = `${ey - 32}px`;
      coreWrap.appendChild(rl);
      setTimeout(() => rl.remove(), 950);

      /* --- Live forge history (every 5th tap) --- */
      tapCount++;
      if (tapCount % 5 === 0) {
        /* Log the delta earned in this batch — NOT the cumulative wallet total */
        const delta = _batchZarEarned;
        _batchZarEarned = 0;
        if (delta > 0) {
          addHistoryRow(
            t('forge_burst_evt') || 'Forge strike',
            '+' + fmtNum(delta) + ' 🪙 ' + t('r_zar'),
            t('just_now') || 'now'
          );
        }
      }

      if (tapCount % 3 === 0) {
        const xp = document.createElement("span");
        xp.className = "xp-label-float";
        xp.textContent = t("tap_xp_burst","+XP");
        xp.style.left = `${ex + 14}px`;
        xp.style.top  = `${ey - 20}px`;
        coreWrap.appendChild(xp);
        setTimeout(() => xp.remove(), 900);
      }
    };

    orb.addEventListener("click", spawnFX);
    orb.addEventListener("touchstart", (e) => {
      const t = e.changedTouches && e.changedTouches[0];
      spawnFX(t ? { clientX: t.clientX, clientY: t.clientY } : null);
    }, { passive: true });
  };

  /* ---- Market contract copy ---- */
  const setupContractCopy = () => {
    const btn  = document.querySelector("[data-copy-contract]");
    const addr = document.querySelector("[data-contract-addr]");
    if (!btn) return;
    const full = addr ? (addr.getAttribute("data-full") || "") : "";

    btn.addEventListener("click", async () => {
      if (!full) { showToast(t("skin_copy_soon")); return; }
      try {
        await navigator.clipboard.writeText(full);
        const orig = btn.textContent;
        btn.textContent = "Copied ✓";
        showToast(t("skin_copy_toast"));
        setTimeout(() => { btn.textContent = orig; }, 1600);
      } catch {
        showToast("Contract: " + full.slice(0, 20) + "…");
      }
    });
  };

  /* ---- Adsgram energy refill (Tap page) ---- */
  const setupAdsgramRefill = () => {
    const btn = document.querySelector('[data-adsgram-energy]');
    if (!btn) return;

    const tryShowAd = (isRetry) => {
      if (!window.RealAdService) { showToast(t('ad_not_ready_msg')); return; }
      const origText = btn.getAttribute('data-orig-text') || btn.textContent;
      btn.setAttribute('data-orig-text', origText);
      btn.disabled = true;
      btn.textContent = isRetry ? t('btn_connecting_ton') : t('btn_loading_ad');

      window.RealAdService.showAd('bronze')
        .then(() => {
          hydrateFromPlayer();
          showToast(t('energy_filled'));
          try { window.dispatchEvent(new CustomEvent('real:burst', { detail: { label: '⚡ Energy filled!' } })); } catch (_) {}
          btn.disabled = false;
          btn.textContent = origText;
          btn.removeAttribute('data-orig-text');
        })
        .catch(err => {
          if (err.type === 'cooldown') {
            showToast(t('ad_cooldown_msg'));
            btn.disabled = false;
            btn.textContent = origText;
            btn.removeAttribute('data-orig-text');
          } else if (err.type === 'skipped') {
            showToast(t('ad_skipped_msg'));
            btn.disabled = false;
            btn.textContent = origText;
            btn.removeAttribute('data-orig-text');
          } else {
            /* No ads available — retry once after 2 s */
            if (!isRetry) {
              btn.textContent = t('ad_connecting_msg');
              showToast(t('ad_connecting_msg'));
              setTimeout(() => tryShowAd(true), 2000);
            } else {
              showToast(t('ad_unavailable_msg'));
              btn.disabled = false;
              btn.textContent = origText;
              btn.removeAttribute('data-orig-text');
            }
          }
        });
    };

    btn.addEventListener('click', () => tryShowAd(false));
  };

  /* ---- Claim button stub ---- */
  const setupClaim = () => {
    document.querySelectorAll("[data-action='claim']").forEach((btn) => {
      btn.addEventListener("click", () => {
        btn.textContent = t("btn_claimed_check","Claimed ✓");
        btn.disabled = true;
        showToast(t("skin_claimed_toast"));
        if (navigator.vibrate) navigator.vibrate([8, 4, 8]);
        setTimeout(() => {
          btn.textContent = t("btn_claim_arrow","Claim ›");
          btn.disabled = false;
        }, 6000);
      });
    });
  };

  /* ---- Public API — lets app.js Settings update the orb from any page ---- */
  window.RealSkins = {
    apply(id) {
      const skin = SKINS.find((s) => s.id === id);
      if (!skin || skin.locked) return false;
      saveSkin(skin.id);
      applyOrbSkin(skin);
      document.querySelectorAll("[data-skin-id]").forEach((c) => {
        c.classList.toggle("selected", c.getAttribute("data-skin-id") === skin.id);
      });
      return true;
    },
    getSkins: () => SKINS,
    getActive: getSavedSkin,
  };

  /* ---- Energy upgrade ---- */
  const setupEnergyUpgrade = () => {
    const btn    = document.getElementById('energy-upgrade-btn');
    const lvlEl  = document.getElementById('eu-level');
    const costEl = document.getElementById('eu-cost');
    const maxLbl = document.getElementById('eu-max-label');
    if (!btn) return;

    const t = (k, fb) => (window.RealI18N && window.RealI18N.t(k) !== k ? window.RealI18N.t(k) : fb) || fb || k;

    const ENERGY_BASE = 1000;
    const ENERGY_STEP = 500;
    const MAX_LEVEL   = 5;
    /* REAL cost per level (economy-balanced: 2K / 5K / 12K / 25K / 50K) */
    const COSTS = [2_000, 5_000, 12_000, 25_000, 50_000];

    const fmtReal = (n) => {
      if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M ◆';
      if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K ◆';
      return n + ' ◆';
    };

    const getLevel = () => { try { return Math.min(MAX_LEVEL, parseInt(localStorage.getItem('real_energy_level') || '0', 10)); } catch { return 0; } };
    const getReal  = () => {
      try {
        const fromPlayer = window.RealPlayer ? (window.RealPlayer.get().balance || 0) : 0;
        const ls = JSON.parse(localStorage.getItem('real_player_state_v1') || '{}');
        return Math.max(fromPlayer, ls.balance || 0);
      } catch { return 0; }
    };

    const refresh = () => {
      const level = getLevel();
      if (lvlEl)  lvlEl.textContent  = level + 1;    // display as 1-based

      if (level >= MAX_LEVEL) {
        if (maxLbl) maxLbl.textContent = t('energy_upgrade_max', 'Max level reached');
        if (costEl) costEl.textContent = '';
        btn.disabled = true;
        return;
      }

      const cost      = COSTS[level];
      const real      = getReal();
      const canAfford = real >= cost;
      if (maxLbl) maxLbl.textContent = `${ENERGY_BASE + level * ENERGY_STEP} → ${ENERGY_BASE + (level + 1) * ENERGY_STEP}`;
      if (costEl) costEl.textContent = fmtReal(cost);
      btn.disabled = false;
      btn.style.opacity = canAfford ? '1' : '.4';
      btn.title = canAfford ? '' : `Need ${fmtReal(cost)}`;
    };

    /* Inject one-time confirm modal styles */
    if (!document.getElementById('eu-confirm-style')) {
      const s = document.createElement('style');
      s.id = 'eu-confirm-style';
      s.textContent = `
        @keyframes eu-fade-in { from { opacity:0; transform:scale(.93) } to { opacity:1; transform:scale(1) } }
        #eu-confirm-overlay {
          position:fixed; inset:0; z-index:9999;
          background:rgba(0,0,0,.72);
          display:flex; align-items:center; justify-content:center; padding:20px;
          animation:eu-fade-in .16s ease;
        }
        #eu-confirm-box {
          background:linear-gradient(145deg,#0c1530,#0a0e22);
          border:1px solid rgba(94,162,255,.35); border-radius:18px;
          padding:24px 20px 20px; max-width:300px; width:100%;
          box-shadow:0 20px 60px rgba(0,0,0,.6); text-align:center;
        }
        #eu-confirm-box .eu-icon { font-size:34px; margin-bottom:10px; }
        #eu-confirm-box .eu-title { font-size:15px; font-weight:800; color:#e8e8f0; margin-bottom:8px; }
        #eu-confirm-box .eu-desc { font-size:12px; color:rgba(180,185,210,.7); margin-bottom:16px; line-height:1.6; }
        #eu-confirm-box .eu-desc strong { color:#5ea2ff; }
        #eu-confirm-box .eu-cost-box {
          background:rgba(94,162,255,.09); border:1px solid rgba(94,162,255,.25);
          border-radius:10px; padding:10px 14px; margin-bottom:20px;
        }
        #eu-confirm-box .eu-cost-lbl { font-size:10px; color:rgba(180,185,210,.55); text-transform:uppercase; letter-spacing:.5px; margin-bottom:3px; }
        #eu-confirm-box .eu-cost-val { font-size:22px; font-weight:900; color:#f4c56b; }
        #eu-confirm-box .eu-btns { display:flex; gap:10px; }
        #eu-btn-cancel {
          flex:1; padding:11px; border-radius:10px;
          border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.06);
          color:rgba(200,205,225,.7); font-size:13px; font-weight:700; cursor:pointer;
        }
        #eu-btn-confirm {
          flex:1; padding:11px; border-radius:10px;
          border:1px solid rgba(94,162,255,.45);
          background:linear-gradient(135deg,rgba(94,162,255,.22),rgba(94,162,255,.12));
          color:#5ea2ff; font-size:13px; font-weight:700; cursor:pointer;
        }
        #eu-btn-cancel:active { opacity:.7; }
        #eu-btn-confirm:active { opacity:.7; }
      `;
      document.head.appendChild(s);
    }

    const showUpgradeConfirm = (cost, fromMax, toMax, onConfirm) => {
      document.getElementById('eu-confirm-overlay')?.remove();
      const overlay = document.createElement('div');
      overlay.id = 'eu-confirm-overlay';
      overlay.innerHTML = `
        <div id="eu-confirm-box">
          <div class="eu-icon">⚡</div>
          <div class="eu-title">${t('energy_upgrade_lbl','Energy Upgrade')}</div>
          <div class="eu-desc">
            Max energy: <strong>${fromMax}</strong> → <strong>${toMax}</strong>
          </div>
          <div class="eu-cost-box">
            <div class="eu-cost-lbl">Cost</div>
            <div class="eu-cost-val">${fmtReal(cost)} REAL</div>
          </div>
          <div class="eu-btns">
            <button id="eu-btn-cancel">Cancel</button>
            <button id="eu-btn-confirm">Upgrade ◆</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
      overlay.querySelector('#eu-btn-cancel').addEventListener('click', () => overlay.remove());
      overlay.querySelector('#eu-btn-confirm').addEventListener('click', () => {
        overlay.remove();
        onConfirm();
      });
      if (navigator.vibrate) navigator.vibrate(6);
    };

    btn.addEventListener('click', () => {
      const level = getLevel();
      if (level >= MAX_LEVEL) return;
      const cost     = COSTS[level];
      const real     = getReal();
      const fromMax  = ENERGY_BASE + level * ENERGY_STEP;
      const toMax    = ENERGY_BASE + (level + 1) * ENERGY_STEP;
      const showToastFn = window._tapShowToast || ((m) => alert(m));
      if (real < cost) {
        showToastFn(`Need ${fmtReal(cost)} REAL to upgrade energy`);
        return;
      }
      showUpgradeConfirm(cost, fromMax, toMax, async () => {
        btn.disabled = true;
        const tgUser = (() => { try { return window.Telegram?.WebApp?.initDataUnsafe?.user; } catch { return null; } })();
        if (!tgUser?.id) { showToastFn('Open via Telegram to upgrade.'); btn.disabled = false; return; }

        try {
          const res = await fetch('/api/season2/inventory/upgrade-energy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegram_id: String(tgUser.id) }),
          }).then(r => r.ok ? r.json() : null);

          if (res?.status === 1) {
            /* Server confirmed — now update local state and reload */
            try {
              const ls = JSON.parse(localStorage.getItem('real_player_state_v1') || '{}');
              ls.balance = res.new_balance;
              localStorage.setItem('real_player_state_v1', JSON.stringify(ls));
              if (window.RealPlayer) window.RealPlayer.set({ balance: res.new_balance });
            } catch {}
            try { localStorage.setItem('real_energy_level', String(res.new_level)); } catch {}
            window.location.reload();
          } else {
            const msg = {
              insufficient_balance: `Need ${fmtReal(cost)} REAL to upgrade energy`,
              max_level:            'Energy is already at max level.',
            }[res?.error] || 'Upgrade failed. Please try again.';
            showToastFn(msg);
            btn.disabled = false;
          }
        } catch {
          showToastFn('Upgrade failed. Please try again.');
          btn.disabled = false;
        }
      });
    });

    refresh();
    /* Re-check affordability and level display whenever balances change.
       balanceUpdate fires after server sync (which also writes real_energy_level),
       so refresh() picks up the correct level on first load from a new device. */
    window.addEventListener('real:zar:updated', refresh);
    window.addEventListener('balanceUpdate', refresh);
  };

  /* ---- Auto-Clicker ---- */
  const setupAutoClicker = () => {
    const orb = document.querySelector('[data-energy-orb]');
    if (!orb) return;

    const t = (k, fb) => (window.RealI18N && window.RealI18N.t(k)) || fb || k;

    /* Inject badge into the tap orb area */
    const coreWrap = document.querySelector('[data-core]');
    let badge = null;
    const showBadge = (active) => {
      if (badge) badge.remove();
      if (!active) return;
      badge = document.createElement('div');
      badge.id = 'ac-active-badge';
      badge.textContent = '🤖 ' + t('ac_badge_label', 'Auto-Clicker ON');
      badge.style.cssText = [
        'position:absolute;top:-32px;left:50%;transform:translateX(-50%)',
        'background:linear-gradient(90deg,rgba(83,215,156,.18),rgba(94,162,255,.15))',
        'border:1px solid rgba(83,215,156,.4)',
        'color:var(--jade,#53d79c)',
        'font-size:10px;font-weight:700;letter-spacing:.06em',
        'padding:4px 10px;border-radius:20px',
        'animation:ac-pulse 1.8s ease-in-out infinite',
        'pointer-events:none;white-space:nowrap',
      ].join(';');
      if (coreWrap) coreWrap.style.position = 'relative';
      if (coreWrap) coreWrap.appendChild(badge);
    };

    /* Inject CSS for badge pulse */
    if (!document.getElementById('ac-style')) {
      const s = document.createElement('style');
      s.id = 'ac-style';
      s.textContent = '@keyframes ac-pulse{0%,100%{opacity:.7;box-shadow:0 0 0 0 rgba(83,215,156,.0)}50%{opacity:1;box-shadow:0 0 0 5px rgba(83,215,156,.15)}}';
      document.head.appendChild(s);
    }

    let _acInterval = null;

    const stopAC = () => {
      if (_acInterval) { clearInterval(_acInterval); _acInterval = null; }
      showBadge(false);
    };

    const startAC = (expiresAt) => {
      if (_acInterval) return; /* already running */
      showBadge(true);
      _acInterval = setInterval(() => {
        if (Date.now() >= expiresAt) { stopAC(); return; }
        /* Suppress haptic, then simulate tap */
        window._realAutoTapping = true;
        try { orb.click(); } catch (_) {}
        window._realAutoTapping = false;
      }, 1000);
    };

    /* Check on load */
    const acExp = (() => {
      try { return parseInt(localStorage.getItem('real_autoclicker_expires_at') || '0', 10); } catch { return 0; }
    })();
    if (acExp > Date.now()) startAC(acExp);

    /* React to purchase from inventory page */
    window.addEventListener('real:autoclicker:started', (e) => {
      const exp = e.detail && e.detail.expires_at;
      if (!exp) return;
      stopAC();
      startAC(exp);
    });

    /* Also re-check when page becomes visible (bfcache / tab switch) */
    document.addEventListener('visibilitychange', () => {
      if (document.hidden || _acInterval) return;
      const exp = (() => {
        try { return parseInt(localStorage.getItem('real_autoclicker_expires_at') || '0', 10); } catch { return 0; }
      })();
      if (exp > Date.now()) startAC(exp);
    });
  };

  /* ---- Live forge history ---- */
  let _historyReady = false;
  const addHistoryRow = (event, gain, time) => {
    const host = document.querySelector('[data-forge-history]');
    if (!host) return;
    if (!_historyReady) {
      host.innerHTML = '';   // clear the "Strike the anvil…" placeholder
      _historyReady = true;
    }
    const row = document.createElement('div');
    row.className = 'history-row';
    row.innerHTML = `<span class="h-event">${event}</span><span class="h-gain">${gain}</span><span class="h-time">${time}</span>`;
    host.insertBefore(row, host.firstChild);
    // Keep max 8 rows
    while (host.children.length > 8) host.removeChild(host.lastChild);
  };

  /* ---- Formatters ---- */
  const fmtNum = (n) => (window.RealI18N && window.RealI18N.formatNumber)
    ? window.RealI18N.formatNumber(n) : Number(n).toLocaleString();

  /* Compact K/M notation with Persian digit pipeline */
  const fmtCompact = (n) => {
    n = Number(n) || 0;
    let s;
    if (n >= 1_000_000) s = (n / 1_000_000).toFixed(1) + 'M';
    else if (n >= 1_000) s = (n / 1_000).toFixed(1) + 'K';
    else s = Math.floor(n).toString();
    return (window.RealI18N && window.RealI18N.toPersianDigits && window.RealI18N.getLang
      && window.RealI18N.getLang() === 'fa')
      ? window.RealI18N.toPersianDigits(s) : s;
  };

  /* ---- Hydrate display from Player state after sync ---- */
  const hydrateFromPlayer = () => {
    const p = (window.RealPlayer && window.RealPlayer.get) ? window.RealPlayer.get() : {};

    const balEl        = document.querySelector('[data-balance]');
    const energyEl     = document.querySelector('[data-energy]');
    const fillEl       = document.querySelector('[data-energy-fill]');
    const streakVal    = document.querySelector('[data-streak-val]');
    const zarHrEl      = document.querySelector('[data-zar-hr]');
    const realBalDisp  = document.querySelector('[data-real-bal-display]');

    /* ZAR balance — compact K notation */
    if (balEl) balEl.innerHTML = `<span class="zar-ico">🪙</span> ${fmtCompact(p.zar || 0)}`;

    /* energyMax: prefer Player state (set by app.js after reading localStorage),
       fall back to computing it directly so hydrateFromPlayer is always correct */
    const _emLvl = (() => { try { return Math.min(5, parseInt(localStorage.getItem('real_energy_level')||'0',10)); } catch { return 0; } })();
    const _emMax = p.energyMax > 1000 ? p.energyMax : 1000 + _emLvl * 500;
    const _emCur = p.energy != null ? p.energy : _emMax;
    if (energyEl) energyEl.textContent = fmtNum(_emCur);
    if (fillEl)   fillEl.style.width   = `${(_emCur / _emMax) * 100}%`;
    const _emMaxEl = document.querySelector('[data-energy-max-display]');
    if (_emMaxEl) _emMaxEl.textContent = _emMax;

    const streak = p.dailyStreak || 1;
    if (streakVal) streakVal.textContent = t('streak_days_tpl', { n: fmtNum(streak) });

    /* REAL balance display (replaces streak badge in stats bar) */
    if (realBalDisp) {
      const realBal = p.balance || 0;
      realBalDisp.innerHTML = RT + ' ' + fmtCompact(realBal);
    }

    /* ZAR/hr — pipe through fmtNum so FA gets Persian digits */
    if (zarHrEl) {
      try {
        const zarHr = parseInt(localStorage.getItem('real_total_zar_hr') || '0', 10);
        zarHrEl.innerHTML = `<span class="zar-ico">🪙</span> +${fmtNum(zarHr)}`;
      } catch { zarHrEl.innerHTML = '<span class="zar-ico">🪙</span> +0'; }
    }
  };

  /* ---- ZAR → REAL swap panel ---- */
  const setupSwap = () => {
    const swapInput  = document.querySelector('[data-swap-input]');
    const swapBtn    = document.querySelector('[data-swap-btn]');
    const swapNote   = document.querySelector('[data-swap-note]');
    const zarBalEl   = document.querySelector('[data-swap-zar-balance]');
    const realOutEl  = document.querySelector('[data-swap-real-out]');
    const rateLbl    = document.querySelector('[data-swap-rate-label]');
    if (!swapInput || !swapBtn) return;

    const getRate = () => {
      try { return Number(JSON.parse(localStorage.getItem('real_economy_config') || '{}').zar_to_real_rate) || 500; }
      catch { return 500; }
    };

    const updateSwapUI = () => {
      /* Always take the maximum of in-memory Player state and raw localStorage.
         Guards against any stale-read divergence between the two stores. */
      const getZar = () => {
        const fromPlayer = window.RealPlayer ? (window.RealPlayer.getResource('zar') || 0) : 0;
        try {
          const ls = JSON.parse(localStorage.getItem('real_player_state_v1') || '{}');
          const fromLS = ls.zar || 0;
          if (fromLS > fromPlayer && window.RealPlayer && window.RealPlayer.set) {
            window.RealPlayer.set({ zar: fromLS }); // self-heal stale in-memory value
          }
          return Math.max(fromPlayer, fromLS);
        } catch { return fromPlayer; }
      };
      const zarBal = getZar();
      const rate   = getRate();
      if (zarBalEl) zarBalEl.textContent = fmtNum(zarBal);
      if (rateLbl)  rateLbl.textContent  = t('swap_rate_label', { rate: fmtNum(rate) });
      const zarAmt = parseInt(swapInput.value || '0', 10);
      const realOut = zarAmt >= rate ? Math.floor(zarAmt / rate) : 0;
      if (realOutEl) realOutEl.innerHTML = fmtNum(realOut) + ' ' + RT + ' REAL';
      const canSwap = zarBal >= zarAmt && zarAmt >= rate;
      swapBtn.disabled = !canSwap;
      if (swapNote) {
        if (!zarAmt || zarAmt < rate) {
          swapNote.textContent = t('swap_min_label', { rate: fmtNum(rate) });
          swapNote.style.color = '';
        } else if (zarBal < zarAmt) {
          swapNote.textContent = t('swap_not_enough', { have: fmtNum(zarBal) });
          swapNote.style.color = '#ff6b6b';
        } else {
          swapNote.textContent = t('swap_convert_label', { zar: fmtNum(zarAmt), real: fmtNum(realOut) });
          swapNote.style.color = 'var(--jade, #4ad8a6)';
        }
      }
    };

    swapInput.addEventListener('input', updateSwapUI);

    const setSwapError = (msg) => {
      if (swapNote) { swapNote.textContent = msg; swapNote.style.color = '#ff6b6b'; }
      showToast(msg);
    };

    swapBtn.addEventListener('click', async () => {
      const zarAmt  = parseInt(swapInput.value || '0', 10);
      const rate    = getRate();
      const realOut = Math.floor(zarAmt / rate);
      if (realOut < 1) return;
      const tgUser = window.Telegram && window.Telegram.WebApp &&
                     window.Telegram.WebApp.initDataUnsafe &&
                     window.Telegram.WebApp.initDataUnsafe.user;
      if (!tgUser || !tgUser.id) { setSwapError(t('swap_tg_required')); return; }
      swapBtn.disabled = true;
      swapBtn.textContent = t('swap_ing');
      if (swapNote) { swapNote.textContent = ''; swapNote.style.color = ''; }
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 10000);
      try {
        const res = await fetch('/api/season2/user/zar-swap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegram_id: String(tgUser.id), amount_real: realOut }),
          signal: ctrl.signal,
        });
        clearTimeout(timeout);
        const r = res.ok ? await res.json() : null;
        if (r && r.status === 1) {
          if (window.RealPlayer && window.RealPlayer.set) {
            window.RealPlayer.set({ zar: r.new_zar, balance: r.new_real_balance });
          }
          /* Belt-and-suspenders: write fresh balances directly to localStorage
             so other pages (heroes.html) read the correct value even from bfcache. */
          try {
            const ls = JSON.parse(localStorage.getItem('real_player_state_v1') || '{}');
            ls.balance = r.new_real_balance;
            ls.zar     = r.new_zar;
            localStorage.setItem('real_player_state_v1', JSON.stringify(ls));
          } catch {}
          swapInput.value = '';
          updateSwapUI();
          hydrateFromPlayer();
          addHistoryRow(
            `ZAR → REAL`,
            `+${realOut} ${RT} REAL`,
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          );
          showToast(t('swap_success', { zar: fmtNum(zarAmt), real: fmtNum(realOut) }));
          if (navigator.vibrate) navigator.vibrate([8, 4, 8]);
        } else if (r && r.error === 'insufficient_zar') {
          setSwapError(t('swap_not_enough', { have: fmtNum(r.have || 0) }) + ` (${t('swap_min_label', { rate: fmtNum(r.need || zarAmt) })})`);
        } else if (!res.ok) {
          setSwapError(t('swap_server_error', { code: res.status }));
        } else {
          setSwapError(t('swap_failed'));
        }
      } catch (err) {
        clearTimeout(timeout);
        setSwapError(err.name === 'AbortError' ? t('swap_server_error', { code: 'timeout' }) : t('swap_failed'));
      } finally {
        swapBtn.disabled = false;
        swapBtn.textContent = t('swap_btn_label');
      }
    });

    // Update UI after sync resolves (balance may change)
    if (window.RealSync) window.RealSync.ready().then(updateSwapUI);
    updateSwapUI();

    // Live sync: refresh swap panel whenever ZAR changes.
    // First call fires immediately; subsequent calls are debounced to 200 ms
    // so rapid tapping doesn't thrash the DOM.
    let _zarUpdateTimer = null;
    let _swapFirstUpdate = true;
    window.addEventListener('real:zar:updated', () => {
      if (_swapFirstUpdate) {
        _swapFirstUpdate = false;
        updateSwapUI();
        return;
      }
      if (_zarUpdateTimer) clearTimeout(_zarUpdateTimer);
      _zarUpdateTimer = setTimeout(() => { _zarUpdateTimer = null; updateSwapUI(); }, 200);
    });
  };

  /* ---- Init ---- */
  const init = () => {
    /* Apply saved skin to orb on load (skin rail removed — managed via inventory) */
    const _currentSkin = SKINS.find(s => s.id === getSavedSkin()) || SKINS[0];
    applyOrbSkin(_currentSkin);
    setupEnhancedTapFX();
    setupAutoClicker();
    setupEnergyUpgrade();
    setupContractCopy();
    setupClaim();
    setupAdsgramRefill();
    setupSwap();

    // Hydrate immediately from localStorage Player state
    hydrateFromPlayer();

    // Re-hydrate once server sync completes (profile_pic, energy, balance, streak)
    if (window.RealSync) {
      window.RealSync.ready().then(() => {
        hydrateFromPlayer();
      });
    }

    // Language hot-swap: re-render all dynamic values in new locale
    window.addEventListener('real:lang:changed', () => {
      hydrateFromPlayer();
    });

    // Bfcache restore: refresh balances from localStorage
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) {
        try {
          const ls = JSON.parse(localStorage.getItem('real_player_state_v1') || '{}');
          if (window.RealPlayer && window.RealPlayer.set && ls.balance != null) {
            window.RealPlayer.set({ balance: ls.balance, zar: ls.zar || 0 });
          }
        } catch {}
        hydrateFromPlayer();
      }
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
