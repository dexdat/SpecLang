/**
 * Cascade Runner - Main entry point for running cascades
 *
 * A cascade is the process of:
 * 1. Reading a spec file
 * 2. Expanding it (if needed)
 * 3. Generating code
 * 4. Running tests
 * 5. Detecting convergence
 */
import type { CoordinatorOptions } from './coordinator/index.js';
export interface CascadeOptions {
    verbose?: boolean;
    maxDepth?: number;
    convergenceTimeout?: number;
    /** THINK-003: provider-neutral per-agent reasoning overrides. */
    thinking?: CoordinatorOptions['thinking'];
    /** THINK-004: collect and print per-phase token metrics. */
    metrics?: boolean;
}
export interface CascadeResult {
    success: boolean;
    filesGenerated: string[];
    testsRun: number;
    testsPassed: number;
    converged: boolean;
    convergenceTime?: number;
    error?: string;
    warning?: string;
    /** THINK-004: per-phase token breakdown when metrics option is set. */
    metrics_summary?: {
        total_input_tokens: number;
        total_output_tokens: number;
        total_tokens: number;
    };
}
/**
 * Run a cascade on a spec file
 */
export declare function runCascade(specPath: string, options?: CascadeOptions): Promise<CascadeResult>;
/**
 * Parse a spec file and extract metadata
 */
declare function parseSpec(content: string): {
    id: string;
    version: string;
    blocks: SpecBlock[];
};
interface SpecBlock {
    id: string;
    name: string;
    kind: string;
    language?: string;
    code: string;
}
export { parseSpec };
export { CascadeCoordinator } from './coordinator/index.js';
export { DependencyTracker } from './coordinator/dependency.js';
export { CascadeState, AgentInvocation, VerificationResult, createInitialState } from './coordinator/state.js';
export { AgentInvoker, getAgentForTrigger } from './coordinator/invocation.js';
export { VerificationGates, createVerificationResult, type GateResult, type VerificationGate } from './coordinator/verification.js';
export type { TreeNode, DependencyGraph } from './coordinator/dependency.js';
export type { CoordinatorOptions, CascadeResult as CoordinatorResult } from './coordinator/index.js';
//# sourceMappingURL=index.d.ts.map