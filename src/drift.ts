import { canonicalize } from "./canonicalize.js";

export interface Baseline {
  /** Map from file path (relative to dir) to sha256 hash. */
  hashes: Record<string, string>;
  /** ISO timestamp when this baseline was last generated. */
  generated_at?: string;
}

export type DriftCode = "hash-drift" | "new-doc" | "removed-doc" | "baseline-missing" | "malformed-json";
export type DriftSeverity = "high" | "medium" | "low" | "info";

export interface DriftFinding {
  code: DriftCode;
  severity: DriftSeverity;
  message: string;
  file?: string;
}

export interface DriftReport {
  generatedAt: string;
  files: number;
  baselinePresent: boolean;
  currentHashes: Record<string, string>;
  driftedFiles: string[];
  newFiles: string[];
  removedFiles: string[];
  findings: DriftFinding[];
  ok: boolean;
}

export interface DetectDriftOptions {
  now?: string;
  /** If false, suppress "new-doc" findings even when baseline is present. */
  flagNew?: boolean;
  /** If false, suppress "removed-doc" findings. */
  flagRemoved?: boolean;
}

export function detectDrift(
  files: Array<{ path: string; raw: string }>,
  baseline: Baseline | null,
  opts: DetectDriftOptions = {}
): DriftReport {
  const generatedAt = opts.now ?? new Date().toISOString();
  const flagNew = opts.flagNew !== false;
  const flagRemoved = opts.flagRemoved !== false;
  const findings: DriftFinding[] = [];
  const currentHashes: Record<string, string> = {};

  // Compute current hashes for every readable JSON file.
  for (const f of files) {
    try {
      const parsed = JSON.parse(f.raw);
      const { sha256 } = canonicalize(parsed);
      currentHashes[f.path] = sha256;
    } catch (e) {
      findings.push({
        code: "malformed-json",
        severity: "high",
        message: (e as Error).message,
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

  const driftedFiles: string[] = [];
  const newFiles: string[] = [];
  const removedFiles: string[] = [];

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
