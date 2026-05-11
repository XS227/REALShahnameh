/* ==========================================================================
   REAL Shahnameh — Cinematic Intro controller.
   Sequences the 9 panels, handles swipe + keyboard nav, persists "seen"
   in localStorage, and plays well with Telegram's WebApp viewport.
   ========================================================================== */
(() => {
  "use strict";

  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const $  = (s, r = document) => r.querySelector(s);

  const stage    = $("[data-intro-stage]");
  if (!stage) return;

  const panels   = $$(".intro-panel", stage);
  const stepEl   = $("[data-intro-step]");
  const dotsHost = $("[data-intro-dots]");
  const nextBtn  = $("[data-intro-next]");
  const prevBtn  = $("[data-intro-prev]");
  const skipBtn  = $("[data-intro-skip]");
  const beginBtn = $("[data-intro-begin]");

  /* ---- Telegram WebApp glue ---- */
  const tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
  if (tg) {
    try {
      tg.ready();
      tg.expand();
      if (tg.setHeaderColor) tg.setHeaderColor("#04050b");
      if (tg.setBackgroundColor) tg.setBackgroundColor("#04050b");
    } catch { /* non-fatal */ }
  }
  const haptic = (k) => {
    try { tg && tg.HapticFeedback && tg.HapticFeedback.impactOccurred(k || "light"); }
    catch { /* nop */ }
  };

  /* ---- dot pagination ---- */
  panels.forEach(() => {
    const d = document.createElement("span");
    d.className = "intro-dot";
    dotsHost.appendChild(d);
  });
  const dots = $$(".intro-dot", dotsHost);

  /* ---- state ---- */
  let idx = 0;

  const updateUI = () => {
    panels.forEach((p, i) => { p.hidden = i !== idx; });
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("done",   i <  idx);
    });
    if (stepEl) stepEl.textContent = `${idx + 1} / ${panels.length}`;
    prevBtn.hidden = idx === 0;
    // CTA panel hides next button — the Begin button is the next step.
    const onCta = idx === panels.length - 1;
    nextBtn.style.display = onCta ? "none" : "";
    skipBtn.style.display = onCta ? "none" : "";
  };

  const go = (next) => {
    next = Math.max(0, Math.min(panels.length - 1, next));
    if (next === idx) return;
    idx = next;
    updateUI();
    haptic("light");
  };

  /* ---- buttons ---- */
  nextBtn.addEventListener("click", () => go(idx + 1));
  prevBtn.addEventListener("click", () => go(idx - 1));
  skipBtn.addEventListener("click", () => go(panels.length - 1));

  /* ---- keyboard nav (helps desktop dev / accessibility) ---- */
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); go(idx + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(idx - 1); }
    else if (e.key === "Escape")    { go(panels.length - 1); }
  });

  /* ---- swipe (Telegram WebView is touch-only) ---- */
  let touchX = null, touchY = null;
  stage.addEventListener("touchstart", (e) => {
    if (!e.touches[0]) return;
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
  }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    if (touchX == null) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - touchX;
    const dy = t.clientY - touchY;
    touchX = touchY = null;
    // Horizontal swipes only — let vertical scroll pass through.
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) go(idx + 1);
    else        go(idx - 1);
  }, { passive: true });

  /* ---- begin journey: persist intro completion ---- */
  /* The intro is part of the first-time onboarding gate, so we persist a
     GLOBAL "intro seen" flag (used by app.js to decide whether to redirect
     home → intro), as well as the keyumars-specific flag (used by home.js
     to decide whether the banner CTA replays the intro). */
  const persistIntroSeen = () => {
    try {
      localStorage.setItem("real_intro_seen_global", "1");
      localStorage.setItem("real_intro_seen_keyumars", "1");
    } catch { /* private mode */ }
  };

  if (beginBtn) {
    beginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      persistIntroSeen();
      haptic("success");
      // The first-time flow lands on home — NOT directly in the chapter.
      // From there the user can choose to begin Chapter 1 via the banner CTA.
      location.replace("index.html");
    });
  }
  /* Skip from header should also count as "seen" — the user has been
     shown the cinematic stage and chose to bypass; we should not re-trap
     them on every reload. */
  if (skipBtn) {
    skipBtn.addEventListener("click", () => {
      persistIntroSeen();
    });
  }

  /* ---- bootstrap ---- */
  updateUI();
})();
