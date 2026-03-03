# SpecLang POC Implementation Tasks

Follow the 8-phase implementation sequence from `specs/roadmap.spec.dir/poc.spec.md`.

## Phase 1: Foundation

### P1.1 - Project Setup
- [ ] **Create project structure** - installation.spec.md → (run `npm init`, create directory structure)
- [x] **Configure TypeScript** - tsconfig-json.spec.md → tsconfig.json (set target: ES2022, module: NodeNext, outDir: ./dist, rootDir: ./src)
- [x] **Install dependencies** - package-json.spec.md → package.json (chokidar, sqlite3, commander, js-yaml, glob, dev dependencies)
- [x] **Define core types** - types.spec.md → src/types/poc.ts (FileEvent, ParsedBlock, BlockKind)
- [x] **Define error types** - types.spec.md → src/types/poc.ts (POCError, POCConfig, Template)
- [x] **Define event types** - types.spec.md → src/types/poc.ts (ConvergenceEvent, ConvergenceState, DaemonStats)

### P1.2 - Core Utilities
- [x] **Implement path utilities** - path-utils.spec.md → src/utils/path-utils.ts (slugifySpecId, resolveSpecPaths, resolveBlockOutputPath, ensureSpecDirectories)
- [x] **Implement config loader** - config-loader.spec.md → src/config/loader.ts (load from .speclang/config.yaml, merge with defaults, validate settings)
- [x] **Create POCError class** - error-handling.spec.md → src/errors/handler.ts (with toUserMessage())
- [x] **Create ErrorHandler** - error-handling.spec.md → src/errors/handler.ts (with recovery strategies)
- [x] **Define error codes** - error-handling.spec.md → src/errors/handler.ts (WATCH_ERROR, PARSE_ERROR, GENERATION_ERROR, etc.)

## Phase 2: File Watching & Events

### P2.1 - Event System
- [x] **Implement TypedEventEmitter** - events.spec.md → src/events/typed-emitter.ts (on<K>, emit<K>, event types: FileWatcherEvents, ConvergenceEvents)

### P2.2 - File Watcher
- [x] **Setup chokidar watcher** - file-watcher.spec.md → src/daemon/file-watcher.ts (watch specs/ directory)
- [x] **Implement debouncing** - file-watcher.spec.md → src/daemon/file-watcher.ts (300ms debounce)
- [x] **Configure filters** - file-watcher.spec.md → src/daemon/file-watcher.ts (ignore *.tmp, .git/, node_modules/)

### P2.3 - Convergence Detection
- [x] **Implement ConvergenceDetector** - convergence.spec.md → src/daemon/convergence.ts (quiet period: 5000ms, track files changed, emit 'converged' event)

## Phase 3: Spec Parsing

### P3.1 - Header Parser
- [x] **Implement HeaderParser** - header-parser.spec.md → src/parser/header-parser.ts (parse # speclang-header lines:N, extract id, version, layer, short, tags, validate required fields)

### P3.2 - Block Parser
- [x] **Parse block headers** - block-parser.spec.md → src/parser/block-parser.ts (regex for @block: and @kind:)
- [x] **Parse parameters** - block-parser.spec.md → src/parser/block-parser.ts (name: type - description)
- [x] **Parse optional/properties** - block-parser.spec.md → src/parser/block-parser.ts (optional: name?, properties for classes/interfaces)
- [x] **Return ParsedBlock[]** - block-parser.spec.md → src/parser/block-parser.ts (return array of parsed blocks)

## Phase 4: Code Generation

### P4.1 - Templates
- [x] **Implement function template** - templates.spec.md → src/codegen/templates/function.ts (export function name(params): returnType, JSDoc, optional parameters)
- [x] **Implement class template** - templates.spec.md → src/codegen/templates/class.ts (export class Name, properties with optional marker)
- [x] **Implement interface template** - templates.spec.md → src/codegen/templates/interface.ts (export interface Name, optional properties with ?)
- [x] **Implement type template** - templates.spec.md → src/codegen/templates/type.ts (export type Name = ...)
- [x] **Implement enum template** - templates.spec.md → src/codegen/templates/enum.ts (export enum Name)
- [x] **Implement constant template** - templates.spec.md → src/codegen/templates/constant.ts (export const NAME: type = value)

### P4.2 - Template Registry
- [x] **Implement TemplateRegistry** - template-registry.spec.md → src/codegen/template-registry.ts (register, get, loadFromFile, built-ins: function, class, interface, type, enum, constant)

### P4.3 - Code Generator
- [x] **Generate file with header** - code-generator.spec.md → src/codegen/generator.ts (add SPECLANG-GENERATED header)
- [x] **Write to spec dir** - code-generator.spec.md → src/codegen/generator.ts (write to specs/{slug}.spec.dir/src/{blockId}.ts)
- [x] **Create barrel export** - code-generation.spec.md → src/codegen/index.ts (create barrel export: specs/{slug}.spec.dir/src/index.ts)
- [x] **Create symlinks** - code-generation.spec.md → src/codegen/symlink-manager.ts (create symlink: src/{slug} → ../specs/{slug}.spec.dir/src, handle Windows fallback)

## Phase 5: Agent & Daemon

### P5.1 - Simple Agent
- [x] **Implement SimpleAgent** - simple-agent.spec.md → src/daemon/simple-agent.ts (onFileChanged, parse spec, generate code, create symlinks, handle Windows fallback)

### P5.2 - Event Router
- [x] **Implement EventRouter** - event-routing.spec.md → src/daemon/event-router.ts (simple routing: all events → SimpleAgent, route method)

### P5.3 - POC Daemon
- [x] **Wire components** - poc-daemon.spec.md → src/daemon/poc-daemon.ts (FileWatcher → EventRouter → SimpleAgent, FileWatcher → ConvergenceDetector)
- [x] **Implement start/stop methods** - poc-daemon.spec.md → src/daemon/poc-daemon.ts (start(): Promise<void>, stop(): Promise<void>)
- [x] **Process existing specs on startup** - poc-daemon.spec.md → src/daemon/poc-daemon.ts (process all specs when daemon starts)

## Phase 6: Database & State

### P6.1 - Database
- [ ] **Create tables** - database.spec.md → src/db/poc-db.ts (file_events, cascades, tasks, specs, generated_files, SQL snake_case)
- [ ] **Implement insert methods** - database.spec.md → src/db/poc-db.ts (insertFileEvent, createCascade)
- [ ] **Implement query methods** - database.spec.md → src/db/poc-db.ts (completeCascade, getGeneratedFiles, etc.)

## Phase 7: Integration & Testing

### P7.1 - Component Integration
- [ ] **Wire all components** - integration.spec.md → src/integration/wire.ts (daemon creates and connects all components, event flow: FileWatcher → Router → Agent → CodeGen)

### P7.2 - Build Integration
- [ ] **Implement build integration** - build-integration.spec.md → src/build/integration.ts (run `npm run build` after convergence, verify generated code compiles)

### P7.3 - CLI
- [ ] **Create CLI entry** - cli.spec.md → src/cli/index.ts (./bin/speclangd-poc, parse arguments with commander, start/stop daemon)

### P7.4 - Tests
- [ ] **Write unit tests** - tests.spec.md → tests/**/*.test.ts (FileWatcher, BlockParser, CodeGenerator)
- [ ] **Write integration tests** - tests.spec.md → tests/**/*.test.ts (Daemon, Cascade)
- [ ] **Write E2E tests** - tests.spec.md → tests/**/*.test.ts (Demo workflow)

## Phase 8: Demo & Documentation

### P8.1 - Demo Workflow
- [ ] **Implement demo** - demo-workflow.spec.md → specs/greeting.spec.md + tests (create greeting spec, edit file, verify code generates in < 5 seconds, run `npm run build` successfully)

### P8.2 - Documentation
- [ ] **Update troubleshooting** - troubleshooting.spec.md → docs/troubleshooting.md (document common errors, error codes)
- [ ] **Update user flows** - user-flows.spec.md → docs/user-flows.md (document user interaction flows)

## Completion
- [ ] All phases complete
- [ ] All tests pass
- [ ] Demo workflow successful