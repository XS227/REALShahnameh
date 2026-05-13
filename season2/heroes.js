/* ==========================================================================
   REAL Shahnameh — Heroes / Collection page
   heroes.js — premium collectible codex, certificate modal, particles
   ========================================================================== */
(() => {
  "use strict";

  /* =========================================================
     COLLECTION DATA — Chapter 1 (10 items)
     ========================================================= */
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
      lore: "The first mortal king to wear a crown of leaves and rule from the sacred mountains, teaching humanity to cook food, craft garments, and live in order rather than savagery.",
      biography: "Born from the sacred mountains at the dawn of time, Keyumars was the first being to claim kingship over the mortal world. He built his court on the slopes of Damavand and taught the first arts of civilization — clothing, cooking, ceremony, and law. His reign established the divine template for all future Persian kings, and his Farr (divine glory) shone as the first light in the age of humanity.",
      faction: "First Dynasty · Mountain Court · Pishdad Line",
      mythologyRole: "Proto-king who bridged divine and mortal worlds; first bearer of Farr",
      powers: ["+5% Tap Power", "+8% Story XP", "Passive: Farr Aura — quiz error penalty –8%"],
      storyAppearances: ["Chapter 1: The First King — The Mountain Court", "Chapter 1 Quiz: The Age of Keyumars"],
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-001",
      season: 2,
      unlockCondition: "Complete Chapter 1 · The First King",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
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
      lore: "Son of Keyumars, first prince of the age. Siamak fell in battle against the servants of Ahriman, becoming a martyr whose death forged humanity's first resolve against darkness.",
      biography: "Son and chosen heir of Keyumars. Siamak's death at the hands of Ahriman's Black Div was the first great tragedy of the world — the moment humanity understood mortality and the true cost of light opposing darkness. His sacrifice galvanized Hushang to avenge him, and through that vengeance, civilization's flame was kept alive.",
      faction: "First Dynasty · Mountain Court · Pishdad Line",
      mythologyRole: "First human martyr; symbol of nobility sacrificed for the survival of civilization",
      powers: ["+3% Quiz XP", "+2 REAL/hr", "Passive: Martyr's Memory — story scene bonus XP"],
      storyAppearances: ["Chapter 1: The First King — The Fall of Siamak", "Chapter 1: Ahriman's Plot"],
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-002",
      season: 2,
      unlockCondition: "Complete Chapter 1 · The First King",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
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
      biography: "Grandson of Keyumars and avenger of Siamak, Hushang became the second great king of the world. Where Keyumars established order, Hushang gave humanity the tools of material progress. He discovered fire when a black serpent he pursued fled across rocks — the flint striking sparks. He declared fire sacred to Ahura Mazda, forged the first iron tools, hunted great beasts, and built the first irrigation canals.",
      faction: "First Dynasty · Pishdad Line · Civilizing Kings",
      mythologyRole: "Civilizer-king; discoverer of fire; founder of metalwork, hunting, and irrigation",
      powers: ["+6% Tap Power", "+4 REAL/hr", "Passive: Fire-Maker — critical tap chance +3%"],
      storyAppearances: ["Chapter 1: The First King — The Age of Hushang", "Chapter 1 Reward: The Discovery of Fire"],
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-003",
      season: 2,
      unlockCondition: "Complete Chapter 1 · The First King",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
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
      biography: "The eternal dark principle in Zoroastrian cosmology, Ahriman is not merely an enemy king but the embodiment of destruction, chaos, and the Lie (Druj). He works through agents — divs, sorcerers, corrupt kings — rather than appearing directly. His patience is geological, his malice total. The encounter in Chapter 1 is only his first shadow falling across the world.",
      faction: "Forces of Darkness · Ahriman's Court · Realm of Druj",
      mythologyRole: "Cosmic antagonist; embodiment of the Lie; eternal opposition to Ahura Mazda's order",
      powers: ["+8% Combo Duration", "Risk: +15% Energy Cost", "Passive: Darkness Aura — rare crit ×2 but volatile"],
      storyAppearances: ["Chapter 1: Ahriman's Plot", "Chapter 1 Boss Encounter: Lord of Darkness"],
      side: "dark",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-004",
      season: 2,
      unlockCondition: "Defeat Ahriman · Chapter 1 Boss",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
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
      lore: "A powerful div dispatched by Ahriman to slay Siamak. The Black Div embodied the forces of chaos — but its defeat by Hushang forged humanity's first true victory over darkness.",
      biography: "One of the most feared divs in Ahriman's service. The Black Div was sent to destroy Siamak, and succeeded — but in doing so awakened Hushang's righteous fury and forged the first human will to resist darkness. When Hushang pursued a black serpent across the stony ground, the sparks of his flint strike lit the world's first fire — light born from the blackest encounter.",
      faction: "Forces of Darkness · Ahriman's Servants · Div Legion",
      mythologyRole: "Archetype of the powerful adversary whose defeat catalyzes human strength",
      powers: ["+4% Critical Hit Chance", "Passive: Dark Knowledge — enemy codex entries unlocked"],
      storyAppearances: ["Chapter 1: The Fall of Siamak", "Chapter 1 Boss: Phase 1 — The Black Servant"],
      side: "dark",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-005",
      season: 2,
      unlockCondition: "Complete Chapter 1 · The First King",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
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
      lore: "The great volcano at the heart of the world. Keyumars built his first court on its slopes, and from those heights human civilization radiated outward. Damavand watches over all of Persia's epochs.",
      biography: "The great volcanic mountain of northern Persia, Damavand is both the throne of Keyumars and — in later chapters — the prison of the tyrant Zahhak. It is the axis of the Persian mythological world, where divinity touches earth. Its snow-crowned peak is visible from across the land, and its slopes are sacred to Ahura Mazda. Every chapter of the Shahnameh casts its shadow against Damavand.",
      faction: "Sacred Landscape · Axis Mundi · Persian Heartland",
      mythologyRole: "World mountain; throne of the first king; later prison of the tyrant; eternal witness",
      powers: ["+12% Daily Drop Chance", "+6 REAL/hr", "Passive: Sacred Peak — location XP bonus in Ch.1 scenes"],
      storyAppearances: ["Chapter 1: The Mountain Court of Keyumars", "Chapter 1: Hushang's Victory at the Peak"],
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-006",
      season: 2,
      unlockCondition: "Complete Chapter 1 · The First King",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
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
      lore: "The court built by Keyumars on Damavand's slopes — where the first laws were spoken, the first ceremonies held, and the first songs of praise composed.",
      biography: "The court of Keyumars atop the sacred mountain was the first human institution. Built from stone and dressed in the skins of wild animals, it was crude by later standards but magnificent in its meaning: the first deliberate structure raised to host law, ritual, and the social order. Every subsequent Persian court traces its legitimacy back to this mountain hall.",
      faction: "First Dynasty · Mountain Civilization · Seat of Farr",
      mythologyRole: "First human institution; prototype of righteous rule; archetype of all future courts",
      powers: ["+6% Story XP", "Passive: Court Wisdom — quiz hint available once per chapter"],
      storyAppearances: ["Chapter 1: The Mountain Court of Keyumars", "Chapter 1: The First Ceremonies"],
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-007",
      season: 2,
      unlockCondition: "Complete Chapter 1 · The First King",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
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
      lore: "The primordial heartland from which all Persian kings drew their divine mandate. Keyumars walked its rivers and mountains before his kingship.",
      biography: "The ancestral homeland of the Persian peoples. Before cities, before farms, before fire, the land of ancient Pars was wild mountains and untamed rivers where the first tribes wandered according to their divine mandate. Keyumars walked this land as a shepherd-king before ascending to Damavand. The Farr of this land is old, deep, and enduring.",
      faction: "Sacred Landscape · Persian Homeland · Ancient World",
      mythologyRole: "Ancestral homeland; wellspring of Farr; root of Persian royal legitimacy",
      powers: ["+4% Auto-Mining Rate", "Passive: Homeland Blessing — REAL/hr +2 during Ch.1"],
      storyAppearances: ["Chapter 1: The Origins — Land of the First People", "Chapter 1: Keyumars Walks the Land"],
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-008",
      season: 2,
      unlockCondition: "Complete Chapter 1 · The First King",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
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
      biography: "The primordial dark forest at the edge of the known world, where Ahriman's divs dwelled beyond human reach. It was here that the Black Div ambushed Siamak. When Hushang pursued what he believed was a great serpent into this forest and struck flint against its rock, fire was born at the darkest edge of the world — light emerging from the place of deepest shadow.",
      faction: "Forces of Darkness · Ahriman's Realm · Borderlands",
      mythologyRole: "Liminal space where light and darkness first clash; birthplace of fire; threshold of civilization",
      powers: ["+10% Combo Multiplier", "Risk: Energy Cost elevated", "Passive: Dark Forest — combo window +1s in night sessions"],
      storyAppearances: ["Chapter 1: The Fall of Siamak", "Chapter 1: The Discovery of Fire — Edge of Darkness"],
      side: "dark",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-009",
      season: 2,
      unlockCondition: "Defeat Chapter 1 Boss",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
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
      lore: "Farr (Khvarenah) is the divine radiance that marks the rightful king. It cannot be seized by force — only earned through justice, wisdom, and valor.",
      biography: "The Farr (or Khvarenah in Avestan) is the animating principle of legitimate Persian kingship. It is the divine radiance that descends upon rightful rulers and departs from tyrants. It cannot be inherited through blood alone, nor seized through conquest — it is granted by the cosmic order. When Keyumars wore the crown of leaves, he bore the Farr. When kings become corrupt, the Farr takes flight as a great bird and seeks a worthier vessel.",
      faction: "Divine Principle · Ahura Mazda's Emanation · Royal Metaphysics",
      mythologyRole: "Divine legitimacy of kingship; cosmic endorsement of just rule; animating force of the Persian royal tradition",
      powers: ["+10% Tap Power", "Lore unlock: Farr concept tree", "Passive: Divine Radiance — +XP bonus on perfect quiz scores"],
      storyAppearances: ["Chapter 1 Codex: The Meaning of Farr", "Chapter 1 Quiz: Divine Kingship and the Farr"],
      side: "light",
      nftReady: false,
      collectionId: "SHAHNAMEH-S2-CH1-010",
      season: 2,
      unlockCondition: "Complete Chapter 1 Quiz with 80%+ score",
      tonMetadata: { standard: "TEP-62", collection: "Shahnameh Season 2", artworkVersion: "1.0", mintStatus: "pending" }
    }
  ];

  /* Locked mystery teasers — no real names, no spoilers */
  const LOCKED_PREVIEWS = [
    { id: "locked-ch2-a", rarity: "epic",   type: "character", emoji: "⚔", chapter: 2, label: "Unknown Warrior",  hint: "Unlocks in Chapter 2" },
    { id: "locked-ch2-b", rarity: "rare",   type: "place",     emoji: "🏰", chapter: 2, label: "Hidden Realm",    hint: "Unlocks in Chapter 2" },
    { id: "locked-ch3-a", rarity: "legend", type: "character", emoji: "👤", chapter: 3, label: "Ancient King",    hint: "Unlocks in Chapter 3" },
    { id: "locked-ch4-a", rarity: "mythic", type: "character", emoji: "❓", chapter: 4, label: "Legendary Hero",  hint: "Unlocks in Chapter 4" }
  ];

  /* ---- Label maps ---- */
  const RARITY_LABEL = { common: "Common", rare: "Rare", epic: "Epic", legend: "Legendary", mythic: "Mythic" };
  const TYPE_LABEL   = { character: "Character", enemy: "Enemy", place: "Place", codex: "Codex", artifact: "Artifact" };

  /* ---- Particle colours per rarity ---- */
  const PARTICLE_COLORS = {
    common: ["rgba(154,166,196,.9)"],
    rare:   ["rgba(94,162,255,.9)",  "rgba(140,200,255,.8)"],
    epic:   ["rgba(140,109,255,.9)", "rgba(190,150,255,.8)", "rgba(210,170,255,.7)"],
    legend: ["rgba(244,197,107,.9)", "rgba(255,220,130,.8)", "rgba(255,200,70,.7)"],
    mythic: ["rgba(255,82,103,.9)",  "rgba(255,138,61,.85)", "rgba(255,60,80,.7)"]
  };

  /* =========================================================
     DISCOVERY TRACKING
     ========================================================= */
  const DISCOVERY_LS = "real_coll_discovered_v1";

  const getDiscoveryMap = () => {
    try { return JSON.parse(localStorage.getItem(DISCOVERY_LS) || "{}"); } catch { return {}; }
  };
  const trackDiscovery = (id) => {
    try {
      const map = getDiscoveryMap();
      if (!map[id]) {
        map[id] = new Date().toISOString().split("T")[0];
        localStorage.setItem(DISCOVERY_LS, JSON.stringify(map));
      }
      return map[id];
    } catch { return null; }
  };
  const getDiscoveryDate = (id) => {
    const d = getDiscoveryMap()[id];
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    } catch { return d; }
  };

  /* =========================================================
     HELPERS
     ========================================================= */
  const showToast = (msg) => {
    const el = document.querySelector("[data-toast]");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove("show"), 2400);
  };

  /* =========================================================
     RARITY PARTICLES
     ========================================================= */
  const spawnRarityParticles = (event, rarity) => {
    if (document.hidden) return;
    const colors = PARTICLE_COLORS[rarity] || PARTICLE_COLORS.common;
    const count  = rarity === "mythic" ? 9 : rarity === "legend" ? 7 : rarity === "epic" ? 5 : 4;
    const cx     = event.clientX || window.innerWidth  / 2;
    const cy     = event.clientY || window.innerHeight / 2;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI + Math.random() * 0.9;
      const dist  = 28 + Math.random() * 55;
      const endX  = Math.cos(angle) * dist;
      const endY  = Math.sin(angle) * dist - 30;
      const color = colors[i % colors.length];
      const size  = 3 + Math.random() * 4;

      const p = document.createElement("span");
      p.className = "rarity-particle";
      p.style.cssText = `left:${cx - size/2}px;top:${cy - size/2}px;width:${size}px;height:${size}px;background:${color};border-radius:50%;`;
      document.body.appendChild(p);

      p.animate([
        { transform: "translate(0,0) scale(1)", opacity: .9 },
        { transform: `translate(${endX * .5}px,${endY * .5}px) scale(1.3)`, opacity: .7, offset: .3 },
        { transform: `translate(${endX}px,${endY}px) scale(0)`, opacity: 0 }
      ], { duration: 520 + Math.random() * 200, delay: i * 38, easing: "cubic-bezier(.22,1,.36,1)", fill: "forwards" });

      setTimeout(() => p.remove(), 950);
    }
  };

  /* =========================================================
     PROGRESS SECTION
     ========================================================= */
  const buildProgressSection = () => {
    const section = document.getElementById("coll-progress");
    if (!section) return;

    const counts = { common: 0, rare: 0, epic: 0, legend: 0, mythic: 0 };
    COLLECTION.forEach((it) => { counts[it.rarity] = (counts[it.rarity] || 0) + 1; });

    const total      = 69;
    const discovered = COLLECTION.length;
    const pct        = Math.round((discovered / total) * 100);

    const countEl = section.querySelector(".coll-ph-left");
    const pctEl   = section.querySelector(".coll-ph-right");
    const fillEl  = section.querySelector(".coll-progress-fill");

    if (countEl) countEl.innerHTML = `<strong>${discovered}</strong> of ${total} discovered`;
    if (pctEl)   pctEl.textContent = `Ch.1 complete · ${pct}%`;

    /* Animate fill after render */
    if (fillEl) {
      fillEl.style.width = "0%";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { fillEl.style.width = `${pct}%`; });
      });
    }

    Object.entries(counts).forEach(([rarity, count]) => {
      const el = section.querySelector(`.crb-item.r-${rarity} .crb-count`);
      if (el) el.textContent = count;
    });
  };

  /* =========================================================
     BUILD CARDS
     ========================================================= */
  const buildCards = (filter) => {
    const grid = document.getElementById("coll-grid");
    if (!grid) return;
    grid.innerHTML = "";

    const items = filter === "all"
      ? COLLECTION
      : COLLECTION.filter((it) => it.type === filter);

    if (!items.length) {
      const empty = document.createElement("p");
      empty.style.cssText = "grid-column:1/-1;text-align:center;color:var(--muted);padding:28px 0;font-size:13px;";
      empty.textContent = "No items in this category yet.";
      grid.appendChild(empty);
    } else {
      items.forEach((item) => {
        const card = document.createElement("button");
        card.className = `coll-card r-${item.rarity}`;
        card.setAttribute("aria-label", `View ${item.name} certificate`);

        let imgHTML = item.img
          ? `<img src="${item.img}" alt="${item.name}" loading="lazy"
              onerror="this.style.display='none';this.parentNode.querySelector('.coll-emoji').style.display='flex'">
             <span class="coll-emoji" style="display:none;">${item.emoji || "?"}</span>`
          : `<span class="coll-emoji">${item.emoji || "?"}</span>`;

        card.innerHTML = `
          <div class="coll-portrait">
            ${imgHTML}
            <span class="coll-type-chip">${TYPE_LABEL[item.type] || item.type}</span>
            <span class="coll-chapter-dot">Ch${item.chapter}</span>
          </div>
          <div class="coll-info">
            <div class="coll-name">${item.name}</div>
            <div class="coll-rarity">${RARITY_LABEL[item.rarity] || item.rarity}</div>
          </div>
        `;

        card.addEventListener("click", (e) => {
          spawnRarityParticles(e, item.rarity);
          if (navigator.vibrate) navigator.vibrate(6);
          openCertificate(item);
        });
        grid.appendChild(card);
      });
    }

    /* Mystery locked previews (all tab only) */
    if (filter === "all") buildLockedPreviews(grid);
    else buildLockedTeaser(grid, filter);
  };

  /* =========================================================
     LOCKED MYSTERY CARDS
     ========================================================= */
  const buildLockedPreviews = (grid) => {
    LOCKED_PREVIEWS.forEach((preview) => {
      const card = document.createElement("div");
      card.className = "coll-card-locked";

      card.innerHTML = `
        <div class="coll-portrait-locked">
          <span class="locked-silhouette">${preview.emoji}</span>
          <div class="coll-locked-badge">🔒</div>
        </div>
        <div class="coll-info-locked">
          <div class="coll-name-locked">???</div>
          <div class="coll-hint-locked">${preview.hint}</div>
        </div>
      `;

      card.addEventListener("click", () => showToast(`🔒 ${preview.hint}`));
      grid.appendChild(card);
    });

    /* Teaser row for remaining */
    buildLockedTeaser(grid, "all");
  };

  const buildLockedTeaser = (grid, filter) => {
    if (filter !== "all" && filter !== "character") return;
    const row = document.createElement("div");
    row.className = "coll-locked-chapter";
    row.innerHTML = `
      <div class="clc-lock">🔒</div>
      <div>
        <div class="clc-title">Chapters 2 – 50</div>
        <div class="clc-count">55 more items locked · Complete new chapters to discover</div>
      </div>
      <img class="clc-thumb" src="/season2/uploads/chapters/hushang.png" alt=""
        onerror="this.outerHTML='<div class=clc-thumb-fallback>🏰</div>'">
    `;
    grid.appendChild(row);
  };

  /* =========================================================
     CERTIFICATE MODAL
     ========================================================= */
  const openCertificate = (item) => {
    const backdrop = document.getElementById("cert-backdrop");
    const modal    = document.getElementById("cert-modal");
    if (!backdrop || !modal) return;

    /* Record first discovery */
    trackDiscovery(item.id);
    const discoveredDate = getDiscoveryDate(item.id);

    let portraitInner = item.img
      ? `<img src="${item.img}" alt="${item.name}"
            onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="cert-portrait-emoji" style="display:none;">${item.emoji || "?"}</div>`
      : `<div class="cert-portrait-emoji">${item.emoji || "?"}</div>`;

    const sideTag = item.side === "dark"
      ? `<span class="cert-tag side-dark">Dark Side</span>`
      : `<span class="cert-tag side-light">Light Side</span>`;

    const nftClass = item.nftReady ? "nft-ready" : "nft-pending";
    const nftText  = item.nftReady
      ? "◆ NFT Ready · Claim on TON"
      : "◈ NFT Pending · Will mint on TON after TGE";

    const discoveredLine = discoveredDate
      ? `<div class="cert-discovered">Discovered ${discoveredDate} · Season ${item.season}</div>`
      : "";

    /* Build accordion sections */
    const accordionItems = [
      {
        label: "📖 Biography",
        content: `<p>${item.biography}</p>`
      },
      {
        label: "⚔ Faction &amp; Role",
        content: `
          <div class="faction-val">${item.faction}</div>
          <div class="faction-sub">${item.mythologyRole}</div>`
      },
      {
        label: "⬡ Powers &amp; Bonuses",
        content: `<ul>${item.powers.map((p) => `<li><strong>${p}</strong></li>`).join("")}</ul>`
      },
      {
        label: "📜 Story Appearances",
        content: item.storyAppearances.map((s) => `<div class="story-entry">${s}</div>`).join("")
      }
    ];

    const accordionHTML = accordionItems.map((a, i) => `
      <div class="cert-acc-item" data-acc="${i}">
        <button class="cert-acc-trigger" aria-expanded="false">
          <span>${a.label}</span>
          <span class="cert-acc-arrow">›</span>
        </button>
        <div class="cert-acc-body">
          <div class="cert-acc-content">${a.content}</div>
        </div>
      </div>
    `).join("");

    modal.innerHTML = `
      <div class="cert-grabber-row"><div class="cert-grabber"></div></div>

      <div class="cert-portrait-panel" data-fullscreen-src="${item.img || ""}" data-fullscreen-alt="${item.name}">
        ${portraitInner}
        <span class="cert-zoom-hint">⊕ Tap to expand</span>
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

        <p class="cert-lore-excerpt">${item.lore}</p>

        <div class="cert-accordion">${accordionHTML}</div>

        <hr class="cert-divider">

        <div class="cert-nft-badge ${nftClass}">
          <span class="nft-ico">◈</span> ${nftText}
        </div>

        <div class="cert-meta-section">
          <div class="cert-meta-row">
            <span class="cmr-key">ID</span>
            <span class="cmr-val mono">${item.collectionId}</span>
          </div>
          <div class="cert-meta-row">
            <span class="cmr-key">Rarity</span>
            <span class="cmr-val gold-val">${RARITY_LABEL[item.rarity]}</span>
          </div>
          <div class="cert-meta-row">
            <span class="cmr-key">Season / Ch.</span>
            <span class="cmr-val">Season ${item.season} · Chapter ${item.chapter}</span>
          </div>
          <div class="cert-meta-row">
            <span class="cmr-key">Unlock</span>
            <span class="cmr-val">${item.unlockCondition}</span>
          </div>
          <div class="cert-meta-row">
            <span class="cmr-key">TON Std</span>
            <span class="cmr-val mono">${item.tonMetadata.standard}</span>
          </div>
          <div class="cert-meta-row">
            <span class="cmr-key">Artwork</span>
            <span class="cmr-val">v${item.tonMetadata.artworkVersion}</span>
          </div>
          <div class="cert-meta-row">
            <span class="cmr-key">Mint</span>
            <span class="cmr-val">${item.tonMetadata.mintStatus === "pending" ? "Pending after TGE" : "Minted"}</span>
          </div>
        </div>

        ${discoveredLine}
      </div>
    `;

    backdrop.classList.add("open");
    if (navigator.vibrate) navigator.vibrate([6, 2, 4]);

    /* Bind close */
    document.getElementById("cert-close-btn")
      ?.addEventListener("click", closeCertificate);

    /* Portrait → fullscreen */
    const portraitPanel = modal.querySelector(".cert-portrait-panel");
    if (portraitPanel) {
      portraitPanel.addEventListener("click", () => {
        const src = portraitPanel.dataset.fullscreenSrc;
        const alt = portraitPanel.dataset.fullscreenAlt;
        if (src) openFullscreen(src, alt);
      });
    }

    /* Set up accordion */
    setupAccordion(modal);
  };

  const closeCertificate = () => {
    const backdrop = document.getElementById("cert-backdrop");
    if (backdrop) backdrop.classList.remove("open");
  };

  /* =========================================================
     ACCORDION
     ========================================================= */
  const setupAccordion = (container) => {
    container.querySelectorAll(".cert-acc-item").forEach((item) => {
      const trigger = item.querySelector(".cert-acc-trigger");
      if (!trigger) return;
      trigger.addEventListener("click", () => {
        const isOpen = item.classList.contains("open");
        /* Close all */
        container.querySelectorAll(".cert-acc-item.open").forEach((el) => {
          el.classList.remove("open");
          el.querySelector(".cert-acc-trigger")?.setAttribute("aria-expanded", "false");
        });
        /* Toggle clicked */
        if (!isOpen) {
          item.classList.add("open");
          trigger.setAttribute("aria-expanded", "true");
        }
      });
    });
  };

  /* =========================================================
     FULLSCREEN PORTRAIT
     ========================================================= */
  const openFullscreen = (src, alt) => {
    const overlay = document.getElementById("img-fullscreen");
    const imgEl   = document.getElementById("img-fullscreen-img");
    if (!overlay || !imgEl || !src) return;

    imgEl.src = src;
    imgEl.alt = alt || "";
    overlay.classList.add("open");
    if (navigator.vibrate) navigator.vibrate(4);
  };

  const closeFullscreen = () => {
    const overlay = document.getElementById("img-fullscreen");
    if (overlay) overlay.classList.remove("open");
  };

  /* =========================================================
     TAB FILTERING
     ========================================================= */
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

  /* =========================================================
     INIT
     ========================================================= */
  const init = () => {
    buildProgressSection();
    setupTabs();
    buildCards("all");

    /* Backdrop click closes certificate */
    document.getElementById("cert-backdrop")
      ?.addEventListener("click", (e) => { if (e.target.id === "cert-backdrop") closeCertificate(); });

    /* Fullscreen close */
    document.getElementById("img-fullscreen-close")
      ?.addEventListener("click", closeFullscreen);
    document.getElementById("img-fullscreen")
      ?.addEventListener("click", (e) => { if (e.target.id === "img-fullscreen") closeFullscreen(); });

    /* Escape key */
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { closeFullscreen(); closeCertificate(); }
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
