/**
 * SPECLANG-GENERATED: Configuration for dynamic splitting
 * Source: @speclang/dynamic-split/strategy @block:split/config
 */
import type { SplitConfig, ProjectSplitConfig, AgentSplitConfig } from './types';
/**
 * Load split configuration from project.scl
 */
export declare class SplitConfigLoader {
    private configPath;
    private cache;
    constructor(configPath?: string);
    /**
     * Load configuration from file
     */
    load(): ProjectSplitConfig;
    /**
     * Parse YAML config content
     */
    private parseConfig;
    /**
     * Parse agent-specific configuration
     */
    private parseAgentConfig;
    /**
     * Get split config
     */
    getSplitConfig(): SplitConfig;
    /**
     * Get agent-specific config
     */
    getAgentConfig(agentName: string): AgentSplitConfig | undefined;
    /**
     * Merge agent config with defaults
     */
    getMergedConfig(agentName?: string): SplitConfig;
    /**
     * Clear cache
     */
    clearCache(): void;
}
/**
 * Get default config loader
 */
export declare function getConfigLoader(configPath?: string): SplitConfigLoader;
/**
 * Load split config with defaults
 */
export declare function loadSplitConfig(configPath?: string): SplitConfig;
/**
 * Get agent-specific config
 */
export declare function getAgentConfig(agentName: string, configPath?: string): SplitConfig;
//# sourceMappingURL=config.d.ts.map