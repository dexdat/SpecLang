---
id: "@speclang/roadmap/poc/config-loader"
parent: ""@ref:specs/roadmap/poc"version: 0.1.0
layer: 2
short: "Configuration loading for POC daemon"
tags: [poc, config, configuration, yaml, loading]
---

# POC: Configuration Loader

Loads and validates configuration for the POC daemon.

## Purpose

- Load configuration from file or use defaults
- Provide typed configuration object
- Validate configuration values

## Configuration Format

### @poc/config/format

**Default Config File:** `.speclang/config.yaml`

```yaml
# POC Configuration
watch:
  directory: ./specs
  recursive: true
  debounce: 300
  ignore:
    - '*.tmp'
    - '*~'
    - '.git/**'
    - 'node_modules/**'

cascade:
  quiet_period: 5000
  max_depth: 10

output:
  code_directory: ./src
  use_symlinks: true

logging:
  level: info
  colors: true
```

## Implementation

### @poc/config/impl

```typescript
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import * as yaml from 'js-yaml';
import { POCConfig } from './types';

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  watch: {
    directory: './specs',
    recursive: true,
    debounce: 300,
    ignore: ['*.tmp', '*~', '.git/**', 'node_modules/**']
  },
  cascade: {
    quietPeriod: 5000,
    maxDepth: 10
  },
  output: {
    codeDirectory: './src',
    useSymlinks: true
  },
  logging: {
    level: 'info',
    colors: true
  }
};

/**
 * Configuration loader
 * Uses js-yaml for robust YAML parsing
 */
export class ConfigLoader {
  async load(configPath = '.speclang/config.yaml') {
    let config = { ...DEFAULT_CONFIG };
    
    if (existsSync(configPath)) {
      const content = await readFile(configPath, 'utf-8');
      const fileConfig = this.parseYaml(content);
      config = this.merge(config, fileConfig);
    }
    
    this.validate(config);
    return config;
  }
  
  /**
   * Parse YAML content using js-yaml
   * Falls back to default config on parse error
   */
  private parseYaml(content) {
    try {
      return yaml.load(content) || {};
    } catch (error) {
      console.warn('[Config] Failed to parse YAML:', error.message);
      return {};
    }
  }
  
  /**
   * Merge file config with defaults
   */
  private merge(defaults, file) {
    return {
      watch: { ...defaults.watch, ...file.watch },
      cascade: { ...defaults.cascade, ...file.cascade },
      output: { ...defaults.output, ...file.output },
      logging: { ...defaults.logging, ...file.logging }
    };
  }
  
  /**
   * Validate configuration values
   * @throws Error if configuration is invalid
   */
  private validate(config) {
    if (config.watch.debounce < 0 || config.watch.debounce > 10000) {
      throw new Error(`Invalid debounce: ${config.watch.debounce}`);
    }
    if (config.cascade.quietPeriod < 1000) {
      throw new Error(`Invalid quietPeriod: ${config.cascade.quietPeriod}`);
    }
  }
}

/**
 * Convenience function to load config
 */
export async function loadConfig(configPath) {
  const loader = new ConfigLoader();
  return loader.load(configPath);
}
```

## Usage

### @poc/config/usage

```typescript
const loader = new ConfigLoader();
const config = await loader.load();

console.log(config.watch.directory); // ./specs
console.log(config.watch.debounce);  // 300
```

## Dependencies

### @poc/config/deps

**js-yaml**: Required for YAML parsing
```json
{
  "dependencies": {
    "js-yaml": "^4.1.0"
  }
}
```
