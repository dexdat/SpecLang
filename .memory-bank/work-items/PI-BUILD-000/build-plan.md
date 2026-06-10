# SpecLang Assembler Build — Complete Spec Set

## Current State

All 12 new specs created in specs/assembler/:

### Informational Specs (5)
- overview.spec.md — System overview and component map
- config.spec.md — Configuration schema
- model-pools.spec.md — Provider configs and rate limits
- cli.spec.md — CLI commands reference
- skill-specs.spec.md — Agent role skill definitions
- file-watch-rules.spec.md — Watch pattern matching rules

### Code-Pair Specs (6 — with implementations)
- daemon.spec.ts.md → .speclang/daemon.spec.ts — chokidar watcher
- guard.spec.ts.md → .speclang/guard.spec.ts — Pi extension
- cascade-router.spec.ts.md → .speclang/cascade-router.spec.ts — event dispatcher
- pipeline.spec.ts.md → .speclang/pipeline.spec.ts — build runner
- assembler.spec.ts.md → .speclang/assembler.spec.ts — core engine
- mcp-server.spec.ts.md → .speclang/mcp-server.spec.ts — external access

### Skill Files Created (3)
- .pi/skills/spec-writer.md
- .pi/skills/codegen.md
- .pi/skills/cascade-coordinator.md

### Directories Created
- specs/assembler/
- .speclang/ (empty — hand-extracted code goes here during build)
- .pi/extensions/
- .pi/skills/

## Next Build Steps

### PI-BUILD-001: Extract and verify daemon
1. Copy code from specs/assembler/daemon.spec.ts.md ## Implementation → .speclang/daemon.spec.ts
2. npm install chokidar js-yaml fast-glob minimatch
3. npx tsx .speclang/daemon.spec.ts specs/ -- verify watcher works
4. Test notification graph with spec changes

### PI-BUILD-002: Extract and verify guard
1. Copy code → .speclang/guard.spec.ts
2. Test ownership resolution
3. Test onToolCall interceptor logic

### PI-BUILD-003: Extract and verify cascade router
1. Copy code → .speclang/cascade-router.spec.ts
2. Test squash (debounce)
3. Test throttle (hot file deferral)
4. Wire to daemon events

### PI-BUILD-004: Extract and verify pipeline
1. Copy code → .speclang/pipeline.spec.ts
2. Test build.yaml parsing
3. Test stage executor
4. Test git hook validator

### PI-BUILD-005: Extract and verify assembler
1. Copy code → .speclang/assembler.spec.ts
2. Test on its own spec file (bootstrap moment)
3. Test on all code-pair specs

### PI-BUILD-006: Extract and verify MCP server
1. Copy code → .speclang/mcp-server.spec.ts
2. Test tool listing and invocation
