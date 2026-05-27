import { createHash } from "node:crypto";

import type { CanonicalizeOptions, CanonicalizeResult } from "./types.js";

/**
 * Recursively sort object keys to produce a deterministic key order.
 * Arrays preserve order (order is semantically meaningful in our specs).
 * Numbers, strings, booleans, and null pass through unchanged.
 */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(value as Record<string, unknown>).sort();
    for (const k of keys) sorted[k] = sortKeys((value as Record<string, unknown>)[k]);
    return sorted;
  }
  return value;
}

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
export function canonicalize(input: unknown, opts: CanonicalizeOptions = {}): CanonicalizeResult {
  if (input === undefined) throw new Error("input is required");
  const sorted = sortKeys(input);
  const canonical = opts.pretty ? JSON.stringify(sorted, null, 2) : JSON.stringify(sorted);
  if (canonical === undefined) throw new Error("input could not be serialized to JSON (likely contains a function or undefined value)");
  const sha256 = `sha256:${createHash("sha256").update(canonical, "utf8").digest("hex")}`;
  return {
    canonical,
    sha256,
    size_bytes: Buffer.byteLength(canonical, "utf8")
  };
}

/**
 * Verify that a previously-stored sha256 still matches the canonical form
 * of the current input. Returns true on match.
 */
export function verifyHash(input: unknown, expectedSha256: string): boolean {
  if (!expectedSha256.startsWith("sha256:")) return false;
  const { sha256 } = canonicalize(input);
  return sha256 === expectedSha256;
}
