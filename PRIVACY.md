# Privacy Policy

## Summary

PoE Impact View does not include analytics, advertising, or telemetry.

The extension stores imported build data locally in your browser and performs network requests only when needed to provide the requested functionality.

## Data Stored Locally

The extension uses `chrome.storage.local` to store:

- imported PoB builds
- the currently active build
- selected UI language
- extension settings required for the overlay and popup to work

This data remains on the local browser profile unless you explicitly export, share, or upload it through a third-party service.

## Network Requests

The extension may communicate with the following services:

- `pathofexile.com` trade pages, to read trade listings in the overlay
- `pob.cool`, when reading a build from the PoB web UI context
- `pobb.in`, only when you explicitly import a build from a `pobb.in` URL

The extension does not operate a separate backend server of its own.

## Data Sharing

PoE Impact View does not sell personal data.

PoE build data or trade-related data is only sent to third-party services when the feature you triggered requires it. For example, importing a build from `pobb.in` requires requesting that build code from `pobb.in`.

## Logging And Telemetry

- no analytics SDKs
- no advertising identifiers
- no background telemetry endpoint
- no remote error-reporting service

Any debug output is limited to the local browser console.

## Your Control

You can remove locally stored extension data at any time by:

1. deleting builds from the popup UI
2. clearing the extension's site data in the browser
3. uninstalling the extension

## Third-Party Services

If you use external services such as `pob.cool`, `pobb.in`, `poe.ninja`, or official Path of Exile endpoints, their own privacy policies and terms apply to those services.

## Changes

If this policy changes, update this file in the repository so the current behavior is documented alongside the code.