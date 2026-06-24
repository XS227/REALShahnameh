/* ==========================================================================
   REAL Shahnameh — Learn page renderer
   Hydrates the 50-level chronicle from /api/catalog/chapters and falls back
   to the bundled JSON. Content is content-gated: only chapters with
   status="available" or status="completed" render full detail. Everything
   else renders as a "Coming soon" placeholder — no rewards, no story,
   no quiz teasers — until the content is actually authored.

   §7.9 (Dr. Dadashi): Chapter N is also quiz-gated — players must pass all
   three quiz tiers (easy + medium + hard) of chapter N-1 before chapter N
   becomes accessible, even if its content is ready. Backward-compat: chapters
   already marked done by the player are never retroactively re-locked.
   ========================================================================== */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const host = $("[data-chapter-map]");
  if (!host) return;

  const t = (k, v) => (window.RealI18N && window.RealI18N.t(k, v)) || k;
  const fmtNum = (n) => (window.RealI18N && window.RealI18N.formatNumber) ? window.RealI18N.formatNumber(n) : String(n);
  const locF = (obj, field) => (window.RealI18N && window.RealI18N.locField)
    ? window.RealI18N.locField(obj, field) : (obj && obj[field] != null ? obj[field] : "");

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (m) => (
    { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[m]
  ));

  const isReady = (c) => c && (c.status === "available" || c.status === "completed");

  /* World-history milestones shown between chapter cards (keyed by the slug
     of the chapter they appear AFTER in the narrative sequence). */
  const MILESTONES = {
    'alexander': {
      year: '~323 BC',
      label:    'Death of Alexander the Great — his empire fractures',
      label_fa: 'مرگ اسکندر کبیر — امپراتوری او تکه‌تکه می‌شود',
      label_tg: 'Марги Искандари Кабир — Империяи ӯ пора мешавад',
      label_ru: 'Смерть Александра Великого — его империя распадается',
      icon: '⚔',
    },
    'ashkanian-age': {
      year: '~4 BC',
      label:    'Birth of Jesus Christ — during the Arsacid reign',
      label_fa: 'تولد حضرت عیسی مسیح — در دوران حکومت اشکانیان',
      label_tg: 'Таваллуди Исо Масеҳ — дар замони ҳукмронии Аршакиён',
      label_ru: 'Рождение Иисуса Христа — во времена правления Аршакидов',
      icon: '✦',
    },
    'anushirvan': {
      year: '~570 CE',
      label:    'Birth of Prophet Muhammad — during the reign of Anushirvan',
      label_fa: 'تولد پیامبر اسلام محمد (ص) — در دوران سلطنت انوشیروان',
      label_tg: 'Таваллуди Паёмбари Ислом Муҳаммад (с) — дар замони салтанати Анӯшервон',
      label_ru: 'Рождение пророка Мухаммада — во времена правления Ануширвана',
      icon: '✦',
    },
    'hormuz': {
      year: '~610 CE',
      label:    'First revelation of the Quran — rise of Islam',
      label_fa: 'اولین وحی قرآن — آغاز اسلام',
      label_tg: 'Аввалин ваҳйи Қуръон — оғози Ислом',
      label_ru: 'Первое откровение Корана — зарождение ислама',
      icon: '✦',
    },
    'shirin': {
      year: '~632 CE',
      label:    'Death of Prophet Muhammad — the Islamic Caliphate expands',
      label_fa: 'رحلت پیامبر محمد (ص) — خلافت اسلامی گسترش می‌یابد',
      label_tg: 'Вафоти Паёмбар Муҳаммад (с) — Хилофати Исломӣ густариш меёбад',
      label_ru: 'Смерть пророка Мухаммада — расширение Исламского халифата',
      icon: '✦',
    },
    'arab-conquest': {
      year: '~651 CE',
      label:    'End of the Sasanian Empire — Iran enters a new age',
      label_fa: 'پایان امپراتوری ساسانی — ایران به عصر جدیدی پا می‌گذارد',
      label_tg: 'Охири Империяи Сосонӣ — Эрон ба асри нав қадам мегузорад',
      label_ru: 'Конец империи Сасанидов — Иран вступает в новую эпоху',
      icon: '✦',
    },
  };

  const renderMilestone = (m) => {
    const lang = window.RealI18N && window.RealI18N.getLang ? window.RealI18N.getLang() : 'en';
    const label = (lang === 'fa' && m.label_fa) ? m.label_fa
                : (lang === 'tg' && m.label_tg) ? m.label_tg
                : (lang === 'ru' && m.label_ru) ? m.label_ru
                : m.label;
    return `
      <div class="tm-marker" aria-hidden="true">
        <span class="tm-dot">${esc(m.icon)}</span>
        <div>
          <span class="tm-year">${esc(m.year)}</span>
          <span class="tm-label">${esc(label)}</span>
        </div>
      </div>`;
  };

  /* §7.9 — true if all three quiz tiers for this chapter slug are passed.
     A chapter already marked done by the player counts as quiz-cleared
     (backward-compat: old completions predating the quiz gate). */
  const allQuizPassed = (slug) => {
    try {
      if (localStorage.getItem(`real_chapter_done_${slug}`) === "1") return true;
      return (
        localStorage.getItem(`real_quiz_${slug}_easy`)   === "passed" &&
        localStorage.getItem(`real_quiz_${slug}_medium`) === "passed" &&
        localStorage.getItem(`real_quiz_${slug}_hard`)   === "passed"
      );
    } catch { return false; }
  };

  const render = (chapters, totalChapters) => {
    if (!Array.isArray(chapters) || chapters.length === 0) {
      host.innerHTML = `<div style="padding:14px; color:var(--muted, #6c7287); font-size:12px;">${t("learn_no_chapters")}</div>`;
      return;
    }

    const total = totalChapters || chapters.length;
    const doneCount = chapters.filter((c) =>
      (typeof localStorage !== "undefined") &&
      localStorage.getItem("real_chapter_done_" + c.slug) === "1"
    ).length;
    const pct = Math.round((doneCount / total) * 100);
    const doneEl = $("[data-chapters-done]");
    const pctEl  = $("[data-chapters-pct]");
    const fillEl = $("[data-chapters-fill]");
    if (doneEl) doneEl.textContent = t("learn_stories_done_tpl", { done: fmtNum(doneCount), total: fmtNum(total) });
    if (pctEl)  pctEl.textContent  = ((window.RealI18N && window.RealI18N.compactNumber) ? window.RealI18N.compactNumber(pct) : fmtNum(pct)) + "%";
    if (fillEl) fillEl.style.width = `${Math.max(2, pct)}%`;

    /* ── Finale gate helpers ── */
    const finaleReqs = () => {
      try {
        const hasClan    = localStorage.getItem('real_has_clan') === '1';
        const hasWallet  = !!localStorage.getItem('real_ton_wallet');
        const offs       = JSON.parse(localStorage.getItem('real_offerings_v1') || '{}');
        const totalOffs  = (offs.zar_count || 0) + (offs.fire_count || 0) + (offs.lore_count || 0);
        return { hasClan, hasWallet, totalOffs, allMet: hasClan && hasWallet && totalOffs >= 3 };
      } catch { return { hasClan: false, hasWallet: false, totalOffs: 0, allMet: false }; }
    };
    const finaleGateCard = (level, c) => {
      const { hasClan, hasWallet, totalOffs } = finaleReqs();
      const row = (met, label, link, linkLabel) => `
        <div style="display:flex;align-items:center;gap:8px;font-size:12px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.06);">
          <span style="font-size:16px;line-height:1;">${met ? '✅' : '🔒'}</span>
          <span style="flex:1;color:${met ? 'rgba(200,210,230,.9)' : 'var(--muted)'};">${esc(label)}</span>
          ${!met && link ? `<a href="${esc(link)}" style="font-size:11px;color:#5ea2ff;text-decoration:none;white-space:nowrap;">${esc(linkLabel)} →</a>` : ''}
        </div>`;
      return `
        <article class="card chapter locked" data-chapter="${esc(fmtNum(level))}" data-slug="${esc(c.slug)}"
          style="border-color:rgba(244,197,107,.35);background:linear-gradient(145deg,rgba(12,15,32,.98),rgba(10,8,20,.98));">
          <span class="node" style="background:linear-gradient(135deg,#c8922a,#f4c56b);color:#0a0813;">50</span>
          <h4 style="color:#f4c56b;">${esc(locF(c, 'title'))}</h4>
          <p style="font-size:11px;color:var(--muted);margin:4px 0 10px;">${t('finale_gate_sub','Complete all three rites to enter the Final Age')}</p>
          <div style="margin-bottom:10px;">
            ${row(hasClan,   t('finale_gate_clan','Join or create a Clan'),              'guild.html',  t('airdrop_link_guild','Guild'))}
            ${row(hasWallet, t('finale_gate_wallet','Link your TON wallet for the airdrop'),'wallet.html', t('airdrop_link_wallet','Link wallet'))}
            ${row(totalOffs >= 3, t('finale_gate_offerings', { count: totalOffs }), 'offerings.html', t('airdrop_link_offerings','Offerings'))}
          </div>
          <div class="meta">
            <span class="chip" style="background:rgba(244,197,107,.15);color:#f4c56b;border-color:rgba(244,197,107,.3);">⚔ Finale</span>
          </div>
        </article>`;
    };

    host.innerHTML = chapters.map((c, idx) => {
      const level = c.level || c.order || c.id;
      const localDone = (typeof localStorage !== "undefined") &&
                        localStorage.getItem(`real_chapter_done_${c.slug}`) === "1";
      const contentReady = isReady(c) || localDone;

      /* §7.9 sequential gate: previous chapter's quizzes must all be passed.
         Gate is skipped for: the very first chapter, chapters the player already
         finished, and chapters whose previous chapter has no ready content yet. */
      const prevChapter = idx > 0 ? chapters[idx - 1] : null;
      const prevContentReady = prevChapter && isReady(prevChapter);
      const quizGated = contentReady && !localDone && prevContentReady && !allQuizPassed(prevChapter.slug);

      const ready = contentReady && !quizGated;
      const done  = c.status === "completed" || localDone;
      const cls   = done ? "done" : ready ? "active" : "locked";
      const href  = ready ? `chapter.html?slug=${encodeURIComponent(c.slug)}` : null;

      const _ms = MILESTONES[c.slug] ? renderMilestone(MILESTONES[c.slug]) : '';

      /* ── Finale gate for ch50 (ages-end) ── */
      if (c.slug === 'ages-end' && !localDone) {
        if (!ready) return finaleGateCard(level, c) + _ms;    // ch49 not done yet
        const { allMet } = finaleReqs();
        if (!allMet) return finaleGateCard(level, c) + _ms;   // rites not completed
      }

      if (!ready) {
        const isQuizGate = quizGated;
        return `
          <article class="card chapter locked" data-chapter="${esc(level)}" data-slug="${esc(c.slug)}">
            <span class="node">${esc(fmtNum(level))}</span>
            <h4>${esc(t("learn_level_tpl", { level, title: locF(c, "title") }))}</h4>
            <div class="meta">
              <span class="chip">${isQuizGate ? esc(t("quiz_gate_chip")) : esc(t("coming_soon"))}</span>
              <span class="reward" style="color:var(--muted);">${isQuizGate ? esc(t("quiz_gate_msg")) : esc(t("unlocks_when_ready"))}</span>
            </div>
          </article>${_ms}`;
      }

      const rewardLine = c.rewards ? `
        <span class="reward">
          ${c.rewards.xp ? `<i class="s2-icon xp"></i> ${esc(fmtNum(c.rewards.xp))} ${t("r_xp")}` : ""}
          ${c.rewards.real ? ` · <i class="real-coin"></i> ${esc(fmtNum(c.rewards.real))} ${t("currency_name","REAL")}` : ""}
        </span>` : "";

      const inner = `
        <span class="node">${done ? "✓" : esc(fmtNum(level))}</span>
        <h4>${esc(t("learn_level_tpl", { level, title: locF(c, "title") }))}</h4>
        ${locF(c, "summary") ? `<p class="copy">${esc(locF(c, "summary"))}</p>` : ""}
        <div class="meta">
          <span class="chip ${done ? "lush" : "warm"}">${done ? t("chapter_completed") : t("open_level")}</span>
          ${rewardLine}
        </div>`;

      const card = href
        ? `<a class="card chapter ${cls}" data-chapter="${esc(level)}" data-slug="${esc(c.slug)}" href="${esc(href)}" style="text-decoration:none; color:inherit; display:block;">${inner}</a>`
        : `<article class="card chapter ${cls}" data-chapter="${esc(level)}" data-slug="${esc(c.slug)}">${inner}</article>`;
      return card + _ms;
    }).join("");
  };

  const tryFetch = (url) => fetch(url, { cache: "no-store" }).then((r) => r.ok ? r.json() : null).catch(() => null);

  let _lastPayload = null;

  (async () => {
    let payload = await tryFetch("/api/catalog/chapters");
    if (!payload) payload = await tryFetch("/season2/data/chapters.json");
    if (!payload) payload = await tryFetch("data/chapters.json");
    if (!payload) {
      host.innerHTML = `<div style="padding:14px; color:var(--muted, #6c7287); font-size:12px;">${t("learn_no_content")}</div>`;
      return;
    }
    _lastPayload = payload;
    render(payload.chapters || [], payload.totalChapters || 50);
  })();

  /* Re-render once sync.js merges server chapter progress into localStorage,
     so done-checkmarks survive a cleared Telegram WebView storage. */
  window.addEventListener("real:chapters:synced", () => {
    if (_lastPayload) render(_lastPayload.chapters || [], _lastPayload.totalChapters || 50);
  });
})();
