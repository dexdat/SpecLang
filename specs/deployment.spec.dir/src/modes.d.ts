/**
 * Generated from specs/deployment.spec.md
 * DO NOT EDIT MANUALLY
 * Source: @block:deploy/selection, @block:deploy/recommend
 */
/**
 * Deployment mode types
 */
export type DeploymentMode = 'light' | 'enterprise';
/**
 * Light mode configuration
 * @block:deploy/selection @kind:entity
 */
export interface LightModeConfig {
    description: string;
    processes: number;
    fileWatcher: 'OpenCode native';
    features: string[];
}
/**
 * Enterprise mode configuration
 * @block:deploy/selection @kind:entity
 */
export interface EnterpriseModeConfig {
    description: string;
    processes: number;
    fileWatcher: 'dedicated inotify daemon';
    features: string[];
}
/**
 * Mode selection definition
 * @block:deploy/selection @kind:entity
 */
export interface ModeSelection {
    command: string;
    light: LightModeConfig;
    enterprise: EnterpriseModeConfig;
}
/**
 * Scale thresholds for mode recommendation
 * @block:deploy/config @kind:code
 */
export interface ScaleThresholds {
    files: number;
    agents: number;
}
/**
 * Enterprise mode settings
 * @block:deploy/config @kind:code
 */
export interface EnterpriseSettings {
    daemonPort: number;
    queueSize: number;
    worktrees: number;
    complianceLog: string;
}
/**
 * Full deployment configuration
 * @block:deploy/config @kind:code
 */
export interface DeploymentConfig {
    mode: DeploymentMode;
    scaleThresholds: ScaleThresholds;
    enterprise?: EnterpriseSettings;
    light?: Record<string, never>;
}
/**
 * Mode recommendation criteria
 * @block:deploy/recommend @kind:entity
 */
export interface ModeRecommendation {
    useLightWhen: string[];
    useEnterpriseWhen: string[];
}
/**
 * Performance metrics
 * @block:deploy/performance @kind:table
 */
export interface PerformanceMetrics {
    eventLatency: string;
    maxFiles: string;
    maxAgents: string;
    memory: string;
    processes: number;
    startupTime: string;
}
/**
 * Feature comparison between modes
 * @block:deploy/comparison @kind:table
 */
export interface FeatureComparison {
    fileWatching: string;
    processes: number;
    queueVisibility: boolean;
    worktreeIsolation: boolean;
    agentControl: string;
    scale: string;
    teamSize: string;
    compliance: boolean;
    setupComplexity: string;
}
/**
 * Default mode selections
 */
export declare const MODE_SELECTION: ModeSelection;
/**
 * Default scale thresholds
 */
export declare const DEFAULT_SCALE_THRESHOLDS: ScaleThresholds;
/**
 * Default deployment configuration
 */
export declare const DEFAULT_DEPLOYMENT_CONFIG: DeploymentConfig;
/**
 * Default mode recommendations
 */
export declare const MODE_RECOMMENDATION: ModeRecommendation;
/**
 * Performance metrics by mode
 */
export declare const PERFORMANCE_METRICS: Record<DeploymentMode, PerformanceMetrics>;
/**
 * Feature comparison between modes
 */
export declare const FEATURE_COMPARISON: Record<DeploymentMode, FeatureComparison>;
//# sourceMappingURL=modes.d.ts.map