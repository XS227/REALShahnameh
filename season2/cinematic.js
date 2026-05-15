/* ==========================================================================
   REAL Shahnameh — Cinematic Systems
   Dust particle canvas + chapter reveal overlays + atmosphere fog
   ========================================================================== */

(() => {
  "use strict";

  /* ══════════════════════════════════════════════════════════════
     DUST PARTICLE CANVAS — ambient floating motes
     Performance: max 26 particles, every-other-frame draw, pauses when hidden
     ══════════════════════════════════════════════════════════════ */

  const initDust = () => {
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;opacity:0";
    canvas.setAttribute("aria-hidden", "true");
    document.body.insertBefore(canvas, document.body.firstChild);

    // Fade in gently
    requestAnimationFrame(() => {
      canvas.style.transition = "opacity 2s ease";
      canvas.style.opacity = "0.55";
    });

    const ctx = canvas.getContext("2d");
    let W = 0, H = 0;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const COUNT = Math.min(26, Math.floor(window.innerWidth / 16));
    const pts = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.16,
      vy: -(Math.random() * 0.2 + 0.04),
      base: Math.random() * 0.4 + 0.08,
      phase: Math.random() * Math.PI * 2,
      col: Math.random() < 0.62 ? "244,197,107" : "140,109,255",
    }));

    let tick = 0, raf;

    const draw = () => {
      tick++;
      if (tick % 2 === 0) { // skip every other frame
        ctx.clearRect(0, 0, W, H);
        pts.forEach(p => {
          p.x += p.vx; p.y += p.vy; p.phase += 0.011;
          if (p.y < -8)  { p.y = H + 8; p.x = Math.random() * W; }
          if (p.x < -8)    p.x = W + 8;
          if (p.x > W + 8) p.x = -8;
          const a = p.base * (0.65 + 0.35 * Math.sin(p.phase));
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
     ATMOSPHERE FOG — bottom candle glow drift
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
     ══════════════════════════════════════════════════════════════ */

  const REVEALS = {
    1:  { num: "I",   title: "Keyumars — The First King",      quote: "From the mountain top, a man looked down and saw what civilisation could be." },
    2:  { num: "II",  title: "Hushang — The Spark of Fire",    quote: "When darkness was struck against itself, light was born." },
    3:  { num: "III", title: "Tahmuras — Binder of Demons",    quote: "Even the darkest knowledge, wielded with justice, becomes civilisation." },
    4:  { num: "IV",  title: "Jamshid — The Golden Throne",    quote: "Power without humility invites the shadow." },
    5:  { num: "V",   title: "Zahhak — The Serpent King",      quote: "A tyrant must feed on his people to keep himself alive." },
    6:  { num: "VI",  title: "Fereydun — The Liberator",       quote: "A blacksmith's apron became the banner of a nation's freedom." },
    7:  { num: "VII", title: "Zal — The Albino Prince",        quote: "The Simorgh raised what the mountain had cast away." },
    8:  { num: "VIII",title: "Rostam — Champion of Pars",      quote: "Strength carries its own burden. The greatest bear it silently." },
    9:  { num: "IX",  title: "Sohrab — Son of the Storm",      quote: "The cruelest battles are fought without knowing who stands before us." },
    10: { num: "X",   title: "Esfandiyar — The Brazen-Bodied", quote: "Invulnerability is not strength. The eyes remain open always." },
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
        <div class="co-kicker">CHAPTER ${data.num}</div>
        <div class="co-rule" aria-hidden="true"></div>
        <div class="co-title">${data.title}</div>
        <div class="co-quote">"${data.quote}"</div>
        <button class="co-skip">Skip ›</button>
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

    const timer = setTimeout(dismiss, 4500);
    el.querySelector(".co-skip").addEventListener("click", () => { clearTimeout(timer); dismiss(); });
    el.addEventListener("click", (e) => {
      if (e.target !== el && !e.target.classList.contains("co-bg")) return;
      clearTimeout(timer); dismiss();
    });

    return dismiss;
  };

  /* ══════════════════════════════════════════════════════════════
     INIT
     ══════════════════════════════════════════════════════════════ */

  const SKIP_DUST = ["tap.html"]; // tap has its own heavy canvas

  const init = () => {
    const p = window.location.pathname.split("/").pop() || "";
    if (!SKIP_DUST.includes(p)) initDust();
    initFog();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.RealCinematic = { showChapterReveal };
})();
