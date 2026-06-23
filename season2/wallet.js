/* wallet.js — standalone TON Connect wallet page.
   Extracted out of hakim.js's "Legacy" tab so linking a wallet no longer
   requires visiting the AI-companion page. */
(() => {
  const T = (key, vars) => (window.RealI18N ? window.RealI18N.t(key, vars) : key);
  let _tc = null; // TonConnectUI singleton
  let _lastTcError = null; // last construction error, surfaced in UI for on-device debugging

  const tgUser = () =>
    window.Telegram && window.Telegram.WebApp &&
    window.Telegram.WebApp.initDataUnsafe &&
    window.Telegram.WebApp.initDataUnsafe.user;

  /* ── TON Connect singleton ── */
  const getTonConnect = () => {
    if (_tc) return _tc;
    try {
      let Cls = null;
      if (typeof window.TonConnectUI === 'function') {
        Cls = window.TonConnectUI;
      } else if (window.TONConnectUI) {
        if (typeof window.TONConnectUI === 'function') Cls = window.TONConnectUI;
        else if (typeof window.TONConnectUI.TonConnectUI === 'function') Cls = window.TONConnectUI.TonConnectUI;
      } else if (window.TON_CONNECT_UI && typeof window.TON_CONNECT_UI.TonConnectUI === 'function') {
        /* Current @tonconnect/ui UMD bundle exposes its global as TON_CONNECT_UI */
        Cls = window.TON_CONNECT_UI.TonConnectUI;
      }
      if (!Cls) { _lastTcError = 'SDK class not found on window'; console.error('[TON]', _lastTcError); return null; }
      _tc = new Cls({ manifestUrl: 'https://shahnameh.setaei.com/tonconnect-manifest.json' });
      return _tc;
    } catch (e) {
      _lastTcError = (e && (e.message || String(e))) || 'unknown construction error';
      console.error('[TON] getTonConnect construction error:', e);
      return null;
    }
  };

  /* ── After TON Connect: verify token balance on backend ── */
  const verifyWallet = async (addr, block) => {
    const statusEl = block.querySelector('[data-wallet-status]');
    const tierEl   = block.querySelector('[data-wallet-tier]');
    if (statusEl) statusEl.textContent = T('legacy_verifying');

    const u = tgUser();
    const chatId = u ? String(u.id) : null;
    const initData = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) || '';

    try {
      const body = { walletAddress: addr, ...(chatId ? { chatId } : {}), ...(initData ? { initData } : {}) };
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
      /* Already linked — show address + check balance + disconnect/switch controls */
      block.innerHTML = `
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;letter-spacing:.06em;text-transform:uppercase;">${T('legacy_wallet_addr')}</div>
        <div style="font-size:12px;color:var(--text);word-break:break-all;font-family:monospace;">${existingAddr.slice(0,14)}…${existingAddr.slice(-8)}</div>
        <div data-wallet-status style="margin-top:10px;font-size:13px;color:var(--text-muted);">${T('legacy_verifying')}</div>
        <div data-wallet-tier></div>
        <div style="display:flex; gap:8px; margin-top:14px;">
          <button data-wallet-switch style="flex:1; background:#0098EA; color:#fff; border:none; border-radius:10px; padding:10px 12px; font-weight:700; font-size:12px; cursor:pointer;">${T('wallet_switch')}</button>
          <button data-wallet-disconnect style="flex:1; background:transparent; color:var(--text-muted); border:1px solid rgba(255,255,255,.15); border-radius:10px; padding:10px 12px; font-weight:700; font-size:12px; cursor:pointer;">${T('wallet_disconnect')}</button>
        </div>
      `;
      container.appendChild(block);
      verifyWallet(existingAddr, block);

      const disconnect = async () => {
        /* Always call disconnect() unconditionally — `tc.connected` can
           still read false right after construction because TonConnectUI
           restores its session asynchronously. Trusting that flag here
           skipped the SDK disconnect, leaving the old session alive and
           silently blocking the next connect/switch attempt. */
        try {
          const tc = getTonConnect();
          if (tc) { try { await tc.connectionRestored; } catch (_) {} await tc.disconnect(); }
        } catch (_) {}
        try { localStorage.removeItem('real_ton_wallet'); } catch {}

        const u = tgUser();
        if (u) {
          try {
            const initData = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) || '';
            await fetch('/api/basic/wallet-unlink', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chatId: String(u.id), ...(initData ? { initData } : {}) })
            });
          } catch (_) {}
        }
      };

      const switchBtn = block.querySelector('[data-wallet-switch]');
      if (switchBtn) switchBtn.addEventListener('click', async () => {
        switchBtn.disabled = true;
        await disconnect();
        renderWalletBlock(container, null);
      });

      const disconnectBtn = block.querySelector('[data-wallet-disconnect]');
      if (disconnectBtn) disconnectBtn.addEventListener('click', async () => {
        if (!confirm(T('wallet_disconnect_confirm'))) return;
        disconnectBtn.disabled = true;
        await disconnect();
        renderWalletBlock(container, null);
      });
      return;
    }

    const TON_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 56 56" fill="none"><path d="M37.56 15.63H18.44c-3.46 0-5.64 3.68-3.91 6.67L26.28 42.5 28 45.5l1.72-3 11.75-20.2c1.74-2.99-.44-6.67-3.91-6.67ZM26.26 38.79l-3.05-5.17-6.26-10.8c-.57-.99.14-2.24 1.5-2.24h7.81v18.21Zm12.79-15.97-6.26 10.8-3.05 5.17V20.58h7.82c1.36 0 2.06 1.25 1.49 2.24Z" fill="white"/></svg>`;

    /* No wallet yet — show TON Connect button */
    block.innerHTML = `
      <div style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">${T('legacy_wallet_sub')}</div>
      <div id="ton-connect-btn">
        <button id="ton-connect-open-btn" style="background:#0098EA;color:#fff;border:none;border-radius:12px;padding:12px 20px;font-weight:700;font-size:14px;cursor:pointer;width:100%;letter-spacing:.04em;display:flex;align-items:center;justify-content:center;gap:10px;">${TON_ICON}${T('legacy_connect_btn')}</button>
      </div>
      <div data-wallet-status style="margin-top:10px;font-size:13px;color:var(--text-muted);display:none;"></div>
      <div data-wallet-tier></div>
    `;
    container.appendChild(block);

    /* Retry SDK init — CDN may not be ready when the page first renders */
    let statusListenerAdded = false;
    const tryInit = (attemptsLeft) => {
      const tc = getTonConnect();
      if (!tc) {
        if (attemptsLeft > 0) { setTimeout(() => tryInit(attemptsLeft - 1), 400); return; }
        /* SDK truly unavailable */
        const btn = block.querySelector('#ton-connect-open-btn');
        if (btn) {
          const inTelegram = !!(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData);
          /* If inside Telegram, the SDK should load — offer a manual retry instead of "open the bot" */
          btn.textContent = inTelegram ? T('legacy_sdk_reload') : T('legacy_veteran_unavail');
          if (inTelegram) {
            btn.style.background = '#0098EA';
            btn.style.color = '#fff';
            btn.disabled = false;
            btn.onclick = () => { btn.disabled = true; tryInit(8); };
          } else {
            btn.style.cssText = 'background:transparent;color:var(--text-muted);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px 16px;font-size:12px;font-weight:400;width:100%;text-align:center;cursor:default;display:block;';
            btn.disabled = true;
          }
        }
        /* Debug aid: surface the actual SDK error on-screen since most
           testers are inside the Telegram WebView and can't open devtools. */
        if (_lastTcError) {
          const dbg = document.createElement('div');
          dbg.style.cssText = 'margin-top:8px;font-size:11px;color:#e06060;word-break:break-all;';
          dbg.textContent = 'Debug: ' + _lastTcError;
          block.appendChild(dbg);
        }
        return;
      }

      /* Wire up click → openModal */
      const openBtn = block.querySelector('#ton-connect-open-btn');
      if (openBtn) {
        openBtn.addEventListener('click', () => {
          try { tc.openModal(); }
          catch (e) { console.error('[TON] openModal error:', e); }
        });
      }

      /* Watch for connection */
      if (!statusListenerAdded) {
        statusListenerAdded = true;
        tc.onStatusChange(async (wallet) => {
          if (!wallet) return;
          const addr = wallet.account && wallet.account.address;
          if (!addr) return;
          /* Persist so other pages (e.g. ch50 finale gate) know wallet is linked */
          try { localStorage.setItem('real_ton_wallet', addr); } catch {}
          const statusEl = block.querySelector('[data-wallet-status]');
          if (statusEl) { statusEl.style.display = ''; statusEl.textContent = T('legacy_connected'); }
          await verifyWallet(addr, block);
          setTimeout(() => renderWalletBlock(container, addr), 2000);
        });
      }
    };

    tryInit(8); // up to 8 × 400 ms = 3.2 s before giving up
  };

  /* ── Init ─────────────────────────────────────────────────────────────── */
  const init = async () => {
    const container = document.querySelector('[data-wallet-block]');
    if (!container) return;

    let existingAddr = null;
    try { existingAddr = localStorage.getItem('real_ton_wallet'); } catch {}

    /* Prefer the server record (covers Season 1 veterans whose wallet was
       linked before this device's localStorage existed). */
    const u = tgUser();
    if (!existingAddr && u) {
      try {
        const initData = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) || '';
        const profileUrl = `/api/basic/legacy-profile?chatId=${encodeURIComponent(String(u.id))}`
          + (initData ? `&initData=${encodeURIComponent(initData)}` : '');
        const resp = await fetch(profileUrl);
        const j = await resp.json();
        if (j.status && j.legacy && j.legacy.walletAddress) existingAddr = j.legacy.walletAddress;
      } catch (_) {}
    }

    renderWalletBlock(container, existingAddr);
  };

  document.addEventListener('DOMContentLoaded', init);
})();
