/* global chrome */

const BuildStorage = (() => {
  'use strict';

  const BUILDS_KEY = 'pobBuilds';
  const ACTIVE_BUILD_ID_KEY = 'activeBuildId';
  const LEGACY_BUILD_KEY = 'pobData';
  const ACTIVE_BUILD_CODE_KEY = 'pobCoolUrl';

  function createId() {
    return `build_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function parseStoredValue(raw) {
    if (!raw) return null;
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return raw;
  }

  function getDefaultBuildName(build) {
    const info = build?.buildInfo || {};
    const className = info.ascendClassName || info.className || 'PoB Build';
    return info.level ? `${className} Lv.${info.level}` : className;
  }

  function normalizeBuildEntry(build) {
    if (!build || typeof build !== 'object') return null;
    return {
      ...build,
      id: String(build.id || createId()),
      importedAt: Number(build.importedAt || Date.now()),
      name: String(build.name || getDefaultBuildName(build)),
      pobCode: typeof build.pobCode === 'string' ? build.pobCode : null,
    };
  }

  async function persistState(builds, activeBuildId) {
    const normalizedBuilds = builds.map(normalizeBuildEntry).filter(Boolean);
    const activeBuild = normalizedBuilds.find((build) => build.id === activeBuildId) || null;

    await chrome.storage.local.set({
      [BUILDS_KEY]: normalizedBuilds,
      [ACTIVE_BUILD_ID_KEY]: activeBuild ? activeBuild.id : null,
      [LEGACY_BUILD_KEY]: activeBuild ? JSON.stringify(activeBuild) : null,
      [ACTIVE_BUILD_CODE_KEY]: activeBuild && activeBuild.pobCode ? activeBuild.pobCode : null,
    });

    const removeKeys = [];
    if (!activeBuild) {
      removeKeys.push(LEGACY_BUILD_KEY, ACTIVE_BUILD_CODE_KEY);
    } else if (!activeBuild.pobCode) {
      removeKeys.push(ACTIVE_BUILD_CODE_KEY);
    }
    if (removeKeys.length) {
      await chrome.storage.local.remove(removeKeys);
    }

    return {
      builds: normalizedBuilds,
      activeBuildId: activeBuild ? activeBuild.id : null,
      activeBuild,
    };
  }

  async function getState() {
    const stored = await chrome.storage.local.get([
      BUILDS_KEY,
      ACTIVE_BUILD_ID_KEY,
      LEGACY_BUILD_KEY,
      ACTIVE_BUILD_CODE_KEY,
    ]);

    let builds = Array.isArray(stored[BUILDS_KEY])
      ? stored[BUILDS_KEY].map(normalizeBuildEntry).filter(Boolean)
      : [];
    let activeBuildId = stored[ACTIVE_BUILD_ID_KEY] || null;
    let migrated = false;

    if (!builds.length) {
      const legacyBuild = parseStoredValue(stored[LEGACY_BUILD_KEY]);
      if (legacyBuild) {
        builds = [normalizeBuildEntry({
          ...legacyBuild,
          pobCode: stored[ACTIVE_BUILD_CODE_KEY] || legacyBuild.pobCode || null,
        })];
        activeBuildId = builds[0].id;
        migrated = true;
      }
    }

    if (builds.length && !builds.some((build) => build.id === activeBuildId)) {
      activeBuildId = builds[0].id;
      migrated = true;
    }

    if (migrated) {
      return persistState(builds, activeBuildId);
    }

    return {
      builds,
      activeBuildId,
      activeBuild: builds.find((build) => build.id === activeBuildId) || null,
    };
  }

  async function addBuild(build, options = {}) {
    const { setActive = true } = options;
    const state = await getState();
    const normalizedBuild = normalizeBuildEntry(build);
    const builds = [normalizedBuild, ...state.builds.filter((entry) => entry.id !== normalizedBuild.id)];
    return persistState(builds, setActive ? normalizedBuild.id : state.activeBuildId);
  }

  async function setActiveBuild(buildId) {
    const state = await getState();
    if (!state.builds.some((build) => build.id === buildId)) {
      return state;
    }
    return persistState(state.builds, buildId);
  }

  async function deleteBuild(buildId) {
    const state = await getState();
    const builds = state.builds.filter((build) => build.id !== buildId);
    const activeBuildId = builds.length
      ? (state.activeBuildId === buildId ? builds[0].id : state.activeBuildId)
      : null;
    return persistState(builds, activeBuildId);
  }

  async function clearBuilds() {
    await chrome.storage.local.remove([
      BUILDS_KEY,
      ACTIVE_BUILD_ID_KEY,
      LEGACY_BUILD_KEY,
      ACTIVE_BUILD_CODE_KEY,
    ]);
    return { builds: [], activeBuildId: null, activeBuild: null };
  }

  async function getActiveBuild() {
    const state = await getState();
    return state.activeBuild;
  }

  return {
    addBuild,
    clearBuilds,
    createId,
    deleteBuild,
    getActiveBuild,
    getDefaultBuildName,
    getState,
    normalizeBuildEntry,
    setActiveBuild,
  };
})();

if (typeof module !== 'undefined') module.exports = BuildStorage;