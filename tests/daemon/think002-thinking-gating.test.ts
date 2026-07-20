/**
 * THINK-002: Runtime thinking gating — control reasoning by cascade phase
 *
 * Acceptance:
 *   1. InvocationOptions accepts a `thinking` field ('none'|'low'|'medium'|'high').
 *   2. Coordinator's default executor appends `--thinking <level>` to the
 *      spawned `speclang agent` CLI call when thinking is set.
 *   3. Standalone AgentInvoker.buildCommand appends `--thinking <level>` when
 *      thinking is set, omits it otherwise.
 *   4. CascadeCoordinator.buildInvocation resolves the agent's thinking level
 *      from `CoordinatorOptions.thinking` overrides, falling back to
 *      DEFAULT_THINKING_BY_AGENT:
 *        speclang-spec-writer → low
 *        speclang-code-gen    → high
 *        speclang-test-writer → medium
 *        speclang-coordinator → none
 *   5. Explicit `thinking: {}` in CoordinatorOptions disables gating entirely
 *      (no `thinking` field on the resulting InvocationOptions).
 *   6. InvocationResult echoes the thinking level used, so downstream
 *      observability can verify token-budget decisions per cascade phase.
 *
 * Why this matters: token cost scales roughly with reasoning depth. Gating
 * `spec_read:none, spec_expand:low, spec_merge:medium, code_generate:high`
 * is the primary lever for measurable cascade token reduction.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import {
  AgentInvoker,
  type AgentExecutorFn,
  type InvocationOptions,
} from '../../specs/cascade.spec.dir/src/coordinator/invocation.ts';
import {
  CascadeCoordinator,
  DEFAULT_THINKING_BY_AGENT,
} from '../../specs/cascade.spec.dir/src/coordinator/index.ts';
import type { ThinkingLevel } from '../../specs/parser.spec.dir/src/types.ts';

const REPO_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Build a fake executor that captures its full call signature (agent,
 * trigger, params, thinking) so we can assert the thinking level was
 * forwarded correctly through the invoker.
 */
function makeCapturingExecutor(): AgentExecutorFn & {
  calls: () => Array<{
    agent: string;
    trigger: string;
    params?: Record<string, unknown>;
    thinking?: ThinkingLevel;
  }>;
} {
  const calls: Array<{
    agent: string;
    trigger: string;
    params?: Record<string, unknown>;
    thinking?: ThinkingLevel;
  }> = [];
  const executor: any = async (
    agent: string,
    trigger: string,
    params?: Record<string, unknown>,
    thinking?: ThinkingLevel
  ) => {
    calls.push({ agent, trigger, params, thinking });
    return { success: true, files: [] };
  };
  executor.calls = () => calls;
  return executor;
}

/**
 * Minimal _index.json writer for coordinator tests.
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

describe('THINK-002 — runtime thinking gating', () => {
  let tmpDir: string;
  let indexPath: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'think002-'));
    indexPath = path.join(tmpDir, '_index.json');
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  describe('AgentInvoker (coordinator) — thinking pass-through', () => {
    it('forwards options.thinking to the executor as 4th arg', async () => {
      const executor = makeCapturingExecutor();
      const invoker = new AgentInvoker(false, executor);

      await invoker.invoke({
        agent: 'speclang-code-gen',
        trigger: 'src/foo.ts',
        thinking: 'high',
      });

      const calls = executor.calls();
      expect(calls).toHaveLength(1);
      expect(calls[0].thinking).toBe('high');
    });

    it('forwards undefined when thinking is not set', async () => {
      const executor = makeCapturingExecutor();
      const invoker = new AgentInvoker(false, executor);

      await invoker.invoke({
        agent: 'speclang-coordinator',
        trigger: 'specs/foo.spec.md',
      });

      expect(executor.calls()[0].thinking).toBeUndefined();
    });

    it('echoes thinking on the InvocationResult', async () => {
      const invoker = new AgentInvoker(false, makeCapturingExecutor());
      const result = await invoker.invoke({
        agent: 'speclang-test-writer',
        trigger: 'tests/foo.test.ts',
        thinking: 'medium',
      });
      expect(result.thinking).toBe('medium');
    });

    it('invokeMany preserves thinking per option', async () => {
      const executor = makeCapturingExecutor();
      const invoker = new AgentInvoker(false, executor);

      const opts: InvocationOptions[] = [
        { agent: 'a', trigger: 'specs/a.spec.md', thinking: 'low' },
        { agent: 'b', trigger: 'src/b.ts', thinking: 'high' },
        { agent: 'c', trigger: 'docs/c.md' }, // no thinking
      ];
      await invoker.invokeMany(opts);

      const calls = executor.calls();
      expect(calls.map((c) => c.thinking)).toEqual(['low', 'high', undefined]);
    });
  });

  describe('DEFAULT_THINKING_BY_AGENT — task spec mapping', () => {
    it('maps the four canonical cascade agents per the THINK-002 spec', () => {
      expect(DEFAULT_THINKING_BY_AGENT['speclang-spec-writer']).toBe('low');
      expect(DEFAULT_THINKING_BY_AGENT['speclang-code-gen']).toBe('high');
      expect(DEFAULT_THINKING_BY_AGENT['speclang-test-writer']).toBe('medium');
      expect(DEFAULT_THINKING_BY_AGENT['speclang-coordinator']).toBe('none');
    });
  });

  describe('CascadeCoordinator.buildInvocation — thinking resolution', () => {
    it('resolves thinking from DEFAULT_THINKING_BY_AGENT when no overrides', () => {
      writeIndex(indexPath, [
        { id: 'specs/x', layer: 1, file: 'specs/x.spec.md' },
      ]);
      const coordinator = new CascadeCoordinator(indexPath, {
        skipTests: true,
      });

      // spec trigger → speclang-spec-writer → low
      const specOpts = coordinator.buildInvocation({
        id: 'specs/x',
        layer: 1,
        type: 'spec',
        filePath: 'specs/x.spec.md',
        dependencies: [],
        children: [],
      });
      expect(specOpts.agent).toBe('speclang-spec-writer');
      expect(specOpts.thinking).toBe('low');

      // code trigger → speclang-code-gen → high
      const codeOpts = coordinator.buildInvocation({
        id: 'src/y',
        layer: 2,
        type: 'code',
        filePath: 'src/y.ts',
        dependencies: [],
        children: [],
      });
      expect(codeOpts.agent).toBe('speclang-code-gen');
      expect(codeOpts.thinking).toBe('high');

      // test trigger → speclang-test-writer → medium
      const testOpts = coordinator.buildInvocation({
        id: 'tests/z',
        layer: 2,
        type: 'test',
        filePath: 'tests/z.test.ts',
        dependencies: [],
        children: [],
      });
      expect(testOpts.agent).toBe('speclang-test-writer');
      expect(testOpts.thinking).toBe('medium');

      // other trigger → speclang-coordinator → none
      const coordOpts = coordinator.buildInvocation({
        id: 'docs/w',
        layer: 3,
        type: 'doc',
        filePath: 'docs/w.md',
        dependencies: [],
        children: [],
      });
      expect(coordOpts.agent).toBe('speclang-coordinator');
      expect(coordOpts.thinking).toBe('none');
    });

    it('user-supplied thinking overrides the defaults', () => {
      writeIndex(indexPath, [
        { id: 'specs/x', layer: 1, file: 'specs/x.spec.md' },
      ]);
      const coordinator = new CascadeCoordinator(indexPath, {
        skipTests: true,
        thinking: { 'speclang-spec-writer': 'high' },
      });

      const opts = coordinator.buildInvocation({
        id: 'specs/x',
        layer: 1,
        type: 'spec',
        filePath: 'specs/x.spec.md',
        dependencies: [],
        children: [],
      });
      expect(opts.thinking).toBe('high');
    });

    it('explicit empty thinking map disables gating (no thinking on opts)', () => {
      writeIndex(indexPath, [
        { id: 'specs/x', layer: 1, file: 'specs/x.spec.md' },
      ]);
      const coordinator = new CascadeCoordinator(indexPath, {
        skipTests: true,
        thinking: {},
      });

      const opts = coordinator.buildInvocation({
        id: 'specs/x',
        layer: 1,
        type: 'spec',
        filePath: 'specs/x.spec.md',
        dependencies: [],
        children: [],
      });
      expect(opts.thinking).toBeUndefined();
    });

    it('partial overrides leave unspecified agents at default', () => {
      writeIndex(indexPath, [
        { id: 'specs/x', layer: 1, file: 'specs/x.spec.md' },
      ]);
      const coordinator = new CascadeCoordinator(indexPath, {
        skipTests: true,
        thinking: { 'speclang-code-gen': 'low' },
      });

      // code-gen overridden to low
      const codeOpts = coordinator.buildInvocation({
        id: 'src/y',
        layer: 2,
        type: 'code',
        filePath: 'src/y.ts',
        dependencies: [],
        children: [],
      });
      expect(codeOpts.thinking).toBe('low');
    });
  });

  describe('CascadeCoordinator.cascadeFrom — end-to-end thinking flow', () => {
    it('thinking flows from options through to the executor call', async () => {
      writeIndex(indexPath, [
        { id: 'specs/root', layer: 1, file: 'specs/root.spec.md' },
        { id: 'src/child', layer: 2, type: 'code', file: 'src/child.ts', depends_on: ['specs/root'] },
      ]);

      const executor = makeCapturingExecutor();
      const coordinator = new CascadeCoordinator(indexPath, {
        skipTests: true,
        parallel: false,
      });
      coordinator.setInvoker(new AgentInvoker(false, executor));
      (coordinator as any).gates = [
        { name: 'noop', check: async () => ({ passed: true, message: 'noop' }) },
      ];

      const result = await coordinator.cascadeFrom('specs/root');
      expect(result.success).toBe(true);

      const calls = executor.calls();
      // 2 nodes cascaded: root (spec-writer, low) + child (code-gen, high)
      expect(calls).toHaveLength(2);
      const byAgent = Object.fromEntries(calls.map((c) => [c.agent, c.thinking]));
      expect(byAgent['speclang-spec-writer']).toBe('low');
      expect(byAgent['speclang-code-gen']).toBe('high');
    });
  });

  describe('Standalone AgentInvoker (specs/cascade.spec.dir/src/invocation.ts) — --thinking CLI flag', () => {
    it('buildCommand appends --thinking <level> when thinking is set', async () => {
      // Import lazily to avoid pulling child_process into module graph
      // for tests that don't need it.
      const { AgentInvoker: StandaloneInvoker } = await import(
        '../../specs/cascade.spec.dir/src/invocation.ts'
      );
      const invoker = new StandaloneInvoker(false);
      const cmd = (invoker as any).buildCommand(
        'speclang-code-gen',
        'src/foo.ts',
        undefined,
        'high'
      );
      expect(cmd).toContain('--thinking high');
      expect(cmd).toBe(
        'speclang agent speclang-code-gen --trigger src/foo.ts --thinking high'
      );
    });

    it('buildCommand omits --thinking when thinking is not set', async () => {
      const { AgentInvoker: StandaloneInvoker } = await import(
        '../../specs/cascade.spec.dir/src/invocation.ts'
      );
      const invoker = new StandaloneInvoker(false);
      const cmd = (invoker as any).buildCommand(
        'speclang-coordinator',
        'specs/foo.spec.md'
      );
      expect(cmd).not.toContain('--thinking');
      expect(cmd).toBe(
        'speclang agent speclang-coordinator --trigger specs/foo.spec.md'
      );
    });

    it('buildCommand places --thinking after --params when both present', async () => {
      const { AgentInvoker: StandaloneInvoker } = await import(
        '../../specs/cascade.spec.dir/src/invocation.ts'
      );
      const invoker = new StandaloneInvoker(false);
      const cmd = (invoker as any).buildCommand(
        'speclang-test-writer',
        'tests/x.test.ts',
        { layer: 2 },
        'medium'
      );
      expect(cmd).toContain('--thinking medium');
      expect(cmd).toContain('{"layer":2}');
      // --thinking must come after the params JSON
      expect(cmd.indexOf('--thinking')).toBeGreaterThan(
        cmd.indexOf('{"layer":2}')
      );
    });
  });
});
