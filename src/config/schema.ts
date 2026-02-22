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
  version: string; // Semver
  description: string;
}

export type Language = 'typescript' | 'python' | 'go' | 'rust' | 'java' | 'javascript';

/**
 * Watcher Configuration
 * Controls which files trigger cascades and how changes are monitored
 */
export interface WatcherConfig {
  patterns: string[];  // glob patterns
  ignore: IgnoreConfig;
  debounce: number;    // milliseconds
}

export interface IgnoreConfig {
  uses: string;        // e.g., ".gitignore"
  plus: string[];      // additional patterns
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
  mode: string;       // SQLite journal mode (e.g., WAL)
  synchronous: string;
  cache_size: number;
  temp_store: string;
}

/**
 * Cascade Configuration
 * Controls cascade convergence and safety limits
 */
export interface CascadeConfig {
  quiet_period: number;   // seconds of no changes to trigger convergence
  max_depth: number;      // max cascade depth (safety)
  max_files: number;      // max files changed per cascade (safety)
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

// Default configurations
export const DEFAULT_WATCHER_CONFIG: WatcherConfig = {
  patterns: [
    "**/*.spec.{md,yaml,yml,scl}",
    "**/*.{go,ts,js,py,rs,java}.spec",
    "**/project.scl",
    "**/build.{scl,yaml}"
  ],
  ignore: {
    uses: ".gitignore",
    plus: [".speclang/", "*.log", "reports/", ".git/"]
  },
  debounce: 100
};

export const DEFAULT_SPLIT_CONFIG: SplitConfig = {
  max_tokens: 10000,
  max_lines: 800,
  max_chars: 60000,
  budget_overhead: 500,
  strategy: 'smart'
};

export const DEFAULT_EMBEDDING_CONFIG: EmbeddingConfig = {
  enabled: true,
  model: 'openai/text-embedding-3-small',
  dimensions: 1536,
  batch_size: 100
};

export const DEFAULT_DATABASE_CONFIG: DatabaseConfig = {
  mode: 'WAL',
  synchronous: 'NORMAL',
  cache_size: 10000,
  temp_store: 'MEMORY'
};

export const DEFAULT_CASCADE_CONFIG: CascadeConfig = {
  quiet_period: 30,
  max_depth: 50,
  max_files: 1000
};
