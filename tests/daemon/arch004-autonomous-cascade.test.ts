/**
 * ARCH-004: Autonomous cascade — remove user-controlled gating
 *
 * Acceptance:
 *   1. After convergence, the daemon stays armed (autoRecascade=true)
 *      and emits `armed` — the next file event automatically restarts
 *      the cascade without requiring /finalize or any user input.
 *   2. When autoRecascade=false (legacy mode), the daemon stays in
 *      Converged state and waits for explicit user input.
 *   3. End-to-end: save a top-level spec → cascade fires → pipeline
 *      runs → next spec change → ANOTHER cascade fires automatically
 *      (no /finalize command, no manual restart).
 *   4. `autoRecascade` defaults to true in the default config.
 *   5. The spec docs no longer say "await next user input" — they
 *      say "arm for next cascade (no user input required)".
 *
 * PROVEN: 2026-07-04 — ARCH-004 autonomous cascade acceptance.
 * Prior to this commit, the daemon's convergence handler ran the
 * pipeline once and stayed in Converged state, requiring the user
 * to invoke /finalize (or restart the daemon) to fire the next
 * cascade. After this commit, the converged handler resets the
 * ConvergenceDetector and transitions back to Idle when
 * autoRecascade=true (default), so file events trigger fresh
 * cascades automatically.
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  afterAll,
  vi,
} from "vitest";
import * as fs from "fs-extra";
import * as path from "path";
import {
  Daemon,
  Config,
  ConvergenceDetector,
  FileEventKind,
} from "../../src/daemon/index.ts";
// Note: imports use .ts extension to bypass stale .js artifacts in
// specs/daemon.spec.dir/src/ (last rebuilt Jun 25, predates ARCH-004).
// Vite/vitest transforms .ts files on the fly.

const TEST_DIR = "tests/daemon/fixtures/arch004-project";

async function waitFor(
  predicate: () => boolean,
  timeoutMs: number,
  label: string,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (predicate()) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`waitFor timed out: ${label}`);
}

/**
 * Build a minimal Daemon with a short quiet period + autoRecascade override.
 * Uses `.speclangrc` in the project root so the daemon's config.load()
 * picks up the override values. The pipeline execution will fail in
 * tests (dynamic import to ../pipeline/executor doesn't resolve here)
 * — that's expected and harmless; the daemon's converged handler
 * still emits `armed` after executePipeline settles.
 */
async function makeDaemon(
  autoRecascade: boolean,
  quietPeriodSec = 1,
): Promise<Daemon> {
  // Scope the daemon's watcher to this test's own fixture dir instead of
  // the default watch paths (specs/, tests/, generated/). Sibling test
  // files running in parallel workers (e.g. arch002) write .spec.md
  // files into specs/ concurrently, and every sibling event resets the
  // convergence quiet window — the root cause of the intermittent
  // 5000ms convergence timeout when this file runs inside the full
  // suite (it always passes 6/6 in isolation).
  await fs.ensureDir(`${TEST_DIR}/generated`);

  // Write a .speclangrc in CWD (project root) for this test
  const rcPath = `.speclangrc.arch004`;
  await fs.writeFile(
    rcPath,
    `watch:\n  paths:\n    - ${TEST_DIR}\nconvergence:\n  quietPeriod: ${quietPeriodSec}\n  maxDepth: 100\n  testOnConverge: false\n  autoCommit: false\n  autoRecascade: ${autoRecascade}\n`,
  );

  const daemon = new Daemon(rcPath);
  return daemon;
}

describe("ARCH-004: Autonomous cascade", () => {
  afterEach(async () => {
    await fs.remove(TEST_DIR).catch(() => {});
    await fs.remove(".speclangrc.arch004").catch(() => {});
    // Safety net for stale `_arch004_*` files in specs/ left by pre-quarantine
    // runs (this test now writes fixtures only under TEST_DIR)
    const specs = await fs.readdir("specs").catch(() => []);
    for (const f of specs) {
      if (f.startsWith("_arch004_")) {
        await fs.remove(`specs/${f}`).catch(() => {});
      }
    }
  });

  afterAll(async () => {
    // Safety net: ensure ALL temp artifacts are removed after the suite,
    // even if individual tests crashed before their per-test cleanup ran.
    await fs.remove(TEST_DIR).catch(() => {});
    await fs.remove(".speclangrc.arch004").catch(() => {});
    const specs = await fs.readdir("specs").catch(() => []);
    for (const f of specs) {
      if (f.startsWith("_arch004_")) {
        await fs.remove(`specs/${f}`).catch(() => {});
      }
    }
  });

  it("autoRecascade defaults to true in default config", async () => {
    const config = new Config();
    await config.load();
    expect(config.get().convergence.autoRecascade).toBe(true);
  });

  it(
    "autoRecascade=false keeps daemon in Converged state after convergence",
    // Internal waitFor budget is 8000ms (exceeds vitest's 5000ms default);
    // under parallel-suite CPU load the daemon cycle legitimately takes
    // longer, so give the test a timeout that matches its own polling
    // budget instead of letting vitest kill it at 5000ms.
    { timeout: 15000 },
    async () => {
    const daemon = await makeDaemon(false);
    await daemon.start();

    // Track state transitions via status
    const events: string[] = [];
    daemon.on("converged", () => events.push("converged"));
    daemon.on("armed", () => events.push("armed"));

    // Save a file to trigger initial cascade (the watcher is scoped to
    // TEST_DIR via the rc file, so only this test's own events reach it —
    // vitest's CWD is project root)
    const specPath = `${TEST_DIR}/_arch004_test_${Date.now()}.spec.md`;
    await fs.writeFile(specPath, "# initial\n");

    // Wait for the converged event (not just status — status can flip to
    // 'converged' before the daemon's emit('converged') handler runs).
    await waitFor(() => events.includes("converged"), 8000, "converged event");

    // With autoRecascade=false, the daemon stays in Converged status and
    // should NOT emit 'armed' — the legacy behavior.
    expect(events).not.toContain("armed");

    // Daemon should remain in Converged status (not auto-reset to Idle)
    expect(daemon.getStatus().status).toBe("converged");

    await daemon.stop();
    await fs.remove(specPath).catch(() => {});
  });

  it(
    "autoRecascade=true transitions back to Idle and emits armed after convergence",
    // Internal waitFor budget is 10000ms (exceeds vitest's 5000ms default).
    { timeout: 20000 },
    async () => {
    const daemon = await makeDaemon(true);
    await daemon.start();

    const events: string[] = [];
    daemon.on("converged", () => events.push("converged"));
    daemon.on("armed", () => events.push("armed"));

    // Save a file to trigger initial cascade
    const specPath = `${TEST_DIR}/_arch004_test_${Date.now()}.spec.md`;
    await fs.writeFile(specPath, "# first\n");

    // Wait for convergence + auto-recascade arming
    await waitFor(
      () => events.includes("armed"),
      10000,
      "emission of armed event",
    );

    expect(events).toContain("converged");
    expect(events).toContain("armed");

    // Daemon should be back in Idle / Cascading state (not stuck in Converged)
    const status = daemon.getStatus();
    expect(status.status).not.toBe("converged");

    await daemon.stop();
    await fs.remove(specPath).catch(() => {});
  });

  it(
    "end-to-end: save spec → converge → arm → save ANOTHER spec → converge again, no user input",
    { timeout: 30000 },
    async () => {
      const daemon = await makeDaemon(true);
      await daemon.start();

      const events: string[] = [];
      daemon.on("converged", () => events.push("converged"));
      daemon.on("armed", () => events.push("armed"));

      // First spec → cascade → converge → arm
      const spec1 = `${TEST_DIR}/_arch004_e2e_${Date.now()}.spec.md`;
      await fs.writeFile(spec1, "# one\n");

      await waitFor(
        () => events.filter((e) => e === "armed").length >= 1,
        10000,
        "first arm event",
      );
      const armedAfterFirst = events.filter((e) => e === "armed").length;
      const convergedAfterFirst = events.filter(
        (e) => e === "converged",
      ).length;

      // Second spec — should trigger another cascade + convergence WITHOUT any user input
      await new Promise((r) => setTimeout(r, 200));
      const spec2 = `${TEST_DIR}/_arch004_e2e_${Date.now()}_b.spec.md`;
      await fs.writeFile(spec2, "# two\n");

      await waitFor(
        () => events.filter((e) => e === "armed").length >= 2,
        15000,
        "second arm event (autonomous re-cascade)",
      );

      const armedAfterSecond = events.filter((e) => e === "armed").length;
      const convergedAfterSecond = events.filter(
        (e) => e === "converged",
      ).length;

      // The user never ran /finalize. Both cascades converged + armed.
      expect(armedAfterSecond).toBeGreaterThan(armedAfterFirst);
      expect(convergedAfterSecond).toBeGreaterThan(convergedAfterFirst);

      await daemon.stop();
      await fs.remove(spec1).catch(() => {});
      await fs.remove(spec2).catch(() => {});
    },
  );

  it('convergence spec doc says "arm for next cascade", not "await next input"', async () => {
    // AC: spec source-of-truth was updated for autonomous behavior
    const specPath = path.join(
      __dirname,
      "..",
      "..",
      "specs",
      "daemon.spec.dir",
      "convergence.spec.md",
    );
    const spec = await fs.readFile(specPath, "utf-8");

    expect(spec).not.toMatch(/await next input/);
    expect(spec).toMatch(/arm for next cascade/i);
  });

  it(
    "ConvergenceDetector.reset() allows immediate re-convergence on next event",
    // Two 1500ms quiet-period sleeps (~3s+ of wall clock) — needs more
    // than vitest's 5000ms default under parallel-suite load.
    { timeout: 10000 },
    async () => {
    // After autoRecascade fires, daemon calls convergence.reset() — verify
    // the detector returns to the "still cascading" state and re-converges
    // cleanly when new events arrive.
    const config = new Config();
    await config.load();
    const testConfig = config.get();
    testConfig.convergence.quietPeriod = 1;

    const detector = new ConvergenceDetector(testConfig);

    // Round 1: event → quiet → converge
    detector.onEvent({
      kind: FileEventKind.Create,
      path: "specs/a.spec.md",
      timestamp: Date.now(),
    });
    expect(detector.isConverged()).toBe(false);

    await new Promise((r) => setTimeout(r, 1500));
    expect(detector.isConverged()).toBe(true);

    // Daemon's autoRecascade path calls reset() here
    detector.reset();

    // Round 2: new event → must transition back to "still cascading"
    expect(detector.isConverged()).toBe(false);
    detector.onEvent({
      kind: FileEventKind.Create,
      path: "specs/b.spec.md",
      timestamp: Date.now(),
    });
    expect(detector.isConverged()).toBe(false);

    await new Promise((r) => setTimeout(r, 1500));
    expect(detector.isConverged()).toBe(true);

    detector.stop();
  });
});
