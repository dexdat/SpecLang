/**
 * SPECLANG-GENERATED - Do not edit directly
 * 
 * Source: specs/config.dir/schema.spec.md
 * Blocks: @block:config/structure
 * Generated: 2026-02-22
 * 
 * Edit the spec, not this file.
 */

import type { ProjectConfig } from './schema.js';

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate configuration against schema
 */
export function validateConfig(config: ProjectConfig): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate metadata
  if (!config.metadata.name || typeof config.metadata.name !== 'string') {
    errors.push({ path: 'metadata.name', message: 'Name must be a non-empty string' });
  }
  if (!config.metadata.version || typeof config.metadata.version !== 'string') {
    errors.push({ path: 'metadata.version', message: 'Version must be a string' });
  }
  if (!config.metadata.description || typeof config.metadata.description !== 'string') {
    errors.push({ path: 'metadata.description', message: 'Description must be a string' });
  }

  // Validate targets
  if (!Array.isArray(config.targets)) {
    errors.push({ path: 'targets', message: 'Targets must be an array' });
  } else {
    const validLanguages = ['typescript', 'python', 'go', 'rust', 'java', 'javascript'];
    for (let i = 0; i < config.targets.length; i++) {
      if (!validLanguages.includes(config.targets[i])) {
        errors.push({ path: `targets[${i}]`, message: `Invalid language: ${config.targets[i]}` });
      }
    }
  }

  // Validate watcher config
  if (!Array.isArray(config.config.watcher.patterns)) {
    errors.push({ path: 'config.watcher.patterns', message: 'Patterns must be an array' });
  }
  if (typeof config.config.watcher.debounce !== 'number' || config.config.watcher.debounce < 0) {
    errors.push({ path: 'config.watcher.debounce', message: 'Debounce must be a non-negative number' });
  }

  // Validate split config
  if (typeof config.config.split.max_tokens !== 'number' || config.config.split.max_tokens <= 0) {
    errors.push({ path: 'config.split.max_tokens', message: 'max_tokens must be positive' });
  }
  if (typeof config.config.split.max_lines !== 'number' || config.config.split.max_lines <= 0) {
    errors.push({ path: 'config.split.max_lines', message: 'max_lines must be positive' });
  }
  if (typeof config.config.split.max_chars !== 'number' || config.config.split.max_chars <= 0) {
    errors.push({ path: 'config.split.max_chars', message: 'max_chars must be positive' });
  }
  const validStrategies = ['smart', 'by-section', 'by-token'];
  if (!validStrategies.includes(config.config.split.strategy)) {
    errors.push({ path: 'config.split.strategy', message: `Strategy must be one of: ${validStrategies.join(', ')}` });
  }

  // Validate embedding config
  if (typeof config.config.embeddings.enabled !== 'boolean') {
    errors.push({ path: 'config.embeddings.enabled', message: 'enabled must be boolean' });
  }
  if (typeof config.config.embeddings.model !== 'string') {
    errors.push({ path: 'config.embeddings.model', message: 'model must be string' });
  }
  if (typeof config.config.embeddings.dimensions !== 'number' || config.config.embeddings.dimensions <= 0) {
    errors.push({ path: 'config.embeddings.dimensions', message: 'dimensions must be positive' });
  }
  if (typeof config.config.embeddings.batch_size !== 'number' || config.config.embeddings.batch_size <= 0) {
    errors.push({ path: 'config.embeddings.batch_size', message: 'batch_size must be positive' });
  }

  // Validate database config
  const validModes = ['WAL', 'DELETE', 'TRUNCATE', 'PERSIST', 'MEMORY', 'OFF'];
  if (!validModes.includes(config.config.database.mode)) {
    errors.push({ path: 'config.database.mode', message: `mode must be one of: ${validModes.join(', ')}` });
  }
  const validSync = ['NORMAL', 'FULL', 'OFF'];
  if (!validSync.includes(config.config.database.synchronous)) {
    errors.push({ path: 'config.database.synchronous', message: `synchronous must be one of: ${validSync.join(', ')}` });
  }
  if (typeof config.config.database.cache_size !== 'number' || config.config.database.cache_size <= 0) {
    errors.push({ path: 'config.database.cache_size', message: 'cache_size must be positive' });
  }
  const validTempStore = ['MEMORY', 'FILE'];
  if (!validTempStore.includes(config.config.database.temp_store)) {
    errors.push({ path: 'config.database.temp_store', message: `temp_store must be one of: ${validTempStore.join(', ')}` });
  }

  // Validate cascade config
  if (typeof config.config.cascade.quiet_period !== 'number' || config.config.cascade.quiet_period <= 0) {
    errors.push({ path: 'config.cascade.quiet_period', message: 'quiet_period must be positive' });
  }
  if (typeof config.config.cascade.max_depth !== 'number' || config.config.cascade.max_depth <= 0) {
    errors.push({ path: 'config.cascade.max_depth', message: 'max_depth must be positive' });
  }
  if (typeof config.config.cascade.max_files !== 'number' || config.config.cascade.max_files <= 0) {
    errors.push({ path: 'config.cascade.max_files', message: 'max_files must be positive' });
  }

  // Validate agents config (optional)
  if (config.config.agents && typeof config.config.agents !== 'object') {
    errors.push({ path: 'config.agents', message: 'agents must be an object' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}