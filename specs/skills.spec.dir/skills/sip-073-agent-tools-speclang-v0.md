---
name: sip-073-agent-tools-speclang-v0
title: "SIP 73: Agent Tools API"
version: 0.1.0
description: Tool interface and implementations for SpecLang agents
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 73: Agent Tools API

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the Agent Tools API—the interface and implementations agents use to interact with specs, files, and the build system.

### Quick Start

Tool categories:
1. **Spec Tools**: read, write, search specs
2. **File Tools**: read, write, list files
3. **Graph Tools**: dependencies, dependents
4. **Cascade Tools**: trigger, status
5. **Registry Tools**: tool registration

### When to Read This

- **Building tools:** Implementing new tools
- **Using tools:** Available tool interface
- **Debugging:** Tool call failures

### Related SIPs

- SIP 29: Agent Tools (overview)
- SIP 6: Agent Protocol
- SIP 50: MCP Tools

## Abstract

This SIP details the Agent Tools API—the interface definition, registry, and standard tool implementations. Tools provide the boundary between agents and the spec system, enforcing ownership, logging operations, and providing efficient access patterns.

## Motivation

A tool-based API is needed because:
- Agents need controlled access to specs
- Operations must be logged and auditable
- Ownership must be enforced
- Efficient patterns (header-only reads) reduce overhead

## Rationale

**Tool-Based Access:**

1. **Safe**: All operations tracked
2. **Efficient**: Optimized read patterns
3. **Auditable**: Complete history
4. **Extensible**: Plugins add tools

This matches production practices—no direct DB access.

## Specification

### Tool Interface

```yaml
ToolInterface:
  Tool:
    name: String
    description: String
    inputSchema: JSONSchema
    outputSchema: JSONSchema
    handler: ToolHandler
    ownership: "required" | "not_required"
    sideEffects: String[]
    
  ToolHandler:
    signature: "async (input: Any, context: ToolContext) -> ToolResult"
    
  ToolContext:
    sessionId: String
    agentId: String
    ownedFiles: String[]
    config: Config
    db: SQLite
    
  ToolResult:
    success: Bool
    data: Any?
    error: String?
```

### Tool Registry

```yaml
ToolRegistry:
  SimpleToolRegistry:
    description: "Basic in-memory tool registry"
    methods:
      register: (name: String, tool: Tool) -> Void
      get: (name: String) -> Tool?
      list: () -> Tool[]
      has: (name: String) -> Bool
      
  createToolRegistry:
    description: "Factory for tool registry with standard tools"
    returns: ToolRegistry
```

### Spec Tools

```yaml
SpecTools:
  readSpec:
    description: "Read a spec file by ID or path"
    input:
      id: String
    output:
      content: String
      header: Object
      blocks: Block[]
    ownership: not_required
    
  writeSpec:
    description: "Write or update a spec file"
    input:
      id: String
      header: Object?
      content: String?
      append: Bool?
    output:
      success: Bool
      path: String
    ownership: required
    sideEffects: [writes_file, updates_db]
    
  searchSpecs:
    description: "Search specs by content or metadata"
    input:
      query: String
      tags: String[]?
      level: Int?
    output:
      results:
        - path: String
          id: String
          score: Float
          snippet: String
    ownership: not_required
```

### File Tools

```yaml
FileTools:
  readFile:
    description: "Read any file content"
    input:
      path: String
    output:
      content: String
      exists: Bool
    ownership: not_required
    
  writeFile:
    description: "Write content to a file"
    input:
      path: String
      content: String
    output:
      success: Bool
    ownership: required
    sideEffects: [writes_file]
    
  listFiles:
    description: "List files in directory"
    input:
      path: String
      pattern: String?
      recursive: Bool?
    output:
      files:
        - path: String
          name: String
          isDirectory: Bool
    ownership: not_required
```

### Graph Tools

```yaml
GraphTools:
  getDependencies:
    description: "Get specs this one depends on"
    input:
      id: String
    output:
      dependencies:
        - id: String
          path: String
          resolved: Bool
    ownership: not_required
    
  getDependents:
    description: "Get specs that depend on this one"
    input:
      id: String
    output:
      dependents:
        - id: String
          path: String
          level: Int
    ownership: not_required
    
  impactAnalysis:
    description: "Analyze impact of changing a spec"
    input:
      id: String
    output:
      affected:
        - id: String
          path: String
          impactLevel: "direct" | "indirect"
          estimatedChanges: Int
    ownership: not_required
```

### Cascade Tools

```yaml
CascadeTools:
  triggerCascade:
    description: "Manually trigger cascade from a file"
    input:
      path: String?
    output:
      cascadeId: String
      status: String
    ownership: not_required
    sideEffects: [triggers_cascade]
    
  cascadeStatus:
    description: "Check current cascade status"
    input: {}
    output:
      active: Bool
      depth: Int
      filesChanged: Int
      lastChange: String
    ownership: not_required
```

### Standard Tools Factory

```yaml
StandardToolsFactory:
  getStandardTools:
    description: "Get list of all standard tools"
    returns: Tool[]
    
  createToolRegistry:
    description: "Create registry with all standard tools registered"
    returns: ToolRegistry
```

## Examples

### Example 1: Implementing a Custom Tool

```typescript
const customTool: Tool = {
  name: "speclang_count_blocks",
  description: "Count blocks in a spec",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string" }
    },
    required: ["id"]
  },
  outputSchema: {
    type: "object",
    properties: {
      count: { type: "number" }
    }
  },
  handler: async (input, context) => {
    const spec = await context.db.getSpec(input.id);
    const blocks = parseBlocks(spec.content);
    return { success: true, data: { count: blocks.length } };
  },
  ownership: "not_required",
  sideEffects: []
};
```

### Example 2: Using Tools in Agent

```yaml
agent_workflow:
  steps:
    - tool: readSpec
      input: { id: "@specs/auth" }
      
    - tool: getDependents
      input: { id: "@specs/auth" }
      
    - tool: writeSpec
      input:
        id: "@specs/auth.spec.dir/login"
        content: "..."
```

### Example 3: Tool Registry Usage

```typescript
const registry = createToolRegistry();

const tools = registry.list();
console.log(`Available tools: ${tools.length}`);

const readTool = registry.get("speclang_read_spec");
await readTool.handler({ id: "@specs/main" }, context);
```

## Implementation

```typescript
export interface Tool {
  name: string;
  description: string;
  inputSchema: any;
  outputSchema: any;
  handler: ToolHandler;
  ownership: "required" | "not_required";
  sideEffects: string[];
}

export type ToolHandler = async (
  input: any, 
  context: ToolContext
) => ToolResult;

export interface ToolContext {
  sessionId: string;
  agentId: string;
  ownedFiles: string[];
  config: Config;
  db: SQLite;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class SimpleToolRegistry implements ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  
  register(name: string, tool: Tool): void {
    this.tools.set(name, tool);
  }
  
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }
  
  list(): Tool[] {
    return Array.from(this.tools.values());
  }
  
  has(name: string): boolean {
    return this.tools.has(name);
  }
}

export function getStandardTools(): Tool[] {
  return [
    readSpecTool,
    writeSpecTool,
    searchSpecsTool,
    readFileTool,
    writeFileTool,
    listFilesTool,
    getDependenciesTool,
    getDependentsTool,
    impactAnalysisTool,
    triggerCascadeTool,
    cascadeStatusTool,
  ];
}

export function createToolRegistry(): ToolRegistry {
  const registry = new SimpleToolRegistry();
  for (const tool of getStandardTools()) {
    registry.register(tool.name, tool);
  }
  return registry;
}
```

## References

- "@ref:speclang/tools
- @ref:speclang/agent-protocol
- SIP 29: Agent Tools (overview)
- SIP 50: MCP Tools

## Copyright

This document is in the public domain.
