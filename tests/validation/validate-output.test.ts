/**
 * DF-SPECLANG-5-R4: `speclang validate` must SUMMARIZE warnings, not flood.
 *
 * Dogfood verdict (PROMISING-BUT-ROUGH): a real spec tree produced 535
 * warnings over 452 files, and the default text output printed a block per
 * file — ~1900 lines of "✓ Passed" before the reader reached the summary, with
 * the warning count stranded at the bottom. The contract pinned here:
 *
 *   default text  → only FAILED files get a block; warnings are COUNTED and
 *                   grouped (by rule, then most frequent message); the exit
 *                   code is unaffected by warnings
 *   --verbose     → every file's block, every warning listed (detail on demand)
 *   --format json → unchanged wire contract (no human text on stdout)
 *
 * The assertions derive their numbers from an actual `validateCommand` run
 * over a fixture tree, so a revert to per-file printing fails on the
 * line-count bound rather than on prose that could drift.
 */

import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { ValidationReporter } from "../../src/validation/reporter";
import type { ValidationReport, ValidationResult } from "../../src/validation/types";

const REPO_ROOT = process.cwd();
const CLI_BIN = path.join(REPO_ROOT, "bin", "speclang");
const BUILT_VALIDATION_CLI = path.join(
  REPO_ROOT,
  "dist",
  "src",
  "validation",
  "cli.js"
);

// ============================================================================
// FIXTURE BUILDERS
// ============================================================================

/**
 * Build a spec with a CORRECT `lines:N` header count.
 *
 * The count is computed from the emitted header rather than hardcoded: a
 * wrong count is a parse failure, and the parser's tolerance table
 * (docs/troubleshooting.md) makes one-off mistakes silently drop metadata.
 */
function buildSpec(
  id: string,
  options: { status?: string; version?: string; body?: string } = {}
): string {
  const header: string[] = [];
  header.push("@HEADER@"); // replaced below once the count is known
  header.push(`id: "${id}"`);
  header.push(`version: ${options.version ?? "1.0.0"}`);
  header.push("layer: 1");
  header.push("tags: [test]");
  if (options.status !== undefined) {
    header.push(`status: ${options.status}`);
  }
  header.push("---");
  header[0] = `# speclang-header lines:${header.length}`;
  return `${header.join("\n")}\n${options.body ?? ""}`;
}

const tempDirs: string[] = [];

/** Materialize a throwaway project tree: { "specs/x.spec.md": content }. */
function makeTree(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "speclang-r4-"));
  tempDirs.push(dir);
  for (const [relPath, content] of Object.entries(files)) {
    const absolute = path.join(dir, relPath);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, content);
  }
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

interface CapturedRun {
  status: number;
  stdout: string;
  lines: string[];
  text: string;
}

/**
 * Run the REAL user surface — `bin/speclang validate` over the built CLI.
 *
 * Importing `src/validation/cli.ts` in-process does not work: `src/validation`
 * is a symlink into `specs/validation.spec.dir/src`, and the module's own
 * `../parser/header` import only resolves through the `src/` view (the same
 * dual-view quirk documented in tests/validation/parse-validate.test.ts). The
 * binary is also exactly what the dogfood report and the acceptance criteria
 * exercise, so the assertions run against the artifact a user runs.
 */
function runValidate(
  projectDir: string,
  options: { verbose?: boolean; format?: "text" | "json" } = {}
): CapturedRun {
  expect(
    fs.existsSync(BUILT_VALIDATION_CLI),
    `validation CLI is not built at ${BUILT_VALIDATION_CLI} — run \`npm run build\` (npm test does this via pretest)`
  ).toBe(true);

  const args = [CLI_BIN, "validate", "-d", projectDir];
  if (options.verbose) args.push("--verbose");
  if (options.format) args.push("--format", options.format);

  const run = spawnSync(process.execPath, args, {
    cwd: REPO_ROOT,
    encoding: "utf-8",
    maxBuffer: 32 * 1024 * 1024,
  });

  const stdout = run.stdout ?? "";
  return {
    status: run.status ?? -1,
    stdout,
    lines: stdout.split("\n").filter((line) => line.length > 0),
    text: stdout,
  };
}

function warning(rule: string, message: string): ValidationResult {
  return {
    rule,
    level: "warning",
    location: { file: "specs/x.spec.md", line: 1 },
    message,
  };
}

function reportWith(file: string, warnings: ValidationResult[]): ValidationReport {
  return {
    file,
    errors: [],
    warnings,
    passed: true,
    timestamp: new Date(),
  };
}

// ============================================================================
// REPORTER: COMPACT BREAKDOWN
// ============================================================================

describe("ValidationReporter.formatWarningSummary (DF-SPECLANG-5-R4)", () => {
  it("groups warnings by rule and ranks the most frequent messages", () => {
    const reporter = new ValidationReporter();
    const reports = [
      reportWith("specs/a.spec.md", [
        warning("@validation/autonomous", 'Potentially ambiguous language: "should"'),
        warning("@validation/autonomous", 'Potentially ambiguous language: "should"'),
        warning("@validation/header", "Non-standard status: open"),
      ]),
      reportWith("specs/b.spec.md", [
        warning("@validation/autonomous", 'Potentially ambiguous language: "etc."'),
      ]),
      reportWith("specs/clean.spec.md", []),
    ];

    const output = reporter.formatWarningSummary(reports);

    // Count + coverage: 4 warnings, in 2 of the 3 files.
    expect(output).toContain("Warnings by rule (2 of 3 files):");
    expect(output).toMatch(/@validation\/autonomous\s+3/);
    expect(output).toMatch(/@validation\/header\s+1/);

    // Most frequent messages, most frequent first.
    const mostFrequent = output.indexOf("Most frequent warnings:");
    expect(mostFrequent).toBeGreaterThan(-1);
    expect(output.slice(mostFrequent)).toContain('Potentially ambiguous language: "should"');
    expect(output.slice(mostFrequent)).toContain('Potentially ambiguous language: "etc."');

    // Detail stays on demand.
    expect(output).toContain("--verbose");
    expect(output).toContain("--format json");
  });

  it("is empty when there is nothing to summarize", () => {
    const reporter = new ValidationReporter();
    expect(reporter.formatWarningSummary([reportWith("specs/a.spec.md", [])])).toBe("");
    expect(reporter.formatWarningSummary([])).toBe("");
  });

  it("drops the --verbose hint when the reporter is already verbose", () => {
    const verbose = new ValidationReporter(true);
    const output = verbose.formatWarningSummary([
      reportWith("specs/a.spec.md", [warning("@validation/header", "Non-standard status: open")]),
    ]);

    expect(output).toContain("Non-standard status: open");
    expect(output).not.toContain("--verbose");
  });

  it("bounds the printed message list with a remainder line", () => {
    const reporter = new ValidationReporter();
    const warnings = Array.from({ length: 9 }, (_, i) =>
      warning("@validation/autonomous", `Distinct message ${i}`)
    );

    const output = reporter.formatWarningSummary([reportWith("specs/a.spec.md", warnings)], {
      topMessages: 3,
    });

    const mostFrequent = output.indexOf("Most frequent warnings:");
    const listed = output
      .slice(mostFrequent)
      .split("\n")
      .filter((line) => line.includes("Distinct message"));
    expect(listed).toHaveLength(3);
    expect(output).toContain("… 6 more distinct warning(s)");
  });
});

// ============================================================================
// CLI: DEFAULT OUTPUT IS A SUMMARY
// ============================================================================

describe("speclang validate output is a summary (DF-SPECLANG-5-R4)", () => {
  /** A tree big enough that per-file blocks would dominate the output. */
  function treeWithWarnings(cleanFiles: number): string {
    const files: Record<string, string> = {};
    for (let i = 0; i < cleanFiles; i++) {
      files[`specs/clean-${i}.spec.md`] = buildSpec(`@test/clean-${i}`);
    }
    files["specs/warn-open.spec.md"] = buildSpec("@test/warn-open", {
      status: "open",
      body: "The system should be fast.\n",
    });
    files["specs/warn-closed.spec.md"] = buildSpec("@test/warn-closed", {
      status: "closed",
      body: "Some values may vary.\n",
    });
    return makeTree(files);
  }

  it("does not print a block per file, so the output stays one screen", () => {
    const projectDir = treeWithWarnings(24);
    const { status, text, lines } = runValidate(projectDir);

    // Contract: warnings do not fail a project.
    expect(status).toBe(0);

    // The flood: no per-file "✓ Passed" blocks, no per-warning detail lines
    // (detail lines carry the rule id in `⚠ [rule]` form).
    expect(text).not.toContain("✓ Passed");
    expect(text).not.toContain("⚠ [@validation/header]");

    // 26 files would be ~130+ lines under the old per-file format; the
    // summarized output is a single screen regardless of file count.
    expect(lines.length).toBeLessThanOrEqual(20);
  });

  it("reports the warning count with a compact breakdown by rule", () => {
    const projectDir = treeWithWarnings(24);
    const { text } = runValidate(projectDir);

    // AC1: the summary carries "Warnings:" plus a numeric count.
    expect(text).toMatch(/Warnings: 2\b/);
    expect(text).toMatch(/✅ Passed: 26/);
    expect(text).toMatch(/Errors: 0/);

    // The compact breakdown, not 26 per-file blocks.
    expect(text).toContain("Warnings by rule (2 of 26 files):");
    expect(text).toMatch(/@validation\/header\s+2/);
    // …and the path to the detail.
    expect(text).toContain("--verbose");
  });

  it("--verbose restores per-file detail and every warning", () => {
    const projectDir = treeWithWarnings(3);
    const { text } = runValidate(projectDir, { verbose: true });

    expect(text).toContain("✓ Passed");
    expect(text).toContain("Non-standard status: open");
    expect(text).toContain("Non-standard status: closed");
    expect(text).toContain("Warnings: 2");
  });

  it("still prints a block for a file that FAILED, errors first", () => {
    const projectDir = makeTree({
      "specs/ok.spec.md": buildSpec("@test/ok", { status: "open" }),
      "specs/bad-id.spec.md": buildSpec("not-an-at-id"),
    });

    const { status, text } = runValidate(projectDir);

    expect(status).toBe(1);
    expect(text).toContain("✗ Failed");
    expect(text).toContain("ID must start with @");
    expect(text).toMatch(/Failed: 1/);
    // The failing file's block does not reopen the per-warning flood.
    expect(text).not.toContain("⚠ [@validation/header]");
  });

  it("--format json keeps stdout machine-readable (no human text)", () => {
    const projectDir = treeWithWarnings(2);
    const { text } = runValidate(projectDir, { format: "json" });

    const parsed = JSON.parse(text) as {
      warnings: number;
      totalFiles: number;
      reports: unknown[];
    };
    expect(parsed.warnings).toBe(2);
    expect(parsed.totalFiles).toBe(4);
    expect(parsed.reports).toHaveLength(4);
    expect(text).not.toContain("Warnings by rule");
  });
});
