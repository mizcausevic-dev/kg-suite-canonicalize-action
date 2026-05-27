# Security Policy

`kg-suite-canonicalize-action` reads JSON files from the workflow's checkout, optionally writes a single `.kg-hashes.json` baseline file, posts a PR comment via the GitHub API (when run on a pull_request event with a valid token), and writes structured outputs. No remote fetch beyond the GitHub API comment call, no execution of user-supplied code.

The hash is **content-addressed**: it identifies the canonical bytes, not the source. A consumer that trusts a hash should also independently obtain the doc to verify provenance.

The action uses `${{ github.token }}` by default — scoped to the repository where the workflow runs and never persisted. If you provide your own token via the `github-token` input, ensure it has only `pull-requests: write` permissions.

## Supported versions

Only the latest tagged release is supported.

## Reporting a vulnerability

Please use GitHub Security Advisories for private disclosure:

- [Open a security advisory](https://github.com/mizcausevic-dev/kg-suite-canonicalize-action/security/advisories/new)

Do not file public issues for security reports.
