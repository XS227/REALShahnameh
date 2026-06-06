/* ==========================================================================
   REAL Shahnameh — Hakim Global Companion Orb
   Mounts a floating Hakim avatar on context pages (learn, heroes, regions,
   historical-sites). Clicking opens a quick-action mini-modal.
   ========================================================================== */

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);

  /* ── i18n helper ─────────────────────────────────────────────────────── */
  const t = (key, fallback) => {
    try {
      const l = localStorage.getItem("shahnameh_lang") || "en";
      const loc = window.RealI18NLocales;
      return (loc && loc[l] && loc[l][key]) || (loc && loc.en && loc.en[key]) || fallback || key;
    } catch { return fallback || key; }
  };

  /* ── Page context detection ───────────────────────────────────────────── */
  const page = window.location.pathname.split("/").pop() || "index.html";

  const PAGE_CONTEXT = {
    "learn.html":           { tip: "I can explain any chapter or king." },
    "heroes.html":          { tip: "Ask me about any hero in your collection." },
    "regions.html":         { tip: "I know every corner of the ancient Persian world." },
    "historical-sites.html":{ tip: "These places carry millennia of stories." },
    "dynasty.html":         { tip: "Ask me about any king or dynasty on this timeline." },
    "persia-map.html":      { tip: "I know every corner of the ancient Persian world." },
    "chapter.html":         { tip: "Ask me about this chapter's characters or events." },
    "tap.html":             { tip: "Forge well, warrior. I'll share wisdom." },
    "social.html":          { tip: "The chronicle rewards those who fight together." },
  };

  const ctx = PAGE_CONTEXT[page];
  if (!ctx) return; // don't mount on home/earn/hakim/etc.

  /* ── Quick wisdoms pool ───────────────────────────────────────────────── */
  const WISDOMS = [
    "توانا بود هر که دانا بود — Powerful is he who is wise.",
    "The crown serves the worthy, not the fortunate.",
    "Even Rostam needed Rakhsh. No hero rides alone.",
    "Farr is not inherited — it is earned by every deed.",
    "A king without wisdom is a sword without a hand.",
    "The Shahnameh teaches: memory is a form of power.",
  ];

  /* ── Mock Hakim quick responses ─────────────────────────────────────── */
  const QUICK_RESPONSES = {
    explain_page: {
      "learn.html":           "The Chronicle holds all fifty chapters of the Shahnameh. Each scene you read earns XP and unlocks codex entries — the more you learn, the stronger your court becomes.",
      "heroes.html":          "Your Discovery Album grows with every chapter completed. Each hero card is a certificate of knowledge — rare, epic, and mythic items unlock as you advance through the chronicle.",
      "regions.html":         "Ancient Persia stretched from the Zagros mountains to the steppes of Central Asia. Each region in the Shahnameh has its own kings, battles, and moral lessons waiting for you.",
      "historical-sites.html":"These places are not merely geography — they are memory made stone. Mount Damavand, Persepolis, Tus — each site connects a story to a place that still exists in the world.",
      "chapter.html":         "This chapter holds one part of the great chronicle. Read every scene carefully — the quiz answers are always hidden in the text. The rewards are worth the patience.",
    },
    learn_word: [
      "Farr (فَرّ) — divine radiance. A king's Farr draws loyalty without demanding it.",
      "Pahlavan (پهلوان) — champion warrior, bound by honour above all else.",
      "Div (دیو) — creature of chaos and darkness, servant of Ahriman.",
      "Zar (زَر) — gold of Pars. The craft-currency of your kingdom.",
      "Simorgh (سیمرغ) — the great mythical bird, teacher of kings and guardian of heroes.",
    ],
    wisdom: [
      "توانا بود هر که دانا بود — Power belongs to the wise.",
      "The brave man is not the one who feels no fear, but the one who walks forward despite it.",
      "Rostam's strength was not in his arms, but in knowing when to sheathe his sword.",
      "The Shahnameh reminds us: civilizations are built on memory, not stone.",
    ],
  };

  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /* ── Build the orb DOM ───────────────────────────────────────────────── */
  const wrap = document.createElement("div");
  wrap.className = "hakim-orb-wrap";
  wrap.innerHTML = `
    <button class="hakim-orb" aria-label="${t("hakim_orb_label", "Ask Hakim")}">
      <img src="/assets/hakim.png" alt="Hakim" onerror="this.replaceWith(document.createTextNode('🧙'))">
      <span class="hakim-orb-badge">✦</span>
    </button>
    <span class="hakim-orb-label">${t("hakim_orb_label", "Ask Hakim")}</span>
  `;

  /* ── Quick-action modal ──────────────────────────────────────────────── */
  const modal = document.createElement("div");
  modal.className = "hakim-quick-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.innerHTML = `
    <div class="hqm-head">
      <span class="hqm-title">🧙 ${t("hakim_title", "Hakim")}</span>
      <button class="hqm-close" data-hqm-close>✕</button>
    </div>
    <div class="hqm-wisdom" data-hqm-wisdom style="font-size:11px; color:var(--muted);">
      "${pickRandom(WISDOMS)}"
    </div>
    <div class="hqm-actions">
      <button class="hqm-action" data-hqm-action="explain_page">
        <span class="hqm-action-ico">📖</span>
        <span>${t("hakim_quick_explain", "Explain this page")}</span>
      </button>
      <button class="hqm-action" data-hqm-action="learn_word">
        <span class="hqm-action-ico">📚</span>
        <span>${t("hakim_quick_word", "Teach me a word")}</span>
      </button>
      <button class="hqm-action" data-hqm-action="wisdom">
        <span class="hqm-action-ico">✦</span>
        <span>${t("hakim_quick_wisdom", "Tell me a wisdom")}</span>
      </button>
      <a href="hakim.html" class="hqm-action" style="text-decoration:none;">
        <span class="hqm-action-ico">🤖</span>
        <span>${t("nav_hakim", "Open Hakim")}</span>
      </a>
    </div>
    <div class="hqm-ask-row">
      <input class="hqm-ask-input" data-hqm-input placeholder="${t("hakim_chat_placeholder", "Ask anything…")}" type="text" autocomplete="off">
      <button class="hqm-ask-btn" data-hqm-send>➤</button>
    </div>
    <div data-hqm-reply style="margin-top:8px; display:none;
      padding:10px 12px; background:rgba(140,109,255,.08);
      border:1px solid rgba(140,109,255,.25); border-radius:10px;
      font-size:12px; line-height:1.55; color:var(--text-dim);">
    </div>
  `;

  document.body.appendChild(wrap);
  document.body.appendChild(modal);

  /* ── Toggle ──────────────────────────────────────────────────────────── */
  let isOpen = false;

  const openModal = () => {
    modal.classList.add("open");
    isOpen = true;
    const wisdomEl = modal.querySelector("[data-hqm-wisdom]");
    if (wisdomEl) wisdomEl.textContent = `"${pickRandom(WISDOMS)}"`;
  };
  const closeModal = () => {
    modal.classList.remove("open");
    isOpen = false;
  };

  wrap.querySelector(".hakim-orb").addEventListener("click", () => {
    isOpen ? closeModal() : openModal();
  });
  modal.querySelector("[data-hqm-close]").addEventListener("click", closeModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) closeModal();
  });
  document.addEventListener("click", (e) => {
    if (isOpen && !modal.contains(e.target) && !wrap.contains(e.target)) closeModal();
  });

  /* ── Quick actions ───────────────────────────────────────────────────── */
  const replyEl = modal.querySelector("[data-hqm-reply]");

  const showReply = (text) => {
    replyEl.textContent = text;
    replyEl.style.display = "";
  };

  modal.querySelectorAll("[data-hqm-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-hqm-action");
      if (action === "explain_page") {
        const resp = QUICK_RESPONSES.explain_page[page] || ctx.tip;
        showReply(resp);
      } else if (action === "learn_word") {
        showReply(pickRandom(QUICK_RESPONSES.learn_word));
      } else if (action === "wisdom") {
        showReply(pickRandom(QUICK_RESPONSES.wisdom));
      }
    });
  });

  /* ── Ask input ───────────────────────────────────────────────────────── */
  const sendOrbMessage = async () => {
    const input = modal.querySelector("[data-hqm-input]");
    const text = (input.value || "").trim();
    if (!text) return;
    input.value = "";
    replyEl.textContent = t("hakim_loading", "The chronicle speaks…");
    replyEl.style.display = "";

    try {
      const r = await fetch("/api/ai/hakim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          context: { page, language: localStorage.getItem("shahnameh_lang") || "en" },
        }),
      });
      if (r.ok) {
        const d = await r.json();
        if (d.ok && d.reply) { showReply(d.reply); return; }
      }
    } catch (_) {}

    /* Fallback mock */
    const lower = text.toLowerCase();
    if (lower.includes("word") || lower.includes("mean")) showReply(pickRandom(QUICK_RESPONSES.learn_word));
    else if (lower.includes("wisdom") || lower.includes("poem")) showReply(pickRandom(QUICK_RESPONSES.wisdom));
    else showReply(QUICK_RESPONSES.explain_page[page] || t("hakim_error", "The mountain is silent tonight. Return soon."));
  };

  modal.querySelector("[data-hqm-send]").addEventListener("click", sendOrbMessage);
  modal.querySelector("[data-hqm-input]").addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendOrbMessage();
  });

  /* ── Ambient candle glow ─────────────────────────────────────────────── */
  if (!document.querySelector(".candle-glow")) {
    const glow = document.createElement("div");
    glow.className = "candle-glow";
    document.body.appendChild(glow);
  }

})();
