/* ==========================================================================
   REAL Shahnameh — Ambient Audio System
   Web Audio API procedural ambient generation.
   OFF by default. Starts only after user interaction (browser policy).
   ========================================================================== */

(() => {
  "use strict";

  const PREF_KEY = "real_audio_enabled";

  const PAGE_AMBIENTS = {
    "index.html":           "main",
    "learn.html":           "library",
    "chapter.html":         "library",
    "timeline.html":        "ancient",
    "regions.html":         "wind",
    "historical-sites.html":"stones",
    "hakim.html":           "hakim",
    "tap.html":             "forge",
    "heroes.html":          "library",
    "persia-map.html":      "wind",
    "social.html":          "main",
    "earn.html":            "main",
  };

  const page = window.location.pathname.split("/").pop() || "index.html";
  const ambientType = PAGE_AMBIENTS[page] || "main";

  let ctx = null;
  let masterGain = null;
  let currentNodes = [];
  let isPlaying = false;
  let isEnabled = localStorage.getItem(PREF_KEY) === "true";

  const getCtx = () => {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.connect(ctx.destination);
    }
    return ctx;
  };

  /* ── Primitive generators ────────────────────────────────────── */

  const mkDrone = (freq, detune, vol) => {
    const c = getCtx();
    const osc = c.createOscillator();
    const filter = c.createBiquadFilter();
    const gain = c.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    osc.detune.value = detune || 0;
    filter.type = "lowpass";
    filter.frequency.value = 380;
    filter.Q.value = 1.1;
    gain.gain.value = vol || 0.04;
    osc.connect(filter); filter.connect(gain); gain.connect(masterGain);
    osc.start();
    return { osc, gain, filter };
  };

  const mkBreath = (vol) => {
    const c = getCtx();
    const sr = c.sampleRate;
    const buf = c.createBuffer(1, sr * 3, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.35;
    const src = c.createBufferSource();
    src.buffer = buf; src.loop = true;
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 300; filter.Q.value = 0.4;
    const gain = c.createGain(); gain.gain.value = vol || 0.025;
    src.connect(filter); filter.connect(gain); gain.connect(masterGain);
    src.start();
    return { src, gain, filter };
  };

  const mkHum = (freq, modRate, vol) => {
    const c = getCtx();
    const osc = c.createOscillator();
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    const gain = c.createGain();
    const filter = c.createBiquadFilter();
    osc.type = "sine"; osc.frequency.value = freq;
    lfo.type = "sine"; lfo.frequency.value = modRate || 0.2;
    lfoGain.gain.value = freq * 0.04;
    lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
    filter.type = "lowpass"; filter.frequency.value = 600;
    gain.gain.value = vol || 0.035;
    osc.connect(filter); filter.connect(gain); gain.connect(masterGain);
    osc.start(); lfo.start();
    return { osc, lfo, lfoGain, gain, filter };
  };

  /* ── Ambient profiles ────────────────────────────────────────── */
  const AMBIENTS = {
    main:    () => [mkDrone(55, 0, 0.05), mkDrone(110, -8, 0.03), mkBreath(0.022), mkHum(165, 0.25, 0.018)],
    library: () => [mkDrone(41.2, 0, 0.045), mkDrone(82.4, -5, 0.025), mkBreath(0.018), mkHum(82, 0.18, 0.015)],
    ancient: () => [mkDrone(36.7, 0, 0.055), mkDrone(73.4, 6, 0.028), mkBreath(0.02), mkHum(55, 0.15, 0.02)],
    wind:    () => [mkBreath(0.045), mkDrone(65, 0, 0.03), mkDrone(130, -12, 0.015), mkHum(98, 0.3, 0.018)],
    stones:  () => [mkDrone(32.7, 0, 0.06), mkDrone(49, 3, 0.03), mkBreath(0.038), mkHum(65, 0.12, 0.022)],
    hakim:   () => [mkDrone(55, 0, 0.04), mkDrone(82.5, -3, 0.025), mkBreath(0.015), mkHum(110, 0.22, 0.02)],
    forge:   () => [mkDrone(55, 0, 0.05), mkBreath(0.04), mkHum(65, 0.5, 0.025)],
  };

  /* ── Fade master in/out ──────────────────────────────────────── */
  const fadeIn  = (t) => { if (masterGain && ctx) masterGain.gain.setTargetAtTime(0.15, ctx.currentTime, (t || 2) / 3); };
  const fadeOut = (t) => { if (masterGain && ctx) masterGain.gain.setTargetAtTime(0, ctx.currentTime, (t || 1.5) / 3); };

  /* ── Start / stop ────────────────────────────────────────────── */
  const startAmbient = () => {
    if (isPlaying) return;
    const fn = AMBIENTS[ambientType] || AMBIENTS.main;
    try { currentNodes = fn(); isPlaying = true; if (isEnabled) fadeIn(2.5); } catch {}
  };

  const stopAmbient = () => {
    fadeOut(1.5);
    setTimeout(() => {
      currentNodes.forEach(n => {
        try { if (n.osc) n.osc.stop(); } catch {}
        try { if (n.src) n.src.stop(); } catch {}
        try { if (n.lfo) n.lfo.stop(); } catch {}
      });
      currentNodes = []; isPlaying = false;
    }, 2000);
  };

  /* ── Enable / disable ────────────────────────────────────────── */
  const enable = () => {
    isEnabled = true;
    try { localStorage.setItem(PREF_KEY, "true"); } catch {}
    getCtx();
    if (!isPlaying) startAmbient(); else fadeIn(0.8);
    _updateUI();
  };

  const disable = () => {
    isEnabled = false;
    try { localStorage.setItem(PREF_KEY, "false"); } catch {}
    fadeOut(0.8);
    _updateUI();
  };

  const toggle = () => { isEnabled ? disable() : enable(); };

  /* ── Micro sound effects ─────────────────────────────────────── */
  const sounds = {
    click() {
      if (!isEnabled) return;
      try {
        const c = getCtx();
        const osc = c.createOscillator(); const gain = c.createGain();
        osc.frequency.value = 820; osc.type = "sine";
        gain.gain.setValueAtTime(0.07, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
        osc.connect(gain); gain.connect(c.destination);
        osc.start(); osc.stop(c.currentTime + 0.1);
      } catch {}
    },
    pageTurn() {
      if (!isEnabled) return;
      try {
        const c = getCtx();
        const buf = c.createBuffer(1, Math.floor(c.sampleRate * 0.15), c.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) * 0.28;
        const src = c.createBufferSource(); src.buffer = buf;
        const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 2000; f.Q.value = 0.7;
        const g = c.createGain(); g.gain.value = 0.1;
        src.connect(f); f.connect(g); g.connect(c.destination); src.start();
      } catch {}
    },
    loreUnlock() {
      if (!isEnabled) return;
      try {
        const c = getCtx();
        [440, 550, 660, 880].forEach((freq, i) => {
          const osc = c.createOscillator(); const gain = c.createGain();
          osc.frequency.value = freq; osc.type = "sine";
          const t = c.currentTime + i * 0.09;
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.055, t + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
          osc.connect(gain); gain.connect(c.destination);
          osc.start(t); osc.stop(t + 0.45);
        });
      } catch {}
    },
    chapterReveal() {
      if (!isEnabled) return;
      try {
        const c = getCtx();
        const osc = c.createOscillator(); const filter = c.createBiquadFilter(); const gain = c.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(38, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(76, c.currentTime + 1.8);
        filter.type = "lowpass"; filter.frequency.value = 180;
        gain.gain.setValueAtTime(0, c.currentTime);
        gain.gain.linearRampToValueAtTime(0.14, c.currentTime + 0.35);
        gain.gain.setValueAtTime(0.14, c.currentTime + 1.3);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 2.2);
        osc.connect(filter); filter.connect(gain); gain.connect(c.destination);
        osc.start(); osc.stop(c.currentTime + 2.2);
      } catch {}
    },
    hakimActivate() {
      if (!isEnabled) return;
      try {
        const c = getCtx();
        [220, 330, 440].forEach((freq, i) => {
          const osc = c.createOscillator(); const gain = c.createGain();
          osc.frequency.value = freq; osc.type = "sine";
          const t = c.currentTime + i * 0.09;
          gain.gain.setValueAtTime(0.045, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
          osc.connect(gain); gain.connect(c.destination);
          osc.start(t); osc.stop(t + 0.65);
        });
      } catch {}
    },
    mapSelect() {
      if (!isEnabled) return;
      try {
        const c = getCtx();
        const osc = c.createOscillator(); const gain = c.createGain();
        osc.frequency.value = 660; osc.type = "sine";
        gain.gain.setValueAtTime(0.05, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.22);
        osc.connect(gain); gain.connect(c.destination);
        osc.start(); osc.stop(c.currentTime + 0.22);
      } catch {}
    },
  };

  /* ── UI sync ─────────────────────────────────────────────────── */
  const _updateUI = () => {
    document.querySelectorAll("[data-audio-toggle]").forEach(btn => {
      btn.classList.toggle("active", isEnabled);
      btn.setAttribute("aria-pressed", String(isEnabled));
      const icon = btn.querySelector("[data-audio-icon]");
      if (icon) icon.textContent = isEnabled ? "🔊" : "🔇";
      const label = btn.querySelector("[data-audio-label]");
      if (label) {
        const on = (window.RealI18NLocales && window.RealI18NLocales[localStorage.getItem("real_lang") || "en"] || {}).audio_on || "Sound On";
        const off = (window.RealI18NLocales && window.RealI18NLocales[localStorage.getItem("real_lang") || "en"] || {}).audio_off || "Sound Off";
        label.textContent = isEnabled ? on : off;
      }
    });
  };

  /* ── First user interaction bootstrap ───────────────────────── */
  const _boot = () => {
    getCtx();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    if (isEnabled && !isPlaying) startAmbient();
  };
  document.addEventListener("click",      _boot, { once: true });
  document.addEventListener("touchstart", _boot, { once: true, passive: true });

  /* ── Global click handler for audio toggles ──────────────────── */
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-audio-toggle]")) { toggle(); e.stopPropagation(); }
  });

  /* ── Init UI once DOM is ready ───────────────────────────────── */
  const _initUI = () => _updateUI();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", _initUI);
  else _initUI();

  /* ── Expose globally ─────────────────────────────────────────── */
  window.RealAudio = { enable, disable, toggle, sounds, isEnabled: () => isEnabled };
})();
