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
exports.CascadeCoordinator = exports.DEFAULT_THINKING_BY_AGENT = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dependency_js_1 = require("./dependency.js");
const invocation_js_1 = require("./invocation.js");
/**
 * THINK-002: default reasoning-depth per agent role.
 *   - spec-writer (spec_expand)  → low
 *   - code-gen    (code_generate) → high
 *   - test-writer                 → medium
 *   - coordinator (spec_read)     → none
 *
 * Token budget scales roughly with reasoning depth, so gating here is the
 * primary lever for reducing cascade token usage.
 */
exports.DEFAULT_THINKING_BY_AGENT = {
    'speclang-spec-writer': 'low',
    'speclang-code-gen': 'high',
    'speclang-test-writer': 'medium',
    'speclang-coordinator': 'none',
};
class CascadeCoordinator {
    tracker;
    state;
    options;
    gates = [];
    invoker;
    /**
     * THINK-004: per-invocation metrics store. Index-aligned with
     * `state.agents_invoked`. Entries are null when no metrics were
     * collected for that invocation.
     */
    invocationMetrics = [];
    constructor(indexPath = '_index.json', options = {}) {
        this.tracker = new dependency_js_1.DependencyTracker(indexPath);
        this.options = {
            maxDepth: 5,
            verbose: false,
            parallel: true,
            ...options,
        };
        this.state = this.tracker.createInitialState('', this.options.maxDepth);
        this.invoker = new invocation_js_1.AgentInvoker(this.options.verbose ?? false);
        this.setupGates();
    }
    /**
     * ARCH-003: Replace the default executor with an injectable AgentInvoker.
     * Used by tests to inject a fake executor that sleeps/asserts concurrency
     * without shelling out to real `speclang agent` invocations.
     */
    setInvoker(invoker) {
        this.invoker = invoker;
    }
    /**
     * DF-SPECLANG-015: persist an agent's stdout. The agent CLI emits its whole
     * response on stdout; when a seed asks for several artifacts the model
     * separates them with `# generated/<path>` section markers (observed
     * behaviour: one marker line per requested file). Split on those markers so
     * ONE seed produces EVERY artifact it asked for; fall back to the routed
     * task's single target when no markers are present.
     *
     * Returns the list of paths written. Refuses paths outside the project cwd.
     */
    static persistAgentOutput(output, fallbackTarget, projectRoot) {
        // Models emit section markers in several shapes: "# generated/x.md",
        // "## FILE: `generated/x.md`", "FILE: docs/y.md". Accept any heading or
        // FILE-labelled line carrying a project-relative artifact path.
        const MARKER = /^#{0,4}\s*(?:FILE|File|file)?\s*[:—–-]?\s*`?((?:generated|specs|docs|src|tests|out|content|books)\/[\w./-]+\.(?:md|txt|json|ya?ml|ts|js|py|scl))`?\s*$/;
        const sections = [];
        let current = null;
        for (const line of output.split('\n')) {
            const m = line.match(MARKER);
            if (m) {
                if (current)
                    sections.push(current);
                current = { path: m[1], lines: [] };
            }
            else if (current) {
                current.lines.push(line);
            }
        }
        if (current)
            sections.push(current);
        const root = path.resolve(projectRoot);
        const writeOne = (relPath, content) => {
            const abs = path.resolve(root, relPath);
            if (abs !== root && !abs.startsWith(root + path.sep)) {
                console.error(`[Coordinator] Refusing to write outside project: ${relPath}`);
                return null;
            }
            fs.mkdirSync(path.dirname(abs), { recursive: true });
            fs.writeFileSync(abs, content.trim() + '\n');
            return relPath;
        };
        const written = [];
        if (sections.length > 0) {
            for (const s of sections) {
                const body = s.lines.join('\n').trim();
                if (body.length === 0)
                    continue;
                const rel = writeOne(s.path, body);
                if (rel)
                    written.push(rel);
            }
            if (written.length > 0)
                return written;
        }
        if (fallbackTarget && output.trim().length > 0) {
            const rel = writeOne(fallbackTarget, output);
            if (rel)
                written.push(rel);
        }
        return written;
    }
    /**
     * ARCH-003: Access the underlying invoker (for tests + advanced use).
     */
    getInvoker() {
        return this.invoker;
    }
    /**
     * DF-SPECLANG-015: consume routed tasks from a live daemon.
     *
     * The daemon routes AgentTasks (see Daemon.emit('task')) but nothing in the
     * shipped code consumed them — routed spec_writer tasks produced no agent
     * session, so reactive expansion generated nothing. This subscribes to the
     * daemon's 'task' events and invokes the matching agent through the same
     * AgentInvoker used by cascadeFrom (i.e. the proven `speclang agent` path).
     *
     * Dedup: the daemon re-converges on unchanged files every poll cycle, so
     * identical triggers are suppressed while in flight and for ttlMs
     * (default 10 min) after a dispatch — without this, every 30s reconvergence
     * would re-invoke the agent and burn tokens in a loop.
     */
    watchDaemon(daemon, options) {
        const ttlMs = options?.ttlMs ?? 10 * 60 * 1000;
        const verbose = options?.verbose ?? this.options.verbose ?? false;
        const inFlight = new Set();
        const lastDispatchedAt = new Map();
        daemon.on('task', (task) => {
            const triggerPath = task.trigger || task.spec || '';
            if (!triggerPath) {
                if (verbose)
                    console.log('[Coordinator] Routed task has no trigger — skipping');
                return;
            }
            const key = `${task.kind ?? ''}|${triggerPath}`;
            if (inFlight.has(key)) {
                console.log(`[Coordinator] Task already in flight for ${triggerPath} — skipping duplicate`);
                return;
            }
            const last = lastDispatchedAt.get(key);
            if (last !== undefined && Date.now() - last < ttlMs) {
                if (verbose)
                    console.log(`[Coordinator] Task for ${triggerPath} dispatched within TTL — skipping`);
                return;
            }
            inFlight.add(key);
            lastDispatchedAt.set(key, Date.now());
            const agent = (0, invocation_js_1.getAgentForTrigger)(triggerPath);
            // DF-SPECLANG-015: if the trigger is an existing file, inline its
            // CONTENT — a bare path passed as --trigger reads as topic text and the
            // model invents its own project instead of expanding the seed.
            let triggerPayload = triggerPath;
            try {
                triggerPayload = fs.readFileSync(triggerPath, 'utf-8');
            }
            catch {
                // not a file — pass as-is
            }
            console.log(`[Coordinator] Dispatching agent ${agent} for routed task (trigger: ${triggerPath})`);
            this.invoker
                .invoke({ agent, trigger: triggerPayload })
                .then((invocation) => {
                this.recordInvocation(invocation);
                if (invocation.success) {
                    console.log(`[Coordinator] Agent ${agent} completed for ${triggerPath} (${invocation.files_modified.length} files modified)`);
                    // DF-SPECLANG-015: the agent CLI prints generated content on
                    // stdout — persist every artifact it emitted (multi-file seeds
                    // mark sections with `# generated/<path>`), falling back to the
                    // routed task's single target.
                    const output = invocation.output;
                    if (output && output.trim().length > 0) {
                        const written = CascadeCoordinator.persistAgentOutput(output, task.target, process.cwd());
                        if (written.length > 0) {
                            console.log(`[Coordinator] Wrote agent output: ${written.join(', ')} (${output.length} bytes)`);
                        }
                        else {
                            console.error('[Coordinator] Agent produced output but no file could be written');
                        }
                    }
                }
                else {
                    console.error(`[Coordinator] Agent ${agent} FAILED for ${triggerPath}: ${invocation.error ?? 'unknown error'}`);
                }
            })
                .catch((error) => {
                console.error(`[Coordinator] Agent invocation error for ${triggerPath}:`, error);
            })
                .finally(() => {
                inFlight.delete(key);
            });
        });
    }
    setupGates() {
        this.gates = [
            {
                name: 'reference-validation',
                check: async () => this.runReferenceValidation()
            },
            {
                name: 'compilation',
                check: async () => this.runCompilationCheck()
            },
            {
                name: 'tests',
                check: async () => this.runTestExecution()
            }
        ];
    }
    async runReferenceValidation() {
        try {
            (0, child_process_1.execSync)('python3 scripts/validate_refs.py', { stdio: 'pipe' });
            return { passed: true, message: 'All references valid' };
        }
        catch {
            return {
                passed: false,
                message: 'Reference validation failed',
                details: ['Run: python3 scripts/validate_refs.py for details']
            };
        }
    }
    async runCompilationCheck() {
        try {
            (0, child_process_1.execSync)('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
            return { passed: true, message: 'Code compiles successfully' };
        }
        catch {
            return {
                passed: false,
                message: 'Compilation failed',
                details: ['Run: npx tsc --noEmit --skipLibCheck for details']
            };
        }
    }
    async runTestExecution() {
        if (this.options.skipTests) {
            return { passed: true, message: 'Tests skipped' };
        }
        try {
            const output = (0, child_process_1.execSync)('python3 -m pytest tests/ -v --tb=short 2>&1 || true', {
                encoding: 'utf-8',
                maxBuffer: 10 * 1024 * 1024
            });
            const passed = output.includes('passed');
            const failed = output.includes('failed');
            return {
                passed: !failed,
                message: passed ? 'Tests passed' : 'Some tests failed',
                details: [output.slice(-500)]
            };
        }
        catch {
            return { passed: false, message: 'Test execution failed' };
        }
    }
    async runGate(gateName) {
        const gate = this.gates.find(g => g.name === gateName);
        if (!gate) {
            return { passed: false, message: `Gate not found: ${gateName}` };
        }
        return gate.check();
    }
    async runAllGates() {
        const results = {};
        for (const gate of this.gates) {
            results[gate.name] = await gate.check();
        }
        return results;
    }
    start(triggerFile) {
        this.state = this.tracker.createInitialState(triggerFile, this.options.maxDepth);
        this.state.status = 'running';
        // ARCH-003: load the index lazily at start time so the cascade can be
        // triggered without requiring callers to remember to call loadIndex()
        // first. Existing callers that pre-loaded still work (loadIndex is
        // idempotent — it just rebuilds the graph from the same file).
        this.tracker.loadIndex();
        this.saveState();
        if (this.options.verbose) {
            console.log(`[Coordinator] Started cascade: ${this.state.cascade_id}`);
        }
    }
    async processTree(treeType, onNode) {
        const nodes = this.tracker.getTree(treeType);
        let processed = 0;
        let failed = 0;
        for (const node of nodes) {
            try {
                if (onNode) {
                    await onNode(node);
                }
                processed++;
                this.state.depth_by_tree[treeType]++;
            }
            catch {
                failed++;
            }
        }
        return { processed, failed };
    }
    /**
     * Build the per-node InvocationOptions used by the swarm.
     * Exposed so tests can verify routing logic without running the cascade.
     *
     * THINK-002: resolves the reasoning-depth for the node's agent from
     * `options.thinking` (user overrides) falling back to
     * DEFAULT_THINKING_BY_AGENT. Pass `thinking: {}` in CoordinatorOptions to
     * disable thinking entirely.
     */
    buildInvocation(node) {
        const agent = (0, invocation_js_1.getAgentForTrigger)(node.filePath);
        const thinking = this.resolveThinking(agent);
        const opts = {
            agent,
            trigger: node.filePath,
            params: { layer: node.layer, type: node.type, id: node.id },
        };
        if (thinking !== undefined) {
            opts.thinking = thinking;
        }
        return opts;
    }
    /**
     * THINK-002: look up the ThinkingLevel for an agent.
     * User-supplied `options.thinking` wins over the defaults. Returns
     * `undefined` when the caller explicitly disabled gating with `{}`.
     */
    resolveThinking(agent) {
        const overrides = this.options.thinking;
        if (overrides !== undefined) {
            return overrides[agent];
        }
        return exports.DEFAULT_THINKING_BY_AGENT[agent];
    }
    /**
     * ARCH-003: Run a cascade by fanning out per-wave in parallel.
     *
     * Algorithm:
     *   1. Topologically order the cascade (respect dependencies within a wave).
     *   2. Partition into waves by `layer` — all nodes in a wave are independent.
     *   3. For each wave, invoke all agents concurrently via `AgentInvoker.invokeMany`.
     *   4. After each wave, run verification gates (compilation, refs, tests).
     *
     * Wall-clock cost = sum of wave costs (≈ slowest agent per wave),
     * NOT sum of all agents — this is the speedup vs. the sequential loop.
     */
    async cascadeFrom(triggerId) {
        const result = {
            success: false,
            stepsCompleted: 0,
            gatesPassed: 0,
            gatesFailed: 0,
            errors: [],
            mode: this.options.parallel ? 'swarm' : 'sequential',
            waves: 0,
            parallelism: 0,
        };
        try {
            this.start(triggerId);
            // ARCH-003: use the dependent tree (trigger → all dependents) instead
            // of the dependency tree (trigger → its own deps). For a cascade
            // triggered by a spec change, we want to fan out to the spec's
            // downstream targets (codegen, tests, docs), not its upstream deps.
            const orderedNodes = this.tracker.getDependentsTree(triggerId);
            if (this.options.parallel) {
                await this.cascadeFromSwarm(orderedNodes, result);
            }
            else {
                await this.cascadeFromSequential(orderedNodes, result);
            }
            result.success = result.gatesFailed === 0;
            this.state.status = result.success ? 'completed' : 'failed';
            // THINK-004: collate and optionally print the token metrics summary.
            if (this.options.metrics) {
                const summary = this.collateMetrics();
                result.metrics_summary = summary;
                if (this.options.verbose) {
                    this.printMetricsSummary(summary);
                }
            }
        }
        catch (error) {
            result.errors.push(error instanceof Error ? error.message : String(error));
            this.state.status = 'failed';
        }
        this.saveState();
        return result;
    }
    /**
     * Sequential path — preserves the original ARCH-001/002 behavior.
     */
    async cascadeFromSequential(orderedNodes, result) {
        for (const node of orderedNodes) {
            if (this.state.depth >= this.state.max_depth) {
                result.errors.push('Max depth reached');
                break;
            }
            this.state.depth++;
            result.stepsCompleted++;
            if (this.options.verbose) {
                console.log(`[Coordinator] Processing: ${node.id} (depth ${node.layer})`);
            }
            const opts = this.buildInvocation(node);
            const invocation = await this.invoker.invoke(opts);
            this.recordInvocation(invocation);
            const gateResults = await this.runAllGates();
            this.recordGateResults(gateResults, result);
        }
    }
    /**
     * ARCH-003: Parallel path — fan out per-wave via `AgentInvoker.invokeMany`.
     */
    async cascadeFromSwarm(orderedNodes, result) {
        const waves = this.tracker.partitionByDepth(orderedNodes);
        result.waves = waves.length;
        result.parallelism = waves.reduce((max, w) => Math.max(max, w.length), 0);
        if (this.options.verbose) {
            console.log(`[Coordinator] Swarm: ${orderedNodes.length} nodes across ${waves.length} waves ` +
                `(max parallelism: ${result.parallelism})`);
        }
        for (const wave of waves) {
            if (this.state.depth >= this.state.max_depth) {
                result.errors.push('Max depth reached');
                break;
            }
            this.state.depth++;
            result.stepsCompleted += wave.length;
            this.state.depth_by_tree[wave[0]?.type ?? 'specs'] += wave.length;
            if (this.options.verbose) {
                const ids = wave.map((n) => `${n.id}@L${n.layer}`).join(', ');
                console.log(`[Coordinator] Wave ${this.state.depth}: ${wave.length} agents [${ids}]`);
            }
            const optsList = wave.map((n) => this.buildInvocation(n));
            const invocations = await this.invoker.invokeMany(optsList, this.options.concurrency);
            for (const inv of invocations) {
                this.recordInvocation(inv);
            }
            // Gates run once per wave (not per agent) — they're expensive
            // and observe the post-wave file system state.
            const gateResults = await this.runAllGates();
            this.recordGateResults(gateResults, result);
        }
    }
    recordInvocation(invocation) {
        this.state.current_agent = invocation.agent;
        this.state.agents_invoked.push({
            agent: invocation.agent,
            timestamp: invocation.timestamp,
            result: invocation.success ? 'success' : 'failure',
            files_modified: invocation.files_modified,
        });
        // THINK-004: capture per-invocation metrics for later collation.
        this.invocationMetrics.push(invocation.metrics ?? null);
    }
    recordGateResults(gateResults, result) {
        for (const [gate, res] of Object.entries(gateResults)) {
            if (res.passed) {
                result.gatesPassed++;
            }
            else {
                result.gatesFailed++;
                result.errors.push(`${gate}: ${res.message}`);
            }
        }
    }
    canContinue() {
        return this.state.status === 'running' &&
            this.state.depth < this.state.max_depth;
    }
    pause() {
        this.state.status = 'paused';
        this.saveState();
    }
    resume() {
        this.state.status = 'running';
        this.saveState();
    }
    getState() {
        return { ...this.state };
    }
    saveState() {
        this.tracker.saveState(this.state);
    }
    loadState() {
        const state = this.tracker.loadState();
        if (state) {
            this.state = state;
            return true;
        }
        return false;
    }
    /**
     * THINK-004: collate token metrics from all recorded invocations
     * into a per-phase summary.
     */
    collateMetrics() {
        const summary = {
            total_input_tokens: 0,
            total_output_tokens: 0,
            total_reasoning_tokens: 0,
            phases: {},
        };
        // Pair invocation agents with their metrics.
        const agents = this.state.agents_invoked;
        for (let i = 0; i < agents.length; i++) {
            const metrics = this.invocationMetrics[i];
            if (!metrics)
                continue;
            const agent = agents[i].agent;
            if (!summary.phases[agent]) {
                summary.phases[agent] = {
                    input_tokens: 0,
                    output_tokens: 0,
                    reasoning_tokens: 0,
                    invocations: 0,
                };
            }
            summary.phases[agent].input_tokens += metrics.input_tokens;
            summary.phases[agent].output_tokens += metrics.output_tokens;
            summary.phases[agent].reasoning_tokens += metrics.reasoning_tokens ?? 0;
            summary.phases[agent].invocations++;
        }
        summary.total_input_tokens = Object.values(summary.phases).reduce((sum, p) => sum + p.input_tokens, 0);
        summary.total_output_tokens = Object.values(summary.phases).reduce((sum, p) => sum + p.output_tokens, 0);
        summary.total_reasoning_tokens = Object.values(summary.phases).reduce((sum, p) => sum + p.reasoning_tokens, 0);
        return summary;
    }
    /**
     * THINK-004: print a human-readable token-breakdown summary to stdout.
     */
    printMetricsSummary(summary) {
        const phaseEntries = Object.entries(summary.phases);
        if (phaseEntries.length === 0) {
            console.log('\\n📊 Metrics: No token data collected.');
            return;
        }
        console.log('\\n📊 Token Metrics Summary');
        console.log('═'.repeat(60));
        for (const [agent, phase] of phaseEntries) {
            const total = phase.input_tokens + phase.output_tokens + phase.reasoning_tokens;
            console.log(`\\n  ${agent} (${phase.invocations} invocation${phase.invocations !== 1 ? 's' : ''})`);
            console.log(`    Input:     ${phase.input_tokens.toLocaleString()} tokens`);
            console.log(`    Output:    ${phase.output_tokens.toLocaleString()} tokens`);
            if (phase.reasoning_tokens > 0) {
                console.log(`    Reasoning: ${phase.reasoning_tokens.toLocaleString()} tokens`);
            }
            console.log(`    Total:     ${total.toLocaleString()} tokens`);
        }
        console.log('\\n' + '═'.repeat(60));
        console.log('  Grand Total');
        console.log(`    Input:     ${summary.total_input_tokens.toLocaleString()} tokens`);
        console.log(`    Output:    ${summary.total_output_tokens.toLocaleString()} tokens`);
        if (summary.total_reasoning_tokens > 0) {
            console.log(`    Reasoning: ${summary.total_reasoning_tokens.toLocaleString()} tokens`);
        }
        const grandTotal = summary.total_input_tokens + summary.total_output_tokens + summary.total_reasoning_tokens;
        console.log(`    Total:     ${grandTotal.toLocaleString()} tokens`);
        console.log('═'.repeat(60));
    }
}
exports.CascadeCoordinator = CascadeCoordinator;
//# sourceMappingURL=index.js.map