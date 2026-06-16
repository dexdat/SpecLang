# speclang-header lines:9
id: "@speclang/config/impl"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [config, implementation, typescript]
target: src/config/
short: "Config module implementation files"
---

# Config Module Implementation

**Source Location:** `specs/config.spec.dir/src/`

## Overview

This directory contains the TypeScript implementation files for the SpecLang configuration system. These files are generated from the configuration schema specs and provide runtime type safety and validation.

## Files

### schema.ts

Type definitions for the configuration schema including:
- `ProjectConfig` - Main configuration interface
- `ProjectMetadata` - Project metadata (name, version, description)
- `WatcherConfig` - File watcher configuration
- `SplitConfig` - Spec splitting configuration
- `EmbeddingConfig` - Vector embedding configuration
- `DatabaseConfig` - SQLite database configuration
- `CascadeConfig` - Cascade system configuration
- `AgentsConfig` - Per-agent configuration

### loader.ts

Configuration loading utilities:
- `loadConfig()` - Load configuration from YAML file
- `getDefaultConfig()` - Get default configuration
- `mergeWithDefaults()` - Merge user config with defaults

### validator.ts

Configuration validation:
- `validateConfig()` - Validate configuration against schema
- `ValidationError` - Error details (path, message)
- `ValidationResult` - Validation result (valid, errors)

### index.ts

Main exports for the config module.

## Generated

These files are auto-generated from `specs/config.spec.dir/schema.spec.md`. Edit the spec, not these files.

## @block:config/structure @kind:code

```typescript
// Core configuration structure
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
```
