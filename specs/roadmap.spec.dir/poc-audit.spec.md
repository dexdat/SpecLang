# speclang-header lines:8
id: "@speclang/roadmap/poc-audit"
parent: "@ref:specs/roadmap"
version: 1.0.0
layer: 1
short: "Audit of specs needed for POC implementation"
tags: [roadmap, poc, audit, checklist, gaps]
---

# POC Implementation Spec Audit

Detailed audit of what specs exist vs what's needed to implement the POC.

## POC Architecture Components

### 1. File Watcher ✅ COMPLETE

**Purpose**: Detect file changes in `specs/`

**Existing Specs:**
- ✅ `specs/roadmap.spec.dir/poc.spec.dir/file-watcher.spec.md` - POC-specific watcher
- ✅ `specs/daemon.spec.dir/events.spec.md` - Event definitions
- ✅ `specs/daemon.spec.md` - Daemon overview (has watcher section)

**Implementation Location**: `src/daemon/file-watcher.ts`

**Status**: READY TO IMPLEMENT

---

### 2. Event Router ✅ COMPLETE

**Purpose**: Route file events to SimpleAgent

**Existing Specs:**
- ✅ `specs/roadmap.spec.dir/poc.spec.dir/event-routing.spec.md` - Simplified routing
- ✅ `specs/daemon.spec.dir/routing.spec.md` - Full routing (reference)

**Implementation Location**: `src/daemon/router.ts`

**Status**: READY TO IMPLEMENT

---

### 3. SimpleAgent ✅ COMPLETE

**Purpose**: Single agent that parses specs and generates code

**Existing Specs:**
- ✅ `specs/roadmap.spec.dir/poc.spec.dir/simple-agent.spec.md` - POC agent design
- ✅ `specs/agents.spec.md` - Agent overview
- ✅ `specs/agents.spec.dir/index.ts` - Agent implementation exists!

**Implementation Location**: `src/daemon/simple-agent.ts` (NEW FILE)

**Note**: Need to create simplified version for POC

**Status**: NEEDS SIMPLIFIED IMPLEMENTATION

---

### 4. Convergence Detector ✅ COMPLETE

**Purpose**: Detect when cascade has completed

**Existing Specs:**
- ✅ `specs/roadmap.spec.dir/poc.spec.dir/convergence.spec.md` - POC convergence
- ✅ `specs/daemon.spec.dir/convergence.spec.md` - Full convergence
- ✅ `specs/cascade.spec.dir/convergence.spec.md` - Cascade convergence

**Implementation Location**: `src/daemon/convergence.ts`

**Status**: READY TO IMPLEMENT

---

### 5. Code Generator ✅ COMPLETE

**Purpose**: Generate TypeScript from spec blocks

**Existing Specs:**
- ✅ `specs/roadmap.spec.dir/poc.spec.dir/code-generation.spec.md` - POC codegen
- ✅ `specs/codegen.spec.md` - Code generation overview
- ✅ `specs/typescript.spec.md` - TypeScript-specific generation

**Implementation Location**: `src/codegen/generator.ts`

**Note**: Implementation exists, may need POC-specific entry point

**Status**: MOSTLY READY

---

### 6. Parser ✅ COMPLETE

**Purpose**: Parse spec headers and @block: definitions

**Existing Specs:**
- ✅ `specs/parser.spec.md` - Parser overview
- ✅ `specs/headers.spec.md` - Header format
- ✅ `specs/parser.spec.dir/*.ts` - Implementation exists!

**Implementation Location**: `src/parser/*.ts`

**Status**: ALREADY IMPLEMENTED

---

### 7. Symlink Manager ✅ COMPLETE

**Purpose**: Create/update symlinks in `src/`

**Existing Specs:**
- ✅ `specs/symlinks.spec.md` - Symlink management
- ✅ `specs/symlinks.spec.dir/*.ts` - Implementation exists!

**Implementation Location**: `src/symlinks/manager.ts`

**Status**: ALREADY IMPLEMENTED

---

## What's Missing for POC?

### ❌ Main Entry Point (speclangd)

**Missing**: Simple daemon entry point for POC

**Need**: `src/daemon/poc-daemon.ts`
```typescript
// Simple daemon that wires everything together
export class PocDaemon {
  async start() {
    const watcher = new FileWatcher();
    const agent = new SimpleAgent();
    const router = new EventRouter(agent);
    const convergence = new ConvergenceDetector();
    
    // Wire events
    watcher.on('change', (e) => {
      convergence.onFileChange(e.path);
      router.route(e);
    });
    
    await watcher.watch('./specs');
  }
}
```

**Complexity**: LOW
**Estimated Time**: 2-3 hours

---

### ❌ SimpleAgent Implementation

**Missing**: Simplified agent for POC (existing agent is too complex)

**Need**: `src/daemon/simple-agent.ts`
```typescript
export class SimpleAgent {
  async onFileChanged(event: FileEvent) {
    const spec = parseSpec(event.path);
    for (const block of spec.blocks) {
      const code = generateCode(block);
      await writeFile(spec, block, code);
    }
    await updateSymlinks(spec.id);
  }
}
```

**Complexity**: MEDIUM
**Estimated Time**: 4-6 hours

---

### ❌ Block Parser

**Missing**: Parse @block: definitions from markdown

**Need**: Function to extract:
- Block ID
- Block kind (function, class, etc.)
- Description
- Parameters
- Return type

**Example Input:**
```markdown
### @block::greet @kind:function
Greets a user.

**Parameters:**
- name: string

**Returns:** string
```

**Example Output:**
```typescript
{
  id: 'greet',
  kind: 'function',
  description: 'Greets a user.',
  parameters: [{ name: 'name', type: 'string' }],
  returns: { type: 'string' }
}
```

**Complexity**: MEDIUM
**Estimated Time**: 3-4 hours

---

### ❌ Template System (Simplified)

**Missing**: Simple templates for code generation

**Need**: `src/codegen/templates/function.ts`
```typescript
export const functionTemplate = `
/**
 * {{description}}
 * @param {{name}} - {{paramDescription}}
 * @returns {{returnDescription}}
 */
export function {{name}}({{params}}): {{returnType}} {
  // TODO: Implement
  throw new Error('Not implemented');
}
`;
```

**Complexity**: LOW
**Estimated Time**: 2 hours

---

## Summary: POC Implementation Checklist

### ✅ Already Exists
- [x] FileWatcher spec
- [x] EventRouter spec
- [x] ConvergenceDetector spec
- [x] Parser (headers)
- [x] SymlinkManager
- [x] CodeGen framework

### ❌ Need to Create
- [ ] PocDaemon (main entry)
- [ ] SimpleAgent (simplified)
- [ ] BlockParser (markdown → AST)
- [ ] SimpleTemplates (function, class, interface)
- [ ] Integration tests

### 📊 Estimated Effort

| Component | Hours | Complexity |
|-----------|-------|------------|
| PocDaemon | 3 | Low |
| SimpleAgent | 5 | Medium |
| BlockParser | 4 | Medium |
| Templates | 2 | Low |
| Integration | 4 | Medium |
| **Total** | **18** | - |

**Timeline**: 3-4 days of focused work

---

## Next Steps

1. **Create SimpleAgent** - Start here, it's the core
2. **Create BlockParser** - Needed by SimpleAgent
3. **Create Templates** - Needed by SimpleAgent
4. **Create PocDaemon** - Wire everything together
5. **Write Integration Tests** - Verify end-to-end
6. **Run Demo** - Hello world cascade
