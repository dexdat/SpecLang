---
name: sip-029-tools-speclang-v0
title: "SIP 29: Agent Tools API"
version: 0.1.0
description: Tools available to SpecLang agents via the plugin
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 29: Agent Tools API

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the Agent Tools API—the interface agents use to interact with the spec system.

### Quick Start

Tool categories:
1. **File Tools**: create, read, update, delete specs
2. **Query Tools**: find dependents, dependencies, by tag/level
3. **Graph Tools**: dependency graphs, ancestor chains
4. **Validation Tools**: header validation, reference checking
5. **Git Tools**: commit, status
6. **Pipeline Tools**: run builds, tests

### When to Read This

- **Building agents:** What tools are available
- **Creating skills:** How to use tools in prompts
- **Debugging:** Why tool call failed

### Related SIPs

- SIP 6: Agent Protocol
- SIP 10: Daemon
- SIP 11: MCP Tools
- SIP 28: Cascade Protocol

## Abstract

This SIP defines the Agent Tools API—a comprehensive set of tools that SpecLang agents use to interact with specifications, the file system, and the build system. Agents don't directly access the filesystem; they use these tools for ownership enforcement, audit logging, error recovery, and efficient operations.

## Motivation

Direct filesystem access by agents has problems:
- No ownership tracking
- No audit trail
- No error recovery
- Inefficient operations

A tool-based approach provides:
- Ownership enforcement
- Audit logging
- Error recovery
- Efficient operations (e.g., read-header-only)

## Rationale

**Tools > Direct Access:**

1. **Safe**: All operations tracked
2. **Efficient**: Header-only reads
3. **Recoverable**: Operations logged
4. **Auditable**: Complete history

This matches production practices—no direct DB access.

## Specification

### Tool Interface

```yaml
ToolInterface:
  common_fields:
    description: "Human-readable description"
    params: "Input parameters with types"
    returns: "Output with types"
    side_effects: "What changes"
    ownership: "Required or not"
    
  naming_convention:
    prefix: "speclang_"
    format: "speclang_{category}_{action}"
    examples:
      - speclang_create_spec
      - speclang_read_header
      - speclang_find_dependents
```

### File Tools

```yaml
FileTools:
  speclang_create_spec:
    description: "Create a new spec file"
    params:
      path: String
      header: Object
      content: String
    returns:
      success: Boolean
      path: String
      error: String?
    side_effects:
      - writes file
      - updates SQLite
      - triggers inotify
    ownership: checked
    
  speclang_read_file:
    description: "Read full file content"
    params:
      path: String
    returns:
      content: String
      header: Object
      error: String?
    ownership: not_required
    
  speclang_read_header:
    description: "Read only header (efficient)"
    params:
      path: String
    returns:
      header: Object
      lines: Integer
    optimization: "reads only first N+2 lines"
    ownership: not_required
    
  speclang_update_spec:
    description: "Update existing spec"
    params:
      path: String
      header: Object?
      content: String?
      append: Boolean?
    returns:
      success: Boolean
      error: String?
    ownership: checked
    
  speclang_delete_spec:
    description: "Delete a spec file"
    params:
      path: String
    returns:
      success: Boolean
      dependents: String[]
    ownership: checked
    warning: "checks for dependents first"
```

### Query Tools

```yaml
QueryTools:
  speclang_find_dependents:
    description: "Find all specs that depend on this one"
    params:
      id: String
    returns:
      dependents:
        - path: String
          id: String
          level: Integer
    implementation: "SQLite query"
    
  speclang_find_dependencies:
    description: "Find all specs this one depends on"
    params:
      path: String
    returns:
      dependencies:
        - path: String
          id: String
          resolved: Boolean
          
  speclang_find_by_tag:
    description: "Find specs by tag"
    params:
      tag: String
      level?: Integer
    returns:
      specs:
        - path: String
          id: String
          short: String
          
  speclang_find_by_level:
    description: "Find specs at a specific level"
    params:
      level: Integer
      parent?: String
    returns:
      specs:
        - path: String
          id: String
          short: String
          
  speclang_get_tree:
    description: "Get parent and children of a spec"
    params:
      path: String
      depth?: Integer
    returns:
      tree:
        path: String
        id: String
        parent: Object?
        children: Object[]
```

### Graph Tools

```yaml
GraphTools:
  speclang_graph_dependents:
    description: "Get full dependency graph from a spec"
    params:
      id: String
      max_depth?: Integer
    returns:
      graph:
        nodes: Object[]
        edges: Object[]
    format: "suitable for mermaid"
    
  speclang_graph_ancestors:
    description: "Get all ancestors back to north star"
    params:
      path: String
    returns:
      ancestors:
        - path: String
          id: String
          level: Integer
```

### Validation Tools

```yaml
ValidationTools:
  speclang_validate_header:
    description: "Validate a header"
    params:
      header: Object
    returns:
      valid: Boolean
      errors: String[]
      warnings: String[]
      
  speclang_validate_refs:
    description: "Check all refs in a spec exist"
    params:
      path: String
    returns:
      valid: Boolean
      broken_refs: String[]
```

### Cascade Tools

```yaml
CascadeTools:
  speclang_trigger_cascade:
    description: "Manually trigger cascade from a file"
    params:
      path: String
    returns:
      cascade_id: String
      status: String
    note: "usually automatic, but can be manual"
    
  speclang_cascade_status:
    description: "Check current cascade status"
    params: {}
    returns:
      active: Boolean
      depth: Integer
      files_changed: Integer
      last_change: String
```

### Git Tools

```yaml
GitTools:
  speclang_git_commit:
    description: "Commit changed files"
    params:
      files: String[]
      message: String
    returns:
      commit_hash: String
      success: Boolean
    note: "usually automatic on agent finish"
    
  speclang_git_status:
    description: "Check git status"
    params: {}
    returns:
      modified: String[]
      added: String[]
      deleted: String[]
```

### Pipeline Tools

```yaml
PipelineTools:
  speclang_run_pipeline:
    description: "Run the build pipeline"
    params:
      stages?: String[]
    returns:
      success: Boolean
      results:
        - stage: String
          status: String
          output: String
          duration: Integer
    note: "usually automatic on convergence"
    
  speclang_run_tests:
    description: "Run test suite"
    params:
      filter?: String
    returns:
      passed: Integer
      failed: Integer
      skipped: Integer
      results: Object[]
```

### Session Tools

```yaml
SessionTools:
  speclang_session_info:
    description: "Get current session info"
    params: {}
    returns:
      session_id: String
      agent: String
      owns: String[]
      status: String
      
  speclang_sessions_list:
    description: "List all active sessions"
    params: {}
    returns:
      sessions:
        - id: String
          agent: String
          status: String
          current_file: String
```

## Examples

### Example 1: Skill Usage in Prompt

```markdown
# SKILL.md example

You have access to these tools:

- speclang_create_spec: create new specs
- speclang_read_file: read any file
- speclang_read_header: read header only
- speclang_find_dependents: find what depends on a spec
- speclang_get_tree: get parent and children

Example usage:

Use speclang_read_header("specs/auth.scl") to quickly understand
the auth spec without reading the full file.

Use speclang_find_dependents("@specs/auth") to see what needs
updating when you change auth.
```

### Example 2: Efficient Header Read

```yaml
scenario: "Agent needs to check auth spec's level"

inefficient:
  tool: speclang_read_file
  params: { path: "specs/auth.spec.md" }
  result: "Returns 500 lines of content"
  
efficient:
  tool: speclang_read_header
  params: { path: "specs/auth.spec.md" }
  result:
    header:
      id: "@specs/auth"
      layer: 1
      tags: [auth, security]
    lines: 12
```

### Example 3: Dependency Query

```yaml
scenario: "Agent needs to know what depends on auth"

tool: speclang_find_dependents
params: { id: "@specs/auth" }

result:
  dependents:
    - path: "specs/auth.spec.dir/login.spec.yaml"
      id: "@specs/auth/login"
      level: 2
    - path: "specs/auth.spec.dir/jwt.spec.yaml"
      id: "@specs/auth/jwt"
      level: 2
    - path: "generated/go/auth/handler.go.spec"
      id: "@generated/auth/handler"
      level: 8
```

## Implementation

```python
class SpecLangTools:
    def __init__(self, db: SQLite, git: GitClient, config: Config):
        self.db = db
        self.git = git
        self.config = config
        
    def create_spec(self, path: str, header: dict, content: str) -> dict:
        self._check_ownership(path)
        self._validate_header(header)
        self._write_file(path, header, content)
        self._update_db(path, header)
        return {"success": True, "path": path}
        
    def read_header(self, path: str) -> dict:
        with open(path, 'r') as f:
            lines = f.readlines()
            header_lines = self._parse_header_line_count(lines[1])
            yaml_text = ''.join(lines[2:header_lines+2])
            return {"header": yaml.safe_load(yaml_text), "lines": header_lines}
            
    def find_dependents(self, id: str) -> dict:
        results = self.db.query("""
            SELECT path, id, layer FROM specs
            WHERE depends_on LIKE ?
        """, (f"%{id}%",))
        return {"dependents": results}
```

## References

- "@ref:speclang/tools
- @ref:speclang/agent-protocol
- SIP 6: Agent Protocol
- SIP 11: MCP Tools

## Copyright

This document is in the public domain.
