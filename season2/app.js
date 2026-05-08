/* ==========================================================================
   REAL Shahnameh — Season 2
   Frontend prototype interactions: orb taps, quiz flow, tabs, share, toasts
   ========================================================================== */

(() => {
  "use strict";

  /* ---------- helpers ---------- */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
  const haptic = (style = "light") => {
    try {
      if (tg && tg.HapticFeedback) {
        if (style === "success" || style === "error" || style === "warning") {
          tg.HapticFeedback.notificationOccurred(style);
        } else {
          tg.HapticFeedback.impactOccurred(style);
        }
      } else if (navigator.vibrate) {
        navigator.vibrate(style === "heavy" ? 18 : style === "medium" ? 10 : 6);
      }
    } catch (_) { /* noop */ }
  };

  /* ---------- toast ---------- */
  const toast = (msg) => {
    const el = $("[data-toast]");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 1800);
  };

  /* ---------- shared: any click on [data-toast-msg] -> toast ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-toast-msg]");
    if (t) {
      toast(t.getAttribute("data-toast-msg"));
      haptic("light");
    }
  });

  /* ---------- copy referral link ---------- */
  $$("[data-copy-link]").forEach((btn) => {
    const original = btn.textContent;
    btn.addEventListener("click", async () => {
      const value = btn.getAttribute("data-copy-link") || $("[data-link]")?.textContent || "";
      try {
        await navigator.clipboard.writeText(value);
        btn.textContent = "Copied ✓";
        toast("Invite link copied");
        haptic("success");
      } catch {
        btn.textContent = "Copy manually";
      }
      setTimeout(() => (btn.textContent = original), 1500);
    });
  });

  /* ---------- share button (Telegram or system) ---------- */
  $$("[data-share]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const url = $("[data-link]")?.textContent.trim() || location.href;
      const text = "Join me on REAL Shahnameh — Persian myths, real rewards. ⚔";
      if (tg && tg.openTelegramLink) {
        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
      } else if (navigator.share) {
        try { await navigator.share({ title: "REAL Shahnameh", text, url }); }
        catch (_) { /* dismissed */ }
      } else {
        try { await navigator.clipboard.writeText(`${text} ${url}`); toast("Link copied — paste anywhere"); }
        catch { toast("Copy this link"); }
      }
      haptic("medium");
    });
  });

  /* ===========================================================
     PLAY: Energy Core orb
     - tap: spend energy, +N REAL, combo, occasional crit
     - regen: +1 every 3s up to max
     =========================================================== */

  const orb       = $("[data-energy-orb]");
  const coreWrap  = $("[data-core]");
  const energyEl  = $("[data-energy]");
  const fillEl    = $("[data-energy-fill]");
  const balanceEl = $("[data-balance]");
  const comboEl   = $("[data-combo]");

  if (orb && coreWrap && energyEl && fillEl) {
    const state = {
      max: 1000,
      energy: parseInt(energyEl.textContent, 10) || 720,
      balance: parseInt((balanceEl?.textContent || "0").replace(/[^\d]/g, ""), 10) || 12840,
      combo: 1,
      lastTap: 0,
      tapCost: 1,
      base: 12,
    };

    const renderEnergy = () => {
      energyEl.textContent = state.energy;
      fillEl.style.width = `${(state.energy / state.max) * 100}%`;
    };
    const renderBalance = () => {
      if (!balanceEl) return;
      balanceEl.innerHTML = `${state.balance.toLocaleString()}<small> REAL</small>`;
    };
    const renderCombo = () => {
      if (!comboEl) return;
      comboEl.textContent = state.combo.toFixed(1);
    };

    /* drift particles */
    const spawnParticles = () => {
      if (document.hidden) return;
      const rect = coreWrap.getBoundingClientRect();
      const count = 10;
      for (let i = 0; i < count; i++) {
        const p = document.createElement("span");
        p.className = "particle";
        const size = Math.random() * 5 + 2;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.left = `${Math.random() * 100}%`;
        p.style.bottom = `${Math.random() * 30 + 30}%`;
        p.style.animationDuration = `${Math.random() * 3 + 2.4}s`;
        p.style.opacity = `${Math.random() * 0.5 + 0.4}`;
        coreWrap.appendChild(p);
        setTimeout(() => p.remove(), 6000);
      }
    };
    spawnParticles();
    const particleTimer = setInterval(spawnParticles, 2200);

    /* tap */
    const tap = (event) => {
      if (state.energy < state.tapCost) {
        toast("Out of energy — wait for regen or use Boost");
        haptic("warning");
        return;
      }
      const now = performance.now();
      // combo: chain taps within 800ms
      if (now - state.lastTap < 800) {
        state.combo = Math.min(state.combo + 0.1, 5);
      } else {
        state.combo = 1;
      }
      state.lastTap = now;

      const crit = Math.random() < 0.08;
      const reward = Math.round(state.base * state.combo * (crit ? 3 : 1));

      state.energy = Math.max(0, state.energy - state.tapCost);
      state.balance += reward;

      renderEnergy();
      renderBalance();
      renderCombo();

      // floating spark
      const spark = document.createElement("span");
      spark.className = `spark${crit ? " crit" : ""}`;
      spark.textContent = `+${reward}${crit ? " ⚡" : ""}`;
      const rect = coreWrap.getBoundingClientRect();
      const x = (event && event.clientX != null) ? event.clientX - rect.left : rect.width / 2;
      const y = (event && event.clientY != null) ? event.clientY - rect.top : rect.height / 2;
      spark.style.left = `${x - 12}px`;
      spark.style.top  = `${y - 18}px`;
      coreWrap.appendChild(spark);
      setTimeout(() => spark.remove(), 900);

      // combo popup
      if (state.combo >= 1.5 && !coreWrap.querySelector(".combo-pop")) {
        const cp = document.createElement("span");
        cp.className = "combo-pop";
        cp.textContent = `Combo ×${state.combo.toFixed(1)}`;
        coreWrap.appendChild(cp);
        setTimeout(() => cp.remove(), 1100);
      }

      // tap squish
      orb.animate([
        { transform: "scale(1)" },
        { transform: "scale(0.94)" },
        { transform: "scale(1.04)" },
        { transform: "scale(1)" }
      ], { duration: 220, easing: "ease-out" });

      haptic(crit ? "heavy" : "light");
    };

    orb.addEventListener("click", tap);
    orb.addEventListener("touchstart", (e) => {
      const t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      tap({ clientX: t.clientX, clientY: t.clientY });
    }, { passive: true });

    /* regen */
    const regenTimer = setInterval(() => {
      if (state.energy < state.max) {
        state.energy = Math.min(state.max, state.energy + 1);
        renderEnergy();
      }
    }, 3000);

    /* boost button on Play */
    const boostBtn = $("[data-action=\"boost\"]");
    if (boostBtn) {
      boostBtn.addEventListener("click", () => {
        if (boostBtn.disabled) return;
        boostBtn.disabled = true;
        boostBtn.textContent = "Boost active · 30:00";
        state.base *= 3;
        toast("Boost active · ×3 tap power for 30 min");
        haptic("success");
        let secs = 30 * 60;
        const tick = setInterval(() => {
          secs -= 1;
          const m = String(Math.floor(secs / 60)).padStart(2, "0");
          const s = String(secs % 60).padStart(2, "0");
          boostBtn.textContent = `Boost active · ${m}:${s}`;
          if (secs <= 0) {
            clearInterval(tick);
            state.base = Math.round(state.base / 3);
            boostBtn.disabled = false;
            boostBtn.textContent = "Activate";
          }
        }, 1000);
      });
    }

    window.addEventListener("beforeunload", () => {
      clearInterval(particleTimer);
      clearInterval(regenTimer);
    });
  }

  /* ===========================================================
     HEROES: tab filtering
     =========================================================== */

  const heroTabs = $("[data-hero-tabs]");
  const heroList = $("[data-hero-list]");
  if (heroTabs && heroList) {
    heroTabs.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab");
      if (!btn) return;
      $$(".tab", heroTabs).forEach((t) => t.classList.remove("active"));
      btn.classList.add("active");
      const f = btn.getAttribute("data-filter");
      $$(".hero-card", heroList).forEach((card) => {
        const cat = card.getAttribute("data-cat");
        const show = f === "all" || cat === f;
        card.style.display = show ? "" : "none";
      });
      haptic("light");
    });
  }

  /* upgrade buttons on hero cards */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".hero-upgrade");
    if (!btn || btn.disabled) return;
    btn.animate([{ transform: "scale(1)" }, { transform: "scale(0.95)" }, { transform: "scale(1)" }],
      { duration: 180 });
    toast("Hero upgraded — passive +1 tier");
    haptic("success");
  });

  /* ===========================================================
     SOCIAL: leaderboard tab switching
     =========================================================== */

  const lbTabs = $("[data-lb-tabs]");
  if (lbTabs) {
    lbTabs.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab");
      if (!btn) return;
      const key = btn.getAttribute("data-lb");
      $$(".tab", lbTabs).forEach((t) => t.classList.remove("active"));
      btn.classList.add("active");
      $$("[data-lb-panel]").forEach((p) => {
        p.style.display = p.getAttribute("data-lb-panel") === key ? "" : "none";
      });
      haptic("light");
    });
  }

  /* ===========================================================
     LEARN: chapter open / quiz flow
     =========================================================== */

  const QUIZ = {
    1:  { title: "Keyumars — The First King", story: "From the mountains of Pars, Keyumars rules a world still soft with dawn. He clothes himself in leopard skin and the beasts bow.", q: "What does Keyumars wear as his royal mantle?", opts: ["Lion mane", "Leopard skin", "Eagle feathers", "Iron mail"], answer: 1, xp: 200, real: 80 },
    2:  { title: "Hushang — The Spark of Fire", story: "Hushang strikes flint at a serpent and instead wakes the eternal flame. Sade, the festival of fire, is born.", q: "What festival does Hushang's fire create?", opts: ["Mehregan", "Nowruz", "Sade", "Yalda"], answer: 2, xp: 250, real: 100 },
    3:  { title: "Tahmuras — Binder of Demons", story: "Tahmuras the Div-band rides through smoke and chains the demons. They beg for life and trade their secret: writing.", q: "What knowledge do the demons teach Tahmuras to keep their lives?", opts: ["Mining iron", "The art of writing", "Sailing", "Falconry"], answer: 1, xp: 300, real: 120 },
    4:  { title: "Jamshid — The Golden Throne", story: "Jamshid divides the people into four crafts and sits a kingdom of crystal. Pride finally outshines the sun.", q: "Why does Jamshid lose the divine grace (farr)?", opts: ["He refuses fire", "He claims to be a god", "He kills a demon", "He forgets Sade"], answer: 1, xp: 350, real: 150 },
    5:  { title: "Zahhak — The Serpent King", story: "Two serpents grow from Zahhak's shoulders. Their daily price is two human brains. A thousand years of darkness.", q: "Where do Zahhak's serpents grow from?", opts: ["His crown", "His shoulders", "His belt", "His shadow"], answer: 1, xp: 400, real: 180 },
    6:  { title: "Fereydun — The Liberator", story: "Kaveh the blacksmith raises his apron as a banner. Fereydun's bull-headed mace ends a tyrant.", q: "What weapon does Fereydun use to defeat Zahhak?", opts: ["Spear of fire", "Bow of dawn", "Bull-head mace", "Crystal sword"], answer: 2, xp: 450, real: 200 },
    7:  { title: "Zal — The Albino Prince", story: "Born white-haired, cast to the mountain, raised by Simorgh, Zal returns to Pars on wings of myth.", q: "Which mythical creature raises Zal?", opts: ["Dragon", "Simorgh", "Akvan Div", "Rakhsh"], answer: 1, xp: 500, real: 230 },
    8:  { title: "Rostam — Pahlavan of the Age", story: "Seven labours, one Rakhsh, no equal under the sky. Rostam becomes the world's pillar of arms.", q: "How many labours (Haft Khan) does Rostam complete?", opts: ["Three", "Five", "Seven", "Twelve"], answer: 2, xp: 600, real: 260 },
    9:  { title: "Sohrab — Son of the Storm", story: "Two armies camp on opposite shores. Father and son, unknowing, raise blades against each other.", q: "Who is Sohrab's father?", opts: ["Zal", "Esfandiyar", "Rostam", "Fereydun"], answer: 2, xp: 650, real: 280 },
    10: { title: "Esfandiyar — The Brazen-Bodied", story: "Steel cannot cut him, except where his eyes can be reached.", q: "Where is Esfandiyar vulnerable?", opts: ["His heels", "His eyes", "His left arm", "His back"], answer: 1, xp: 700, real: 320 },
    11: { title: "Simorgh — The Phoenix Council", story: "Wings the colour of the sun. The mountain remembers a wisdom older than language.", q: "Whose family does Simorgh protect across generations?", opts: ["Jamshid", "Zal and Rostam", "Fereydun", "Keyumars"], answer: 1, xp: 800, real: 360 },
    12: { title: "The Final War — Ages End", story: "The chronicle closes where it began: with fire, with iron, with kings.", q: "Who is the legendary author of the Shahnameh?", opts: ["Rumi", "Hafez", "Ferdowsi", "Saadi"], answer: 2, xp: 1500, real: 600 }
  };

  const map     = $("[data-chapter-map]");
  const modal   = $("[data-modal]");
  const burst   = $("[data-burst]");
  const burstLb = $("[data-burst-label]");

  if (map && modal) {
    const elTitle    = $("[data-modal-title]", modal);
    const elSub      = $("[data-modal-sub]", modal);
    const elStory    = $("[data-modal-story]", modal);
    const elQuestion = $("[data-modal-question]", modal);
    const elOptions  = $("[data-modal-options]", modal);
    const elResult   = $("[data-modal-result]", modal);
    const elResTitle = $("[data-result-title]", modal);
    const elResBody  = $("[data-result-body]", modal);
    const elResRew   = $("[data-result-rewards]", modal);
    const elNext     = $("[data-modal-next]", modal);
    const elActions  = $("[data-modal-actions]", modal);
    const elClose    = $("[data-modal-close]", modal);

    let currentChapterEl = null;
    let currentId = null;

    const openModal = (chapterEl) => {
      const id = parseInt(chapterEl.getAttribute("data-chapter"), 10);
      const data = QUIZ[id];
      if (!data) return;
      currentChapterEl = chapterEl;
      currentId = id;

      elTitle.textContent = data.title;
      elSub.textContent = chapterEl.classList.contains("done")
        ? "Reread the passage and revisit the quiz."
        : "Read the cinematic and answer to claim rewards.";
      elStory.textContent = data.story;
      elQuestion.textContent = data.q;
      elOptions.innerHTML = "";
      data.opts.forEach((opt, idx) => {
        const b = document.createElement("button");
        b.className = "quiz-option";
        b.innerHTML = `<span>${opt}</span><span style="opacity:.5; font-size:11px;">${String.fromCharCode(65 + idx)}</span>`;
        b.addEventListener("click", () => answer(idx, b, data));
        elOptions.appendChild(b);
      });
      elResult.classList.remove("show");
      elActions.style.display = "";
      elOptions.style.display = "";
      elQuestion.style.display = "";

      modal.classList.add("open");
      document.body.style.overflow = "hidden";
      haptic("light");
    };

    const closeModal = () => {
      modal.classList.remove("open");
      document.body.style.overflow = "";
      currentChapterEl = null;
      currentId = null;
    };

    const answer = (idx, btn, data) => {
      $$(".quiz-option", elOptions).forEach((b) => b.classList.add("disabled"));
      const correct = idx === data.answer;
      if (correct) {
        btn.classList.add("correct");
        haptic("success");
        elResTitle.textContent = `+${data.xp} XP · +${data.real} REAL`;
        elResBody.textContent = "Chapter rewards locked in.";
        elResRew.innerHTML = `<span class="chip warm">⭐ ${data.xp} XP</span><span class="chip">🪙 ${data.real} REAL</span><span class="chip lush">+1 Hero fragment</span>`;
        elResult.classList.add("show");
        // mark chapter done
        if (currentChapterEl) {
          currentChapterEl.classList.remove("active", "locked");
          currentChapterEl.classList.add("done");
          const node = currentChapterEl.querySelector(".node");
          if (node) node.textContent = "✓";
        }
        // unlock the next chapter
        const next = currentId + 1;
        const nextEl = map.querySelector(`[data-chapter="${next}"]`);
        if (nextEl && nextEl.classList.contains("locked")) {
          nextEl.classList.remove("locked");
          nextEl.classList.add("active");
          fireBurst(`Chapter ${next} unlocked`);
        }
      } else {
        btn.classList.add("wrong");
        haptic("error");
        // reveal correct
        const correctBtn = $$(".quiz-option", elOptions)[data.answer];
        if (correctBtn) correctBtn.classList.add("correct");
        elResTitle.textContent = "Re-read and try again";
        elResBody.textContent = "No XP this round — the chronicle awaits.";
        elResRew.innerHTML = "";
        elResult.classList.add("show");
      }
    };

    elNext.addEventListener("click", closeModal);
    elClose.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
    });

    map.addEventListener("click", (e) => {
      const ch = e.target.closest(".chapter");
      if (!ch) return;
      if (ch.classList.contains("locked")) {
        toast("Complete the previous chapter to unlock");
        haptic("warning");
        return;
      }
      openModal(ch);
    });
  }

  /* unlock burst overlay */
  const fireBurst = (label = "Unlocked") => {
    if (!burst) return;
    if (burstLb) burstLb.textContent = label;
    burst.classList.add("show");
    haptic("success");
    setTimeout(() => burst.classList.remove("show"), 900);
  };
})();
