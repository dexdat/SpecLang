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
const activeDaemons = new Set<Daemon>();

/** Assertion failures must not leave a watcher alive until the worker exits. */
async function stopDaemon(daemon: Daemon): Promise<void> {
  await daemon.stop();
  activeDaemons.delete(daemon);
}

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
 * picks up the override values. Stub the pipeline boundary so convergence
 * tests never execute the repository's real install and test commands.
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
  vi.spyOn(daemon as any, "executePipeline").mockResolvedValue(undefined);
  activeDaemons.add(daemon);
  return daemon;
}

describe("ARCH-004: Autonomous cascade", () => {
  afterEach(async () => {
    for (const daemon of activeDaemons) {
      await daemon.stop().catch(() => {});
    }
    activeDaemons.clear();
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

    await stopDaemon(daemon);
    await fs.remove(specPath).catch(() => {});
  });

  it(
    "autoRecascade=true settles to converged and emits armed after convergence",
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

    // DF-SPECLANG-4: "armed" now means SETTLED. The terminal status is
    // `converged` and the depth is back to 0 — that is what `/api/status`
    // reports for a drained cascade. This assertion used to demand the
    // opposite (`not.toBe("converged")`), which encoded the reported bug: the
    // arm path un-converged the detector, so a quiet daemon with nothing in
    // flight reported `cascading` forever. Autonomous re-arming is still
    // proven below and by the end-to-end case: the NEXT event must restart
    // the cascade without any user input.
    const status = daemon.getStatus();
    expect(status.status).toBe("converged");
    expect(status.cascadeDepth).toBe(0);

    await stopDaemon(daemon);
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

      await stopDaemon(daemon);
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

  /**
   * DF-SPECLANG-4: the daemon used to report `cascading` forever.
   *
   * Two defects fed it: (a) the arm path called convergence.reset(), which
   * un-converged the detector so `isConverged()` said "not converged" for a
   * whole quiet period with nothing in flight; (b) the quiet-period timer was
   * gated on `!converged && isConverged()`, so after a re-arm it re-emitted
   * 'converged' with NO new file event — the pipeline re-ran every period and
   * flipped the status back to `cascading` each time.
   *
   * The contract pinned here: a drained cascade settles to `converged` with
   * depth 0, stays there (no phantom re-convergence), and the next watched
   * event flips it back to `cascading`.
   */
  describe("DF-SPECLANG-4: cascade status settles to converged", () => {
    it(
      "detector settles to converged (depth 0) and never re-converges without a new event",
      { timeout: 15000 },
      async () => {
        const config = new Config();
        await config.load();
        const testConfig = config.get();
        testConfig.convergence.quietPeriod = 1;

        const detector = new ConvergenceDetector(testConfig);
        const convergedEvents: unknown[] = [];
        detector.on("converged", (result) => convergedEvents.push(result));

        // Nothing has happened yet: settled, not "cascading".
        expect(detector.getCascadeLifecycle()).toBe("converged");
        expect(detector.getCascadeDepth()).toBe(0);

        detector.onEvent({
          kind: FileEventKind.Create,
          path: "specs/df4.spec.md",
          timestamp: Date.now(),
        });
        expect(detector.getCascadeLifecycle()).toBe("cascading");
        expect(detector.getCascadeDepth()).toBe(1);

        await waitFor(
          () => convergedEvents.length === 1,
          8000,
          "cascade settles",
        );

        // The queue drained: terminal status + depth back to 0 WITHOUT reset().
        expect(detector.getCascadeLifecycle()).toBe("converged");
        expect(detector.getCascadeDepth()).toBe(0);
        expect(detector.isConverged()).toBe(true);

        // Two more quiet periods, no new event: no second convergence.
        await new Promise((r) => setTimeout(r, 2500));
        expect(convergedEvents.length).toBe(1);
        expect(detector.getCascadeLifecycle()).toBe("converged");

        detector.stop();
      },
    );

    it(
      "daemon status reports converged with depth 0 after the cascade drains and flips to cascading on the next event",
      { timeout: 30000 },
      async () => {
        const daemon = await makeDaemon(true);
        await daemon.start();

        const armedAt: number[] = [];
        daemon.on("armed", () => armedAt.push(Date.now()));

        const specPath = `${TEST_DIR}/_df4_status_${Date.now()}.spec.md`;
        await fs.writeFile(specPath, "# cascade one\n");

        await waitFor(() => armedAt.length >= 1, 15000, "first arm event");

        const settled = daemon.getStatus();
        expect(settled.status).toBe("converged");
        expect(settled.cascadeDepth).toBe(0);

        // Stays converged across quiet periods — no phantom re-convergence.
        await new Promise((r) => setTimeout(r, 2500));
        expect(daemon.getStatus().status).toBe("converged");
        expect(armedAt.length).toBe(1);

        // A new watched file event must restart the cascade from the settled state.
        await fs.writeFile(specPath, "# cascade two\n");
        await waitFor(
          () => daemon.getStatus().status === "cascading",
          8000,
          "status flips back to cascading",
        );
        expect(daemon.getStatus().cascadeDepth).toBeGreaterThan(0);

        await waitFor(() => armedAt.length >= 2, 15000, "second arm event");
        expect(daemon.getStatus().status).toBe("converged");

        await stopDaemon(daemon);
        await fs.remove(specPath).catch(() => {});
      },
    );
  });
});
