/**
 * Generated from specs/deployment.dir/light.spec.md
 * DO NOT EDIT MANUALLY
 * Source: @speclang/deployment/light
 */
import type { PerformanceMetrics } from './modes';
/**
 * Light mode start command
 * @block:deploy/light @kind:entity
 */
export declare const LIGHT_MODE_START_COMMAND = "speclang init --mode=light";
/**
 * Light mode components
 * @block:deploy/light @kind:entity
 */
export interface LightModeComponents {
    openCodeServer: string;
    speclangPlugin: string;
}
/**
 * Light mode file watching configuration
 * @block:deploy/light @kind:entity
 */
export interface LightModeFileWatching {
    provider: 'OpenCode native';
    events: string[];
    latency: string;
}
/**
 * Light mode features
 * @block:deploy/light @kind:entity
 */
export interface LightModeFeatures {
    cascadeTriggering: boolean;
    convergenceDetection: boolean;
    perFileCommits: boolean;
    basicPipeline: boolean;
}
/**
 * Light mode limitations
 * @block:deploy/light @kind:entity
 */
export interface LightModeLimitations {
    queueVisibility: boolean;
    worktreeIsolation: boolean;
    agentControlCommands: boolean;
}
/**
 * Complete light mode definition
 * @block:deploy/light @kind:entity
 */
export interface LightMode {
    start: string;
    processes: number;
    components: LightModeComponents;
    fileWatching: LightModeFileWatching;
    features: LightModeFeatures;
    limitations: LightModeLimitations;
}
/**
 * Light mode settings (service configuration)
 * @block:deploy/light-config @kind:code
 */
export interface LightModeSettings {
    mode: 'light';
}
/**
 * Light mode performance metrics
 * @block:deploy/light-performance @kind:table
 */
export declare const LIGHT_MODE_PERFORMANCE: PerformanceMetrics;
/**
 * Default light mode definition
 */
export declare const LIGHT_MODE: LightMode;
/**
 * Light mode default config
 */
export declare const LIGHT_MODE_DEFAULT_CONFIG: LightModeSettings;
/**
 * Light mode service class
 */
export declare class LightModeService {
    private config;
    constructor(config?: LightModeSettings);
    /**
     * Get light mode definition
     */
    getMode(): LightMode;
    /**
     * Get performance metrics
     */
    getPerformance(): PerformanceMetrics;
    /**
     * Get current configuration
     */
    getConfig(): LightModeSettings;
    /**
     * Check if feature is available
     */
    hasFeature(feature: keyof LightModeFeatures): boolean;
    /**
     * Check if feature is limited
     */
    isLimited(limitation: keyof LightModeLimitations): boolean;
    /**
     * Start light mode service
     */
    start(): Promise<void>;
    /**
     * Stop light mode service
     */
    stop(): Promise<void>;
}
/**
 * Create a new light mode service
 */
export declare function createLightModeService(config?: LightModeSettings): LightModeService;
//# sourceMappingURL=light.d.ts.map