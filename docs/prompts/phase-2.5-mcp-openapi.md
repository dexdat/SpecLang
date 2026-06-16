# Bootstrap Phase 2.5: OpenAPI-MCP Generator Integration

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 2.5 of the bootstrap process.

**Prerequisites**: 
- Phase 0-2 complete
- MCP server operational with tools
- CLI infrastructure in place
- Pipeline system working

## Your Task
Integrate SpecLang with openapi-mcp-generator to automatically generate MCP servers from OpenAPI specifications. This allows users to expose any REST API as MCP tools.

## Read These Specs First
1. `specs/mcp/openapi-generation.spec.md` - Main integration spec
2. `specs/mcp.spec.md` - MCP server architecture
3. `specs/cli.spec.md` - CLI structure
4. `specs/pipeline.spec.md` - Pipeline integration

## What to Build

### Files to Create
```
src/mcp/
├── openapi/
│   ├── index.ts              # Main exports
│   ├── generator.ts          # MCP server generator
│   ├── validator.ts          # OpenAPI spec validation
│   ├── types.ts              # TypeScript types
│   ├── registrar.ts          # Tool registration
│   └── config.ts             # Configuration handling
│
src/cli/
└── commands/
    └── mcp-generate-openapi.ts  # CLI command

config/
└── openapi-mcp.yaml          # Default configuration

tests/
└── mcp-openapi.test.ts
```

### Requirements

#### 1. Types (types.ts)

```typescript
interface OpenAPISpecConfig {
  name: string;
  spec: string; // Path or URL
  output: string; // Relative output path
  transport: 'stdio' | 'web' | 'streamable-http';
  port?: number;
  auto_register: boolean;
  watch: boolean;
  base_url?: string;
}

interface OpenAPIGenerationOptions {
  input: string; // Path or URL to OpenAPI spec
  output: string; // Output directory
  transport?: 'stdio' | 'web' | 'streamable-http';
  port?: number;
  serverName?: string;
  baseUrl?: string;
  force?: boolean;
  register?: boolean;
  dryRun?: boolean;
}

interface GeneratedMCPServer {
  name: string;
  outputPath: string;
  tools: GeneratedTool[];
  transport: string;
  port?: number;
}

interface GeneratedTool {
  name: string;
  description: string;
  method: string;
  path: string;
  inputSchema: JSONSchema;
}

interface OpenAPIValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  operationCount: number;
  securitySchemes: string[];
}
```

#### 2. OpenAPI Validator (validator.ts)

```typescript
import SwaggerParser from '@apidevtools/swagger-parser';

export class OpenAPIValidator {
  async validate(specPath: string): Promise<OpenAPIValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Parse and validate spec
      const api = await SwaggerParser.validate(specPath);
      
      // Count operations
      let operationCount = 0;
      const securitySchemes = Object.keys(api.components?.securitySchemes || {});
      
      for (const [path, methods] of Object.entries(api.paths || {})) {
        for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
          if ((methods as any)[method]) {
            operationCount++;
            
            // Check for operationId
            if (!(methods as any)[method].operationId) {
              warnings.push(`Missing operationId: ${method.toUpperCase()} ${path}`);
            }
          }
        }
      }
      
      // Security checks
      if (operationCount > 100) {
        warnings.push(`Large number of operations (${operationCount}) may impact performance`);
      }
      
      // Check for external references
      const refs = this.extractRefs(api);
      const externalRefs = refs.filter(r => r.startsWith('http'));
      if (externalRefs.length > 0) {
        warnings.push(`External references found: ${externalRefs.length}`);
      }
      
      return {
        valid: true,
        errors,
        warnings,
        operationCount,
        securitySchemes
      };
    } catch (error: any) {
      errors.push(error.message);
      return {
        valid: false,
        errors,
        warnings,
        operationCount: 0,
        securitySchemes: []
      };
    }
  }
  
  private extractRefs(obj: any, refs: string[] = []): string[] {
    if (typeof obj !== 'object' || obj === null) return refs;
    
    if (obj.$ref) {
      refs.push(obj.$ref);
    }
    
    for (const value of Object.values(obj)) {
      this.extractRefs(value, refs);
    }
    
    return refs;
  }
}
```

#### 3. MCP Server Generator (generator.ts)

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import { OpenAPIValidator } from './validator';

const execAsync = promisify(exec);

export class OpenAPIGenerator {
  private validator: OpenAPIValidator;
  
  constructor() {
    this.validator = new OpenAPIValidator();
  }
  
  async generate(options: OpenAPIGenerationOptions): Promise<GeneratedMCPServer> {
    // 1. Validate spec
    if (!options.dryRun) {
      const validation = await this.validator.validate(options.input);
      
      if (!validation.valid) {
        throw new Error(`Invalid OpenAPI spec:\n${validation.errors.join('\n')}`);
      }
      
      if (validation.warnings.length > 0) {
        console.warn('Warnings:\n' + validation.warnings.join('\n'));
      }
    }
    
    // 2. Build command
    const args = this.buildArgs(options);
    
    // 3. Execute generator
    if (options.dryRun) {
      console.log('Dry run - would execute:');
      console.log(`npx openapi-mcp-generator ${args.join(' ')}`);
      
      return {
        name: options.serverName || 'openapi-mcp',
        outputPath: options.output,
        tools: [],
        transport: options.transport || 'stdio'
      };
    }
    
    // Ensure output directory exists
    await fs.mkdir(options.output, { recursive: true });
    
    // Run openapi-mcp-generator
    const { stdout, stderr } = await execAsync(
      `npx openapi-mcp-generator ${args.join(' ')}`,
      { cwd: options.output }
    );
    
    // 4. Parse generated tools
    const tools = await this.parseGeneratedTools(options.output);
    
    return {
      name: options.serverName || 'openapi-mcp',
      outputPath: options.output,
      tools,
      transport: options.transport || 'stdio',
      port: options.port
    };
  }
  
  private buildArgs(options: OpenAPIGenerationOptions): string[] {
    const args: string[] = [];
    
    args.push('--input', options.input);
    args.push('--output', '.');
    
    if (options.transport) {
      args.push('--transport', options.transport);
    }
    
    if (options.port) {
      args.push('--port', String(options.port));
    }
    
    if (options.serverName) {
      args.push('--name', options.serverName);
    }
    
    if (options.baseUrl) {
      args.push('--base-url', options.baseUrl);
    }
    
    return args;
  }
  
  private async parseGeneratedTools(outputPath: string): Promise<GeneratedTool[]> {
    // Parse generated TypeScript to extract tool definitions
    const indexPath = path.join(outputPath, 'src', 'index.ts');
    
    if (!await fs.pathExists(indexPath)) {
      return [];
    }
    
    const content = await fs.readFile(indexPath, 'utf-8');
    const tools: GeneratedTool[] = [];
    
    // Simple regex-based extraction (could use AST for more accuracy)
    const toolRegex = /server\.tool\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = toolRegex.exec(content)) !== null) {
      tools.push({
        name: match[1],
        description: match[2],
        method: 'unknown',
        path: 'unknown',
        inputSchema: {}
      });
    }
    
    return tools;
  }
}
```

#### 4. Tool Registrar (registrar.ts)

```typescript
import { MCPServer } from '../server';

export class ToolRegistrar {
  private server: MCPServer;
  
  constructor(server: MCPServer) {
    this.server = server;
  }
  
  async registerFromGenerated(
    generated: GeneratedMCPServer,
    options: { baseUrl?: string }
  ): Promise<void> {
    for (const tool of generated.tools) {
      await this.registerTool(tool, options);
    }
    
    console.log(`Registered ${generated.tools.length} tools from ${generated.name}`);
  }
  
  private async registerTool(
    tool: GeneratedTool,
    options: { baseUrl?: string }
  ): Promise<void> {
    this.server.registerTool({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      handler: async (args: any) => {
        // Build request to target API
        const url = `${options.baseUrl}${tool.path}`;
        
        const response = await fetch(url, {
          method: tool.method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: ['GET', 'DELETE'].includes(tool.method) 
            ? undefined 
            : JSON.stringify(args)
        });
        
        if (!response.ok) {
          return {
            success: false,
            error: `API error: ${response.status} ${response.statusText}`
          };
        }
        
        const data = await response.json();
        
        return {
          success: true,
          data
        };
      }
    });
  }
}
```

#### 5. Configuration (config.ts)

```typescript
import yaml from 'js-yaml';

const DEFAULT_CONFIG: OpenAPISpecConfig[] = [];

export async function loadConfig(configPath: string): Promise<OpenAPISpecConfig[]> {
  if (!await fs.pathExists(configPath)) {
    return DEFAULT_CONFIG;
  }
  
  const content = await fs.readFile(configPath, 'utf-8');
  const config = yaml.load(content) as { servers: OpenAPISpecConfig[] };
  
  return config.servers || [];
}

export async function saveConfig(configPath: string, servers: OpenAPISpecConfig[]): Promise<void> {
  const content = yaml.dump({ servers }, { defaultFlowType: false });
  await fs.writeFile(configPath, content);
}

export function getDefaultConfigPath(): string {
  return path.join(process.cwd(), '.speclang', 'openapi-mcp.yaml');
}
```

#### 6. CLI Command (mcp-generate-openapi.ts)

```typescript
import { Command } from 'commander';
import { OpenAPIGenerator } from '../../mcp/openapi/generator';
import { ToolRegistrar } from '../../mcp/openapi/registrar';
import { loadConfig, saveConfig, getDefaultConfigPath } from '../../mcp/openapi/config';

export const mcpGenerateOpenAPICommand = new Command('generate-openapi')
  .description('Generate MCP server from OpenAPI spec')
  .requiredOption('-i, --input <spec>', 'Path or URL to OpenAPI spec')
  .requiredOption('-o, --output <dir>', 'Output directory')
  .option('-t, --transport <type>', 'Transport mode', 'stdio')
  .option('-p, --port <number>', 'Port for web transports', parseInt)
  .option('-n, --server-name <name>', 'Server name')
  .option('-b, --base-url <url>', 'Base URL for API requests')
  .option('--force', 'Overwrite existing files')
  .option('--register', 'Auto-register with SpecLang MCP server')
  .option('--dry-run', 'Validate without generating')
  .option('--save', 'Save to configuration file')
  .action(async (options) => {
    const generator = new OpenAPIGenerator();
    
    try {
      console.log(`Generating MCP server from: ${options.input}`);
      
      const result = await generator.generate({
        input: options.input,
        output: options.output,
        transport: options.transport,
        port: options.port,
        serverName: options.serverName,
        baseUrl: options.baseUrl,
        force: options.force,
        register: options.register,
        dryRun: options.dryRun
      });
      
      console.log(`\nGenerated MCP server: ${result.name}`);
      console.log(`Output: ${result.outputPath}`);
      console.log(`Tools: ${result.tools.length}`);
      console.log(`Transport: ${result.transport}`);
      
      if (options.register && !options.dryRun) {
        const registrar = new ToolRegistrar(getMCPServer());
        await registrar.registerFromGenerated(result, { baseUrl: options.baseUrl });
      }
      
      if (options.save) {
        const configPath = getDefaultConfigPath();
        const existing = await loadConfig(configPath);
        
        existing.push({
          name: result.name,
          spec: options.input,
          output: options.output,
          transport: result.transport,
          port: result.port,
          auto_register: options.register || false,
          watch: false,
          base_url: options.baseUrl
        });
        
        await saveConfig(configPath, existing);
        console.log(`Saved to: ${configPath}`);
      }
      
    } catch (error: any) {
      console.error('Generation failed:', error.message);
      process.exit(1);
    }
  });

// Additional command: generate all from config
export const mcpGenerateAllCommand = new Command('generate-all')
  .description('Generate all MCP servers from configuration')
  .option('-c, --config <path>', 'Config file path', getDefaultConfigPath())
  .action(async (options) => {
    const servers = await loadConfig(options.config);
    
    if (servers.length === 0) {
      console.log('No servers configured. Add servers to .speclang/openapi-mcp.yaml');
      return;
    }
    
    const generator = new OpenAPIGenerator();
    
    for (const server of servers) {
      console.log(`\nGenerating: ${server.name}`);
      
      await generator.generate({
        input: server.spec,
        output: server.output,
        transport: server.transport,
        port: server.port,
        baseUrl: server.base_url
      });
    }
    
    console.log(`\nGenerated ${servers.length} MCP servers`);
  });
```

#### 7. Default Configuration (openapi-mcp.yaml)

```yaml
# OpenAPI-MCP Generator Configuration
# Each server entry configures MCP generation from an OpenAPI spec

servers:
  # Example: Petstore API
  # - name: petstore
  #   spec: ./api/petstore.yaml
  #   output: generated/mcp/petstore
  #   transport: stdio
  #   auto_register: false
  #   watch: false

defaults:
  transport: stdio
  output_base: generated/mcp-servers
```

#### 8. Pipeline Integration

```yaml
# Add to build.yaml
steps:
  - name: generate-mcp-servers
    run: speclang mcp generate-all
    watch:
      - "**/*.openapi.yaml"
      - "**/*.openapi.json"
      
  - name: build-mcp-servers
    run: |
      cd generated/mcp-servers
      for dir in */; do
        cd "$dir" && npm install && npm run build
      done
```

## Test Cases
1. Validate valid OpenAPI spec
2. Reject invalid OpenAPI spec
3. Generate MCP server from local file
4. Generate MCP server from URL
5. Dry-run reports without generating
6. Register tools with MCP server
7. Load and save configuration
8. Generate all from config file
9. Handle authentication propagation
10. Error handling for network failures

## Validation
```bash
# Test CLI command
speclang mcp generate-openapi -i ./test-petstore.yaml -o ./test-output --dry-run

# Generate and register
speclang mcp generate-openapi -i ./api.yaml -o ./generated/mcp/api --register

# Generate all from config
speclang mcp generate-all

# Run tests
bun test tests/mcp-openapi.test.ts
```

## Dependencies
```bash
bun add @apidevtools/swagger-parser js-yaml
```

## Output Format
After completing, output:
1. Files created
2. CLI commands implemented
3. Integration modes supported
4. Test results
