// lib/pob-lua-vm.js — Headless Path of Building engine via wasmoon
// Single-path architecture: headless PoB → CalcPerform → item swap
/* global Wasmoon, chrome, Pako */

(function () {
  'use strict';

  const UPSTREAM_BROWSER_MANIFEST = 'PathOfBuilding-dev/browser-file-manifest.json';
  const DEFAULT_SETTINGS_XML = '<PathOfBuilding></PathOfBuilding>';
  const TIMELESS_JEWEL_ALIASES = [
    { pattern: /\bBrutal Restraint\b/i, aliasPath: 'Data/TimelessJewelData/BrutalRestraint.bin' },
    { pattern: /\bElegant Hubris\b/i, aliasPath: 'Data/TimelessJewelData/ElegantHubris.bin' },
    { pattern: /\bGlorious Vanity\b/i, aliasPath: 'Data/TimelessJewelData/GloriousVanity.bin' },
    { pattern: /\bHeroic Tragedy\b/i, aliasPath: 'Data/TimelessJewelData/HeroicTragedy.bin' },
    { pattern: /\bLethal Pride\b/i, aliasPath: 'Data/TimelessJewelData/LethalPride.bin' },
    { pattern: /\bMilitant Faith\b/i, aliasPath: 'Data/TimelessJewelData/MilitantFaith.bin' },
  ];

  // ── Lua 5.4 compatibility shim + virtual filesystem ──
  // This is the proven runtime environment that bridges wasmoon (Lua 5.4) to PoB (LuaJIT).
  const UPSTREAM_HOST_SHIM = String.raw`
    _G._mountedFiles = _G._mountedFiles or {}
    _G._mountedMeta = _G._mountedMeta or {}
    _G._writtenFiles = _G._writtenFiles or {}

    unpack = table.unpack or unpack
    table.maxn = table.maxn or function(tbl)
      local maxIndex = 0
      for key in pairs(tbl or {}) do
        if type(key) == 'number' and key > maxIndex then maxIndex = key end
      end
      return maxIndex
    end

    local rawStringFormat = string.format
    local function truncateToInteger(value)
      if type(value) ~= 'number' then return value end
      if value ~= value or value == math.huge or value == -math.huge then return 0 end
      return value >= 0 and math.floor(value) or math.ceil(value)
    end
    string.format = function(fmt, ...)
      local args = { ... }
      local ok, result = pcall(rawStringFormat, fmt, table.unpack(args))
      if ok then return result end
      if type(result) == 'string' and result:find('number has no integer representation', 1, true) then
        for i = 1, #args do
          if type(args[i]) == 'number' then args[i] = truncateToInteger(args[i]) end
        end
        local retryOk, retryResult = pcall(rawStringFormat, fmt, table.unpack(args))
        if retryOk then return retryResult end
        error('string.format fallback failed: ' .. tostring(retryResult))
      end
      error(result)
    end

    local rawStringGsub = string.gsub
    string.gsub = function(subject, pattern, replacement, limit)
      if type(replacement) == 'string' then
        replacement = rawStringGsub(replacement, '%%([^%%%d])', '%1')
      end
      return rawStringGsub(subject, pattern, replacement, limit)
    end

    math.mod = math.mod or function(a, b) return a % b end
    if not math.pow then math.pow = function(a, b) return a ^ b end end
    if not loadstring then
      loadstring = function(source, chunkname) return load(source, chunkname, 't', _G) end
    end

    if not getfenv then
      getfenv = function(fn)
        if type(fn) ~= 'function' then return _G end
        local i = 1
        while true do
          local name, value = debug.getupvalue(fn, i)
          if name == '_ENV' then return value end
          if name == nil then break end
          i = i + 1
        end
        return _G
      end
    end

    if not setfenv then
      setfenv = function(fn, env)
        if type(fn) ~= 'function' then return fn end
        local i = 1
        while true do
          local name = debug.getupvalue(fn, i)
          if name == '_ENV' then debug.setupvalue(fn, i, env); return fn end
          if name == nil then break end
          i = i + 1
        end
        return fn
      end
    end

    -- LuaJIT bit library compatibility
    bit = bit or {}
    function bit.band(a, b, ...)
      a, b = a or 0, b or 0; local r = a & b
      for i = 1, select('#', ...) do r = r & select(i, ...) end
      return r
    end
    function bit.bor(a, b, ...)
      a, b = a or 0, b or 0; local r = a | b
      for i = 1, select('#', ...) do r = r | select(i, ...) end
      return r
    end
    function bit.bxor(a, b, ...)
      a, b = a or 0, b or 0; local r = a ~ b
      for i = 1, select('#', ...) do r = r ~ select(i, ...) end
      return r
    end
    function bit.bnot(a) return ~(a or 0) end
    function bit.rshift(a, n)
      a, n = a or 0, n or 0
      return a >= 0 and (a >> n) or (((a & 0xFFFFFFFF) >> n))
    end
    function bit.lshift(a, n) return ((a or 0) << (n or 0)) & 0xFFFFFFFF end
    function bit.arshift(a, n)
      a = (a or 0) & 0xFFFFFFFF
      if a >= 0x80000000 then a = a - 0x100000000 end
      return a >> (n or 0)
    end
    function bit.tobit(x)
      x = ((x or 0) & 0xFFFFFFFF)
      if x >= 0x80000000 then x = x - 0x100000000 end
      return math.floor(x)
    end

    jit = jit or { opt = { start = function(...) end }, off = function() end }
    arg = arg or {}

    -- Graphics / system stubs (PoB expects these globals)
    _G.GetVirtualScreenSize = _G.GetVirtualScreenSize or function() return 1920, 1080 end
    _G.GetScreenSize = _G.GetScreenSize or function() return 1920, 1080 end
    _G.GetScreenScale = _G.GetScreenScale or function() return 1 end
    _G.GetDPIScaleOverridePercent = _G.GetDPIScaleOverridePercent or function() return 1 end
    _G.SetDPIScaleOverridePercent = _G.SetDPIScaleOverridePercent or function() end
    _G.RenderInit = _G.RenderInit or function() end
    _G.SetClearColor = _G.SetClearColor or function() end
    _G.SetDrawLayer = _G.SetDrawLayer or function() end
    _G.SetViewport = _G.SetViewport or function() end
    _G.SetDrawColor = _G.SetDrawColor or function() end
    _G.DrawImage = _G.DrawImage or function() end
    _G.DrawImageQuad = _G.DrawImageQuad or function() end
    _G.DrawString = _G.DrawString or function() end
    _G.DrawStringWidth = _G.DrawStringWidth or function() return 1 end
    _G.DrawStringCursorIndex = _G.DrawStringCursorIndex or function() return 0 end
    _G.GetCursorPos = _G.GetCursorPos or function() return 0, 0 end
    _G.SetCursorPos = _G.SetCursorPos or function() end
    _G.ShowCursor = _G.ShowCursor or function() end
    _G.IsKeyDown = _G.IsKeyDown or function() return false end
    _G.SetWindowTitle = _G.SetWindowTitle or function() end
    _G.Copy = _G.Copy or function() end
    _G.Paste = _G.Paste or function() return '' end
    _G.GetTime = _G.GetTime or function() return 0 end
    _G.GetScriptPath = _G.GetScriptPath or function() return '.' end
    _G.GetRuntimePath = _G.GetRuntimePath or function() return 'runtime' end
    _G.GetUserPath = _G.GetUserPath or function() return '.' end
    _G.MakeDir = _G.MakeDir or function() end
    _G.RemoveDir = _G.RemoveDir or function() end
    _G.SetWorkDir = _G.SetWorkDir or function() end
    _G.GetWorkDir = _G.GetWorkDir or function() return '' end
    _G.LaunchSubScript = _G.LaunchSubScript or function() end
    _G.AbortSubScript = _G.AbortSubScript or function() end
    _G.IsSubScriptRunning = _G.IsSubScriptRunning or function() return false end
    _G.ConPrintTable = _G.ConPrintTable or function() end
    _G.ConExecute = _G.ConExecute or function() end
    _G.ConClear = _G.ConClear or function() end
    _G.SpawnProcess = _G.SpawnProcess or function() end
    _G.OpenURL = _G.OpenURL or function() end
    _G.SetProfiling = _G.SetProfiling or function() end
    _G.Restart = _G.Restart or function() end
    _G.Exit = _G.Exit or function() end
    _G.TakeScreenshot = _G.TakeScreenshot or function() end
    _G.StripEscapes = _G.StripEscapes or function(text)
      return text:gsub('%^%d', ''):gsub('%^x%x%x%x%x%x%x', '')
    end
    _G.GetAsyncCount = _G.GetAsyncCount or function() return 0 end
    _G.GetCloudProvider = _G.GetCloudProvider or function() return nil, nil, nil end

    function Deflate(data)
      return _G._hostDeflate and _G._hostDeflate(data) or ''
    end
    function Inflate(data)
      return _G._hostInflate and _G._hostInflate(data) or ''
    end

    -- Virtual filesystem
    local function normalizePath(path)
      path = tostring(path or ''):gsub('\\', '/'):gsub('/+', '/'):gsub('^/+', ''):gsub('^%./', '')
      local parts = {}
      for part in path:gmatch('[^/]+') do
        if part == '..' then
          if #parts > 0 then table.remove(parts) end
        elseif part ~= '.' and part ~= '' then
          parts[#parts + 1] = part
        end
      end
      return table.concat(parts, '/')
    end

    local function readMountedFile(path)
      path = normalizePath(path)
      return _G._mountedFiles[path]
        or _G._mountedFiles[path .. '.lua']
        or _G._mountedFiles['runtime/lua/' .. path]
        or _G._mountedFiles['runtime/lua/' .. path .. '.lua']
        or _G._mountedFiles['runtime/lua/' .. path .. '/init.lua']
    end

    local function getMountedMeta(path)
      path = normalizePath(path)
      return _G._mountedMeta[path]
        or _G._mountedMeta[path .. '.lua']
        or _G._mountedMeta['runtime/lua/' .. path]
        or _G._mountedMeta['runtime/lua/' .. path .. '.lua']
        or _G._mountedMeta['runtime/lua/' .. path .. '/init.lua']
    end

    local function escapePattern(text)
      return (text:gsub('([%^%$%(%)%%%.%[%]%+%-%?])', '%%%1'))
    end
    local function wildcardToPattern(pattern)
      return '^' .. escapePattern(normalizePath(pattern)):gsub('%%%*', '.*') .. '$'
    end

    function NewFileSearch(pattern)
      local matcher = wildcardToPattern(pattern)
      local matches = {}
      for mountedPath in pairs(_G._mountedFiles) do
        if normalizePath(mountedPath):match(matcher) then
          matches[#matches + 1] = normalizePath(mountedPath)
        end
      end
      table.sort(matches)
      if #matches == 0 then return nil end
      local idx = 1
      return {
        GetFileName = function()
          return matches[idx] and matches[idx]:match('([^/]+)$') or nil
        end,
        GetFileModifiedTime = function()
          local meta = matches[idx] and getMountedMeta(matches[idx])
          return meta and meta.modified or 0
        end,
        NextFile = function()
          if idx >= #matches then return false end
          idx = idx + 1; return true
        end,
      }
    end

    function loadfile(fileName)
      local path = normalizePath(fileName)
      local content = readMountedFile(path)
      if not content then return nil, 'cannot open ' .. path end
      content = content:gsub('^#[^\n]*\n', '', 1)
      return load(content, '@' .. path, 't', _G)
    end

    function dofile(fileName)
      local chunk, err = loadfile(fileName)
      if not chunk then error(err) end
      return chunk()
    end

    if io then
      io.open = function(fileName, mode)
        mode = mode or 'r'
        local norm = normalizePath(fileName)
        local content = mode:match('r') and readMountedFile(norm) or nil
        if content ~= nil then
          local closed, cursor = false, 1
          return {
            read = function(_, fmt)
              if closed then return nil end
              if fmt == nil or fmt == '*a' then cursor = #content + 1; return content end
              if fmt == '*l' then
                if cursor > #content then return nil end
                local brk = content:find('\n', cursor, true)
                local line
                if brk then line = content:sub(cursor, brk - 1); cursor = brk + 1
                else line = content:sub(cursor); cursor = #content + 1 end
                return line:gsub('\r$', '')
              end
              error('mounted io.open only supports *a and *l')
            end,
            close = function() closed = true end,
          }
        end
        if mode:match('w') or mode:match('a') or mode:match('%+') then
          local closed, chunks = false, {}
          return {
            write = function(_, d) if not closed then chunks[#chunks+1] = tostring(d or ''); return true end end,
            read = function() return nil end,
            close = function()
              if closed then return end; closed = true
              local written = table.concat(chunks)
              _G._writtenFiles[norm] = written
              _G._mountedFiles[norm] = written
              _G._mountedMeta[norm] = { modified = os.time() }
            end,
          }
        end
        return nil, 'file not found: ' .. tostring(fileName)
      end
    end

    -- Module loader (require shim)
    local packageLoaded = {}

    local function makeUtf8Shim()
      return {
        reverse = function(t) return string.reverse(t) end,
        gsub = function(t, p, r) return string.gsub(t, p, r) end,
        find = function(t, p, i, pl) return string.find(t, p, i, pl) end,
        sub = function(t, i, j) return string.sub(t, i, j) end,
        match = function(t, p, i) return string.match(t, p, i) end,
        next = function(t, i, d)
          i = i or 0; d = d or 1
          if d < 0 then return i <= 1 and nil or (i - 1) end
          return i >= #t and nil or (i + 1)
        end,
      }
    end

    function require(name)
      if packageLoaded[name] ~= nil then return packageLoaded[name] end
      if name == 'lcurl.safe' then packageLoaded[name] = {}; return packageLoaded[name] end
      if name == 'lua-utf8' then packageLoaded[name] = makeUtf8Shim(); return packageLoaded[name] end

      local norm = normalizePath(name)
      local modPath = normalizePath((name or ''):gsub('%.', '/'))
      local candidates = {
        norm, norm .. '.lua', modPath, modPath .. '.lua', modPath .. '/init.lua',
        'runtime/lua/' .. norm .. '.lua', 'runtime/lua/' .. norm .. '/init.lua',
        'runtime/lua/' .. modPath .. '.lua', 'runtime/lua/' .. modPath .. '/init.lua',
      }
      for _, c in ipairs(candidates) do
        local chunk = loadfile(c)
        if chunk then
          local result = chunk()
          packageLoaded[name] = result or true
          return packageLoaded[name]
        end
      end
      error('module not found: ' .. tostring(name))
    end
  `;

  // ── PoBLuaVM Class ──

  class PoBLuaVM {
    constructor() {
      this._factory = null;
      this._engine = null;
      this._buildReady = false;
      this._ready = false;
      this._initPromise = null;
      this._manifest = null;
      this._manifestPromise = null;
      this._assetCache = new Map();
      this._timelessManifestEntries = new Map();
      this._mountedTimelessAliases = new Set();
      this._progressListeners = new Set();
      this._mountBatchSize = 100;
      this._vmTaskQueue = Promise.resolve();
    }

    get isReady() { return this._ready; }
    get isBuildReady() { return this._buildReady; }

    onProgress(listener) {
      if (typeof listener !== 'function') {
        return () => {};
      }
      this._progressListeners.add(listener);
      return () => {
        this._progressListeners.delete(listener);
      };
    }

    _emitProgress(phase, detail = null) {
      const payload = {
        phase,
        detail,
        timestamp: Date.now(),
      };
      for (const listener of this._progressListeners) {
        try {
          listener(payload);
        } catch (err) {
          console.warn('[PoBLuaVM] Progress listener failed:', err);
        }
      }
    }

    _enqueueVmTask(task) {
      const runTask = this._vmTaskQueue.then(() => task());
      this._vmTaskQueue = runTask.catch(() => {});
      return runTask;
    }

    /** Initialize the headless PoB engine. Call once. */
    async init() {
      if (this._initPromise) return this._initPromise;
      this._initPromise = this._doInit();
      return this._initPromise;
    }

    async _doInit() {
      const t0 = performance.now();
      this._emitProgress('init.start');
      try {
        this._emitProgress('init.engine.create');
        const wasmUrl = this._resolveAssetUrl('lib/glue.wasm');
        this._factory = new Wasmoon.LuaFactory(wasmUrl);
        this._engine = await this._factory.createEngine({ openStandardLibs: true });
        this._emitProgress('init.engine.created');

        // Install inflate helper for binary asset decompression (returns hex to avoid UTF-8 corruption)
        this._engine.global.set('_hostInflate', compressed => this._inflateBinaryToHex(compressed));
        // Install Lua 5.4 compat shim + virtual filesystem
        this._emitProgress('init.shim.install');
        await this._engine.doString(UPSTREAM_HOST_SHIM);
        this._emitProgress('init.shim.installed');

        // Install hex→binary decoder (wasmoon corrupts binary strings via UTF-8 encoding)
        await this._engine.doString(`
          function _hexDecode(hex)
            return (hex:gsub('..', function(cc)
              return string.char(tonumber(cc, 16))
            end))
          end
          local _origInflate = _hostInflate
          _hostInflate = function(compressed)
            return _hexDecode(_origInflate(compressed))
          end
        `);

        // Mount all upstream PoB files
        this._emitProgress('init.manifest.load');
        const manifestEntries = await this._loadManifest();
        this._emitProgress('init.manifest.loaded', { count: manifestEntries.length });
        await this._mountUpstreamFiles(manifestEntries);

        // Apply local file overrides (for debugging)
        this._emitProgress('init.overrides.apply');
        await this._applyFileOverrides();
        this._emitProgress('init.overrides.applied');

        // Load HeadlessWrapper.lua which boots the full PoB engine
        this._emitProgress('init.headless.load');
        const headlessWrapper = await this._readManifestFile('HeadlessWrapper.lua');
        await this._engine.doString(headlessWrapper.replace(/^#[^\n]*\n/, ''));
        this._emitProgress('init.headless.loaded');

        // Re-apply host shim (HeadlessWrapper may overwrite some stubs)
        await this._engine.doString(UPSTREAM_HOST_SHIM);

        // Set up compat: ensure loadBuildFromXML is available
        await this._engine.doString(`
          if launch and launch.promptMsg then
            ConPrintf("[Headless] Suppressing startup prompt: %s", tostring(launch.promptMsg))
            launch.promptMsg = nil
          end
          if main and main.modes and main.modes["BUILD"] and not build then
            build = main.modes["BUILD"]
          end
          if main and main.modes and main.modes["BUILD"] and not loadBuildFromXML then
            function loadBuildFromXML(xmlText, name)
              main:SetMode("BUILD", false, name or "", xmlText)
              local ok, err = pcall(function() runCallback("OnFrame") end)
              if not ok then
                ConPrintf("[Headless] loadBuildFromXML OnFrame error: %s", tostring(err))
                if launch then launch.promptMsg = nil end
              end
              build = main.modes["BUILD"]
            end
          end
        `);

        this._ready = true;
        const durationMs = Math.round(performance.now() - t0);
        this._emitProgress('init.ready', { durationMs });
        console.log(`[PoBLuaVM] Engine ready in ${durationMs}ms`);
        return true;
      } catch (err) {
        this._emitProgress('init.failed', { message: String(err?.message || err) });
        console.error('[PoBLuaVM] Init failed:', err);
        if (this._engine) {
          this._engine.global.close();
          this._engine = null;
        }
        this._factory = null;
        this._ready = false;
        this._buildReady = false;
        this._manifest = null;
        this._initPromise = null;
        throw err;
      }
    }

    /**
     * Load a PoB build from XML text.
     * After this, calcItemSwap() is available.
     * @returns {object|null} Base stats { totalDps, life, energyShield, ... }
     */
    async initBuildFromXml(xmlText) {
      if (!xmlText || typeof xmlText !== 'string') {
        console.error('[PoBLuaVM] initBuildFromXml: missing XML');
        return null;
      }

      return this._enqueueVmTask(async () => {
        this._emitProgress('build.start');
        await this.init();
        const t0 = performance.now();

        try {
          await this._ensureTimelessDataForBuild(xmlText);
          this._emitProgress('build.load_xml');
          this._engine.global.set('_xmlText', xmlText);
          await this._engine.doString(`
          -- Settle helper: run OnFrame until no more pending work
          local function hasPendingWork()
            if main and main.newMode then return true end
            if build and build.buildFlag then return true end
            if main and main.onFrameFuncs then
              for _, fn in pairs(main.onFrameFuncs) do
                if type(fn) == "function" then return true end
              end
            end
            return false
          end

          local function settle(maxFrames)
            local frames = 0
            while frames < maxFrames and hasPendingWork() do
              local ok, err = xpcall(
                function() runCallback("OnFrame") end,
                function(e) return debug.traceback(e, 2) end
              )
              if not ok then return nil, tostring(err) end
              frames = frames + 1
            end
            return frames
          end

          loadBuildFromXML(_G._xmlText, "Browser Trade Overlay")
          _G._xmlText = nil
          _G._activeBuild = build
          _G._calculator = nil
          _G._baseOutput = build and build.calcsTab and build.calcsTab.mainOutput or nil
          _G._calcError = nil

          -- Settle the build (run pending OnFrame callbacks)
          local settledFrames, settleErr = settle(4)
          if settledFrames and build and build.calcsTab and build.calcsTab.mainOutput then
            _G._baseOutput = build.calcsTab.mainOutput
          elseif settleErr and not _G._calcError then
            _G._calcError = tostring(settleErr)
          end

          -- Get the calculator function for item swaps
          if build then
            local ok, calcFn, baseOut = xpcall(
              function()
                local calcs = LoadModule("Modules/Calcs")
                return calcs.getMiscCalculator(build)
              end,
              function(e) return debug.traceback(e, 2) end
            )
            if ok then
              _G._calculator = calcFn
              _G._baseOutput = baseOut or _G._baseOutput
            else
              _G._calcError = tostring(calcFn)
            end
          end

          -- Fallback: try calcsTab:GetMiscCalculator
          if not _G._calculator and build and build.calcsTab then
            local ok, calcFn, baseOut = xpcall(
              function() return build.calcsTab:GetMiscCalculator() end,
              function(e) return debug.traceback(e, 2) end
            )
            if ok then
              _G._calculator = calcFn
              _G._baseOutput = baseOut or _G._baseOutput
            else
              _G._calcError = tostring(calcFn)
            end
          end

          if not _G._calculator and not _G._calcError then
            _G._calcError = "GetMiscCalculator returned nil"
          end
        `);

          const hasCalc = await this._engine.doString('return _G._calculator ~= nil');
          if (!hasCalc) {
            const err = await this._engine.doString('return _G._calcError or "unknown"');
            console.error('[PoBLuaVM] Calculator init failed:', err);
            this._buildReady = false;
            this._emitProgress('build.failed', { message: String(err) });
            return null;
          }

          const baseOutput = await this._engine.doString('return _G._baseOutput');
          this._buildReady = true;
          const stats = this._extractOutput(baseOutput);
          const durationMs = Math.round(performance.now() - t0);
          this._emitProgress('build.ready', {
            durationMs,
            totalDps: stats?.totalDps || 0,
          });
          console.log(`[PoBLuaVM] Build loaded in ${durationMs}ms`);
          return stats;
        } catch (err) {
          console.error('[PoBLuaVM] initBuildFromXml failed:', err);
          this._buildReady = false;
          this._emitProgress('build.failed', { message: String(err?.message || err) });
          return null;
        }
      });
    }

    /**
     * Calculate the impact of swapping an item in the current build.
     * @param {string} slotName - PoB slot name ("Weapon 1", "Body Armour", etc.)
     * @param {string} itemText - PoB-format item text
     * @returns {object|null} { before, after, diff, dpsPct, isUpgrade }
     */
    async calcItemSwap(slotName, itemText) {
      if (!this._buildReady) {
        console.warn('[PoBLuaVM] calcItemSwap: build not ready');
        return null;
      }

      return this._enqueueVmTask(async () => {
        if (!this._buildReady) {
          console.warn('[PoBLuaVM] calcItemSwap: build not ready');
          return null;
        }

        try {
          this._engine.global.set('_swapSlot', slotName);
          this._engine.global.set('_swapItemText', itemText);

          const result = await this._engine.doString(`
          local slotName = _G._swapSlot
          local itemText = _G._swapItemText
          _G._swapSlot = nil
          _G._swapItemText = nil

          local repItem = new("Item", itemText)
          if not repItem or not repItem.base then
            ConPrintf("calcItemSwap: could not parse item for slot %s", tostring(slotName))
            return nil
          end
          if repItem.BuildModList then repItem:BuildModList() end

          local ok, newOutput = pcall(_G._calculator, {
            repSlotName = slotName,
            repItem = repItem,
          })
          if not ok then
            ConPrintf("calcItemSwap failed: %s", tostring(newOutput))
            return nil
          end

          local base = _G._baseOutput
          return {
            baseDPS     = base.TotalDPS or base.HitDPS or base.CombinedDPS or 0,
            newDPS      = newOutput.TotalDPS or newOutput.HitDPS or newOutput.CombinedDPS or 0,
            baseFullDPS = base.FullDPS or 0,
            newFullDPS  = newOutput.FullDPS or 0,
            baseAvgHit  = base.AverageDamage or base.AverageHit or 0,
            newAvgHit   = newOutput.AverageDamage or newOutput.AverageHit or 0,
            baseLife    = base.Life or 0,       newLife    = newOutput.Life or 0,
            baseES      = base.EnergyShield or 0, newES   = newOutput.EnergyShield or 0,
            baseMana    = base.Mana or 0,       newMana    = newOutput.Mana or 0,
            baseArmour  = base.Armour or 0,     newArmour  = newOutput.Armour or 0,
            baseEvasion = base.Evasion or 0,    newEvasion = newOutput.Evasion or 0,
            baseSpeed   = base.Speed or 0,      newSpeed   = newOutput.Speed or 0,
            baseCrit    = base.CritChance or 0,  newCrit   = newOutput.CritChance or 0,
            baseFireRes = base.FireResist or 0,  newFireRes = newOutput.FireResist or 0,
            baseColdRes = base.ColdResist or 0,  newColdRes = newOutput.ColdResist or 0,
            baseLightRes= base.LightningResist or 0, newLightRes = newOutput.LightningResist or 0,
            baseChaosRes= base.ChaosResist or 0, newChaosRes = newOutput.ChaosResist or 0,
          }
        `);

          if (!result) return null;

          const before = {
            totalDps: Math.round(result.baseDPS || 0),
            fullDps: Math.round(result.baseFullDPS || 0),
            averageHit: Math.round(result.baseAvgHit || 0),
            life: Math.round(result.baseLife || 0),
            energyShield: Math.round(result.baseES || 0),
            mana: Math.round(result.baseMana || 0),
            armour: Math.round(result.baseArmour || 0),
            evasion: Math.round(result.baseEvasion || 0),
            speed: result.baseSpeed || 0,
            critChance: result.baseCrit || 0,
            fireRes: Math.round(result.baseFireRes || 0),
            coldRes: Math.round(result.baseColdRes || 0),
            lightRes: Math.round(result.baseLightRes || 0),
            chaosRes: Math.round(result.baseChaosRes || 0),
          };
          const after = {
            totalDps: Math.round(result.newDPS || 0),
            fullDps: Math.round(result.newFullDPS || 0),
            averageHit: Math.round(result.newAvgHit || 0),
            life: Math.round(result.newLife || 0),
            energyShield: Math.round(result.newES || 0),
            mana: Math.round(result.newMana || 0),
            armour: Math.round(result.newArmour || 0),
            evasion: Math.round(result.newEvasion || 0),
            speed: result.newSpeed || 0,
            critChance: result.newCrit || 0,
            fireRes: Math.round(result.newFireRes || 0),
            coldRes: Math.round(result.newColdRes || 0),
            lightRes: Math.round(result.newLightRes || 0),
            chaosRes: Math.round(result.newChaosRes || 0),
          };
          const diff = {};
          for (const k of Object.keys(before)) diff[k] = after[k] - before[k];

          const dpsPct = before.totalDps > 0
            ? ((diff.totalDps / before.totalDps) * 100).toFixed(1)
            : '0.0';

          return { before, after, diff, dpsPct, isUpgrade: diff.totalDps > 0 || diff.life > 0 || diff.energyShield > 0 };
        } catch (err) {
          console.error('[PoBLuaVM] calcItemSwap failed:', err);
          return null;
        }
      });
    }

    /** Extract key stats from a PoB Lua output table */
    _extractOutput(output) {
      if (!output) return null;
      return {
        totalDps: Math.round(output.TotalDPS || output.HitDPS || output.CombinedDPS || 0),
        fullDps: Math.round(output.FullDPS || 0),
        averageHit: Math.round(output.AverageDamage || output.AverageHit || 0),
        life: Math.round(output.Life || 0),
        energyShield: Math.round(output.EnergyShield || 0),
        mana: Math.round(output.Mana || 0),
        armour: Math.round(output.Armour || 0),
        evasion: Math.round(output.Evasion || 0),
        speed: output.Speed || 0,
        critChance: output.CritChance || 0,
      };
    }

    /** Close all Lua engines and reset state */
    close() {
      if (this._engine) {
        this._engine.global.close();
        this._engine = null;
      }
      this._factory = null;
      this._ready = false;
      this._buildReady = false;
      this._initPromise = null;
      this._manifest = null;
      this._manifestPromise = null;
      this._assetCache.clear();
      this._timelessManifestEntries.clear();
      this._mountedTimelessAliases.clear();
      this._vmTaskQueue = Promise.resolve();
    }

    // ── Private: Asset Loading ──

    _resolveAssetUrl(path) {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        return chrome.runtime.getURL(path);
      }
      return path;
    }

    async _loadFileContent(path) {
      const cacheKey = `text:${path}`;
      const cached = this._assetCache.get(cacheKey);
      if (cached) return cached;

      const fetchPromise = (async () => {
        const url = this._resolveAssetUrl(path);
        const resp = await fetch(url, { cache: 'force-cache' });
        if (!resp.ok) throw new Error(`Failed to load ${path}: ${resp.status}`);
        return resp.text();
      })();

      this._assetCache.set(cacheKey, fetchPromise);
      try {
        return await fetchPromise;
      } catch (err) {
        this._assetCache.delete(cacheKey);
        throw err;
      }
    }

    async _loadManifest() {
      if (this._manifest) return this._manifest;
      if (this._manifestPromise) return this._manifestPromise;

      this._manifestPromise = (async () => {
        const url = this._resolveAssetUrl(UPSTREAM_BROWSER_MANIFEST);
        const resp = await fetch(url, { cache: 'force-cache' });
        if (!resp.ok) throw new Error(`Manifest load failed: ${resp.status}`);
        this._manifest = await resp.json();
        return this._manifest;
      })();

      try {
        return await this._manifestPromise;
      } catch (err) {
        this._manifestPromise = null;
        throw err;
      }
    }

    async _readManifestFile(virtualPath) {
      const entries = await this._loadManifest();
      const entry = entries.find(e => e.virtualPath === virtualPath);
      if (!entry) throw new Error(`Upstream file missing: ${virtualPath}`);
      return this._loadManifestEntryContent(entry);
    }

    async _loadManifestEntryContent(entry) {
      const mode = entry?.encoding === 'binary' ? 'binary' : 'text';
      const cacheKey = `${mode}:${entry.assetPath}`;
      const cached = this._assetCache.get(cacheKey);
      if (cached) return cached;

      const fetchPromise = (async () => {
        const url = this._resolveAssetUrl(entry.assetPath);
        const resp = await fetch(url, { cache: 'force-cache' });
        if (!resp.ok) throw new Error(`Failed to load ${entry.assetPath}: ${resp.status}`);
        if (mode === 'binary') {
          return this._bytesToBinaryString(new Uint8Array(await resp.arrayBuffer()));
        }
        return resp.text();
      })();

      this._assetCache.set(cacheKey, fetchPromise);
      try {
        return await fetchPromise;
      } catch (err) {
        this._assetCache.delete(cacheKey);
        throw err;
      }
    }

    _extractRequiredTimelessAliases(xmlText) {
      if (!xmlText || typeof xmlText !== 'string') return [];
      const aliases = [];
      for (const candidate of TIMELESS_JEWEL_ALIASES) {
        if (candidate.pattern.test(xmlText)) {
          aliases.push(candidate.aliasPath);
        }
      }
      return aliases;
    }

    async _ensureTimelessDataForBuild(xmlText) {
      const requiredAliases = this._extractRequiredTimelessAliases(xmlText)
        .filter(aliasPath => !this._mountedTimelessAliases.has(aliasPath));
      if (!requiredAliases.length) return;

      const aliasPayloads = await Promise.all(requiredAliases.map(async (aliasPath) => {
        const zipPath = aliasPath.replace(/\.bin$/, '.zip');
        const singleEntry = this._timelessManifestEntries.get(zipPath);
        if (singleEntry) {
          const content = await this._loadManifestEntryContent(singleEntry);
          return { virtualPath: aliasPath, hex: this._inflateBinaryToHex(content) };
        }

        const partEntries = [];
        for (let partIndex = 0; ; partIndex++) {
          const partEntry = this._timelessManifestEntries.get(`${zipPath}.part${partIndex}`);
          if (!partEntry) break;
          partEntries.push(partEntry);
        }
        if (!partEntries.length) {
          console.warn(`[PoBLuaVM] Timeless payload missing for ${aliasPath}`);
          return null;
        }

        const parts = await Promise.all(partEntries.map(entry => this._loadManifestEntryContent(entry)));
        return {
          virtualPath: aliasPath,
          hex: this._inflateBinaryToHex(parts.join('')),
        };
      }));

      const binaryAliases = aliasPayloads.filter(Boolean);
      for (let i = 0; i < binaryAliases.length; i += this._mountBatchSize) {
        const aliasChunk = binaryAliases.slice(i, i + this._mountBatchSize);
        await this._mountBinaryAliasBatch(
          aliasChunk.map(alias => alias.virtualPath),
          aliasChunk.map(alias => alias.hex),
          1000000 + i
        );
      }
      for (const alias of binaryAliases) {
        this._mountedTimelessAliases.add(alias.virtualPath);
      }
    }

    async _mountTextBatch(paths, contents, modifiedBase) {
      if (!paths.length) return;

      this._engine.global.set('_mountPaths', paths);
      this._engine.global.set('_mountContents', contents);
      this._engine.global.set('_mountModifiedBase', modifiedBase);
      await this._engine.doString(`
        local paths = _G._mountPaths
        local contents = _G._mountContents
        local modifiedBase = tonumber(_G._mountModifiedBase) or 1
        local count = #paths

        for i = 1, count do
          local path = paths[i]
          if path then
            _G._mountedFiles[path] = (contents and contents[i]) or ""
            _G._mountedMeta[path] = { modified = modifiedBase + i - 1 }
          end
        end

        _G._mountPaths = nil
        _G._mountContents = nil
        _G._mountModifiedBase = nil
      `);
    }

    async _mountBinaryAliasBatch(paths, hexPayloads, modifiedBase) {
      if (!paths.length) return;

      this._engine.global.set('_mountBinaryPaths', paths);
      this._engine.global.set('_mountBinaryHexes', hexPayloads);
      this._engine.global.set('_mountModifiedBase', modifiedBase);
      await this._engine.doString(`
        local paths = _G._mountBinaryPaths
        local hexes = _G._mountBinaryHexes
        local modifiedBase = tonumber(_G._mountModifiedBase) or 1
        local count = #paths

        for i = 1, count do
          local path = paths[i]
          if path then
            _G._mountedFiles[path] = _hexDecode((hexes and hexes[i]) or "")
            _G._mountedMeta[path] = { modified = modifiedBase + i - 1 }
          end
        end

        _G._mountBinaryPaths = nil
        _G._mountBinaryHexes = nil
        _G._mountModifiedBase = nil
      `);
    }

    async _mountUpstreamFiles(entries) {
      console.log(`[PoBLuaVM] Mounting ${entries.length} upstream files...`);
      const eagerEntries = [];
      for (const entry of entries) {
        const virtualPath = entry.virtualPath;
        const isTimelessBinary = virtualPath.startsWith('Data/TimelessJewelData/')
          && (virtualPath.endsWith('.zip') || /\.zip\.part\d+$/.test(virtualPath));
        if (isTimelessBinary) {
          this._timelessManifestEntries.set(virtualPath, entry);
        } else {
          eagerEntries.push(entry);
        }
      }

      this._emitProgress('init.assets.fetch', { total: eagerEntries.length });

      // Fetch eager file contents in parallel; Timeless binaries are loaded on demand per build.
      const contents = await Promise.all(eagerEntries.map(entry => this._loadManifestEntryContent(entry)));
      this._emitProgress('init.assets.fetched', { total: eagerEntries.length });

      const mountedPaths = [];
      const mountedContents = [];

      for (let i = 0; i < eagerEntries.length; i++) {
        const virtualPath = eagerEntries[i].virtualPath;
        mountedPaths.push(virtualPath);
        mountedContents.push(contents[i]);
      }

      // Mount upstream text/binary files in batches to reduce JS↔Lua bridge overhead.
      this._emitProgress('init.assets.mount', { total: mountedPaths.length });
      for (let i = 0; i < mountedPaths.length; i += this._mountBatchSize) {
        const batchPaths = mountedPaths.slice(i, i + this._mountBatchSize);
        const batchContents = mountedContents.slice(i, i + this._mountBatchSize);
        await this._mountTextBatch(batchPaths, batchContents, i + 1);
        this._emitProgress('init.assets.mount_progress', {
          mounted: Math.min(mountedPaths.length, i + batchPaths.length),
          total: mountedPaths.length,
        });
      }

      // Mount Settings.xml (PoB expects this)
      const settingsModified = entries.length + 1;
      await this._mountTextBatch(
        ['Settings.xml', 'Path of Building/Settings.xml'],
        [DEFAULT_SETTINGS_XML, DEFAULT_SETTINGS_XML],
        settingsModified
      );

      const hasLaunch = await this._engine.doString('return _G._mountedFiles["Launch.lua"] ~= nil');
      if (!hasLaunch) {
        throw new Error('Mounted file sanity check failed: Launch.lua missing after batch mount');
      }

      this._emitProgress('init.assets.mounted', {
        total: eagerEntries.length,
        aliases: 0,
      });
      console.log(`[PoBLuaVM] All files mounted (${eagerEntries.length} + 0 bin aliases)`);
    }

    async _applyFileOverrides() {
      const overrides = typeof window !== 'undefined' ? window.__POB_HEADLESS_FILE_OVERRIDES__ : null;
      if (!overrides || typeof overrides !== 'object') return;

      const entries = Object.entries(overrides).filter(([, v]) => typeof v === 'string' && v);
      if (!entries.length) return;

      console.log(`[PoBLuaVM] Applying ${entries.length} file override(s)`);
      const contents = await Promise.all(entries.map(([, assetPath]) => this._loadFileContent(assetPath)));
      for (let i = 0; i < entries.length; i += this._mountBatchSize) {
        const chunk = entries.slice(i, i + this._mountBatchSize);
        const chunkContents = contents.slice(i, i + this._mountBatchSize);
        await this._mountTextBatch(
          chunk.map(([virtualPath]) => virtualPath),
          chunkContents,
          100000 + i
        );
      }
    }

    // ── Binary helpers ──

    _inflateBinaryString(binaryString) {
      if (typeof Pako?.inflate !== 'function') {
        throw new Error('pako inflate unavailable');
      }
      return this._bytesToBinaryString(Pako.inflate(this._binaryStringToBytes(binaryString)));
    }

    _inflateBinaryToHex(binaryString) {
      if (typeof Pako?.inflate !== 'function') {
        throw new Error('pako inflate unavailable');
      }
      const bytes = Pako.inflate(this._binaryStringToBytes(binaryString));
      const hex = new Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) hex[i] = bytes[i].toString(16).padStart(2, '0');
      return hex.join('');
    }

    _binaryStringToBytes(str) {
      const bytes = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i) & 0xFF;
      return bytes;
    }

    _bytesToBinaryString(bytes) {
      let result = '';
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        result += String.fromCharCode(...bytes.subarray(i, i + chunk));
      }
      return result;
    }
  }

  // ── Singleton ──
  const _instance = new PoBLuaVM();

  function getInstance() {
    return _instance;
  }

  if (typeof window !== 'undefined') {
    window.PoBLuaVM = PoBLuaVM;
    window.pobLuaVM = getInstance();
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.PoBLuaVM = PoBLuaVM;
    globalThis.pobLuaVM = getInstance();
  }
})();
