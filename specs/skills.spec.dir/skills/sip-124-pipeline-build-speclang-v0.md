---
name: sip-124-pipeline-build-speclang-v0
title: "SIP 124: Pipeline Build Stages"
version: 0.1.0
description: Build stage configuration, execution, and artifact management in pipelines
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 124: Pipeline Build Stages

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines Build Stages—the compilation and artifact generation phases in SpecLang pipelines.

### Quick Start

```yaml
pipeline:
  build:
    - name: compile
      command: "go build -o bin/app ./cmd/app"
      artifacts:
        - "bin/app"
        
    - name: bundle
      command: "npm run build"
      output: dist/
```

### When to Read This

- **Configuring builds:** Setting up compilation stages
- **Artifact management:** Handling build outputs
- **Multi-language:** Supporting different build systems

### Related SIPs

- SIP 13: Pipeline System
- SIP 74: Pipeline Conditions
- SIP 53: Pipeline Hooks

## Abstract

This SIP specifies build stage configuration, execution model, artifact handling, and caching for the SpecLang pipeline system.

## Motivation

Build stages are needed because:
- Projects need compilation/building
- Artifacts must be tracked and passed between stages
- Different languages require different tooling
- Incremental builds require caching

## Specification

### Build Stage Configuration

```yaml
BuildStage:
  name: string              # Stage identifier
  command: string           # Build command to execute
  cwd: string               # Working directory (optional)
  env: Map<String, String>  # Environment variables (optional)
  timeout: number           # Timeout in seconds (default: 300)
  retry: RetryConfig        # Retry configuration (optional)
  artifacts: Artifact[]     # Output artifacts (optional)
  cache: CacheConfig        # Cache configuration (optional)
  depends_on: string[]     # Stage dependencies (optional)
  condition: string         # Conditional execution (optional)
```

### Build Stage Types

```yaml
BuildTypes:
  compile:
    description: "Compile source code"
    artifacts: true
    cache: true
    
  bundle:
    description: "Bundle resources"
    artifacts: true
    cache: false
    
  transpile:
    description: "Transpile between languages"
    artifacts: true
    cache: true
    
  generate:
    description: "Generate code/artifacts"
    artifacts: true
    cache: false
```

### Artifact Definition

```yaml
Artifact:
  path: string              # Glob pattern or exact path
  type: string              # "file" | "directory" | "archive"
  name: string              # Optional name for reference
  retention_days: number    # Days to keep (default: 30)
  compression: boolean     # Compress when archiving
```

### Artifact Configuration

```yaml
# .speclang/pipeline.yaml
pipeline:
  build:
    - name: compile-go
      command: "go build -o bin/server ./cmd/server"
      artifacts:
        - path: bin/server
          type: file
          name: server_binary
          
    - name: bundle-assets
      command: "npm run build"
      artifacts:
        - path: dist/**/*
          type: directory
          name: frontend_assets
```

### Cache Configuration

```yaml
CacheConfig:
  enable: boolean            # Enable caching (default: true)
  key: string               # Cache key template
  paths: string[]            # Paths to cache
  restore_keys: string[]    # Fallback keys
```

### Cache Examples

```yaml
cache:
  enable: true
  key: "build-{{ checksum go.sum }}"
  paths:
    - ~/.cache/go-build
    - node_modules
  restore_keys:
    - "build-"
    - "deps-"
```

### Build Environment

```yaml
BuildEnvironment:
  default:
    cpu: 2
    memory: 4GB
    timeout: 300
    
  environments:
    go:
      command: "go build"
      cache_paths: ["~/.cache/go-build"]
      
    node:
      command: "npm run build"
      cache_paths: ["node_modules", ".npm"]
      
    rust:
      command: "cargo build --release"
      cache_paths: ["target"]
      
    python:
      command: "python -m py_compile"
      cache_paths: [".venv", "__pycache__"]
```

### Multi-Platform Build

```yaml
MultiPlatformBuild:
  platforms:
    - os: linux
      arch: amd64
    - os: linux
      arch: arm64
    - os: darwin
      arch: amd64
    - os: darwin
      arch: arm64
    - os: windows
      arch: amd64
      
  matrix:
    include:
      - platform: linux/amd64
        output: bin/linux-amd64/app
      - platform: linux/arm64
        output: bin/linux-arm64/app
```

### Build Stage Execution

```yaml
BuildExecution:
  steps:
    - name: setup
      command: "mkdir -p output"
      
    - name: restore_cache
      command: "speclang cache restore"
      
    - name: build
      command: "go build -o output/app"
      
    - name: save_cache
      command: "speclang cache save"
      
    - name: collect_artifacts
      command: "speclang artifacts collect"
```

### Build Artifacts API

```typescript
interface BuildStage {
  name: string;
  type: 'compile' | 'bundle' | 'transpile' | 'generate';
  command: string;
  cwd?: string;
  env?: Record<string, string>;
  timeout: number;
  retry: RetryConfig;
  artifacts: Artifact[];
  cache: CacheConfig;
  depends_on: string[];
  condition?: string;
}

interface Artifact {
  path: string;
  type: 'file' | 'directory' | 'archive';
  name?: string;
  retention_days: number;
  compression: boolean;
}

interface RetryConfig {
  max_attempts: number;
  backoff: 'fixed' | 'exponential';
  initial_delay_ms: number;
  max_delay_ms: number;
}

interface CacheConfig {
  enable: boolean;
  key: string;
  paths: string[];
  restore_keys: string[];
}

class BuildExecutor {
  async executeStage(stage: BuildStage): Promise<StageResult> {
    await this.validateStage(stage);
    await this.setupEnvironment(stage);
    
    const cacheHit = await this.restoreCache(stage);
    const result = await this.runBuildCommand(stage);
    
    if (cacheHit) {
      await this.verifyArtifacts(stage);
    }
    
    await this.saveCache(stage);
    await this.collectArtifacts(stage);
    
    return result;
  }
  
  async restoreCache(stage: BuildStage): Promise<boolean> {
    const cacheKey = await this.computeCacheKey(stage);
    return this.cacheStore.restore(cacheKey, stage.cache.paths);
  }
  
  async saveCache(stage: BuildStage): Promise<void> {
    const cacheKey = await this.computeCacheKey(stage);
    await this.cacheStore.save(cacheKey, stage.cache.paths);
  }
  
  async collectArtifacts(stage: BuildStage): Promise<void> {
    for (const artifact of stage.artifacts) {
      await this.artifactStore.upload(artifact);
    }
  }
}
```

### Build Stage Examples

### Example 1: Go Build

```yaml
pipeline:
  build:
    - name: go-build
      command: "go build -ldflags='-s -w' -o bin/server ./cmd/server"
      timeout: 180
      artifacts:
        - path: bin/server
          type: file
          name: server
      cache:
        enable: true
        key: "go-{{ checksum go.sum }}"
        paths:
          - ~/.cache/go-build
          - bin
```

### Example 2: Node.js Bundle

```yaml
pipeline:
  build:
    - name: npm-install
      command: "npm ci"
      cache:
        enable: true
        key: "node-{{ checksum package-lock.json }}"
        paths:
          - node_modules
          
    - name: npm-build
      command: "npm run build"
      depends_on: [npm-install]
      artifacts:
        - path: dist/**/*
          type: directory
          name: frontend
```

### Example 3: Multi-Stage Build

```yaml
pipeline:
  build:
    - name: deps
      command: "go mod download"
      cache:
        enable: true
        key: "deps-{{ checksum go.sum }}"
        
    - name: compile
      command: "go build -o bin/app ./cmd/app"
      depends_on: [deps]
      artifacts:
        - path: bin/app
          type: file
          
    - name: test-build
      command: "go build -o bin/test ./cmd/test"
      depends_on: [deps]
      artifacts:
        - path: bin/test
          type: file
```

### Example 4: Cross-Platform Build

```yaml
pipeline:
  build:
    - name: build-all-platforms
      matrix:
        include:
          - platform: linux/amd64
            output: bin/linux-x64/app
          - platform: linux/arm64
            output: bin/linux-arm64/app
          - platform: darwin/universal
            output: bin/macos-universal/app
      command: |
        GOOS={{.OS}} GOARCH={{.Arch}} go build \
          -o {{.output}} ./cmd/app
      artifacts:
        - path: bin/**/*
          type: directory
```

## References

- @ref:specs/pipeline.spec.dir/build
- SIP 13: Pipeline System
- SIP 74: Pipeline Conditions
- SIP 53: Pipeline Hooks

## Copyright

This document is in the public domain.
