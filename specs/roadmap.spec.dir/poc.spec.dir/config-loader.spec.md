# speclang-header lines:15
id: "@speclang/roadmap/poc/config-loader"
parent: "@ref:specs/roadmap/poc"
version: 0.1.0
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
import { join } from 'path';

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
 */
export class ConfigLoader {
  async load(configPath = '.speclang/config.yaml') {
    let config = { ...DEFAULT_CONFIG };
    
    if (existsSync(configPath)) {
      const fileConfig = await this.parseYaml(
        await readFile(configPath, 'utf-8')
      );
      config = this.merge(config, fileConfig);
    }
    
    this.validate(config);
    return config;
  }
  
  private parseYaml(yaml) {
    // Simplified YAML parser
    const result = {};
    let section = null;
    let array = null;
    
    for (const line of yaml.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      if (trimmed.endsWith(':') && !trimmed.includes(' ')) {
        section = trimmed.slice(0, -1);
        result[section] = {};
        array = null;
      } else if (trimmed.startsWith('- ') && array) {
        array.push(trimmed.slice(2));
      } else {
        const match = trimmed.match(/^(\w+):\s*(.+)$/);
        if (match && section) {
          if (match[2].trim() === '') {
            array = [];
            result[section][match[1]] = array;
          } else {
            result[section][match[1]] = this.parseValue(match[2]);
          }
        }
      }
    }
    
    return result;
  }
  
  private parseValue(value) {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (/^\d+$/.test(value)) return parseInt(value, 10);
    return value.replace(/^["']|["']$/g, '');
  }
  
  private merge(defaults, file) {
    return {
      watch: { ...defaults.watch, ...file.watch },
      cascade: { ...defaults.cascade, ...file.cascade },
      output: { ...defaults.output, ...file.output },
      logging: { ...defaults.logging, ...file.logging }
    };
  }
  
  private validate(config) {
    if (config.watch.debounce < 0) {
      throw new Error('Invalid debounce');
    }
  }
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
