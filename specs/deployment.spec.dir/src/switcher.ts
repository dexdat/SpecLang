/**
speclang-header lines:5
id: @specs/deployment
version: 1.0.0
layer: 5
 */

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
export class DeploymentModeSwitcher implements ModeSwitcher {
  private currentMode: DeploymentMode;
  private config: DeploymentConfig;

  constructor(initialMode: DeploymentMode = 'light') {
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
  async switchMode(mode: DeploymentMode): Promise<SwitchResult> {
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
      } else {
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
    } catch (error) {
      return {
        success: false,
        message: `Failed to switch mode: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get current deployment mode
   */
  getCurrentMode(): DeploymentMode {
    return this.currentMode;
  }

  /**
   * Validate if mode can be applied
   */
  async validateMode(mode: DeploymentMode): Promise<boolean> {
    if (mode !== 'light' && mode !== 'enterprise') {
      return false;
    }
    return true;
  }

  /**
   * Get current configuration
   */
  getConfig(): DeploymentConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<DeploymentConfig>): void {
    this.config = { ...this.config, ...updates };
    if (updates.mode) {
      this.currentMode = updates.mode;
    }
  }
}

/**
 * Create a new mode switcher instance
 */
export function createModeSwitcher(initialMode: DeploymentMode = 'light'): ModeSwitcher {
  return new DeploymentModeSwitcher(initialMode);
}

/**
 * Get mode recommendation based on project size
 */
export function recommendMode(fileCount: number, agentCount: number): DeploymentMode {
  if (fileCount >= 500 || agentCount >= 20) {
    return 'enterprise';
  }
  return 'light';
}
