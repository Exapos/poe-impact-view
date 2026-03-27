# PoE Impact View

PoE Impact View is an unofficial Chrome extension for Path of Exile trade pages that overlays item impact using a browser-hosted Path of Building runtime.

Current project status: version 0.1.0.

## Quick Start

1. Install dependencies with `npm install`
2. Open `chrome://extensions`
3. Enable Developer mode
4. Choose Load unpacked
5. Select the repository root
6. Open the popup, import a build, and choose the active build
7. Open an official Path of Exile trade search and inspect item deltas in the overlay

## Features

- imports PoB builds and keeps multiple saved builds locally
- reads live build state from `pob.cool`
- runs upstream Path of Building logic in the browser through a bundled Lua/WASM runtime
- compares trade items against the active build
- shows DPS, life, energy shield, and other deltas directly on trade listings
- updates popup and overlay language from one shared setting

## How It Works

The extension combines three pieces:

1. trade-page parsing and overlay rendering on official Path of Exile trade pages
2. build import and management in the popup
3. a browser-side PoB runtime based on vendored Path of Building Community files plus bundled runtime dependencies

No dedicated backend service is required for the extension itself.

## Architecture Overview

High-level runtime flow:

1. a build is imported from `pob.cool` or a compatible PoB source
2. the build is stored locally in browser extension storage
3. the extension boots a browser-hosted Path of Building runtime using vendored upstream files
4. trade items are parsed from official trade listings
5. candidate items are evaluated against the active build
6. deltas are rendered directly into the trade overlay and popup UI

## Repository Structure

- `background/` service worker logic
- `content/` trade page integration, parser, bridge, and overlay UI
- `lib/` PoB VM wrapper, stat extraction, i18n, storage helpers, and bundled runtime assets
- `popup/` popup UI for importing and selecting builds
- `options/` extension settings UI
- `PathOfBuilding-dev/` vendored upstream Path of Building Community source snapshot and manifests
- `build/` scripts that bundle runtime dependencies for MV3 use
- `scripts/` maintenance and validation scripts
- `debug/` retained debugging probes and local investigation helpers

## Development

Install dependencies:

```bash
npm install
```

Rebuild bundled browser assets:

```bash
npm run build
```

Or rebuild them individually:

```bash
npm run bundle:wasmoon
npm run bundle:pako
```

## Development Notes

- `PathOfBuilding-dev/` is a vendored upstream snapshot and should be treated as upstream code unless you intentionally patch it
- `lib/wasmoon-bundle.js`, `lib/pako-bundle.js`, and `lib/glue.wasm` are generated runtime assets
- if you change the bundling inputs, rebuild bundles before publishing
- debug probes are intentionally kept in `debug/` because they are useful for parity and regression work

## Accuracy And Scope

This extension aims to stay as close as practical to desktop Path of Building behavior by using vendored Path of Building Community code and data in the browser.

That said, exact parity is not guaranteed in every edge case.

Reasons differences can still appear:

- upstream PoB changes may not yet be synced into the vendored snapshot
- browser runtime constraints can differ from desktop execution details
- item parsing and trade-site normalization may miss unusual or newly introduced mechanics
- display-oriented overlay summaries intentionally reduce the full PoB output into a smaller set of visible deltas

If you find a mismatch, please include the build source, item text, and expected PoB result when reporting it.

## Known Limitations

- the extension is designed around Chromium-based extension APIs and Manifest V3
- it depends on vendored upstream PoB files being present in the repository/package
- calculations are strongest when the imported build is compatible with the vendored PoB snapshot
- some mechanics may require upstream PoB updates before they evaluate correctly here
- trade overlay output is intentionally condensed and does not expose the entire PoB calculation tree inline

## Permissions Explained

- `storage`: saves imported builds, active build state, language choice, and extension settings locally
- `declarativeNetRequest`: applies the header rule required for `pob.cool` integration behavior

Host permissions are limited to the sites the extension needs to read from or communicate with:

- `pobb.in`
- `pob.cool`

## Load The Extension Locally

1. Open `chrome://extensions`
2. Enable Developer mode
3. Choose Load unpacked
4. Select the repository root

## Permissions And External Services

The extension requests only the permissions needed for local storage, `pob.cool` frame integration, and the external sites it directly reads from.

External services used by the extension:

- `pob.cool`
- `pobb.in` for explicit build import flows

See [PRIVACY.md](PRIVACY.md) for a plain-language privacy summary.

## FAQ

### Does this upload my builds anywhere automatically?

No. Imported builds are stored locally in the extension unless you explicitly use a workflow that sends build data to a third-party service such as `pobb.in`.

### Why is `PathOfBuilding-dev/` inside this repository?

The extension runs Path of Building logic in the browser, so it needs a vendored upstream snapshot of PoB source and data files at runtime.

### Is this an official Path of Exile or Path of Building tool?

No. It is an unofficial community project.

### Why are there bundled files in `lib/`?

Manifest V3 content scripts need browser-compatible runtime assets, so dependencies such as wasmoon and pako are bundled into distributable files.

### Can I use this as a base for my own extension or fork?

Yes, for the original project code under the MIT license, but you must also preserve and comply with the licenses of bundled and vendored third-party components.

## TO-DO

- optimization and runtime performance improvements
- better extension settings and configuration UX
- richer overlay stat summaries and clearer compare views
- more resilient handling for upstream PoB changes
- better debugging and mismatch reproduction workflows
- improved build-management UX beyond basic active-build switching
- optional value and upgrade-ranking helpers using market data

## Attribution And Third-Party Software

This project uses and redistributes third-party software.

Most importantly:

- `PathOfBuilding-dev/` is a vendored snapshot of Path of Building Community and keeps its upstream license in `PathOfBuilding-dev/LICENSE.md`
- `lib/wasmoon-bundle.js` and `lib/glue.wasm` are generated from `wasmoon`
- `lib/pako-bundle.js` is generated from `pako`

For the exact notices and included license texts, see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Legal Status

PoE Impact View is an unofficial fan project.

- It is not affiliated with or endorsed by Grinding Gear Games.
- It is not affiliated with or endorsed by the Path of Building Community project.
- It is not affiliated with or endorsed by `pob.cool`, `pobb.in`, or `poe.ninja`.

Path of Exile and related names, assets, and trademarks belong to their respective owners.

## License

The original code in this repository is licensed under the MIT license. See [LICENSE](LICENSE).

Third-party components keep their own licenses and notices. The root MIT license does not replace or override upstream licenses for vendored or bundled third-party code.

## Contributing And Security

- contribution workflow: [CONTRIBUTING.md](CONTRIBUTING.md)
- security reporting: [SECURITY.md](SECURITY.md)