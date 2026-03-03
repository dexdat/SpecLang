"use strict";
/**
 * Main Daemon class for speclangd simulation
 *
 * Generated from: @speclang/daemon
 *
 * This ties together all the components: watcher, router, convergence, state, IPC
 */
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
exports.Daemon = void 0;
exports.createDaemon = createDaemon;
exports.getDaemon = getDaemon;
const events_1 = require("events");
const watcher_1 = require("./watcher");
const router_1 = require("./router");
const convergence_1 = require("./convergence");
const state_1 = require("./state");
const ipc_1 = require("./ipc");
const config_1 = require("./config");
const locks_1 = require("./locks");
const types_1 = require("./types");
class Daemon extends events_1.EventEmitter {
    watcher = null;
    router;
    convergence;
    state;
    ipc;
    config;
    lockManager;
    running;
    paused;
    constructor(configPath) {
        super();
        this.config = new config_1.Config(configPath);
        this.router = new router_1.Router();
        this.state = new state_1.State();
        this.ipc = new ipc_1.IPC();
        this.lockManager = new locks_1.LockManager();
        this.convergence = null; // Initialized in start()
        this.running = false;
        this.paused = false;
    }
    /**
     * Initialize and start the daemon
     */
    async start() {
        console.log('[Daemon] Starting speclangd...');
        // Load configuration
        await this.config.load();
        // Initialize lock manager
        this.lockManager = new locks_1.LockManager(this.config.get().locks.dir, this.config.get().locks.timeout);
        await this.lockManager.initialize();
        // Initialize components
        this.watcher = new watcher_1.Watcher(this.config.get());
        this.convergence = new convergence_1.ConvergenceDetector(this.config.get());
        // Wire up event flow: watcher -> convergence -> router
        this.watcher.on('event', (event) => {
            if (!this.paused) {
                this.handleFileEvent(event);
            }
        });
        // Handle convergence - trigger pipeline execution
        this.convergence.on('converged', async (result) => {
            console.log('[Daemon] Cascade converged!', result);
            this.state.setStatus(types_1.DaemonStatusKind.Converged);
            this.emit('converged', result);
            // Execute pipeline on convergence
            await this.executePipeline(result);
        });
        // Start watching
        await this.watcher.start();
        // Load persisted state
        await this.state.load();
        this.running = true;
        this.state.setStatus(types_1.DaemonStatusKind.Idle);
        console.log('[Daemon] Started successfully');
        this.emit('started');
    }
    /**
     * Stop the daemon
     */
    async stop() {
        console.log('[Daemon] Stopping...');
        if (this.watcher) {
            this.watcher.stop();
        }
        if (this.convergence) {
            this.convergence.stop();
        }
        await this.state.save();
        this.running = false;
        this.state.setStatus(types_1.DaemonStatusKind.Idle);
        console.log('[Daemon] Stopped');
        this.emit('stopped');
    }
    /**
     * Handle a file event
     */
    handleFileEvent(event) {
        console.log(`[Daemon] File event: ${event.kind} - ${event.path}`);
        // Update state
        this.state.addChangedFile(event.path);
        this.state.setStatus(types_1.DaemonStatusKind.Cascading);
        this.state.setCascadeDepth(this.convergence.getCascadeDepth());
        // Notify convergence
        this.convergence.onEvent(event);
        // Route to agent
        const task = this.router.route(event);
        if (task) {
            console.log(`[Daemon] Routed to agent: ${this.router.getAgentForTask(task)}`);
            this.emit('task', task);
        }
    }
    /**
     * Process a command
     */
    async processCommand(command) {
        switch (command.kind) {
            case types_1.DaemonCommandKind.Status:
                console.log(ipc_1.IPC.formatStatus(this.getStatus()));
                break;
            case types_1.DaemonCommandKind.Pause:
                this.paused = true;
                this.state.setStatus(types_1.DaemonStatusKind.Paused);
                console.log('[Daemon] Paused');
                break;
            case types_1.DaemonCommandKind.Resume:
                this.paused = false;
                this.state.setStatus(types_1.DaemonStatusKind.Idle);
                console.log('[Daemon] Resumed');
                break;
            case types_1.DaemonCommandKind.Abort:
                await this.abort();
                break;
            case types_1.DaemonCommandKind.Trigger:
                if (command.path && this.watcher) {
                    await this.watcher.trigger(command.path);
                    console.log(`[Daemon] Triggered: ${command.path}`);
                }
                break;
            case types_1.DaemonCommandKind.Converge:
                if (this.convergence) {
                    try {
                        const result = await this.convergence.waitForConvergence(60000);
                        console.log('[Daemon] Converged:', result);
                    }
                    catch (error) {
                        console.error('[Daemon] Convergence timeout');
                    }
                }
                break;
        }
    }
    /**
     * Abort current cascade
     */
    async abort() {
        console.log('[Daemon] Aborting cascade...');
        this.convergence.reset();
        this.router.resetCascadeDepth();
        await this.state.reset();
        this.state.setStatus(types_1.DaemonStatusKind.Idle);
        console.log('[Daemon] Aborted');
    }
    /**
     * Get current daemon status
     */
    getStatus() {
        const status = this.state.getStatus();
        if (this.convergence) {
            const convStatus = this.convergence.getStatus();
            status.cascadeDepth = convStatus.currentDepth;
            status.filesChanged = convStatus.filesChanged;
        }
        status.status = this.paused ? types_1.DaemonStatusKind.Paused :
            this.convergence?.isConverged() ? types_1.DaemonStatusKind.Converged :
                types_1.DaemonStatusKind.Cascading;
        return status;
    }
    /**
     * Check if daemon is running
     */
    isRunning() {
        return this.running;
    }
    /**
     * Check if daemon is paused
     */
    isPaused() {
        return this.paused;
    }
    /**
     * Get convergence detector
     */
    getConvergence() {
        return this.convergence;
    }
    /**
     * Get router
     */
    getRouter() {
        return this.router;
    }
    /**
     * Get config
     */
    getConfig() {
        return this.config;
    }
    /**
     * Get lock manager
     */
    getLockManager() {
        return this.lockManager;
    }
    /**
     * Execute pipeline on convergence
     */
    async executePipeline(convergenceResult) {
        try {
            // Dynamic import to avoid circular dependencies
            const { PipelineExecutor } = await Promise.resolve().then(() => __importStar(require('../pipeline/executor')));
            console.log('[Daemon] Executing pipeline...');
            const executor = new PipelineExecutor({ verbose: true });
            const result = await executor.execute(convergenceResult);
            if (result.success) {
                console.log('[Daemon] Pipeline succeeded!');
                this.emit('pipeline_success', result);
            }
            else {
                console.error('[Daemon] Pipeline failed:', result.error);
                this.emit('pipeline_failed', result.error);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('[Daemon] Pipeline execution error:', errorMessage);
            this.emit('pipeline_failed', errorMessage);
        }
    }
}
exports.Daemon = Daemon;
// Singleton instance
let daemonInstance = null;
async function createDaemon(configPath) {
    if (!daemonInstance) {
        daemonInstance = new Daemon(configPath);
    }
    return daemonInstance;
}
function getDaemon() {
    return daemonInstance;
}
//# sourceMappingURL=daemon.js.map