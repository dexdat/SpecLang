import { AgentInvocation } from './state.js';
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
export type AgentExecutorFn = (agent: string, trigger: string, params?: Record<string, unknown>, thinking?: ThinkingLevel) => Promise<{
    success: boolean;
    files: string[];
    metrics?: InvocationMetrics;
}>;
export declare class AgentInvoker {
    private verbose;
    private executor;
    constructor(verbose?: boolean, executor?: AgentExecutorFn);
    /**
     * Invoke a single agent. Async; safe to call concurrently from many callers.
     */
    invoke(options: InvocationOptions): Promise<InvocationResult>;
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
    invokeMany(optionsList: InvocationOptions[], concurrency?: number): Promise<InvocationResult[]>;
    createInvocationRecord(result: InvocationResult, files: string[]): AgentInvocation;
}
export declare function getAgentForTrigger(trigger: string): string;
//# sourceMappingURL=invocation.d.ts.map