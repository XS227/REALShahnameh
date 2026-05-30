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

  /* Map hardcoded unlock strings to i18n keys */
  const UNLOCK_KEYS = {
    "Story · Ch. 1": "skin_unlock_ch1",
    "Story · Ch. 2": "skin_unlock_ch2",
    "500 REAL":      "skin_unlock_500",
    "1,000 REAL":    "skin_unlock_1000",
    "Season drop":   "skin_unlock_season",
    "Legendary":     "skin_unlock_legendary",
  };
  const unlockLabel = (s) => s ? (t(UNLOCK_KEYS[s] || s)) : t("locked_label");

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

  /* ---- Build skin rail ---- */
  const buildSkinRail = () => {
    const rail = document.querySelector("[data-skin-rail]");
    if (!rail) return;

    const savedId = getSavedSkin();

    SKINS.forEach((skin) => {
      const btn = document.createElement("button");
      const rc  = `r-${skin.rarity}`;

      btn.className = [
        "skin-card",
        skin.locked ? "locked" : "",
        (!skin.locked && skin.id === savedId) ? "selected" : ""
      ].filter(Boolean).join(" ");

      btn.setAttribute("data-skin-id", skin.id);
      btn.setAttribute("aria-label", skin.name + (skin.locked ? " — locked" : ""));

      /* Portrait inner HTML */
      let portInner = "";
      if (skin.img) {
        portInner = `<img src="${skin.img}" alt="${skin.name}" loading="lazy"
          onerror="this.style.display='none';this.insertAdjacentHTML('afterend','<span>${skin.emoji || ""}</span>')">`;
      } else {
        portInner = `<span>${skin.emoji || "?"}</span>`;
      }
      if (skin.locked) {
        portInner += `<span class="skin-lock-overlay">🔒</span>`;
      } else if (skin.id === savedId) {
        portInner += `<span class="skin-selected-check">✓</span>`;
      }

      const rarityLabel = ({
        default: t("rarity_default"),
        common:  t("rarity_common"),
        rare:    t("rarity_rare"),
        epic:    t("rarity_epic"),
        legend:  t("rarity_legend"),
        mythic:  t("rarity_mythic"),
      })[skin.rarity] || skin.rarity;

      btn.innerHTML = `
        <div class="skin-portrait ${rc}">${portInner}</div>
        <div class="skin-name">${t('skin_' + skin.id) || skin.name}</div>
        <div class="skin-sub ${rc}">${skin.locked ? unlockLabel(skin.unlock) : rarityLabel}</div>
      `;

      btn.addEventListener("click", () => {
        if (skin.locked) {
          const cond = unlockLabel(skin.unlock);
          const msg = cond.includes('REAL')
            ? `🔒 ${skin.name} — Cost: ${cond}`
            : `🔒 ${skin.name} — ${cond}`;
          showToast(msg);
          if (navigator.vibrate) navigator.vibrate(6);
          return;
        }
        /* Deselect all, re-mark selected */
        document.querySelectorAll(".skin-card").forEach((c) => {
          c.classList.remove("selected");
          const chk = c.querySelector(".skin-selected-check");
          if (chk) chk.remove();
        });
        btn.classList.add("selected");
        /* Add checkmark */
        const portrait = btn.querySelector(".skin-portrait");
        if (portrait && !portrait.querySelector(".skin-selected-check")) {
          const chk = document.createElement("span");
          chk.className = "skin-selected-check";
          chk.textContent = "✓";
          portrait.appendChild(chk);
        }
        saveSkin(skin.id);
        applyOrbSkin(skin);
        if (navigator.vibrate) navigator.vibrate(8);
        showToast(`${skin.name} — ${t("skin_equipped_toast")}`);
      });

      rail.appendChild(btn);
    });

    /* Apply saved skin to orb immediately */
    const current = SKINS.find((s) => s.id === savedId) || SKINS[0];
    applyOrbSkin(current);
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

    if (energyEl) energyEl.textContent = fmtNum(p.energy != null ? p.energy : 1000);
    if (fillEl)   fillEl.style.width   = ((p.energy != null ? p.energy : 1000) / (p.energyMax || 1000) * 100) + '%';

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
    buildSkinRail();
    setupEnhancedTapFX();
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
