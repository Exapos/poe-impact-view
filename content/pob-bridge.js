/**
 * PoB Bridge — content script for pob.cool pages.
 * Injects the page-level hook and bridges messages between
 * the parent frame (trade page) / chrome.runtime and the page hook.
 */
(function () {
  'use strict';

  // Inject page-level hook
  const s = document.createElement('script');
  s.src = chrome.runtime.getURL('content/pob-page-hook.js');
  s.onload = () => s.remove();
  (document.head || document.documentElement).appendChild(s);

  let pobReady = false;

  // ── Messages coming from page hook (same window) or parent frame ──
  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (!msg) return;

    // From page hook → forward to parent frame + extension runtime
    if (msg.source === 'poe-impact-pob-hook') {
      if (msg.type === 'POB_HOOK_STATUS') pobReady = msg.ready;

      // Forward to parent (trade overlay iframe host)
      if (window.parent !== window) {
        window.parent.postMessage(msg, '*');
      }
      // Also notify extension parts via runtime
      chrome.runtime.sendMessage(msg).catch(() => {});
      return;
    }

    // From parent frame (trade overlay) → forward to page hook
    if (event.source !== window && msg.type && msg.type.startsWith('POB_CMD_')) {
      window.postMessage(msg, '*');
    }
  });

  // ── Messages from extension runtime (popup, service worker) ──
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type && message.type.startsWith('POB_CMD_')) {
      window.postMessage(message, '*');
      sendResponse({ ok: true });
      return;
    }
    if (message.type === 'POB_GET_STATUS') {
      sendResponse({ ready: pobReady });
      return;
    }
  });

  // Request initial status after a short delay
  setTimeout(() => window.postMessage({ type: 'POB_CMD_STATUS' }, '*'), 1000);
})();
