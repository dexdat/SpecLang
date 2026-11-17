/**
 * DF-SPECLANG-015: the daemon's routed AgentTasks are actually dispatched.
 *
 * The daemon emits `task` events (specs/daemon.spec.dir/src/daemon.ts:188)
 * but nothing consumed them, so a routed spec_writer task produced no agent
 * session and reactive expansion generated nothing. A tier2 judge
 * (d143a7ea) failed the recovered fix on two counts, both asserted here:
 *
 * GAP 1 — dead code: watchDaemon had no caller in a production entrypoint.
 *   Covered by the static wiring assertion at the bottom of this file (the
 *   foreground `speclangd` start branch is the code path the background `-d`
 *   child re-executes).
 * GAP 2 — output dropped: AgentInvoker.invoke() built its InvocationResult
 *   without copying the executor's `output`, so watchDaemon's
 *   write-to-task.target branch could never fire.
 *
 * Acceptance:
 *   1. invoke() propagates executor `output` (and `error`).
 *   2. watchDaemon() dispatches an agent for a routed task and writes the
 *      agent's stdout to task.target.
 *   3. Duplicate tasks for the same trigger are deduped (in flight, and
 *      within the TTL window) — the daemon re-converges on unchanged files
 *      every poll cycle, so an undeduped consumer would burn tokens in a loop.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";

// Import the .ts sources directly (not the stale .js sibling artifacts), same
// convention as tests/daemon/arch003-parallel-agents.test.ts.
import {
  AgentInvoker,
  type AgentExecutorFn,
} from "../../specs/cascade.spec.dir/src/coordinator/invocation.ts";
import { CascadeCoordinator } from "../../specs/cascade.spec.dir/src/coordinator/index.ts";

const REPO_ROOT = path.resolve(__dirname, "..", "..");

const GENERATED_BODY = "GENERATED BODY\n";

/** Minimal stand-in for the daemon's EventEmitter surface used by watchDaemon. */
class FakeDaemon {
  private handlers = new Map<string, Array<(payload: any) => void>>();

  on(event: string, cb: (payload: any) => void): this {
    const list = this.handlers.get(event) ?? [];
    list.push(cb);
    this.handlers.set(event, list);
    return this;
  }

  emit(event: string, payload: any): void {
    for (const cb of this.handlers.get(event) ?? []) cb(payload);
  }
}

/** Executor stub that records calls and returns a fixed stdout body. */
function makeRecordingExecutor(body: string = GENERATED_BODY): AgentExecutorFn & {
  calls: Array<{ agent: string; trigger: string }>;
} {
  const calls: Array<{ agent: string; trigger: string }> = [];
  const executor: any = async (agent: string, trigger: string) => {
    calls.push({ agent, trigger });
    return { success: true, files: [], output: body };
  };
  executor.calls = calls;
  return executor;
}

async function waitFor(
  predicate: () => boolean | Promise<boolean>,
  timeoutMs = 5000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error(`waitFor timed out after ${timeoutMs}ms`);
}

describe("DF-SPECLANG-015 — executor output propagation", () => {
  it("invoke() carries the executor's stdout into InvocationResult.output", async () => {
    const executor = makeRecordingExecutor("BODY");
    const invoker = new AgentInvoker(false, executor);

    const result = await invoker.invoke({
      agent: "speclang-spec-writer",
      trigger: "# seed spec\n",
    });

    expect(result.success).toBe(true);
    expect(result.output).toBe("BODY");
    expect(executor.calls).toHaveLength(1);
  });

  it("invoke() carries the executor's error through on failure", async () => {
    const failing: AgentExecutorFn = async () => ({
      success: false,
      files: [],
      error: "provider returned 401",
    });
    const invoker = new AgentInvoker(false, failing);

    const result = await invoker.invoke({
      agent: "speclang-spec-writer",
      trigger: "# seed spec\n",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("provider returned 401");
  });
});

describe("DF-SPECLANG-015 — watchDaemon consumes routed tasks", () => {
  let sandbox: string;
  let triggerFile: string;
  let targetFile: string;

  beforeEach(async () => {
    sandbox = await fs.mkdtemp(path.join(os.tmpdir(), "df-spec-015-"));
    triggerFile = path.join(sandbox, "seed.spec.md");
    targetFile = path.join(sandbox, "out", "generated.ts");
    await fs.writeFile(triggerFile, "# seed spec\n");
  });

  afterEach(async () => {
    await fs.remove(sandbox);
  });

  function routedTask() {
    return {
      kind: "spec_writer",
      trigger: triggerFile,
      spec: triggerFile,
      target: targetFile,
    };
  }

  it("dispatches the routed agent once and writes its stdout to task.target", async () => {
    const daemon = new FakeDaemon();
    const executor = makeRecordingExecutor();
    const coordinator = new CascadeCoordinator(undefined, { verbose: false });
    coordinator.setInvoker(new AgentInvoker(false, executor));
    coordinator.watchDaemon(daemon as any, { verbose: false });

    daemon.emit("task", routedTask());

    await waitFor(() => executor.calls.length === 1);
    await waitFor(() => fs.pathExistsSync(targetFile));

    expect(executor.calls[0].agent).toBe("speclang-spec-writer");
    // Existing trigger files are inlined as CONTENT (a bare path reads as
    // topic text and the model invents its own project).
    expect(executor.calls[0].trigger).toBe("# seed spec\n");
    expect(await fs.readFile(targetFile, "utf-8")).toBe(GENERATED_BODY);
  });

  it("dedupes an identical task emitted again within the TTL window", async () => {
    const daemon = new FakeDaemon();
    const executor = makeRecordingExecutor();
    const coordinator = new CascadeCoordinator(undefined, { verbose: false });
    coordinator.setInvoker(new AgentInvoker(false, executor));
    coordinator.watchDaemon(daemon as any, { verbose: false, ttlMs: 60_000 });

    daemon.emit("task", routedTask());
    // Same trigger re-emitted while the first invocation is still in flight.
    daemon.emit("task", routedTask());
    await waitFor(() => executor.calls.length === 1);
    await waitFor(() => fs.pathExistsSync(targetFile));

    // ...and again after it completed, still inside the TTL window.
    daemon.emit("task", routedTask());
    await new Promise((r) => setTimeout(r, 100));

    expect(executor.calls).toHaveLength(1);
  });

  it("re-dispatches once the TTL has elapsed (dedup is time-boxed, not permanent)", async () => {
    const daemon = new FakeDaemon();
    const executor = makeRecordingExecutor();
    const coordinator = new CascadeCoordinator(undefined, { verbose: false });
    coordinator.setInvoker(new AgentInvoker(false, executor));
    coordinator.watchDaemon(daemon as any, { verbose: false, ttlMs: 0 });

    daemon.emit("task", routedTask());
    await waitFor(() => executor.calls.length === 1);
    await waitFor(() => fs.pathExistsSync(targetFile));

    daemon.emit("task", routedTask());
    await waitFor(() => executor.calls.length === 2);
    expect(executor.calls).toHaveLength(2);
  });

  it("does not dispatch tasks that carry no trigger", async () => {
    const daemon = new FakeDaemon();
    const executor = makeRecordingExecutor();
    const coordinator = new CascadeCoordinator(undefined, { verbose: false });
    coordinator.setInvoker(new AgentInvoker(false, executor));
    coordinator.watchDaemon(daemon as any, { verbose: false });

    daemon.emit("task", { kind: "spec_writer", trigger: "", spec: "" });
    await new Promise((r) => setTimeout(r, 100));

    expect(executor.calls).toHaveLength(0);
  });
});

describe("DF-SPECLANG-015 — daemon entrypoint wiring", () => {
  it("bin/speclangd calls watchDaemon in its start path", () => {
    const source = fs.readFileSync(path.join(REPO_ROOT, "bin", "speclangd"), "utf-8");
    // A definition-only wiring is exactly what the judge failed: the watcher
    // must be CONSTRUCTED and SUBSCRIBED from the daemon start branch.
    expect(source).toMatch(/new CascadeCoordinator\(/);
    expect(source).toMatch(/coordinator\.watchDaemon\(/);
  });

  it("specs/daemon.spec.dir/src/speclangd.ts calls watchDaemon in its start action", () => {
    const source = fs.readFileSync(
      path.join(REPO_ROOT, "specs", "daemon.spec.dir", "src", "speclangd.ts"),
      "utf-8",
    );
    expect(source).toMatch(/new CascadeCoordinator\(/);
    expect(source).toMatch(/coordinator\.watchDaemon\(/);
  });
});
