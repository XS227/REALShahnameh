/* ==========================================================================
   REAL Shahnameh — Cinematic Systems
   Dust particles · chapter reveal overlays · atmosphere fog
   Philosophy: atmosphere supports emotion — it does not compete with it.
   ========================================================================== */

(() => {
  "use strict";

  /* ══════════════════════════════════════════════════════════════
     DUST PARTICLE CANVAS — ambient floating motes
     Subtle: 14 particles max, every-other-frame, pauses when hidden
     ══════════════════════════════════════════════════════════════ */

  const initDust = () => {
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;opacity:0";
    canvas.setAttribute("aria-hidden", "true");
    document.body.insertBefore(canvas, document.body.firstChild);

    // Breathe in gently — 3s fade, stays at 0.28 opacity (subtle)
    requestAnimationFrame(() => {
      canvas.style.transition = "opacity 3s ease";
      canvas.style.opacity = "0.28";
    });

    const ctx = canvas.getContext("2d");
    let W = 0, H = 0;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    // 14 particles — enough to feel alive, not enough to feel busy
    const COUNT = Math.min(14, Math.floor(window.innerWidth / 28));
    const pts = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.1 + 0.2,
      vx: (Math.random() - 0.5) * 0.10,
      vy: -(Math.random() * 0.13 + 0.03),
      base: Math.random() * 0.32 + 0.06,
      phase: Math.random() * Math.PI * 2,
      col: Math.random() < 0.65 ? "244,197,107" : "140,109,255",
    }));

    let tick = 0, raf;

    const draw = () => {
      tick++;
      if (tick % 2 === 0) {
        ctx.clearRect(0, 0, W, H);
        pts.forEach(p => {
          p.x += p.vx; p.y += p.vy; p.phase += 0.008;
          if (p.y < -8)  { p.y = H + 8; p.x = Math.random() * W; }
          if (p.x < -8)    p.x = W + 8;
          if (p.x > W + 8) p.x = -8;
          const a = p.base * (0.6 + 0.4 * Math.sin(p.phase));
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.col},${a.toFixed(2)})`;
          ctx.fill();
        });
      }
      raf = requestAnimationFrame(draw);
    };

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(draw);
    });
    raf = requestAnimationFrame(draw);
  };

  /* ══════════════════════════════════════════════════════════════
     ATMOSPHERE FOG — soft bottom glow, candle-like
     ══════════════════════════════════════════════════════════════ */

  const initFog = () => {
    if (document.querySelector(".atmosphere-fog")) return;
    const fog = document.createElement("div");
    fog.className = "atmosphere-fog";
    fog.setAttribute("aria-hidden", "true");
    document.body.appendChild(fog);
  };

  /* ══════════════════════════════════════════════════════════════
     CINEMATIC CHAPTER REVEAL OVERLAY
     Pacing: kicker → rule → title → quote → skip
     Auto-dismiss after 5s (longer, more cinematic)
     ══════════════════════════════════════════════════════════════ */

  const REVEALS = {
    1:  { num: "I",    title: "Keyumars — The First King",       quote: "From the mountain top, a man looked down and saw what civilization could be." },
    2:  { num: "II",   title: "Hushang — The Spark of Fire",     quote: "When darkness is struck against itself, light is born." },
    3:  { num: "III",  title: "Tahmuras — Binder of Demons",     quote: "Even the darkest knowledge, wielded with justice, becomes civilization." },
    4:  { num: "IV",   title: "Jamshid — The Golden Throne",     quote: "Power without humility invites the shadow." },
    5:  { num: "V",    title: "Zahhak — The Serpent King",       quote: "A tyrant must feed on his people to keep himself alive." },
    6:  { num: "VI",   title: "Fereydun — The Liberator",        quote: "A blacksmith's apron became the banner of a nation's freedom." },
    7:  { num: "VII",  title: "Zal — The Albino Prince",         quote: "The Simorgh raised what the mountain had cast away." },
    8:  { num: "VIII", title: "Rostam — Champion of Pars",       quote: "Strength carries its own burden. The greatest bear it silently." },
    9:  { num: "IX",   title: "Sohrab — Son of the Storm",       quote: "The cruelest battles are fought without knowing who stands before us." },
    10: { num: "X",    title: "Esfandiyar — The Brazen-Bodied",  quote: "Invulnerability is not strength. The eyes remain open always." },
  };

  const showChapterReveal = (id, onDone) => {
    const data = REVEALS[id];
    if (!data) { if (onDone) onDone(); return; }

    const el = document.createElement("div");
    el.className = "co-overlay";
    el.setAttribute("aria-modal", "true");
    el.setAttribute("role", "dialog");
    el.innerHTML = `
      <div class="co-bg" aria-hidden="true"></div>
      <div class="co-content">
        <div class="co-kicker">Chapter ${data.num}</div>
        <div class="co-rule" aria-hidden="true"></div>
        <div class="co-title">${data.title}</div>
        <div class="co-quote">"${data.quote}"</div>
        <button class="co-skip">Continue ›</button>
      </div>
    `;
    document.body.appendChild(el);

    if (window.RealAudio) window.RealAudio.sounds.chapterReveal();

    requestAnimationFrame(() => el.classList.add("co-visible"));

    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      el.classList.add("co-exit");
      setTimeout(() => { el.remove(); if (onDone) onDone(); }, 520);
    };

    const timer = setTimeout(dismiss, 5000);
    el.querySelector(".co-skip").addEventListener("click", () => { clearTimeout(timer); dismiss(); });
    el.addEventListener("click", (e) => {
      if (e.target !== el && !e.target.classList.contains("co-bg")) return;
      clearTimeout(timer); dismiss();
    });

    return dismiss;
  };

  /* ══════════════════════════════════════════════════════════════
     MOMENT 1 — HAKIM APPEARS
     Darkens → manuscript particles drift in → ancient text fades
     → Hakim orb emerges → first words appear
     ══════════════════════════════════════════════════════════════ */

  const showHakimAppearance = (onDone) => {
    if (localStorage.getItem("real_hakim_first_appearance")) { if (onDone) onDone(); return; }
    localStorage.setItem("real_hakim_first_appearance", "1");

    const el = document.createElement("div");
    el.className = "ha-overlay";
    el.setAttribute("aria-modal", "true");
    el.setAttribute("role", "dialog");
    el.innerHTML = `
      <canvas class="ha-canvas" aria-hidden="true"></canvas>
      <div class="ha-content">
        <div class="ha-verse">بنام خداوند جان و خرد</div>
        <div class="ha-verse-trans">In the name of the Lord of life and wisdom</div>
        <div class="ha-orb-wrap">
          <div class="ha-orb">
            <img src="/assets/hakim.png" alt="" onerror="this.style.display='none'">
            <span class="ha-orb-glyph" aria-hidden="true">🧙</span>
          </div>
        </div>
        <div class="ha-name">Hakim</div>
        <div class="ha-quote"></div>
        <button class="ha-skip">Enter the Chronicle ›</button>
      </div>
    `;
    document.body.appendChild(el);

    /* Manuscript particle canvas */
    const canvas = el.querySelector(".ha-canvas");
    const ctx2 = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const GLYPHS = ["ب","ن","ا","م","خ","د","و","ن","ج","ر","ف","ک","گ","ل","ه","س","ی","ت","پ","ز","✦","◆"];
    const glyphPts = Array.from({length: 28}, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      size: Math.random() * 14 + 8,
      alpha: 0,
      targetAlpha: Math.random() * 0.18 + 0.04,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(Math.random() * 0.4 + 0.1),
    }));

    let raf2;
    const drawGlyphs = () => {
      ctx2.clearRect(0, 0, canvas.width, canvas.height);
      glyphPts.forEach(p => {
        p.alpha = Math.min(p.alpha + 0.003, p.targetAlpha);
        p.x += p.vx; p.y += p.vy;
        if (p.y < -30) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        ctx2.font = `${p.size}px serif`;
        ctx2.fillStyle = `rgba(244,197,107,${p.alpha.toFixed(3)})`;
        ctx2.fillText(p.glyph, p.x, p.y);
      });
      raf2 = requestAnimationFrame(drawGlyphs);
    };
    raf2 = requestAnimationFrame(drawGlyphs);

    /* Staggered reveal */
    requestAnimationFrame(() => el.classList.add("ha-visible"));

    const opening = window.HakimPersonality ? window.HakimPersonality.getOpening()
      : "Sixty thousand verses, and still the chronicle has room for your question. I am listening.";

    const quoteEl = el.querySelector(".ha-quote");
    let charIdx = 0;
    const typeOpening = () => {
      if (charIdx < opening.length) {
        quoteEl.textContent += opening[charIdx++];
        setTimeout(typeOpening, 28);
      }
    };
    setTimeout(typeOpening, 2200);

    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return; dismissed = true;
      cancelAnimationFrame(raf2);
      el.classList.add("ha-exit");
      setTimeout(() => { el.remove(); if (onDone) onDone(); }, 600);
    };

    setTimeout(dismiss, 7500);
    el.querySelector(".ha-skip").addEventListener("click", dismiss);
  };

  /* ══════════════════════════════════════════════════════════════
     MOMENT 2 — LORE DISCOVERY
     Screen dims → manuscript glow → lore assembles → gold particles
     → Hakim whisper: "A forgotten memory awakens."
     ══════════════════════════════════════════════════════════════ */

  const showLoreDiscovery = (title, onDone) => {
    const el = document.createElement("div");
    el.className = "ld-overlay";
    el.setAttribute("aria-modal", "true");
    el.setAttribute("role", "dialog");
    el.innerHTML = `
      <canvas class="ld-canvas" aria-hidden="true"></canvas>
      <div class="ld-content">
        <div class="ld-glow" aria-hidden="true"></div>
        <div class="ld-kicker">✦ Memory Recovered</div>
        <div class="ld-title">${title || "Ancient Lore"}</div>
        <div class="ld-hakim">
          <span class="ld-hakim-name">Hakim</span>
          <span class="ld-hakim-words"></span>
        </div>
        <button class="ld-skip">Preserve This Memory ›</button>
      </div>
    `;
    document.body.appendChild(el);

    /* Gold particle canvas */
    const canvas = el.querySelector(".ld-canvas");
    const ctx3 = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const goldPts = Array.from({length: 22}, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.6,
      y: canvas.height / 2 + (Math.random() - 0.5) * 120,
      r: Math.random() * 1.6 + 0.4,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -(Math.random() * 0.9 + 0.3),
      alpha: 0,
      targetAlpha: Math.random() * 0.55 + 0.15,
    }));

    let raf3;
    const drawGold = () => {
      ctx3.clearRect(0, 0, canvas.width, canvas.height);
      goldPts.forEach(p => {
        p.alpha = Math.min(p.alpha + 0.012, p.targetAlpha);
        p.x += p.vx; p.y += p.vy;
        if (p.y < -8) { p.y = canvas.height * 0.7; p.x = canvas.width/2 + (Math.random()-0.5)*canvas.width*0.5; p.alpha = 0; }
        ctx3.beginPath();
        ctx3.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx3.fillStyle = `rgba(244,197,107,${p.alpha.toFixed(3)})`;
        ctx3.fill();
      });
      raf3 = requestAnimationFrame(drawGold);
    };
    raf3 = requestAnimationFrame(drawGold);

    requestAnimationFrame(() => el.classList.add("ld-visible"));

    const whisper = "A forgotten memory awakens. The chronicle grows stronger within you.";
    const wordsEl = el.querySelector(".ld-hakim-words");
    let wIdx = 0;
    const typeWhisper = () => {
      if (wIdx < whisper.length) {
        wordsEl.textContent += whisper[wIdx++];
        setTimeout(typeWhisper, 22);
      }
    };
    setTimeout(typeWhisper, 1100);

    let dismissed2 = false;
    const dismiss2 = () => {
      if (dismissed2) return; dismissed2 = true;
      cancelAnimationFrame(raf3);
      el.classList.add("ld-exit");
      setTimeout(() => { el.remove(); if (onDone) onDone(); }, 500);
    };

    setTimeout(dismiss2, 5500);
    el.querySelector(".ld-skip").addEventListener("click", dismiss2);
  };

  /* ══════════════════════════════════════════════════════════════
     MOMENT 3 — DAMAVAND MEMORY
     Fog grows → wind sound → mountain silhouette → Hakim narration
     on Zahhak imprisoned beneath the mountain
     ══════════════════════════════════════════════════════════════ */

  const showDamavandMemory = (onDone) => {
    if (localStorage.getItem("real_damavand_memory_seen")) { if (onDone) onDone(); return; }
    localStorage.setItem("real_damavand_memory_seen", "1");

    const el = document.createElement("div");
    el.className = "dm-overlay";
    el.setAttribute("aria-modal", "true");
    el.setAttribute("role", "dialog");
    el.innerHTML = `
      <canvas class="dm-canvas" aria-hidden="true"></canvas>
      <div class="dm-mountain" aria-hidden="true"></div>
      <div class="dm-fog-layer" aria-hidden="true"></div>
      <div class="dm-content">
        <div class="dm-kicker">Mount Damavand</div>
        <div class="dm-subtitle">The World's Prison</div>
        <div class="dm-narration"></div>
        <button class="dm-skip">The mountain remembers ›</button>
      </div>
    `;
    document.body.appendChild(el);

    /* Fog particle canvas */
    const canvas = el.querySelector(".dm-canvas");
    const ctx4 = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const fogPts = Array.from({length: 18}, () => ({
      x: Math.random() * canvas.width,
      y: canvas.height * 0.55 + Math.random() * canvas.height * 0.45,
      w: Math.random() * 180 + 80,
      alpha: 0,
      targetAlpha: Math.random() * 0.12 + 0.04,
      vx: (Math.random() - 0.5) * 0.22,
    }));

    let raf4;
    const drawFog = () => {
      ctx4.clearRect(0, 0, canvas.width, canvas.height);
      fogPts.forEach(p => {
        p.alpha = Math.min(p.alpha + 0.0025, p.targetAlpha);
        p.x += p.vx;
        if (p.x > canvas.width + p.w) p.x = -p.w;
        if (p.x < -p.w) p.x = canvas.width + p.w;
        const grad = ctx4.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.w);
        grad.addColorStop(0, `rgba(200,210,235,${p.alpha.toFixed(3)})`);
        grad.addColorStop(1, `rgba(200,210,235,0)`);
        ctx4.beginPath();
        ctx4.ellipse(p.x, p.y, p.w, p.w * 0.35, 0, 0, Math.PI * 2);
        ctx4.fillStyle = grad;
        ctx4.fill();
      });
      raf4 = requestAnimationFrame(drawFog);
    };
    raf4 = requestAnimationFrame(drawFog);

    requestAnimationFrame(() => el.classList.add("dm-visible"));

    const narration = window.HakimPersonality && window.HakimPersonality.WISDOM.damavand
      ? window.HakimPersonality.WISDOM.damavand[0]
      : "Damavand is the world's conscience — it imprisons what cannot be destroyed. Zahhak lives still, chained within the volcanic rock. Every eruption is his fury. Every long silence is the mountain holding him.";

    const narEl = el.querySelector(".dm-narration");
    let nIdx = 0;
    const typeNar = () => {
      if (nIdx < narration.length) {
        narEl.textContent += narration[nIdx++];
        setTimeout(typeNar, 20);
      }
    };
    setTimeout(typeNar, 1600);

    let dismissed3 = false;
    const dismiss3 = () => {
      if (dismissed3) return; dismissed3 = true;
      cancelAnimationFrame(raf4);
      el.classList.add("dm-exit");
      setTimeout(() => { el.remove(); if (onDone) onDone(); }, 600);
    };

    setTimeout(dismiss3, 9000);
    el.querySelector(".dm-skip").addEventListener("click", dismiss3);
  };

  /* ══════════════════════════════════════════════════════════════
     LORE WHISPERS — ambient atmospheric text on reading screens
     Cycles through ancient phrases, fades in/out at the edge
     ══════════════════════════════════════════════════════════════ */

  const LORE_WHISPERS = [
    "توانا بود هر که دانا بود",
    "The fire is not dead. It is waiting.",
    "A king without memory is a kingdom without walls.",
    "Sixty thousand verses. Every word a stone in the wall of civilization.",
    "The Simorgh watches from the world-tree.",
    "Farr does not belong to the king. The king belongs to Farr.",
    "Even Rostam wept.",
    "Power without humility is a sword turned inward.",
    "The chronicle remembers what time forgets.",
    "بنام خداوند جان و خرد",
  ];

  const WHISPER_PAGES = ["learn.html", "chapter.html", "dynasty.html", "historical-sites.html"];

  const initLoreWhispers = () => {
    const page = window.location.pathname.split("/").pop() || "";
    if (!WHISPER_PAGES.includes(page)) return;

    const el = document.createElement("div");
    el.className = "lore-whisper";
    el.setAttribute("aria-hidden", "true");
    document.body.appendChild(el);

    let idx = Math.floor(Math.random() * LORE_WHISPERS.length);
    let visible = false;

    const cycle = () => {
      if (visible) {
        el.classList.remove("lore-whisper-in");
        el.classList.add("lore-whisper-out");
        setTimeout(() => {
          visible = false;
          idx = (idx + 1) % LORE_WHISPERS.length;
          setTimeout(cycle, 18000 + Math.random() * 12000);
        }, 1800);
      } else {
        el.textContent = LORE_WHISPERS[idx];
        el.classList.remove("lore-whisper-out");
        el.classList.add("lore-whisper-in");
        visible = true;
        setTimeout(cycle, 6000 + Math.random() * 4000);
      }
    };

    setTimeout(cycle, 12000 + Math.random() * 8000);
  };

  /* ══════════════════════════════════════════════════════════════
     INIT
     ══════════════════════════════════════════════════════════════ */

  const SKIP_DUST = ["tap.html"]; // tap has its own heavy canvas

  const init = () => {
    const p = window.location.pathname.split("/").pop() || "";
    if (!SKIP_DUST.includes(p)) initDust();
    initFog();
    initLoreWhispers();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  /* ══════════════════════════════════════════════════════════════
     HERO REVEAL CINEMATICS
     Five major heroes/kings get one-time cinematic reveal sequences.
     Sequence: darken → silhouette → quote → slow reveal → Hakim comment → enter
     ══════════════════════════════════════════════════════════════ */

  const HERO_REVEALS = {
    zahhak: {
      name: "Zahhak",
      era: "The Serpent King",
      silhouette: "🐍",
      quote: "Some kings are crowned by fear.",
      subQuote: "A thousand years of darkness. And the world forgot what light tasted like.",
      hakimComment: "Zahhak did not begin as evil. He began as a man who made one choice, then another, and then one more. Study this king carefully.",
      color: "crimson",
      accent: "rgba(255,82,103,.35)",
    },
    fereydun: {
      name: "Fereydun",
      era: "The Liberator",
      silhouette: "⚖",
      quote: "Even darkness remembers the coming of justice.",
      subQuote: "He was raised in hiding. He emerged as a reckoning.",
      hakimComment: "Fereydun teaches patience. The world was not freed in a single moment — it was prepared for over years of silence and endurance.",
      color: "jade",
      accent: "rgba(83,215,156,.3)",
    },
    rostam: {
      name: "Rostam",
      era: "Champion of Pars",
      silhouette: "⚔",
      quote: "The burden of strength is heavier than iron.",
      subQuote: "He carried the world. He asked for nothing in return. He lost everything.",
      hakimComment: "Rostam is not a story of victory. He is the chronicle's greatest question: what does strength cost a man when the world will not let him rest?",
      color: "gold",
      accent: "rgba(244,197,107,.35)",
    },
    zal: {
      name: "Zal",
      era: "The Albino Prince",
      silhouette: "🪶",
      quote: "What the mountain casts away, the Simorgh raises.",
      subQuote: "Born white as snow. Cast into the wilderness. Raised by the world's wisest bird.",
      hakimComment: "Zal is proof that the chronicle does not abandon the abandoned. He who is cast aside becomes the father of the greatest warrior in Persian history.",
      color: "violet",
      accent: "rgba(140,109,255,.35)",
    },
    jamshid: {
      name: "Jamshid",
      era: "The Golden Throne",
      silhouette: "👑",
      quote: "Seven hundred years of light — then one breath of pride.",
      subQuote: "Farr is patient. But it does not forgive.",
      hakimComment: "Jamshid's tragedy is not weakness. He was the greatest king in an age of kings. His fall teaches what no victory can: the gods are watching for the moment pride erases humility.",
      color: "gold",
      accent: "rgba(244,197,107,.3)",
    },
  };

  const showHeroReveal = (heroId, onDone) => {
    const hero = HERO_REVEALS[heroId];
    if (!hero) { if (onDone) onDone(); return; }

    const seenKey = `real_hero_reveal_${heroId}`;
    if (localStorage.getItem(seenKey)) { if (onDone) onDone(); return; }
    localStorage.setItem(seenKey, "1");

    const colorMap = {
      crimson: "#ff5267",
      jade: "#53d79c",
      gold: "#f4c56b",
      violet: "#8c6dff",
      azure: "#5ea2ff",
    };
    const accentColor = colorMap[hero.color] || "#f4c56b";

    const el = document.createElement("div");
    el.className = "hr-overlay";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.innerHTML = `
      <div class="hr-bg" style="--hr-accent:${hero.accent};" aria-hidden="true"></div>
      <div class="hr-content">
        <div class="hr-era">${hero.era}</div>
        <div class="hr-silhouette" aria-hidden="true">${hero.silhouette}</div>
        <div class="hr-name" style="color:${accentColor};">${hero.name}</div>
        <div class="hr-quote">"${hero.quote}"</div>
        <div class="hr-sub-quote">${hero.subQuote}</div>
        <div class="hr-hakim-block">
          <span class="hr-hakim-label">Hakim</span>
          <span class="hr-hakim-text"></span>
        </div>
        <button class="hr-enter" style="border-color:${accentColor}40; color:${accentColor};">
          Enter Chronicle ›
        </button>
      </div>
    `;
    document.body.appendChild(el);

    requestAnimationFrame(() => el.classList.add("hr-visible"));

    const hakimEl = el.querySelector(".hr-hakim-text");
    let hIdx = 0;
    const typeHakim = () => {
      if (hIdx < hero.hakimComment.length) {
        hakimEl.textContent += hero.hakimComment[hIdx++];
        setTimeout(typeHakim, 18);
      }
    };
    setTimeout(typeHakim, 2400);

    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return; dismissed = true;
      el.classList.add("hr-exit");
      setTimeout(() => { el.remove(); if (onDone) onDone(); }, 600);
    };

    setTimeout(dismiss, 9000);
    el.querySelector(".hr-enter").addEventListener("click", dismiss);
  };

  /* ══════════════════════════════════════════════════════════════
     SACRED QUIET MOMENT
     Intentional world-pause after major events.
     Reduced UI, slow quote, gentle breathe.
     ══════════════════════════════════════════════════════════════ */

  const showSacredQuiet = (quote, onDone) => {
    const el = document.createElement("div");
    el.className = "sq-overlay";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = `
      <div class="sq-content">
        <div class="sq-rule" aria-hidden="true"></div>
        <div class="sq-quote"></div>
        <div class="sq-rule" aria-hidden="true"></div>
      </div>
    `;
    document.body.appendChild(el);

    requestAnimationFrame(() => el.classList.add("sq-visible"));

    const quoteEl = el.querySelector(".sq-quote");
    const full = `"${quote}"`;
    let qIdx = 0;
    const typeQ = () => {
      if (qIdx < full.length) {
        quoteEl.textContent += full[qIdx++];
        setTimeout(typeQ, 30);
      }
    };
    setTimeout(typeQ, 400);

    setTimeout(() => {
      el.classList.add("sq-exit");
      setTimeout(() => { el.remove(); if (onDone) onDone(); }, 900);
    }, 4200);
  };

  window.RealCinematic = {
    showChapterReveal,
    showHakimAppearance,
    showLoreDiscovery,
    showDamavandMemory,
    showHeroReveal,
    showSacredQuiet,
  };
})();
