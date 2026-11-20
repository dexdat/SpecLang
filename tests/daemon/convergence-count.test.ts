/**
 * DF-SPECLANG-021 — `speclang cascade` must report DISTINCT files changed.
 *
 * The convergence detector increments its "files changed" tally once per file
 * EVENT. One logical file routinely produces several events in a single
 * cascade (added, then modified, then re-verified), so a 3-file change could
 * report `Files: 9` and downstream agents read that number as the size of the
 * change. The tally must be the size of the set of distinct paths the cascade
 * touched, and every surface that reports it (per-event log, status payload,
 * convergence result, "Cascade complete" summary) must report that set size.
 *
 * These tests build REAL fixture projects on disk, because the defect is about
 * which paths the watcher reports, not about a numeric type.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  ConvergenceDetector,
} from "../../src/daemon/convergence";
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

describe("DF-SPECLANG-021: convergence reports distinct files changed", () => {
  let projectDir: string;
  let detector: ConvergenceDetector;

  beforeEach(() => {
    projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "speclang-conv-count-"));
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

  it("counts one file once when three separate events touch it", () => {
    const spec = touch("specs/repeat.spec.md", "v1");

    // added, then modified, then re-verified — one logical file, three events
    detector.onEvent(event(FileEventKind.Create, spec));
    detector.onEvent(event(FileEventKind.Modify, spec));
    detector.onEvent(event(FileEventKind.Modify, spec));

    expect(detector.getStatus().filesChanged).toBe(1);

    const result = settle(detector);
    expect(result.filesChanged).toBe(1);
  });

  it("counts three distinct files as three", () => {
    const a = touch("specs/a.spec.md", "a");
    const b = touch("specs/b.spec.md", "b");
    const c = touch("specs/c.spec.md", "c");

    detector.onEvent(event(FileEventKind.Create, a));
    detector.onEvent(event(FileEventKind.Create, b));
    detector.onEvent(event(FileEventKind.Create, c));

    expect(detector.getStatus().filesChanged).toBe(3);

    const result = settle(detector);
    expect(result.filesChanged).toBe(3);
  });

  it("does not double count a repeated modification inside a mixed cascade", () => {
    // The reported defect: 3 files, 9 events, "Files: 9".
    const a = touch("specs/a.spec.md", "a");
    const b = touch("specs/b.spec.md", "b");
    const c = touch("specs/c.spec.md", "c");

    for (const file of [a, b, c]) {
      for (const kind of [
        FileEventKind.Create,
        FileEventKind.Modify,
        FileEventKind.Modify,
      ]) {
        detector.onEvent(event(kind, file));
      }
    }

    expect(detector.getStatus().filesChanged).toBe(3);

    const result = settle(detector);
    expect(result.filesChanged).toBe(3);
    expect(detector.getConvergenceResult().filesChanged).toBe(3);
  });

  it("reports the distinct count on the per-event log and the completion summary", () => {
    const spec = touch("specs/repeat.spec.md", "v1");
    const other = touch("specs/other.spec.md", "o");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    detector.onEvent(event(FileEventKind.Create, spec));
    detector.onEvent(event(FileEventKind.Modify, spec));
    detector.onEvent(event(FileEventKind.Create, other));

    const lines = log.mock.calls.map((args) => String(args[0]));
    const perEvent = lines.filter((line) =>
      line.startsWith("[Convergence] Files changed:"),
    );

    // Three events, two distinct files: the per-event tally must not exceed 2.
    expect(perEvent).toHaveLength(3);
    expect(perEvent[0]).toContain("Files changed: 1");
    expect(perEvent[1]).toContain("Files changed: 1");
    expect(perEvent[2]).toContain("Files changed: 2");

    settle(detector);

    const summary = log.mock.calls
      .map((args) => String(args[0]))
      .filter((line) => line.startsWith("[Convergence] Cascade complete!"));
    expect(summary).toHaveLength(1);
    expect(summary[0]).toContain("Files: 2");
  });

  it("keeps an already-counted path from inflating after convergence", () => {
    const spec = touch("specs/repeat.spec.md", "v1");
    const later = touch("specs/later.spec.md", "l");

    detector.onEvent(event(FileEventKind.Create, spec));
    expect(settle(detector).filesChanged).toBe(1);

    // A re-verification of the SAME file in the next cascade round is not a
    // second file; a genuinely new file is.
    detector.onEvent(event(FileEventKind.Modify, spec));
    expect(detector.getStatus().filesChanged).toBe(1);

    detector.onEvent(event(FileEventKind.Create, later));
    expect(settle(detector).filesChanged).toBe(2);
  });

  it("clears the distinct-path set on reset, like the old counter", () => {
    const a = touch("specs/a.spec.md", "a");
    const b = touch("specs/b.spec.md", "b");

    detector.onEvent(event(FileEventKind.Create, a));
    detector.onEvent(event(FileEventKind.Create, b));
    expect(detector.getStatus().filesChanged).toBe(2);

    detector.reset();
    expect(detector.getStatus().filesChanged).toBe(0);

    // The same path re-reported after a reset starts a fresh cascade.
    detector.onEvent(event(FileEventKind.Create, a));
    expect(detector.getStatus().filesChanged).toBe(1);
  });
});
