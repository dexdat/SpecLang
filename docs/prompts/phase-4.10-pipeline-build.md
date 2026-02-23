# Bootstrap Phase 4.10: Pipeline Build Stages

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 4.10 of the bootstrap process.

**Prerequisites**: 
- Phase 4.1-4.9 (Pipeline system) complete
- Executor, stages, hooks, conditions implemented
- Recovery actions defined

## Your Task
Implement the build stage system for the pipeline. Build stages compile, bundle, and prepare generated code for testing and deployment.

## Read These Specs First
1. `specs/pipeline.spec.md` - Pipeline overview
2. `specs/stages.spec.md` - Stage definitions
3. `specs/conditions.spec.md` - Condition system

## What to Build

### Files to Create
```
src/pipeline/stages/
├── build/
│   ├── index.ts           # Build stage exports
│   ├── types.ts           # Build stage types
│   ├── compiler.ts        # Compilation stage
│   ├── bundler.ts         # Bundling stage
│   ├── linker.ts          # Linking stage
│   ├── cache.ts           # Build cache
│   └── strategies.ts      # Build strategies

tests/pipeline/
└── build.test.ts
```

### Requirements

#### 1. Build Stage Types

```typescript
// src/pipeline/stages/build/types.ts

export interface BuildStageConfig {
  name: string;
  type: BuildType;
  output: string;
  options?: BuildOptions;
  cache?: CacheConfig;
  depends_on?: string[];
}

export type BuildType = 
  | 'compile'
  | 'bundle'
  | 'link'
  | 'transpile'
  | 'compile+bundle';

export interface BuildOptions {
  minify?: boolean;
  sourceMap?: boolean;
  target?: string;
  platform?: 'node' | 'browser' | 'universal';
  format?: 'esm' | 'cjs' | 'iife';
  external?: string[];
  alias?: Record<string, string>;
  inject?: string[];
  treeShaking?: boolean;
  splitting?: boolean;
}

export interface CacheConfig {
  enabled: boolean;
  key?: string;
  paths?: string[];
  ttl?: number;
}

export interface BuildResult {
  stage: string;
  status: 'success' | 'failed' | 'skipped' | 'cached';
  outputFiles: string[];
  outputSize: number;
  duration: number;
  artifacts?: BuildArtifact[];
  error?: string;
}

export interface BuildArtifact {
  path: string;
  size: number;
  type: 'js' | 'css' | 'map' | 'declaration';
  hash: string;
}
```

#### 2. Build Stage Executor

```typescript
// src/pipeline/stages/build/compiler.ts

import { BuildStageConfig, BuildResult, BuildArtifact } from './types';
import { exec } from '../../utils/exec';
import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

export class CompilerStage {
  private cache: Map<string, CacheEntry> = new Map();
  
  async execute(config: BuildStageConfig): Promise<BuildResult> {
    const start = Date.now();
    
    // Check cache
    if (config.cache?.enabled) {
      const cached = await this.checkCache(config);
      if (cached) {
        return { ...cached, status: 'cached', duration: Date.now() - start };
      }
    }
    
    // Prepare output directory
    const outputDir = dirname(config.output);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    // Execute build based on type
    let result: BuildResult;
    
    switch (config.type) {
      case 'compile':
        result = await this.compile(config);
        break;
      case 'bundle':
        result = await this.bundle(config);
        break;
      case 'transpile':
        result = await this.transpile(config);
        break;
      case 'compile+bundle':
        result = await this.compileAndBundle(config);
        break;
      default:
        result = await this.compile(config);
    }
    
    // Cache result
    if (config.cache?.enabled && result.status === 'success') {
      await this.cacheResult(config, result);
    }
    
    result.duration = Date.now() - start;
    return result;
  }
  
  private async compile(config: BuildStageConfig): Promise<BuildResult> {
    const options = config.options || {};
    const args = [
      'tsc',
      '--outDir', dirname(config.output),
      '--declaration', options.sourceMap ? 'true' : 'false',
      '--sourceMap', options.sourceMap ? 'true' : 'false',
      '--target', options.target || 'ES2020',
      '--module', 'ESNext',
    ];
    
    if (options.platform === 'node') {
      args.push('--lib', 'ES2020,DOM');
    }
    
    try {
      await exec(args.join(' '));
      
      const outputFiles = await this.findOutputFiles(config.output);
      const artifacts = await this.createArtifacts(outputFiles);
      
      return {
        stage: config.name,
        status: 'success',
        outputFiles,
        outputSize: artifacts.reduce((sum, a) => sum + a.size, 0),
        artifacts,
      };
    } catch (error) {
      return {
        stage: config.name,
        status: 'failed',
        outputFiles: [],
        outputSize: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  private async bundle(config: BuildStageConfig): Promise<BuildResult> {
    const options = config.options || {};
    const args = [
      'esbuild',
      config.output,
      '--bundle',
      '--outfile', config.output,
      '--format', options.format || 'esm',
      '--platform', options.platform || 'node',
    ];
    
    if (options.minify) args.push('--minify');
    if (options.sourceMap) args.push('--sourcemap');
    if (options.treeShaking) args.push('--tree-shaking');
    if (options.external) {
      for (const ext of options.external) {
        args.push('--external', ext);
      }
    }
    if (options.alias) {
      for (const [key, value] of Object.entries(options.alias)) {
        args.push('--alias', `${key}=${value}`);
      }
    }
    
    try {
      await exec(args.join(' '));
      
      const outputFiles = await this.findOutputFiles(config.output);
      const artifacts = await this.createArtifacts(outputFiles);
      
      return {
        stage: config.name,
        status: 'success',
        outputFiles,
        outputSize: artifacts.reduce((sum, a) => sum + a.size, 0),
        artifacts,
      };
    } catch (error) {
      return {
        stage: config.name,
        status: 'failed',
        outputFiles: [],
        outputSize: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  private async transpile(config: BuildStageConfig): Promise<BuildResult> {
    const options = config.options || {};
    
    const args = [
      'tsc',
      '--outDir', dirname(config.output),
      '--transpileOnly', 'true',
    ];
    
    try {
      await exec(args.join(' '));
      
      const outputFiles = await this.findOutputFiles(config.output);
      const artifacts = await this.createArtifacts(outputFiles);
      
      return {
        stage: config.name,
        status: 'success',
        outputFiles,
        outputSize: artifacts.reduce((sum, a) => sum + a.size, 0),
        artifacts,
      };
    } catch (error) {
      return {
        stage: config.name,
        status: 'failed',
        outputFiles: [],
        outputSize: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  private async compileAndBundle(config: BuildStageConfig): Promise<BuildResult> {
    const compileResult = await this.compile(config);
    if (compileResult.status !== 'success') {
      return compileResult;
    }
    
    const bundleConfig: BuildStageConfig = {
      ...config,
      type: 'bundle',
      output: config.output.replace('.ts', '.js'),
    };
    
    return this.bundle(bundleConfig);
  }
  
  private async findOutputFiles(outputPath: string): Promise<string[]> {
    const dir = dirname(outputPath);
    const base = outputPath.replace(/\.[^.]+$/, '');
    const files: string[] = [];
    
    for (const ext of ['.js', '.js.map', '.d.ts', '.ts']) {
      const path = ext === '.ts' ? outputPath : `${base}${ext}`;
      if (existsSync(path)) {
        files.push(path);
      }
    }
    
    return files;
  }
  
  private async createArtifacts(files: string[]): Promise<BuildArtifact[]> {
    const artifacts: BuildArtifact[] = [];
    
    for (const file of files) {
      const content = readFileSync(file);
      const hash = createHash('sha256').update(content).digest('hex').slice(0, 8);
      
      artifacts.push({
        path: file,
        size: content.length,
        type: file.endsWith('.map') ? 'map' : 
              file.endsWith('.d.ts') ? 'declaration' : 'js',
        hash,
      });
    }
    
    return artifacts;
  }
  
  private async checkCache(config: BuildStageConfig): Promise<BuildResult | null> {
    const key = config.cache?.key || this.generateCacheKey(config);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (config.cache?.ttl) {
      const age = Date.now() - entry.timestamp;
      if (age > config.cache.ttl) {
        this.cache.delete(key);
        return null;
      }
    }
    
    return entry.result;
  }
  
  private async cacheResult(config: BuildStageConfig, result: BuildResult): Promise<void> {
    const key = config.cache?.key || this.generateCacheKey(config);
    this.cache.set(key, { result, timestamp: Date.now() });
  }
  
  private generateCacheKey(config: BuildStageConfig): string {
    const data = JSON.stringify({
      name: config.name,
      type: config.type,
      output: config.output,
      options: config.options,
    });
    return createHash('sha256').update(data).digest('hex').slice(0, 16);
  }
}

interface CacheEntry {
  result: BuildResult;
  timestamp: number;
}
```

#### 3. Build Strategies

```typescript
// src/pipeline/stages/build/strategies.ts

import { BuildStageConfig, BuildOptions } from './types';

export interface BuildStrategy {
  name: string;
  createConfig(output: string, options?: BuildOptions): BuildStageConfig;
}

export class IncrementalBuildStrategy implements BuildStrategy {
  name = 'incremental';
  
  createConfig(output: string, options?: BuildOptions): BuildStageConfig {
    return {
      name: 'incremental-build',
      type: 'transpile',
      output,
      options: {
        ...options,
        sourceMap: true,
      },
      cache: {
        enabled: true,
        paths: ['src/**/*.ts'],
        ttl: 3600000,
      },
    };
  }
}

export class ProductionBuildStrategy implements BuildStrategy {
  name = 'production';
  
  createConfig(output: string, options?: BuildOptions): BuildStageConfig {
    return {
      name: 'production-build',
      type: 'compile+bundle',
      output,
      options: {
        ...options,
        minify: true,
        sourceMap: false,
        treeShaking: true,
        target: 'ES2020',
      },
      cache: {
        enabled: false,
      },
    };
  }
}

export class DevelopmentBuildStrategy implements BuildStrategy {
  name = 'development';
  
  createConfig(output: string, options?: BuildOptions): BuildStageConfig {
    return {
      name: 'development-build',
      type: 'bundle',
      output,
      options: {
        ...options,
        minify: false,
        sourceMap: true,
        splitting: true,
        target: 'ES2020',
      },
      cache: {
        enabled: true,
        ttl: 300000,
      },
    };
  }
}

export class LibraryBuildStrategy implements BuildStrategy {
  name = 'library';
  
  createConfig(output: string, options?: BuildOptions): BuildStageConfig {
    return {
      name: 'library-build',
      type: 'compile',
      output,
      options: {
        ...options,
        format: 'esm',
        sourceMap: true,
        declaration: true,
      },
    };
  }
}

export const strategies = {
  incremental: new IncrementalBuildStrategy(),
  production: new ProductionBuildStrategy(),
  development: new DevelopmentBuildStrategy(),
  library: new LibraryBuildStrategy(),
  
  get(name: string): BuildStrategy | undefined {
    return strategies[name as keyof typeof strategies];
  },
};
```

#### 4. Build Configuration

```yaml
# build.yaml (extends pipeline config)

stages:
  - name: compile
    type: compile
    output: dist/index.js
    options:
      target: ES2020
      sourceMap: true
      declaration: true
    cache:
      enabled: true
      paths: [src/**/*.ts]
      ttl: 1h

  - name: bundle
    type: bundle
    output: dist/bundle.js
    depends_on: [compile]
    options:
      minify: true
      sourceMap: false
      treeShaking: true
      external: [react, react-dom]

  - name: types
    type: compile
    output: dist/types/index.d.ts
    depends_on: [compile]
    options:
      declaration: true
      emitDeclarationOnly: true
```

#### 5. CLI Commands

```bash
# Run build stages
speclang pipeline build

# Run specific build stage
speclang pipeline build --stage compile

# Build with strategy
speclang pipeline build --strategy production

# Clear build cache
speclang pipeline build --clear-cache

# Watch mode
speclang pipeline build --watch
```

## Test Cases
1. Compile stage produces JavaScript output
2. Bundle stage combines dependencies
3. Cache prevents redundant builds
4. Strategies produce correct configs
5. Build failures are properly reported
6. Artifacts include hashes
7. Incremental builds work
8. Production builds minify correctly

## Validation
```bash
bun test tests/pipeline/build.test.ts
speclang pipeline build --dry-run
```

## Output Format
After completing, output:
1. Build stage types defined
2. Compiler implemented
3. Strategies implemented
4. Cache system working
5. Test results
