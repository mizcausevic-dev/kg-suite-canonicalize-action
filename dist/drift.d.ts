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
export declare function detectDrift(files: Array<{
    path: string;
    raw: string;
}>, baseline: Baseline | null, opts?: DetectDriftOptions): DriftReport;
