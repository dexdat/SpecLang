/**
 * SPECLANG-GENERATED: Configuration for dynamic splitting
 * Source: @speclang/dynamic-split/strategy @block:split/config
 */

import * as fs from 'fs';
import * as path from 'path';
import type { SplitConfig, ProjectSplitConfig, AgentSplitConfig, SplitStrategy } from './types';
import { DEFAULT_SPLIT_CONFIG } from './types';

/**
 * Load split configuration from project.scl
 */
export class SplitConfigLoader {
  private configPath: string;
  private cache: ProjectSplitConfig | null = null;

  constructor(configPath: string = 'project.scl') {
    this.configPath = configPath;
  }

  /**
   * Load configuration from file
   */
  public load(): ProjectSplitConfig {
    if (this.cache) {
      return this.cache;
    }

    if (!fs.existsSync(this.configPath)) {
      // Return defaults if no config file
      return { split: DEFAULT_SPLIT_CONFIG };
    }

    try {
      const content = fs.readFileSync(this.configPath, 'utf-8');
      const config = this.parseConfig(content);
      this.cache = config;
      return config;
    } catch (error) {
      console.warn(`Failed to load config from ${this.configPath}:`, error);
      return { split: DEFAULT_SPLIT_CONFIG };
    }
  }

  /**
   * Parse YAML config content
   */
  private parseConfig(content: string): ProjectSplitConfig {
    // Simple YAML parsing for config
    const config: ProjectSplitConfig = { split: { ...DEFAULT_SPLIT_CONFIG } };
    
    // Extract split config
    const splitMatch = content.match(/config:\s*split:\s*([\s\S]*?)(?:\n\w|$)/);
    if (splitMatch) {
      const splitContent = splitMatch[1];
      
      const maxTokensMatch = splitContent.match(/max_tokens:\s*(\d+)/);
      if (maxTokensMatch) {
        config.split.max_tokens = parseInt(maxTokensMatch[1], 10);
      }

      const maxLinesMatch = splitContent.match(/max_lines:\s*(\d+)/);
      if (maxLinesMatch) {
        config.split.max_lines = parseInt(maxLinesMatch[1], 10);
      }

      const maxCharsMatch = splitContent.match(/max_chars:\s*(\d+)/);
      if (maxCharsMatch) {
        config.split.max_chars = parseInt(maxCharsMatch[1], 10);
      }

      const budgetOverheadMatch = splitContent.match(/budget_overhead:\s*(\d+)/);
      if (budgetOverheadMatch) {
        config.split.budget_overhead = parseInt(budgetOverheadMatch[1], 10);
      }

      const strategyMatch = splitContent.match(/strategy:\s*(\w+)/);
      if (strategyMatch) {
        config.split.strategy = strategyMatch[1] as SplitStrategy;
      }
    }

    // Extract agent overrides
    const agentsMatch = content.match(/agents:\s*([\s\S]*?)(?:\n\w|$)/);
    if (agentsMatch) {
      config.agents = this.parseAgentConfig(agentsMatch[1]);
    }

    return config;
  }

  /**
   * Parse agent-specific configuration
   */
  private parseAgentConfig(agentsContent: string): Record<string, AgentSplitConfig> {
    const agents: Record<string, AgentSplitConfig> = {};
    
    // Simple extraction of agent configs
    const agentMatches = Array.from(agentsContent.matchAll(/(\w+):\s*([\s\S]*?)(?=\n\s*\w+:|$)/g));
    
    for (const match of agentMatches) {
      const agentName = match[1];
      const agentConfig = match[2];
      
      const agent: AgentSplitConfig = {};
      
      const maxTokensMatch = agentConfig.match(/max_tokens:\s*(\d+)/);
      if (maxTokensMatch) {
        agent.max_tokens = parseInt(maxTokensMatch[1], 10);
      }

      const maxLinesMatch = agentConfig.match(/max_lines:\s*(\d+)/);
      if (maxLinesMatch) {
        agent.max_lines = parseInt(maxLinesMatch[1], 10);
      }

      const maxCharsMatch = agentConfig.match(/max_chars:\s*(\d+)/);
      if (maxCharsMatch) {
        agent.max_chars = parseInt(maxCharsMatch[1], 10);
      }

      const budgetOverheadMatch = agentConfig.match(/budget_overhead:\s*(\d+)/);
      if (budgetOverheadMatch) {
        agent.budget_overhead = parseInt(budgetOverheadMatch[1], 10);
      }

      const strategyMatch = agentConfig.match(/strategy:\s*(\w+)/);
      if (strategyMatch) {
        agent.strategy = strategyMatch[1] as SplitStrategy;
      }

      if (Object.keys(agent).length > 0) {
        agents[agentName] = agent;
      }
    }

    return agents;
  }

  /**
   * Get split config
   */
  public getSplitConfig(): SplitConfig {
    return this.load().split;
  }

  /**
   * Get agent-specific config
   */
  public getAgentConfig(agentName: string): AgentSplitConfig | undefined {
    return this.load().agents?.[agentName];
  }

  /**
   * Merge agent config with defaults
   */
  public getMergedConfig(agentName?: string): SplitConfig {
    const base = this.getSplitConfig();
    
    if (!agentName) {
      return base;
    }

    const agent = this.getAgentConfig(agentName);
    if (!agent) {
      return base;
    }

    return {
      max_tokens: agent.max_tokens ?? base.max_tokens,
      max_lines: agent.max_lines ?? base.max_lines,
      max_chars: agent.max_chars ?? base.max_chars,
      budget_overhead: agent.budget_overhead ?? base.budget_overhead,
      strategy: agent.strategy ?? base.strategy,
    };
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache = null;
  }
}

/**
 * Default config loader instance
 */
let defaultLoader: SplitConfigLoader | null = null;

/**
 * Get default config loader
 */
export function getConfigLoader(configPath?: string): SplitConfigLoader {
  if (!defaultLoader) {
    defaultLoader = new SplitConfigLoader(configPath || 'project.scl');
  }
  return defaultLoader;
}

/**
 * Load split config with defaults
 */
export function loadSplitConfig(configPath?: string): SplitConfig {
  const loader = new SplitConfigLoader(configPath || 'project.scl');
  return loader.getSplitConfig();
}

/**
 * Get agent-specific config
 */
export function getAgentConfig(agentName: string, configPath?: string): SplitConfig {
  const loader = new SplitConfigLoader(configPath || 'project.scl');
  return loader.getMergedConfig(agentName);
}
