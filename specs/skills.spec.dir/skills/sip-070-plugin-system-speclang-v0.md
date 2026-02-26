---
name: sip-070-plugin-system-speclang-v0
title: "SIP 70: Plugin System"
version: 0.1.0
description: Extensible plugin architecture for SpecLang tools and generators
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 70: Plugin System

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the plugin system for extending SpecLang.

### Quick Start

1. **Create:** Plugin with hooks
2. **Register:** Add to .speclangrc
3. **Run:** Hooks execute automatically

### Plugin Types

| Type | Description |
|------|-------------|
| Parser | Transform source before parsing |
| Validator | Custom validation rules |
| Generator | New code generation targets |
| Reporter | Custom output formats |

### When to Read This

- **Extending:** Adding custom functionality
- **Generators:** New target languages
- **Integrations:** CI/CD, tools

### Related SIPs

- SIP 12: Codegen Framework
- SIP 49: OpenCode Plugin
- SIP 50: MCP Tools

## Abstract

This SIP specifies the plugin system for SpecLang, enabling extension of parsing, validation, code generation, and reporting.

## Motivation

Users need to:
- Add custom validation rules
- Support new target languages
- Integrate with external tools
- Customize output formats

## Rationale

**Plugin Architecture:**

```
┌─────────────────────────────────────────┐
│            SpecLang Core                 │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│  │Parse│ │Valid│ │Gen  │ │Report│       │
│  └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘       │
└─────┼──────┼──────┼──────┼─────────────┘
      │      │      │      │
      ▼      ▼      ▼      ▼
┌─────────────────────────────────────────┐
│            Plugin Host                   │
│  ┌─────────────────────────────────┐    │
│  │  before / after hooks            │    │
│  └─────────────────────────────────┘    │
│  ┌────────┐ ┌────────┐ ┌────────┐       │
│  │Plugin A│ │Plugin B│ │Plugin C│       │
│  └────────┘ └────────┘ └────────┘       │
└─────────────────────────────────────────┘
```

**Benefits:**
- Extensible without modifying core
- Hot-loadable plugins
- Typed plugin API
- Dependency management

## Specification

### Plugin Interface

**@plugin/interface:**

```speclang
# @block:plugin/interface @kind:entity
Plugin:
  name: String
  version: SemVer
  description: String
  
  dependencies:
    speclang: SemVerRange
    plugins: Map<String, SemVerRange>
    
  hooks:
    - beforeParse(source: Source) -> Source
    - afterParse(graph: SpecGraph) -> SpecGraph
    - beforeValidate(graph: SpecGraph) -> SpecGraph
    - afterValidate(result: ValidationResult) -> ValidationResult
    - beforeTransform(ir: IR) -> IR
    - beforeCodegen(ir: IR, target: Target) -> IR
    - afterCodegen(artifacts: Artifact[]) -> Artifact[]
    - beforeReport(report: Report) -> Report
    - afterReport(output: String) -> String
    
  commands:
    - name: String
      description: String
      handler: (args: Args) -> Result
```

### Plugin Manifest

**@plugin/manifest:**

```speclang
# @block:plugin/manifest @kind:entity
PluginManifest:
  file: speclang-plugin.yaml
  
  fields:
    name: String              # Plugin identifier
    version: SemVer           # Plugin version
    main: String              # Entry point file
    description: String       # Human-readable description
    author: String?           # Author name
    license: String?          # License (MIT, Apache, etc)
    
    engines:
      speclang: String        # Required SpecLang version
      
    dependencies:
      plugins: Map?           # Other plugins required
      
    hooks:
      - parse: Boolean?       # Hooks into parse phase
      - validate: Boolean?    # Hooks into validate phase
      - codegen: Boolean?     # Hooks into codegen phase
      - report: Boolean?      # Hooks into report phase
      
    commands:
      - name: String
        description: String
```

### Hook Types

**@plugin/hooks:**

```speclang
# @block:plugin/hooks @kind:entity
HookType:
  beforeParse:
    input: Source
    output: Source
    description: Transform source before parsing
    
  afterParse:
    input: SpecGraph
    output: SpecGraph
    description: Modify parsed graph
    
  beforeValidate:
    input: SpecGraph
    output: SpecGraph
    description: Prepare for validation
    
  afterValidate:
    input: ValidationResult
    output: ValidationResult
    description: Post-process validation
    
  beforeTransform:
    input: IR
    output: IR
    description: Modify before transformation
    
  beforeCodegen:
    input: IR, Target
    output: IR
    description: Prepare for code generation
    
  afterCodegen:
    input: Artifact[]
    output: Artifact[]
    description: Post-process generated code
    
  onError:
    input: SpecLangError
    output: void | RecoveryAction
    description: Handle errors
```

### Plugin Registry

**@plugin/registry:**

```speclang
# @block:plugin/registry @kind:entity
PluginRegistry:
  location: .speclang/plugins/
  
  operations:
    install(name: String): Plugin
    uninstall(name: String): void
    list(): Plugin[]
    get(name: String): Plugin?
    update(name: String): Plugin
    
  discovery:
    - Local: .speclang/plugins/
    - NPM: @speclang/plugin-*
    - Git: https://github.com/speclang-plugins/*
```

### Plugin Configuration

**@plugin/config:**

```speclang
# @block:plugin/config @kind:entity
PluginConfig:
  in: .speclangrc
  
  structure:
    plugins:
      - name: String
        enabled: Boolean @default(true)
        options: Map?
        
  example:
    plugins:
      - name: "@speclang/plugin-mermaid"
        enabled: true
        options:
          theme: dark
          
      - name: "@acme/custom-validator"
        enabled: true
        options:
          rules: ["no-any", "strict-types"]
```

## Plugin Types

### Parser Plugin

**@plugin/parser:**

```speclang
# @block:plugin/parser @kind:entity
ParserPlugin:
  hooks:
    - beforeParse: Transform source
    - afterParse: Modify graph
    
  use_cases:
    - Custom syntax extensions
    - Preprocessing (macros, includes)
    - Language transpilation
    
  example:
    name: "@speclang/plugin-macros"
    hooks:
      beforeParse: (source) => expandMacros(source)
```

### Validator Plugin

**@plugin/validator:**

```speclang
# @block:plugin/validator @kind:entity
ValidatorPlugin:
  hooks:
    - beforeValidate: Prepare graph
    - afterValidate: Add custom rules
    
  use_cases:
    - Custom validation rules
    - Domain-specific checks
    - Integration with external linters
    
  example:
    name: "@speclang/plugin-strict"
    rules:
      - no-any-type
      - require-docs
      - max-complexity
```

### Generator Plugin

**@plugin/generator:**

```speclang
# @block:plugin/generator @kind:entity
GeneratorPlugin:
  hooks:
    - beforeCodegen: Prepare IR
    - afterCodegen: Post-process artifacts
    
  use_cases:
    - New target languages
    - Custom output formats
    - Code transformations
    
  example:
    name: "@speclang/plugin-kotlin"
    target: kotlin
    templates: ./templates/kotlin/
```

### Reporter Plugin

**@plugin/reporter:**

```speclang
# @block:plugin/reporter @kind:entity
ReporterPlugin:
  hooks:
    - beforeReport: Prepare report
    - afterReport: Format output
    
  use_cases:
    - Custom output formats
    - Integration with tools
    - Notifications
    
  example:
    name: "@speclang/plugin-slack"
    hooks:
      afterReport: (output) => sendToSlack(output)
```

## Implementation

### Plugin Host

```typescript
interface Plugin {
  name: string;
  version: string;
  description: string;
  hooks?: Partial<PluginHooks>;
  commands?: PluginCommand[];
}

interface PluginHooks {
  beforeParse: (source: Source) => Source | Promise<Source>;
  afterParse: (graph: SpecGraph) => SpecGraph | Promise<SpecGraph>;
  beforeValidate: (graph: SpecGraph) => SpecGraph | Promise<SpecGraph>;
  afterValidate: (result: ValidationResult) => ValidationResult | Promise<ValidationResult>;
  beforeTransform: (ir: IR) => IR | Promise<IR>;
  beforeCodegen: (ir: IR, target: string) => IR | Promise<IR>;
  afterCodegen: (artifacts: Artifact[]) => Artifact[] | Promise<Artifact[]>;
  beforeReport: (report: Report) => Report | Promise<Report>;
  afterReport: (output: string) => string | Promise<string>;
  onError: (error: SpecLangError) => void | RecoveryAction | Promise<void | RecoveryAction>;
}

interface PluginCommand {
  name: string;
  description: string;
  handler: (args: string[], options: Record<string, unknown>) => Promise<number>;
}

class PluginHost {
  private plugins: Map<string, Plugin> = new Map();
  private hookOrder: string[] = [];
  
  async loadPlugin(path: string): Promise<Plugin> {
    const manifest = await this.loadManifest(path);
    const plugin = await this.loadModule(path, manifest.main);
    
    this.validatePlugin(plugin, manifest);
    this.plugins.set(plugin.name, plugin);
    
    return plugin;
  }
  
  async executeHook<K extends keyof PluginHooks>(
    hook: K,
    ...args: Parameters<NonNullable<PluginHooks[K]>>
  ): Promise<ReturnType<NonNullable<PluginHooks[K]>>> {
    let result = args[0];
    
    for (const [name, plugin] of this.plugins) {
      const hookFn = plugin.hooks?.[hook];
      
      if (hookFn) {
        try {
          result = await (hookFn as any)(...args);
        } catch (error) {
          console.error(`Plugin ${name} hook ${hook} failed:`, error);
        }
      }
    }
    
    return result;
  }
  
  getCommand(name: string): PluginCommand | undefined {
    for (const plugin of this.plugins.values()) {
      const cmd = plugin.commands?.find(c => c.name === name);
      if (cmd) return cmd;
    }
    return undefined;
  }
  
  private validatePlugin(plugin: Plugin, manifest: PluginManifest): void {
    if (!plugin.name) {
      throw new Error('Plugin must have a name');
    }
    
    if (!plugin.version) {
      throw new Error('Plugin must have a version');
    }
    
    // Check version compatibility
    if (manifest.engines?.speclang) {
      const currentVersion = require('../package.json').version;
      if (!semver.satisfies(currentVersion, manifest.engines.speclang)) {
        throw new Error(
          `Plugin requires SpecLang ${manifest.engines.speclang}, ` +
          `but current version is ${currentVersion}`
        );
      }
    }
  }
  
  private async loadManifest(path: string): Promise<PluginManifest> {
    const manifestPath = join(path, 'speclang-plugin.yaml');
    const content = await fs.readFile(manifestPath, 'utf-8');
    return yaml.parse(content);
  }
  
  private async loadModule(path: string, main: string): Promise<Plugin> {
    const modulePath = join(path, main);
    const module = await import(modulePath);
    return module.default || module;
  }
}
```

### Plugin Registry

```typescript
class PluginRegistry {
  private readonly REGISTRY_PATH = '.speclang/plugins';
  private readonly NPM_SCOPE = '@speclang/plugin-';
  
  async install(name: string, options?: InstallOptions): Promise<Plugin> {
    const packagePath = await this.resolvePackage(name);
    
    // Install from NPM
    if (name.startsWith('@') || !name.includes('/')) {
      await this.installFromNpm(name);
    } else {
      // Install from Git or local
      await this.installFromSource(name);
    }
    
    // Load and validate
    const plugin = await this.loadPlugin(packagePath);
    
    // Run install hook if exists
    if (plugin.hooks?.onInstall) {
      await plugin.hooks.onInstall(options);
    }
    
    return plugin;
  }
  
  async uninstall(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    
    if (plugin?.hooks?.onUninstall) {
      await plugin.hooks.onUninstall();
    }
    
    await fs.rm(join(this.REGISTRY_PATH, name), { recursive: true });
    this.plugins.delete(name);
  }
  
  list(): PluginInfo[] {
    return Array.from(this.plugins.values()).map(p => ({
      name: p.name,
      version: p.version,
      description: p.description,
    }));
  }
  
  private async resolvePackage(name: string): Promise<string> {
    // Check if already installed
    const local = join(this.REGISTRY_PATH, name);
    if (await exists(local)) {
      return local;
    }
    
    // NPM package
    if (!name.includes('/')) {
      return `${this.NPM_SCOPE}${name}`;
    }
    
    return name;
  }
  
  private async installFromNpm(name: string): Promise<void> {
    const npmName = name.startsWith('@') ? name : `${this.NPM_SCOPE}${name}`;
    
    await execFile('npm', [
      'install',
      '--prefix', this.REGISTRY_PATH,
      '--no-save',
      npmName,
    ]);
  }
}
```

### Plugin Example

```typescript
// speclang-plugin-strict/src/index.ts
import { Plugin } from '@speclang/core';

const plugin: Plugin = {
  name: '@speclang/plugin-strict',
  version: '1.0.0',
  description: 'Strict validation rules for SpecLang',
  
  hooks: {
    afterValidate: (result) => {
      // Add strict validation rules
      for (const block of result.graph.blocks) {
        // Check for 'any' type
        if (JSON.stringify(block).includes(': any')) {
          result.warnings.push({
            rule: 'no-any-type',
            message: `Block ${block.id} uses 'any' type`,
            location: block.location,
          });
        }
        
        // Check for documentation
        if (!block.description && block.kind !== 'note') {
          result.warnings.push({
            rule: 'require-docs',
            message: `Block ${block.id} is missing documentation`,
            location: block.location,
          });
        }
      }
      
      return result;
    },
  },
  
  commands: [
    {
      name: 'strict:check',
      description: 'Run strict validation checks',
      handler: async (args, options) => {
        console.log('Running strict validation...');
        // Custom logic here
        return 0;
      },
    },
  ],
};

export default plugin;
```

### Plugin Manifest Example

```yaml
# speclang-plugin.yaml
name: "@speclang/plugin-strict"
version: 1.0.0
main: dist/index.js
description: Strict validation rules for SpecLang
author: SpecLang Team
license: MIT

engines:
  speclang: ">=0.1.0"

hooks:
  - validate

commands:
  - name: strict:check
    description: Run strict validation checks
```

## Built-in Plugins

### @plugin/builtins

```speclang
# @block:plugin/builtins @kind:entity
BuiltInPlugins:
  mermaid-validator:
    description: Validates mermaid diagram syntax
    hooks:
      - afterParse
      
  ref-resolver:
    description: Resolves @id references
    hooks:
      - afterParse
      
  stdlib-inliner:
    description: Inlines stdlib blocks
    hooks:
      - beforeValidate
      
  layer-enforcer:
    description: Warns on missing layers
    hooks:
      - afterValidate
```

## Security

### @plugin/security

```speclang
# @block:plugin/security @kind:entity
PluginSecurity:
  sandbox:
    - No filesystem access outside project
    - No network access unless declared
    - No process spawning unless declared
    
  permissions:
    - filesystem: read | write
    - network: request
    - process: spawn
    
  verification:
    - Check signature if signed
    - Verify checksum
    - Prompt for permissions
```

## References

- @ref:specs/plugins
- @ref:specs/codegen.spec.dir/plugins
- SIP 12: Codegen Framework
- SIP 49: OpenCode Plugin
- SIP 50: MCP Tools

## Copyright

This document is in the public domain.
