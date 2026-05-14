/* ==========================================================================
   REAL Shahnameh — Season 2
   Hakim AI Companion — chat logic, mock responses, quick actions
   ========================================================================== */

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

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
          addHakimBubble(data.reply, data.source === "mock" ? "Hakim · Shahnameh" : null);
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

  /* ── Init ─────────────────────────────────────────────────────────────── */
  const init = () => {
    setDailyWisdom();
    applyInputPlaceholder();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
