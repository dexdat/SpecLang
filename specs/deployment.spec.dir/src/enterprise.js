"use strict";
/**
 * Generated from specs/deployment.dir/enterprise.spec.md
 * DO NOT EDIT MANUALLY
 * Source: @speclang/deployment/enterprise
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnterpriseModeService = exports.ENTERPRISE_MODE_DEFAULT_CONFIG = exports.ENTERPRISE_MODE = exports.ENTERPRISE_MODE_PERFORMANCE = exports.ENTERPRISE_MODE_START_COMMAND = void 0;
exports.createEnterpriseModeService = createEnterpriseModeService;
/**
 * Enterprise mode start command
 * @block:deploy/enterprise @kind:entity
 */
exports.ENTERPRISE_MODE_START_COMMAND = 'speclang init --mode=enterprise';
/**
 * Enterprise mode performance metrics
 * @block:deploy/enterprise-performance @kind:table
 */
exports.ENTERPRISE_MODE_PERFORMANCE = {
    eventLatency: '~10ms',
    maxFiles: '10k+',
    maxAgents: '100+',
    memory: '+100MB',
    processes: 2,
    startupTime: '~3s',
};
/**
 * Default enterprise mode definition
 */
exports.ENTERPRISE_MODE = {
    start: exports.ENTERPRISE_MODE_START_COMMAND,
    processes: 2,
    components: {
        openCodeServer: 'opencode serve --mode=build',
        speclangPlugin: 'Speclang plugin',
        speclangdDaemon: 'speclangd MCP daemon',
    },
    fileWatching: {
        provider: 'speclangd (inotify)',
        events: 'HTTP/SSE stream',
        latency: '~10ms',
    },
    extraFeatures: {
        queueVisibility: true,
        worktreeIsolation: true,
        agentControl: true,
        complianceLogging: true,
        teamCoordination: true,
    },
};
/**
 * Default enterprise mode config
 */
exports.ENTERPRISE_MODE_DEFAULT_CONFIG = {
    mode: 'enterprise',
    enterprise: {
        daemonPort: 8765,
        queueSize: 1000,
        worktrees: 3,
        complianceLog: '.speclang/compliance.log',
    },
};
/**
 * Enterprise mode service class
 */
class EnterpriseModeService {
    config;
    daemonRunning = false;
    constructor(config = exports.ENTERPRISE_MODE_DEFAULT_CONFIG) {
        this.config = config;
    }
    /**
     * Get enterprise mode definition
     */
    getMode() {
        return exports.ENTERPRISE_MODE;
    }
    /**
     * Get performance metrics
     */
    getPerformance() {
        return exports.ENTERPRISE_MODE_PERFORMANCE;
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Check if feature is available
     */
    hasFeature(feature) {
        return exports.ENTERPRISE_MODE.extraFeatures[feature];
    }
    /**
     * Get daemon port
     */
    getDaemonPort() {
        return this.config.enterprise.daemonPort;
    }
    /**
     * Get queue size
     */
    getQueueSize() {
        return this.config.enterprise.queueSize;
    }
    /**
     * Get max worktrees
     */
    getMaxWorktrees() {
        return this.config.enterprise.worktrees;
    }
    /**
     * Get compliance log path
     */
    getComplianceLogPath() {
        return this.config.enterprise.complianceLog;
    }
    /**
     * Check if daemon is running
     */
    isDaemonRunning() {
        return this.daemonRunning;
    }
    /**
     * Start enterprise mode service
     */
    async start() {
        console.log('Starting Enterprise Mode...');
        console.log(`  Command: ${exports.ENTERPRISE_MODE_START_COMMAND}`);
        console.log(`  Processes: ${exports.ENTERPRISE_MODE.processes}`);
        console.log(`  Daemon port: ${this.config.enterprise.daemonPort}`);
        console.log(`  Queue size: ${this.config.enterprise.queueSize}`);
        console.log(`  Max worktrees: ${this.config.enterprise.worktrees}`);
        console.log(`  File watching: ${exports.ENTERPRISE_MODE.fileWatching.provider}`);
        console.log(`  Latency: ${exports.ENTERPRISE_MODE.fileWatching.latency}`);
        this.daemonRunning = true;
    }
    /**
     * Stop enterprise mode service
     */
    async stop() {
        console.log('Stopping Enterprise Mode...');
        this.daemonRunning = false;
    }
    /**
     * Get queue status (enterprise feature)
     */
    async getQueueStatus() {
        return {
            size: 0,
            maxSize: this.config.enterprise.queueSize,
        };
    }
    /**
     * Get worktree status (enterprise feature)
     */
    async getWorktreeStatus() {
        return {
            active: 0,
            max: this.config.enterprise.worktrees,
        };
    }
}
exports.EnterpriseModeService = EnterpriseModeService;
/**
 * Create a new enterprise mode service
 */
function createEnterpriseModeService(config) {
    return new EnterpriseModeService(config);
}
//# sourceMappingURL=enterprise.js.map