# speclang-header lines:11
id: "@speclang/scripts-generate-mcp-server"
version: 0.1.0
layer: 2
tags: [scripts, generation, mcp]
parent: ""@ref:speclang/scriptsstatus: draft
project_level: Alpha
agent_support: agent_assisted
short: Generate MCP Server Script
target: scripts/generate_mcp_server.py
---

# Generate MCP Server Script

Generates MCP server implementation from spec definitions. Creates a complete TypeScript MCP server that follows the Model Context Protocol specification.

## Overview

```speclang
# @block:overview @kind:note
The generate-mcp-server script takes a spec file (or set of specs) and generates
a complete MCP server implementation. It parses the spec definitions for tools,
resources, and prompts, then outputs a runnable TypeScript MCP server.
```

## Purpose

```speclang
# @block:purpose @kind:note
MCP servers provide programmatic access to SpecLang functionality. This script
automates the boilerplate of creating MCP servers by:
1. Extracting tool definitions from specs
2. Generating TypeScript server code
3. Creating proper MCP protocol handlers
4. Setting up stdio and HTTP transport layers
```

## Input Specification

```speclang
# @block:input @kind:entity
InputSpec:
  formats:
    - .spec.md files with tool definitions
    - .spec.yaml with MCP tool resources
    - project.scl for full project servers
  
  required_fields:
    - tools: List of available MCP tools
    - name: Server name
    - version: Server version
  
  optional_fields:
    - description: Server description
    - resources: Available resources
    - prompts: Available prompts
    - run_mode: stdio, http, or both
```

## Output

```speclang
# @block:output @kind:entity
OutputFiles:
  main:
    - src/mcp/server.ts
    - src/mcp/tools.ts
    - src/mcp/resources.ts
    - src/mcp/types.ts
  
  config:
    - src/mcp/config.ts
    - package.json
  
  tests:
    - tests/mcp/server.test.ts
    - tests/mcp/tools.test.ts
```

## Implementation

```speclang
# @block:implementation @kind:function
def generate_mcp_server(spec_path: str, output_dir: str, options: dict) -> dict:
    """
    Generate MCP server implementation from spec.
    
    Args:
        spec_path: Path to spec file with MCP definitions
        output_dir: Directory to write generated files
        options: Generation options (typescript_version, run_mode, etc.)
    
    Returns:
        Dict with files_generated, tools_extracted, errors
    """
```

## Algorithm

```speclang
# @block:algorithm @kind:note
1. Parse input spec file(s)
2. Extract MCP definitions (tools, resources, prompts)
3. Generate TypeScript types from definitions
4. Create tool handler implementations
5. Generate server entry point with transport layers
6. Create package.json with dependencies
7. Generate test templates
8. Write all files to output directory
```

## Tool Generation

```speclang
# @block:tool-gen @kind:table
| Tool Type | Generated Code | Handler |
|-----------|---------------|---------|
| query | QueryTool class | SQL + FTS queries |
| trigger | TriggerTool class | Event emission |
| agent | AgentTool class | Session control |
| read | ReadTool class | File/resource read |
| write | WriteTool class | Spec modification |
```

## Transport Modes

```speclang
# @block:transport @kind:entity
TransportModes:
  stdio:
    description: Local communication with OpenCode
    protocol: JSON-RPC over stdio
    use_case: Editor integration
  
  http:
    description: HTTP server with SSE
    protocol: HTTP + Server-Sent Events
    use_case: Remote team access
  
  both:
    description: Both stdio and HTTP
    protocol: Combined
    use_case: Full-featured deployment
```

## Usage

```speclang
# @block:usage @kind:note
# Generate MCP server from a spec
python3 scripts/generate_mcp_server.py specs/my-api.spec.md

# Specify output directory
python3 scripts/generate_mcp_server.py specs/my-api.spec.md --output src/mcp/

# Generate with HTTP transport
python3 scripts/generate_mcp_server.py specs/my-api.spec.md --transport http

# Generate full project server
python3 scripts/generate_mcp_server.py specs/project.scl --output generated/mcp/

# Dry run to see what would be generated
python3 scripts/generate_mcp_server.py specs/my-api.spec.md --dry-run
```

## Example

```speclang
# @block:example @kind:note
Input spec (specs/auth-mcp.spec.md):
  # speclang-header lines:8
  id: @specs/auth-mcp
  ---
  
  # @block:tools @kind:entity
  Tools:
    - name: query_users
      description: Query user database
      params: { limit: number, offset: number }

Output (generated src/mcp/tools.ts):
  export class QueryUsersTool implements MCPTool {
    name = 'query_users';
    description = 'Query user database';
    
    async execute(params: QueryUsersParams): Promise<ToolResult> {
      // Generated implementation
    }
  }
```

## Related Specs

```speclang
# @block:refs @kind:note
- @ref:speclang/mcp - MCP server specification
- @ref:speclang/mcp.spec.dir/architecture - Server architecture
- @ref:speclang/mcp.spec.dir/cli - CLI interface
- @ref:speclang/scripts.generate-opencode-plugin - Related code generator
```
