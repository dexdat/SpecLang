/**
 * Generated from specs/deployment.dir/enterprise.spec.md
 * DO NOT EDIT MANUALLY
 * Source: @speclang/deployment/enterprise
 */
import type { PerformanceMetrics, EnterpriseSettings } from './modes';
/**
 * Enterprise mode start command
 * @block:deploy/enterprise @kind:entity
 */
export declare const ENTERPRISE_MODE_START_COMMAND = "speclang init --mode=enterprise";
/**
 * Enterprise mode components
 * @block:deploy/enterprise @kind:entity
 */
export interface EnterpriseModeComponents {
    openCodeServer: string;
    speclangPlugin: string;
    speclangdDaemon: string;
}
/**
 * Enterprise mode file watching configuration
 * @block:deploy/enterprise @kind:entity
 */
export interface EnterpriseModeFileWatching {
    provider: 'speclangd (inotify)';
    events: string;
    latency: string;
}
/**
 * Enterprise mode extra features
 * @block:deploy/enterprise @kind:entity
 */
export interface EnterpriseModeFeatures {
    queueVisibility: boolean;
    worktreeIsolation: boolean;
    agentControl: boolean;
    complianceLogging: boolean;
    teamCoordination: boolean;
}
/**
 * Complete enterprise mode definition
 * @block:deploy/enterprise @kind:entity
 */
export interface EnterpriseMode {
    start: string;
    processes: number;
    components: EnterpriseModeComponents;
    fileWatching: EnterpriseModeFileWatching;
    extraFeatures: EnterpriseModeFeatures;
}
/**
 * Enterprise mode settings (service configuration)
 * @block:deploy/enterprise-config @kind:code
 */
export interface EnterpriseModeSettings {
    mode: 'enterprise';
    enterprise: EnterpriseSettings;
}
/**
 * Enterprise mode performance metrics
 * @block:deploy/enterprise-performance @kind:table
 */
export declare const ENTERPRISE_MODE_PERFORMANCE: PerformanceMetrics;
/**
 * Default enterprise mode definition
 */
export declare const ENTERPRISE_MODE: EnterpriseMode;
/**
 * Default enterprise mode config
 */
export declare const ENTERPRISE_MODE_DEFAULT_CONFIG: EnterpriseModeSettings;
/**
 * Enterprise mode service class
 */
export declare class EnterpriseModeService {
    private config;
    private daemonRunning;
    constructor(config?: EnterpriseModeSettings);
    /**
     * Get enterprise mode definition
     */
    getMode(): EnterpriseMode;
    /**
     * Get performance metrics
     */
    getPerformance(): PerformanceMetrics;
    /**
     * Get current configuration
     */
    getConfig(): EnterpriseModeSettings;
    /**
     * Check if feature is available
     */
    hasFeature(feature: keyof EnterpriseModeFeatures): boolean;
    /**
     * Get daemon port
     */
    getDaemonPort(): number;
    /**
     * Get queue size
     */
    getQueueSize(): number;
    /**
     * Get max worktrees
     */
    getMaxWorktrees(): number;
    /**
     * Get compliance log path
     */
    getComplianceLogPath(): string;
    /**
     * Check if daemon is running
     */
    isDaemonRunning(): boolean;
    /**
     * Start enterprise mode service
     */
    start(): Promise<void>;
    /**
     * Stop enterprise mode service
     */
    stop(): Promise<void>;
    /**
     * Get queue status (enterprise feature)
     */
    getQueueStatus(): Promise<{
        size: number;
        maxSize: number;
    }>;
    /**
     * Get worktree status (enterprise feature)
     */
    getWorktreeStatus(): Promise<{
        active: number;
        max: number;
    }>;
}
/**
 * Create a new enterprise mode service
 */
export declare function createEnterpriseModeService(config?: EnterpriseModeSettings): EnterpriseModeService;
//# sourceMappingURL=enterprise.d.ts.map