/* ==========================================================================
   REAL Shahnameh — Tap page: Skin system + Enhanced tap FX
   tap.js — loaded after app.js and market.js
   ========================================================================== */
(() => {
  "use strict";

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
      locked: true,
      unlock: "Story · Ch. 1"
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
      unlock: "Airdrop"
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
    if (!orbImg || !orbText) return;

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

      const rarityLabel = {
        default: "Default", common: "Common", rare: "Rare",
        epic: "Epic", legend: "Legend", mythic: "Mythic"
      }[skin.rarity] || skin.rarity;

      btn.innerHTML = `
        <div class="skin-portrait ${rc}">${portInner}</div>
        <div class="skin-name">${skin.name}</div>
        <div class="skin-sub ${rc}">${skin.locked ? (skin.unlock || "Locked") : rarityLabel}</div>
      `;

      btn.addEventListener("click", () => {
        if (skin.locked) {
          showToast(`🔒 ${skin.name} — ${skin.unlock || "Coming soon"}`);
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
        showToast(`${skin.name} skin equipped`);
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

    const spawnFX = (event) => {
      if (document.hidden) return;

      const rect = coreWrap.getBoundingClientRect();
      const cx   = rect.width  / 2;
      const cy   = rect.height / 2;
      const ex   = event && event.clientX != null ? event.clientX - rect.left : cx;
      const ey   = event && event.clientY != null ? event.clientY - rect.top  : cy;

      /* --- Ring burst --- */
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

      /* --- +REAL label --- */
      const rl = document.createElement("span");
      rl.className = "real-label-float";
      rl.textContent = "+REAL";
      rl.style.left = `${ex - 22}px`;
      rl.style.top  = `${ey - 32}px`;
      coreWrap.appendChild(rl);
      setTimeout(() => rl.remove(), 950);

      /* --- +XP label (every 3rd tap) --- */
      tapCount++;
      if (tapCount % 3 === 0) {
        const xp = document.createElement("span");
        xp.className = "xp-label-float";
        xp.textContent = "+XP";
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
      if (!full) { showToast("Contract address coming soon"); return; }
      try {
        await navigator.clipboard.writeText(full);
        const orig = btn.textContent;
        btn.textContent = "Copied ✓";
        showToast("Contract address copied");
        setTimeout(() => { btn.textContent = orig; }, 1600);
      } catch {
        showToast("Contract: " + full.slice(0, 20) + "…");
      }
    });
  };

  /* ---- Claim button stub ---- */
  const setupClaim = () => {
    document.querySelectorAll("[data-action='claim']").forEach((btn) => {
      btn.addEventListener("click", () => {
        btn.textContent = "Claimed ✓";
        btn.disabled = true;
        showToast("+172 REAL claimed to balance!");
        if (navigator.vibrate) navigator.vibrate([8, 4, 8]);
        setTimeout(() => {
          btn.textContent = "Claim ›";
          btn.disabled = false;
        }, 6000);
      });
    });
  };

  /* ---- Init ---- */
  const init = () => {
    buildSkinRail();
    setupEnhancedTapFX();
    setupContractCopy();
    setupClaim();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
