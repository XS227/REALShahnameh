/* ==========================================================================
   REAL Shahnameh — Offerings to the Flame
   Ceremonial economy UI. Language: sacred, not transactional.
   "Offer" / "Preserve" / "Awaken" — never "buy" / "spend" / "pay"
   ========================================================================== */

(() => {
  "use strict";

  const t = (key, fb) => {
    try {
      const l = localStorage.getItem("real_lang") || "en";
      const loc = window.RealI18NLocales;
      return (loc && loc[l] && loc[l][key]) || (loc && loc.en && loc.en[key]) || fb || key;
    } catch { return fb || key; }
  };

  const toast = (msg) => {
    const el = document.querySelector("[data-toast]");
    if (!el) return;
    el.textContent = msg; el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 2600);
  };

  const post = async (url, body) => {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return r.ok ? r.json() : null;
    } catch { return null; }
  };

  const tgId = () => {
    try { return String(window.Telegram?.WebApp?.initDataUnsafe?.user?.id || ""); } catch { return ""; }
  };

  /* ── Offering state ───────────────────────────────────────────────────── */
  const STATE_KEY = "real_offerings_v1";

  const getState = () => {
    try { return JSON.parse(localStorage.getItem(STATE_KEY) || "{}"); } catch { return {}; }
  };
  const saveState = (s) => {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch {}
  };

  /* ── Player resource helpers ──────────────────────────────────────────── */
  const getRes = (kind) => {
    if (!window.RealPlayer) return 0;
    if (kind === "energy") return window.RealPlayer.get().energy || 0;
    if (kind === "real")   return window.RealPlayer.get().balance || 0;
    return window.RealPlayer.getResource ? (window.RealPlayer.getResource(kind) || 0) : (window.RealPlayer.get()[kind] || 0);
  };

  const deductRes = (kind, amount) => {
    if (!window.RealPlayer) return;
    if (kind === "energy") {
      const cur = window.RealPlayer.get().energy || 0;
      window.RealPlayer.set({ energy: Math.max(0, cur - amount) });
      return;
    }
    if (kind === "real") {
      const cur = window.RealPlayer.get().balance || 0;
      window.RealPlayer.set({ balance: Math.max(0, cur - amount) });
      return;
    }
    if (window.RealPlayer.addResource) {
      window.RealPlayer.addResource(kind, -amount);
    } else {
      const cur = window.RealPlayer.get()[kind] || 0;
      window.RealPlayer.set({ [kind]: Math.max(0, cur - amount) });
    }
  };

  /* Today's tap count (daily counter, not a balance — spending it resets progress) */
  const getTapsToday = () => {
    try {
      const dk = new Date().toISOString().slice(0, 10);
      return parseInt(localStorage.getItem("real_daily_taps_" + dk) || "0", 10);
    } catch { return 0; }
  };

  const deductTaps = (amount) => {
    try {
      const dk = new Date().toISOString().slice(0, 10);
      const key = "real_daily_taps_" + dk;
      const cur = parseInt(localStorage.getItem(key) || "0", 10);
      localStorage.setItem(key, String(Math.max(0, cur - amount)));
    } catch {}
  };

  /* Push updated balances to server (fire-and-forget, non-blocking) */
  const syncToServer = () => {
    const id = tgId();
    if (!id || !window.RealPlayer) return;
    const p = window.RealPlayer.get();
    post("/api/season2/user/sync-balance", {
      telegram_id:     id,
      real_balance:    p.balance  || 0,
      current_energy:  p.energy   || 0,
      farr:            p.farr     || 0,
      zar:             p.zar      || 0,
      gems:            p.gems     || 0,
      xp:              p.xp       || 0,
    });
  };

  /* ── Offering definitions ─────────────────────────────────────────────── */
  /*
   * cost.kind  — resource type
   * cost.amount — how much to deduct
   * For "taps": we check daily taps and deduct from that counter
   */
  const OFFERINGS = {
    zar:  { cost: { kind: "energy", amount: 500  } },
    fire: { cost: { kind: "taps",   amount: 1000 } },
    lore: { cost: { kind: "farr",   amount: 3    } },
    real: { cost: { kind: "real",   amount: 100  } },
  };

  const INSUFFICIENT_MSG = {
    energy: () => t("offering_need_energy",  `Need 500 ⚡ Energy to make this offering.`),
    taps:   () => t("offering_need_taps",    `Need 1,000 taps today to make this offering.`),
    farr:   () => t("offering_need_farr",    `Need 3 ✦ Farr to make this offering. Complete chapters to earn Farr.`),
    real:   () => t("offering_need_real",    `Need 100 REAL to make this offering.`),
  };

  /* ── Candle flame reward animation ───────────────────────────────────── */
  const showFlameAccept = (onDone) => {
    const el = document.createElement("div");
    el.style.cssText = `
      position:fixed; inset:0; z-index:9600; display:flex;
      align-items:center; justify-content:center;
      background:rgba(4,5,11,.82); opacity:0;
      transition:opacity 0.7s ease; pointer-events:none;
    `;
    el.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:72px; line-height:1; filter:drop-shadow(0 0 28px rgba(255,138,61,.8));
          animation:flame-breathe 1.4s ease-in-out infinite;">🔥</div>
        <div style="margin-top:20px; font-size:14px; color:var(--gold);
          letter-spacing:.5px; font-style:italic; opacity:0;
          animation:ha-fade-up 0.8s ease 0.5s forwards;">
          ✦ The flame accepts your offering.
        </div>
      </div>
    `;
    document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = "1"; el.style.pointerEvents = "auto"; });
    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => { el.remove(); if (onDone) onDone(); }, 700);
    }, 2200);
  };

  /* ── Attempt an offering ──────────────────────────────────────────────── */
  const makeOffering = (type) => {
    const state = getState();
    const def = OFFERINGS[type];
    if (!def) return;

    const { kind, amount } = def.cost;

    /* Check resources */
    if (kind === "taps") {
      if (getTapsToday() < amount) {
        toast(INSUFFICIENT_MSG.taps());
        return;
      }
    } else {
      if (getRes(kind) < amount) {
        toast((INSUFFICIENT_MSG[kind] || INSUFFICIENT_MSG.real)());
        return;
      }
    }

    /* Deduct */
    if (kind === "taps") {
      deductTaps(amount);
    } else {
      deductRes(kind, amount);
    }

    /* Persist count */
    const countKey = `${type}_count`;
    state[countKey] = (state[countKey] || 0) + 1;
    saveState(state);

    /* Sync updated balances to server */
    syncToServer();

    /* Notify the rest of the app that resources changed */
    try { window.dispatchEvent(new CustomEvent("shahnama:state_sync")); } catch {}

    if (window.RealAudio) window.RealAudio.sounds.loreUnlock?.();

    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
      } else if (navigator.vibrate) { navigator.vibrate([12, 60, 12]); }
    } catch {}

    showFlameAccept(() => {
      toast(t("offering_accepted", "✦ The flame accepts your offering."));
      updateOfferedCount(type, state[countKey]);
    });
  };

  /* ── Update button UI after offering ─────────────────────────────────── */
  const updateOfferedCount = (type, count) => {
    const card = document.querySelector(`[data-offering="${type}"]`);
    if (!card) return;
    const btn = card.querySelector("[data-offer-btn]");
    if (btn) {
      btn.textContent = `✦ Offered ${count}×`;
      btn.style.opacity = "0.65";
    }
  };

  /* ── Init ─────────────────────────────────────────────────────────────── */
  const init = () => {
    // Restore offered counts from state
    const state = getState();
    Object.keys(OFFERINGS).forEach(type => {
      const count = state[`${type}_count`] || 0;
      if (count > 0) updateOfferedCount(type, count);
    });

    // Bind offer buttons
    document.querySelectorAll("[data-offer-btn]").forEach(btn => {
      btn.addEventListener("click", () => {
        const type = btn.getAttribute("data-offer-btn");
        makeOffering(type);
      });
    });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

})();
