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
    error?: string;
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