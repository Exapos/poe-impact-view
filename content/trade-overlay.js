/**
 * Trade Overlay — Injected into pathofexile.com/trade pages
 * Monitors trade results, calculates item impact via headless PoB, renders comparison panels.
 *
 * Dependencies (loaded before this via manifest):
 *   window.pobLuaVM  (lib/pob-lua-vm.js)
 *   window.PobCodec  (lib/pob-codec.js)
 *   window.PobStats  (lib/pob-stats.js)
 *   window.TradeParser (content/trade-parser.js)
 *   window.I18n      (lib/i18n.js)
 */

/* global PobCodec, PobStats, TradeParser, I18n, BuildStorage, pobLuaVM, chrome */

(function () {
  'use strict';

  // ── State ──
  let pobData = null;          // Extracted build data from chrome.storage
  let baseStats = null;        // Normalized base stats from Lua VM
  let xmlText = null;          // Raw XML for Lua VM init
  let pobCoolUrl = null;       // pob.cool URL for iframe
  let buildReady = false;      // CalcPerform build loaded
  let vmInitPromise = null;    // Lua VM initialization promise
  let processingQueue = [];    // Rows waiting for calculation
  let statusSnapshot = { kind: 'loading' };

  const PANEL_ATTR = 'data-poe-impact';
  const DEBOUNCE_MS = 400;

  // ── Init ──

  async function init() {
    await I18n.init();
    await loadActiveBuildFromStorage();

    createStatusBar();
    observeResults();
    listenForStorageChanges();

    if (xmlText) {
      updateStatusBar(I18n.t('statusbar.loading'), 'loading', 'loading');
      vmInitPromise = initBuild();
    } else {
      updateStatusBar(I18n.t('statusbar.no_pob'), 'warn', 'no_pob');
    }
  }

  async function loadActiveBuildFromStorage() {
    try {
      pobData = await BuildStorage.getActiveBuild();
      pobCoolUrl = pobData?.pobCode || null;
      xmlText = pobData?.xmlText || null;
      baseStats = pobData?.stats ? PobStats.normalizeStats(pobData.stats) : null;
    } catch (e) {
      console.error('[Overlay] Failed to load active build:', e);
      pobData = null;
      pobCoolUrl = null;
      xmlText = null;
      baseStats = null;
    }
  }

  async function initBuild() {
    try {
      const liveStats = await pobLuaVM.initBuildFromXml(xmlText);
      if (liveStats) {
        baseStats = liveStats;
        buildReady = true;
        updateReadyStatusBar();
        drainQueue();
        processAllRows();
      } else {
        updateStatusBar(I18n.t('statusbar.no_dps'), 'error', 'no_dps');
      }
    } catch (e) {
      console.error('[Overlay] Build init failed:', e);
      updateStatusBar(I18n.t('statusbar.no_dps'), 'error', 'no_dps');
    }
  }

  // ── Storage listener: auto-reload on import ──

  function listenForStorageChanges() {
    chrome.storage.onChanged.addListener(async (changes) => {
      if (changes.i18n_locale && changes.i18n_locale.newValue && changes.i18n_locale.newValue !== I18n.getLocale()) {
        I18n.setLocale(changes.i18n_locale.newValue, false);
        rerenderPanelsForLocale();
      }

      if (changes.pobBuilds || changes.activeBuildId || changes.pobData || changes.pobCoolUrl) {
        console.log('[Overlay] Build changed, refreshing overlay...');
        await refreshBuildFromStorage();
      }
    });
  }

  // ── Status Bar ──

  let statusBar = null;

  function createStatusBar() {
    statusBar = document.createElement('div');
    statusBar.id = 'poe-impact-bar';
    statusBar.innerHTML = `
      <span id="poe-impact-bar-text">${I18n.t('statusbar.loading')}</span>
      <span id="poe-impact-indicators"></span>
    `;
    document.body.prepend(statusBar);
  }

  function updateStatusBar(text, type, kind = 'custom') {
    if (!statusBar) return;
    statusSnapshot = { kind, text, type };
    const el = statusBar.querySelector('#poe-impact-bar-text');
    if (el) el.textContent = text;
    statusBar.className = `poe-impact-bar-${type || 'ok'}`;
  }

  function updateReadyStatusBar() {
    const dps = PobStats.formatNumber(baseStats.totalDps);
    const life = PobStats.formatNumber(baseStats.life);
    updateStatusBar(`⚔️ ${I18n.t('stats.dps')}: ${dps} | ❤️ ${I18n.t('stats.life')}: ${life}`, 'ok', 'ready');
  }

  function rerenderStatusBar() {
    switch (statusSnapshot.kind) {
      case 'ready':
        if (baseStats) updateReadyStatusBar();
        break;
      case 'no_pob':
        updateStatusBar(I18n.t('statusbar.no_pob'), 'warn', 'no_pob');
        break;
      case 'no_dps':
        updateStatusBar(I18n.t('statusbar.no_dps'), 'error', 'no_dps');
        break;
      default:
        updateStatusBar(I18n.t('statusbar.loading'), 'loading', 'loading');
        break;
    }
  }

  // ── MutationObserver: watch for new trade results ──

  function observeResults() {
    let debounceTimer = null;
    const observer = new MutationObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(processAllRows, DEBOUNCE_MS);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    // Process any rows already present
    setTimeout(processAllRows, 500);
  }

  // ── Row Processing ──

  function processAllRows() {
    const rows = TradeParser.findResultRows();
    for (const row of rows) {
      if (row.hasAttribute(PANEL_ATTR)) continue;
      row.setAttribute(PANEL_ATTR, 'pending');
      processRow(row);
    }
  }

  async function processRow(row) {
    const parsed = TradeParser.parseResultRow(row);
    if (!parsed) {
      row.setAttribute(PANEL_ATTR, 'skip');
      return;
    }

    const slot = TradeParser.detectSlot(parsed);
    const pobSlot = PobStats.mapTradeToPobSlot(slot);

    if (!buildReady) {
      injectPendingPanel(row, parsed, pobSlot);
      processingQueue.push({ row, parsed, pobSlot });
      return;
    }

    await calculateAndRender(row, parsed, pobSlot);
  }

  async function drainQueue() {
    const queue = processingQueue.splice(0);
    for (const { row, parsed, pobSlot } of queue) {
      await calculateAndRender(row, parsed, pobSlot);
    }
  }

  async function calculateAndRender(row, parsed, pobSlot) {
    if (!buildReady || !pobSlot) {
      row.setAttribute(PANEL_ATTR, 'skip');
      return;
    }

    const itemText = formatItemForPob(parsed);
    if (!itemText) {
      row.setAttribute(PANEL_ATTR, 'skip');
      return;
    }

    try {
      row.setAttribute(PANEL_ATTR, 'calculating');
      const result = await pobLuaVM.calcItemSwap(pobSlot, itemText);
      if (result) {
        injectImpactPanel(row, result, parsed, pobSlot);
      } else {
        row.setAttribute(PANEL_ATTR, 'error');
      }
    } catch (e) {
      console.error('[Overlay] calcItemSwap failed:', e);
      row.setAttribute(PANEL_ATTR, 'error');
    }
  }

  // ── Panel Rendering ──

  function injectPendingPanel(row, parsed, pobSlot) {
    const panel = document.createElement('div');
    panel.className = 'poe-impact-panel poe-impact-pending';
    panel.innerHTML = `
      <div class="poe-impact-verdict neutral">
        <span>⏳ ${I18n.t('panel.btn_loading')}</span>
      </div>
      <div class="poe-impact-slot">${pobSlot || '?'}</div>
    `;
    _appendPanel(row, panel);
  }

  function injectImpactPanel(row, result, parsed, pobSlot) {
    // Remove pending panel if exists
    const existing = row.querySelector('.poe-impact-panel');
    if (existing) existing.remove();

    const { before, after, diff, dpsPct } = result;
    const verdict = _calcVerdict(diff, dpsPct);

    const panel = document.createElement('div');
    panel.className = 'poe-impact-panel';

    const rows = _buildCompareRows(before, after, diff);

    panel.innerHTML = `
      <div class="poe-impact-verdict ${verdict.cssClass}">
        <span class="verdict-text">${verdict.text}</span>
        <span class="verdict-dps">${_formatDpsPct(dpsPct)}</span>
        ${pobCoolUrl ? `<button class="poe-impact-btn-stats" title="${I18n.t('panel.btn_tooltip')}">📊</button>` : ''}
      </div>
      <div class="poe-impact-items">
        <span class="poe-impact-slot">${pobSlot}</span>
        <span class="poe-impact-item-name">${_escapeHtml(parsed.name || parsed.typeLine)}</span>
      </div>
      <div class="poe-impact-compare">
        <div class="poe-impact-compare-header">
          <span>${I18n.t('panel.col_stat')}</span><span>${I18n.t('panel.col_now')}</span><span>${I18n.t('panel.col_new')}</span><span>${I18n.t('panel.col_delta')}</span>
        </div>
        ${rows}
      </div>
    `;

    // pob.cool button handler
    const statsBtn = panel.querySelector('.poe-impact-btn-stats');
    if (statsBtn) {
      statsBtn.addEventListener('click', () => openPobCool(parsed, pobSlot));
    }

    _appendPanel(row, panel);
    row.setAttribute(PANEL_ATTR, 'done');
  }

  function _appendPanel(row, panel) {
    // Remove any previous panel
    const old = row.querySelector('.poe-impact-panel');
    if (old) old.remove();
    row.style.position = 'relative';
    row.appendChild(panel);
  }

  function _buildCompareRows(before, after, diff) {
    const stats = [
      { key: 'totalDps',     label: I18n.t('panel.lbl_dps'),        icon: '⚔️', higherBetter: true, alwaysVisible: true },
      { key: 'fullDps',      label: I18n.t('panel.lbl_full_dps'),   icon: '💥', higherBetter: true, alwaysVisible: true },
      { key: 'averageHit',   label: I18n.t('panel.lbl_avg_hit'),    icon: '🎯', higherBetter: true, alwaysVisible: true },
      { key: 'life',         label: I18n.t('panel.lbl_life'),       icon: '❤️', higherBetter: true, alwaysVisible: true },
      { key: 'energyShield', label: I18n.t('panel.lbl_es'),         icon: '🛡️', higherBetter: true, alwaysVisible: true },
      { key: 'mana',         label: I18n.t('stats.mana'),           icon: '💧', higherBetter: true, alwaysVisible: true },
      { key: 'armour',       label: I18n.t('panel.lbl_armour'),     icon: '🔰', higherBetter: true },
      { key: 'evasion',      label: I18n.t('panel.lbl_evasion'),    icon: '💨', higherBetter: true },
      { key: 'critChance',   label: I18n.t('panel.lbl_crit'),       icon: '✨', higherBetter: true, fmt: v => v.toFixed(1) + '%' },
      { key: 'speed',        label: I18n.t('panel.lbl_speed'),      icon: '⚡', higherBetter: true, fmt: v => v.toFixed(2) },
      { key: 'fireRes',      label: I18n.t('panel.lbl_fire'),       icon: '🔥', higherBetter: true },
      { key: 'coldRes',      label: I18n.t('panel.lbl_cold'),       icon: '❄️', higherBetter: true },
      { key: 'lightRes',     label: I18n.t('panel.lbl_lightning'),  icon: '⚡', higherBetter: true },
      { key: 'chaosRes',     label: I18n.t('panel.lbl_chaos'),      icon: '☠️', higherBetter: true },
    ];

    return stats
      .filter(s => s.alwaysVisible || diff[s.key] !== 0 || before[s.key] !== 0 || after[s.key] !== 0)
      .map(s => {
        const fmt = s.fmt || (v => PobStats.formatNumber(v));
        const d = PobStats.formatDiff(diff[s.key], s.higherBetter);
        return `
          <div class="poe-impact-compare-row">
            <span class="stat-label">${s.icon} ${s.label}</span>
            <span class="stat-now">${fmt(before[s.key])}</span>
            <span class="stat-new">${fmt(after[s.key])}</span>
            <span class="stat-diff ${d.cssClass}">${d.text}</span>
          </div>`;
      })
      .join('');
  }

  function _calcVerdict(diff, dpsPct) {
    const pct = parseFloat(dpsPct) || 0;
    const hasDefBuff = (diff.life > 0) || (diff.energyShield > 0);

    if (pct > 1 || (pct >= 0 && hasDefBuff && (diff.life + diff.energyShield > 50))) {
      return { text: I18n.t('panel.verdict_upgrade'), cssClass: 'upgrade' };
    }
    if (pct < -1 && !hasDefBuff) {
      return { text: I18n.t('panel.verdict_downgrade'), cssClass: 'downgrade' };
    }
    return { text: I18n.t('panel.verdict_sidegrade'), cssClass: 'neutral' };
  }

  function _formatDpsPct(pct) {
    const n = parseFloat(pct) || 0;
    if (n === 0) return '';
    const sign = n > 0 ? '+' : '';
    return `<span class="verdict-pct ${n > 0 ? 'upgrade' : 'downgrade'}">${sign}${n}% ${I18n.t('stats.dps')}</span>`;
  }

  async function refreshBuildFromStorage() {
    processingQueue = [];
    buildReady = false;
    await loadActiveBuildFromStorage();
    clearRenderedPanels();

    if (xmlText) {
      updateStatusBar(I18n.t('statusbar.loading'), 'loading', 'loading');
      vmInitPromise = initBuild();
      return;
    }

    updateStatusBar(I18n.t('statusbar.no_pob'), 'warn', 'no_pob');
  }

  function clearRenderedPanels() {
    document.querySelectorAll('.poe-impact-panel').forEach(panel => panel.remove());
    TradeParser.findResultRows().forEach(row => row.removeAttribute(PANEL_ATTR));
  }

  function rerenderPanelsForLocale() {
    rerenderStatusBar();
    clearRenderedPanels();
    if (buildReady) {
      processAllRows();
    }
  }

  // ── Item Formatting for PoB ──

  function formatItemForPob(parsed) {
    if (!parsed) return null;
    const lines = [];

    // Rarity
    const rarity = _mapFrameType(parsed.frameType);
    lines.push(`Rarity: ${rarity}`);

    // Name and type
    if (parsed.name) lines.push(parsed.name);
    if (parsed.typeLine) lines.push(parsed.typeLine);

    // Properties
    if (parsed.quality) lines.push(`Quality: +${parsed.quality}%`);

    // Weapon properties
    if (parsed.physDamage) lines.push(`Physical Damage: ${parsed.physDamage}`);
    if (parsed.eleDamage) {
      for (const ed of (Array.isArray(parsed.eleDamage) ? parsed.eleDamage : [parsed.eleDamage])) {
        lines.push(`Elemental Damage: ${ed}`);
      }
    }
    if (parsed.chaosDamage) lines.push(`Chaos Damage: ${parsed.chaosDamage}`);
    if (parsed.aps) lines.push(`Attacks per Second: ${parsed.aps}`);
    if (parsed.critChance) lines.push(`Critical Strike Chance: ${parsed.critChance}`);

    // Defence properties
    if (parsed.armour) lines.push(`Armour: ${parsed.armour}`);
    if (parsed.evasion) lines.push(`Evasion Rating: ${parsed.evasion}`);
    if (parsed.energyShield) lines.push(`Energy Shield: ${parsed.energyShield}`);

    // Requirements separator
    lines.push('--------');

    // Implicits
    const implicits = parsed.implicitMods || [];
    if (implicits.length > 0) {
      lines.push(`Implicits: ${implicits.length}`);
      for (const m of implicits) lines.push(m);
    } else {
      lines.push('Implicits: 0');
    }

    // Explicits
    const explicits = [
      ...(parsed.explicitMods || []),
      ...(parsed.craftedMods || []).map(m => '{crafted}' + m),
      ...(parsed.fracturedMods || []).map(m => '{fractured}' + m),
    ];
    for (const m of explicits) lines.push(m);

    return lines.join('\n');
  }

  function _mapFrameType(ft) {
    const map = { 0: 'NORMAL', 1: 'MAGIC', 2: 'RARE', 3: 'UNIQUE' };
    return map[ft] || 'RARE';
  }

  // ── pob.cool Integration ──

  function openPobCool(parsed, pobSlot) {
    if (!pobCoolUrl) return;

    const itemText = formatItemForPob(parsed);
    if (!itemText) return;

    PobCodec.swapItemInBuild(pobCoolUrl, pobSlot, itemText)
      .then(newCode => {
        const url = `https://pob.cool/poe1#build=${encodeURIComponent(newCode)}`;
        window.open(url, '_blank', 'noopener');
      })
      .catch(e => console.error('[Overlay] pob.cool swap failed:', e));
  }

  // ── Utilities ──

  function _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  // ── Boot ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
