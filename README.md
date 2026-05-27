# kg-suite-canonicalize-action

[![CI](https://github.com/mizcausevic-dev/kg-suite-canonicalize-action/actions/workflows/ci.yml/badge.svg)](https://github.com/mizcausevic-dev/kg-suite-canonicalize-action/actions/workflows/ci.yml)
[![License: AGPL-3.0-or-later](https://img.shields.io/badge/License-AGPL--3.0--or--later-blue.svg)](LICENSE)

GitHub Action that computes the **canonical sha256** for every Kinetic Gain Suite JSON document in a directory and compares it against a **committed baseline** (`.kg-hashes.json`). Any doc whose hash drifted without a version bump **fails the build**.

**Silent-edit detector** — catches the case where someone tweaked the wording of an AgentCard or Tool Card description and shipped it without bumping `agent_card_version` / `tool_card_version` / etc. Without this gate, the registry shows the same version but the content is different.

Wraps [`kg-suite-canonicalize`](https://github.com/mizcausevic-dev/kg-suite-canonicalize).

**Third in the cross-protocol Action trio:**

- [`kg-suite-spec-version-tracker-action`](https://github.com/mizcausevic-dev/kg-suite-spec-version-tracker-action) — version drift across protocols
- [`kg-suite-conformance-runner-action`](https://github.com/mizcausevic-dev/kg-suite-conformance-runner-action) — required-block structural validation
- **`kg-suite-canonicalize-action`** — silent-edit / hash-drift detection

Part of the [Kinetic Gain Suite](https://suite.kineticgain.com/).

---

## Usage

```yaml
name: Suite drift gate
on:
  pull_request:
    paths: ["governance-docs/**"]

jobs:
  canonicalize:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: mizcausevic-dev/kg-suite-canonicalize-action@v0.1-shipped
        with:
          dir: governance-docs/
          fail-on-drift: true
```

**First-time setup** (seed the baseline):

```yaml
- uses: mizcausevic-dev/kg-suite-canonicalize-action@v0.1-shipped
  with:
    dir: governance-docs/
    update-baseline: true     # writes .kg-hashes.json — commit it
```

## Inputs

| input              | required | default                              | description |
|---|---|---|---|
| `dir`              | ✓        | —                                    | Directory containing `*.json` Suite documents. |
| `baseline`         |          | `<dir>/.kg-hashes.json`              | Path to the baseline hash file. |
| `update-baseline`  |          | `false`                              | When `true`, overwrite the baseline with current hashes. |
| `comment-on-pr`    |          | `auto`                               | `auto` posts only on `pull_request` events. |
| `fail-on-drift`    |          | `true`                               | Fail the run on any hash drift. |
| `github-token`     |          | `${{ github.token }}`                | Token used to post the PR comment. |

## Outputs

| output             | description |
|---|---|
| `total-files`      | Number of JSON files analyzed. |
| `drifted-files`    | Number of files whose hash drifted. |
| `new-files`        | Files present now but not in baseline. |
| `removed-files`    | Files in baseline but no longer present. |

## What it flags

| Code | Severity | Rule |
|---|---|---|
| `hash-drift` | 🔴 | A doc's canonical sha256 changed without baseline update. **The fail trigger.** |
| `malformed-json` | 🔴 | File is not valid JSON. |
| `new-doc` | 🟡 | A doc exists now but wasn't in the baseline. |
| `removed-doc` | 🟡 | A doc was in baseline but is no longer present. |
| `baseline-missing` | ℹ️ | No baseline file exists — run with `update-baseline: true` to seed. |

## Composes with

- [**`kg-suite-canonicalize`**](https://github.com/mizcausevic-dev/kg-suite-canonicalize) — the library this wraps.
- [**`kg-suite-spec-version-tracker-action`**](https://github.com/mizcausevic-dev/kg-suite-spec-version-tracker-action) — version drift gate.
- [**`kg-suite-conformance-runner-action`**](https://github.com/mizcausevic-dev/kg-suite-conformance-runner-action) — structural validation gate.
- The 4 per-protocol fleet-summary actions — content-level governance gates.

## License

[AGPL-3.0-or-later](LICENSE)
