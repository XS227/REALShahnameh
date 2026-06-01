/* ==========================================================================
   REAL Shahnameh — Market page init (market-page.js)
   Fills portfolio stats, wires DEX links, Tonviewer, contract copy.
   tap.js handles the swap panel; market.js handles the price widget.
   ========================================================================== */
(() => {
  'use strict';

  const REAL_CONTRACT = 'EQDhq_DjQUMJqfXLP8K8J6SlOvon08XQQK0T49xon2e0xU8p';

  const DEX_URLS = {
    stonfi:    `https://app.ston.fi/swap?ft=TON&tt=${REAL_CONTRACT}`,
    dedust:    `https://dedust.io/swap/TON/${REAL_CONTRACT}`,
    tonkeeper: `https://app.tonkeeper.com/transfer/${REAL_CONTRACT}`,
  };

  const fmtN = (n) => (window.RealI18N && window.RealI18N.compactNumber)
    ? window.RealI18N.compactNumber(n) : String(Number(n) || 0);

  const showToast = (msg) => {
    const el = document.querySelector('[data-toast]');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove('show'), 2200);
  };

  const openLink = (url) => {
    if (window.Telegram?.WebApp?.openLink) window.Telegram.WebApp.openLink(url);
    else window.open(url, '_blank');
  };

  /* ── Portfolio ──────────────────────────────────────────────────────── */

  const fillPortfolio = () => {
    let ps = {};
    try { ps = JSON.parse(localStorage.getItem('real_player_state_v1') || '{}'); } catch {}

    const balance = ps.balance || 0;
    const earned  = ps.real_earned_this_season || ps.max_real_balance || balance;
    const peak    = ps.max_real_balance || balance;
    const zar     = ps.zar || 0;

    const set = (sel, val) => {
      const el = document.querySelector(sel);
      if (el) el.textContent = fmtN(val);
    };

    set('[data-portfolio-balance]', balance);
    set('[data-portfolio-earned]',  earned);
    set('[data-portfolio-max]',     peak);
    set('[data-portfolio-zar]',     zar);

    /* Refresh when sync fires */
    window.addEventListener('shahnama:state_sync', fillPortfolio, { once: true });
  };

  /* ── DEX links ──────────────────────────────────────────────────────── */

  const wireDexLinks = () => {
    document.querySelectorAll('[data-dex-link]').forEach(el => {
      const key = el.dataset.dexLink;
      const url = DEX_URLS[key];
      if (url) {
        el.href = url;
        el.addEventListener('click', (e) => {
          e.preventDefault();
          openLink(url);
        });
      }
    });
  };

  /* ── Tonviewer link ─────────────────────────────────────────────────── */

  const wireTonviewer = () => {
    const el = document.querySelector('[data-tonviewer-link]');
    if (!el) return;
    const url = `https://tonviewer.com/${REAL_CONTRACT}`;
    el.href = url;
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openLink(url);
    });
  };

  /* ── Contract copy ──────────────────────────────────────────────────── */

  const wireContractCopy = () => {
    const btn  = document.querySelector('[data-copy-contract]');
    const addr = document.querySelector('[data-contract-addr]');
    if (!btn || !addr) return;
    btn.addEventListener('click', async () => {
      const full = addr.dataset.full || REAL_CONTRACT;
      try {
        await navigator.clipboard.writeText(full);
        showToast('Contract address copied!');
      } catch {
        showToast(full.slice(0, 12) + '…' + full.slice(-6));
      }
    });
  };

  /* ── DYOR link ─────────────────────────────────────────────────────── */

  const wireDyor = () => {
    const el = document.querySelector('[data-dyor-link]');
    if (!el) return;
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openLink('https://dyor.io/dapps/games/shahnameh');
    });
  };

  /* ── Init ────────────────────────────────────────────────────────────── */

  /* ── Mirror card status dot to header ─────────────────────────────── */

  const mirrorStatus = () => {
    const hdr  = document.getElementById('mkt-hdr-status');
    if (!hdr) return;
    const card = document.querySelector('[data-market-card]');
    if (!card) return;
    const observer = new MutationObserver(() => {
      const dot = card.querySelector('[data-market-status]');
      if (dot) hdr.textContent = dot.textContent;
    });
    observer.observe(card, { subtree: true, childList: true, characterData: true });
  };

  const init = () => {
    fillPortfolio();
    wireDexLinks();
    wireTonviewer();
    wireContractCopy();
    wireDyor();
    mirrorStatus();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
