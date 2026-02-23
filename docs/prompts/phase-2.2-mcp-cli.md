# Bootstrap Phase 2.2: MCP CLI

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 2.2 of the bootstrap process.

**Prerequisites**: 
- Phase 0 (Foundation) complete
- Phase 1 (Core Runtime) complete
- Phase 2.1 (MCP Server) complete

## Your Task
Implement the MCP CLI that provides command-line access to all MCP server functionality.

## Read These Specs First
1. `specs/mcp.spec.dir/cli.spec.md` - CLI specification
2. `specs/mcp.spec.md` - Main MCP spec
3. `src/mcp/server.ts` - Existing server implementation

## What to Build

### Files to Create
```
src/cli/
├── index.ts            # Main CLI entry point
├── commands/
│   ├── search.ts       # Search command
│   ├── get.ts          # Get spec command
│   ├── list.ts         # List specs command
│   ├── validate.ts     # Validate command
│   ├── generate.ts     # Generate command
│   └── server.ts       # Server mode command
└── utils.ts            # CLI utilities

bin/
└── speclang            # CLI executable
```

### Requirements

#### 1. CLI Commands

```bash
# Search specs
speclang search <query> [--tags tag1,tag2] [--layer N]

# Get spec by ID
speclang get <spec-id> [--content] [--blocks]

# List all specs
speclang list [--tags tag1,tag2] [--layer N] [--prefix @specs/auth]

# Validate specs
speclang validate [--fix]

# Generate code from specs
speclang generate [--target typescript] [--dry-run]

# Start MCP server
speclang server [--port 3000] [--daemon]

# Index management
speclang index [--refresh]

# Cascade control
speclang cascade status
speclang cascade trigger <spec-id>
speclang cascade abort
```

#### 2. Output Formats

```typescript
// Default: Human-readable
speclang search auth
// > Found 3 specs:
// >   @specs/auth (layer 3) - Authentication system
// >   @specs/auth/entities (layer 4) - Auth entities
// >   @specs/auth/operations (layer 4) - Auth operations

// JSON output
speclang search auth --json
// > {"results":[{"id":"@specs/auth","layer":3,"short":"Authentication system"},...]}

// Quiet mode (for scripting)
speclang search auth --quiet
// > @specs/auth
// > @specs/auth/entities
// > @specs/auth/operations
```

#### 3. Command Implementations

```typescript
// src/cli/commands/search.ts
export async function searchCommand(query: string, options: SearchOptions) {
  const db = await getDatabase();
  const results = await db.searchSpecs(query, {
    tags: options.tags,
    layer: options.layer,
    limit: options.limit || 10
  });
  
  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
  } else if (options.quiet) {
    results.forEach(r => console.log(r.id));
  } else {
    console.log(`Found ${results.length} specs:\n`);
    results.forEach(r => {
      console.log(`  ${r.id} (layer ${r.layer}) - ${r.short}`);
    });
  }
}

// src/cli/commands/get.ts
export async function getCommand(specId: string, options: GetOptions) {
  const spec = await getSpec(specId);
  
  if (!spec) {
    console.error(`Spec not found: ${specId}`);
    process.exit(1);
  }
  
  if (options.json) {
    console.log(JSON.stringify(spec, null, 2));
  } else {
    console.log(`# ${spec.id}`);
    console.log(`Version: ${spec.version}`);
    console.log(`Layer: ${spec.layer}`);
    console.log(`\n${spec.short}\n`);
    
    if (options.content) {
      console.log('---\n');
      console.log(spec.content);
    }
    
    if (options.blocks) {
      console.log('\nBlocks:');
      spec.blocks.forEach(b => {
        console.log(`  @block:${b.id} @kind:${b.kind}`);
      });
    }
  }
}
```

#### 4. Server Mode

```typescript
// src/cli/commands/server.ts
export async function serverCommand(options: ServerOptions) {
  const { startServer } = await import('../mcp/server.js');
  
  console.log(`Starting SpecLang MCP server on port ${options.port}...`);
  
  const server = await startServer({
    port: options.port,
    database: options.database,
    specsDir: options.specsDir
  });
  
  if (options.daemon) {
    // Fork to background
    console.log(`Server running in daemon mode (PID: ${process.pid})`);
    // ... daemon logic
  } else {
    // Run in foreground
    process.on('SIGINT', () => {
      console.log('\nShutting down...');
      server.close();
      process.exit(0);
    });
    
    await new Promise(() => {}); // Run forever
  }
}
```

#### 5. CLI Entry Point

```typescript
// src/cli/index.ts
import { Command } from 'commander';

const program = new Command();

program
  .name('speclang')
  .description('SpecLang - Specs are source code')
  .version('0.1.0');

program.command('search <query>')
  .description('Search specs')
  .option('--tags <tags>', 'Filter by tags (comma-separated)')
  .option('--layer <n>', 'Filter by layer', parseInt)
  .option('--json', 'JSON output')
  .option('--quiet', 'Quiet output (IDs only)')
  .action(searchCommand);

program.command('get <spec-id>')
  .description('Get spec by ID')
  .option('--content', 'Show full content')
  .option('--blocks', 'Show block list')
  .option('--json', 'JSON output')
  .action(getCommand);

// ... more commands

program.parse();
```

## Test Cases
1. Search finds correct specs
2. Get returns full spec details
3. List filters correctly
4. Validate catches errors
5. Generate produces code
6. Server starts and responds
7. All commands support --json output
8. Quiet mode works for scripting

## Validation
```bash
bun test tests/cli.test.ts
speclang search auth
speclang get @specs/core --content
speclang validate
```

## Output Format
After completing, output:
1. Commands implemented
2. Test results
3. Example usage for each command
