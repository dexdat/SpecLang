"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentInvoker = void 0;
exports.getAgentForTrigger = getAgentForTrigger;
class AgentInvoker {
    verbose;
    constructor(verbose = false) {
        this.verbose = verbose;
    }
    async invoke(options) {
        const timestamp = new Date().toISOString();
        const files_modified = [];
        if (this.verbose) {
            console.log(`[AgentInvoker] Invoking agent: ${options.agent} for trigger: ${options.trigger}`);
        }
        try {
            const result = await this.executeAgent(options.agent, options.trigger, options.params, options.thinking);
            files_modified.push(...result.files);
            return {
                success: result.success,
                agent: options.agent,
                timestamp,
                files_modified,
                thinking: options.thinking
            };
        }
        catch (error) {
            return {
                success: false,
                agent: options.agent,
                timestamp,
                files_modified,
                error: error instanceof Error ? error.message : String(error),
                thinking: options.thinking
            };
        }
    }
    async executeAgent(agent, trigger, params, thinking) {
        const { execSync } = await import('child_process');
        try {
            const command = this.buildCommand(agent, trigger, params, thinking);
            const output = execSync(command, { encoding: 'utf-8' });
            return {
                success: true,
                files: this.parseOutputFiles(output)
            };
        }
        catch {
            return { success: false, files: [] };
        }
    }
    buildCommand(agent, trigger, params, thinking) {
        const paramsStr = params ? ` ${JSON.stringify(params)}` : '';
        // THINK-002: forward the reasoning-depth gate to the agent CLI.
        const thinkingStr = thinking ? ` --thinking ${thinking}` : '';
        return `speclang agent ${agent} --trigger ${trigger}${paramsStr}${thinkingStr}`;
    }
    parseOutputFiles(output) {
        const files = [];
        const lines = output.split('\n');
        for (const line of lines) {
            const match = line.match(/Created: (.+)/);
            if (match) {
                files.push(match[1]);
            }
        }
        return files;
    }
    createInvocationRecord(result, files) {
        return {
            agent: result.agent,
            timestamp: result.timestamp,
            result: result.success ? 'success' : 'failure',
            files_modified: files
        };
    }
}
exports.AgentInvoker = AgentInvoker;
function getAgentForTrigger(trigger) {
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
//# sourceMappingURL=invocation.js.map