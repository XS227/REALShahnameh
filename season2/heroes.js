/* ==========================================================================
   REAL Shahnameh — Heroes / Collection page
   heroes.js — collection data, card rendering, certificate modal
   ========================================================================== */
(() => {
  "use strict";

  /* ---- Collection: Chapter 1 — Keyumars (10 items) ---- */
  const COLLECTION = [
    {
      id: "keyumars",
      name: "Keyumars",
      type: "character",
      rarity: "rare",
      chapter: 1,
      img: "/assets/images/heroes/keyumars-hero.png",
      emoji: "👑",
      role: "First King · Mountain Court",
      lore: "The first mortal king to wear a crown of leaves and rule from the sacred mountains. Keyumars taught humanity to cook food, craft garments, and live in order rather than savagery. His reign opened the age of civilization.",
      bonus: "+5% Tap Power · +8% Story XP",
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-001",
      season: 2,
      unlockCondition: "Complete Chapter 1 · The First King",
      futureTonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", pending: true }
    },
    {
      id: "siamak",
      name: "Siamak",
      type: "character",
      rarity: "common",
      chapter: 1,
      img: "/assets/images/heroes/siamak-hero.png",
      emoji: "🗡",
      role: "Prince of the Mountain · Fallen Hero",
      lore: "Son of Keyumars and first prince of the age. Siamak fell in battle against the servants of Ahriman, becoming a martyr whose death forged the first human resolve against darkness.",
      bonus: "+3% Quiz XP · +2 REAL/hr",
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-002",
      season: 2,
      unlockCondition: "Complete Chapter 1 · The First King",
      futureTonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", pending: true }
    },
    {
      id: "hushang",
      name: "Hushang",
      type: "character",
      rarity: "rare",
      chapter: 1,
      img: "/assets/images/heroes/hushang-hero.png",
      emoji: "🔥",
      role: "The Fire-Maker · Grandson of Keyumars",
      lore: "Hushang avenged Siamak and drove back the darkness. He discovered fire when striking flint against stone, lit the first hearth, and gave humanity warmth, metalwork, and feasts.",
      bonus: "+6% Tap Power · +4 REAL/hr",
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-003",
      season: 2,
      unlockCondition: "Complete Chapter 1 · The First King",
      futureTonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", pending: true }
    },
    {
      id: "ahriman",
      name: "Ahriman",
      type: "enemy",
      rarity: "epic",
      chapter: 1,
      img: "/assets/images/enemies/ahriman-boss.png",
      emoji: "🌑",
      role: "Lord of Darkness · Chapter 1 Boss",
      lore: "The eternal adversary. Ahriman sent his Black Div to destroy Siamak, hoping to extinguish the first flame of civilization before it could spread. His schemes are ancient, patient, and relentless.",
      bonus: "+8% Combo Duration · Risk: +15% Energy Cost",
      side: "dark",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-004",
      season: 2,
      unlockCondition: "Defeat Ahriman · Chapter 1 Boss",
      futureTonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", pending: true }
    },
    {
      id: "black-div",
      name: "Black Div",
      type: "enemy",
      rarity: "rare",
      chapter: 1,
      img: "/assets/images/enemies/black-div-enemy.png",
      emoji: "👁",
      role: "Dark Servant · Demon of Ahriman",
      lore: "A powerful div dispatched by Ahriman to slay Siamak. The Black Div embodied the forces of chaos and shadow that humanity would learn to resist through courage, order, and light.",
      bonus: "+4% Critical Hit Chance",
      side: "dark",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-005",
      season: 2,
      unlockCondition: "Complete Chapter 1 · The First King",
      futureTonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", pending: true }
    },
    {
      id: "mount-damavand",
      name: "Mount Damavand",
      type: "place",
      rarity: "legend",
      chapter: 1,
      img: "/assets/images/locations/mount-damavand-location.png",
      emoji: "🏔",
      role: "Sacred Peak · Throne of Keyumars",
      lore: "The volcano at the heart of the world. Keyumars built his first court on its slopes, and from those heights human civilization radiated outward. Damavand watches over all of Persia's epochs.",
      bonus: "+12% Daily Drop Chance · +6 REAL/hr",
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-006",
      season: 2,
      unlockCondition: "Complete Chapter 1 · The First King",
      futureTonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", pending: true }
    },
    {
      id: "royal-court",
      name: "Royal Court",
      type: "place",
      rarity: "rare",
      chapter: 1,
      img: "/assets/images/locations/royal-mountain-court.png",
      emoji: "🏛",
      role: "First Palace · Seat of the Crown",
      lore: "The court of Keyumars atop the sacred mountain. Here the first laws were made, the first ceremonies held, and the first of humanity's grand stories began to take shape.",
      bonus: "+6% Story XP Gain",
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-007",
      season: 2,
      unlockCondition: "Complete Chapter 1 · The First King",
      futureTonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", pending: true }
    },
    {
      id: "ancient-pars",
      name: "Ancient Pars",
      type: "place",
      rarity: "rare",
      chapter: 1,
      img: "/assets/images/locations/ancient-pars-location.png",
      emoji: "🌄",
      role: "Land of Origin · Homeland of the Shahs",
      lore: "The ancient heartland from which all Persian kings drew their divine mandate. Keyumars walked its rivers and mountains before ascending to his throne, and the land remembers him.",
      bonus: "+4% Auto-Mining Rate",
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-008",
      season: 2,
      unlockCondition: "Complete Chapter 1 · The First King",
      futureTonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", pending: true }
    },
    {
      id: "demon-forest",
      name: "Demon Forest",
      type: "place",
      rarity: "epic",
      chapter: 1,
      img: "/assets/images/locations/demon-forest-location.png",
      emoji: "🌑",
      role: "Dark Realm · Domain of Ahriman's Servants",
      lore: "The shadowed woods where the Black Div dwelled. Its darkness was the first enemy humanity faced — and in facing it, Hushang found the spark that became fire.",
      bonus: "+10% Combo Multiplier · High Risk zone",
      side: "dark",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-009",
      season: 2,
      unlockCondition: "Defeat Chapter 1 Boss",
      futureTonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", pending: true }
    },
    {
      id: "farr-codex",
      name: "Farr — Divine Light",
      type: "codex",
      rarity: "epic",
      chapter: 1,
      img: "/assets/images/lore/ferdowsi-intro.png",
      emoji: "✦",
      role: "Divine Concept · Royal Glory",
      lore: "Farr (Khvarenah) is the divine radiance that marks the rightful king. It cannot be seized by force — only earned through justice, wisdom, and valor. Keyumars bore it as the first mortal king.",
      bonus: "+10% Tap Power · Lore unlock: Farr concept tree",
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-010",
      season: 2,
      unlockCondition: "Complete Chapter 1 Quiz with 80%+ score",
      futureTonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", pending: true }
    }
  ];

  const RARITY_LABEL = {
    common: "Common", rare: "Rare", epic: "Epic",
    legend: "Legendary", mythic: "Mythic"
  };

  const TYPE_LABEL = {
    character: "Character", enemy: "Enemy",
    place: "Place", codex: "Codex"
  };

  /* ---- Helpers ---- */
  const showToast = (msg) => {
    const el = document.querySelector("[data-toast]");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove("show"), 2400);
  };

  /* ---- Build collection grid ---- */
  const buildCards = (filter) => {
    const grid = document.getElementById("coll-grid");
    if (!grid) return;
    grid.innerHTML = "";

    const items = filter === "all"
      ? COLLECTION
      : COLLECTION.filter((it) => it.type === filter);

    if (!items.length) {
      const empty = document.createElement("p");
      empty.style.cssText = "grid-column:1/-1;text-align:center;color:var(--muted);padding:24px 0;font-size:13px;";
      empty.textContent = "No items in this category yet.";
      grid.appendChild(empty);
    } else {
      items.forEach((item) => {
        const card = document.createElement("button");
        card.className = `coll-card r-${item.rarity}`;
        card.setAttribute("aria-label", item.name);

        let portraitContent = "";
        if (item.img) {
          portraitContent = `
            <img src="${item.img}" alt="${item.name}" loading="lazy"
              onerror="this.style.display='none';this.parentNode.querySelector('.coll-emoji').style.display='flex'">
            <span class="coll-emoji" style="display:none;">${item.emoji || "?"}</span>`;
        } else {
          portraitContent = `<span class="coll-emoji">${item.emoji || "?"}</span>`;
        }

        card.innerHTML = `
          <div class="coll-portrait">
            ${portraitContent}
            <span class="coll-type-chip">${TYPE_LABEL[item.type] || item.type}</span>
            <span class="coll-chapter-dot">Ch${item.chapter}</span>
          </div>
          <div class="coll-info">
            <div class="coll-name">${item.name}</div>
            <div class="coll-rarity">${RARITY_LABEL[item.rarity] || item.rarity}</div>
          </div>
        `;

        card.addEventListener("click", () => openCertificate(item));
        grid.appendChild(card);
      });
    }

    buildComingLater(grid, filter);
  };

  /* ---- Coming later teaser ---- */
  const buildComingLater = (grid, filter) => {
    if (filter !== "all" && filter !== "character") return;

    const locked = document.createElement("div");
    locked.className = "coll-locked-chapter";
    locked.innerHTML = `
      <div class="clc-lock">🔒</div>
      <div>
        <div class="clc-title">Chapters 2 – 50</div>
        <div class="clc-count">49 items locked · Complete new chapters</div>
      </div>
      <img class="clc-thumb"
        src="/season2/uploads/chapters/hushang.png" alt=""
        onerror="this.outerHTML='<div class=clc-thumb-fallback>🏰</div>'">
    `;
    grid.appendChild(locked);
  };

  /* ---- Certificate of Discovery modal ---- */
  const openCertificate = (item) => {
    const backdrop = document.getElementById("cert-backdrop");
    const modal    = document.getElementById("cert-modal");
    if (!backdrop || !modal) return;

    let portraitInner = "";
    if (item.img) {
      portraitInner = `
        <img src="${item.img}" alt="${item.name}"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="cert-portrait-emoji" style="display:none;">${item.emoji || "?"}</div>`;
    } else {
      portraitInner = `<div class="cert-portrait-emoji">${item.emoji || "?"}</div>`;
    }

    const sideTag = item.side === "dark"
      ? `<span class="cert-tag side-dark">Dark Side</span>`
      : `<span class="cert-tag side-light">Light Side</span>`;

    const nftLine = item.nftReady
      ? `<div class="cert-nft-badge"><span class="nft-ico">◆</span> NFT Ready · Claim on TON</div>`
      : `<div class="cert-nft-badge"><span class="nft-ico">◈</span> NFT Pending · Will mint on TON after TGE</div>`;

    modal.innerHTML = `
      <div class="cert-grabber-row"><div class="cert-grabber"></div></div>

      <div class="cert-portrait-panel">
        ${portraitInner}
        <span class="cert-type-badge t-${item.type}">${TYPE_LABEL[item.type] || item.type}</span>
        <button class="cert-close" id="cert-close-btn" aria-label="Close">✕</button>
      </div>

      <div class="cert-scroll">
        <div class="cert-watermark">◆ Certificate of Discovery · REAL Shahnameh</div>

        <div class="cert-name-row">
          <h2 class="cert-name">${item.name}</h2>
          <span class="cert-rarity-pill r-${item.rarity}">${RARITY_LABEL[item.rarity] || item.rarity}</span>
        </div>

        <div class="cert-role">${item.role}</div>

        <div class="cert-tags">
          <span class="cert-tag era">Season ${item.season} · Ch.${item.chapter}</span>
          <span class="cert-tag season">◆ REAL Collection</span>
          ${sideTag}
        </div>

        <p class="cert-lore">${item.lore}</p>

        <div class="cert-bonus">${item.bonus}</div>

        ${nftLine}

        <div class="cert-footer">
          <div>ID: <code>${item.collectionId}</code></div>
          <div>Unlock: ${item.unlockCondition}</div>
          <div>TON standard: <code>${item.futureTonMetadata.standard}</code> · ${item.futureTonMetadata.pending ? "Pending mint" : "Minted"}</div>
        </div>
      </div>
    `;

    backdrop.classList.add("open");
    if (navigator.vibrate) navigator.vibrate(6);

    document.getElementById("cert-close-btn")
      .addEventListener("click", closeCertificate);
  };

  const closeCertificate = () => {
    const backdrop = document.getElementById("cert-backdrop");
    if (backdrop) backdrop.classList.remove("open");
  };

  /* ---- Tab filtering ---- */
  const setupTabs = () => {
    const tabBar = document.getElementById("coll-tabs");
    if (!tabBar) return;

    tabBar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter]");
      if (!btn) return;
      tabBar.querySelectorAll("[data-filter]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      buildCards(btn.getAttribute("data-filter"));
    });
  };

  /* ---- Init ---- */
  const init = () => {
    setupTabs();
    buildCards("all");

    const backdrop = document.getElementById("cert-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) closeCertificate();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeCertificate();
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
