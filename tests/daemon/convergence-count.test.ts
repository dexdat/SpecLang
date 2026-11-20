/**
 * DF-SPECLANG-024 — the converge summary must count OUTPUTS, not inputs.
 *
 * DF-SPECLANG-021 replaced an event counter with a Set of watcher paths, but
 * the Set was still filled from watcher events, and the file the user just
 * SAVED is a watcher event. A save that generated nothing therefore still
 * printed:
 *
 *   [Convergence] Files changed: 1, Depth: 1
 *   [Convergence] Cascade complete! Files: 1, Duration: 30927ms
 *
 * while the project held zero new files. The fix has two halves, and both are
 * asserted here:
 *
 *   1. convergence.ts accounts for INPUTS (spec/source files the watcher
 *      reported, deduped) separately from OUTPUTS (files a pass wrote, reported
 *      by the writer through `recordOutputs()`). Only outputs feed
 *      `filesChanged` / `filesChangedCount`, the completion line and the
 *      summary object.
 *   2. daemon.ts derives those outputs from the project tree (snapshot before
 *      the on_converge pipeline, snapshot after, diff), so the count is what
 *      actually landed on disk rather than what a stage claims.
 *
 * These tests use REAL fixture trees on disk: the defect is about which paths
 * count, and a numeric type cannot express that.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { ConvergenceDetector } from "../../src/daemon/convergence";
import { Daemon } from "../../src/daemon/daemon";
import {
  snapshotProjectFiles,
  diffOutputSnapshots,
  DEFAULT_IGNORED_DIRECTORIES,
} from "../../src/daemon/outputs";
import { DaemonConfig, FileEvent, FileEventKind } from "../../src/daemon/types";

const QUIET_PERIOD_NEVER = 3600; // seconds — the interval must not fire mid-test

function testConfig(quietPeriod = QUIET_PERIOD_NEVER): DaemonConfig {
  return {
    watch: { paths: ["specs"], ignore: ["node_modules"] },
    convergence: {
      quietPeriod,
      maxDepth: 5,
      testOnConverge: false,
      autoCommit: false,
    },
    agentApi: { port: 0, host: "127.0.0.1" },
    locks: { dir: ".locks", timeout: 30 },
    logging: { level: "info", file: "" },
  };
}

function event(kind: FileEventKind, filePath: string): FileEvent {
  return { kind, path: filePath, timestamp: Date.now() };
}

/** Force the quiet period to pass so a cascade can settle deterministically. */
function settle(detector: ConvergenceDetector) {
  detector.setQuietPeriod(0);
  return detector.getConvergenceResult();
}

function logLines(spy: { mock: { calls: unknown[][] } }): string[] {
  return spy.mock.calls.map((args) => String(args[0]));
}

describe("DF-SPECLANG-024: convergence reports OUTPUTS, not input events", () => {
  let projectDir: string;
  let detector: ConvergenceDetector;

  beforeEach(() => {
    projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "speclang-conv-outputs-"));
    fs.mkdirSync(path.join(projectDir, "specs"), { recursive: true });
    detector = new ConvergenceDetector(testConfig());
  });

  afterEach(() => {
    detector.stop();
    fs.rmSync(projectDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  /** Write a real file into the fixture project and return its project-relative path. */
  function touch(relPath: string, contents: string): string {
    const abs = path.join(projectDir, relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, contents);
    return relPath;
  }

  it("reports 0 on a save that writes no generated files (the DF-024 defect)", () => {
    const spec = touch("specs/main.spec.md", "# main\n");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    detector.onEvent(event(FileEventKind.Modify, spec));

    // The edited spec is an INPUT: it never reaches the changed-file count.
    expect(detector.getStatus().filesChanged).toBe(0);
    expect(detector.getStatus().inputFiles).toBe(1);

    const settled = settle(detector);
    expect(settled.converged).toBe(true);
    expect(settled.filesChanged).toBe(0);
    expect(settled.outputsCount).toBe(0);
    expect(settled.outputs).toEqual([]);
    expect(settled.inputFiles).toBe(1);

    // The pipeline wrote nothing, so the pass reports nothing.
    const completed = detector.recordOutputs([]);
    expect(completed.filesChanged).toBe(0);
    expect(completed.outputs).toEqual([]);

    const lines = logLines(log);
    expect(lines.some((line) => line.includes("[Convergence] Files changed: 1"))).toBe(false);
    expect(lines.some((line) => /\bFiles: 1\b/.test(line))).toBe(false);
    expect(
      lines.some((line) => line.startsWith("[Convergence] Cascade complete! Files: 0")),
    ).toBe(true);
    expect(
      lines.some((line) => line.startsWith("[Convergence] Outputs: 0")),
    ).toBe(true);
  });

  it("reports 3 and names the paths when the pass writes three files", () => {
    const spec = touch("specs/main.spec.md", "# main\n");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    detector.onEvent(event(FileEventKind.Modify, spec));
    settle(detector);

    const outputs = [
      "src/generated/main.spec-a.ts",
      "src/generated/main.spec-b.ts",
      "src/generated/main.spec-c.ts",
    ];
    const result = detector.recordOutputs(outputs);

    expect(result.filesChanged).toBe(3);
    expect(result.outputsCount).toBe(3);
    expect(result.outputs).toEqual(outputs);
    expect(detector.getStatus().filesChanged).toBe(3);

    const completion = logLines(log).filter((line) =>
      line.startsWith("[Convergence] Cascade complete!"),
    );
    expect(completion).toHaveLength(1);
    expect(completion[0]).toContain("Files: 3");

    // AC-2: the summary names the output paths it wrote.
    const named = logLines(log).filter((line) =>
      line.startsWith("[Convergence] Outputs: 3"),
    );
    expect(named).toHaveLength(1);
    for (const output of outputs) {
      expect(named[0]).toContain(output);
    }
  });

  it("dedupes inputs and never lets them inflate the output count", () => {
    const spec = touch("specs/main.spec.md", "# main\n");
    const other = touch("specs/other.spec.md", "# other\n");

    // added, then modified, then re-verified — one logical file, three events
    detector.onEvent(event(FileEventKind.Create, spec));
    detector.onEvent(event(FileEventKind.Modify, spec));
    detector.onEvent(event(FileEventKind.Modify, spec));
    detector.onEvent(event(FileEventKind.Create, other));

    expect(detector.getStatus().inputFiles).toBe(2);
    expect(detector.getStatus().filesChanged).toBe(0);

    settle(detector);
    expect(detector.recordOutputs(["src/generated/main.spec-main.ts"]).filesChanged).toBe(1);
  });

  it("counts an output once even when the writer reports it twice", () => {
    const spec = touch("specs/main.spec.md", "# main\n");
    detector.onEvent(event(FileEventKind.Modify, spec));

    detector.recordOutputs([
      "src/generated/main.spec-main.ts",
      "./src/generated/main.spec-main.ts",
    ]);

    expect(detector.getStatus().filesChanged).toBe(1);
    expect(detector.getStatus().outputs).toEqual(["src/generated/main.spec-main.ts"]);
  });

  it("starts each new pass at zero instead of carrying the previous count", () => {
    const spec = touch("specs/main.spec.md", "# main\n");

    detector.onEvent(event(FileEventKind.Modify, spec));
    settle(detector);
    detector.recordOutputs([
      "src/generated/a.ts",
      "src/generated/b.ts",
    ]);
    expect(detector.getStatus().filesChanged).toBe(2);

    // Next save: a new pass, with no outputs written yet.
    detector.onEvent(event(FileEventKind.Modify, spec));
    expect(detector.getStatus().filesChanged).toBe(0);

    settle(detector);
    const result = detector.recordOutputs(["src/generated/one.ts"]);
    expect(result.filesChanged).toBe(1);
    expect(result.outputs).toEqual(["src/generated/one.ts"]);
  });

  it("clears inputs and outputs on reset", () => {
    const spec = touch("specs/main.spec.md", "# main\n");
    detector.onEvent(event(FileEventKind.Modify, spec));
    detector.recordOutputs(["src/generated/a.ts"]);
    expect(detector.getStatus().filesChanged).toBe(1);

    detector.reset();

    expect(detector.getStatus().filesChanged).toBe(0);
    expect(detector.getStatus().inputFiles).toBe(0);
    expect(detector.getStatus().outputs).toEqual([]);
  });

  it("marks a truncated output count as a lower bound instead of guessing", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    detector.recordOutputs(["src/generated/a.ts"], { incomplete: true });

    const line = logLines(log).find((entry) =>
      entry.startsWith("[Convergence] Cascade complete!"),
    );
    expect(line).toContain("lower bound");
  });

  it("never claims completion when the pipeline stopped early", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    detector.recordOutputs(["src/generated/partial.ts"], { complete: false });

    const lines = logLines(log);
    expect(lines.some((entry) => entry.includes("Cascade complete!"))).toBe(false);
    expect(
      lines.some((entry) =>
        entry.startsWith("[Convergence] Outputs written before the pipeline stopped — Files: 1"),
      ),
    ).toBe(true);
  });
});

describe("DF-SPECLANG-024: daemon output accounting from the project tree", () => {
  let projectDir: string;
  let detector: ConvergenceDetector;
  let daemon: Daemon;

  beforeEach(() => {
    projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "speclang-daemon-outputs-"));
    fs.mkdirSync(path.join(projectDir, "specs"), { recursive: true });
    fs.mkdirSync(path.join(projectDir, "src"), { recursive: true });
    detector = new ConvergenceDetector(testConfig());
    daemon = new Daemon();
    // The detector is created by Daemon.start(); wire it the same way for a
    // unit-level probe of the accounting seam.
    (daemon as any).convergence = detector;
  });

  afterEach(() => {
    detector.stop();
    fs.rmSync(projectDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  function write(relPath: string, contents: string): void {
    const abs = path.join(projectDir, relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, contents);
  }

  it("attributes only the files written between the two snapshots", () => {
    // The save lands FIRST (that is what wakes the daemon); the snapshot is
    // taken once the cascade settles, i.e. after the edit is already on disk.
    write("specs/main.spec.md", "# main\n\n## probe\n");
    write("src/generated/stable.ts", "unchanged\n");
    const before = snapshotProjectFiles(projectDir);

    // The pipeline then rewrites the stable file identically and generates 3.
    write("src/generated/stable.ts", "unchanged\n");
    write("src/generated/one.ts", "one\n");
    write("src/generated/two.ts", "two\n");
    write("src/generated/three.ts", "three\n");

    const result = (daemon as any).reportPipelineOutputs(before, true) as {
      filesChanged: number;
      outputs: string[];
    };

    expect(result.filesChanged).toBe(3);
    expect([...result.outputs].sort()).toEqual([
      "src/generated/one.ts",
      "src/generated/three.ts",
      "src/generated/two.ts",
    ]);
    // The edited spec is on disk but was already there before the pass, so it
    // is not an output (it is an input).
    expect(result.outputs).not.toContain("specs/main.spec.md");
  });

  it("reports zero when the pass wrote nothing at all", () => {
    write("specs/main.spec.md", "# main\n\n## probe\n");
    const before = snapshotProjectFiles(projectDir);

    const result = (daemon as any).reportPipelineOutputs(before, true) as {
      filesChanged: number;
      outputs: string[];
    };

    expect(result.filesChanged).toBe(0);
    expect(result.outputs).toEqual([]);
  });

  it("snapshotProjectFiles skips VCS, dependency and daemon-state trees", () => {
    write("src/generated/keep.ts", "keep\n");
    for (const ignored of DEFAULT_IGNORED_DIRECTORIES) {
      write(`${ignored}/noise.ts`, "noise\n");
    }

    const snapshot = snapshotProjectFiles(projectDir);

    expect([...snapshot.files.keys()]).toEqual(["src/generated/keep.ts"]);
    expect(snapshot.truncated).toBe(false);
  });

  it("diffOutputSnapshots ignores deletions and identical rewrites", () => {
    write("src/generated/kept.ts", "one\n");
    write("src/generated/removed.ts", "gone\n");
    const before = snapshotProjectFiles(projectDir);

    write("src/generated/kept.ts", "one\n"); // identical rewrite: new mtime, same bytes
    fs.rmSync(path.join(projectDir, "src/generated/removed.ts"));
    write("src/generated/added.ts", "new\n");

    expect(diffOutputSnapshots(before, snapshotProjectFiles(projectDir))).toEqual([
      "src/generated/added.ts",
    ]);
  });

  it("diffOutputSnapshots reports a content change to an existing file", () => {
    write("src/generated/main.spec-main.ts", "// v1\n");
    const before = snapshotProjectFiles(projectDir);

    write("src/generated/main.spec-main.ts", "// v2 — three blocks now\n");

    expect(diffOutputSnapshots(before, snapshotProjectFiles(projectDir))).toEqual([
      "src/generated/main.spec-main.ts",
    ]);
  });

  it("does not count a run log the project declares as noise (self-inflicted inflation)", () => {
    // `speclang start > daemon.log` writes a file into the project DURING the
    // pass. The project's own watch.ignore says `*.log` is noise, so the
    // accounting must not report it as generated code.
    write("specs/main.spec.md", "# main\n");
    const options = { ignoreFilePatterns: ["*.log"] };
    const before = snapshotProjectFiles(projectDir, options);

    write("daemon.log", "🔄 cascade running\n");
    write("src/generated/real.ts", "real\n");

    const outputs = diffOutputSnapshots(before, snapshotProjectFiles(projectDir, options));
    expect(outputs).toEqual(["src/generated/real.ts"]);
  });

  it("keeps the exclusion set on the snapshot so a re-snapshot cannot drift", () => {
    const snapshot = snapshotProjectFiles(projectDir, { ignoreFilePatterns: ["*.log"] });
    expect(snapshot.ignoreFilePatterns).toEqual(["*.log"]);
    expect(snapshot.ignoreDirectories).toEqual(DEFAULT_IGNORED_DIRECTORIES);
  });
});

describe("DF-SPECLANG-024: daemon wiring", () => {
  const REPO_ROOT = path.resolve(__dirname, "..", "..");

  it("executePipeline snapshots before running the pipeline and reports after it", () => {
    const source = fs.readFileSync(
      path.join(REPO_ROOT, "specs", "daemon.spec.dir", "src", "daemon.ts"),
      "utf-8",
    );
    const snapshotIndex = source.indexOf("snapshotProjectFiles(process.cwd(),");
    const executeIndex = source.indexOf("await executor.execute(convergenceResult)");
    const reportIndex = source.indexOf("this.reportPipelineOutputs(");

    expect(snapshotIndex).toBeGreaterThan(-1);
    expect(executeIndex).toBeGreaterThan(snapshotIndex);
    expect(reportIndex).toBeGreaterThan(executeIndex);
    expect(source).toMatch(/convergence\.recordOutputs\(/);
  });

  it("convergence.ts owns the accounting symbol the board greps for", () => {
    const source = fs.readFileSync(
      path.join(REPO_ROOT, "specs", "daemon.spec.dir", "src", "convergence.ts"),
      "utf-8",
    );
    expect(source).toMatch(/filesChangedCount/);
  });
});
