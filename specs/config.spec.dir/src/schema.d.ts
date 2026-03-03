/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/config.dir/schema.spec.md
 * Blocks: @block:config/structure, @block:config/watcher, @block:config/split, @block:config/embeddings, @block:config/database, @block:config/cascade, @block:config/agents
 * Generated: 2026-02-22
 *
 * Edit the spec, not this file.
 */
/**
 * Configuration Schema Type Definitions
 *
 * These interfaces mirror the configuration schema defined in
 * specs/config.dir/schema.spec.md
 */
/**
 * Top-level project configuration structure
 */
export interface ProjectConfig {
    metadata: ProjectMetadata;
    targets: Language[];
    config: {
        watcher: WatcherConfig;
        split: SplitConfig;
        embeddings: EmbeddingConfig;
        database: DatabaseConfig;
        cascade: CascadeConfig;
        agents: AgentsConfig;
    };
}
export interface ProjectMetadata {
    name: string;
    version: string;
    description: string;
}
export type Language = 'typescript' | 'python' | 'go' | 'rust' | 'java' | 'javascript';
/**
 * Watcher Configuration
 * Controls which files trigger cascades and how changes are monitored
 */
export interface WatcherConfig {
    patterns: string[];
    ignore: IgnoreConfig;
    debounce: number;
}
export interface IgnoreConfig {
    uses: string;
    plus: string[];
}
/**
 * Split Configuration
 * Controls how large specs are split into manageable chunks
 */
export interface SplitConfig {
    max_tokens: number;
    max_lines: number;
    max_chars: number;
    budget_overhead: number;
    strategy: SplitStrategy;
}
export type SplitStrategy = 'smart' | 'by-section' | 'by-token';
/**
 * Embedding Configuration
 * Controls vector embedding generation for semantic search
 */
export interface EmbeddingConfig {
    enabled: boolean;
    model: string;
    dimensions: number;
    batch_size: number;
}
/**
 * Database Configuration
 * SQLite configuration for spec storage
 */
export interface DatabaseConfig {
    mode: string;
    synchronous: string;
    cache_size: number;
    temp_store: string;
}
/**
 * Cascade Configuration
 * Controls cascade convergence and safety limits
 */
export interface CascadeConfig {
    quiet_period: number;
    max_depth: number;
    max_files: number;
}
/**
 * Agents Configuration
 * Per-agent overrides for code generation
 */
export interface AgentsConfig {
    [agentName: string]: AgentConfig;
}
export interface AgentConfig {
    max_tokens?: number;
    max_lines?: number;
    max_chars?: number;
    model?: string;
    temperature?: number;
}
export declare const DEFAULT_WATCHER_CONFIG: WatcherConfig;
export declare const DEFAULT_SPLIT_CONFIG: SplitConfig;
export declare const DEFAULT_EMBEDDING_CONFIG: EmbeddingConfig;
export declare const DEFAULT_DATABASE_CONFIG: DatabaseConfig;
export declare const DEFAULT_CASCADE_CONFIG: CascadeConfig;
//# sourceMappingURL=schema.d.ts.map