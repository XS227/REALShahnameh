/* ==========================================================================
   REAL Shahnameh — Clan / Army of Pars
   Re-skins the old referral system into a clan progression. Inviting a
   friend grows your clan; clan strength gates battles. Rank thresholds
   are intentionally chunky so each step feels like a promotion.
   ========================================================================== */
(() => {
  "use strict";

  const CLAN_TIERS = [
    { min: 0,  rank: "Lone Warrior",       icon: "⚔", sub: "You ride alone. Invite warriors to grow your warband." },
    { min: 3,  rank: "Small Warband",      icon: "🛡", sub: "Three swords at your side. The first raids open." },
    { min: 10, rank: "Clan Leader",        icon: "🏹", sub: "Ten warriors follow your banner." },
    { min: 25, rank: "Commander of Pars",  icon: "🦁", sub: "Twenty-five lions of Pars march behind you." },
    { min: 50, rank: "Shah's Army",        icon: "👑", sub: "The Shah's Army. Reserved for legends." }
  ];

  /* Try to read current clan size from the persisted Player. Falls back to 0. */
  const readClanSize = () => {
    try {
      const raw = localStorage.getItem("real_player_state_v1");
      if (!raw) return 0;
      const p = JSON.parse(raw);
      const n = Number(p && p.referrals);
      return isFinite(n) ? n : 0;
    } catch { return 0; }
  };

  const currentTier = (size) => {
    let cur = CLAN_TIERS[0];
    for (const t of CLAN_TIERS) if (size >= t.min) cur = t;
    return cur;
  };
  const nextTier = (size) => {
    for (const t of CLAN_TIERS) if (t.min > size) return t;
    return null;
  };

  const size = readClanSize();
  const tier = currentTier(size);
  const next = nextTier(size);

  const $ = (s) => document.querySelector(s);
  const setText = (sel, txt) => { const el = $(sel); if (el) el.textContent = txt; };

  setText("[data-clan-icon]", tier.icon);
  setText("[data-clan-rank]", tier.rank);
  setText("[data-clan-sub]",  tier.sub);
  setText("[data-clan-count]", String(size));

  const fillEl = $("[data-clan-fill]");
  const nextEl = $("[data-clan-next]");
  if (next) {
    const span = next.min - tier.min || next.min || 1;
    const into = Math.max(0, size - tier.min);
    const pct  = Math.min(100, Math.round((into / span) * 100));
    if (fillEl) fillEl.style.width = `${Math.max(2, pct)}%`;
    if (nextEl) nextEl.textContent = `Next: ${next.min} warriors → ${next.rank}`;
  } else {
    if (fillEl) fillEl.style.width = "100%";
    if (nextEl) nextEl.textContent = "Max rank reached — long live the Shah!";
  }

  /* Render the Clan Tiers ladder. */
  const tiersHost = $("[data-clan-tiers]");
  if (tiersHost) {
    tiersHost.innerHTML = CLAN_TIERS.map((t) => {
      const reached = size >= t.min;
      const cls = reached ? "done" : "";
      const subline = reached
        ? "Unlocked — battle ranks open"
        : `Need ${t.min - size} more warrior${(t.min - size) === 1 ? "" : "s"}`;
      return `
        <article class="card milestone ${cls}">
          <span class="crest">${t.icon}</span>
          <div>
            <h4>${t.rank}</h4>
            <p class="copy">${t.min === 0 ? "Starting rank" : t.min + "+ warriors"} — ${subline}</p>
            <div class="mini-bar"><span class="fill" style="width:${reached ? 100 : Math.min(100, Math.round((size / (t.min || 1)) * 100))}%;"></span></div>
          </div>
          <div class="reward-tag">${reached ? "✓" : "Locked"}</div>
        </article>`;
    }).join("");
  }

  /* Mark battle gates as locked/unlocked based on clan size. */
  document.querySelectorAll("[data-gate-min]").forEach((el) => {
    const min = Number(el.getAttribute("data-gate-min")) || 0;
    if (size < min) {
      el.style.opacity = "0.65";
      el.style.filter = "grayscale(.35)";
      // Append a small "locked" hint if not already there.
      if (!el.querySelector(".gate-locked")) {
        const hint = document.createElement("span");
        hint.className = "gate-locked";
        hint.style.cssText = "display:inline-block; margin-top:6px; font-size:11px; color:var(--ember, #ff8a3d);";
        hint.textContent = `🔒 Recruit ${min - size} more warrior${(min - size) === 1 ? "" : "s"} to unlock`;
        const body = el.querySelector("div");
        if (body) body.appendChild(hint);
      }
    }
  });
})();
