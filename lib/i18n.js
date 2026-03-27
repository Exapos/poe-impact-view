/**
 * PoE Impact View — Internationalization (i18n)
 * Supported locales: cs (Czech), en (English), zh (Chinese Simplified)
 *
 * Usage:
 *   I18n.t('key')           → translated string in current locale
 *   I18n.setLocale('en')    → change locale (persists to chrome.storage)
 *   I18n.getLocale()        → current locale string
 */

const I18n = (() => {

  // ── Translations ──────────────────────────────────────────────────────────

  const TRANSLATIONS = {

    // ──────────────────── Czech ────────────────────
    cs: {
      // Status bar
      'statusbar.loading':         'PoE Impact View načítá...',
      'statusbar.no_pob':          '⚠️ Importuj PoB kód v PoE Impact View popupu',
      'statusbar.no_dps':          'Item porovnání aktivní (pro DPS exportuj z PoB desktopu nebo poe.ninja)',
      'statusbar.updated_no_dps':  '⚔️ Build aktualizován (bez DPS statů)',
      'statusbar.pob_connected':   'pob.cool připojen',
      'statusbar.pob_loading':     'pob.cool se načítá…',
      'statusbar.pob_disconnected':'pob.cool nepřipojeno',
      'statusbar.open_pobcool':    'Otevřít pob.cool',
      'statusbar.toggle':          'Zapnout/Vypnout impact panely',
      'statusbar.toggle_on':       '👁️ Impact panely zapnuty',
      'statusbar.toggle_off':      '🚫 Impact panely vypnuty',
      'statusbar.pob_btn':         'PoB',

      // Impact panel — item names
      'panel.current_item':        'Aktuální item',
      'panel.empty_slot':          'Prázdný slot',
      'panel.new_item':            'Nový item',
      'panel.hint_import_pob':     '⚠️ Importuj PoB build pro přesné porovnání',

      // Impact panel — table headers
      'panel.col_stat':            'Stat',
      'panel.col_now':             'Teď',
      'panel.col_new':             'Nový',
      'panel.col_delta':           'Δ',

      // Impact panel — stat labels
      'panel.sep_pob_impact':      'PoB Impact',
      'panel.lbl_char_dps':        'PoB DPS',
      'panel.lbl_life':            'Life',
      'panel.lbl_es':              'ES',
      'panel.lbl_dps':             'DPS',
      'panel.lbl_full_dps':        'Full DPS',
      'panel.lbl_avg_hit':         'Avg Hit',
      'panel.lbl_phys':            'Phys',
      'panel.lbl_aps':             'APS',
      'panel.lbl_crit':            'Crit%',
      'panel.lbl_armour':          'Armour',
      'panel.lbl_evasion':         'Evasion',
      'panel.lbl_speed':           'Rychlost',
      'panel.lbl_fire':            'Fire',
      'panel.lbl_cold':            'Cold',
      'panel.lbl_lightning':       'Lightning',
      'panel.lbl_chaos':           'Chaos',

      // Impact panel — mod row labels
      'panel.sep_mods':            'Mody',
      'panel.sep_resists':         'Odolnosti',
      'panel.mod_spell_dmg':       '% Spell Dmg',
      'panel.mod_flat_spell':      'Flat Spell Dmg',
      'panel.mod_cast_spd':        '% Cast Spd',
      'panel.mod_phys_dmg':        '% Phys Dmg',
      'panel.mod_ele_dmg':         '% Ele Dmg',
      'panel.mod_chaos_dmg':       '% Chaos Dmg',
      'panel.mod_flat_phys':       'Flat Phys',
      'panel.mod_flat_ele':        'Flat Ele',
      'panel.mod_flat_chaos':      'Flat Chaos',
      'panel.mod_crit_chance':     '% Crit Chance',
      'panel.mod_crit_multi':      'Crit Multi',
      'panel.mod_atk_spd':         '% Atk Spd',
      'panel.mod_dot_multi':       'DoT Multi',
      'panel.mod_dot_dmg':         '% DoT Dmg',
      'panel.mod_flat_life':       'Life',
      'panel.mod_flat_es':         'ES (mody)',
      'panel.mod_mana':            'Mana',
      'panel.mod_flat_armour':     '+ Armour',
      'panel.mod_flat_evasion':    '+ Evasion',

      // Impact panel — verdict
      'panel.verdict_upgrade':     '▲ Upgrade',
      'panel.verdict_downgrade':   '▼ Downgrade',
      'panel.verdict_sidegrade':   '→ Sidegrade',

      // Impact panel — button
      'panel.btn_show_stats':      'Ukaž realné staty',
      'panel.btn_loading':         'Načítám…',
      'panel.btn_error':           'Chyba',
      'panel.btn_tooltip':         'Otevřít v pob.cool s tímto itemem',

      // pob.cool panel
      'pobpanel.title':            '⚡ pob.cool',
      'pobpanel.hint':             '💡 Items → Create Custom… → Ctrl+V',
      'pobpanel.close':            'Zavřít',

      // Stats bar labels
      'stats.dps':                 'DPS',
      'stats.life':                'Life',
      'stats.es':                  'ES',
      'stats.mana':                'Mana',
      'stats.armour':              'Armour',
      'stats.evasion':             'Eva',

      // Popup — general
      'popup.title':               'PoE Impact View',
      'popup.h1':                  '⚔️ PoE Impact View',
      'popup.settings_title':      'Nastavení',

      // Popup — tabs
      'tab.import':                'Import',
      'tab.build':                 'Build',
      'tab.calc':                  'Kalkulace',
      'tab.compare':               'Porovnání',
      'tab.trade':                 'Trade',

      // Popup — import tab
      'import.hint':               '💡 Nemáš PoB kód? Najdi svou postavu na <a href="https://poe.ninja/builds" target="_blank">poe.ninja/builds</a>, klikni na ni a zkopíruj PoB kód.',
      'import.label':              'PoB kód, pobb.in URL nebo pob.cool URL',
      'import.placeholder':        'Vlož Path of Building kód, pobb.in odkaz nebo pob.cool odkaz...',
      'import.btn':                '📋 Importovat PoB kód',
      'import.fetching':           'Načítám build z odkazu...',
      'import.validating':         'Vlož PoB kód nebo pobb.in URL.',
      'import.decoding':           'Dekóduji PoB kód...',
      'import.err_no_build_param': '❌ pob.cool URL neobsahuje #build= parametr.',
      'import.err_parse_xml':      '❌ Nepodařilo se parsovat PoB XML.',
      'import.success':            '✅ PoB importován s {n} přesnými staty!',
      'import.success_live':       '✅ PoB importován a live headless přepočet dává DPS {n}.',
      'import.warn_no_stats':      '⚠️ PoB importován, ale bez vypočítaných statů. Exportuj z PoB desktopu nebo poe.ninja pro přesné DPS.',
      'import.err_decode':         '❌ Chyba dekódování: {msg}',
      'import.fallback_name':      'PoB Build',

      // Popup — build tab
      'build.empty':               'Nejprve importuj postavu pomocí záložky Import.',
      'build.pob_link':            '🔗 PoB Link',
      'build.link_default':        'Generovat pobb.in link...',
      'build.copy_title':          'Kopírovat',
      'build.open_pobcool':        '🌐 Otevřít v pob.cool',
      'build.equipment':           '🛡️ Vybavení',
      'build.skills':              '💎 Skilly & Gemy',
      'build.tree':                '🌳 Strom pasiv',
      'build.stats':               '📊 Staty',
      'build.no_builds':           'Žádné importované buildy.',
      'build.saved_heading':       '📚 Uložené buildy',
      'build.active_badge':        'Aktivní',
      'build.confirm_delete':      'Opravdu chceš odstranit tento build?',
      'build.select_title':        'Vybrat tento build',
      'build.delete_title':        'Odstranit build',
      'build.no_equipment':        'Žádné vybavení v PoB kódu.',
      'build.no_supports':         'Žádné supporty',
      'build.stats_from_pob':      'Staty z Path of Building',
      'build.stats_from_live':     'Staty z live headless přepočtu',
      'build.stats_no_pob':        'Bez vypočítaných statů — exportuj z PoB desktopu nebo poe.ninja',
      'build.copy_success':        '📋 Zkopírováno!',
      'build.err_no_build':        'Nejdříve importuj build.',
      'build.err_no_code':         'Chybí PoB kód — zkus reimportovat build.',

      // Popup — calc tab
      'calc.empty':                'Nejprve importuj postavu.',
      'calc.offence':              '⚔️ Offence',
      'calc.total_dps':            'Total DPS',
      'calc.hit_dps':              'Hit DPS',
      'calc.dot_dps':              'DoT DPS',
      'calc.crit_chance':          'Crit Chance',
      'calc.crit_multi':           'Crit Multi',
      'calc.cast_spd':             'Attack/Cast Speed',
      'calc.defence':              '🛡️ Defence',
      'calc.life':                 'Life',
      'calc.energy_shield':        'Energy Shield',
      'calc.mana':                 'Mana',
      'calc.armour':               'Armour',
      'calc.evasion':              'Evasion',
      'calc.resistances':          'Resistances',
      'calc.upgrade_priority':     '📊 Upgrade Priority',
      'calc.precise_stats':        '✅ Přesné staty z Path of Building',
      'calc.live_stats':           '⚡ Autoritativní live headless přepočet',
      'calc.estimated_stats':      '⚠️ Odhad z API dat — pro přesné DPS vlož PoB kód z desktopu',

      // Popup — compare tab
      'compare.hint':              'Vlož dva PoB kódy nebo odkazy. Extension oba buildy přepočítá live headless runtime cestou a ukáže rozdíl statů i změněné sloty.',
      'compare.label_a':           'Originální build',
      'compare.label_b':           'Modifikovaný build',
      'compare.placeholder_a':     'Původní PoB kód, pobb.in nebo pob.cool odkaz...',
      'compare.placeholder_b':     'Upravený PoB kód, pobb.in nebo pob.cool odkaz...',
      'compare.btn':               '🧪 Porovnat dva buildy',
      'compare.summary_heading':   '📊 Souhrn',
      'compare.changed_slots':     '🛠️ Změněné sloty',
      'compare.builds_heading':    '🧾 Přepočítané buildy',
      'compare.err_missing':       'Vlož oba PoB vstupy pro porovnání.',
      'compare.loading':           'Porovnávám oba buildy přes live headless runtime...',
      'compare.success':           '✅ Porovnání hotové. Změněných slotů: {n}',
      'compare.err_compare':       '❌ Porovnání selhalo: {msg}',
      'compare.before':            'Před',
      'compare.after':             'Po',
      'compare.no_slot_changes':   'Sloty jsou stejné, liší se jen konfigurace/staty buildu.',
      'compare.live_source':       'live headless',
      'compare.build_a':           'Build A',
      'compare.build_b':           'Build B',

      // Popup — trade tab
      'trade.empty':               'Importuj PoB kód pro zobrazení cen vybavení.',
      'trade.prices_heading':      '💰 Ceny vybavení (poe.ninja)',
      'trade.league_label':        'Liga:',
      'trade.league_loading':      'Načítám...',
      'trade.refresh_btn':         '🔄 Načíst ceny z poe.ninja',
      'trade.upgrade_priority':    '📊 Upgrade Priority',
      'trade.hint':                '💡 Trade overlay funguje přímo na <a href="https://www.pathofexile.com/trade" target="_blank">pathofexile.com/trade</a> — uvidíš dopad itemů přímo u výsledků.',
      'trade.err_no_build':        'Nejdříve importuj build.',
      'trade.loading_prices':      'Načítám ceny z poe.ninja...',
      'trade.total_unique':        'Celkem (unique)',
      'trade.success_prices':      '✅ Ceny načteny pro ligu {league}',
      'trade.err_prices':          '❌ Chyba: {msg}',

      // Popup — loading
      'loading.default':           'Načítání...',

      // Options
      'options.title':             'PoE Impact View - Nastavení',
      'options.h1':                '⚔️ PoE Impact View — Nastavení',
      'options.subtitle':          'Konfigurace extensionu pro Path of Exile',
      'options.account':           '🔗 Výchozí účet',

      // Options — additional
      'options.account_name_label':      'PoE Account Name',
      'options.account_name_placeholder':'Tvůj PoE account name',
      'options.realm_label':            'Výchozí Realm',
      'options.trade_heading':          '💰 Trade Nastavení',
      'options.league_label':           'Výchozí Liga',
      'options.league_placeholder':     'Necká se auto-detect, nebo napiš ručně',
      'options.auto_prices_label':      'Automaticky obnovovat ceny',
      'options.trade_overlay_label':    'Zobrazovat overlay na trade stránce',
      'options.calc_heading':           '📊 Kalkulace',
      'options.auto_calc_label':        'Automaticky kalkulovat po importu',
      'options.show_upgrades_label':    'Zobrazovat upgrade doporučení',
      'options.data_heading':           '🗑️ Data',
      'options.clear_hint':             'Smazat všechna uložená data extensionu',
      'options.clear_btn':              'Smazat všechna data',
      'options.save_btn':               '💾 Uložit nastavení',
      'options.saved_toast':            'Nastavení uloženo!',
      'options.confirm_clear':          'Opravdu chceš smazat všechna data? Toto nelze vrátit.',
      'options.cleared_toast':          'Data smazána!',
      'options.lang_heading':           '🌐 Jazyk',

      // Language selector
      'lang.label':                'Jazyk / Language:',
      'lang.cs':                   '🇨🇿 Čeština',
      'lang.en':                   '🇬🇧 English',
      'lang.zh':                   '🇨🇳 中文',
      'import.name_label':         'Název buildu (volitelné)',
      'import.name_placeholder':   'Např. LS Slayer / Mapper / Bossing',
    },

    // ──────────────────── English ────────────────────
    en: {
      // Status bar
      'statusbar.loading':         'PoE Impact View loading...',
      'statusbar.no_pob':          '⚠️ Import a PoB code in the PoE Impact View popup',
      'statusbar.no_dps':          'Item comparison active (export from PoB desktop or poe.ninja for DPS)',
      'statusbar.updated_no_dps':  '⚔️ Build updated (no DPS stats)',
      'statusbar.pob_connected':   'pob.cool connected',
      'statusbar.pob_loading':     'pob.cool loading…',
      'statusbar.pob_disconnected':'pob.cool not connected',
      'statusbar.open_pobcool':    'Open pob.cool',
      'statusbar.toggle':          'Toggle impact panels',
      'statusbar.toggle_on':       '👁️ Impact panels enabled',
      'statusbar.toggle_off':      '🚫 Impact panels disabled',
      'statusbar.pob_btn':         'PoB',

      // Impact panel — item names
      'panel.current_item':        'Current item',
      'panel.empty_slot':          'Empty slot',
      'panel.new_item':            'New item',
      'panel.hint_import_pob':     '⚠️ Import a PoB build for accurate comparison',

      // Impact panel — table headers
      'panel.col_stat':            'Stat',
      'panel.col_now':             'Now',
      'panel.col_new':             'New',
      'panel.col_delta':           'Δ',

      // Impact panel — stat labels
      'panel.sep_pob_impact':      'PoB Impact',
      'panel.lbl_char_dps':        'PoB DPS',
      'panel.lbl_life':            'Life',
      'panel.lbl_es':              'ES',
      'panel.lbl_dps':             'DPS',
      'panel.lbl_full_dps':        'Full DPS',
      'panel.lbl_avg_hit':         'Avg Hit',
      'panel.lbl_phys':            'Phys',
      'panel.lbl_aps':             'APS',
      'panel.lbl_crit':            'Crit%',
      'panel.lbl_armour':          'Armour',
      'panel.lbl_evasion':         'Evasion',
      'panel.lbl_speed':           'Speed',
      'panel.lbl_fire':            'Fire',
      'panel.lbl_cold':            'Cold',
      'panel.lbl_lightning':       'Lightning',
      'panel.lbl_chaos':           'Chaos',

      // Impact panel — mod row labels
      'panel.sep_mods':            'Mods',
      'panel.sep_resists':         'Resists',
      'panel.mod_spell_dmg':       '% Spell Dmg',
      'panel.mod_flat_spell':      'Flat Spell Dmg',
      'panel.mod_cast_spd':        '% Cast Spd',
      'panel.mod_phys_dmg':        '% Phys Dmg',
      'panel.mod_ele_dmg':         '% Ele Dmg',
      'panel.mod_chaos_dmg':       '% Chaos Dmg',
      'panel.mod_flat_phys':       'Flat Phys',
      'panel.mod_flat_ele':        'Flat Ele',
      'panel.mod_flat_chaos':      'Flat Chaos',
      'panel.mod_crit_chance':     '% Crit Chance',
      'panel.mod_crit_multi':      'Crit Multi',
      'panel.mod_atk_spd':         '% Atk Spd',
      'panel.mod_dot_multi':       'DoT Multi',
      'panel.mod_dot_dmg':         '% DoT Dmg',
      'panel.mod_flat_life':       'Life',
      'panel.mod_flat_es':         'ES (mods)',
      'panel.mod_mana':            'Mana',
      'panel.mod_flat_armour':     '+ Armour',
      'panel.mod_flat_evasion':    '+ Evasion',

      // Impact panel — verdict
      'panel.verdict_upgrade':     '▲ Upgrade',
      'panel.verdict_downgrade':   '▼ Downgrade',
      'panel.verdict_sidegrade':   '→ Sidegrade',

      // Impact panel — button
      'panel.btn_show_stats':      'Show real stats',
      'panel.btn_loading':         'Loading…',
      'panel.btn_error':           'Error',
      'panel.btn_tooltip':         'Open in pob.cool with this item',

      // pob.cool panel
      'pobpanel.title':            '⚡ pob.cool',
      'pobpanel.hint':             '💡 Items → Create Custom… → Ctrl+V',
      'pobpanel.close':            'Close',

      // Stats bar labels
      'stats.dps':                 'DPS',
      'stats.life':                'Life',
      'stats.es':                  'ES',
      'stats.mana':                'Mana',
      'stats.armour':              'Armour',
      'stats.evasion':             'Eva',

      // Popup — general
      'popup.title':               'PoE Impact View',
      'popup.h1':                  '⚔️ PoE Impact View',
      'popup.settings_title':      'Settings',

      // Popup — tabs
      'tab.import':                'Import',
      'tab.build':                 'Build',
      'tab.calc':                  'Calc',
      'tab.compare':               'Compare',
      'tab.trade':                 'Trade',

      // Popup — import tab
      'import.hint':               '💡 No PoB code? Find your character on <a href="https://poe.ninja/builds" target="_blank">poe.ninja/builds</a>, click it, and copy the PoB code.',
      'import.label':              'PoB code, pobb.in URL or pob.cool URL',
      'import.placeholder':        'Paste Path of Building code, pobb.in link or pob.cool link...',
      'import.btn':                '📋 Import PoB code',
      'import.fetching':           'Fetching build from URL...',
      'import.validating':         'Paste a PoB code or pobb.in URL.',
      'import.decoding':           'Decoding PoB code...',
      'import.err_no_build_param': '❌ pob.cool URL does not contain #build= parameter.',
      'import.err_parse_xml':      '❌ Failed to parse PoB XML.',
      'import.success':            '✅ PoB imported with {n} precise stats!',
      'import.success_live':       '✅ PoB imported and live headless recalculation reports {n} DPS.',
      'import.warn_no_stats':      '⚠️ PoB imported, but without calculated stats. Export from PoB desktop or poe.ninja for accurate DPS.',
      'import.err_decode':         '❌ Decode error: {msg}',
      'import.fallback_name':      'PoB Build',

      // Popup — build tab
      'build.empty':               'Import a character first using the Import tab.',
      'build.pob_link':            '🔗 PoB Link',
      'build.link_default':        'Generate pobb.in link...',
      'build.copy_title':          'Copy',
      'build.open_pobcool':        '🌐 Open in pob.cool',
      'build.equipment':           '🛡️ Equipment',
      'build.skills':              '💎 Skills & Gems',
      'build.tree':                '🌳 Passive Tree',
      'build.stats':               '📊 Stats',
      'build.no_builds':           'No imported builds.',
      'build.saved_heading':       '📚 Saved builds',
      'build.active_badge':        'Active',
      'build.confirm_delete':      'Delete this build?',
      'build.select_title':        'Select this build',
      'build.delete_title':        'Delete build',
      'build.no_equipment':        'No equipment in PoB code.',
      'build.no_supports':         'No supports',
      'build.stats_from_pob':      'Stats from Path of Building',
      'build.stats_from_live':     'Stats from live headless recalculation',
      'build.stats_no_pob':        'No calculated stats — export from PoB desktop or poe.ninja',
      'build.copy_success':        '📋 Copied!',
      'build.err_no_build':        'Import a build first.',
      'build.err_no_code':         'Missing PoB code — try reimporting the build.',

      // Popup — calc tab
      'calc.empty':                'Import a character first.',
      'calc.offence':              '⚔️ Offence',
      'calc.total_dps':            'Total DPS',
      'calc.hit_dps':              'Hit DPS',
      'calc.dot_dps':              'DoT DPS',
      'calc.crit_chance':          'Crit Chance',
      'calc.crit_multi':           'Crit Multi',
      'calc.cast_spd':             'Attack/Cast Speed',
      'calc.defence':              '🛡️ Defence',
      'calc.life':                 'Life',
      'calc.energy_shield':        'Energy Shield',
      'calc.mana':                 'Mana',
      'calc.armour':               'Armour',
      'calc.evasion':              'Evasion',
      'calc.resistances':          'Resistances',
      'calc.upgrade_priority':     '📊 Upgrade Priority',
      'calc.precise_stats':        '✅ Precise stats from Path of Building',
      'calc.live_stats':           '⚡ Authoritative live headless recalculation',
      'calc.estimated_stats':      '⚠️ Estimated from API data — paste PoB code from desktop for accurate DPS',

      // Popup — compare tab
      'compare.hint':              'Paste two PoB codes or links. The extension will recalculate both through the live headless runtime and show stat differences and changed slots.',
      'compare.label_a':           'Original build',
      'compare.label_b':           'Modified build',
      'compare.placeholder_a':     'Original PoB code, pobb.in or pob.cool link...',
      'compare.placeholder_b':     'Modified PoB code, pobb.in or pob.cool link...',
      'compare.btn':               '🧪 Compare two builds',
      'compare.summary_heading':   '📊 Summary',
      'compare.changed_slots':     '🛠️ Changed slots',
      'compare.builds_heading':    '🧾 Recalculated builds',
      'compare.err_missing':       'Paste both PoB inputs to compare them.',
      'compare.loading':           'Comparing both builds through the live headless runtime...',
      'compare.success':           '✅ Comparison complete. Changed slots: {n}',
      'compare.err_compare':       '❌ Comparison failed: {msg}',
      'compare.before':            'Before',
      'compare.after':             'After',
      'compare.no_slot_changes':   'Slots are identical; only configuration or stats changed.',
      'compare.live_source':       'live headless',
      'compare.build_a':           'Build A',
      'compare.build_b':           'Build B',

      // Popup — trade tab
      'trade.empty':               'Import a PoB code to see equipment prices.',
      'trade.prices_heading':      '💰 Equipment Prices (poe.ninja)',
      'trade.league_label':        'League:',
      'trade.league_loading':      'Loading...',
      'trade.refresh_btn':         '🔄 Load prices from poe.ninja',
      'trade.upgrade_priority':    '📊 Upgrade Priority',
      'trade.hint':                '💡 Trade overlay works directly on <a href="https://www.pathofexile.com/trade" target="_blank">pathofexile.com/trade</a> — see item impact right next to results.',
      'trade.err_no_build':        'Import a build first.',
      'trade.loading_prices':      'Loading prices from poe.ninja...',
      'trade.total_unique':        'Total (unique)',
      'trade.success_prices':      '✅ Prices loaded for league {league}',
      'trade.err_prices':          '❌ Error: {msg}',

      // Popup — loading
      'loading.default':           'Loading...',

      // Options
      'options.title':             'PoE Impact View - Settings',
      'options.h1':                '⚔️ PoE Impact View — Settings',
      'options.subtitle':          'Extension configuration for Path of Exile',
      'options.account':           '🔗 Default Account',

      // Options — additional
      'options.account_name_label':      'PoE Account Name',
      'options.account_name_placeholder':'Your PoE account name',
      'options.realm_label':            'Default Realm',
      'options.trade_heading':          '💰 Trade Settings',
      'options.league_label':           'Default League',
      'options.league_placeholder':     'Auto-detected, or type manually',
      'options.auto_prices_label':      'Automatically refresh prices',
      'options.trade_overlay_label':    'Show overlay on trade page',
      'options.calc_heading':           '📊 Calculations',
      'options.auto_calc_label':        'Automatically calculate after import',
      'options.show_upgrades_label':    'Show upgrade recommendations',
      'options.data_heading':           '🗑️ Data',
      'options.clear_hint':             'Delete all saved extension data',
      'options.clear_btn':              'Delete all data',
      'options.save_btn':               '💾 Save settings',
      'options.saved_toast':            'Settings saved!',
      'options.confirm_clear':          'Really delete all data? This cannot be undone.',
      'options.cleared_toast':          'Data deleted!',
      'options.lang_heading':           '🌐 Language',

      // Language selector
      'lang.label':                'Language:',
      'lang.cs':                   '🇨🇿 Čeština',
      'lang.en':                   '🇬🇧 English',
      'lang.zh':                   '🇨🇳 中文',
      'import.name_label':         'Build name (optional)',
      'import.name_placeholder':   'e.g. LS Slayer / Mapper / Bossing',
    },

    // ──────────────────── Chinese Simplified ────────────────────
    zh: {
      // Status bar
      'statusbar.loading':         'PoE Impact View 加载中...',
      'statusbar.no_pob':          '⚠️ 请在 PoE Impact View 弹窗中导入 PoB 代码',
      'statusbar.no_dps':          '物品对比已激活（请从 PoB 桌面端或 poe.ninja 导出以获取 DPS）',
      'statusbar.updated_no_dps':  '⚔️ 构建已更新（无 DPS 数据）',
      'statusbar.pob_connected':   'pob.cool 已连接',
      'statusbar.pob_loading':     'pob.cool 加载中…',
      'statusbar.pob_disconnected':'pob.cool 未连接',
      'statusbar.open_pobcool':    '打开 pob.cool',
      'statusbar.toggle':          '开启/关闭影响面板',
      'statusbar.toggle_on':       '👁️ 影响面板已开启',
      'statusbar.toggle_off':      '🚫 影响面板已关闭',
      'statusbar.pob_btn':         'PoB',

      // Impact panel — item names
      'panel.current_item':        '当前装备',
      'panel.empty_slot':          '空槽位',
      'panel.new_item':            '新装备',
      'panel.hint_import_pob':     '⚠️ 请导入 PoB 构建以进行精确对比',

      // Impact panel — table headers
      'panel.col_stat':            '属性',
      'panel.col_now':             '当前',
      'panel.col_new':             '新',
      'panel.col_delta':           'Δ',

      // Impact panel — stat labels
      'panel.sep_pob_impact':      'PoB 影响',
      'panel.lbl_char_dps':        'PoB DPS',
      'panel.lbl_life':            '生命',
      'panel.lbl_es':              '能量盾',
      'panel.lbl_dps':             'DPS',
      'panel.lbl_full_dps':        '总 DPS',
      'panel.lbl_avg_hit':         '平均击中',
      'panel.lbl_phys':            '物理',
      'panel.lbl_aps':             '攻速',
      'panel.lbl_crit':            '暴击%',
      'panel.lbl_armour':          '护甲',
      'panel.lbl_evasion':         '闪避',
      'panel.lbl_speed':           '速度',
      'panel.lbl_fire':            '火抗',
      'panel.lbl_cold':            '冰抗',
      'panel.lbl_lightning':       '电抗',
      'panel.lbl_chaos':           '混沌抗',

      // Impact panel — mod row labels
      'panel.sep_mods':            '词缀',
      'panel.sep_resists':         '抗性',
      'panel.mod_spell_dmg':       '% 法伤',
      'panel.mod_flat_spell':      '固定法伤',
      'panel.mod_cast_spd':        '% 施法速度',
      'panel.mod_phys_dmg':        '% 物伤',
      'panel.mod_ele_dmg':         '% 元素伤',
      'panel.mod_chaos_dmg':       '% 混沌伤',
      'panel.mod_flat_phys':       '固定物伤',
      'panel.mod_flat_ele':        '固定元素伤',
      'panel.mod_flat_chaos':      '固定混沌伤',
      'panel.mod_crit_chance':     '% 暴击率',
      'panel.mod_crit_multi':      '暴击倍率',
      'panel.mod_atk_spd':         '% 攻击速度',
      'panel.mod_dot_multi':       'DoT 倍率',
      'panel.mod_dot_dmg':         '% DoT 伤害',
      'panel.mod_flat_life':       '生命',
      'panel.mod_flat_es':         '能量盾（词缀）',
      'panel.mod_mana':            '魔法',
      'panel.mod_flat_armour':     '+ 护甲',
      'panel.mod_flat_evasion':    '+ 闪避',

      // Impact panel — verdict
      'panel.verdict_upgrade':     '▲ 升级',
      'panel.verdict_downgrade':   '▼ 降级',
      'panel.verdict_sidegrade':   '→ 平替',

      // Impact panel — button
      'panel.btn_show_stats':      '显示真实数据',
      'panel.btn_loading':         '加载中…',
      'panel.btn_error':           '错误',
      'panel.btn_tooltip':         '在 pob.cool 中用此物品打开',

      // pob.cool panel
      'pobpanel.title':            '⚡ pob.cool',
      'pobpanel.hint':             '💡 物品 → 创建自定义… → Ctrl+V',
      'pobpanel.close':            '关闭',

      // Stats bar labels
      'stats.dps':                 'DPS',
      'stats.life':                '生命',
      'stats.es':                  '能量盾',
      'stats.mana':                '魔法',
      'stats.armour':              '护甲',
      'stats.evasion':             '闪避',

      // Popup — general
      'popup.title':               'PoE Impact View',
      'popup.h1':                  '⚔️ PoE Impact View',
      'popup.settings_title':      '设置',

      // Popup — tabs
      'tab.import':                '导入',
      'tab.build':                 '构建',
      'tab.calc':                  '计算',
      'tab.compare':               '对比',
      'tab.trade':                 '交易',

      // Popup — import tab
      'import.hint':               '💡 没有 PoB 代码？在 <a href="https://poe.ninja/builds" target="_blank">poe.ninja/builds</a> 上找到你的角色，点击并复制 PoB 代码。',
      'import.label':              'PoB 代码、pobb.in 链接或 pob.cool 链接',
      'import.placeholder':        '粘贴 Path of Building 代码、pobb.in 链接或 pob.cool 链接...',
      'import.btn':                '📋 导入 PoB 代码',
      'import.fetching':           '正在从链接读取构建...',
      'import.validating':         '请粘贴 PoB 代码或 pobb.in 链接。',
      'import.decoding':           '正在解码 PoB 代码...',
      'import.err_no_build_param': '❌ pob.cool 链接不包含 #build= 参数。',
      'import.err_parse_xml':      '❌ 无法解析 PoB XML。',
      'import.success':            '✅ PoB 导入成功，共 {n} 个精确属性！',
      'import.success_live':       '✅ PoB 导入成功，live headless 重算后的 DPS 为 {n}。',
      'import.warn_no_stats':      '⚠️ PoB 已导入，但无计算属性。请从 PoB 桌面端或 poe.ninja 导出以获取精确 DPS。',
      'import.err_decode':         '❌ 解码错误：{msg}',
      'import.fallback_name':      'PoB 构建',

      // Popup — build tab
      'build.empty':               '请先通过导入标签导入角色。',
      'build.pob_link':            '🔗 PoB 链接',
      'build.link_default':        '生成 pobb.in 链接...',
      'build.copy_title':          '复制',
      'build.open_pobcool':        '🌐 在 pob.cool 中打开',
      'build.equipment':           '🛡️ 装备',
      'build.skills':              '💎 技能与宝石',
      'build.tree':                '🌳 天赋树',
      'build.stats':               '📊 属性',
      'build.no_builds':           '尚无导入的构建。',
      'build.saved_heading':       '📚 已保存构建',
      'build.active_badge':        '当前',
      'build.confirm_delete':      '确定要删除这个构建吗？',
      'build.select_title':        '选择此构建',
      'build.delete_title':        '删除构建',
      'build.no_equipment':        'PoB 代码中无装备数据。',
      'build.no_supports':         '无辅助宝石',
      'build.stats_from_pob':      '来自 Path of Building 的属性',
      'build.stats_from_live':     '来自 live headless 重算的属性',
      'build.stats_no_pob':        '无计算属性——请从 PoB 桌面端或 poe.ninja 导出',
      'build.copy_success':        '📋 已复制！',
      'build.err_no_build':        '请先导入构建。',
      'build.err_no_code':         '缺少 PoB 代码——请尝试重新导入构建。',

      // Popup — calc tab
      'calc.empty':                '请先导入角色。',
      'calc.offence':              '⚔️ 攻击',
      'calc.total_dps':            '总 DPS',
      'calc.hit_dps':              '命中 DPS',
      'calc.dot_dps':              'DoT DPS',
      'calc.crit_chance':          '暴击率',
      'calc.crit_multi':           '暴击倍率',
      'calc.cast_spd':             '攻击/施法速度',
      'calc.defence':              '🛡️ 防御',
      'calc.life':                 '生命',
      'calc.energy_shield':        '能量盾',
      'calc.mana':                 '魔法',
      'calc.armour':               '护甲',
      'calc.evasion':              '闪避',
      'calc.resistances':          '抗性',
      'calc.upgrade_priority':     '📊 升级优先级',
      'calc.precise_stats':        '✅ 来自 Path of Building 的精确属性',
      'calc.live_stats':           '⚡ 权威 live headless 重算结果',
      'calc.estimated_stats':      '⚠️ 来自 API 数据的估算——粘贴桌面端 PoB 代码以获取精确 DPS',

      // Popup — compare tab
      'compare.hint':              '粘贴两个 PoB 代码或链接。扩展会通过 live headless runtime 重算两个构建，并显示属性差异与变更槽位。',
      'compare.label_a':           '原始构建',
      'compare.label_b':           '修改后构建',
      'compare.placeholder_a':     '原始 PoB 代码、pobb.in 或 pob.cool 链接...',
      'compare.placeholder_b':     '修改后的 PoB 代码、pobb.in 或 pob.cool 链接...',
      'compare.btn':               '🧪 对比两个构建',
      'compare.summary_heading':   '📊 概览',
      'compare.changed_slots':     '🛠️ 变更槽位',
      'compare.builds_heading':    '🧾 重算后的构建',
      'compare.err_missing':       '请填入两个 PoB 输入后再对比。',
      'compare.loading':           '正在通过 live headless runtime 对比两个构建...',
      'compare.success':           '✅ 对比完成。变更槽位数：{n}',
      'compare.err_compare':       '❌ 对比失败：{msg}',
      'compare.before':            '之前',
      'compare.after':             '之后',
      'compare.no_slot_changes':   '槽位相同，只有配置或属性发生了变化。',
      'compare.live_source':       'live headless',
      'compare.build_a':           '构建 A',
      'compare.build_b':           '构建 B',

      // Popup — trade tab
      'trade.empty':               '请导入 PoB 代码以查看装备价格。',
      'trade.prices_heading':      '💰 装备价格（poe.ninja）',
      'trade.league_label':        '赛季：',
      'trade.league_loading':      '加载中...',
      'trade.refresh_btn':         '🔄 从 poe.ninja 加载价格',
      'trade.upgrade_priority':    '📊 升级优先级',
      'trade.hint':                '💡 交易覆盖层直接在 <a href="https://www.pathofexile.com/trade" target="_blank">pathofexile.com/trade</a> 上运行——可在结果旁直接查看物品影响。',
      'trade.err_no_build':        '请先导入构建。',
      'trade.loading_prices':      '正在从 poe.ninja 加载价格...',
      'trade.total_unique':        '合计（独特）',
      'trade.success_prices':      '✅ 已加载赛季 {league} 的价格',
      'trade.err_prices':          '❌ 错误：{msg}',

      // Popup — loading
      'loading.default':           '加载中...',

      // Options
      'options.title':             'PoE Impact View - 设置',
      'options.h1':                '⚔️ PoE Impact View — 设置',
      'options.subtitle':          '为流放之路配置扩展',
      'options.account':           '🔗 默认账户',

      // Options — additional
      'options.account_name_label':      'PoE 账户名',
      'options.account_name_placeholder':'你的 PoE 账户名',
      'options.realm_label':            '默认区服',
      'options.trade_heading':          '💰 交易设置',
      'options.league_label':           '默认赛季',
      'options.league_placeholder':     '自动检测，或手动输入',
      'options.auto_prices_label':      '自动刷新价格',
      'options.trade_overlay_label':    '在交易页面显示覆盖层',
      'options.calc_heading':           '📊 计算',
      'options.auto_calc_label':        '导入后自动计算',
      'options.show_upgrades_label':    '显示升级建议',
      'options.data_heading':           '🗑️ 数据',
      'options.clear_hint':             '删除所有保存的扩展数据',
      'options.clear_btn':              '删除所有数据',
      'options.save_btn':               '💾 保存设置',
      'options.saved_toast':            '设置已保存！',
      'options.confirm_clear':          '确定要删除所有数据吗？此操作无法撤销。',
      'options.cleared_toast':          '数据已删除！',
      'options.lang_heading':           '🌐 语言',

      // Language selector
      'lang.label':                '语言 / Language:',
      'lang.cs':                   '🇨🇿 Čeština',
      'lang.en':                   '🇬🇧 English',
      'lang.zh':                   '🇨🇳 中文',
      'import.name_label':         '构建名称（可选）',
      'import.name_placeholder':   '例如：LS Slayer / Mapper / Bossing',
    },
  };

  // ── Runtime state ──────────────────────────────────────────────────────────

  let _locale = 'cs'; // default

  // Detect browser locale as a starting guess (before storage loads)
  function _detectBrowserLocale() {
    const lang = (navigator.language || 'cs').toLowerCase();
    if (lang.startsWith('zh')) return 'zh';
    if (lang.startsWith('en')) return 'en';
    return 'cs';
  }

  // Initialise from chrome.storage if available. Returns a Promise.
  function init() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['i18n_locale'], (result) => {
          _locale = result.i18n_locale || _detectBrowserLocale();
          applyToDom();
          resolve();
        });
      } else {
        _locale = _detectBrowserLocale();
        resolve();
      }
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Translate a key. Supports simple {placeholder} substitution.
   * @param {string} key
   * @param {Object} [vars]  e.g. { n: 42 } for '{n}'
   * @returns {string}
   */
  function t(key, vars) {
    const dict = TRANSLATIONS[_locale] || TRANSLATIONS['cs'];
    let str = dict[key] ?? TRANSLATIONS['cs'][key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      }
    }
    return str;
  }

  /**
   * Change active locale and persist to chrome.storage.
   * @param {'cs'|'en'|'zh'} locale
   */
  function setLocale(locale, persist = true) {
    if (!TRANSLATIONS[locale]) return;
    _locale = locale;
    if (persist && typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ i18n_locale: locale });
    }
    applyToDom();
  }

  /** Get current locale string. */
  function getLocale() { return _locale; }

  /**
   * Apply translations to all elements with data-i18n attribute in the DOM.
   * data-i18n="key"           → element.textContent = t(key)
   * data-i18n-html="key"      → element.innerHTML   = t(key)
   * data-i18n-title="key"     → element.title       = t(key)
   * data-i18n-placeholder="key" → element.placeholder = t(key)
   */
  function applyToDom(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    scope.querySelectorAll('[data-i18n-html]').forEach(el => {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
    scope.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = t(el.getAttribute('data-i18n-title'));
    });
    scope.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
  }

  return { t, setLocale, getLocale, init, applyToDom, SUPPORTED_LOCALES: ['cs', 'en', 'zh'] };

})();

if (typeof module !== 'undefined') module.exports = I18n;
