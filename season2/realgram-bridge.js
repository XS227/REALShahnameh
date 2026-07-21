/* realgram-bridge.js — RealGram WebView-to-native bridge.
   Loaded on every season2 page. Two jobs:

   1. Tell native when ANY overlay (modal/bottom-sheet/quiz/chapter popup/
      full-screen menu) is open, so the native BottomNav can hide itself
      instead of being covered by it (Khabat, 2026-07-21: "Farr — Divine
      Glory" popup visibly covered by the native footer; padding alone
      wasn't enough — this is the real open/close signal that was missing).
   2. Let native forward the Android hardware back button INTO the page so
      it closes the topmost overlay instead of leaving the WebView/tab.

   Overlay implementations across season2 are NOT unified — every page grew
   its own modal markup/class names independently (desk-modal in chapter.html,
   guild-modal-overlay in guild.html, cert-modal in heroes.html, lore-modal in
   dynasty.html, map-modal in persia-map.html, plain .modal in learn.html/
   social.html, .ad-overlay in earn.html). Rather than touching every one of
   those call sites (real risk of missing one and silently regressing it),
   this observes the DOM directly: any of the known overlay-root selectors
   below becoming visible counts as "an overlay is open," full stop. New
   overlays only need their root's class added to OVERLAY_SELECTORS, not a
   call to this file.
*/
(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var isEmbedded = params.get('src') === 'realink';

  function post(type, extra) {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      var msg = Object.assign({ source: 'season2bridge', type: type }, extra || {});
      window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    }
  }

  // Selectors for every overlay-root element found across season2's pages
  // (2026-07-21 audit). Add new ones here as new overlay UIs are built.
  var OVERLAY_SELECTORS = [
    '.desk-modal', '.desk-modal-bg',                 // chapter.html (incl. the Farr chapter-complete popup)
    '.guild-modal-overlay',                          // guild.html
    '.cert-backdrop', '.cert-modal',                 // heroes.html
    '.lore-backdrop', '.lore-modal',                 // dynasty.html
    '.map-modal-overlay', '.map-modal',               // persia-map.html
    '.modal-backdrop', '.modal',                      // learn.html, social.html
    '.ad-overlay',                                    // earn.html
    '[data-realgram-overlay]',                        // escape hatch for future pages
  ].join(', ');

  // A close-affordance to try, in priority order, when native asks us to
  // handle a back press. Most of these overlay roots ARE their own backdrop
  // (clicking them dismisses), a few need an explicit close button inside.
  var CLOSE_SELECTORS = [
    '[class*="modal-close"]', '[class*="-close"]',
  ];

  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    var style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) return false;
    // offsetParent is null for display:none AND position:fixed in some
    // browsers, so don't rely on it alone — the style checks above are the
    // real signal; this is just a cheap extra filter for zero-size nodes.
    return el.offsetWidth > 0 || el.offsetHeight > 0 || style.position === 'fixed';
  }

  function visibleOverlays() {
    return Array.prototype.filter.call(document.querySelectorAll(OVERLAY_SELECTORS), isVisible);
  }

  var wasOpen = false;
  var debounceTimer = null;

  function recompute() {
    var overlays = visibleOverlays();
    var isOpen = overlays.length > 0;
    if (isOpen === wasOpen) return;
    wasOpen = isOpen;
    post(isOpen ? 'overlay-open' : 'overlay-closed');
  }

  function scheduleRecompute() {
    if (debounceTimer) clearTimeout(debounceTimer);
    // Short debounce: modals often toggle a class then immediately animate;
    // this coalesces the burst of mutations from one open/close into a
    // single message instead of flickering the native nav.
    debounceTimer = setTimeout(recompute, 120);
  }

  function topmostOverlay() {
    var overlays = visibleOverlays();
    if (!overlays.length) return null;
    // Highest DOM position (last matched, typically appended last / highest
    // z-index in these codebases) is the most likely "topmost" overlay.
    return overlays[overlays.length - 1];
  }

  // Returns true if it handled the back press (an overlay was closed),
  // false if there was nothing open — caller (native) falls back to normal
  // back behavior (leave tab / exit confirmation) in that case.
  function handleNativeBack() {
    var el = topmostOverlay();
    if (!el) return false;

    var closeBtn = el.querySelector(CLOSE_SELECTORS.join(', '));
    if (closeBtn) {
      closeBtn.click();
      return true;
    }
    // No explicit close button found — the overlay root itself is usually
    // the clickable backdrop (desk-modal-bg, cert-backdrop, lore-backdrop,
    // map-modal-overlay, modal-backdrop all dismiss on their own click).
    el.click();
    return true;
  }

  // Chrome that duplicates what the native app already provides once
  // embedded — hides on sight rather than requiring every page to check
  // isEmbedded itself. Exact-href match only (index.html's own "my profile"
  // shortcut card), NOT anything with a query string — profile.html?uid=X
  // (visiting another player's profile from a clan/member list) is a real,
  // still-needed feature, not duplicate chrome, and must stay clickable.
  var EMBEDDED_HIDE_CSS = '.realgram-embedded a[href="profile.html"]{display:none!important;}';

  var observer = new MutationObserver(scheduleRecompute);

  function start() {
    if (document.documentElement) {
      if (isEmbedded) {
        document.documentElement.classList.add('realgram-embedded');
        var style = document.createElement('style');
        style.textContent = EMBEDDED_HIDE_CSS;
        document.head.appendChild(style);
      }
    }
    observer.observe(document.body, {
      childList: true, subtree: true, attributes: true,
      attributeFilter: ['class', 'style', 'hidden'],
    });
    recompute();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  window.RealGramBridge = {
    isEmbedded: isEmbedded,
    handleNativeBack: handleNativeBack,
  };
})();
