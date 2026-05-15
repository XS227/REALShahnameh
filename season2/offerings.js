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

  /* ── Offering state ───────────────────────────────────────────────────── */
  const STATE_KEY = "real_offerings_v1";

  const getState = () => {
    try { return JSON.parse(localStorage.getItem(STATE_KEY) || "{}"); } catch { return {}; }
  };
  const saveState = (s) => {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch {}
  };

  /* ── Player resources (from existing store) ───────────────────────────── */
  const getPlayerState = () => {
    try { return JSON.parse(localStorage.getItem("real_player_state_v1") || "{}"); } catch { return {}; }
  };

  /* ── Offering definitions ─────────────────────────────────────────────── */
  const OFFERINGS = {
    zar:  { cost: { energy: 500 },  rewardMsg: "The Zar offering has been accepted. Your chronicle bond grows." },
    fire: { cost: { taps: 1000 },   rewardMsg: "The flame breathes stronger. The chronicle remembers your offering." },
    lore: { cost: { lore: 3 },      rewardMsg: "A forgotten memory awakens from the depths of the chronicle." },
    real: { cost: { real: 100 },    rewardMsg: "Your name is sealed in the chronicle. A true Keeper of the Flame." },
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
    const player = getPlayerState();
    const def = OFFERINGS[type];
    if (!def) return;

    /* For demo mode: all offerings are accepted freely (resources are simulated).
       In production wire real resource checks here. */
    const DEMO = true;

    if (!DEMO) {
      // TODO: real resource deduction
      toast(t("offering_insufficient", "You do not yet carry enough to make this offering."));
      return;
    }

    const countKey = `${type}_count`;
    state[countKey] = (state[countKey] || 0) + 1;
    saveState(state);

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
