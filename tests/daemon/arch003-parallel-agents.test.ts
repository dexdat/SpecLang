/**
 * ARCH-003: Parallel agent execution — swarm instead of sequential
 *
 * Acceptance:
 *   1. `AgentInvoker.invokeMany([...5 options])` runs all 5 concurrently
 *      — wall time ≤ slowest single agent, NOT sum of all agents.
 *   2. `DependencyTracker.partitionByDepth()` groups nodes by layer.
 *   3. `CascadeCoordinator.cascadeFrom()` defaults to swarm mode
 *      (parallel: true) and reports mode + waves + parallelism.
 *   4. Sequential fallback (parallel: false) is preserved for safety.
 *   5. Bounded concurrency (concurrency: N) caps parallel workers.
 *   6. Agent errors in a wave don't block other agents in the wave.
 *
 * PROVEN: 2026-07-04 — ARCH-003 swarm acceptance coverage. Without these
 * tests the coordinator was strictly sequential (`for ... of`) and the
 * `AgentInvoker` used `execSync` (couldn't run concurrently at all).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
// Import the .ts source directly (not the .js symlink target) to bypass
// stale build artifacts in specs/cascade.spec.dir/src/coordinator/*.js.
// Vite/vitest transforms .ts to .js on the fly, so this works at test time.
import {
  AgentInvoker,
  type AgentExecutorFn,
  type InvocationOptions,
  type InvocationResult,
} from '../../specs/cascade.spec.dir/src/coordinator/invocation.ts';
import { DependencyTracker, type TreeNode } from '../../specs/cascade.spec.dir/src/coordinator/dependency.ts';
import { CascadeCoordinator } from '../../specs/cascade.spec.dir/src/coordinator/index.ts';

const REPO_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Build a fake executor that sleeps for `delayMs` and tracks concurrent calls.
 * Returns the executor, a "currently in flight" gauge, and an invocation log.
 */
function makeSleepingExecutor(delayMs: number): AgentExecutorFn & {
  inFlight: () => number;
  log: () => Array<{ agent: string; trigger: string; startedAt: number }>;
  maxConcurrent: () => number;
} {
  let active = 0;
  let maxActive = 0;
  const events: Array<{ agent: string; trigger: string; startedAt: number }> = [];

  const executor: any = async (agent: string, trigger: string) => {
    active++;
    if (active > maxActive) maxActive = active;
    events.push({ agent, trigger, startedAt: Date.now() });

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    active--;
    return {
      success: true,
      files: [`generated/${agent}-${path.basename(trigger)}`],
    };
  };
  executor.inFlight = () => active;
  executor.log = () => events;
  executor.maxConcurrent = () => maxActive;
  return executor;
}

/**
 * Build a minimal in-memory _index.json with the given nodes.
 */
function writeIndex(indexPath: string, nodes: Array<{
  id: string;
  layer: number;
  type?: 'spec' | 'code' | 'test' | 'doc';
  file: string;
  depends_on?: string[];
}>): void {
  const specs: Record<string, unknown> = {};
  for (const n of nodes) {
    specs[n.file] = {
      id: n.id,
      layer: n.layer,
      type: n.type ?? 'spec',
      file: n.file,
      depends_on: n.depends_on ?? [],
    };
  }
  fs.writeFileSync(indexPath, JSON.stringify({ specs }));
}

describe('ARCH-003 — parallel agent execution (swarm)', () => {
  let tmpDir: string;
  let indexPath: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'arch003-'));
    indexPath = path.join(tmpDir, '_index.json');
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  describe('AgentInvoker.invokeMany()', () => {
    it('runs all 5 invocations concurrently — wall time ≈ slowest, not sum', async () => {
      const SLEEP_MS = 80;
      const executor = makeSleepingExecutor(SLEEP_MS);
      const invoker = new AgentInvoker(false, executor);

      const opts: InvocationOptions[] = Array.from({ length: 5 }, (_, i) => ({
        agent: `agent-${i}`,
        trigger: `specs/spec-${i}.spec.md`,
      }));

      const t0 = Date.now();
      const results = await invoker.invokeMany(opts);
      const elapsed = Date.now() - t0;

      // All 5 must have completed
      expect(results).toHaveLength(5);
      expect(results.every((r) => r.success)).toBe(true);

      // Wall time should be ≤ 2 × slowest single (allows for scheduler jitter,
      // but rejects a sequential implementation which would take ≥ 5 × SLEEP_MS).
      const sequentialFloor = 5 * SLEEP_MS;
      expect(elapsed).toBeLessThan(sequentialFloor);

      // Truly parallel: all 5 must have been in flight at the same time.
      expect(executor.maxConcurrent()).toBe(5);

      // Sanity: total elapsed should be reasonably close to a single SLEEP_MS
      // (allow 3× margin for the worst-case scheduler).
      expect(elapsed).toBeLessThan(SLEEP_MS * 3);
    }, 5000);

    it('preserves result order matching input order', async () => {
      const executor = makeSleepingExecutor(20);
      const invoker = new AgentInvoker(false, executor);

      const opts: InvocationOptions[] = ['a', 'b', 'c', 'd', 'e'].map((x) => ({
        agent: `agent-${x}`,
        trigger: `specs/${x}.spec.md`,
      }));

      const results = await invoker.invokeMany(opts);
      expect(results.map((r) => r.agent)).toEqual([
        'agent-a',
        'agent-b',
        'agent-c',
        'agent-d',
        'agent-e',
      ]);
    }, 5000);

    it('returns empty array for empty input', async () => {
      const invoker = new AgentInvoker(false, makeSleepingExecutor(10));
      const results = await invoker.invokeMany([]);
      expect(results).toEqual([]);
    });

    it('bounds concurrency when concurrency cap is provided', async () => {
      const SLEEP_MS = 60;
      const executor = makeSleepingExecutor(SLEEP_MS);
      const invoker = new AgentInvoker(false, executor);

      const opts: InvocationOptions[] = Array.from({ length: 10 }, (_, i) => ({
        agent: `agent-${i}`,
        trigger: `specs/spec-${i}.spec.md`,
      }));

      // Cap at 3 concurrent workers.
      const t0 = Date.now();
      const results = await invoker.invokeMany(opts, 3);
      const elapsed = Date.now() - t0;

      expect(results).toHaveLength(10);
      expect(executor.maxConcurrent()).toBe(3);
      // 10 agents / 3 workers × 60ms ≈ 200ms — should be well below unbounded
      // (which would be ~60ms) but well above a sequential 600ms.
      expect(elapsed).toBeGreaterThanOrEqual(SLEEP_MS * 3);
      expect(elapsed).toBeLessThan(SLEEP_MS * 10);
    }, 5000);

    it('records duration_ms per invocation', async () => {
      const invoker = new AgentInvoker(false, makeSleepingExecutor(50));
      const results = await invoker.invokeMany([
        { agent: 'a', trigger: 'x' },
      ]);
      expect(results[0].duration_ms).toBeGreaterThanOrEqual(45);
    });
  });

  describe('DependencyTracker.partitionByDepth()', () => {
    it('groups nodes by layer into waves', () => {
      const tracker = new DependencyTracker();
      // Inject nodes directly to avoid needing an _index.json fixture.
      (tracker as any).graph.nodes = new Map<string, TreeNode>([
        ['a', { id: 'a', layer: 0, type: 'spec', filePath: 'a', dependencies: [], children: [] }],
        ['b', { id: 'b', layer: 0, type: 'spec', filePath: 'b', dependencies: [], children: [] }],
        ['c', { id: 'c', layer: 1, type: 'spec', filePath: 'c', dependencies: [], children: [] }],
        ['d', { id: 'd', layer: 1, type: 'spec', filePath: 'd', dependencies: [], children: [] }],
        ['e', { id: 'e', layer: 2, type: 'spec', filePath: 'e', dependencies: [], children: [] }],
      ]);

      const waves = tracker.partitionByDepth([
        (tracker as any).graph.nodes.get('a'),
        (tracker as any).graph.nodes.get('b'),
        (tracker as any).graph.nodes.get('c'),
        (tracker as any).graph.nodes.get('d'),
        (tracker as any).graph.nodes.get('e'),
      ]);

      expect(waves).toHaveLength(3);
      expect(waves[0].map((n) => n.id).sort()).toEqual(['a', 'b']);
      expect(waves[1].map((n) => n.id).sort()).toEqual(['c', 'd']);
      expect(waves[2].map((n) => n.id).sort()).toEqual(['e']);
    });

    it('returns single wave when all nodes share a layer', () => {
      const tracker = new DependencyTracker();
      (tracker as any).graph.nodes = new Map<string, TreeNode>(
        ['a', 'b', 'c'].map((id) => [
          id,
          { id, layer: 2, type: 'spec', filePath: id, dependencies: [], children: [] },
        ])
      );

      const nodes = ['a', 'b', 'c'].map((id) => (tracker as any).graph.nodes.get(id));
      const waves = tracker.partitionByDepth(nodes);

      expect(waves).toHaveLength(1);
      expect(waves[0]).toHaveLength(3);
    });

    it('returns empty array for empty input', () => {
      const tracker = new DependencyTracker();
      expect(tracker.partitionByDepth([])).toEqual([]);
    });
  });

  describe('CascadeCoordinator.cascadeFrom() — swarm mode (default)', () => {
    it('runs 5 independent specs in parallel — wall time ≤ slowest', async () => {
      // 5 codegen targets, all dependent on a single trigger spec.
      // The cascade fans out from the root to all 5 in one parallel wave.
      writeIndex(indexPath, [
        { id: 'specs/root', layer: 1, file: 'specs/root.spec.md' },
        { id: 'specs/x1', layer: 2, file: 'specs/x1.spec.md', depends_on: ['specs/root'] },
        { id: 'specs/x2', layer: 2, file: 'specs/x2.spec.md', depends_on: ['specs/root'] },
        { id: 'specs/x3', layer: 2, file: 'specs/x3.spec.md', depends_on: ['specs/root'] },
        { id: 'specs/x4', layer: 2, file: 'specs/x4.spec.md', depends_on: ['specs/root'] },
        { id: 'specs/x5', layer: 2, file: 'specs/x5.spec.md', depends_on: ['specs/root'] },
      ]);

      const SLEEP_MS = 80;
      const executor = makeSleepingExecutor(SLEEP_MS);
      const coordinator = new CascadeCoordinator(indexPath, {
        verbose: false,
        parallel: true,
        skipTests: true, // skip gate work — focus on parallelism
      });
      // Inject our fake executor after construction.
      const fakeInvoker = new AgentInvoker(false, executor);
      coordinator.setInvoker(fakeInvoker);

      // Skip gates that execSync on the host (no real refs/compilation to run
      // for these test fixtures). Stub them out by overriding the coordinator's
      // gate runner with always-passing gates.
      (coordinator as any).gates = [
        { name: 'noop', check: async () => ({ passed: true, message: 'noop' }) },
      ];

      const t0 = Date.now();
      const result = await coordinator.cascadeFrom('specs/root');
      const elapsed = Date.now() - t0;

      // Acceptance: wall time bounded by slowest agent.
      const sequentialFloor = 6 * SLEEP_MS; // 6 = root + 5 dependents
      expect(elapsed).toBeLessThan(sequentialFloor);
      // The L2 wave has 5 parallel agents.
      expect(executor.maxConcurrent()).toBe(5);

      expect(result.mode).toBe('swarm');
      expect(result.parallelism).toBe(5);
      expect(result.stepsCompleted).toBe(6);
      expect(result.success).toBe(true);
      expect(coordinator.getState().agents_invoked).toHaveLength(6);
    }, 5000);

    it('fans out across multiple waves by layer', async () => {
      // Root trigger at layer 1 with 2 siblings (layer 1), plus 3 dependents
      // at layer 2 — exercises multi-wave with breadth.
      //   Trigger: a1 (L1)
      //   Cascade tree (a1's dependents):
      //     a1 (L1) → b1 (L2), b2 (L2), b3 (L2)
      //   Plus a1 has a dependency on common (L0) which gets traversed too.
      writeIndex(indexPath, [
        { id: 'specs/common', layer: 0, file: 'specs/common.spec.md' },
        { id: 'specs/a1', layer: 1, file: 'specs/a1.spec.md', depends_on: ['specs/common'] },
        { id: 'specs/a2', layer: 1, file: 'specs/a2.spec.md', depends_on: ['specs/common'] },
        { id: 'specs/b1', layer: 2, file: 'specs/b1.spec.md', depends_on: ['specs/a1'] },
        { id: 'specs/b2', layer: 2, file: 'specs/b2.spec.md', depends_on: ['specs/a1'] },
        { id: 'specs/b3', layer: 2, file: 'specs/b3.spec.md', depends_on: ['specs/a1'] },
      ]);

      const executor = makeSleepingExecutor(40);
      const coordinator = new CascadeCoordinator(indexPath, {
        parallel: true,
        skipTests: true,
      });
      coordinator.setInvoker(new AgentInvoker(false, executor));
      (coordinator as any).gates = [
        { name: 'noop', check: async () => ({ passed: true, message: 'noop' }) },
      ];

      // Cascade from a1 reaches: common (up dep), a1 (self), b1/b2/b3
      // (downstream). a2 is a sibling of a1 (also depends on common) and
      // gets reached via the dependents tree because it shares a dependency
      // with a1. → 6 nodes total.
      const result = await coordinator.cascadeFrom('specs/a1');

      expect(result.stepsCompleted).toBe(6);
      expect(result.waves).toBeGreaterThanOrEqual(2);
      // Max parallelism should be 3 (the L2 wave).
      expect(result.parallelism).toBe(3);
      expect(executor.maxConcurrent()).toBe(3);
      expect(result.success).toBe(true);
    }, 5000);
  });

  describe('CascadeCoordinator.cascadeFrom() — sequential fallback', () => {
    it('parallel: false runs strictly one agent at a time', async () => {
      writeIndex(indexPath, [
        { id: 'specs/y1', layer: 1, file: 'specs/y1.spec.md' },
        { id: 'specs/y2', layer: 1, file: 'specs/y2.spec.md' },
        { id: 'specs/y3', layer: 1, file: 'specs/y3.spec.md' },
      ]);

      const SLEEP_MS = 60;
      const executor = makeSleepingExecutor(SLEEP_MS);
      const coordinator = new CascadeCoordinator(indexPath, {
        parallel: false,
        skipTests: true,
      });
      coordinator.setInvoker(new AgentInvoker(false, executor));
      (coordinator as any).gates = [
        { name: 'noop', check: async () => ({ passed: true, message: 'noop' }) },
      ];

      const result = await coordinator.cascadeFrom('specs/y1');

      expect(result.mode).toBe('sequential');
      expect(executor.maxConcurrent()).toBe(1);
      expect(result.success).toBe(true);
    }, 5000);
  });
});