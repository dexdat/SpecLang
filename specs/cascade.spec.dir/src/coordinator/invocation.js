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
const path = __importStar(require("path"));
const defaultExecutor = async (agent, trigger, params, thinking) => {
    // Use dynamic import to keep child_process out of the module graph for
    // pure-orchestration callers (tests, embeds).
    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const execFileAsync = promisify(execFile);
    const paramsStr = params ? ` ${JSON.stringify(params)}` : '';
    const args = ['agent', agent, '--trigger', trigger];
    if (params)
        args.push('--params', JSON.stringify(params));
    // THINK-002: forward the reasoning-depth gate to the agent CLI so the
    // runtime can budget tokens per cascade phase.
    if (thinking)
        args.push('--thinking', thinking);
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
    ].filter(Boolean);
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
        }
        catch (err) {
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
            const result = await this.executor(options.agent, options.trigger, options.params, options.thinking);
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
        }
        catch (error) {
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
//# sourceMappingURL=invocation.js.map