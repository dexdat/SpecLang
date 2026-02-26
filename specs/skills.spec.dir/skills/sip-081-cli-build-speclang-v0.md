---
name: sip-081-cli-build-speclang-v0
title: "SIP 81: CLI Build Command"
version: 0.1.0
description: Build and compile specs to code with speclang build
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 81: CLI Build Command

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the `speclang build` command for compiling specs to code.

### Quick Start

```bash
# Build all specs
speclang build

# Build for specific target
speclang build --target=go

# Watch mode
speclang build --watch
```

### Build Targets

| Target | Output |
|--------|--------|
| typescript | .ts files |
| go | .go files |
| python | .py files |
| rust | .rs files |
| java | .java files |

### When to Read This

- **Code Generation:** Building outputs
- **CI/CD:** Pipeline integration
- **Watch Mode:** Development workflow

### Related SIPs

- SIP 37: CLI
- SIP 12: Codegen
- SIP 64: CLI Commands

## Abstract

This SIP defines the `speclang build` command that compiles specification files to executable code in multiple target languages.

## Motivation

Users need:
- Multi-target compilation
- Incremental builds
- Watch mode for development
- Build artifacts management

## Rationale

**Build Pipeline:**
```
Specs -> Parser -> IR -> Generator -> Code
                ↓
            Cache/Incremental
```

**Benefits:**
- Single source of truth
- Consistent outputs
- Type safety
- Fast iteration

## Specification

### Command Signature

**@cli/build:**

```bash
speclang build [specs...] [options]

Arguments:
  specs        Specific specs to build (default: all)

Options:
  --target     Output language (ts, go, py, rs, java)
  --output     Output directory (default: generated/)
  --watch      Watch for changes and rebuild
  --parallel   Build concurrently (default: true)
  --clean      Clean output before build
  --dry-run    Show what would be built
  --source-map Generate source maps
  --minify     Minify output where applicable
  --profile    Output build timing

Aliases:
  speclang compile
  speclang generate
```

### Build Targets

**@build/targets:**

#### TypeScript

```bash
speclang build --target=typescript
speclang build --target=ts
```

Output:
- `.ts` type definitions
- `.ts` implementations
- `.d.ts` declaration files

#### Go

```bash
speclang build --target=go
```

Output:
- `.go` struct definitions
- `.go` interfaces
- `.go` implementations

#### Python

```bash
speclang build --target=python
speclang build --target=py
```

Output:
- `.py` dataclasses
- `.py` type stubs (`.pyi`)

#### Rust

```bash
speclang build --target=rust
speclang build --target=rs
```

Output:
- `.rs` struct definitions
- `.rs` trait implementations

#### Java

```bash
speclang build --target=java
```

Output:
- `.java` classes
- `.java` interfaces

### Build Configuration

**@build/config:**

```yaml
# .speclangrc
build:
  targets:
    - typescript:
        output: src/generated/
        sourceMap: true
        strict: true
    - go:
        output: internal/gen/
        package: gen
  
  incremental: true
  cache: .speclang/cache/build.json
```

### Incremental Builds

**@build/incremental:**

```bash
# First build (full)
speclang build
Building 42 specs...

# Second build (incremental)
speclang build
No changes detected. Skipping build.

# After spec change
speclang build
Rebuilding 2 changed specs...
```

Cache file tracks:
- File hashes
- Last build time
- Dependency graph

### Watch Mode

**@build/watch:**

```bash
speclang build --watch

Watching specs/ for changes...
[10:23:45] specs/auth.spec.md changed -> rebuilding...
[10:23:45] Generated src/auth.ts
[10:23:50] specs/user.spec.md changed -> rebuilding...
[10:23:50] Generated src/user.ts
```

Options:
```bash
# Debounce changes
speclang build --watch --debounce=100

# Run command after build
speclang build --watch --on-success="npm run test"
```

### Clean Build

**@build/clean:**

```bash
# Remove output before build
speclang build --clean

# Equivalent to:
rm -rf generated/
speclang build
```

### Dry Run

**@build/dry-run:**

```bash
speclang build --dry-run

Would generate:
  src/auth.ts (234 lines)
  src/user.ts (156 lines)
  src/types.ts (89 lines)
  go/auth.go (312 lines)
  go/user.go (201 lines)

Total: 5 files, 992 lines
```

### Build Profile

**@build/profile:**

```bash
speclang build --profile

Build Timing:
  Parse specs:      45ms
  Validate refs:    12ms
  Build IR:         23ms
  Generate TS:      89ms
  Generate Go:      67ms
  Write files:      34ms
  ─────────────────────
  Total:           270ms
```

### Output Structure

**@build/structure:**

```
generated/
├── typescript/
│   ├── index.ts
│   ├── entities/
│   │   ├── user.ts
│   │   └── session.ts
│   └── features/
│       └── auth.ts
├── go/
│   ├── entities/
│   │   ├── user.go
│   │   └── session.go
│   └── features/
│       └── auth.go
└── .build-cache.json
```

## Implementation

### Command Handler

```typescript
import chokidar from 'chokidar';
import { buildSpecs, loadBuildConfig } from '@speclang/core';

interface BuildOptions {
  target?: string[];
  output?: string;
  watch: boolean;
  parallel: boolean;
  clean: boolean;
  dryRun: boolean;
  sourceMap: boolean;
  minify: boolean;
  profile: boolean;
}

export async function buildCommand(
  specs: string[],
  options: BuildOptions
) {
  if (options.watch) {
    return watchMode(specs, options);
  }

  if (options.clean) {
    await cleanOutput(options.output || 'generated');
  }

  const config = await loadBuildConfig();
  const targets = options.target || config.targets || ['typescript'];

  const startTime = Date.now();
  const result = await buildSpecs(specs, {
    targets,
    output: options.output || config.output || 'generated',
    parallel: options.parallel,
    dryRun: options.dryRun,
    sourceMap: options.sourceMap,
    minify: options.minify,
  });

  if (options.profile) {
    printProfile(result.timing);
  }

  if (!options.dryRun) {
    console.log(`Built ${result.files.length} files in ${Date.now() - startTime}ms`);
  }
}
```

### Build Pipeline

```typescript
interface BuildResult {
  files: GeneratedFile[];
  timing: BuildTiming;
  errors: BuildError[];
}

interface GeneratedFile {
  path: string;
  content: string;
  sourceMap?: string;
  lines: number;
}

export async function buildSpecs(
  specs: string[],
  options: BuildOptions
): Promise<BuildResult> {
  const timing: BuildTiming = {};
  let start: number;

  // Parse specs
  start = Date.now();
  const parsed = await parseSpecs(specs);
  timing.parse = Date.now() - start;

  // Validate references
  start = Date.now();
  const errors = await validateRefs(parsed);
  timing.validate = Date.now() - start;

  if (errors.length > 0) {
    return { files: [], timing, errors };
  }

  // Build IR
  start = Date.now();
  const ir = buildIR(parsed);
  timing.ir = Date.now() - start;

  // Generate code
  const files: GeneratedFile[] = [];
  for (const target of options.targets) {
    start = Date.now();
    const generator = getGenerator(target);
    const generated = await generator.generate(ir, options);
    timing[`generate-${target}`] = Date.now() - start;
    files.push(...generated);
  }

  // Write files
  if (!options.dryRun) {
    start = Date.now();
    await writeFiles(files, options.output);
    timing.write = Date.now() - start;
  }

  return { files, timing, errors: [] };
}
```

### Generator Interface

```typescript
interface Generator {
  name: string;
  extension: string;
  generate(ir: SpecIR, options: BuildOptions): Promise<GeneratedFile[]>;
}

class TypeScriptGenerator implements Generator {
  name = 'typescript';
  extension = '.ts';

  async generate(ir: SpecIR, options: BuildOptions): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    for (const entity of ir.entities) {
      const content = this.generateEntity(entity);
      files.push({
        path: `entities/${entity.name}${this.extension}`,
        content,
        lines: content.split('\n').length,
      });
    }

    for (const feature of ir.features) {
      const content = this.generateFeature(feature);
      files.push({
        path: `features/${feature.name}${this.extension}`,
        content,
        lines: content.split('\n').length,
      });
    }

    return files;
  }

  private generateEntity(entity: EntitySpec): string {
    return `// Auto-generated from ${entity.source}
// Do not edit manually

export interface ${entity.name} {
${entity.fields.map(f => `  ${f.name}: ${this.mapType(f.type)};`).join('\n')}
}
`;
  }

  private mapType(specType: string): string {
    const typeMap: Record<string, string> = {
      'string': 'string',
      'int': 'number',
      'bool': 'boolean',
      'float': 'number',
    };
    return typeMap[specType] || specType;
  }
}
```

### Watch Mode

```typescript
async function watchMode(specs: string[], options: BuildOptions) {
  const config = await loadBuildConfig();
  const watchPath = config.specsDir || 'specs';

  const watcher = chokidar.watch(watchPath, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
  });

  let building = false;
  let pending = false;

  const rebuild = async () => {
    if (building) {
      pending = true;
      return;
    }

    building = true;
    console.log('Building...');
    await buildCommand(specs, { ...options, watch: false });
    building = false;

    if (pending) {
      pending = false;
      rebuild();
    }
  };

  watcher.on('change', (path) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${path} changed`);
    rebuild();
  });

  watcher.on('add', (path) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${path} added`);
    rebuild();
  });

  console.log(`Watching ${watchPath} for changes...`);

  // Initial build
  await rebuild();
}
```

### Incremental Cache

```typescript
interface BuildCache {
  files: Record<string, {
    hash: string;
    lastBuild: number;
    dependencies: string[];
  }>;
}

export class IncrementalBuilder {
  private cachePath: string;
  private cache: BuildCache;

  async load(): Promise<void> {
    try {
      this.cache = await fs.readJson(this.cachePath);
    } catch {
      this.cache = { files: {} };
    }
  }

  async needsRebuild(file: string): Promise<boolean> {
    const hash = await this.hashFile(file);
    const cached = this.cache.files[file];
    return !cached || cached.hash !== hash;
  }

  async updateCache(files: string[]): Promise<void> {
    for (const file of files) {
      this.cache.files[file] = {
        hash: await this.hashFile(file),
        lastBuild: Date.now(),
        dependencies: await this.getDependencies(file),
      };
    }
    await fs.writeJson(this.cachePath, this.cache);
  }

  private async hashFile(file: string): Promise<string> {
    const content = await fs.readFile(file);
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}
```

## CI/CD Integration

### GitHub Actions

```yaml
build:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
    - run: npm install -g speclang
    - run: speclang build --target typescript --target go
    - uses: actions/upload-artifact@v3
      with:
        name: generated-code
        path: generated/
```

### Build Script

```bash
#!/bin/bash
set -e

# Clean build
speclang build --clean

# Multiple targets
speclang build --target typescript --target go --target python

# Verify
if [ -z "$(ls -A generated)" ]; then
  echo "Build produced no output"
  exit 1
fi
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Build succeeded |
| 1 | Build failed |
| 2 | Validation errors |
| 3 | No specs found |
| 130 | Interrupted (Ctrl+C) |

## References

- @ref:sip-037-cli
- @ref:sip-012-codegen
- @ref:sip-064-cli-commands
- @ref:sip-066-go-generator
- @ref:sip-067-python-generator

## Copyright

This document is in the public domain.
