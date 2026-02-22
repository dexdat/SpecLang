/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/config.spec.md
 * Blocks: @block:pipelineconfigmanager
 * Generated: 2026-02-22
 * 
 * Edit the spec, not this file.
 */

export * from './schema.js';
export * from './loader.js';
export * from './validator.js';

// Default configuration constants
export {
  DEFAULT_WATCHER_CONFIG,
  DEFAULT_SPLIT_CONFIG,
  DEFAULT_EMBEDDING_CONFIG,
  DEFAULT_DATABASE_CONFIG,
  DEFAULT_CASCADE_CONFIG,
} from './schema.js';

// Type exports
export type {
  ProjectConfig,
  ProjectMetadata,
  Language,
  WatcherConfig,
  IgnoreConfig,
  SplitConfig,
  SplitStrategy,
  EmbeddingConfig,
  DatabaseConfig,
  CascadeConfig,
  AgentsConfig,
  AgentConfig,
} from './schema.js';