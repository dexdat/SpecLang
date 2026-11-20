import { AgentInvocation } from './state.js';
import type { ThinkingLevel } from '../../parser.spec.dir/src/types.js';
export interface InvocationOptions {
    agent: string;
    trigger: string;
    params?: Record<string, unknown>;
    /**
     * THINK-002: reasoning depth for this invocation. When set, the executor
     * appends `--thinking <level>` to the underlying `speclang agent` CLI call
     * so the runtime can gate token usage per cascade phase.
     */
    thinking?: ThinkingLevel;
}
export interface InvocationResult {
    success: boolean;
    agent: string;
    timestamp: string;
    files_modified: string[];
    error?: string;
    /** THINK-002: reasoning depth used for this invocation (if any). */
    thinking?: ThinkingLevel;
}
export declare class AgentInvoker {
    private verbose;
    constructor(verbose?: boolean);
    invoke(options: InvocationOptions): Promise<InvocationResult>;
    private executeAgent;
    private buildCommand;
    private parseOutputFiles;
    createInvocationRecord(result: InvocationResult, files: string[]): AgentInvocation;
}
export declare function getAgentForTrigger(trigger: string): string;
//# sourceMappingURL=invocation.d.ts.map