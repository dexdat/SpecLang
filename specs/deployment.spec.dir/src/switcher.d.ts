/**
 * Generated from specs/deployment.spec.md
 * DO NOT EDIT MANUALLY
 * Source: @block:deploy/switching
 */
import type { DeploymentMode, DeploymentConfig } from './modes';
/**
 * Mode switch result
 */
export interface SwitchResult {
    success: boolean;
    message: string;
    config?: DeploymentConfig;
}
/**
 * Mode switcher interface
 */
export interface ModeSwitcher {
    /**
     * Switch to a different deployment mode
     */
    switchMode(mode: DeploymentMode): Promise<SwitchResult>;
    /**
     * Get current mode
     */
    getCurrentMode(): DeploymentMode;
    /**
     * Validate mode can be applied
     */
    validateMode(mode: DeploymentMode): Promise<boolean>;
}
/**
 * Default mode switcher implementation
 * @block:deploy/switching @kind:operation
 */
export declare class DeploymentModeSwitcher implements ModeSwitcher {
    private currentMode;
    private config;
    constructor(initialMode?: DeploymentMode);
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
    switchMode(mode: DeploymentMode): Promise<SwitchResult>;
    /**
     * Get current deployment mode
     */
    getCurrentMode(): DeploymentMode;
    /**
     * Validate if mode can be applied
     */
    validateMode(mode: DeploymentMode): Promise<boolean>;
    /**
     * Get current configuration
     */
    getConfig(): DeploymentConfig;
    /**
     * Update configuration
     */
    updateConfig(updates: Partial<DeploymentConfig>): void;
}
/**
 * Create a new mode switcher instance
 */
export declare function createModeSwitcher(initialMode?: DeploymentMode): ModeSwitcher;
/**
 * Get mode recommendation based on project size
 */
export declare function recommendMode(fileCount: number, agentCount: number): DeploymentMode;
//# sourceMappingURL=switcher.d.ts.map