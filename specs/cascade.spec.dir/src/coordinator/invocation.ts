import { AgentInvocation } from './state.js';

export interface InvocationOptions {
  agent: string;
  trigger: string;
  params?: Record<string, unknown>;
}

export interface InvocationResult {
  success: boolean;
  agent: string;
  timestamp: string;
  files_modified: string[];
  duration_ms?: number;
  error?: string;
}

/**
 * Pluggable executor signature — defaults to spawning a child process, but
 * tests can inject a deterministic stub to prove parallelism without
 * shelling out (no flaky CI from real `speclang agent` invocations).
 */
export type AgentExecutorFn = (
  agent: string,
  trigger: string,
  params?: Record<string, unknown>
) => Promise<{ success: boolean; files: string[] }>;

const defaultExecutor: AgentExecutorFn = async (agent, trigger, params) => {
  // Use dynamic import to keep child_process out of the module graph for
  // pure-orchestration callers (tests, embeds).
  const { execFile } = await import('child_process');
  const { promisify } = await import('util');
  const execFileAsync = promisify(execFile);

  const paramsStr = params ? ` ${JSON.stringify(params)}` : '';
  const args = ['agent', agent, '--trigger', trigger];
  if (params) args.push('--params', JSON.stringify(params));

  try {
    const { stdout } = await execFileAsync('speclang', args, {
      encoding: 'utf-8',
      timeout: 30_000,
    });
    return { success: true, files: parseOutputFiles(stdout) };
  } catch {
    return { success: false, files: [] };
  }
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
      const result = await this.executor(options.agent, options.trigger, options.params);
      return {
        success: result.success,
        agent: options.agent,
        timestamp,
        files_modified: result.files,
        duration_ms: Date.now() - start,
      };
    } catch (error) {
      return {
        success: false,
        agent: options.agent,
        timestamp,
        files_modified: [],
        duration_ms: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
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