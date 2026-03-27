/**
 * PoB Page Hook — injected into pob.cool page context
 * Provides clipboard control and DOM event dispatch for PoB automation.
 * Communicates with pob-bridge.js via window.postMessage.
 */
(function () {
  'use strict';

  const SOURCE = 'poe-impact-pob-hook';

  // ── Mini logger (injected into pob.cool page context) ──
  const _h = (() => {
    const T  = '%c PoB Hook ';
    const ST = 'background:#6060c0;color:#fff;font-weight:bold;border-radius:3px;padding:0 4px';
    const OK   = 'color:#22c55e;font-weight:bold';
    const FAIL = 'color:#ef4444;font-weight:bold';
    const INFO = 'color:#94a3b8';
    const STEP = 'color:#f59e0b;font-weight:bold';
    return {
      ok   (m, ...a) { console.log(T + ' %c✅ ' + m, ST, OK,   ...a); },
      fail (m, ...a) { console.warn(T + ' %c❌ ' + m, ST, FAIL, ...a); },
      info (m, ...a) { console.log(T + ' %cℹ️  ' + m, ST, INFO, ...a); },
      step (m, ...a) { console.log(T + ' %c▶ ' + m, ST, STEP, ...a); },
    };
  })();

  // ── Worker message interception ──
  // pob.cool's Lua/WASM engine runs in a Web Worker. After it finishes
  // recalculating a build it may send the serialised PoB code back to the
  // main thread. We intercept worker and history signals and cache the most
  // recent live post-recalc build code so POB_CMD_COPY_BUILD can return the
  // authoritative build state without touching the canvas UI.
  let _lastLiveBuildCode = null;

  (function _hookWorker() {
    const _OrigW = window.Worker;
    if (typeof _OrigW !== 'function') return;

    window.Worker = function (url, opts) {
      const w = new _OrigW(url, opts);
      const _ael = w.addEventListener.bind(w);

      // Wrap addEventListener so every 'message' callback also runs our scanner
      w.addEventListener = function (type, fn, ...rest) {
        if (type === 'message') {
          return _ael(type, function (evt) {
            _scanForPobCode(evt.data);
            return fn.call(this, evt);
          }, ...rest);
        }
        return _ael(type, fn, ...rest);
      };

      // Also intercept direct `worker.onmessage = fn` assignments
      const _proto = Object.getOwnPropertyDescriptor(_OrigW.prototype, 'onmessage');
      if (_proto && _proto.set) {
        Object.defineProperty(w, 'onmessage', {
          get () { return _proto.get ? _proto.get.call(w) : null; },
          set (fn) {
            _ael('message', (evt) => _scanForPobCode(evt.data));
            _proto.set.call(w, fn);
          },
          configurable: true,
        });
      }

      return w;
    };
    Object.defineProperty(window.Worker, 'prototype', { value: _OrigW.prototype });
  })();

  // ── History / hash interception ──
  // pob.cool is a SPA that calls history.replaceState after it recalculates a
  // build loaded from the URL hash. When it does so the URL fragment contains
  // the freshly serialised post-recalc build code for the current runtime state.
  // We intercept replaceState / pushState / hashchange so we never miss it.
  (function _hookHistoryApi() {
    function _extractBuildCode(url) {
      if (!url) return null;
      const s = String(url);
      const m = s.match(/[#&?]build=([A-Za-z0-9+/\-_%]{60,})/);
      if (!m) return null;
      try { return decodeURIComponent(m[1]); } catch (_) { return m[1]; }
    }

    function _onHistoryCode(code) {
      if (!code || !code.startsWith('eJ')) return;
      if (code === _lastLiveBuildCode) return; // already emitted same code
      _h.ok('history.replaceState captured PoB code len ' + code.length);
      _lastLiveBuildCode = code;
      post('POB_HOOK_WORKER_CODE', { code });
    }

    const _origReplaceState = history.replaceState.bind(history);
    history.replaceState = function (state, title, url) {
      _onHistoryCode(_extractBuildCode(url));
      return _origReplaceState(state, title, url);
    };

    const _origPushState = history.pushState.bind(history);
    history.pushState = function (state, title, url) {
      _onHistoryCode(_extractBuildCode(url));
      return _origPushState(state, title, url);
    };

    window.addEventListener('hashchange', () => {
      _h.step('hashchange \u2014 loading new build, marking not-ready');
      isReady = false;
      post('POB_HOOK_STATUS', { ready: false, hasCanvas: !!canvasContainer });
      // NOTE: do NOT call _onHistoryCode here.
      // The hash just changed to our input build code.
      // Emitting it as POB_HOOK_WORKER_CODE would hand the overlay the
      // pre-recalc export payload, which may still contain stale cached
      // PlayerStats. Only replaceState/pushState emitted by pob.cool after
      // recalculation can update the live authoritative build code.
      //
      // Start watching fillText for when pob.cool finishes loading.
      // (pollCanvas already exited so we must do this ourselves.)
      _scheduleReadyWatch();
    });
  })();

  // ── Readiness watch ──
  // After every hash change, pob.cool reloads passive tree data (3.27 + 3.28)
  // which takes 15-25 s.  We monitor _capturedFillText to detect when loading
  // text disappears and the build UI starts rendering, then emit
  // POB_HOOK_STATUS{ready:true} so _waitForPobReady() can resolve.
  let _readyWatchTimer = null;

  function _scheduleReadyWatch() {
    if (_readyWatchTimer) clearTimeout(_readyWatchTimer);
    const t0 = Date.now();

    function attempt() {
      const elapsed  = Date.now() - t0;
      // Texts drawn in the last 1 s
      const recent   = _capturedFillText.filter(e => e.ts > Date.now() - 1000);
      // pob.cool draws 'LOADING', 'Loading passive tree data\u2026' etc. while loading
      const loading  = recent.some(e => /^loading/i.test(e.text));
      // Build UI active = lots of short strings rendered (labels, numbers)
      const active   = recent.length > 10;

      if (elapsed > 28000 || (!loading && active && elapsed > 6000)) {
        _h.ok('POB ready \u2714 \u2014 ' + (elapsed > 28000 ? 'timeout' : 'fillText stable') +
              ' after ' + Math.round(elapsed / 1000) + ' s');
        isReady = true;
        post('POB_HOOK_STATUS', { ready: true, hasCanvas: !!canvasContainer });
        return;
      }
      _readyWatchTimer = setTimeout(attempt, 500);
    }
    // Give pob.cool 5 s head-start before we even start checking
    _readyWatchTimer = setTimeout(attempt, 5000);
  }

  function _scanForPobCode(data) {
    const tryStr = (s) => {
      if (typeof s !== 'string' || s.length < 60) return;
      // PoB codes start with 'eJ' (deflated zlib magic 0x78 0x9C) and are
      // base64 or base64url encoded. Match ≥60 chars to avoid false positives.
      const m = s.match(/eJ[A-Za-z0-9+/\-_]{58,}={0,2}/);
      if (m) {
        _h.ok('worker→main: captured PoB code len ' + m[0].length);
        _lastLiveBuildCode = m[0];
        // Notify trade-overlay immediately so it doesn't have to poll
        post('POB_HOOK_WORKER_CODE', { code: m[0] });
      }
    };
    try {
      if (typeof data === 'string') {
        tryStr(data);
      } else if (data && typeof data === 'object' && !(data instanceof ArrayBuffer)) {
        const walk = (obj, d) => {
          if (!obj || d > 4) return;
          for (const v of Object.values(obj)) {
            tryStr(v);
            if (v && typeof v === 'object' && !(v instanceof ArrayBuffer)) walk(v, d + 1);
          }
        };
        walk(data, 0);
      }
    } catch (_) {}
  }

  // ── Canvas fillText capture — hooked before PoB creates any canvas contexts ──
  // We capture all text drawn to canvas and later scan it for stat patterns.
  const _capturedFillText = [];
  (function () {
    const _origFT = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y) {
      if (text && String(text).trim().length > 0) {
        _capturedFillText.push({
          text: String(text).trim(),
          x: Math.round(x),
          y: Math.round(y),
          ts: Date.now(),
        });
        // Keep a rolling window to avoid unbounded growth
        if (_capturedFillText.length > 10000) _capturedFillText.shift();
      }
      return _origFT.call(this, text, x, y);
    };
  })();

  function parseStatValue(str) {
    const s = str.replace(/,/g, '').trim();
    if (/m$/i.test(s)) return parseFloat(s) * 1_000_000;
    if (/k$/i.test(s)) return parseFloat(s) * 1_000;
    return parseFloat(s) || 0;
  }

  function extractStatsFromCapture(since) {
    // Use all texts since the build started loading (or last 30 s as fallback)
    const cutoff = since || (Date.now() - 30000);
    const recent = _capturedFillText.filter(e => e.ts >= cutoff);
    if (recent.length > 0) {
      _h.info('capture window: ' + recent.length + ' texts; last 5: ' + recent.slice(-5).map(e => e.text).join(' | '));
    } else {
      _h.fail('capture buffer empty for cutoff ' + cutoff + ' (total buffer: ' + _capturedFillText.length + ')');
    }
    const stats = {};

    const isNumeric = t => /^[\d,\.]+[kKmM]?$/.test(t) && parseStatValue(t) > 0;

    // Strategy 1: combined text like "Total DPS: 2,453,847" or "DPS: 2.45M"
    for (const e of recent) {
      const m = e.text.match(/(?:total\s*dps|effective\s*dps|calcs\s*dps|combined\s*dps)\s*[:\-]\s*([\d,\.]+[kKmM]?)/i);
      if (m) { stats.totalDps = parseStatValue(m[1]); }
      const lm = e.text.match(/^life\s*[:\-]\s*([\d,]+)/i);
      if (lm) { stats.life = Math.round(parseStatValue(lm[1])); }
      const em = e.text.match(/^(?:energy shield|es)\s*[:\-]\s*([\d,]+)/i);
      if (em) { stats.energyShield = Math.round(parseStatValue(em[1])); }
    }

    // Strategy 2: label on one fillText call, number on a nearby separate call
    const rowH = 18;
    const nearbyNum = (refEntry, maxDx) => {
      return recent
        .filter(e => e.ts >= refEntry.ts
          && Math.abs(e.y - refEntry.y) < rowH * 1.8
          && e.x > refEntry.x
          && (maxDx === undefined || e.x - refEntry.x < maxDx)
          && isNumeric(e.text))
        .sort((a, b) => a.x - b.x)[0];
    };

    if (!stats.totalDps) {
      for (const e of recent) {
        if (/^(?:total\s*dps|effective\s*hit\s*dps|dps)$/i.test(e.text)) {
          const num = nearbyNum(e, 300);
          if (num) { stats.totalDps = parseStatValue(num.text); break; }
        }
      }
    }
    if (!stats.life) {
      for (const e of recent) {
        if (/^life$/i.test(e.text)) {
          const num = nearbyNum(e, 300);
          if (num) { stats.life = Math.round(parseStatValue(num.text)); break; }
        }
      }
    }
    if (!stats.energyShield) {
      for (const e of recent) {
        if (/^energy shield$/i.test(e.text) || /^es$/i.test(e.text)) {
          const num = nearbyNum(e, 300);
          if (num) { stats.energyShield = Math.round(parseStatValue(num.text)); break; }
        }
      }
    }

    return stats;
  }

  // ── State ──
  let pendingPasteText = null;
  let isReady = false;
  let canvasContainer = null;

  // ── Clipboard hooks ──

  const origRead = navigator.clipboard.read.bind(navigator.clipboard);
  navigator.clipboard.read = async function () {
    if (pendingPasteText !== null) {
      const text = pendingPasteText;
      pendingPasteText = null;
      const blob = new Blob([text], { type: 'text/plain' });
      return [new ClipboardItem({ 'text/plain': blob })];
    }
    return origRead();
  };

  const origReadText = navigator.clipboard.readText.bind(navigator.clipboard);
  navigator.clipboard.readText = async function () {
    if (pendingPasteText !== null) {
      const text = pendingPasteText;
      pendingPasteText = null;
      return text;
    }
    return origReadText();
  };

  const origWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);
  navigator.clipboard.writeText = async function (text) {
    _h.step('clipboard.writeText intercepted — len ' + String(text).length + (String(text).startsWith('eJ') ? ' (looks like PoB code ✔)' : ''));
    post('POB_HOOK_COPY', { text });
    return origWriteText(text);
  };

  // Hook legacy document.execCommand('copy') used by some pob.cool versions
  const _origExecCommand = document.execCommand.bind(document);
  document.execCommand = function (commandId, ...args) {
    if (String(commandId).toLowerCase() === 'copy') {
      const sel = window.getSelection();
      const text = sel ? sel.toString() : '';
      if (text) {
        _h.step('execCommand copy intercepted — len ' + text.length + (text.startsWith('eJ') ? ' (PoB code ✔)' : ''));
        post('POB_HOOK_COPY', { text });
      }
    }
    return _origExecCommand(commandId, ...args);
  };

  // Some pob.cool versions use clipboard.write() with ClipboardItem instead of writeText
  if (navigator.clipboard.write) {
    const origWrite = navigator.clipboard.write.bind(navigator.clipboard);
    navigator.clipboard.write = async function (items) {
      try {
        for (const item of items) {
          for (const type of item.types) {
            if (type === 'text/plain') {
              const blob = await item.getType('text/plain');
              const text = await blob.text();
              post('POB_HOOK_COPY', { text });
              break;
            }
          }
        }
      } catch (_) {}
      return origWrite(items);
    };
  }

  // ── Canvas detection ──

  function findContainer() {
    // pob.cool puts a tabindex=0 container inside #window
    const win = document.querySelector('#window');
    if (win) {
      const c = win.querySelector('[tabindex="0"]');
      if (c) return c;
    }
    // Fallback: first canvas parent
    const cv = document.querySelector('canvas');
    return cv ? cv.parentElement : null;
  }

  function pollCanvas() {
    canvasContainer = findContainer();
    if (canvasContainer) {
      isReady = true;
      post('POB_HOOK_STATUS', { ready: true, hasCanvas: true });
      // On first-ready: also check if the current URL hash already has a build
      // code (edge-case: history hook was installed after pob.cool already set it).
      // We do NOT emit it as POB_HOOK_WORKER_CODE because it is still just the
      // input code, not the live post-recalc build snapshot.
      _h.ok('Canvas ready ✔ (hash len ' + location.hash.length + ')');
      return;
    }
    setTimeout(pollCanvas, 500);
  }

  // ── Event dispatch helpers ──

  function click(x, y, button, dbl) {
    if (!canvasContainer) return;
    const r = canvasContainer.getBoundingClientRect();
    const o = { clientX: r.left + x, clientY: r.top + y, button: button || 0, bubbles: true };
    canvasContainer.dispatchEvent(new MouseEvent('mousedown', o));
    canvasContainer.dispatchEvent(new MouseEvent('mouseup', o));
    if (dbl) canvasContainer.dispatchEvent(new MouseEvent('dblclick', o));
  }

  function moveMouse(x, y) {
    if (!canvasContainer) return;
    const r = canvasContainer.getBoundingClientRect();
    canvasContainer.dispatchEvent(new MouseEvent('mousemove', {
      clientX: r.left + x, clientY: r.top + y, bubbles: true
    }));
  }

  function keyDown(key) { canvasContainer?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })); }
  function keyUp(key) { canvasContainer?.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true })); }
  function keyPress(key) { canvasContainer?.dispatchEvent(new KeyboardEvent('keypress', { key, bubbles: true })); }

  // Dispatch a key chord with ctrlKey:true so pob.cool's event.ctrlKey check passes.
  function ctrlKey(key) {
    const kc = key.toUpperCase().charCodeAt(0);
    canvasContainer?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Control', ctrlKey: true, bubbles: true }));
    canvasContainer?.dispatchEvent(new KeyboardEvent('keydown', { key, ctrlKey: true, keyCode: kc, bubbles: true }));
    canvasContainer?.dispatchEvent(new KeyboardEvent('keyup',   { key, ctrlKey: true, keyCode: kc, bubbles: true }));
    canvasContainer?.dispatchEvent(new KeyboardEvent('keyup',   { key: 'Control', ctrlKey: false, bubbles: true }));
  }

  function tapKey(key) {
    keyDown(key);
    if (key.length === 1) keyPress(key);
    keyUp(key);
  }

  function typeText(text) {
    for (const ch of text) tapKey(ch);
  }

  // ── Automation sequences ──
  // PoB minimum canvas is 1550×800. Tabs are at the bottom row ~ y≈776.
  // Tab order: Tree | Skills | Items | Calcs | Import/Export | Notes | Config | Party
  // Tab spacing ~80px; Items (tab 3) ≈ x=240, Import/Export (tab 5) ≈ x=400.
  // Import/Export content: "Copy Build Code" button is near the top-left of the panel.

  const TAB_Y                 = 776;
  const ITEMS_TAB_X           = 240;
  const IMPORT_EXPORT_TAB_X   = 1261; // ~7th of 8 tabs in 1550 px canvas
  const COPY_BUILD_BTN_X      = 225;  // x of "Copy Build Code" button in Import/Export panel
  const COPY_BUILD_BTN_Y      =  60;  // y of that button

  function clickItemsTab() { click(ITEMS_TAB_X, TAB_Y); }

  // ── PostMessage helpers ──

  function post(type, data) {
    window.postMessage({ type, source: SOURCE, ...(data || {}) }, '*');
  }

  // ── Inbound command handler ──

  window.addEventListener('message', (e) => {
    if (e.source !== window) return;
    const m = e.data;
    if (!m || m.source === SOURCE) return;

    switch (m.type) {
      case 'POB_CMD_STATUS':
        post('POB_HOOK_STATUS', { ready: isReady, hasCanvas: !!canvasContainer });
        break;

      case 'POB_CMD_SET_PASTE':
        pendingPasteText = m.text || null;
        _lastLiveBuildCode = null; // discard cached live code for previous build
        post('POB_HOOK_PASTE_SET', { ok: true });
        break;

      case 'POB_CMD_CLEAR_CACHE':
        _lastLiveBuildCode = null;
        _h.info('live build code cache cleared');
        break;

      case 'POB_CMD_CLICK':
        click(m.x, m.y, m.button, m.dbl);
        break;

      case 'POB_CMD_MOUSE_MOVE':
        moveMouse(m.x, m.y);
        break;

      case 'POB_CMD_KEY':
        tapKey(m.key);
        break;

      case 'POB_CMD_KEY_DOWN':
        keyDown(m.key);
        break;

      case 'POB_CMD_KEY_UP':
        keyUp(m.key);
        break;

      case 'POB_CMD_TYPE':
        typeText(m.text);
        break;

      case 'POB_CMD_ITEMS_TAB':
        clickItemsTab();
        break;

      case 'POB_CMD_COPY_BUILD': {
        _h.step('POB_CMD_COPY_BUILD — live build cache: ' + (_lastLiveBuildCode ? 'HIT ✔' : 'miss'));

        // Fast path: worker/history hooks already handed us the latest live build code.
        if (_lastLiveBuildCode) {
          const code = _lastLiveBuildCode;
          _lastLiveBuildCode = null;
          _h.ok('Fast path: returning cached code len ' + code.length);
          post('POB_HOOK_COPY', { text: code });
          break;
        }

        // Fallback: find and click the "Import/Export Build" TAB via fillText scan,
        // then click "Generate" and "Copy" buttons — no keyboard shortcuts needed.

        // Helper: find the most recent fillText entry matching a pattern within last ageSec s
        function _findBtn(pattern, ageSec) {
          const cutoff = Date.now() - ageSec * 1000;
          return _capturedFillText
            .filter(e => e.ts > cutoff && pattern.test(e.text))
            .sort((a, b) => b.ts - a.ts)[0];
        }

        // Helper: sweep mouse horizontally to trigger canvas redraws (fills _capturedFillText)
        function _sweep(y, x0, x1, step) {
          for (let x = x0; x <= x1; x += step) moveMouse(x, y);
        }

        // Step 0: sweep the tab bar row to populate fillText with tab labels
        _h.step('Sweeping tab bar to find "Import/Export Build"…');
        _sweep(TAB_Y, 0, 1550, 30);

        setTimeout(() => {
          // The tab can render as "Import/Export Build" or just "Import/Export"
          const tab = _findBtn(/import.{0,5}export/i, 3);
          if (tab) {
            _h.ok('"Import/Export" tab at (' + tab.x + ', ' + tab.y + ') — clicking');
            click(tab.x, tab.y);
          } else {
            // Fallback to hardcoded x if tab wasn't in fillText
            _h.fail('"Import/Export" tab not found in fillText — trying hardcoded x=' + IMPORT_EXPORT_TAB_X);
            const recent = _capturedFillText
              .filter(e => e.ts > Date.now() - 3000)
              .map(e => '"' + e.text + '"').join(', ');
            _h.info('Tab bar fillText: ' + (recent || '(none)'));
            click(IMPORT_EXPORT_TAB_X, TAB_Y);
          }

          // Step 1: after clicking the tab, sweep the panel area and find "Generate"
          setTimeout(() => {
            _sweep(65, 30, 800, 40);
            setTimeout(() => {
              const gen = _findBtn(/^generate$/i, 3);
              if (gen) {
                _h.ok('"Generate" at (' + gen.x + ', ' + gen.y + ') — clicking');
                click(gen.x, gen.y);
              } else {
                _h.fail('"Generate" not in fillText — code may already exist, proceeding to Copy');
              }

              // Step 2: re-sweep after Generate, then find and click "Copy"
              setTimeout(() => {
                _sweep(65, 30, 800, 40);
                setTimeout(() => {
                  const copy = _findBtn(/^copy$/i, 3);
                  if (copy) {
                    _h.ok('"Copy" at (' + copy.x + ', ' + copy.y + ') — clicking');
                    click(copy.x, copy.y);
                  } else {
                    _h.fail('"Copy" not in fillText — dumping recent texts');
                    const recent2 = _capturedFillText
                      .filter(e => e.ts > Date.now() - 3000)
                      .map(e => '"' + e.text + '"').join(', ');
                    _h.info('Panel fillText: ' + (recent2 || '(none)'));
                  }
                  _h.info('Waiting for clipboard.writeText intercept…');
                }, 500);
              }, 1200);
            }, 800);
          }, 800);
        }, 600);
        break;
      }

      case 'POB_CMD_PASTE_KEY':
        // Simulate Ctrl+V so PoB reads the clipboard (which we hooked)
        keyDown('Control');
        tapKey('v');
        keyUp('Control');
        break;

      case 'POB_CMD_CAPTURE_STATS': {
        // Move mouse across the left stats panel area to trigger canvas re-renders
        if (canvasContainer) {
          const h = canvasContainer.getBoundingClientRect().height || 800;
          const w = canvasContainer.getBoundingClientRect().width  || 1200;
          // Sweep across the left sidebar where PoB draws stats/calcs numbers
          for (let yy = Math.floor(h * 0.1); yy <= Math.floor(h * 0.85); yy += 60) {
            moveMouse(Math.floor(w * 0.12), yy);
          }
          // Also nudge center (skill tree area can affect DPS display)
          moveMouse(Math.floor(w * 0.5), Math.floor(h * 0.5));
        }
        const since = m.since || null;
        // Delay to let canvas respond to mouse moves + any pending renders
        setTimeout(() => {
          const stats = extractStatsFromCapture(since);
          post('POB_HOOK_STATS', { stats });
        }, 1200);
        break;
      }
    }
  });

  // ── Boot ──
  pollCanvas();
})();
