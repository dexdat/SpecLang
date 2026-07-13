# speclang-header lines:13
id: "@speclang/tools/api"
version: 0.1.0
layer: 2
parent: "speclang/tools"

tags: [tools, api, functions]
imports: ["@speclang/core", "@speclang/opencode"]
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Agent Tools API
---

# Agent Tools API

## File Tools

### @tools/file-create

```speclang
# @block:tools/file-create @kind:entity
speclang_create_spec:
  description: "Create a new spec file"
  
  params:
    path: String           # where to create
    header: Object         # header fields
    content: String        # spec content
    
  returns:
    success: Boolean
    path: String
    error: String?
    
  side_effects:
    - writes file
    - updates SQLite
    - triggers inotify
  
  ownership: checked
```

### @tools/file-read

```speclang
# @block:tools/file-read @kind:entity
speclang_read_file:
  description: "Read full file content"
  
  params:
    path: String
  
  returns:
    content: String
    header: Object
    error: String?
    
  ownership: not required (read-only)
```

### @tools/file-read-header

```speclang
# @block:tools/file-read-header @kind:entity
speclang_read_header:
  description: "Read only header (efficient)"
  
  params:
    path: String
    
  returns:
    header: Object
    lines: Integer
    
  optimization: reads only first N+2 lines
  ownership: not required
```

### @tools/file-update

```speclang
# @block:tools/file-update @kind:entity
speclang_update_spec:
  description: "Update existing spec"
  
  params:
    path: String
    header: Object?        # optional updates
    content: String?       # optional content
    append: Boolean?       # append vs replace
    
  returns:
    success: Boolean
    error: String?
    
  ownership: checked
```

### @tools/file-delete

```speclang
# @block:tools/file-delete @kind:entity
speclang_delete_spec:
  description: "Delete a spec file"
  
  params:
    path: String
    
  returns:
    success: Boolean
    dependents: String[]   # warns about dependents
    
  ownership: checked
  warning: checks for dependents first
```

---

## Query Tools

### @tools/find-dependents

```speclang
# @block:tools/find-dependents @kind:entity
speclang_find_dependents:
  description: "Find all specs that depend on this one"
  
  params:
    id: String             # @ref to search
    
  returns:
    dependents: 
      - path: String
        id: String
        level: Integer
        
  implementation: SQLite query
```

### @tools/find-dependencies

```speclang
# @block:tools/find-dependencies @kind:entity
speclang_find_dependencies:
  description: "Find all specs this one depends on"
  
  params:
    path: String
    
  returns:
    dependencies:
      - path: String
        id: String
        resolved: Boolean
```

### @tools/find-by-tag

```speclang
# @block:tools/find-by-tag @kind:entity
speclang_find_by_tag:
  description: "Find specs by tag"
  
  params:
    tag: String
    level?: Integer        # optional filter
    
  returns:
    specs:
      - path: String
        id: String
        short: String
```

### @tools/find-by-level

```speclang
# @block:tools/find-by-level @kind:entity
speclang_find_by_level:
  description: "Find specs at a specific level"
  
  params:
    level: Integer
    parent?: String        # optional filter
    
  returns:
    specs:
      - path: String
        id: String
        short: String
```

### @tools/get-tree

```speclang
# @block:tools/get-tree @kind:entity
speclang_get_tree:
  description: "Get parent and children of a spec"
  
  params:
    path: String
    depth?: Integer        # how deep (default 1)
    
  returns:
    tree:
      path: String
      id: String
      parent: Object?
      children: Object[]
```

---

## Graph Tools

### @tools/graph-dependents

```speclang
# @block:tools/graph-dependents @kind:entity
speclang_graph_dependents:
  description: "Get full dependency graph from a spec"
  
  params:
    id: String
    max_depth?: Integer
    
  returns:
    graph:
      nodes: Object[]
      edges: Object[]
      
  format: suitable for mermaid
```

### @tools/graph-ancestors

```speclang
# @block:tools/graph-ancestors @kind:entity
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

---

## Validation Tools

### @tools/validate-header

```speclang
# @block:tools/validate-header @kind:entity
speclang_validate_header:
  description: "Validate a header"
  
  params:
    header: Object
    
  returns:
    valid: Boolean
    errors: String[]
    warnings: String[]
```

### @tools/validate-refs

```speclang
# @block:tools/validate-refs @kind:entity
speclang_validate_refs:
  description: "Check all refs in a spec exist"
  
  params:
    path: String
    
  returns:
    valid: Boolean
    broken_refs: String[]
```

---

## Cascade Tools

### @tools/trigger-cascade

```speclang
# @block:tools/trigger-cascade @kind:entity
speclang_trigger_cascade:
  description: "Manually trigger cascade from a file"
  
  params:
    path: String
    
  returns:
    cascade_id: String
    status: String
    
  note: usually automatic, but can be manual
```

### @tools/cascade-status

```speclang
# @block:tools/cascade-status @kind:entity
speclang_cascade_status:
  description: "Check current cascade status"
  
  params: {}
  
  returns:
    active: Boolean
    depth: Integer
    files_changed: Integer
    last_change: String
```

---

## Git Tools

### @tools/git-commit

```speclang
# @block:tools/git-commit @kind:entity
speclang_git_commit:
  description: "Commit changed files"
  
  params:
    files: String[]        # files to commit
    message: String        # commit message
    
  returns:
    commit_hash: String
    success: Boolean
    
  note: usually automatic on agent finish
```

### @tools/git-status

```speclang
# @block:tools/git-status @kind:entity
speclang_git_status:
  description: "Check git status"
  
  params: {}
  
  returns:
    modified: String[]
    added: String[]
    deleted: String[]
```

---

## Pipeline Tools

### @tools/run-pipeline

```speclang
# @block:tools/run-pipeline @kind:entity
speclang_run_pipeline:
  description: "Run the build pipeline"
  
  params:
    stages?: String[]      # specific stages, or all
    
  returns:
    success: Boolean
    results:
      - stage: String
        status: String
        output: String
        duration: Integer
        
  note: usually automatic on convergence
```

### @tools/run-tests

```speclang
# @block:tools/run-tests @kind:entity
speclang_run_tests:
  description: "Run test suite"
  
  params:
    filter?: String        # optional filter
    
  returns:
    passed: Integer
    failed: Integer
    skipped: Integer
    results: Object[]
```

---

## Session Tools

### @tools/session-info

```speclang
# @block:tools/session-info @kind:entity
speclang_session_info:
  description: "Get current session info"
  
  params: {}
  
  returns:
    session_id: String
    agent: String
    owns: String[]
    status: String
```

### @tools/sessions-list

```speclang
# @block:tools/sessions-list @kind:entity
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

