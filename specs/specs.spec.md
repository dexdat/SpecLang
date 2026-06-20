# speclang-header lines:10
id: "@speclang/specs"
version: 0.1.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [typescript, generated, auto-generated]
short: "MCP tool handler for spec operations"
status: draft
---

# Specs Tool Handler

Auto-generated spec for specs.ts from cascade.

## Overview

### @block::specstoolhandler @kind:entity

SpecsToolHandler:
  implements: IToolHandler
  purpose: Handle MCP tools for spec operations
  
  methods:
    - list(): Promise<SpecList>
    - get(id: string): Promise<Spec>
    - validate(id: string): Promise<ValidationResult>
    - search(query: string): Promise<Spec[]>

### @block::tools @kind:entity

Tools:
  speclang_specs_list:
    description: List all specs
    returns: Array of spec metadata
    
  speclang_specs_get:
    description: Get a specific spec
    params:
      - id: string
    returns: Spec content

### @block::examples @kind:entity

Examples:
  list:
    request:
      tool: speclang_specs_list
    response:
      specs: ["@specs/core", "@specs/indexer"]
      
  get:
    request:
      tool: speclang_specs_get
      params:
        id: "@specs/core"
    response:
      content: "..."
