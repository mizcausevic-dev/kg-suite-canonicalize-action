import { canonicalize } from "./canonicalize.js";
export function detectDrift(files, baseline, opts = {}) {
    const generatedAt = opts.now ?? new Date().toISOString();
    const flagNew = opts.flagNew !== false;
    const flagRemoved = opts.flagRemoved !== false;
    const findings = [];
    const currentHashes = {};
    // Compute current hashes for every readable JSON file.
    for (const f of files) {
        try {
            const parsed = JSON.parse(f.raw);
            const { sha256 } = canonicalize(parsed);
            currentHashes[f.path] = sha256;
        }
        catch (e) {
            findings.push({
                code: "malformed-json",
                severity: "high",
                message: e.message,
                file: f.path
            });
        }
    }
    if (!baseline) {
        findings.push({
            code: "baseline-missing",
            severity: "info",
            message: `No baseline file present. Run with update-baseline=true to seed one.`
        });
        return {
            generatedAt,
            files: files.length,
            baselinePresent: false,
            currentHashes,
            driftedFiles: [],
            newFiles: Object.keys(currentHashes).sort(),
            removedFiles: [],
            findings,
            ok: !findings.some((f) => f.severity === "high")
        };
    }
    const driftedFiles = [];
    const newFiles = [];
    const removedFiles = [];
    for (const [path, hash] of Object.entries(currentHashes)) {
        if (!(path in baseline.hashes)) {
            newFiles.push(path);
            if (flagNew) {
                findings.push({
                    code: "new-doc",
                    severity: "low",
                    message: `New document not in baseline; sha256=${hash.slice(0, 19)}…`,
                    file: path
                });
            }
            continue;
        }
        if (baseline.hashes[path] !== hash) {
            driftedFiles.push(path);
            findings.push({
                code: "hash-drift",
                severity: "high",
                message: `Canonical hash drifted: ${baseline.hashes[path].slice(0, 19)}… → ${hash.slice(0, 19)}…`,
                file: path
            });
        }
    }
    for (const path of Object.keys(baseline.hashes)) {
        if (!(path in currentHashes)) {
            removedFiles.push(path);
            if (flagRemoved) {
                findings.push({
                    code: "removed-doc",
                    severity: "low",
                    message: `Document was in baseline but is no longer present`,
                    file: path
                });
            }
        }
    }
    driftedFiles.sort();
    newFiles.sort();
    removedFiles.sort();
    return {
        generatedAt,
        files: files.length,
        baselinePresent: true,
        currentHashes,
        driftedFiles,
        newFiles,
        removedFiles,
        findings,
        ok: !findings.some((f) => f.severity === "high")
    };
}
