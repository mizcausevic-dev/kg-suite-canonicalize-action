import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { canonicalize } from "../src/canonicalize.js";
import { detectDrift } from "../src/drift.js";
import { toMarkdown, toSummary } from "../src/format.js";
import { run, type RunnerEnv } from "../src/runner.js";

const here = fileURLToPath(new URL(".", import.meta.url));
const FIXTURES = `${here}/../fixtures/specs`;

function envWithInputs(inputs: Record<string, string>, overrides: Partial<RunnerEnv> = {}): RunnerEnv {
  return {
    inputs,
    readFile: (p) => readFileSync(p, "utf8"),
    readDir: (p) => readdirSync(p),
    isFile: (p) => statSync(p).isFile(),
    exists: (p) => existsSync(p),
    writeFile: () => undefined,
    write: () => undefined,
    ...overrides
  };
}

describe("detectDrift unit", () => {
  it("flags baseline-missing when null baseline", () => {
    const files = [{ path: "x.json", raw: '{"a":1}' }];
    const r = detectDrift(files, null, { now: "2026-01-01T00:00:00Z" });
    expect(r.baselinePresent).toBe(false);
    expect(r.findings.some((f) => f.code === "baseline-missing")).toBe(true);
    expect(r.newFiles).toEqual(["x.json"]);
  });

  it("flags hash-drift when current ≠ baseline", () => {
    const current = canonicalize({ a: 1 }).sha256;
    const files = [{ path: "x.json", raw: '{"a":2}' }]; // changed value
    const r = detectDrift(files, { hashes: { "x.json": current } });
    expect(r.driftedFiles).toEqual(["x.json"]);
    expect(r.findings.some((f) => f.code === "hash-drift")).toBe(true);
    expect(r.ok).toBe(false);
  });

  it("reports ok when current matches baseline", () => {
    const matching = canonicalize({ a: 1 }).sha256;
    const files = [{ path: "x.json", raw: '{"a":1}' }];
    const r = detectDrift(files, { hashes: { "x.json": matching } });
    expect(r.driftedFiles).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("flags new-doc and removed-doc", () => {
    const files = [{ path: "new.json", raw: '{"a":1}' }];
    const r = detectDrift(files, { hashes: { "gone.json": "sha256:abc" } });
    expect(r.newFiles).toEqual(["new.json"]);
    expect(r.removedFiles).toEqual(["gone.json"]);
  });

  it("flags malformed-json (high)", () => {
    const files = [{ path: "broken.json", raw: "not-json" }];
    const r = detectDrift(files, null);
    expect(r.findings.some((f) => f.code === "malformed-json")).toBe(true);
    expect(r.ok).toBe(false);
  });

  it("respects flagNew=false / flagRemoved=false", () => {
    const r = detectDrift(
      [{ path: "x.json", raw: '{"a":1}' }],
      { hashes: { "y.json": "sha256:abc" } },
      { flagNew: false, flagRemoved: false }
    );
    expect(r.findings.filter((f) => f.code === "new-doc")).toHaveLength(0);
    expect(r.findings.filter((f) => f.code === "removed-doc")).toHaveLength(0);
  });

  it("toMarkdown + toSummary render", () => {
    const r = detectDrift([{ path: "x.json", raw: '{"a":1}' }], null);
    expect(toMarkdown(r)).toContain("Suite canonical-hash drift");
    expect(toSummary(r)).toContain("file");
  });
});

describe("runner.run", () => {
  it("exits 0 with no baseline (baseline-missing is info)", async () => {
    const r = await run(envWithInputs({ dir: FIXTURES, fail_on_drift: "true", comment_on_pr: "false" }));
    expect(r.exitCode).toBe(0);
    expect(r.report.baselinePresent).toBe(false);
    expect(r.report.files).toBe(2);
  });

  it("exits 1 when fail-on-drift set and hash drift detected", async () => {
    const env = envWithInputs(
      { dir: FIXTURES, fail_on_drift: "true", comment_on_pr: "false", baseline: "fake.json" },
      {
        exists: (p) => p === "fake.json" || existsSync(p),
        readFile: (p) =>
          p === "fake.json"
            ? JSON.stringify({ hashes: { "agent-card-a.json": "sha256:0000000000000000000000000000000000000000000000000000000000000000" } })
            : readFileSync(p, "utf8")
      }
    );
    const r = await run(env);
    expect(r.exitCode).toBe(1);
    expect(r.report.driftedFiles).toContain("agent-card-a.json");
  });

  it("writes baseline file when update-baseline=true", async () => {
    let captured: { path: string; content: string } | null = null;
    const env = envWithInputs(
      { dir: FIXTURES, update_baseline: "true", fail_on_drift: "false", comment_on_pr: "false" },
      { writeFile: (p, c) => { captured = { path: p, content: c }; } }
    );
    const r = await run(env);
    expect(r.baselineUpdated).toBe(true);
    expect(captured).not.toBeNull();
    const parsed = JSON.parse(captured!.content) as { hashes: Record<string, string> };
    expect(Object.keys(parsed.hashes)).toContain("agent-card-a.json");
  });

  it("rejects when dir input is missing", async () => {
    await expect(run({ inputs: {} })).rejects.toThrow(/dir/);
  });

  it("posts a PR comment in pull_request context", async () => {
    const calls: Array<{ body: string }> = [];
    const env: RunnerEnv = envWithInputs(
      { dir: FIXTURES, comment_on_pr: "auto", github_token: "ghs", fail_on_drift: "false" },
      {
        GITHUB_EVENT_NAME: "pull_request",
        GITHUB_REPOSITORY: "x/y",
        GITHUB_EVENT_PATH: `${here}/event.json`,
        readFile: (p) => (p.endsWith("event.json") ? JSON.stringify({ number: 7 }) : readFileSync(p, "utf8")),
        postComment: async (args) => { calls.push({ body: args.body }); }
      }
    );
    const r = await run(env);
    expect(r.commentPosted).toBe(true);
    expect(calls[0].body).toContain("canonical-hash drift");
  });

  it("ignores corrupt baseline file (treats as missing)", async () => {
    const env = envWithInputs(
      { dir: FIXTURES, fail_on_drift: "false", comment_on_pr: "false", baseline: "corrupt.json" },
      {
        exists: (p) => p === "corrupt.json" || existsSync(p),
        readFile: (p) => (p === "corrupt.json" ? "not-json" : readFileSync(p, "utf8"))
      }
    );
    const r = await run(env);
    expect(r.report.baselinePresent).toBe(false);
  });
});
