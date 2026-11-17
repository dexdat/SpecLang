/**
 * GAP-003: LOAD-HYGIENE — the suite's worker pool must stay bounded.
 *
 * The suite runs on hosts the rest of the fleet shares. Vitest's default
 * `maxWorkers` is `availableParallelism() - 1` (15 on 16 cores), and ~25 test
 * files spawn OS subprocesses synchronously, so the peak host fan-out used to
 * scale with the core count (measured: 36 concurrent descendants / 25 `node`).
 * `vitest.config.ts` now derives the pool from the CPU count and clamps it to
 * the inclusive range 2-16.
 *
 * These assertions are structural on purpose: a clamp that is deleted or that
 * silently drifts out of range is exactly the regression this file exists to
 * catch, and it would otherwise be invisible — the suite still passes, it just
 * saturates the host again.
 *
 * Evidence + measurements: .coding-hermes/evidence/GAP-003-load-audit.md
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { availableParallelism } from "os";
import config from "../vitest.config";

interface TestSection {
  maxWorkers?: number;
  include?: string[];
  exclude?: string[];
  fileParallelism?: boolean;
}

const repoRoot = join(__dirname, "..");
const testSection = (config as { test?: TestSection }).test ?? {};

describe("GAP-003: bounded vitest worker pool", () => {
  it("derives maxWorkers from the CPU count, clamped to 2-16", () => {
    const expected = Math.min(
      16,
      Math.max(2, Math.floor(availableParallelism() / 2)),
    );
    expect(testSection.maxWorkers).toBe(expected);
  });

  it("stays inside the inclusive 2-16 band on this host", () => {
    const maxWorkers = testSection.maxWorkers as number;
    expect(maxWorkers).toBeGreaterThanOrEqual(2);
    expect(maxWorkers).toBeLessThanOrEqual(16);
  });

  it("keeps the clamp readable in the config source", () => {
    const src = readFileSync(join(repoRoot, "vitest.config.ts"), "utf8");
    // The two bounds and the CPU-derived expression are the whole guarantee.
    expect(src).toMatch(/TEST_WORKERS_MIN\s*=\s*2\b/);
    expect(src).toMatch(/TEST_WORKERS_MAX\s*=\s*16\b/);
    expect(src).toMatch(/availableParallelism\(\)/);
    // The resolved value must be wired into the test section, not just defined.
    expect(src).toMatch(/maxWorkers:\s*maxTestWorkers/);
  });

  it("does not buy wall-clock by excluding test files", () => {
    // Bounding the pool is only legitimate while the full corpus still runs:
    // no test glob may be dropped from `include` or added to `exclude`.
    expect(testSection.include).toContain("tests/**/*.test.ts");
    expect(testSection.include).toContain("tests/**/*.test.tsx");
    expect(testSection.exclude ?? []).not.toContain("tests/**/*.test.ts");
    expect(testSection.exclude ?? []).not.toContain("tests/**/*.test.tsx");
    // Serial-only mode would also "bound" load by removing concurrency
    // altogether; the fix must bound the pool, not disable it.
    expect(testSection.fileParallelism).not.toBe(false);
  });
});
