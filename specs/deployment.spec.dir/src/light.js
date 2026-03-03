"use strict";
/**
 * Generated from specs/deployment.dir/light.spec.md
 * DO NOT EDIT MANUALLY
 * Source: @speclang/deployment/light
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LightModeService = exports.LIGHT_MODE_DEFAULT_CONFIG = exports.LIGHT_MODE = exports.LIGHT_MODE_PERFORMANCE = exports.LIGHT_MODE_START_COMMAND = void 0;
exports.createLightModeService = createLightModeService;
/**
 * Light mode start command
 * @block:deploy/light @kind:entity
 */
exports.LIGHT_MODE_START_COMMAND = 'speclang init --mode=light';
/**
 * Light mode performance metrics
 * @block:deploy/light-performance @kind:table
 */
exports.LIGHT_MODE_PERFORMANCE = {
    eventLatency: '~100ms',
    maxFiles: '~500',
    maxAgents: '~20',
    memory: '+50MB',
    processes: 1,
    startupTime: '~2s',
};
/**
 * Default light mode definition
 */
exports.LIGHT_MODE = {
    start: exports.LIGHT_MODE_START_COMMAND,
    processes: 1,
    components: {
        openCodeServer: 'opencode serve --mode=build',
        speclangPlugin: 'Speclang plugin (hooks into OpenCode events)',
    },
    fileWatching: {
        provider: 'OpenCode native',
        events: ['file.edited', 'agent.finished', 'session.idle'],
        latency: '~100ms',
    },
    features: {
        cascadeTriggering: true,
        convergenceDetection: true,
        perFileCommits: true,
        basicPipeline: true,
    },
    limitations: {
        queueVisibility: false,
        worktreeIsolation: false,
        agentControlCommands: false,
    },
};
/**
 * Light mode default config
 */
exports.LIGHT_MODE_DEFAULT_CONFIG = {
    mode: 'light',
};
/**
 * Light mode service class
 */
class LightModeService {
    config;
    constructor(config = exports.LIGHT_MODE_DEFAULT_CONFIG) {
        this.config = config;
    }
    /**
     * Get light mode definition
     */
    getMode() {
        return exports.LIGHT_MODE;
    }
    /**
     * Get performance metrics
     */
    getPerformance() {
        return exports.LIGHT_MODE_PERFORMANCE;
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
        return exports.LIGHT_MODE.features[feature];
    }
    /**
     * Check if feature is limited
     */
    isLimited(limitation) {
        return exports.LIGHT_MODE.limitations[limitation];
    }
    /**
     * Start light mode service
     */
    async start() {
        console.log('Starting Light Mode...');
        console.log(`  Command: ${exports.LIGHT_MODE_START_COMMAND}`);
        console.log(`  Processes: ${exports.LIGHT_MODE.processes}`);
        console.log(`  File watching: ${exports.LIGHT_MODE.fileWatching.provider}`);
        console.log(`  Latency: ${exports.LIGHT_MODE.fileWatching.latency}`);
    }
    /**
     * Stop light mode service
     */
    async stop() {
        console.log('Stopping Light Mode...');
    }
}
exports.LightModeService = LightModeService;
/**
 * Create a new light mode service
 */
function createLightModeService(config) {
    return new LightModeService(config);
}
//# sourceMappingURL=light.js.map