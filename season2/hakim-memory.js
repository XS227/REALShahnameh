/* ==========================================================================
   REAL Shahnameh — Hakim Memory System
   Hakim observes the player's journey without surveillance.
   He feels aware — not algorithmic. Ancient — not analytical.
   ========================================================================== */

(() => {
  "use strict";

  const KEY = "real_hakim_memory_v1";

  /* ── Default state ───────────────────────────────────────────────────── */
  const DEFAULT = {
    regions: {},       // { regionId: visitCount }
    heroes: {},        // { heroId: viewCount }
    themes: {},        // { theme: count } — from hakim questions
    offeringsCount: 0,
    loreUnlocked: 0,
    chaptersRead: 0,
    favoriteRegion: null,
    favoriteHero: null,
    seekerType: null,  // "wisdom" | "power" | "memory" | "balance"
  };

  const load = () => {
    try { return Object.assign({}, DEFAULT, JSON.parse(localStorage.getItem(KEY) || "{}")); }
    catch { return Object.assign({}, DEFAULT); }
  };

  const save = (s) => {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  };

  /* ── Recording helpers ───────────────────────────────────────────────── */
  const recordRegion = (regionId) => {
    const s = load();
    s.regions[regionId] = (s.regions[regionId] || 0) + 1;
    // Update favorite
    const fav = Object.entries(s.regions).sort((a, b) => b[1] - a[1])[0];
    if (fav) s.favoriteRegion = fav[0];
    save(s);
  };

  const recordHero = (heroId) => {
    const s = load();
    s.heroes[heroId] = (s.heroes[heroId] || 0) + 1;
    const fav = Object.entries(s.heroes).sort((a, b) => b[1] - a[1])[0];
    if (fav) s.favoriteHero = fav[0];
    save(s);
  };

  const recordTheme = (text) => {
    const s = load();
    const t = (text || "").toLowerCase();
    const themes = {
      wisdom: ["wisdom", "hakim", "poem", "verse", "ferdowsi", "دانا", "wisdom"],
      power: ["power", "battle", "war", "fight", "warrior", "king", "army"],
      memory: ["history", "past", "lore", "memory", "chronicle", "ancient"],
      fire: ["fire", "flame", "farr", "zahhak", "hushang", "sadeh"],
      hero: ["rostam", "zal", "sohrab", "simorgh", "rakhsh", "champion"],
    };
    Object.entries(themes).forEach(([theme, words]) => {
      if (words.some(w => t.includes(w))) {
        s.themes[theme] = (s.themes[theme] || 0) + 1;
      }
    });
    // Derive seeker type
    const maxTheme = Object.entries(s.themes).sort((a, b) => b[1] - a[1])[0];
    if (maxTheme) {
      if (maxTheme[0] === "wisdom") s.seekerType = "wisdom";
      else if (maxTheme[0] === "power") s.seekerType = "power";
      else if (maxTheme[0] === "memory" || maxTheme[0] === "fire") s.seekerType = "memory";
      else s.seekerType = "balance";
    }
    save(s);
  };

  const recordOffering = () => {
    const s = load(); s.offeringsCount = (s.offeringsCount || 0) + 1; save(s);
  };

  const recordLore = () => {
    const s = load(); s.loreUnlocked = (s.loreUnlocked || 0) + 1; save(s);
  };

  const recordChapter = () => {
    const s = load(); s.chaptersRead = (s.chaptersRead || 0) + 1; save(s);
  };

  /* ── Personalized greeting ───────────────────────────────────────────── */

  const REGION_NAMES = {
    pars: "Pars",
    damavand: "the mountains of Damavand",
    khorasan: "Khorasan",
    sistan: "Sistan",
    ray: "Ray",
    babylon: "Babylon",
    turan: "Turan",
    alborz: "the Alborz peaks",
    tus: "Tus",
  };

  const HERO_NAMES = {
    rostam: "Rostam",
    zahhak: "Zahhak",
    fereydun: "Fereydun",
    zal: "Zal",
    jamshid: "Jamshid",
    keyumars: "Keyumars",
    sohrab: "Sohrab",
    kaveh: "Kaveh",
    simorgh: "the Simorgh",
  };

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const getPersonalizedGreeting = () => {
    const s = load();
    const options = [];

    // Region memory
    if (s.favoriteRegion && REGION_NAMES[s.favoriteRegion]) {
      options.push(
        `You return often to ${REGION_NAMES[s.favoriteRegion]}. The mountain has noticed.`,
        `I have seen your footsteps near ${REGION_NAMES[s.favoriteRegion]} more than once. What draws you there?`,
      );
    }

    // Hero interest
    if (s.favoriteHero && HERO_NAMES[s.favoriteHero]) {
      options.push(
        `You study ${HERO_NAMES[s.favoriteHero]} carefully. There is something in that story that speaks to you.`,
        `Your gaze returns to ${HERO_NAMES[s.favoriteHero]}. The chronicle has many voices — but yours seems drawn to this one.`,
      );
    }

    // Seeker type
    if (s.seekerType === "wisdom") {
      options.push(
        "You seek wisdom more than power. The chronicle approves.",
        "I have noticed — you ask about meaning, not just events. Ferdowsi would have liked you.",
      );
    } else if (s.seekerType === "power") {
      options.push(
        "You are drawn to the battles and kings. There is nothing wrong with that — the Shahnameh is also a book of iron.",
        "The chronicles of kings seem to interest you deeply. Remember — even the greatest king in the Shahnameh wept.",
      );
    } else if (s.seekerType === "memory") {
      options.push(
        "You walk the path of memory. This is the oldest road in the Shahnameh.",
        "The fire of history calls to you. The chronicle burns brighter in the hands of those who remember.",
      );
    }

    // Offerings
    if (s.offeringsCount >= 3) {
      options.push(
        "The fire has answered your offerings. It remembers.",
        "You have given to the flame more than once. The chronicle sees this.",
      );
    }

    // Lore depth
    if (s.loreUnlocked >= 2) {
      options.push(
        "You have recovered hidden memories. The chronicle grows stronger within you.",
        "Few reach the hidden layers of the Shahnameh. You have found more than most.",
      );
    }

    // Fallback to personality openings
    if (!options.length || Math.random() < 0.35) {
      return null; // signal to use standard opening
    }

    return pick(options);
  };

  /* ── Expose globally ─────────────────────────────────────────────────── */
  window.HakimMemory = {
    recordRegion,
    recordHero,
    recordTheme,
    recordOffering,
    recordLore,
    recordChapter,
    getPersonalizedGreeting,
    getState: load,
  };
})();
