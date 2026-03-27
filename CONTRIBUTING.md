# Contributing

Thanks for considering a contribution to PoE Impact View.

## Before You Start

- read [README.md](README.md) for project scope and legal notes
- check whether your change affects vendored upstream code in `PathOfBuilding-dev/`
- keep changes focused and avoid unrelated refactors

## Local Setup

1. Install dependencies with `npm install`
2. Load the repository as an unpacked extension in Chrome
3. Rebuild bundles with `npm run build` if you touch bundling inputs
4. Run validation with `node scripts/validate-extension.mjs`

## Contribution Guidelines

- prefer small, reviewable pull requests
- explain user-visible behavior changes clearly
- include reproduction steps for bug fixes
- keep generated or vendored file changes intentional and documented
- preserve upstream license files and notices

## Working With Vendored PoB Files

The `PathOfBuilding-dev/` tree is vendored upstream code.

If you patch it:

- keep the change minimal
- mention why the patch is needed
- note whether the change should eventually be replaced by a future upstream sync

## Testing Expectations

At minimum, contributors should:

- run `node scripts/validate-extension.mjs`
- verify the popup still loads
- verify the trade overlay still renders on a supported trade page

If the change affects calculations, include a concrete before/after case.

## Pull Request Notes

Useful PR content:

- what changed
- why it changed
- how to test it
- whether vendored or generated assets changed
- whether any legal or attribution files needed updates