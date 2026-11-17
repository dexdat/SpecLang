import { AgentInvocation } from './state.js';
import * as path from 'path';
import type { ThinkingLevel } from 'parser.spec.dir/src/types.js';

export interface InvocationOptions {
  agent: string;
  trigger: string;
  params?: Record<string, unknown>;
  /**
   * THINK-002: reasoning depth for this invocation. When set, the executor
   * passes `--thinking <level>` to the underlying `speclang agent` CLI call
   * so the runtime can gate token usage per cascade phase.
   */
  thinking?: ThinkingLevel;
}

export interface InvocationResult {
  success: boolean;
  agent: string;
  timestamp: string;
  files_modified: string[];
  duration_ms?: number;
  error?: string;
  /** THINK-002: reasoning depth used for this invocation (if any). */
  thinking?: ThinkingLevel;
  /** THINK-004: token-level metrics for this invocation (if collected). */
  metrics?: InvocationMetrics;
  /**
   * DF-SPECLANG-015: raw stdout from the agent CLI. The agent writes the
   * generated content to stdout, so callers (watchDaemon) need this to
   * persist it. Dropping it here made the routed-task output unrecoverable.
   */
  output?: string;
}

/**
 * THINK-004: token accounting per invocation — input/output/reasoning
 * tokens captured from a single cascade phase run.
 */
export interface InvocationMetrics {
  input_tokens: number;
  output_tokens: number;
  /** Reasoning tokens (if provider supports thinking/reasoning token tracking). */
  reasoning_tokens?: number;
}

/**
 * Pluggable executor signature — defaults to spawning a child process, but
 * tests can inject a deterministic stub to prove parallelism without
 * shelling out (no flaky CI from real `speclang agent` invocations).
 */
export type AgentExecutorFn = (
  agent: string,
  trigger: string,
  params?: Record<string, unknown>,
  thinking?: ThinkingLevel
) => Promise<{ success: boolean; files: string[]; error?: string; output?: string; metrics?: InvocationMetrics }>;

const defaultExecutor: AgentExecutorFn = async (agent, trigger, params, thinking) => {
  // Use dynamic import to keep child_process out of the module graph for
  // pure-orchestration callers (tests, embeds).
  const { execFile } = await import('child_process');
  const { promisify } = await import('util');
  const execFileAsync = promisify(execFile);

  const paramsStr = params ? ` ${JSON.stringify(params)}` : '';
  const args = ['agent', agent, '--trigger', trigger];
  if (params) args.push('--params', JSON.stringify(params));
  // THINK-002: forward the reasoning-depth gate to the agent CLI so the
  // runtime can budget tokens per cascade phase.
  if (thinking) args.push('--thinking', thinking);

  // DF-SPECLANG-015: the 'speclang' binary is not on PATH for daemon/embedded
  // callers — resolve the repo-local CLI relative to THIS module instead
  // (src/cascade/coordinator and specs/cascade.spec.dir/src/coordinator are
  // both four levels under the repo root), with env override and PATH
  // fallback for installed setups. __dirname works under tsx (shimmed) and
  // the CJS build (native); import.meta would break the CJS output.
  const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
  const candidates = [
    process.env.SPECLANG_BIN,
    path.join(repoRoot, 'bin', 'speclang'),
    'speclang',
  ].filter(Boolean) as string[];

  // DF-SPECLANG-015: LLM agent sessions routinely take minutes (documented:
  // verbose trace-system prompts alone push sessions past 200s). A 30s
  // timeout guaranteed every real invocation died. Default 15 min, env
  // overridable via SPECLANG_AGENT_TIMEOUT_MS.
  const timeoutMs = Number(process.env.SPECLANG_AGENT_TIMEOUT_MS ?? 900_000);

  let lastError = 'unknown error';
  for (const bin of candidates) {
    const [cmd, ...prefix] = bin.endsWith('.js') || bin === 'speclang' ? (bin === 'speclang' ? ['speclang'] : [process.execPath, bin]) : [process.execPath, bin];
    try {
      const { stdout } = await execFileAsync(cmd, [...prefix, ...args], {
        encoding: 'utf-8',
        timeout: timeoutMs,
        maxBuffer: 16 * 1024 * 1024,
        env: process.env,
      });
      // DF-SPECLANG-015: the agent CLI writes generated content to STDOUT —
      // the caller (e.g. watchDaemon) decides where it lands on disk.
      return { success: true, files: parseOutputFiles(stdout), output: stdout };
    } catch (err: any) {
      // DF-SPECLANG-015: never swallow the reason — surface it so the
      // coordinator log says WHY the invocation failed.
      const code = err?.code ?? '';
      const stderr = (err?.stderr ?? '').slice(-400);
      lastError = `${cmd} ${code}: ${(err?.message ?? String(err)).slice(0, 300)}${stderr ? ' | stderr: ' + stderr : ''}`;
      console.error(`[AgentExecutor] Invocation via ${cmd} failed: ${lastError}`);
      // A resolved CLI whose session failed is a REAL failure — stop trying
      // other candidates (only resolution errors should fall through).
      if (code !== 'ENOENT') {
        return { success: false, files: [], error: lastError };
      }
    }
  }
  return { success: false, files: [], error: lastError };
};

function parseOutputFiles(output: string): string[] {
  const files: string[] = [];
  for (const line of output.split('\n')) {
    const match = line.match(/Created: (.+)/);
    if (match) files.push(match[1]);
  }
  return files;
}

export class AgentInvoker {
  private verbose: boolean;
  private executor: AgentExecutorFn;

  constructor(verbose: boolean = false, executor: AgentExecutorFn = defaultExecutor) {
    this.verbose = verbose;
    this.executor = executor;
  }

  /**
   * Invoke a single agent. Async; safe to call concurrently from many callers.
   */
  async invoke(options: InvocationOptions): Promise<InvocationResult> {
    const start = Date.now();
    const timestamp = new Date(start).toISOString();

    if (this.verbose) {
      console.log(`[AgentInvoker] Invoking agent: ${options.agent} for trigger: ${options.trigger}`);
    }

    try {
      const result = await this.executor(
        options.agent,
        options.trigger,
        options.params,
        options.thinking
      );
      return {
        success: result.success,
        agent: options.agent,
        timestamp,
        files_modified: result.files,
        duration_ms: Date.now() - start,
        thinking: options.thinking,
        metrics: result.metrics,
        // DF-SPECLANG-015: propagate the executor's stdout and failure
        // reason — without these the daemon task consumer had nothing to
        // write to task.target and no way to report WHY a run failed.
        output: result.output,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        agent: options.agent,
        timestamp,
        files_modified: [],
        duration_ms: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
        thinking: options.thinking,
      };
    }
  }

  /**
   * Invoke N agents in parallel (swarm execution).
   *
   * All invocations are kicked off synchronously and resolved via Promise.all,
   * so wall-clock time is bounded by the slowest agent — NOT the sum of all
   * agent times. This is the core ARCH-003 primitive.
   *
   * @param optionsList - List of invocation requests
   * @param concurrency - Optional cap on concurrent invocations (default: unlimited)
   * @returns Array of InvocationResult in the same order as optionsList
   */
  async invokeMany(
    optionsList: InvocationOptions[],
    concurrency?: number
  ): Promise<InvocationResult[]> {
    if (optionsList.length === 0) return [];

    if (concurrency === undefined || concurrency >= optionsList.length) {
      // Unbounded swarm: kick off every invocation, wait for all.
      return Promise.all(optionsList.map((opts) => this.invoke(opts)));
    }

    // Bounded swarm: round-robin over N worker slots.
    const results: InvocationResult[] = new Array(optionsList.length);
    let next = 0;

    const worker = async (): Promise<void> => {
      while (true) {
        const idx = next++;
        if (idx >= optionsList.length) return;
        results[idx] = await this.invoke(optionsList[idx]);
      }
    };

    const workers = Array.from(
      { length: Math.max(1, concurrency) },
      () => worker()
    );
    await Promise.all(workers);
    return results;
  }

  createInvocationRecord(
    result: InvocationResult,
    files: string[]
  ): AgentInvocation {
    return {
      agent: result.agent,
      timestamp: result.timestamp,
      result: result.success ? 'success' : 'failure',
      files_modified: files,
    };
  }
}

export function getAgentForTrigger(trigger: string): string {
  if (trigger.endsWith('.spec.md') || trigger.endsWith('.spec')) {
    return 'speclang-spec-writer';
  }
  if (trigger.startsWith('src/')) {
    return 'speclang-code-gen';
  }
  if (trigger.startsWith('tests/')) {
    return 'speclang-test-writer';
  }
  return 'speclang-coordinator';
}