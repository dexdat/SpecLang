---
name: sip-083-configuration-files-speclang-v0
title: "SIP 83: Configuration Files"
version: 0.1.0
description: .speclangrc format, loading, and environment configuration
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 83: Configuration Files

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the configuration file system for Speclang projects.

### Quick Start

```bash
# Create config
speclang init

# View config
speclang config list

# Set value
speclang config set targets.typescript true
```

### Configuration Files

| File | Purpose |
|------|---------|
| .speclangrc | Main config (JSON/YAML) |
| .speclangrc.json | JSON format |
| .speclangrc.yaml | YAML format |
| .speclang/config/ | Config directory |
| .env | Environment variables |

### When to Read This

- **Project Setup:** Initial configuration
- **CI/CD:** Environment config
- **Customization:** Advanced settings

### Related SIPs

- SIP 8: Configuration
- SIP 37: CLI
- SIP 83: CLI Commands

## Abstract

This SIP defines the configuration file format, loading hierarchy, and environment variable integration for Speclang projects.

## Motivation

Users need:
- Project-level configuration
- User-level defaults
- Environment overrides
- Multiple format support

## Rationale

**Configuration Hierarchy:**
```
CLI args > ENV vars > Project config > User config > Defaults
```

**Benefits:**
- Flexible configuration
- Secure secrets handling
- Team consistency
- Personal preferences

## Specification

### Configuration File

**@config/file:**

#### Location Priority

1. `.speclangrc` (JSON or YAML)
2. `.speclangrc.json`
3. `.speclangrc.yaml` / `.speclangrc.yml`
4. `.speclang/config.json`
5. `.speclang/config.yaml`
6. `speclang.config.js` / `speclang.config.ts`
7. `package.json` (speclang key)

#### Full Schema

**@config/schema:**

```yaml
$schema: https://speclang.dev/schemas/config.json

name: String                    # Project name
version: SemVer                 # Project version
description: String            # Project description

specs_dir: String              # Specs directory (default: specs)
output_dir: String             # Output directory (default: generated)

targets:                       # Build targets
  - typescript:
      enabled: Boolean
      output: String
      sourceMap: Boolean
      strict: Boolean
  - go:
      enabled: Boolean
      output: String
      package: String
  - python:
      enabled: Boolean
      output: String
      typing: strict | basic
  - rust:
      enabled: Boolean
      output: String
      edition: String

plugins:                       # Plugins configuration
  - name: String
    enabled: Boolean
    options: Map

ai:                            # AI configuration
  enabled: Boolean
  provider: openai | anthropic | local
  model: String
  apiKey: String              # Use ENV var preferred

validation:                    # Validation settings
  strict: Boolean
  rules: String[]

build:                         # Build settings
  incremental: Boolean
  parallel: Boolean
  cache: String

watch:                         # Watch settings
  debounce: Number
  ignore: String[]

cascade:                       # Cascade settings
  enabled: Boolean
  quiet_period: Number
  max_depth: Number
  max_files: Number

database:                      # Database settings
  path: String
  mode: String

logging:                       # Logging settings
  level: debug | info | warn | error
  format: text | json

extends: String[]              # Extend other configs
```

### Example Configurations

**@config/examples:**

#### Minimal .speclangrc

```yaml
name: my-project
version: 1.0.0
targets:
  - typescript
```

#### Full .speclangrc.yaml

```yaml
name: my-saas-app
version: 1.2.0
description: Full-stack SaaS application

specs_dir: specs
output_dir: generated

targets:
  typescript:
    enabled: true
    output: src/generated/
    sourceMap: true
    strict: true
  go:
    enabled: true
    output: internal/gen/
    package: gen

plugins:
  - name: @speclang/plugin-openapi
    enabled: true
    options:
      specVersion: "3.0.0"
  - name: @speclang/plugin-grpc
    enabled: false

ai:
  enabled: true
  provider: openai
  model: gpt-4

validation:
  strict: true
  rules:
    - require-layer
    - require-short

build:
  incremental: true
  parallel: true
  cache: .speclang/cache/build.json

watch:
  debounce: 100
  ignore:
    - "**/*.test.spec.md"

cascade:
  enabled: true
  quiet_period: 30
  max_depth: 50

logging:
  level: info
  format: json
```

#### JSON Format

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "targets": ["typescript"],
  "ai": {
    "enabled": true,
    "provider": "openai"
  }
}
```

#### JavaScript Config

```javascript
// speclang.config.js
module.exports = {
  name: 'my-project',
  version: '1.0.0',
  targets: ['typescript', 'go'],
  ai: {
    enabled: true,
    provider: process.env.AI_PROVIDER || 'openai',
  },
};
```

### Environment Variables

**@config/env:**

#### Naming Convention

```
SPECLANG_<SECTION>_<KEY>
```

#### Examples

```bash
# AI configuration
SPECLANG_AI_ENABLED=true
SPECLANG_AI_PROVIDER=openai
SPECLANG_AI_API_KEY=sk-xxx
SPECLANG_AI_MODEL=gpt-4

# Build configuration
SPECLANG_BUILD_INCREMENTAL=true
SPECLANG_BUILD_PARALLEL=false

# Validation
SPECLANG_VALIDATION_STRICT=true

# Paths
SPECLANG_SPECS_DIR=./specifications
SPECLANG_OUTPUT_DIR=./dist

# Logging
SPECLANG_LOGGING_LEVEL=debug
```

#### .env File

```bash
# .env
SPECLANG_AI_API_KEY=sk-your-key-here
SPECLANG_AI_PROVIDER=openai
SPECLANG_LOGGING_LEVEL=debug
```

### Configuration Loading

**@config/loading:**

#### Load Order

```
1. Default values (hardcoded)
2. User global config (~/.speclangrc)
3. Project config (.speclangrc)
4. Environment variables
5. CLI arguments
```

#### Load Algorithm

```typescript
async function loadConfig(overrides?: Partial<Config>): Promise<Config> {
  // Start with defaults
  let config = defaultConfig();

  // Load user global config
  const globalConfig = await loadGlobalConfig();
  config = merge(config, globalConfig);

  // Load project config
  const projectConfig = await loadProjectConfig();
  config = merge(config, projectConfig);

  // Apply environment variables
  const envConfig = parseEnvConfig();
  config = merge(config, envConfig);

  // Apply CLI overrides
  config = merge(config, overrides);

  // Validate final config
  validateConfig(config);

  return config;
}
```

### Extending Configs

**@config/extends:**

```yaml
# .speclangrc
extends:
  - ./base.yaml
  - ./env/production.yaml

name: my-project
version: 1.0.0

targets:
  - typescript
```

```yaml
# base.yaml
validation:
  strict: true
  rules:
    - require-layer
    - require-short

logging:
  level: info
```

```yaml
# env/production.yaml
logging:
  level: warn
ai:
  enabled: false
```

### CLI Config Commands

**@config/cli:**

```bash
# List all config
speclang config list

# List specific section
speclang config list ai

# Get single value
speclang config get ai.model

# Set value
speclang config set ai.model gpt-4

# Delete value
speclang config unset ai.model

# Validate config
speclang config validate
```

### Configuration Validation

**@config/validation:**

```typescript
const configSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    version: { type: 'string', pattern: /^\d+\.\d+\.\d+/ },
    specs_dir: { type: 'string' },
    output_dir: { type: 'string' },
    targets: {
      type: 'array',
      items: {
        oneOf: [
          { type: 'string' },
          {
            type: 'object',
            additionalProperties: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                output: { type: 'string' },
              },
            },
          },
        ],
      },
    },
    ai: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        provider: { enum: ['openai', 'anthropic', 'local'] },
        model: { type: 'string' },
      },
    },
  },
  required: ['name', 'version'],
};
```

## Implementation

### Config Loader

```typescript
import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';
import { cosmiconfig } from 'cosmiconfig';

interface Config {
  name: string;
  version: string;
  specs_dir: string;
  output_dir: string;
  targets: TargetConfig[];
  plugins: PluginConfig[];
  ai: AIConfig;
  validation: ValidationConfig;
  build: BuildConfig;
  cascade: CascadeConfig;
  logging: LoggingConfig;
}

const defaultConfig: Config = {
  name: '',
  version: '0.0.0',
  specs_dir: 'specs',
  output_dir: 'generated',
  targets: [{ typescript: { enabled: true } }],
  plugins: [],
  ai: { enabled: false, provider: 'openai', model: 'gpt-4' },
  validation: { strict: false, rules: [] },
  build: { incremental: true, parallel: true, cache: '.speclang/cache/build.json' },
  cascade: { enabled: true, quiet_period: 30, max_depth: 50, max_files: 1000 },
  logging: { level: 'info', format: 'text' },
};

export async function loadConfig(overrides?: Partial<Config>): Promise<Config> {
  const explorer = cosmiconfig('speclang', {
    searchPlaces: [
      '.speclangrc',
      '.speclangrc.json',
      '.speclangrc.yaml',
      '.speclangrc.yml',
      '.speclang/config.json',
      '.speclang/config.yaml',
      'speclang.config.js',
      'speclang.config.ts',
    ],
  });

  let config = { ...defaultConfig };

  // Load user global config
  const globalConfigPath = path.join(os.homedir(), '.speclangrc');
  if (await fs.pathExists(globalConfigPath)) {
    const global = await loadConfigFile(globalConfigPath);
    config = deepMerge(config, global);
  }

  // Load project config
  const result = await explorer.search();
  if (result) {
    config = deepMerge(config, result.config);
  }

  // Apply environment variables
  const envConfig = parseEnvConfig();
  config = deepMerge(config, envConfig);

  // Apply CLI overrides
  if (overrides) {
    config = deepMerge(config, overrides);
  }

  // Validate
  const errors = validateConfig(config);
  if (errors.length > 0) {
    throw new ConfigError(errors);
  }

  return config;
}
```

### Environment Parser

```typescript
function parseEnvConfig(): Partial<Config> {
  const config: Partial<Config> = {};
  const prefix = 'SPECLANG_';

  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith(prefix)) continue;

    const configPath = key
      .slice(prefix.length)
      .toLowerCase()
      .split('_');

    setNestedValue(config, configPath, parseEnvValue(value));
  }

  return config;
}

function parseEnvValue(value: string): any {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
  return value;
}

function setNestedValue(obj: any, path: string[], value: any): void {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    if (!(path[i] in current)) {
      current[path[i]] = {};
    }
    current = current[path[i]];
  }
  current[path[path.length - 1]] = value;
}
```

### Deep Merge

```typescript
function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key of Object.keys(source) as (keyof T)[]) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (
      sourceValue !== undefined &&
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as T[keyof T];
    }
  }

  return result;
}
```

### Config Commands

```typescript
import { Command } from 'commander';

export function registerConfigCommands(program: Command) {
  const config = program.command('config');

  config
    .command('list [section]')
    .description('List configuration values')
    .action(async (section) => {
      const cfg = await loadConfig();
      const value = section ? get(cfg, section) : cfg;
      console.log(yaml.stringify(value, null, 2));
    });

  config
    .command('get <path>')
    .description('Get a configuration value')
    .action(async (path) => {
      const cfg = await loadConfig();
      const value = get(cfg, path);
      console.log(JSON.stringify(value));
    });

  config
    .command('set <path> <value>')
    .description('Set a configuration value')
    .action(async (path, value) => {
      await setConfigValue(path, JSON.parse(value));
      console.log(`Set ${path}`);
    });

  config
    .command('unset <path>')
    .description('Remove a configuration value')
    .action(async (path) => {
      await unsetConfigValue(path);
      console.log(`Unset ${path}`);
    });

  config
    .command('validate')
    .description('Validate configuration')
    .action(async () => {
      try {
        await loadConfig();
        console.log('Configuration is valid');
      } catch (error) {
        console.error('Configuration errors:', error.message);
        process.exit(1);
      }
    });
}
```

### Secrets Handling

```typescript
// Never log or expose sensitive values
const sensitiveKeys = ['apiKey', 'secret', 'password', 'token'];

function redactConfig(config: any): any {
  const redacted = { ...config };

  for (const key of Object.keys(redacted)) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      redacted[key] = '***';
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redactConfig(redacted[key]);
    }
  }

  return redacted;
}
```

## File Locations

```
project/
├── .speclangrc              # Main config
├── .speclangrc.json         # JSON alternative
├── .speclangrc.yaml         # YAML alternative
├── .speclang/
│   ├── config.json          # Directory config
│   └── cache/
│       └── build.json       # Build cache
├── speclang.config.js       # JS config
├── .env                     # Environment variables
└── specs/                   # Specs directory

~/.speclangrc                # User global config
```

## References

- @ref:sip-008-configuration
- @ref:sip-037-cli
- @ref:sip-064-cli-commands

## Copyright

This document is in the public domain.
