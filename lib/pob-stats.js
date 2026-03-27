/**
 * PoB Stats — Extract build information from PoB XML
 * Parses the XML structure and returns normalized stats for display.
 */
const PobStats = (() => {

  /**
   * Parse PoB XML and extract all build data.
   * @param {string} xmlString - Raw PoB XML
   * @returns {object} { buildInfo, stats, items, skills, tree, config, xmlText }
   */
  function extractAll(xmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    if (doc.querySelector('parsererror')) {
      throw new Error('Invalid PoB XML');
    }

    return {
      buildInfo: _extractBuildInfo(doc),
      stats: _extractPlayerStats(doc),
      items: _extractItems(doc),
      skills: _extractSkills(doc),
      tree: _extractTree(doc),
      config: _extractConfig(doc),
      xmlText: xmlString,
    };
  }

  /**
   * Normalize raw PlayerStats into display-friendly format.
   * @param {object} raw - Stats from extractAll().stats
   * @returns {object} Normalized stats
   */
  function normalizeStats(raw) {
    if (!raw) return null;
    const g = (key) => parseFloat(raw[key]) || 0;
    const totalDps = g('TotalDPS') || g('HitDPS') || g('CombinedDPS') || 0;
    return {
      totalDps: Math.round(totalDps),
      fullDps: Math.round(g('FullDPS')),
      averageHit: Math.round(g('AverageDamage') || g('AverageHit')),
      life: Math.round(g('Life')),
      energyShield: Math.round(g('EnergyShield')),
      mana: Math.round(g('Mana')),
      armour: Math.round(g('Armour')),
      evasion: Math.round(g('Evasion')),
      speed: g('Speed'),
      critChance: g('CritChance'),
      fireRes: Math.round(g('FireResist')),
      coldRes: Math.round(g('ColdResist')),
      lightRes: Math.round(g('LightningResist')),
      chaosRes: Math.round(g('ChaosResist')),
    };
  }

  /**
   * Format a number for display (e.g., 1234567 → "1,234,567")
   */
  function formatNumber(n) {
    if (n == null || isNaN(n)) return '0';
    return Math.round(n).toLocaleString('en-US');
  }

  /**
   * Format a diff value with sign and color hint.
   * @returns {{ text: string, cssClass: string }}
   */
  function formatDiff(value, higherIsBetter = true) {
    const rounded = Math.round(value);
    if (rounded === 0) return { text: '—', cssClass: 'neutral' };
    const sign = rounded > 0 ? '+' : '';
    const isGood = higherIsBetter ? rounded > 0 : rounded < 0;
    return {
      text: sign + formatNumber(rounded),
      cssClass: isGood ? 'upgrade' : 'downgrade',
    };
  }

  /**
   * Map a trade item slot to a PoB slot name.
   */
  function mapTradeToPobSlot(slot) {
    const map = {
      'weapon': 'Weapon 1', 'weapon2': 'Weapon 1 Swap',
      'offhand': 'Weapon 2', 'offhand2': 'Weapon 2 Swap',
      'helmet': 'Helmet', 'helm': 'Helmet',
      'body': 'Body Armour', 'bodyarmour': 'Body Armour',
      'gloves': 'Gloves', 'boots': 'Boots',
      'amulet': 'Amulet', 'ring': 'Ring 1', 'ring2': 'Ring 2',
      'belt': 'Belt',
    };
    return map[(slot || '').toLowerCase()] || slot;
  }

  // ── Private extraction functions ──

  function _extractBuildInfo(doc) {
    const buildEl = doc.querySelector('Build');
    if (!buildEl) return {};
    return {
      level: parseInt(buildEl.getAttribute('level')) || 1,
      className: buildEl.getAttribute('className') || '',
      ascendClassName: buildEl.getAttribute('ascendClassName') || '',
      mainSocketGroup: parseInt(buildEl.getAttribute('mainSocketGroup')) || 1,
      bandit: buildEl.getAttribute('bandit') || 'None',
      pantheonMajorGod: buildEl.getAttribute('pantheonMajorGod') || 'None',
      pantheonMinorGod: buildEl.getAttribute('pantheonMinorGod') || 'None',
      useSecondWeaponSet: buildEl.getAttribute('weaponSet1Enabled') === 'true'
        ? false : buildEl.getAttribute('weaponSet2Enabled') === 'true',
    };
  }

  function _extractPlayerStats(doc) {
    const stats = {};
    const statEls = doc.querySelectorAll('Build PlayerStat');
    for (const el of statEls) {
      const stat = el.getAttribute('stat');
      const value = el.getAttribute('value');
      if (stat && value) stats[stat] = parseFloat(value);
    }
    return stats;
  }

  function _extractItems(doc) {
    const itemsEl = doc.querySelector('Items');
    if (!itemsEl) return [];
    const items = [];

    // Get active item set
    const activeSetId = itemsEl.getAttribute('activeItemSet') || '1';
    const activeSet = itemsEl.querySelector(`ItemSet[id="${activeSetId}"]`) || itemsEl.querySelector('ItemSet');

    // Parse slot → itemId mapping
    const slotMap = {};
    const slotEls = activeSet ? activeSet.querySelectorAll('Slot') : itemsEl.querySelectorAll('Slot');
    for (const el of slotEls) {
      const name = el.getAttribute('name');
      const id = parseInt(el.getAttribute('itemId'));
      if (name && id) slotMap[id] = name;
    }

    // Parse items
    const itemEls = itemsEl.querySelectorAll('Item');
    for (const el of itemEls) {
      const id = parseInt(el.getAttribute('id'));
      const raw = (el.textContent || '').trim();
      if (!raw) continue;

      const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
      const rarity = _parseRarity(lines);
      const { name, typeLine } = _parseNameTypeLine(lines, rarity);

      items.push({
        id,
        slot: slotMap[id] || '',
        rarity,
        name,
        typeLine,
        raw,
        quality: _parseQuality(lines),
        implicitMods: _parseMods(lines, 'Implicits'),
        explicitMods: _parseMods(lines, 'Explicits'),
        craftedMods: _parseMods(lines, 'Crafted'),
        enchantMods: _parseMods(lines, 'Enchant'),
      });
    }
    return items;
  }

  function _extractSkills(doc) {
    const skills = [];
    const skillEls = doc.querySelectorAll('Skills Skill');
    for (const el of skillEls) {
      const gems = [];
      for (const gemEl of el.querySelectorAll('Gem')) {
        gems.push({
          nameSpec: gemEl.getAttribute('nameSpec') || '',
          skillId: gemEl.getAttribute('skillId') || '',
          gemId: gemEl.getAttribute('gemId') || '',
          level: parseInt(gemEl.getAttribute('level')) || 1,
          quality: parseInt(gemEl.getAttribute('quality')) || 0,
          enabled: gemEl.getAttribute('enabled') !== 'false',
        });
      }
      skills.push({
        enabled: el.getAttribute('enabled') !== 'false',
        slot: el.getAttribute('slot') || '',
        label: el.getAttribute('label') || '',
        mainActive: parseInt(el.getAttribute('mainActiveSkill')) || 1,
        gems,
      });
    }
    return skills;
  }

  function _extractTree(doc) {
    const specEl = doc.querySelector('Tree Spec[treeVersion]');
    const treeVersion = specEl ? specEl.getAttribute('treeVersion') : '3_28';
    const urlEl = specEl ? specEl.querySelector('URL') : null;
    const treeUrl = urlEl ? (urlEl.textContent || '').trim() : '';
    const treeNodes = _parseTreeNodes(treeUrl);
    const ascendClassId = specEl ? parseInt(specEl.getAttribute('ascendClassId')) || 0 : 0;

    // Parse mastery effects
    const masteryEffects = [];
    const masteryEl = specEl ? specEl.querySelector('MasteryEffects') : null;
    if (masteryEl) {
      const text = (masteryEl.textContent || '').trim();
      for (const pair of text.split(',').filter(Boolean)) {
        const [nodeId, effectId] = pair.split(':').map(Number);
        if (nodeId && effectId) masteryEffects.push({ nodeId, effectId });
      }
    }

    return { treeVersion, treeUrl, treeNodes, ascendClassId, masteryEffects };
  }

  function _extractConfig(doc) {
    const config = {};
    const inputEls = doc.querySelectorAll('Config Input');
    for (const el of inputEls) {
      const name = el.getAttribute('name');
      if (!name) continue;
      if (el.hasAttribute('boolean')) {
        config[name] = el.getAttribute('boolean') === 'true';
      } else if (el.hasAttribute('number')) {
        config[name] = parseFloat(el.getAttribute('number'));
      } else if (el.hasAttribute('string')) {
        config[name] = el.getAttribute('string');
      }
    }
    return config;
  }

  // ── Parsing helpers ──

  function _parseRarity(lines) {
    const header = lines[0] || '';
    if (header.startsWith('Rarity: ')) return header.replace('Rarity: ', '');
    return 'RARE';
  }

  function _parseNameTypeLine(lines, rarity) {
    if (rarity === 'UNIQUE' || rarity === 'RARE') {
      return { name: lines[1] || '', typeLine: lines[2] || '' };
    }
    return { name: '', typeLine: lines[1] || '' };
  }

  function _parseQuality(lines) {
    for (const line of lines) {
      const m = line.match(/^Quality:\s*\+?(\d+)%?$/);
      if (m) return parseInt(m[1]);
    }
    return 0;
  }

  function _parseMods(lines, section) {
    // PoB items use section headers like "{range:0.5}Implicits: 1"
    const mods = [];
    let inSection = false;
    let count = 0;
    for (const line of lines) {
      const headerMatch = line.match(new RegExp(`${section}:\\s*(\\d+)`));
      if (headerMatch) {
        inSection = true;
        count = parseInt(headerMatch[1]);
        continue;
      }
      if (inSection && count > 0) {
        // Strip range prefix like "{range:0.5}"
        const clean = line.replace(/^\{[^}]+\}/, '').trim();
        if (clean) mods.push(clean);
        count--;
        if (count <= 0) inSection = false;
      }
    }
    return mods;
  }

  function _parseTreeNodes(url) {
    if (!url) return [];
    const hashPart = url.split('#')[1] || url.split('/').pop() || '';
    // Tree URL format: .../#version/base64data or just plain node list
    try {
      const parts = hashPart.split('/');
      const data = parts[parts.length - 1] || '';
      if (!data) return [];
      // Decode tree data (base64 encoded node IDs)
      const decoded = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
      const bytes = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
      // Skip header bytes, read 2-byte node IDs
      const nodes = [];
      const headerSize = 7; // standard PoE tree header
      for (let i = headerSize; i + 1 < bytes.length; i += 2) {
        nodes.push((bytes[i] << 8) | bytes[i + 1]);
      }
      return nodes;
    } catch {
      return [];
    }
  }

  return {
    extractAll,
    normalizeStats,
    formatNumber,
    formatDiff,
    mapTradeToPobSlot,
  };
})();

if (typeof module !== 'undefined') module.exports = PobStats;
