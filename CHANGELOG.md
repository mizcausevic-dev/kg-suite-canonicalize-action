# Changelog

## v0.1.0 — 2026-05-27

- Initial release: GitHub Action wrapping `kg-suite-canonicalize` as a silent-edit / hash-drift detector.
- Inputs: `dir` (required), `baseline` (default `<dir>/.kg-hashes.json`), `update-baseline` (default false), `comment-on-pr` (auto/true/false), `fail-on-drift` (default true), `github-token`.
- Outputs: `total-files`, `drifted-files`, `new-files`, `removed-files`.
- Vendored `canonicalize()` from `kg-suite-canonicalize`.
- New `detectDrift()` primitive: takes a current-file set + a baseline `Baseline { hashes }`, returns a `DriftReport` with `driftedFiles`, `newFiles`, `removedFiles`, and 5-code finding list.
- 5 finding codes: `hash-drift` (high — the fail trigger), `malformed-json` (high), `new-doc` (low), `removed-doc` (low), `baseline-missing` (info).
- `update-baseline: true` writes the current hash set to the baseline file — use to seed or accept the drift.
- Posts per-PR Markdown comment when run on `pull_request` events with a valid token.
- Composite Node 20 action with `dist/index.js` committed for SHA/tag pinning.
- 13 tests, includes unit coverage on the `detectDrift` primitive and integration coverage on the runner.
- 2-doc AgentCard fixture corpus.
- **Third cross-protocol Action — completes the trio** with `kg-suite-spec-version-tracker-action` and `kg-suite-conformance-runner-action`. Run all three as a 3-gate Suite CI.
- Node 20/22 CI (lint, typecheck, coverage, build, `npm audit`), AGPL-3.0-or-later, Dependabot.
