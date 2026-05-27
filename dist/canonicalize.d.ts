import type { CanonicalizeOptions, CanonicalizeResult } from "./types.js";
/**
 * Canonicalize a JSON document and compute its sha256.
 *
 * The canonical form:
 *   - keys at every level are sorted ascending
 *   - arrays preserve order (semantically meaningful)
 *   - compact output (no whitespace) by default; pass `pretty: true` for 2-space indent
 *   - trailing whitespace stripped
 *
 * Hashes are stable across JSON parsers and across machines — useful for
 * diff/audit chains, signature anchoring, and dedupe across mirrors.
 */
export declare function canonicalize(input: unknown, opts?: CanonicalizeOptions): CanonicalizeResult;
/**
 * Verify that a previously-stored sha256 still matches the canonical form
 * of the current input. Returns true on match.
 */
export declare function verifyHash(input: unknown, expectedSha256: string): boolean;
