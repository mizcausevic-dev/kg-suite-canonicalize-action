import type { DriftReport, DriftSeverity } from "./drift.js";

const SEVERITY_LABEL: Record<DriftSeverity, string> = {
  high: "🔴 high",
  medium: "🟠 medium",
  low: "🟡 low",
  info: "ℹ️  info"
};
const SEVERITY_RANK: Record<DriftSeverity, number> = { high: 0, medium: 1, low: 2, info: 3 };

export function toMarkdown(report: DriftReport): string {
  const lines: string[] = [];
  lines.push(report.ok ? `## Suite canonical-hash drift ✅` : `## Suite canonical-hash drift ❌`);
  lines.push(``);
  lines.push(`Generated: \`${report.generatedAt}\` · Files: **${report.files}** · Baseline present: ${report.baselinePresent ? "✓" : "—"}`);
  lines.push(``);
  lines.push(`- **Drifted:** ${report.driftedFiles.length}`);
  lines.push(`- **New:** ${report.newFiles.length}`);
  lines.push(`- **Removed:** ${report.removedFiles.length}`);

  const ranked = [...report.findings].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  if (ranked.length > 0) {
    lines.push(``);
    lines.push(`### Findings (${ranked.length})`);
    lines.push(``);
    lines.push(`| severity | code | file | message |`);
    lines.push(`|---|---|---|---|`);
    for (const f of ranked) {
      lines.push(`| ${SEVERITY_LABEL[f.severity]} | \`${f.code}\` | ${f.file ?? "—"} | ${f.message} |`);
    }
  } else {
    lines.push(``);
    lines.push(`No findings.`);
  }
  return lines.join("\n");
}

export function toSummary(report: DriftReport): string {
  return `${report.files} file${report.files === 1 ? "" : "s"} · ${report.driftedFiles.length} drifted · ${report.newFiles.length} new · ${report.removedFiles.length} removed (${report.ok ? "ok" : "fail"})`;
}
