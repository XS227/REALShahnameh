/* ==========================================================================
   REAL Shahnameh — Live REAL Market service stub
   --------------------------------------------------------------------------
   This is a clean placeholder ready to be wired to a TON market data source
   (DEX aggregator, on-chain pool, TonAPI, or a backend cache).
   It NEVER fabricates a price; if the data source is unavailable the UI
   stays in its "connecting" state.

   To wire it up later:
     1. Set window.RealMarket.endpoint to a JSON URL that returns
        { priceUsd, change24hPct, liquidityUsd, points: [[ts, price], ...] }.
     2. Or replace fetchMarket() with a custom function that returns the same
        shape.
     3. The UI re-polls every 60s.
   ========================================================================== */
(() => {
  "use strict";

  const card = document.querySelector("[data-market-card]");
  if (!card) return;

  const statusEl    = card.querySelector("[data-market-status]");
  const priceEl     = card.querySelector("[data-market-price]");
  const changeEl    = card.querySelector("[data-market-change]");
  const liquidityEl = card.querySelector("[data-market-liquidity]");
  const chartEl     = card.querySelector("[data-market-chart]");
  const noteEl      = card.querySelector("[data-market-note]");

  const setStatus = (state, msg) => {
    card.dataset.state = state;
    if (statusEl) statusEl.textContent = state === "live" ? "● live" : state === "stale" ? "● stale" : "● connecting";
    if (noteEl)   noteEl.textContent   = msg || (
      state === "live" ? "TON market data · refreshes every 60s" :
      state === "stale" ? "Last known data shown. Reconnecting…" :
      "Connecting to TON market data…"
    );
  };

  const fmtUsd = (n) => {
    if (n == null || !isFinite(n)) return "—";
    if (n < 0.01)   return "$" + n.toFixed(6);
    if (n < 1)      return "$" + n.toFixed(4);
    return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };
  const fmtPct = (p) => {
    if (p == null || !isFinite(p)) return "—";
    const s = (p >= 0 ? "+" : "") + p.toFixed(2) + "%";
    return s;
  };
  const fmtLiq = (n) => {
    if (n == null || !isFinite(n)) return "—";
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
    if (n >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K";
    return "$" + Math.round(n);
  };

  const renderSparkline = (points) => {
    if (!chartEl) return;
    if (!Array.isArray(points) || points.length < 2) {
      chartEl.innerHTML = '<div class="chart-skeleton"></div>';
      return;
    }
    const ys = points.map((p) => Number(p[1])).filter((y) => isFinite(y));
    if (ys.length < 2) return;
    const lo = Math.min(...ys), hi = Math.max(...ys);
    const span = (hi - lo) || 1;
    const W = 100, H = 38;
    const d = points.map((p, i) => {
      const x = (i / (points.length - 1)) * W;
      const y = H - ((Number(p[1]) - lo) / span) * H;
      return (i === 0 ? "M" : "L") + x.toFixed(2) + "," + y.toFixed(2);
    }).join(" ");
    const up = ys[ys.length - 1] >= ys[0];
    const stroke = up ? "#53d79c" : "#ff5267";
    chartEl.innerHTML =
      `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
         <path d="${d}" fill="none" stroke="${stroke}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>
       </svg>`;
  };

  const render = (data) => {
    if (priceEl)     priceEl.textContent     = fmtUsd(data.priceUsd);
    if (changeEl) {
      changeEl.textContent = fmtPct(data.change24hPct);
      changeEl.dataset.dir = data.change24hPct >= 0 ? "up" : "down";
    }
    if (liquidityEl) liquidityEl.textContent = fmtLiq(data.liquidityUsd);
    renderSparkline(data.points);
  };

  /* Replace with a real fetch when the data source exists.
     The contract this function must satisfy:
       resolves with { priceUsd, change24hPct, liquidityUsd, points }
       or rejects to signal the UI should remain in "connecting/stale" mode. */
  const fetchMarket = async () => {
    const endpoint = (window.RealMarket && window.RealMarket.endpoint) || null;
    if (!endpoint) {
      // No live endpoint configured yet — surface honestly.
      throw new Error("REAL market endpoint not configured");
    }
    const r = await fetch(endpoint, { cache: "no-store" });
    if (!r.ok) throw new Error("Market HTTP " + r.status);
    const j = await r.json();
    return {
      priceUsd:      Number(j.priceUsd),
      change24hPct:  Number(j.change24hPct),
      liquidityUsd:  Number(j.liquidityUsd),
      points:        Array.isArray(j.points) ? j.points : []
    };
  };

  let lastGood = null;
  const tick = async () => {
    try {
      const data = await fetchMarket();
      lastGood = data;
      render(data);
      setStatus("live");
    } catch (err) {
      if (lastGood) {
        render(lastGood);
        setStatus("stale", "Last known data shown. Reconnecting…");
      } else {
        setStatus("connecting");
      }
    }
  };

  window.RealMarket = window.RealMarket || {};
  window.RealMarket.refresh = tick;

  setStatus("connecting");
  tick();
  setInterval(tick, 60000);
})();
