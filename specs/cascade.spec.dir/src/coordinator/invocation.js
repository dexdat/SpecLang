"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentInvoker = void 0;
exports.getAgentForTrigger = getAgentForTrigger;
const defaultExecutor = async (agent, trigger, params) => {
    // Use dynamic import to keep child_process out of the module graph for
    // pure-orchestration callers (tests, embeds).
    const { execFile } = await Promise.resolve().then(() => __importStar(require('child_process')));
    const { promisify } = await Promise.resolve().then(() => __importStar(require('util')));
    const execFileAsync = promisify(execFile);
    const paramsStr = params ? ` ${JSON.stringify(params)}` : '';
    const args = ['agent', agent, '--trigger', trigger];
    if (params)
        args.push('--params', JSON.stringify(params));
    try {
        const { stdout } = await execFileAsync('speclang', args, {
            encoding: 'utf-8',
            timeout: 30_000,
        });
        return { success: true, files: parseOutputFiles(stdout) };
    }
    catch {
        return { success: false, files: [] };
    }
};
function parseOutputFiles(output) {
    const files = [];
    for (const line of output.split('\n')) {
        const match = line.match(/Created: (.+)/);
        if (match)
            files.push(match[1]);
    }
    return files;
}
class AgentInvoker {
    verbose;
    executor;
    constructor(verbose = false, executor = defaultExecutor) {
        this.verbose = verbose;
        this.executor = executor;
    }
    /**
     * Invoke a single agent. Async; safe to call concurrently from many callers.
     */
    async invoke(options) {
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
        }
        catch (error) {
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
    async invokeMany(optionsList, concurrency) {
        if (optionsList.length === 0)
            return [];
        if (concurrency === undefined || concurrency >= optionsList.length) {
            // Unbounded swarm: kick off every invocation, wait for all.
            return Promise.all(optionsList.map((opts) => this.invoke(opts)));
        }
        // Bounded swarm: round-robin over N worker slots.
        const results = new Array(optionsList.length);
        let next = 0;
        const worker = async () => {
            while (true) {
                const idx = next++;
                if (idx >= optionsList.length)
                    return;
                results[idx] = await this.invoke(optionsList[idx]);
            }
        };
        const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker());
        await Promise.all(workers);
        return results;
    }
    createInvocationRecord(result, files) {
        return {
            agent: result.agent,
            timestamp: result.timestamp,
            result: result.success ? 'success' : 'failure',
            files_modified: files,
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
