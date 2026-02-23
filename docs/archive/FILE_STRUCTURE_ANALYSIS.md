# File Structure Analysis & Clarifications

## Current Issues Identified

### 1. **File Naming Ambiguity**
- Current: Multiple patterns (`*.spec.md`, `*.spec.yaml`, `*.scl`, `*.{ext}.spec`)
- Issue: Unclear which to use when, especially for final code-mapping specs
- Need: Clear rule: "Last spec before code is always YAML"

### 2. **Directory Structure Confusion**
- Current: `.spec.dir/` folders for sub-specs, but unclear depth limits
- Issue: Can users create `{name}.spec.dir/{name2}.spec.dir/{name3}.spec.md`?
- Need: Explicit statement: "Any depth allowed, no artificial limits"

### 3. **Cascade Triggering Unclear**
- Current: `speclangd` watches files, but queue system poorly documented
- Issue: How does queue track "what files need updating" vs "what triggered"?
- Need: Clear queue data structure and algorithm

### 4. **Agent Assignment Rules**
- Current: Pattern-based ownership in `agent-protocol.spec.md`
- Issue: How does file type determine which agent is used?
- Need: Explicit mapping table

### 5. **Single-File Edit Enforcement**
- Current: OpenCode plugin with ownership guard
- Issue: How does agent "submit tool/command" to create new file?
- Need: Tool specification for file creation

### 6. **YAML Schema for Final Specs**
- Current: `*.{ext}.spec` files exist but schema undefined
- Issue: No schema to generate boilerplate code for models
- Need: YAML schema definition for code-mapping specs

### 7. **Concurrency & Throttling**
- Current: Multiple agents can run, but throttling undefined
- Issue: How to protect service limits and host machine?
- Need: Throttling configuration and queue management

## Required Documentation Updates

### 1. **Update `000-bootstrap.md`**
- Add explicit file creation workflow
- Clarify directory depth rules
- Add queue system explanation

### 2. **Update `file-naming.spec.md`**
- Add rule: "Final spec before code is always YAML"
- Add YAML schema section
- Clarify when to use each format

### 3. **Update `cascade.spec.md`**
- Add queue data structure
- Add trigger resolution algorithm
- Add concurrency/throttling rules

### 4. **Update `agent-protocol.spec.md`**
- Add tool specification for file creation
- Clarify single-file edit enforcement
- Add agent assignment table

### 5. **Create `queue-system.spec.md`**
- New spec for queue data structures
- Trigger resolution algorithm
- Throttling configuration

### 6. **Create `yaml-schema.spec.md`**
- New spec for YAML schema of final specs
- Boilerplate generation rules
- Code-mapping specifications

## Key Principles to Clarify

### 1. **File Creation Flow**
```
User/AI creates {name}.spec.md or {name}.spec.dir/{sub}.spec.md
  ↓
speclangd detects change, reads header
  ↓
Adds to queue: (trigger_file, affected_files[])
  ↓
For each affected file: assign owning agent
  ↓
Agent runs: reads any file, edits only owned file
  ↓
Agent can create new file via tool call
  ↓
New file triggers new cascade cycle
```

### 2. **Queue Data Structure**
```yaml
queue_item:
  trigger_file: "specs/auth.spec.md"
  timestamp: "2026-02-22T10:00:00Z"
  affected_files:
    - file: "specs/auth/entities.spec.yaml"
      agent: "spec-writer"
      priority: 1
    - file: "specs/auth/handler.go.spec"
      agent: "code-gen"
      priority: 2
  depth: 0
  cascade_id: "cascade-001"
```

### 3. **Agent Assignment Table**
| File Pattern | Owning Agent | Purpose |
|-------------|-------------|---------|
| `*.spec.md` (layer 0-2) | spec-writer | High-level design |
| `*.spec.yaml` (layer 3-9) | spec-writer | Detailed specs |
| `*.{ext}.spec` (layer 10) | code-gen | Direct code mapping |
| `*.test.spec.md` | test-writer | Test specifications |
| `generated/**/*` | (read-only) | Generated code |

### 4. **File Creation Tool**
```yaml
tool: create_spec_file
parameters:
  file_path: "specs/auth/handler.go.spec"
  headers:
    id: "@generated/auth/handler-go"
    version: "0.1.0"
    layer: 10
    produces: "generated/go/auth/handler.go"
    agent_support: "agent_autonomous"
  content: |
    # YAML schema content...
```

### 5. **YAML Schema for Final Specs**
```yaml
# speclang-header lines:20
id: "@generated/{domain}/{name}"
version: "1.0.0"
layer: 10
produces: "generated/{lang}/{path}/{name}.{ext}"
agent_support: "agent_autonomous"
---
# Schema-defined sections
contracts:
  apis:
    - name: "auth-api"
      url: "https://api.example.com/auth"
      methods: ["POST"]
      
entities:
  - name: "User"
    fields:
      - name: "id"
        type: "string"
        required: true
        
operations:
  - name: "login"
    signature: "(email: string, password: string) => Promise<Token>"
    steps:
      - validate_input
      - call_api: "auth-api"
      - return_token
```

## Next Steps

1. **Update existing specs** with clarifications
2. **Create missing specs** (queue-system, yaml-schema)
3. **Test documentation** with actual agent implementation
4. **Fix YAML header issues** (45 files with unquoted @ values)