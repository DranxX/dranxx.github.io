# DRX Framework distribution

This directory is a deployable snapshot of the workspace `Style/` framework. It is vendored so `V0.1.5/` remains standalone when copied or deployed without sibling folders.

- Version and canonical inventory: `framework.manifest.json`
- CSS entrypoint: `drx-framework.css`
- JavaScript runtime: `js/drx.js`
- Portfolio-owned CSS loads after the entrypoint and may compose documented `.drx-*` classes without changing the framework source.

To refresh this snapshot, copy the same distribution paths from `Style/` and run `npm run validate` plus `npm run smoke` from `V0.1.5/`.
