/**
 * THINK-004: Token accounting — measure token consumption per cascade phase.
 *
 * Acceptance:
 *   1. InvocationMetrics type captures input_tokens, output_tokens, and optional
 *      reasoning_tokens per invocation.
 *   2. AgentExecutorFn returns optional metrics alongside success/files.
 *   3. AgentInvoker.invoke() forwards executor metrics to InvocationResult.
 *   4. CascadeCoordinator with `options.metrics = true` records per-invocation
 *      metrics in an indexed store (`invocationMetrics`).
 *   5. CascadeCoordinator.collateMetrics() aggregates per-agent token totals into
 *      a MetricsSummary with per-phase breakdown.
 *   6. CascadeCoordinator.printMetricsSummary() writes a human-readable breakdown.
 *   7. cascadeFrom() populates `result.metrics_summary` when `options.metrics` is
 *      true.
 *   8. The `speclang cascade trigger --metrics` CLI flag wires through.
 *
 * Why this matters: thinking gating (THINK-002/THINK-003) throttles reasoning
 * per cascade phase. Token accounting provides observability so operators can
 * verify the reduction and tune per-phase budgets.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs-extra";
import * as path from "path";
import * as os from "os";
import {
  AgentInvoker,
  type AgentExecutorFn,
  type InvocationOptions,
  type InvocationMetrics,
} from "../../specs/cascade.spec.dir/src/coordinator/invocation.ts";
import {
  CascadeCoordinator,
  type MetricsSummary,
} from "../../specs/cascade.spec.dir/src/coordinator/index.ts";

/**
 * Build a fake executor that returns fixed metrics for every invocation.
 */
function makeMetricsExecutor(metrics: InvocationMetrics): AgentExecutorFn & {
  calls(): Array<{
    agent: string;
    trigger: string;
    params?: Record<string, unknown>;
  }>;
} {
  const calls: Array<{
    agent: string;
    trigger: string;
    params?: Record<string, unknown>;
  }> = [];
  const executor: any = async (
    agent: string,
    trigger: string,
    params?: Record<string, unknown>,
  ) => {
    calls.push({ agent, trigger, params });
    return { success: true, files: [], metrics };
  };
  executor.calls = () => calls;
  return executor;
}

/**
 * Build a fake executor that returns per-agent custom metrics.
 */
function makePerAgentExecutor(
  getMetrics: (agent: string) => InvocationMetrics,
): AgentExecutorFn & {
  calls(): Array<{
    agent: string;
    trigger: string;
    params?: Record<string, unknown>;
  }>;
} {
  const calls: Array<{
    agent: string;
    trigger: string;
    params?: Record<string, unknown>;
  }> = [];
  const executor: any = async (
    agent: string,
    trigger: string,
    params?: Record<string, unknown>,
  ) => {
    calls.push({ agent, trigger, params });
    return { success: true, files: [], metrics: getMetrics(agent) };
  };
  executor.calls = () => calls;
  return executor;
}

/**
 * Minimal _index.json writer for coordinator tests.
 */
function writeIndex(
  indexPath: string,
  nodes: Array<{
    id: string;
    layer: number;
    type?: "spec" | "code" | "test" | "doc";
    file: string;
    depends_on?: string[];
  }>,
): void {
  const specs: Record<string, unknown> = {};
  for (const n of nodes) {
    specs[n.file] = {
      id: n.id,
      layer: n.layer,
      type: n.type ?? "spec",
      file: n.file,
      depends_on: n.depends_on ?? [],
    };
  }
  fs.writeFileSync(indexPath, JSON.stringify({ specs }));
}

describe("THINK-004 — token accounting metrics", () => {
  let tmpDir: string;
  let indexPath: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "think004-"));
    indexPath = path.join(tmpDir, "_index.json");
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  describe("InvocationMetrics type", () => {
    it("captures input and output tokens with optional reasoning tokens", () => {
      const m: InvocationMetrics = {
        input_tokens: 500,
        output_tokens: 200,
      };
      expect(m.input_tokens).toBe(500);
      expect(m.output_tokens).toBe(200);
      expect(m.reasoning_tokens).toBeUndefined();
    });

    it("can include reasoning tokens for providers that track them", () => {
      const m: InvocationMetrics = {
        input_tokens: 1000,
        output_tokens: 300,
        reasoning_tokens: 4000,
      };
      expect(m.reasoning_tokens).toBe(4000);
    });
  });

  describe("AgentInvoker — metrics pass-through", () => {
    it("forwards executor metrics to InvocationResult", async () => {
      const metrics: InvocationMetrics = {
        input_tokens: 512,
        output_tokens: 128,
      };
      const executor = makeMetricsExecutor(metrics);
      const invoker = new AgentInvoker(false, executor);

      const result = await invoker.invoke({
        agent: "speclang-code-gen",
        trigger: "src/foo.ts",
      });

      expect(result.metrics).toEqual(metrics);
    });

    it("returns undefined metrics when executor provides none", async () => {
      const executor = makeMetricsExecutor({
        input_tokens: 0,
        output_tokens: 0,
      } as any);
      // Actually we want one that returns no metrics at all.
      const noMetricsExecutor: AgentExecutorFn = async () => ({
        success: true,
        files: [],
      });
      const invoker = new AgentInvoker(false, noMetricsExecutor);

      const result = await invoker.invoke({
        agent: "speclang-coordinator",
        trigger: "docs/foo.md",
      });

      expect(result.metrics).toBeUndefined();
    });

    it("invokeMany preserves metrics per option", async () => {
      const lowMetrics: InvocationMetrics = {
        input_tokens: 100,
        output_tokens: 50,
      };
      const highMetrics: InvocationMetrics = {
        input_tokens: 500,
        output_tokens: 200,
      };
      const executor = makePerAgentExecutor((agent) =>
        agent === "a" ? lowMetrics : highMetrics,
      );
      const invoker = new AgentInvoker(false, executor);

      const opts: InvocationOptions[] = [
        { agent: "a", trigger: "specs/a.spec.md", thinking: "low" },
        { agent: "b", trigger: "src/b.ts", thinking: "high" },
      ];
      const results = await invoker.invokeMany(opts);

      expect(results[0].metrics).toEqual(lowMetrics);
      expect(results[1].metrics).toEqual(highMetrics);
    });
  });

  describe("CascadeCoordinator — metrics collation", () => {
    it("populates metrics_summary on result when options.metrics is true", async () => {
      writeIndex(indexPath, [
        { id: "specs/root", layer: 1, file: "specs/root.spec.md" },
        {
          id: "specs/child-a",
          layer: 2,
          type: "code",
          file: "src/child-a.ts",
          depends_on: ["specs/root"],
        },
        {
          id: "specs/child-b",
          layer: 2,
          type: "test",
          file: "tests/child-b.test.ts",
          depends_on: ["specs/root"],
        },
      ]);

      const metricsByAgent: Record<string, InvocationMetrics> = {
        "speclang-spec-writer": { input_tokens: 200, output_tokens: 100 },
        "speclang-code-gen": { input_tokens: 400, output_tokens: 200 },
        "speclang-test-writer": { input_tokens: 300, output_tokens: 150 },
      };
      const executor = makePerAgentExecutor(
        (agent) =>
          metricsByAgent[agent] ?? { input_tokens: 0, output_tokens: 0 },
      );
      const coordinator = new CascadeCoordinator(indexPath, {
        skipTests: true,
        parallel: false,
        metrics: true,
      });
      coordinator.setInvoker(new AgentInvoker(false, executor));
      (coordinator as any).gates = [
        {
          name: "noop",
          check: async () => ({ passed: true, message: "noop" }),
        },
      ];

      const result = await coordinator.cascadeFrom("specs/root");

      expect(result.success).toBe(true);
      expect(result.metrics_summary).toBeDefined();

      const summary = result.metrics_summary!;
      expect(summary.phases).toBeDefined();

      // 3 distinct agents invoked
      expect(Object.keys(summary.phases)).toHaveLength(3);

      // Check per-agent totals
      const specPhase = summary.phases["speclang-spec-writer"];
      expect(specPhase.input_tokens).toBe(200);
      expect(specPhase.output_tokens).toBe(100);
      expect(specPhase.invocations).toBe(1);

      const codePhase = summary.phases["speclang-code-gen"];
      expect(codePhase.input_tokens).toBe(400);
      expect(codePhase.output_tokens).toBe(200);

      const testPhase = summary.phases["speclang-test-writer"];
      expect(testPhase.input_tokens).toBe(300);
      expect(testPhase.output_tokens).toBe(150);

      // Grand totals
      expect(summary.total_input_tokens).toBe(900);
      expect(summary.total_output_tokens).toBe(450);
      expect(summary.total_reasoning_tokens).toBe(0);
    });

    it("does not populate metrics_summary when options.metrics is false (default)", async () => {
      writeIndex(indexPath, [
        { id: "specs/root", layer: 1, file: "specs/root.spec.md" },
      ]);

      const executor = makeMetricsExecutor({
        input_tokens: 100,
        output_tokens: 50,
      });
      const coordinator = new CascadeCoordinator(indexPath, {
        skipTests: true,
        parallel: false,
        // metrics not set (default false)
      });
      coordinator.setInvoker(new AgentInvoker(false, executor));
      (coordinator as any).gates = [
        {
          name: "noop",
          check: async () => ({ passed: true, message: "noop" }),
        },
      ];

      const result = await coordinator.cascadeFrom("specs/root");

      expect(result.success).toBe(true);
      expect(result.metrics_summary).toBeUndefined();
    });

    it("aggregates multiple invocations of the same agent", async () => {
      writeIndex(indexPath, [
        { id: "specs/root", layer: 1, file: "specs/root.spec.md" },
        {
          id: "specs/a",
          layer: 2,
          type: "code",
          file: "src/a.ts",
          depends_on: ["specs/root"],
        },
        {
          id: "specs/b",
          layer: 2,
          type: "code",
          file: "src/b.ts",
          depends_on: ["specs/root"],
        },
      ]);

      const metricsByAgent: Record<string, InvocationMetrics> = {
        "speclang-spec-writer": { input_tokens: 100, output_tokens: 50 },
        "speclang-code-gen": { input_tokens: 200, output_tokens: 100 },
      };
      const executor = makePerAgentExecutor(
        (agent) =>
          metricsByAgent[agent] ?? { input_tokens: 0, output_tokens: 0 },
      );
      const coordinator = new CascadeCoordinator(indexPath, {
        skipTests: true,
        parallel: false,
        metrics: true,
      });
      coordinator.setInvoker(new AgentInvoker(false, executor));
      (coordinator as any).gates = [
        {
          name: "noop",
          check: async () => ({ passed: true, message: "noop" }),
        },
      ];

      const result = await coordinator.cascadeFrom("specs/root");
      expect(result.metrics_summary).toBeDefined();

      const summary = result.metrics_summary!;
      // spec-writer invoked once (1 spec trigger), code-gen invoked twice (2 code files)
      expect(summary.phases["speclang-spec-writer"].invocations).toBe(1);
      expect(summary.phases["speclang-code-gen"].invocations).toBe(2);
      // code-gen total = 200*2 = 400 input, 100*2 = 200 output
      expect(summary.phases["speclang-code-gen"].input_tokens).toBe(400);
      expect(summary.phases["speclang-code-gen"].output_tokens).toBe(200);
    });

    it("handles empty cascade with no metrics gracefully", async () => {
      writeIndex(indexPath, [
        { id: "specs/root", layer: 1, file: "specs/root.spec.md" },
      ]);

      // executor returns success but no metrics
      const executor: AgentExecutorFn = async () => ({
        success: true,
        files: [],
      });
      const coordinator = new CascadeCoordinator(indexPath, {
        skipTests: true,
        parallel: false,
        metrics: true,
      });
      coordinator.setInvoker(new AgentInvoker(false, executor));
      (coordinator as any).gates = [
        {
          name: "noop",
          check: async () => ({ passed: true, message: "noop" }),
        },
      ];

      const result = await coordinator.cascadeFrom("specs/root");

      expect(result.metrics_summary).toBeDefined();
      expect(result.metrics_summary!.total_input_tokens).toBe(0);
      expect(result.metrics_summary!.total_output_tokens).toBe(0);
      expect(Object.keys(result.metrics_summary!.phases)).toHaveLength(0);
    });

    it("collateMetrics returns a standalone MetricsSummary", () => {
      writeIndex(indexPath, [
        { id: "specs/root", layer: 1, file: "specs/root.spec.md" },
      ]);

      const coordinator = new CascadeCoordinator(indexPath, {
        skipTests: true,
      });
      const summary = coordinator.collateMetrics();

      expect(summary).toEqual({
        total_input_tokens: 0,
        total_output_tokens: 0,
        total_reasoning_tokens: 0,
        phases: {},
      });
    });

    it("printMetricsSummary does not throw for empty summaries", () => {
      const coordinator = new CascadeCoordinator(indexPath, {
        skipTests: true,
      });
      const summary: MetricsSummary = {
        total_input_tokens: 0,
        total_output_tokens: 0,
        total_reasoning_tokens: 0,
        phases: {},
      };
      // should not throw
      expect(() => coordinator.printMetricsSummary(summary)).not.toThrow();
    });

    it("printMetricsSummary does not throw for populated summaries", () => {
      const coordinator = new CascadeCoordinator(indexPath, {
        skipTests: true,
      });
      const summary: MetricsSummary = {
        total_input_tokens: 1500,
        total_output_tokens: 750,
        total_reasoning_tokens: 0,
        phases: {
          "speclang-code-gen": {
            input_tokens: 1000,
            output_tokens: 500,
            reasoning_tokens: 0,
            invocations: 2,
          },
          "speclang-spec-writer": {
            input_tokens: 500,
            output_tokens: 250,
            reasoning_tokens: 0,
            invocations: 1,
          },
        },
      };
      expect(() => coordinator.printMetricsSummary(summary)).not.toThrow();
    });
  });

  describe("MetricsSummary type", () => {
    it("can carry reasoning tokens in totals and phases", () => {
      const summary: MetricsSummary = {
        total_input_tokens: 1000,
        total_output_tokens: 200,
        total_reasoning_tokens: 5000,
        phases: {
          "speclang-code-gen": {
            input_tokens: 1000,
            output_tokens: 200,
            reasoning_tokens: 5000,
            invocations: 1,
          },
        },
      };
      expect(summary.total_reasoning_tokens).toBe(5000);
      expect(summary.phases["speclang-code-gen"].reasoning_tokens).toBe(5000);
    });
  });
});
