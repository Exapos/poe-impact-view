/**
 * Popup — Build import & stats display
 */

/* global PobCodec, PobStats, I18n, BuildStorage, pobLuaVM, chrome */

(function () {
  'use strict';

  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  const langSelect = document.getElementById('lang-select');
  const buildNameInput = document.getElementById('build-name');
  const btnImport = document.getElementById('btn-import');
  const inputPob = document.getElementById('input-pob');
  const importStatus = document.getElementById('import-status');
  const buildList = document.getElementById('build-list');
  const buildInfo = document.getElementById('build-info');
  const buildItems = document.getElementById('build-items');
  const calcStats = document.getElementById('calc-stats');

  let popupState = { builds: [], activeBuildId: null, activeBuild: null };

  // ── Tab switching ──
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });

  // ── Language selector ──
  langSelect.addEventListener('change', async () => {
    await I18n.setLocale(langSelect.value);
    renderAll();
  });

  // ── Import ──
  btnImport.addEventListener('click', handleImport);
  buildList.addEventListener('click', handleBuildListClick);
  chrome.storage.onChanged.addListener(handleStorageChange);

  async function handleImport() {
    const raw = inputPob.value.trim();
    const customName = buildNameInput.value.trim();
    if (!raw) return showStatus(I18n.t('import.validating'), 'warn');

    showStatus(I18n.t('import.decoding'), 'loading');
    btnImport.disabled = true;

    try {
      let pobCode = raw;

      // Handle pobb.in URLs
      if (raw.includes('pobb.in/')) {
        showStatus(I18n.t('import.fetching'), 'loading');
        pobCode = await PobCodec.fetchFromPobbIn(raw);
      }

      // Handle pob.cool URLs → extract code from hash
      if (raw.includes('pob.cool/')) {
        const hash = raw.split('#build=')[1] || raw.split('#')[1] || '';
        if (hash) {
          pobCode = decodeURIComponent(hash);
          // Also save the pob.cool URL for iframe integration
          await chrome.storage.local.set({ pobCoolUrl: pobCode });
        }
      }

      // Decode and extract
      showStatus(I18n.t('import.decoding'), 'loading');
      const xml = await PobCodec.decode(pobCode);
      const extracted = PobStats.extractAll(xml);
      const stats = PobStats.normalizeStats(extracted.stats);

      // Run live calculation via headless PoB
      showStatus(I18n.t('import.calculating'), 'loading');
      let liveStats = null;
      try {
        liveStats = await pobLuaVM.initBuildFromXml(xml);
      } catch (e) {
        console.warn('[Popup] Live calc failed, using cached stats:', e.message);
      }

      const finalStats = liveStats || stats;

      const build = {
        name: customName || BuildStorage.getDefaultBuildName({ buildInfo: extracted.buildInfo }),
        buildInfo: extracted.buildInfo,
        stats: extracted.stats,
        items: extracted.items,
        skills: extracted.skills,
        config: extracted.config,
        liveStats: liveStats || null,
        xmlText: xml,
        importedAt: Date.now(),
        pobCode: pobCode,
      };
      await BuildStorage.addBuild(build);

      showStatus(I18n.t('import.success'), 'ok');
      await refreshState();
      renderBuildDetails(build, finalStats);
      renderCalcStats(finalStats);

      // Switch to build tab
      document.querySelector('[data-tab="build"]').click();
      inputPob.value = '';

    } catch (e) {
      console.error('[Popup] Import failed:', e);
      showStatus(I18n.t('import.err_decode', { msg: e.message }), 'error');
    } finally {
      btnImport.disabled = false;
    }
  }

  async function handleBuildListClick(event) {
    const actionButton = event.target.closest('[data-build-action]');
    if (!actionButton) return;

    const buildId = actionButton.getAttribute('data-build-id');
    if (!buildId) return;

    if (actionButton.getAttribute('data-build-action') === 'select') {
      await BuildStorage.setActiveBuild(buildId);
      await refreshState();
      renderAll();
      return;
    }

    if (actionButton.getAttribute('data-build-action') === 'delete') {
      if (!confirm(I18n.t('build.confirm_delete'))) return;
      await BuildStorage.deleteBuild(buildId);
      await refreshState();
      renderAll();
    }
  }

  async function handleStorageChange(changes) {
    if (changes.i18n_locale && changes.i18n_locale.newValue && changes.i18n_locale.newValue !== I18n.getLocale()) {
      I18n.setLocale(changes.i18n_locale.newValue, false);
      renderAll();
      return;
    }

    if (changes.pobBuilds || changes.activeBuildId || changes.pobData) {
      await refreshState();
      renderAll();
    }
  }

  function showStatus(text, type) {
    importStatus.textContent = text;
    importStatus.className = `status status-${type}`;
  }

  async function refreshState() {
    popupState = await BuildStorage.getState();
  }

  function renderAll() {
    document.title = I18n.t('popup.title');
    I18n.applyToDom(document);
    langSelect.value = I18n.getLocale();
    renderBuildList();

    const activeBuild = popupState.activeBuild;
    const stats = activeBuild
      ? (activeBuild.liveStats || PobStats.normalizeStats(activeBuild.stats))
      : null;

    if (!activeBuild || !stats) {
      renderEmptyBuildState();
      return;
    }

    renderBuildDetails(activeBuild, stats);
    renderCalcStats(stats);
  }

  function renderBuildList() {
    if (!popupState.builds.length) {
      buildList.innerHTML = `<p class="empty-state" data-i18n="build.no_builds">${I18n.t('build.no_builds')}</p>`;
      return;
    }

    buildList.innerHTML = `
      <h3>${I18n.t('build.saved_heading')}</h3>
      <div class="saved-build-list">
        ${popupState.builds.map(build => {
          const info = build.buildInfo || {};
          const isActive = build.id === popupState.activeBuildId;
          const label = info.ascendClassName || info.className || build.name;
          const meta = [label, info.level ? `Lv.${info.level}` : null, formatImportedAt(build.importedAt)]
            .filter(Boolean)
            .join(' • ');

          return `
            <div class="saved-build-card ${isActive ? 'active' : ''}">
              <div class="saved-build-meta">
                <div class="saved-build-name">
                  <span>${escapeHtml(build.name)}</span>
                  ${isActive ? `<span class="saved-build-badge">${I18n.t('build.active_badge')}</span>` : ''}
                </div>
                <div class="saved-build-subtitle">${escapeHtml(meta)}</div>
              </div>
              <div class="saved-build-actions">
                <button class="btn-secondary" data-build-action="select" data-build-id="${build.id}" title="${I18n.t('build.select_title')}" ${isActive ? 'disabled' : ''}>${I18n.t('tab.build')}</button>
                <button class="btn-danger-inline" data-build-action="delete" data-build-id="${build.id}" title="${I18n.t('build.delete_title')}">✕</button>
              </div>
            </div>`;
        }).join('')}
      </div>
    `;
  }

  function renderEmptyBuildState() {
    buildInfo.innerHTML = `<p class="empty-state" data-i18n="build.empty">${I18n.t('build.empty')}</p>`;
    buildItems.innerHTML = '';
    calcStats.innerHTML = `<p class="empty-state" data-i18n="calc.empty">${I18n.t('calc.empty')}</p>`;
  }

  function renderBuildDetails(build, stats) {
    const info = build.buildInfo || {};
    const levelLabel = info.level ? `Lv.${info.level}` : '';
    buildInfo.innerHTML = `
      <div class="build-header">
        <span class="build-class">${escapeHtml(info.ascendClassName || info.className || build.name)}</span>
        <span class="build-level">${levelLabel}</span>
      </div>
      <div class="build-stats-summary">
        <div class="stat-chip dps">⚔️ ${PobStats.formatNumber(stats.totalDps)} ${I18n.t('stats.dps')}</div>
        <div class="stat-chip life">❤️ ${PobStats.formatNumber(stats.life)} ${I18n.t('stats.life')}</div>
        ${stats.energyShield > 0 ? `<div class="stat-chip es">🛡️ ${PobStats.formatNumber(stats.energyShield)} ${I18n.t('stats.es')}</div>` : ''}
      </div>
    `;

    // Render equipped items
    const equippedItems = (build.items || []).filter(i => i.slot);
    if (equippedItems.length > 0) {
      buildItems.innerHTML = `
        <h3>${I18n.t('build.equipment')}</h3>
        <div class="item-list">
          ${equippedItems.map(item => `
            <div class="item-row">
              <span class="item-slot">${escapeHtml(item.slot)}</span>
              <span class="item-name rarity-${(item.rarity || 'RARE').toLowerCase()}">${escapeHtml(item.name || item.typeLine)}</span>
            </div>
          `).join('')}
        </div>
      `;
      return;
    }

    buildItems.innerHTML = `<p class="empty-state">${I18n.t('build.no_equipment')}</p>`;
  }

  // ── Render Calc Stats ──

  function renderCalcStats(stats) {
    if (!stats) return;
    calcStats.innerHTML = `
      <div class="stat-card offence">
        <h3>⚔️ ${I18n.t('calc.offence')}</h3>
        <div class="stat-row"><span>${I18n.t('calc.total_dps')}</span><span class="stat-value dps">${PobStats.formatNumber(stats.totalDps)}</span></div>
        ${stats.averageHit ? `<div class="stat-row"><span>${I18n.t('calc.hit_dps')}</span><span class="stat-value">${PobStats.formatNumber(stats.averageHit)}</span></div>` : ''}
        <div class="stat-row"><span>${I18n.t('calc.crit_chance')}</span><span class="stat-value">${(stats.critChance || 0).toFixed(1)}%</span></div>
        <div class="stat-row"><span>${I18n.t('calc.cast_spd')}</span><span class="stat-value">${(stats.speed || 0).toFixed(2)}</span></div>
      </div>
      <div class="stat-card defence">
        <h3>🛡️ ${I18n.t('calc.defence')}</h3>
        <div class="stat-row"><span>${I18n.t('calc.life')}</span><span class="stat-value life">${PobStats.formatNumber(stats.life)}</span></div>
        <div class="stat-row"><span>${I18n.t('calc.energy_shield')}</span><span class="stat-value es">${PobStats.formatNumber(stats.energyShield)}</span></div>
        <div class="stat-row"><span>${I18n.t('calc.mana')}</span><span class="stat-value mana">${PobStats.formatNumber(stats.mana)}</span></div>
        <div class="stat-row"><span>${I18n.t('calc.armour')}</span><span class="stat-value">${PobStats.formatNumber(stats.armour)}</span></div>
        <div class="stat-row"><span>${I18n.t('calc.evasion')}</span><span class="stat-value">${PobStats.formatNumber(stats.evasion)}</span></div>
      </div>
      <div class="stat-card resists">
        <h3>🔥 ${I18n.t('calc.resistances')}</h3>
        <div class="stat-row"><span>🔥 ${I18n.t('panel.lbl_fire')}</span><span class="stat-value">${stats.fireRes || 0}%</span></div>
        <div class="stat-row"><span>❄️ ${I18n.t('panel.lbl_cold')}</span><span class="stat-value">${stats.coldRes || 0}%</span></div>
        <div class="stat-row"><span>⚡ ${I18n.t('panel.lbl_lightning')}</span><span class="stat-value">${stats.lightRes || 0}%</span></div>
        <div class="stat-row"><span>☠️ ${I18n.t('panel.lbl_chaos')}</span><span class="stat-value">${stats.chaosRes || 0}%</span></div>
      </div>
    `;
  }

  function formatImportedAt(timestamp) {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return '';
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  // ── Load saved build on popup open ──

  async function bootstrap() {
    await I18n.init();
    await refreshState();
    renderAll();
  }

  bootstrap();

})();
