# Bootstrap Phase 0.5: Configuration System

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.5 of the bootstrap process.

**Prerequisites**: 
- Phase 0.1 (SQLite Database) complete
- Phase 0.2 (Header Parser) complete
- Phase 0.3 (Indexer) complete
- Phase 0.4 (Workflow) complete

## Your Task
Implement the configuration system that controls SpecLang behavior via project.scl and .speclangrc files.

## Read These Specs First
1. `specs/config.spec.md` - Main config overview
2. `specs/config.spec.dir/schema.spec.md` - Schema definitions
3. `specs/config.spec.dir/defaults.spec.md` - Defaults and examples

## What to Build

### Files to Create
```
src/config/
├── index.ts            # Main config loader
├── schema.ts           # TypeScript types for all config
├── loader.ts           # Load from project.scl + .speclangrc
├── validator.ts        # Validate config values
├── defaults.ts         # Default values
└── merger.ts           # Merge user config with defaults

tests/
└── config.test.ts      # Config tests
```

### Requirements

#### 1. Top-Level Structure (from schema.spec.md)
```typescript
interface ProjectConfig {
  metadata: {
    name: string;
    version: string;      // Semver
    description: string;
  };
  targets: Language[];    // ['go', 'typescript', etc.]
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

#### 2. Watcher Configuration
```typescript
interface WatcherConfig {
  patterns: string[];     // Glob patterns to watch
  ignore: {
    uses: string;         // ".gitignore"
    plus: string[];       // Additional ignores
  };
  debounce: number;       // Batch rapid changes (ms)
}
```

Default patterns:
- `**/*.spec.{md,yaml,yml,scl}`
- `**/*.{go,ts,js,py,rs,java}.spec`
- `**/project.scl`
- `**/build.{scl,yaml}`

#### 3. Split Configuration
```typescript
interface SplitConfig {
  max_tokens: number;     // Token limit before split
  max_lines: number;      // Line limit before split
  max_chars: number;      // Character limit before split
  budget_overhead: number; // Extra tokens for headers/refs
  strategy: 'smart' | 'by-section' | 'by-token';
}
```

Defaults: 10000 tokens, 800 lines, 60000 chars

#### 4. Embedding Configuration
```typescript
interface EmbeddingConfig {
  enabled: boolean;
  model: string;          // e.g., "openai/text-embedding-3-small"
  dimensions: number;     // Vector dimensions
  batch_size: number;
}
```

#### 5. Database Configuration
```typescript
interface DatabaseConfig {
  mode: string;           // WAL
  synchronous: string;    // NORMAL
  cache_size: number;     // 10000
  temp_store: string;     // MEMORY
}
```

#### 6. Cascade Configuration
```typescript
interface CascadeConfig {
  quiet_period: number;   // Seconds of no changes to trigger convergence
  max_depth: number;      // Max cascade depth (safety)
  max_files: number;      // Max files changed per cascade (safety)
}
```

Defaults: 30s quiet, 50 max depth, 1000 max files

#### 7. Per-Agent Configuration
```typescript
interface AgentsConfig {
  [agentName: string]: {
    max_tokens?: number;
    max_lines?: number;
    max_chars?: number;
    model?: string;
    temperature?: number;
  };
}
```

#### 8. Config Loading Priority
1. Defaults (hardcoded)
2. .speclangrc (project-level overrides)
3. project.scl config section (highest priority)

#### 9. Environment Variable Support
```bash
SPECLANG_DB_MODE=WAL
SPECLANG_EMBEDDING_MODEL=openai/text-embedding-3-small
SPECLANG_DEBOUNCE=100
```

### Code Quality
- Use `zod` or similar for validation
- All config typed with JSDoc
- Clear error messages for invalid config
- Reference spec blocks in comments

## Validation
```bash
bun test tests/config.test.ts
speclang config validate
speclang config show
```

## Output Format
After completing, output:
1. List of files created
2. Test results
3. Any deviations from the spec (with justification)
