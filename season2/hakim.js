/* ==========================================================================
   REAL Shahnameh — Season 2
   Hakim AI Companion — chat logic, mock responses, quick actions
   ========================================================================== */

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ── Words of the day pool ────────────────────────────────────────────── */
  const WORDS_OF_DAY = [
    {
      persian: "فَرّ",
      latin: "Farr",
      def: "Divine royal radiance — the celestial grace granted by God to worthy kings. When a king possessed Farr, armies followed without question and the land flourished. When pride or injustice caused it to depart, even the mightiest throne collapsed.",
      example: "Jamshid ruled justly for three hundred years, but when he claimed to be a god, the Farr left him like a bird, and Zahhak rose to take his place.",
    },
    {
      persian: "پهلوان",
      latin: "Pahlavan",
      def: "Champion warrior of the highest rank — not merely powerful in combat, but bound by a strict code of honour, loyalty, and service to the righteous king. A Pahlavan never fights for personal glory alone.",
      example: "Rostam is called the greatest Pahlavan of all time — seven labours, a hundred battles, and still he wept when he learned the identity of Sohrab.",
    },
    {
      persian: "دیو",
      latin: "Div",
      def: "Creature of chaos and darkness serving Ahriman, the evil principle. Divs can be monstrous beasts, subtle tempters, or lords of entire dark kingdoms. Some can be defeated; some bound; some are beyond any mortal strength.",
      example: "Tahmuras, called the Div-binder, rode a chained Ahriman like a horse and bound eighty Divs — who taught him the scripts of the world in exchange for their lives.",
    },
    {
      persian: "سیمرغ",
      latin: "Simorgh",
      def: "The great mythical bird of Persian legend — ancient beyond memory, possessed of all the world's knowledge, nesting on the world-tree Gaokerena. The Simorgh is not simply a creature but a teacher, a guide, and a symbol of divine wisdom.",
      example: "Zal, abandoned by his father Sam on the peak of Mount Alborz, was raised by the Simorgh. When he descended to become a warrior, the Simorgh gave him a feather: burn it, and I shall come.",
    },
    {
      persian: "زَر",
      latin: "Zar",
      def: "Gold — the material measure of a court's power. In the Shahnameh, Zar is both literal treasure and a symbol of kingly generosity. A great king gives Zar freely; a miser king loses Farr with his gold.",
      example: "When Ferdowsi completed the Shahnameh, Sultan Mahmud promised sixty thousand gold dirhams — one for each verse — but sent sixty thousand silver instead. The poet's bitter verses cursed the king for his greed.",
    },
    {
      persian: "اَهریمن",
      latin: "Ahriman",
      def: "The supreme evil principle of Zoroastrian cosmology — the force of darkness, lies, and destruction that opposes Ahura Mazda. In the Shahnameh, Ahriman works through Divs, serpents, and corrupt kings to destroy the cosmic order.",
      example: "Zahhak was not born evil. It was Ahriman who tempted him step by step — first to dishonour his father, then to receive the serpents growing from his shoulders, then to feed them on human brains.",
    },
    {
      persian: "خِرَد",
      latin: "Kherad",
      def: "Wisdom — the faculty of right discernment, moral reason, and understanding. The Shahnameh opens with an invocation to kherad as the supreme gift of God. Kings who rule by kherad bring justice; those who abandon it bring ruin.",
      example: "Ferdowsi's opening words: 'به نام خداوند جان و خرد' — In the name of the Lord of soul and wisdom. Kherad is the first word of the epic after the name of God.",
    },
  ];

  /* ── Timeline of the Shahnameh eras ───────────────────────────────────── */
  const TIMELINE = [
    { year: "Mythic Age", title: "The First Kings", body: "Keyumars, first of men and kings, rules from the mountain of Alborz. His son Siamak is slain by the Black Div — beginning the age of grief and vengeance." },
    { year: "c. 7000 BC", title: "The Age of Hushang", body: "Hushang, grandson of Keyumars, defeats the Black Div, discovers fire, and inaugurates Sadeh — the festival of fire still celebrated today." },
    { year: "c. 6000 BC", title: "Tahmuras — Binder of Demons", body: "Tahmuras rides Ahriman like a horse and binds the great Divs. In exchange for their lives, the demons teach him the scripts of twenty languages." },
    { year: "c. 5500 BC", title: "Jamshid — Rise and Fall", body: "The greatest king of the Pishdadian era rules for 700 years — teaching weaving, medicine, and the arts. His pride destroys him; the Farr departs and Zahhak seizes the throne." },
    { year: "c. 5000 BC", title: "Zahhak and the Serpents", body: "Zahhak, corrupted by Ahriman, grows serpents from his shoulders fed on human brains. He rules for a thousand years until Kaveh the Blacksmith raises his leather apron as a banner of revolt." },
    { year: "c. 4000 BC", title: "Fereydun and the Binding", body: "Fereydun, raised in hiding, defeats Zahhak and chains him in Mount Damavand. He divides the world among his three sons — and the first great war of brothers begins." },
    { year: "c. 2000 BC", title: "The Age of Rostam", body: "The great Sistani hero Rostam rises to become champion of all Iran. His Seven Labours, his love for Rakhsh, his unwitting killing of Sohrab — the heart of the Shahnameh." },
    { year: "c. 1000 BC", title: "The Kayanian Dynasty", body: "Kay Kavus, Key Khosrow, and Lohrasp rule in the great middle age. Siavash is murdered by Afrasiab of Turan, and Key Khosrow leads the war of revenge before ascending to heaven." },
    { year: "c. 330 BC", title: "Alexander the Accursed", body: "Eskandar (Alexander) conquers Persia and burns Persepolis. The Shahnameh does not glorify him — he is 'the two-horned,' a bearer of destruction who is also, ambiguously, son of an Iranian king." },
    { year: "c. 240 AD", title: "The Sassanid Kings", body: "Ardashir Papakan restores Persian greatness. Khosrow Anushirvan rules as the 'Just King.' The Shahnameh closes with the Arab conquest of Iran in 651 AD and the end of the last Persian empire." },
    { year: "977–1010 AD", title: "Ferdowsi Composes the Shahnameh", body: "Over thirty years, Abu'l-Qasim Ferdowsi weaves sixty thousand verses from oral traditions and old manuscripts — saving the Persian language from extinction after the Arab conquest." },
  ];

  /* ── Daily wisdom pool ─────────────────────────────────────────────────── */
  const WISDOMS = [
    { text: '"توانا بود هر که دانا بود — Knowledge is the root of all power."', src: "Ferdowsi · Shahnameh" },
    { text: '"بدی را بدی سهل باشد جزا — Evil answered with evil is easy; virtue rewarded is rare."', src: "Ferdowsi · Shahnameh" },
    { text: '"چو ایران نباشد تن من مباد — Let my body cease to be if Iran shall not be."', src: "Ferdowsi · Shahnameh" },
    { text: '"هنر نزد ایرانیان است و بس — Craft and wisdom dwell in Iran above all."', src: "Ferdowsi · Shahnameh" },
    { text: '"سخن‌گوی فردوس باشی بهشت — Speak truth and paradise is yours."', src: "Ferdowsi · Shahnameh" },
    { text: '"The true king is one whose people speak his name without fear."', src: "Hakim — on Kingship" },
    { text: '"A warrior who reads is twice as dangerous as a warrior who only fights."', src: "Hakim — on Learning" },
  ];

  /* ── Mock AI responses by topic ────────────────────────────────────────── */
  const MOCK_RESPONSES = {
    explain_chapter: [
      "Chapter 1 follows Keyumars, the first king of the Pishdadian dynasty. He ruled from the mountains of ancient Pars, clothed in leopard skin — a sign that civilization was still young. He united the animals and humans under his rule through divine grace, called Farr. His son Siamak would later be killed by the Black Div — beginning the first great sorrow of the age.",
      "The Keyumars era marks the mythic dawn of kingship in the Shahnameh. Ferdowsi describes him as the first human to organize a court and teach others to weave, bind, and build. His reign is short in the chronicle, but its purpose is foundational: to show that order can emerge from chaos.",
    ],
    quest_help: [
      "For your current quest, focus on reading the Chronicle scenes first — each scene you read earns XP and unlocks codex entries. After reading, complete the chapter quiz to claim your reward. Even one correct answer advances your bond with the chronicle.",
      "The fastest way to advance your quests is through the Chronicle. Each chapter you complete earns Farr, Zar, and hero fragments. Tap regularly to maintain your energy income, and check in daily to keep your streak alive.",
    ],
    teach_word: [
      "Today's word: **Farr** (فَرّ). This is divine radiance — a quality that the gods granted to worthy kings. When a king possessed Farr, his kingdom flourished and enemies retreated. When he lost it, through pride or injustice, his reign collapsed. Jamshid's story is the perfect example of Farr both gained and lost.",
      "Today's word: **Div** (دیو). These are the demonic beings of the Shahnameh — not simply 'demons' in the Western sense, but creatures of darkness and chaos who oppose cosmic order. Some Divs are pure evil, like Ahriman's servants. Others are merely wild and can be tamed, like those bound by Tahmuras.",
      "Today's word: **Pahlavan** (پهلوان). A champion warrior of the highest order — not just physically powerful, but bound by a code of honour and loyalty. Rostam is the greatest Pahlavan of the Shahnameh. The word survives today in Persian as a title of respect.",
    ],
    battle_advice: [
      "In your Tap battles, timing is everything. Build up your combo multiplier before the critical strike window. Using a hero with high passive bonuses — like Keyumars for XP or Rostam for combat power — will make a significant difference in your output per session.",
      "The key to winning in the Shahnameh is preparation. Before the final encounter of any chapter, read all scenes and unlock the codex entries. The knowledge you gather translates into battle power. Hakim advises: never fight an enemy you have not yet studied.",
    ],
    tell_wisdom: [
      "Here is a wisdom from the Shahnameh: 'The crown belongs to the one who can carry its weight without becoming its servant.' — Keyumars chose the mountain over the palace because the mountain reminded him he was mortal.",
      "Ferdowsi wrote this about time: 'Days pass like water over stone — slowly they wear even the hardest king into the shape of his deeds.' Whatever you do today in the chronicle, your actions shape the story that will outlast you.",
      "On patience: 'Rostam did not conquer his Seven Labours in one day, nor did Zal descend from Simorgh's mountain in one leap. The chronicle rewards those who return.'",
    ],
    translate: [
      "A common verse from the Shahnameh opening: **'به نام خداوند جان و خرد'** translates as: 'In the name of the Lord of soul and wisdom' — This is Ferdowsi's opening line, his invocation before all sixty thousand verses begin.",
      "The phrase **'شاهنامه'** (Shahnameh) literally means 'Book of Kings' — شاه (Shah) = King, نامه (Nameh) = Book/Letter. Together they form the title of the greatest Persian epic ever written.",
    ],
    default: [
      "That is a worthy question for the chronicle. Hakim will reflect on this and return with an answer shaped by the wisdom of Ferdowsi's age. For now, read the next scene of your chapter — the answer may already be written there.",
      "Hakim hears your question. The Shahnameh teaches that all answers worth having require a moment of stillness. Continue your chronicle journey and the answer will find you.",
      "Wise question. The heroes of the Shahnameh often asked the same things you ask now — about fate, courage, and the weight of choices. Hakim will guide you. Ask again tomorrow for a deeper answer.",
    ],
  };

  /* ── Helpers ─────────────────────────────────────────────────────────── */

  const getLang = () => {
    try { return localStorage.getItem("shahnameh_lang") || "en"; } catch { return "en"; }
  };

  const t = (key) => {
    const l = getLang();
    const loc = window.RealI18NLocales;
    return (loc && loc[l] && loc[l][key]) || (loc && loc.en && loc.en[key]) || key;
  };

  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /* ── Set daily wisdom ─────────────────────────────────────────────────── */
  const setDailyWisdom = () => {
    const el = $("[data-wisdom-text]");
    if (!el) return;
    const dayIdx = Math.floor(Date.now() / 86400000) % WISDOMS.length;
    const w = WISDOMS[dayIdx];
    el.textContent = w.text;
    const src = el.parentElement && el.parentElement.querySelector(".hakim-wisdom-source");
    if (src) src.textContent = `— ${w.src}`;
  };

  /* ── Chat ────────────────────────────────────────────────────────────── */

  const messagesEl = $("[data-chat-messages]");
  const inputEl = $("[data-chat-input]");
  const sendBtn = $("[data-chat-send]");
  const emptyEl = $("[data-chat-empty]");

  if (!messagesEl || !inputEl || !sendBtn) return;

  let isLoading = false;
  let messageCount = 0;

  const hideEmpty = () => {
    if (emptyEl) emptyEl.style.display = "none";
  };

  const scrollToBottom = () => {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  };

  const addBubble = (html, role) => {
    const div = document.createElement("div");
    div.className = `hcm-bubble ${role}`;
    div.innerHTML = html;
    messagesEl.appendChild(div);
    scrollToBottom();
    return div;
  };

  const addUserBubble = (text) => {
    hideEmpty();
    addBubble(escapeHtml(text), "user");
    messageCount++;
  };

  const addLoadingBubble = () => {
    hideEmpty();
    return addBubble(`<div class="hcm-dots"><span></span><span></span><span></span></div>`, "hakim loading");
  };

  const addHakimBubble = (text, source) => {
    const srcHtml = source ? `<span class="hcm-source">— ${escapeHtml(source)}</span>` : "";
    addBubble(escapeHtml(text) + srcHtml, "hakim");
    messageCount++;
  };

  const escapeHtml = (s) => String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  /* ── Send message via API (with mock fallback) ───────────────────────── */
  const sendMessage = async (text, quickTopic) => {
    if (isLoading || !text.trim()) return;
    isLoading = true;
    sendBtn.disabled = true;
    inputEl.disabled = true;

    addUserBubble(text.trim());
    inputEl.value = "";
    inputEl.style.height = "";

    // Record theme for memory system
    if (window.HakimMemory) window.HakimMemory.recordTheme(text);

    const loadingBubble = addLoadingBubble();

    try {
      const response = await fetch("/api/ai/hakim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          context: {
            page: "hakim",
            quickTopic: quickTopic || null,
            language: getLang(),
            playerLevel: 1,
          },
        }),
      });

      loadingBubble.remove();

      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.reply) {
          const reply = (window.HakimPersonality)
            ? window.HakimPersonality.wrapResponse(data.reply, text)
            : data.reply;
          addHakimBubble(reply, data.source === "mock" ? "Hakim · Shahnameh" : null);
        } else {
          addHakimBubble(t("hakim_error"));
        }
      } else {
        addHakimBubble(getMockResponse(quickTopic, text));
      }
    } catch {
      loadingBubble.remove();
      addHakimBubble(getMockResponse(quickTopic, text));
    }
    if (window.RealAudio) window.RealAudio.sounds.pageTurn();

    isLoading = false;
    sendBtn.disabled = false;
    inputEl.disabled = false;
    inputEl.focus();
  };

  /* ── Mock response generator ─────────────────────────────────────────── */
  const getMockResponse = (quickTopic, text) => {
    if (quickTopic && MOCK_RESPONSES[quickTopic]) {
      return pickRandom(MOCK_RESPONSES[quickTopic]);
    }
    const lower = (text || "").toLowerCase();
    if (lower.includes("keyumars") || lower.includes("chapter 1") || lower.includes("chapter")) {
      return pickRandom(MOCK_RESPONSES.explain_chapter);
    }
    if (lower.includes("word") || lower.includes("mean") || lower.includes("farr") || lower.includes("div")) {
      return pickRandom(MOCK_RESPONSES.teach_word);
    }
    if (lower.includes("battle") || lower.includes("fight") || lower.includes("tap")) {
      return pickRandom(MOCK_RESPONSES.battle_advice);
    }
    if (lower.includes("wisdom") || lower.includes("poem") || lower.includes("verse")) {
      return pickRandom(MOCK_RESPONSES.tell_wisdom);
    }
    if (lower.includes("translate") || lower.includes("persian") || lower.includes("farsi")) {
      return pickRandom(MOCK_RESPONSES.translate);
    }
    if (lower.includes("quest") || lower.includes("mission") || lower.includes("task")) {
      return pickRandom(MOCK_RESPONSES.quest_help);
    }
    return pickRandom(MOCK_RESPONSES.default);
  };

  /* ── Event listeners ────────────────────────────────────────────────── */

  sendBtn.addEventListener("click", () => {
    sendMessage(inputEl.value);
  });

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputEl.value);
    }
  });

  inputEl.addEventListener("input", () => {
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + "px";
  });

  /* ── Quick action buttons ────────────────────────────────────────────── */
  $$("[data-quick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const topic = btn.getAttribute("data-quick");
      const labelEl = btn.querySelector("[data-i18n]");
      const label = labelEl ? labelEl.textContent.trim() : topic;
      sendMessage(label, topic);
    });
  });

  /* ── i18n: update placeholder after locale loads ─────────────────────── */
  const applyInputPlaceholder = () => {
    const ph = t("hakim_chat_placeholder");
    if (ph && ph !== "hakim_chat_placeholder") inputEl.placeholder = ph;
  };

  /* ── Tab switching ────────────────────────────────────────────────────── */
  const initTabs = () => {
    const tabs = document.querySelectorAll("[data-tab]");
    const panels = document.querySelectorAll("[data-tab-panel]");
    if (!tabs.length) return;
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.getAttribute("data-tab");
        tabs.forEach((t) => { t.classList.remove("active"); t.setAttribute("aria-selected", "false"); });
        panels.forEach((p) => p.classList.remove("active"));
        tab.classList.add("active");
        tab.setAttribute("aria-selected", "true");
        const panel = document.querySelector(`[data-tab-panel="${target}"]`);
        if (panel) panel.classList.add("active");
      });
    });
  };

  /* ── Populate Wisdom tab ──────────────────────────────────────────────── */
  const populateWisdomTab = () => {
    const list = document.querySelector("[data-wisdom-list]");
    if (!list) return;
    WISDOMS.forEach((w) => {
      const card = document.createElement("div");
      card.className = "hakim-word-card";
      card.style.cssText = "display:flex; flex-direction:column; gap:6px;";
      card.innerHTML = `
        <p style="font-size:13px; color:var(--text-dim); line-height:1.6; margin:0;">${escapeHtml(w.text)}</p>
        <span style="font-size:10px; color:var(--muted); letter-spacing:.5px;">— ${escapeHtml(w.src)}</span>
      `;
      list.appendChild(card);
    });
  };

  /* ── Populate Word of Day tab ─────────────────────────────────────────── */
  const populateWordTab = () => {
    const card = document.querySelector("[data-word-card]");
    if (!card) return;
    const dayIdx = Math.floor(Date.now() / 86400000) % WORDS_OF_DAY.length;
    const w = WORDS_OF_DAY[dayIdx];
    card.innerHTML = `
      <div class="hakim-word-persian">${escapeHtml(w.persian)}</div>
      <div class="hakim-word-latin">${escapeHtml(w.latin)}</div>
      <p class="hakim-word-def">${escapeHtml(w.def)}</p>
      <div class="hakim-word-example">"${escapeHtml(w.example)}"</div>
    `;
  };

  /* ── Populate Timeline tab ────────────────────────────────────────────── */
  const populateTimelineTab = () => {
    const tl = document.querySelector("[data-timeline-list]");
    if (!tl) return;
    TIMELINE.forEach((entry) => {
      const div = document.createElement("div");
      div.className = "ht-entry";
      div.innerHTML = `
        <div class="ht-dot"></div>
        <div class="ht-year">${escapeHtml(entry.year)}</div>
        <div class="ht-title">${escapeHtml(entry.title)}</div>
        <div class="ht-body">${escapeHtml(entry.body)}</div>
      `;
      tl.appendChild(div);
    });
  };

  /* ── Handle prefill from sessionStorage (from regions/sites Hakim button) */
  const handlePrefill = () => {
    try {
      const prefill = sessionStorage.getItem("hakim_prefill");
      if (prefill) {
        sessionStorage.removeItem("hakim_prefill");
        setTimeout(() => {
          if (inputEl) {
            inputEl.value = prefill;
            inputEl.dispatchEvent(new Event("input"));
            sendMessage(prefill);
          }
        }, 400);
      }
    } catch { /* ignore */ }
  };

  /* ── Voice mode placeholder ───────────────────────────────────────────── */
  const mountVoicePlaceholder = () => {
    const chatFooter = document.querySelector(".hakim-chat-footer");
    if (!chatFooter || document.querySelector(".hakim-voice-btn")) return;
    const btn = document.createElement("button");
    btn.className = "hakim-voice-btn";
    btn.setAttribute("aria-label", "Voice mode — coming soon");
    btn.innerHTML = `
      <span class="hakim-voice-ico">🎙</span>
      <span class="hakim-voice-text">
        <strong>Voice Mode</strong>
        Persian &amp; Tajik narration — in development
      </span>
      <span class="hakim-voice-soon">Soon</span>
    `;
    chatFooter.parentElement.insertBefore(btn, chatFooter);
  };

  /* ── Personality opening message ──────────────────────────────────────── */
  const showOpeningMessage = () => {
    if (!window.HakimPersonality) return;
    try { if (sessionStorage.getItem("hakim_prefill")) return; } catch {}
    setTimeout(() => {
      if (messagesEl && !messagesEl.querySelector(".hcm-bubble")) {
        // Try personalized greeting first (from memory system)
        const personalized = window.HakimMemory ? window.HakimMemory.getPersonalizedGreeting() : null;
        const opening = personalized || window.HakimPersonality.getOpening();
        addHakimBubble(opening);
      }
    }, 600);
  };

  /* ══════════════════════════════════════════════════════════════════════
     LEGACY TAB — Season 1 record + TON Connect wallet verification
     ════════════════════════════════════════════════════════════════════ */
  const initLegacyTab = () => {
    const tab = document.querySelector('[data-tab="legacy"]');
    if (!tab) return;

    const T = (key, vars) => (window.RealI18N ? window.RealI18N.t(key, vars) : (vars ? key : key));
    let loaded = false;
    let _tc = null; // TonConnectUI singleton

    /* ── helpers ── */
    const show = (sel) => {
      ['[data-legacy-loading]','[data-legacy-card]','[data-legacy-empty]'].forEach(s => {
        const el = document.querySelector(s);
        if (!el) return;
        el.classList.toggle('hidden', s !== sel);
        if (s === '[data-legacy-loading]') el.style.display = s === sel ? 'flex' : 'none';
      });
    };

    const fmtNum = n => {
      const num = Number(n) || 0;
      if (window.RealI18N) return window.RealI18N.formatNumber(num);
      return num >= 1000 ? (num/1000).toFixed(1)+'K' : String(num);
    };

    const tgUser = () =>
      window.Telegram && window.Telegram.WebApp &&
      window.Telegram.WebApp.initDataUnsafe &&
      window.Telegram.WebApp.initDataUnsafe.user;

    /* ── TON Connect singleton ── */
    const getTonConnect = () => {
      if (_tc) return _tc;
      if (!window.TonConnectUI) return null;
      try {
        _tc = new window.TonConnectUI.TonConnectUI({
          manifestUrl: 'https://shahnameh.setaei.com/tonconnect-manifest.json',
        });
        return _tc;
      } catch (_) { return null; }
    };

    /* ── After TON Connect: verify token balance on backend ── */
    const verifyWallet = async (addr, block) => {
      const statusEl = block.querySelector('[data-wallet-status]');
      const tierEl   = block.querySelector('[data-wallet-tier]');
      if (statusEl) statusEl.textContent = T('legacy_verifying');

      const u = tgUser();
      const chatId = u ? String(u.id) : null;

      try {
        const body = { walletAddress: addr, ...(chatId ? { chatId } : {}) };
        const resp = await fetch('/api/basic/wallet-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const j = await resp.json();
        if (!j.status) throw new Error('api error');

        block.classList.toggle('verified', j.holder);
        block.classList.toggle('elite', j.tier === 'elite' || j.tier === 'legend');

        if (statusEl) {
          statusEl.innerHTML = j.holder
            ? `<strong style="color:var(--gold)">${T('legacy_verified_holder')}</strong>
               <br><span style="font-size:12px;color:var(--text-muted)">${T('legacy_balance',{n:j.balance.toLocaleString()})}</span>`
            : T('legacy_no_tokens');
        }

        if (tierEl && j.tier !== 'none') {
          const tierKeys = { legend:'legacy_tier_legend', elite:'legacy_tier_elite',
                             holder:'legacy_tier_holder', supporter:'legacy_tier_supporter' };
          tierEl.innerHTML = `<span class="wallet-tier-badge tier-${j.tier}">${T(tierKeys[j.tier]||j.tier)}</span>`;
          if (j.trustBonus > 0) {
            tierEl.innerHTML += `<div style="font-size:12px;color:var(--gold);margin-top:6px;">${T('legacy_honour_awarded',{n:j.trustBonus})}</div>`;
          }
        }
      } catch (_) {
        if (statusEl) statusEl.textContent = T('legacy_wallet_error');
      }
    };

    /* ── Render wallet block (no text input — TON Connect only) ── */
    const renderWalletBlock = (container, existingAddr) => {
      container.innerHTML = '';
      const block = document.createElement('div');
      block.className = 'wallet-block';

      if (existingAddr) {
        /* Already linked — show address + check balance */
        block.innerHTML = `
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;letter-spacing:.06em;text-transform:uppercase;">${T('legacy_wallet_addr')}</div>
          <div style="font-size:12px;color:var(--text);word-break:break-all;font-family:monospace;">${existingAddr.slice(0,14)}…${existingAddr.slice(-8)}</div>
          <div data-wallet-status style="margin-top:10px;font-size:13px;color:var(--text-muted);">${T('legacy_verifying')}</div>
          <div data-wallet-tier></div>
        `;
        container.appendChild(block);
        verifyWallet(existingAddr, block);
        return;
      }

      /* No wallet yet — show TON Connect button */
      block.innerHTML = `
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">${T('legacy_wallet_sub')}</div>
        <div id="ton-connect-btn"></div>
        <div data-wallet-status style="margin-top:10px;font-size:13px;color:var(--text-muted);display:none;"></div>
        <div data-wallet-tier></div>
      `;
      container.appendChild(block);

      const tc = getTonConnect();
      if (!tc) {
        /* Fallback if TonConnectUI fails to load */
        const fb = block.querySelector('#ton-connect-btn');
        fb.innerHTML = `<div style="font-size:12px;color:var(--ember);padding:8px 0;">${T('legacy_wallet_error')}</div>`;
        return;
      }

      /* Render the TON Connect button into #ton-connect-btn */
      try { tc.uiOptions = { buttonRootId: 'ton-connect-btn' }; } catch (_) {}

      /* Watch for wallet connection */
      tc.onStatusChange(async (wallet) => {
        if (!wallet) return;

        const addr = wallet.account && wallet.account.address;
        if (!addr) return;

        const statusEl = block.querySelector('[data-wallet-status]');
        if (statusEl) { statusEl.style.display = ''; statusEl.textContent = T('legacy_connected'); }

        await verifyWallet(addr, block);

        /* Rebuild with verified state after short delay */
        setTimeout(() => renderWalletBlock(container, addr), 2000);
      });
    };

    /* ── Main loader ── */
    const loadLegacy = async () => {
      if (loaded) return;
      loaded = true;
      show('[data-legacy-loading]');

      const u = tgUser();
      const chatId = u ? String(u.id) : null;

      if (!chatId) {
        show('[data-legacy-empty]');
        const wBlock = document.querySelector('[data-legacy-empty] [data-legacy-wallet-block]');
        if (wBlock) renderWalletBlock(wBlock, null);
        return;
      }

      try {
        const resp = await fetch(`/api/basic/legacy-profile?chatId=${encodeURIComponent(chatId)}`);
        const j = await resp.json();

        if (!j.status || !j.legacy || !j.legacy.isSeason1) {
          show('[data-legacy-empty]');
          const wBlock = document.querySelector('[data-legacy-empty] [data-legacy-wallet-block]');
          if (wBlock) renderWalletBlock(wBlock, j.legacy && j.legacy.walletAddress);
          return;
        }

        const lg = j.legacy;

        /* Proclamation — i18n with plural helpers */
        const procEl = document.querySelector('[data-legacy-proclamation]');
        if (procEl) {
          const name = (u.first_name || u.username || 'Warrior');
          procEl.textContent = T('legacy_proclamation', {
            name,
            invites:   lg.invites,
            invites_s: lg.invites !== 1 ? 's' : '',
            cards:     lg.cards,
            cards_s:   lg.cards !== 1 ? 's' : ''
          });
        }

        const set = (sel, val) => { const el = document.querySelector(sel); if (el) el.textContent = val; };
        set('[data-ls-invites]',  fmtNum(lg.invites));
        set('[data-ls-cards]',    fmtNum(lg.cards));
        set('[data-ls-earnings]', fmtNum(lg.earnings));
        set('[data-ls-clan]',     lg.clanName || '—');

        /* Apply i18n to stat labels */
        const labelMap = { '[data-legacy-warriors]': 'legacy_warriors', '[data-legacy-cards-lbl]': 'legacy_cards_lbl',
                           '[data-legacy-earnings-lbl]': 'legacy_earnings', '[data-legacy-clan-lbl]': 'legacy_clan' };
        Object.entries(labelMap).forEach(([s,k]) => { const el = document.querySelector(s); if (el) el.textContent = T(k); });

        show('[data-legacy-card]');

        const wBlock = document.querySelector('[data-legacy-card] [data-legacy-wallet-block]');
        if (wBlock) renderWalletBlock(wBlock, lg.walletAddress);

      } catch (_) {
        show('[data-legacy-empty]');
      }
    };

    tab.addEventListener('click', loadLegacy, { once: true });
  };

  /* ── Init ─────────────────────────────────────────────────────────────── */
  const init = () => {
    setDailyWisdom();
    applyInputPlaceholder();
    initTabs();
    populateWisdomTab();
    populateWordTab();
    populateTimelineTab();
    mountVoicePlaceholder();
    handlePrefill();
    initLegacyTab();
    if (window.RealAudio) window.RealAudio.sounds.hakimActivate();

    // Hakim appearance cinematic — only on first ever visit
    if (window.RealCinematic && !localStorage.getItem("real_hakim_first_appearance")) {
      window.RealCinematic.showHakimAppearance(() => showOpeningMessage());
    } else {
      showOpeningMessage();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
