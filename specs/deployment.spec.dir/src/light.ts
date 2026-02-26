/**
speclang-header lines:5
id: @specs/deployment
version: 1.0.0
layer: 5
 */

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
export const LIGHT_MODE_START_COMMAND = 'speclang init --mode=light';

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
export const LIGHT_MODE_PERFORMANCE: PerformanceMetrics = {
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
export const LIGHT_MODE: LightMode = {
  start: LIGHT_MODE_START_COMMAND,
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
export const LIGHT_MODE_DEFAULT_CONFIG: LightModeSettings = {
  mode: 'light',
};

/**
 * Light mode service class
 */
export class LightModeService {
  private config: LightModeSettings;

  constructor(config: LightModeSettings = LIGHT_MODE_DEFAULT_CONFIG) {
    this.config = config;
  }

  /**
   * Get light mode definition
   */
  getMode(): LightMode {
    return LIGHT_MODE;
  }

  /**
   * Get performance metrics
   */
  getPerformance(): PerformanceMetrics {
    return LIGHT_MODE_PERFORMANCE;
  }

  /**
   * Get current configuration
   */
  getConfig(): LightModeSettings {
    return { ...this.config };
  }

  /**
   * Check if feature is available
   */
  hasFeature(feature: keyof LightModeFeatures): boolean {
    return LIGHT_MODE.features[feature];
  }

  /**
   * Check if feature is limited
   */
  isLimited(limitation: keyof LightModeLimitations): boolean {
    return LIGHT_MODE.limitations[limitation];
  }

  /**
   * Start light mode service
   */
  async start(): Promise<void> {
    console.log('Starting Light Mode...');
    console.log(`  Command: ${LIGHT_MODE_START_COMMAND}`);
    console.log(`  Processes: ${LIGHT_MODE.processes}`);
    console.log(`  File watching: ${LIGHT_MODE.fileWatching.provider}`);
    console.log(`  Latency: ${LIGHT_MODE.fileWatching.latency}`);
  }

  /**
   * Stop light mode service
   */
  async stop(): Promise<void> {
    console.log('Stopping Light Mode...');
  }
}

/**
 * Create a new light mode service
 */
export function createLightModeService(config?: LightModeSettings): LightModeService {
  return new LightModeService(config);
}
