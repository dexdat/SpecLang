/**
 * Pipeline Configuration Management
 * 
 * SPECLANG-GENERATED: @speclang/pipeline
 * Generated from: @speclang/pipeline/build
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'yaml';
import { PipelineConfig } from './types';

const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  convergence: {
    quiet_period: 30,
    max_iterations: 100,
  },
  pipeline: {
    on_converge: [],
    on_success: [],
  },
  recovery: {
    max_attempts: 3,
    on_fail: [],
  },
};

export class PipelineConfigManager {
  private config: PipelineConfig;
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || 'build.yaml';
    this.config = { ...DEFAULT_PIPELINE_CONFIG };
  }

  async load(): Promise<PipelineConfig> {
    try {
      if (await fs.pathExists(this.configPath)) {
        const content = await fs.readFile(this.configPath, 'utf-8');
        const loaded = yaml.parse(content);
        this.config = this.mergeConfig(DEFAULT_PIPELINE_CONFIG, loaded);
        console.log(`[Pipeline] Loaded config from ${this.configPath}`);
      } else {
        console.log(`[Pipeline] No config file found at ${this.configPath}, using defaults`);
      }
    } catch (error) {
      console.warn(`[Pipeline] Failed to load config from ${this.configPath}:`, error);
    }
    return this.config;
  }

  private mergeConfig(defaults: PipelineConfig, loaded: Partial<PipelineConfig>): PipelineConfig {
    return {
      convergence: { ...defaults.convergence, ...loaded.convergence },
      pipeline: {
        on_converge: loaded.pipeline?.on_converge || defaults.pipeline.on_converge,
        on_success: loaded.pipeline?.on_success || defaults.pipeline.on_success,
      },
      recovery: {
        max_attempts: loaded.recovery?.max_attempts ?? defaults.recovery.max_attempts,
        on_fail: loaded.recovery?.on_fail || defaults.recovery.on_fail,
      },
    };
  }

  get(): PipelineConfig {
    return this.config;
  }

  getPipelineStages() {
    return this.config.pipeline.on_converge;
  }

  getSuccessActions() {
    return this.config.pipeline.on_success;
  }

  getRecoveryActions() {
    return this.config.recovery.on_fail;
  }

  getMaxRecoveryAttempts() {
    return this.config.recovery.max_attempts;
  }

  async save(config?: Partial<PipelineConfig>): Promise<void> {
    const toSave = config ? this.mergeConfig(DEFAULT_PIPELINE_CONFIG, config) : this.config;
    await fs.ensureFile(this.configPath);
    await fs.writeFile(this.configPath, yaml.stringify(toSave), 'utf-8');
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const stages = this.config.pipeline.on_converge;

    // Validate stage dependencies
    const stageNames = new Set(stages.map(s => s.name));
    for (const stage of stages) {
      if (stage.depends_on) {
        for (const dep of stage.depends_on) {
          if (!stageNames.has(dep)) {
            errors.push(`Stage '${stage.name}' depends on non-existent stage '${dep}'`);
          }
        }
      }
    }

    // Check for circular dependencies
    if (this.hasCircularDependency(stages)) {
      errors.push('Circular dependency detected in stage depends_on');
    }

    return { valid: errors.length === 0, errors };
  }

  private hasCircularDependency(stages: Array<{ name: string; depends_on?: string[] }>): boolean {
    const graph = new Map<string, string[]>();
    for (const stage of stages) {
      graph.set(stage.name, stage.depends_on || []);
    }

    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (node: string): boolean => {
      visited.add(node);
      recursionStack.add(node);

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    };

    for (const stage of stages) {
      if (!visited.has(stage.name)) {
        if (dfs(stage.name)) return true;
      }
    }

    return false;
  }
}

// Singleton instance
let configInstance: PipelineConfigManager | null = null;

export async function loadPipelineConfig(configPath?: string): Promise<PipelineConfigManager> {
  if (!configInstance) {
    configInstance = new PipelineConfigManager(configPath);
    await configInstance.load();
  }
  return configInstance;
}

export function getPipelineConfig(): PipelineConfigManager | null {
  return configInstance;
}
