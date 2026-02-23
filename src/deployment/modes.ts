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
export const MODE_SELECTION: ModeSelection = {
  command: 'speclang init --mode=light|enterprise',
  light: {
    description: 'Minimal setup',
    processes: 1,
    fileWatcher: 'OpenCode native',
    features: ['basic cascade', 'convergence', 'commit'],
  },
  enterprise: {
    description: 'Full observability',
    processes: 2,
    fileWatcher: 'dedicated inotify daemon',
    features: ['queue visibility', 'worktrees', 'agent control', 'compliance'],
  },
};

/**
 * Default scale thresholds
 */
export const DEFAULT_SCALE_THRESHOLDS: ScaleThresholds = {
  files: 500,
  agents: 20,
};

/**
 * Default deployment configuration
 */
export const DEFAULT_DEPLOYMENT_CONFIG: DeploymentConfig = {
  mode: 'light',
  scaleThresholds: DEFAULT_SCALE_THRESHOLDS,
  light: {},
};

/**
 * Default mode recommendations
 */
export const MODE_RECOMMENDATION: ModeRecommendation = {
  useLightWhen: [
    'Solo developer',
    '<500 spec files',
    '<20 concurrent agents',
    'No compliance requirements',
    'Quick prototyping',
  ],
  useEnterpriseWhen: [
    'Multiple developers',
    '500+ spec files',
    '20+ concurrent agents',
    'Compliance requirements (SOC2, etc.)',
    'Need queue visibility',
    'Need worktree isolation',
    'Production/enterprise projects',
  ],
};

/**
 * Performance metrics by mode
 */
export const PERFORMANCE_METRICS: Record<DeploymentMode, PerformanceMetrics> = {
  light: {
    eventLatency: '~100ms',
    maxFiles: '~500',
    maxAgents: '~20',
    memory: '+50MB',
    processes: 1,
    startupTime: '~2s',
  },
  enterprise: {
    eventLatency: '~10ms',
    maxFiles: '10k+',
    maxAgents: '100+',
    memory: '+100MB',
    processes: 2,
    startupTime: '~3s',
  },
};

/**
 * Feature comparison between modes
 */
export const FEATURE_COMPARISON: Record<DeploymentMode, FeatureComparison> = {
  light: {
    fileWatching: 'OpenCode native',
    processes: 1,
    queueVisibility: false,
    worktreeIsolation: false,
    agentControl: 'Basic',
    scale: '<500 files',
    teamSize: 'Solo/small',
    compliance: false,
    setupComplexity: 'Low',
  },
  enterprise: {
    fileWatching: 'Dedicated inotify',
    processes: 2,
    queueVisibility: true,
    worktreeIsolation: true,
    agentControl: 'Full',
    scale: '500+ files',
    teamSize: 'Multiple teams',
    compliance: true,
    setupComplexity: 'Medium',
  },
};
