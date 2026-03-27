/**
 * Trade Page Item Parser
 * Parses item data from pathofexile.com/trade DOM elements
 */

const TradeParser = (() => {

  function detectSlotFromCategory(category) {
    const cat = (category || '').toLowerCase();

    if (/\bring\b/.test(cat)) return 'Ring';
    if (cat.includes('amulet') || cat.includes('talisman') || cat.includes('pendant') ||
        cat.includes('jade amulet') || cat.includes('gold amulet') || cat.includes('amber amulet') ||
        cat.includes('lapis amulet') || cat.includes('onyx amulet') || cat.includes('citrine amulet') ||
        cat.includes('turquoise amulet') || cat.includes('marble amulet') || cat.includes('crystal belt') ||
        cat.includes('blue pearl amulet') || cat.includes('opaline amulet')) return 'Amulet';
    if (cat.includes('belt') || cat.includes('sash') || cat.includes('stygian vise') || cat.includes('vise') ||
        cat.includes('studded belt') || cat.includes('leather belt') || cat.includes('rustic sash') ||
        cat.includes('heavy belt') || cat.includes('chain belt') || cat.includes('cloth belt') ||
        cat.includes('golden obi') || cat.includes('wurm\'s molt') || cat.includes('ample sash') ||
        cat.includes('mechalarm belt')) return 'Belt';

    if (cat.includes('wand') || cat.includes('sword') || cat.includes('axe') ||
        cat.includes('mace') || cat.includes('club') || cat.includes('dagger') ||
        cat.includes('sceptre') || cat.includes('staff') || cat.includes('bow') ||
        cat.includes('claw') || cat.includes('flail') || cat.includes('foil') ||
        cat.includes('rapier') || cat.includes('weapon') || cat.includes('warstaff') ||
        cat.includes('crossbow') || cat.includes('spear') || cat.includes('quarterstaff') ||
        cat.includes('glaive') || cat.includes('zweihander') || cat.includes('scimitar') ||
        cat.includes('maul') || cat.includes('falchion') || cat.includes('estoc')) return 'Weapon';

    if (cat.includes('shield') || cat.includes('buckler') || cat.includes('quiver') ||
        cat.includes('spirit shield') || /\bfocus\b/.test(cat) ||
        cat.includes('tower shield') || cat.includes('fir round shield') ||
        cat.includes('kite shield') || cat.includes('spiked shield')) return 'Offhand';

    if (cat.includes('helmet') || cat.includes('helm') || cat.includes('circlet') ||
        cat.includes('cage') || cat.includes('burgonet') || cat.includes('bascinet') ||
        cat.includes('hood') || cat.includes('pelt') || cat.includes('tricorne') ||
        cat.includes('sallet') || cat.includes('crown') || cat.includes('coif') ||
        cat.includes('mask') || cat.includes('bone helmet') || cat.includes('cone helmet') ||
        cat.includes('iron hat') || cat.includes('leather cap') || cat.includes('visage') ||
        cat.includes('great helm') || cat.includes('royal burgonet') || cat.includes('siege helmet') ||
        cat.includes('praetor crown') || cat.includes('eternal burgonet') || cat.includes('diadem') ||
        cat.includes('hubris circlet') || cat.includes('nightmare bascinet') || cat.includes('fluted bascinet')) return 'Helm';

    if (cat.includes('glove') || cat.includes('gauntlet') || cat.includes('mitts') ||
        cat.includes('grips') || cat.includes('fists') || cat.includes('wrapped mitts') ||
        cat.includes('fishscale gauntlets') || cat.includes('iron gauntlets') ||
        cat.includes('mesh gloves') || cat.includes('riveted gloves') || cat.includes('siege gauntlets') ||
        cat.includes('slink gloves') || cat.includes('shadow gauntlets') || cat.includes('dragonscale gauntlets') ||
        cat.includes('sorcerer gloves') || cat.includes('ambush mitts') || cat.includes('assassin\'s mitts') ||
        cat.includes('fingerless silk gloves') || cat.includes('wool gloves')) return 'Gloves';

    if (cat.includes('boot') || cat.includes('greave') || cat.includes('slipper') ||
        cat.includes('shoes') || cat.includes('leaguers') || cat.includes('tracks') ||
        cat.includes('iron greaves') || cat.includes('steel greaves') || cat.includes('plated greaves') ||
        cat.includes('reinforced greaves') || cat.includes('antique greaves') || cat.includes('ancient greaves') ||
        cat.includes('goathide boots') || cat.includes('wool shoes') || cat.includes('velvet slippers') ||
        cat.includes('silk slippers') || cat.includes('scholar boots') || cat.includes('slink boots') ||
        cat.includes('shadow boots') || cat.includes('dragonscale boots') || cat.includes('sorcerer boots') ||
        cat.includes('assassin\'s boots') || cat.includes('two-toned boots') || cat.includes('shagreen boots')) return 'Boots';

    if (cat.includes('plate') || cat.includes('regalia') || cat.includes('robe') ||
        cat.includes('garb') || cat.includes('vestment') || cat.includes('vest') ||
        cat.includes('tunic') || cat.includes('leather') || cat.includes('brigandine') ||
        cat.includes('lamellar') || cat.includes('doublet') || cat.includes('hauberk') ||
        cat.includes('chainmail') || cat.includes('ringmail') || cat.includes('mail') ||
        cat.includes('coat') || cat.includes('jacket') || cat.includes('silks') ||
        cat.includes('raiment') || cat.includes('wrap') || cat.includes('jerkin') ||
        cat.includes('body') || cat.includes('chest') || cat.includes('wyrmscale') ||
        cat.includes('dragonscale') || cat.includes('full scale') || cat.includes('chestplate') ||
        cat.includes('occultist') || cat.includes('sacrificial garb') || cat.includes('carnal armour') ||
        cat.includes('astral') || cat.includes('zodiac') || cat.includes('assassin\'s garb') ||
        cat.includes('glorious') || cat.includes('coronal') || cat.includes('sadist garb') ||
        cat.includes('breastplate') || cat.includes('battle plate') || cat.includes('full plate') ||
        cat.includes('savant\'s robe') || cat.includes('arcanist\'s') || cat.includes('scholar\'s')) return 'BodyArmour';

    return null;
  }

  function detectItemType(parsedItem) {
    const hasWeaponProps = !!(parsedItem.aps || parsedItem.physDamage || parsedItem.dps);
    const hasDefenceProps = !!(parsedItem.armour || parsedItem.evasion || parsedItem.energyShield);

    if (hasWeaponProps) return 'weapon';

    const slot = detectSlotFromCategory(parsedItem.typeLine);
    if (slot === 'Offhand') return 'shield';
    if (slot === 'Amulet' || slot === 'Ring' || slot === 'Belt') return 'accessory';
    if (hasDefenceProps || slot === 'Helm' || slot === 'BodyArmour' || slot === 'Gloves' || slot === 'Boots') {
      return 'armour';
    }

    return 'accessory';
  }

  function detectSlot(parsedItem) {
    const slotFromKeywords = detectSlotFromCategory(parsedItem.typeLine);
    if (slotFromKeywords) return slotFromKeywords;

    if (parsedItem.aps || parsedItem.physDamage || parsedItem.dps) return 'Weapon';
    if (parsedItem.armour || parsedItem.evasion || parsedItem.energyShield) return 'BodyArmour';
    return 'Weapon';
  }

  /**
   * Parse a single trade result row into a structured item object.
   * Works with the PoE trade site DOM structure.
   */
  function parseResultRow(row) {
    const item = {
      name: '',
      typeLine: '',
      frameType: 2,   // default to rare
      slot: 'Weapon',
      itemLevel: null,
      quality: null,
      sockets: null,
      levelReq: null,
      reqStr: null,
      reqDex: null,
      reqInt: null,
      corrupted: false,
      physDamage: null,
      noPhysicalDamage: false,
      eleDamage: null,
      chaosDamage: null,
      aps: null,
      critChance: null,
      armour: null,
      evasion: null,
      energyShield: null,
      implicitMods: [],
      explicitMods: [],
      craftedMods: [],
      enchantMods: [],
      fracturedMods: [],
      dps: null,
      physDps: null,
      eleDps: null,
      price: null,
      currency: null
    };

    const knownMods = new Set();
    const addMod = (bucket, rawText) => {
      const modText = _cleanMod(rawText);
      if (!modText) return;
      if (isNonModText(modText)) return;
      if (knownMods.has(modText)) return;
      bucket.push(modText);
      knownMods.add(modText);
    };

    // ── Parse item name & type ──
    const nameEl = row.querySelector('.itemName span, .lc .itemName');
    const typeEl = row.querySelector('.typeLine span, .lc .typeLine');
    const itemHeader = row.querySelector('.itemHeader, [class*="itemHeader"], [class*="header"], .doubleLine');

    if (nameEl) item.name = nameEl.textContent.trim();
    if (typeEl) item.typeLine = typeEl.textContent.trim();

    // Detect rarity from header class
    {
      const rarityClassScan = Array.from(row.querySelectorAll('[class]')).map(el => String(el.className)).join(' ');
      if ((itemHeader && (itemHeader.classList.contains('unique') || itemHeader.querySelector('.unique'))) || /\bunique\b/i.test(rarityClassScan)) {
        item.frameType = 3;
      } else if ((itemHeader && (itemHeader.classList.contains('magic') || itemHeader.querySelector('.magic'))) || /\bmagic\b/i.test(rarityClassScan)) {
        item.frameType = 1;
      } else if ((itemHeader && (itemHeader.classList.contains('normal') || itemHeader.querySelector('.normal'))) || /\bnormal\b/i.test(rarityClassScan)) {
        item.frameType = 0;
      } else {
        item.frameType = 2;
      }
    }

    // Detect slot at the end of parsing so property-based fallback is available.

    // ── Parse item-level (shown as text near the bottom of the item box) ──
    const itemLevelEl = row.querySelector('.itemLevel, [class*="itemLevel"]');
    if (itemLevelEl) {
      const m = itemLevelEl.textContent.match(/(\d+)/);
      if (m) item.itemLevel = parseInt(m[1]);
    }
    const propGroups = row.querySelectorAll('.property');
    for (const prop of propGroups) {
      const text = prop.textContent.trim();

      const physMatch = text.match(/Physical Damage:\s*(\d+[\-–]\d+)/i);
      if (physMatch) item.physDamage = physMatch[1].replace('–', '-');

      if (/^No Physical Damage$/i.test(text)) {
        item.noPhysicalDamage = true;
        item.physDamage = '0-0';
      }

      const eleMatch = text.match(/Elemental Damage:\s*(.+)/i);
      if (eleMatch) item.eleDamage = parseEleDamageString(eleMatch[1]);

      const apsMatch = text.match(/Attacks per Second:\s*([\d.]+)/i);
      if (apsMatch) item.aps = apsMatch[1];

      const critMatch = text.match(/Critical (?:Strike )?Chance:\s*([\d.]+)/i);
      if (critMatch) item.critChance = critMatch[1];

      const armourMatch = text.match(/Armour:\s*(\d+)/i);
      if (armourMatch) item.armour = armourMatch[1];

      const evasionMatch = text.match(/Evasion(?: Rating)?:\s*(\d+)/i);
      if (evasionMatch) item.evasion = evasionMatch[1];

      const esMatch = text.match(/Energy Shield:\s*(\d+)/i);
      if (esMatch) item.energyShield = esMatch[1];

      const qualMatch = text.match(/Quality:\s*\+?(\d+)/i);
      if (qualMatch) item.quality = parseInt(qualMatch[1]);

      // Item Level (sometimes appears as a property line)
      const ilMatch = text.match(/Item Level:\s*(\d+)/i);
      if (ilMatch && !item.itemLevel) item.itemLevel = parseInt(ilMatch[1]);

      // LevelReq — "Requires Level 64" or "Level: 64" but NOT "Item Level"
      if (!text.match(/Item Level/i)) {
        const reqMatch = text.match(/(?:Requires\s+)?Level[:\s]+?(\d+)/i);
        if (reqMatch) item.levelReq = parseInt(reqMatch[1]);
        const intReqMatch = text.match(/(?:^|[,\s])(\d+)\s*Int\b/i);
        if (intReqMatch) item.reqInt = parseInt(intReqMatch[1]);
        const dexReqMatch = text.match(/(?:^|[,\s])(\d+)\s*Dex\b/i);
        if (dexReqMatch) item.reqDex = parseInt(dexReqMatch[1]);
        const strReqMatch = text.match(/(?:^|[,\s])(\d+)\s*Str\b/i);
        if (strReqMatch) item.reqStr = parseInt(strReqMatch[1]);
      }

      // Sockets — "Sockets: G=G=G=G=G=G"; '=' means linked, ' ' between groups means unlinked group
      // Convert to PoB format: '=' → '-', keep ' ' as group separator
      const sockMatch = text.match(/Sockets:\s*([A-WRGBa-wrgb\s=\-]+)/i);
      if (sockMatch) {
        item.sockets = sockMatch[1].trim().toUpperCase().replace(/=/g, '-');
      }
    }

    // Also try parsing from the stat group / grouped mods area
    const statGroups = row.querySelectorAll('.groupedMods .group, .itemBoxContent .group');
    for (const group of statGroups) {
      const spans = group.querySelectorAll('span');
      for (const sp of spans) {
        const text = sp.textContent.trim();
        if (!text) continue;

        const physMatch = text.match(/Physical Damage:\s*(\d+[\-–]\d+)/i);
        if (physMatch) item.physDamage = physMatch[1].replace('–', '-');

        if (/^No Physical Damage$/i.test(text)) {
          item.noPhysicalDamage = true;
          item.physDamage = '0-0';
        }

        const apsMatch = text.match(/Attacks per Second:\s*([\d.]+)/i);
        if (apsMatch) item.aps = apsMatch[1];

        const critMatch = text.match(/Critical (?:Strike )?Chance:\s*([\d.]+)/i);
        if (critMatch) item.critChance = critMatch[1];
      }
    }

    // ── Parse mods ──
    // PoE trade DOM: each mod is a <span class="lc s" data-field="stat.explicit.stat_XXXXXXXX">
    // The text content is the clean mod text — no child spans, no noise.
    // data-field prefix determines type: stat.explicit / stat.implicit / stat.crafted /
    //   stat.fractured / stat.enchant / stat.pseudo (skip pseudo)
    const modSpans = row.querySelectorAll('[data-field^="stat."]');
    for (const modEl of modSpans) {
      const field = modEl.getAttribute('data-field') || '';
      if (field.startsWith('stat.pseudo')) continue; // pseudo stats are computed, not real mods
      const modText = extractModText(modEl);
      if (!modText) continue;

      if (field.startsWith('stat.implicit')) {
        addMod(item.implicitMods, modText);
      } else if (field.startsWith('stat.crafted')) {
        addMod(item.craftedMods, modText);
      } else if (field.startsWith('stat.enchant')) {
        addMod(item.enchantMods, modText);
      } else if (field.startsWith('stat.fractured')) {
        addMod(item.fracturedMods, modText);
      } else {
        addMod(item.explicitMods, modText);
      }
    }

    // Fallback for trade rows that render some real modifiers without stat.* data-field tags.
    const fallbackModEls = row.querySelectorAll('.groupedMods .group > *, .itemBoxContent .group > *');
    for (const modEl of fallbackModEls) {
      if (modEl.matches('[data-field^="stat."]')) continue;
      const modText = extractModText(modEl);
      if (!modText) continue;
      addMod(item.explicitMods, modText);
    }

    // ── Parse DPS display (bottom bar of trade result) ──
    const dpsEls = row.querySelectorAll('[data-field="dps"], [data-field="pdps"], [data-field="edps"]');
    for (const dpsEl of dpsEls) {
      const val = parseFloat(dpsEl.textContent);
      const field = dpsEl.getAttribute('data-field');
      if (field === 'dps') item.dps = val;
      if (field === 'pdps') item.physDps = val;
      if (field === 'edps') item.eleDps = val;
    }

    // Also try the .dps text at bottom
    const dpsText = row.querySelector('.bottom .dps, .resultBottom');
    if (dpsText) {
      const dpsMatch = dpsText.textContent.match(/DPS:\s*([\d.]+)/i);
      if (dpsMatch) item.dps = parseFloat(dpsMatch[1]);
      const pdpsMatch = dpsText.textContent.match(/Physical DPS:\s*([\d.]+)/i);
      if (pdpsMatch) item.physDps = parseFloat(pdpsMatch[1]);
    }

    // ── Parse price ──
    const priceEl = row.querySelector('.price [data-field="price"]') ||
                    row.querySelector('.price') ||
                    row.querySelector('[class*="price"]');
    if (priceEl) {
      const priceText = priceEl.textContent.trim();
      const priceMatch = priceText.match(/([\d.]+)\s*(.+)/);
      if (priceMatch) {
        item.price = parseFloat(priceMatch[1]);
        item.currency = priceMatch[2].trim();
      }
    }

    // Last-resort text fallback for trade layouts that don't expose structured property/mod nodes.
    const fallbackLines = extractRowTextLines(row);
    for (const text of fallbackLines) {
      if (!item.noPhysicalDamage && /^No Physical Damage$/i.test(text)) {
        item.noPhysicalDamage = true;
        item.physDamage = '0-0';
        continue;
      }
      if (!item.aps) {
        const apsMatch = text.match(/^Attacks per Second:\s*([\d.]+)/i);
        if (apsMatch) {
          item.aps = apsMatch[1];
          continue;
        }
      }
      if (!item.critChance) {
        const critMatch = text.match(/^Critical (?:Strike )?Chance:\s*([\d.]+)/i);
        if (critMatch) {
          item.critChance = critMatch[1];
          continue;
        }
      }
      if (!item.itemLevel) {
        const ilvlMatch = text.match(/^Item Level:\s*(\d+)/i);
        if (ilvlMatch) {
          item.itemLevel = parseInt(ilvlMatch[1]);
          continue;
        }
      }
      if (!item.levelReq) {
        const reqMatch = text.match(/^Requires Level\s*(\d+)/i);
        if (reqMatch) {
          item.levelReq = parseInt(reqMatch[1]);
        }
      }
      if (!item.reqInt) {
        const intReqMatch = text.match(/(?:^|[,\s])(\d+)\s*Int\b/i);
        if (intReqMatch) {
          item.reqInt = parseInt(intReqMatch[1]);
        }
      }
      if (!item.reqDex) {
        const dexReqMatch = text.match(/(?:^|[,\s])(\d+)\s*Dex\b/i);
        if (dexReqMatch) {
          item.reqDex = parseInt(dexReqMatch[1]);
        }
      }
      if (!item.reqStr) {
        const strReqMatch = text.match(/(?:^|[,\s])(\d+)\s*Str\b/i);
        if (strReqMatch) {
          item.reqStr = parseInt(strReqMatch[1]);
        }
      }
      if (isLikelyModText(text)) {
        addMod(item.explicitMods, text);
      }
    }

    // ── Slot detection (done after all properties are parsed so fallback on armour/weapon props works) ──
    item.slot = detectSlot(item);

    return item;
  }


  /**
   * Extract clean mod text from a mod DOM element.
   *
   * The PoE trade site wraps extra metadata inside child <span>s:
   *   - tier label       e.g. <span>S1</span> or <span>P1</span>
   *   - roll range       e.g. <span>[33-36]</span>
   *   - affix name       e.g. <span>Carbonising</span>
   *   - req-level        e.g. <span>(82)</span>
   *   - PoB support tag  e.g. <span>(Not supported in PoB yet)</span>
   *
   * Strategy: take only direct-child TEXT NODES (skips all child spans).
   * If that yields nothing useful, fall back to full textContent with
   * regex cleanup.
   */
  // ── Unified mod-text cleaning pipeline ──
  // Applied after every extraction strategy so none returns noisy text.
  function _cleanMod(t) {
    if (!t) return '';
    t = String(t);
    // Tier prefix at start: S1, P1, R2, etc.
    t = t.replace(/^\s*[A-Z]\d+\s*/, '');
    // Roll-range brackets: [33-36] or [165-225 to 335-390]
    t = t.replace(/\[[\d\s.\-\u2013]+(?:\s*to\s*[\d\s.\-\u2013]+)?\]/g, '');
    // PoB support notice
    t = t.replace(/\s*\(Not supported in PoB yet\)\s*/gi, '');
    // CamelCase-joined affix: "DamageCarbonising (82)" → "Damage"
    t = t.replace(/(?<=[a-z])[A-Z][a-zA-Z']+\s*\(\s*\d+\s*\)\s*$/, '');
    // Space-separated single-word affix: " Cruel (82)", " Disenchanting (82)", " Vapourising (82)"
    t = t.replace(/\s+[A-Z][a-zA-Z']+\s*\(\s*\d+\s*\)\s*$/, '');
    // "of [the] X (N)" suffix affix: " of Many (86)", " of the Order (60)"
    t = t.replace(/\s+of(?:\s+the)?\s+[A-Za-z][a-zA-Z']+\s*\(\s*\d+\s*\)\s*$/, '');
    // Bare trailing (N) that survived above
    t = t.replace(/\s*\(\s*\d+\s*\)\s*$/, '');
    return t.replace(/\s+/g, ' ').trim();
  }

  function extractModText(el) {
    try {
      // Strategy 1: direct-child .lc span — PoE trade puts mod text here; noise
      // (tier, roll range, affix name, PoB tag) lives in sibling .s spans.
      const lcDirect = el.querySelector(':scope > .lc');
      if (lcDirect) {
        const r = _cleanMod(lcDirect.textContent);
        if (r.length > 2) return r;
      }

      // Strategy 2: any .lc descendant (nested wrappers)
      const lcAll = Array.from(el.querySelectorAll('.lc'))
        .map(s => s.textContent.trim()).filter(Boolean).join(' ');
      if (lcAll.length > 2) {
        const r = _cleanMod(lcAll);
        if (r.length > 2) return r;
      }

      // Strategy 3: direct TEXT_NODE children only (skips all child spans)
      const direct = Array.from(el.childNodes)
        .filter(n => n.nodeType === 3)
        .map(n => n.textContent.trim()).filter(Boolean).join(' ');
      if (direct.length > 2) return _cleanMod(direct);

      // Strategy 4: full textContent fallback
      return _cleanMod(el.textContent);
    } catch (_) {
      return _cleanMod((el && el.textContent) || '');
    }
  }

  function isNonModText(text) {
    return /^No Physical Damage$/i.test(text)
      || /^(?:Quality|Item Level|Requires(?: Level)?|LevelReq|Sockets|Physical Damage|Elemental Damage|Chaos Damage|Critical (?:Strike )?Chance|Attacks per Second|Armour|Evasion(?: Rating)?|Energy Shield|DPS|Physical DPS|Elemental DPS)\s*:/i.test(text);
  }

  function isLikelyModText(text) {
    if (!text || isNonModText(text)) return false;
    if (/^(?:Rarity:|Asking Price:|Fee:|▼|Ukaž realné staty|PoB Impact|PoB DPS|Teď|Nový|Weapon 1|Wand|Arkenspork#|=\d|~b\/o)/i.test(text)) return false;
    if (/\b(?:mirror|chaos|divine|exalted|kalandra)\b/i.test(text)) return false;
    return /^([+\-]?\d|Cannot |Attacks |Damage |\d+% |\d+ to |\d+% increased |\d+% reduced )/i.test(text)
      || /(Penetrates|Modifiers|Accuracy|Wishes granted|Elemental Damage|Attack Speed)/i.test(text);
  }

  function extractRowTextLines(row) {
    const rawText = row.innerText || row.textContent || '';
    return rawText
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);
  }

  /**
   * Parse elemental damage string like "10-20, 5-15, 3-8" into combined range
   */
  function parseEleDamageString(str) {
    const ranges = str.match(/(\d+)[\-–](\d+)/g);
    if (!ranges) return '0-0';
    let totalMin = 0, totalMax = 0;
    for (const range of ranges) {
      const [min, max] = range.replace('–', '-').split('-').map(Number);
      totalMin += min;
      totalMax += max;
    }
    return `${totalMin}-${totalMax}`;
  }

  /**
   * Detect all trade result rows currently in the DOM
   */
  function findResultRows() {
    // Try known selectors from various PoE trade site versions.
    const SELECTORS = [
      '.resultset .row',
      '.search-results-block .row',
      '.results .row',
      '[class*="resultset"] [class*="row"]:not(.poe-impact-panel)',
      '[data-id]',         // PoE2 trade uses data-id on each result entry
      '[class*="result-item"]',
      '[class*="tradeItem"]',
      '[class*="trade-item"]',
    ];
    for (const sel of SELECTORS) {
      try {
        const found = document.querySelectorAll(sel);
        if (found.length > 0) return found;
      } catch (_) {}
    }
    return [];
  }

  /**
   * Try to detect the search category from the page URL or search form
   */
  function detectSearchCategory() {
    // From URL: /trade/search/LeagueName?...
    const urlPath = window.location.pathname;

    // Try to get from the trade search form category selector
    const catEl = document.querySelector('[class*="category"] select, [name="type"] option:checked, .filter-group .filter-type');
    if (catEl) return catEl.textContent.trim();

    // Try to get from the first result
    const firstResult = document.querySelector('.resultset .row .typeLine, .resultset .row [class*="typeLine"]');
    if (firstResult) return firstResult.textContent.trim();

    return '';
  }

  return {
    parseResultRow,
    findResultRows,
    detectSearchCategory,
    detectSlotFromCategory,
    detectItemType,
    detectSlot
  };
})();

if (typeof module !== 'undefined') module.exports = TradeParser;
