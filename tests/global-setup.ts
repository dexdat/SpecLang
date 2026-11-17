/**
 * Vitest global setup — set TMPDIR before any workers spawn.
 *
 * This runs in the main vitest process BEFORE workers are forked,
 * ensuring all forked workers inherit the correct TMPDIR.
 *
 * CI-002: Fixes /tmp EDQUOT by redirecting to project-local .tmp/
 *
 * QA-SPECLANG-4: the network-cut preflight lives in tests/net-guard.ts and is
 * wired from tests/setup-tmpdir.ts (a `setupFiles` entry) so its failure is
 * counted in vitest's test-file summary instead of surfacing as an unhandled
 * error with no "N failed" line.
 */
import { join } from "path";
import { mkdirSync } from "fs";

export function setup() {
  const projectTmp = join(process.cwd(), ".tmp");
  mkdirSync(projectTmp, { recursive: true });
  process.env.TMPDIR = projectTmp;
}
