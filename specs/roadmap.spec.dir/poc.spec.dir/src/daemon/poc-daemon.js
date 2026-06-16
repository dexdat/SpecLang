"use strict";
/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/poc-daemon.spec.md
 * Generated: 2026-03-03T05:35:00.000Z
 *
 * Edit the spec, not this file.
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
exports.PocDaemon = void 0;
const simple_agent_1 = require("./simple-agent");
const event_router_1 = require("./event-router");
const poc_convergence_1 = require("./poc-convergence");
const poc_file_watcher_1 = require("./poc-file-watcher");
const poc_1 = require("../types/poc");
/**
 * POC Configuration
 */
const POC_CONFIG = {
    watch: {
        directory: './specs',
        debounce: 300, // ms
        ignore: ['*.tmp', '*~', '.git/**', 'node_modules/**']
    },
    convergence: {
        quietPeriod: 5000, // 5 seconds
        maxDepth: 10 // safety limit
    },
    output: {
        codeDir: './src',
        useSymlinks: true
    }
};
/**
 * Main entry point that wires all POC components together.
 */
class PocDaemon {
    watcher;
    router;
    agent;
    convergence;
    isRunning;
    constructor() {
        // Create components
        this.agent = new simple_agent_1.SimpleAgent();
        this.router = new event_router_1.EventRouter(this.agent);
        this.watcher = new poc_file_watcher_1.FileWatcher({
            watchDir: POC_CONFIG.watch.directory,
            ignorePatterns: POC_CONFIG.watch.ignore
        });
        this.convergence = new poc_convergence_1.ConvergenceDetector({
            quietPeriodMs: POC_CONFIG.convergence.quietPeriod
        });
        this.isRunning = false;
        // Wire events
        this.setupEventHandlers();
    }
    /**
     * Setup event handlers between components
     */
    setupEventHandlers() {
        // File change → Router → Agent
        this.watcher.on('change', (event) => {
            this.router.route(event).catch((error) => {
                console.error('[Daemon] Failed to route event:', error);
            });
        });
        // File change → Convergence tracker
        this.watcher.on('change', (event) => {
            this.convergence.onFileChange(event.path);
        });
        // Convergence detected
        this.convergence.on('converged', (event) => {
            console.log(`✅ Cascade converged (${event.duration}ms)`);
            console.log(`   Files changed: ${event.filesChanged.length}`);
        });
        // Error handling
        this.watcher.on('error', (error) => {
            console.error('[Watcher Error]', error);
        });
    }
    /**
     * Start the POC daemon
     */
    async start() {
        console.log('[Daemon] Starting speclangd POC...');
        try {
            // Start file watcher
            await this.watcher.watch(POC_CONFIG.watch.directory);
            // Process existing specs on startup
            await this.processExistingSpecs();
            this.isRunning = true;
            console.log('✅ speclangd running. Watching specs/');
            console.log('   Edit a spec file to see the cascade in action!');
        }
        catch (error) {
            throw new poc_1.POCError('WATCH_ERROR', `Failed to start daemon: ${error.message}`);
        }
    }
    /**
     * Process existing specs on startup
     * Ensures all specs have generated code
     */
    async processExistingSpecs() {
        console.log('[Daemon] Scanning existing specs...');
        try {
            const specFiles = await this.watcher.getSpecFiles();
            console.log(`[Daemon] Found: ${specFiles.length} specs`);
            // Process each spec
            for (const filePath of specFiles) {
                try {
                    await this.processSpecFile(filePath);
                }
                catch (error) {
                    console.error(`[Daemon] Failed to process ${filePath}:`, error);
                    // Continue with other specs
                }
            }
            console.log('[Daemon] ✅ Initial processing complete');
        }
        catch (error) {
            console.warn('[Daemon] Warning: Could not scan existing specs:', error);
        }
    }
    /**
     * Process a single spec file
     */
    async processSpecFile(filePath) {
        // Check if already up to date
        if (await this.isUpToDate(filePath)) {
            console.log(`[Daemon]   ${filePath} → already up to date`);
            return;
        }
        console.log(`[Daemon]   ${filePath} → processing...`);
        // Create file event
        const event = {
            type: 'modified',
            path: filePath,
            timestamp: Date.now()
        };
        // Route to agent
        await this.router.route(event);
    }
    /**
     * Check if spec is up to date
     */
    async isUpToDate(filePath) {
        const { stat, readdir } = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const { join, dirname } = await Promise.resolve().then(() => __importStar(require('path')));
        try {
            const specStat = await stat(filePath);
            const generatedDir = this.getGeneratedPath(filePath);
            // Check if generated directory exists
            let dirStat;
            try {
                dirStat = await stat(generatedDir);
            }
            catch {
                return false; // No generated code directory
            }
            if (!dirStat || !dirStat.isDirectory()) {
                return false;
            }
            // Read all generated files and find the newest
            const files = await readdir(generatedDir);
            if (files.length === 0) {
                return false; // Directory exists but empty
            }
            // Find the most recently modified generated file
            let newestMtime = 0;
            for (const file of files) {
                if (file.endsWith('.ts')) {
                    const fileStat = await stat(join(generatedDir, file));
                    if (fileStat.mtimeMs > newestMtime) {
                        newestMtime = fileStat.mtimeMs;
                    }
                }
            }
            if (newestMtime === 0) {
                return false; // No TypeScript files found
            }
            // Check if generated code is newer than spec
            return newestMtime >= specStat.mtimeMs;
        }
        catch {
            return false;
        }
    }
    /**
     * Convert spec path to generated path
     */
    getGeneratedPath(specPath) {
        // specs/hello.spec.md → specs/hello.spec.dir/src/
        return specPath.replace('.spec.md', '.spec.dir/src');
    }
    /**
     * Stop the daemon
     */
    async stop() {
        if (!this.isRunning)
            return;
        await this.watcher.stop();
        this.convergence.stop();
        this.isRunning = false;
        console.log('[Daemon] speclangd stopped');
    }
    /**
     * Check if daemon is running
     */
    getIsRunning() {
        return this.isRunning;
    }
}
exports.PocDaemon = PocDaemon;
//# sourceMappingURL=poc-daemon.js.map