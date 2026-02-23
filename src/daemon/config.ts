/**
 * Configuration management for speclangd
 * 
 * Generated from: @speclang/daemon/architecture
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'yaml';
import { DaemonConfig } from './types';

const DEFAULT_CONFIG: DaemonConfig = {
  watch: {
    paths: ['specs/', 'tests/', 'generated/'],
    ignore: ['.git/', 'node_modules/', 'generated/', '.speclang/', '*.log'],
    debounce: 100,
  },
  convergence: {
    quietPeriod: 30,  // seconds
    maxDepth: 100,
  },
  agentApi: {
    port: 7777,
    host: 'localhost',
  },
  locks: {
    dir: '.speclang/locks',
    timeout: 30,
  },
  logging: {
    level: 'info',
    file: '.speclang/daemon.log',
  },
};

export class Config {
  private config: DaemonConfig;
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || '.speclangrc';
    this.config = { ...DEFAULT_CONFIG };
  }

  async load(): Promise<DaemonConfig> {
    try {
      if (await fs.pathExists(this.configPath)) {
        const content = await fs.readFile(this.configPath, 'utf-8');
        const loaded = yaml.parse(content);
        this.config = this.mergeConfig(DEFAULT_CONFIG, loaded);
      }
    } catch (error) {
      console.warn(`Failed to load config from ${this.configPath}:`, error);
    }
    return this.config;
  }

  private mergeConfig(defaults: DaemonConfig, loaded: Partial<DaemonConfig>): DaemonConfig {
    return {
      watch: { ...defaults.watch, ...loaded.watch },
      convergence: { ...defaults.convergence, ...loaded.convergence },
      agentApi: { ...defaults.agentApi, ...loaded.agentApi },
      locks: { ...defaults.locks, ...loaded.locks },
      logging: { ...defaults.logging, ...loaded.logging },
    };
  }

  get(): DaemonConfig {
    return this.config;
  }

  getWatchPaths(): string[] {
    return this.config.watch.paths;
  }

  getIgnorePatterns(): string[] {
    return this.config.watch.ignore;
  }

  getQuietPeriod(): number {
    return this.config.convergence.quietPeriod;
  }

  getMaxDepth(): number {
    return this.config.convergence.maxDepth;
  }

  getLockDir(): string {
    return this.config.locks.dir;
  }

  getLockTimeout(): number {
    return this.config.locks.timeout;
  }

  async save(): Promise<void> {
    await fs.ensureFile(this.configPath);
    await fs.writeFile(this.configPath, yaml.stringify(this.config), 'utf-8');
  }
}

// Singleton instance
let configInstance: Config | null = null;

export async function loadConfig(configPath?: string): Promise<Config> {
  if (!configInstance) {
    configInstance = new Config(configPath);
    await configInstance.load();
  }
  return configInstance;
}

export function getConfig(): Config | null {
  return configInstance;
}
