"use strict";
/**
 * Generated from specs/deployment.spec.md
 * DO NOT EDIT MANUALLY
 * Source: @block:deploy/switching
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentModeSwitcher = void 0;
exports.createModeSwitcher = createModeSwitcher;
exports.recommendMode = recommendMode;
/**
 * Default mode switcher implementation
 * @block:deploy/switching @kind:operation
 */
class DeploymentModeSwitcher {
    currentMode;
    config;
    constructor(initialMode = 'light') {
        this.currentMode = initialMode;
        this.config = {
            mode: initialMode,
            scaleThresholds: { files: 500, agents: 20 },
            light: {},
        };
    }
    /**
     * Switch deployment mode
     * @block:deploy/switching @kind:operation
     * steps:
     *   1. Update .speclangrc with mode
     *   2. If switching to enterprise:
     *      - download speclangd binary
     *      - configure daemon port
     *      - start daemon
     *   3. If switching to light:
     *      - stop daemon
     *      - remove daemon config
     *   4. Restart OpenCode server
     * note: specs and database remain the same
     */
    async switchMode(mode) {
        if (mode === this.currentMode) {
            return {
                success: true,
                message: `Already in ${mode} mode`,
                config: this.config,
            };
        }
        try {
            // Step 1: Update config
            this.config.mode = mode;
            if (mode === 'enterprise') {
                // Step 2: Configure enterprise mode
                // - download speclangd binary
                // - configure daemon port
                // - start daemon
                this.config.enterprise = {
                    daemonPort: 8765,
                    queueSize: 1000,
                    worktrees: 3,
                    complianceLog: '.speclang/compliance.log',
                };
                delete this.config.light;
            }
            else {
                // Step 3: Switch to light mode
                // - stop daemon
                // - remove daemon config
                delete this.config.enterprise;
                this.config.light = {};
            }
            // Step 4: Update current mode
            this.currentMode = mode;
            return {
                success: true,
                message: `Successfully switched to ${mode} mode`,
                config: this.config,
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to switch mode: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Get current deployment mode
     */
    getCurrentMode() {
        return this.currentMode;
    }
    /**
     * Validate if mode can be applied
     */
    async validateMode(mode) {
        if (mode !== 'light' && mode !== 'enterprise') {
            return false;
        }
        return true;
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update configuration
     */
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
        if (updates.mode) {
            this.currentMode = updates.mode;
        }
    }
}
exports.DeploymentModeSwitcher = DeploymentModeSwitcher;
/**
 * Create a new mode switcher instance
 */
function createModeSwitcher(initialMode = 'light') {
    return new DeploymentModeSwitcher(initialMode);
}
/**
 * Get mode recommendation based on project size
 */
function recommendMode(fileCount, agentCount) {
    if (fileCount >= 500 || agentCount >= 20) {
        return 'enterprise';
    }
    return 'light';
}
//# sourceMappingURL=switcher.js.map