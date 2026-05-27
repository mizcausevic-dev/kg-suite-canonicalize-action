export interface CanonicalizeResult {
    /** Canonical JSON string (sorted keys, no trailing whitespace). */
    canonical: string;
    /** Hex sha256 of the canonical string, prefixed with "sha256:". */
    sha256: string;
    /** Bytes of the canonical string (UTF-8). */
    size_bytes: number;
}
export interface CanonicalizeOptions {
    /**
     * Pretty-print with 2-space indentation. Default false (compact, deterministic).
     * Use this only for human inspection — pretty-printed output still hashes
     * stably but is not the canonical form a downstream verifier expects.
     */
    pretty?: boolean;
}
