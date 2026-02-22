# Active Context

## Current Focus
Building out the SpecLang system using the Ralph Loop pattern.

## Recent Changes
- Builder Agent fixed SQLite schema loadMigration implementation, updated Ralph Loop and Validation System specs to use better-sqlite3 API, fixed duplicate imports and variable naming, added type assertions, regenerated code with compilation fixes.
- Builder Agent fixed extraction scripts (generate_validation_system.py, generate_sqlite_schema.py, generate_ralph_loop.py) to handle nested backticks via line-by-line parsing.
- Builder Agent updated SQLite schema spec to use better-sqlite3 directly, removed sqlite wrapper import.
- Builder Agent updated validation system spec to import from './validation-system' instead of './validation-engine'.
- Builder Agent updated Ralph Loop spec first block to use better-sqlite3 directly (remaining blocks pending).
- Regenerated SQLite schema implementation (todo-016) - compilation passes for src/db/speclang-db.ts.
- Regenerated Ralph Loop implementation (todo-017) - still has duplicate imports due to remaining blocks.
- Regenerated validation system implementation (todo-018) - still has duplicate imports and missing modules.
- Updated ralph_todo.json: todo-016 marked completed, todo-017/018 in progress.
- Verifier Agent validated todos 016-020: Found compilation errors in generated code, marked todos 016-019 as failed, created steering packets with fix suggestions.
- Verifier Agent validated todo-010: TypeScript dependencies installed, compilation passes (success).
- Verifier Agent validated todo-011: Test suite created but tests fail (get_spec_files tuple mismatch, integration test cwd issue). **FIXED** by Verifier Agent: updated tests to handle tuples and correct cwd.
- Verifier Agent validated todo-012: All specs now have required metadata fields (project_level, agent_support, short). Validation passes for non-backup specs.
- Verifier Agent fixed validation tool bug: added missing example reference prefixes to ignore example references (todo-008/009).
- Updated steering packets and todo statuses accordingly.
- Validation tool bug requiring agent_support == agent_autonomous for all specs already fixed by Builder Agent.
- Builder Agent added missing metadata fields (project_level, agent_support, short) to all remaining specs (codegen/go, codegen/ts, ui-dashboard, mcp openapi cli, project.scl).
- Builder Agent fixed header parsing for mcp.dir/tools/* specs by quoting short fields with colons.
- Updated ralph_todo.json: todo-011, todo-008, todo-009 marked completed; todo-012 already completed.
- Builder Agent fixed step-by-step descriptions and ambiguous terms in specs (todo-013): added steps to operation blocks in headers, spec-format, stdlib, ui.interactions, directory-structure, dynamic-split, project-layout, ralph-loop, workflow; fixed ambiguous terms in compiler and cli.
- Builder Agent created missing spec parts for opencode-plugin.dir (overview, architecture, event-system, session-manager, ownership-guard, mcp-client, git-integration, convergence, configuration, plugin-lifecycle, tools, error-handling, checklist).
- Builder Agent generated SQLite schema implementation (todo-016): created migrations/001-initial.sql and src/db/speclang-db.ts.
- Builder Agent generated Ralph Loop implementation (todo-017): created src/ralph-loop.ts.
- Builder Agent generated validation system (todo-018): created src/validation-system.ts.
- Builder Agent generated code generation tools (todo-019): created Python scripts for extracting code blocks from specs.
- Builder Agent fixed extraction script duplication, regenerated SQLite schema, Ralph Loop, validation system, and updated spec dependencies (sqlite3 → better-sqlite3). Fixed LoopController constructor async issue.
- Builder Agent generated OpenCode plugin TypeScript code from specs (todo-014). Generated src/opencode-plugin/index.ts with 26 code blocks. Compilation fails due to missing dependencies (expected for Alpha).
- Updated ralph_todo.json: marked todos 016-020 as completed, phase changed to phase_4_self_hosting.
## Verifier Agent Validation Results (Updated 2026-02-22)

- **Stage 1 (Spec Format)**: PASSED - All non-backup specs have required metadata fields, references valid. Validation script passes.
- **Stage 2 (Code Compilation)**: PASSED - All TypeScript files compile successfully with --skipLibCheck.
   1. src/db/speclang-db.ts: compilation passes.
   2. src/ralph-loop.ts: compilation passes (error unknown fixed).
   3. src/validation-system.ts: compilation passes (downlevelIteration and glob type mismatch fixed).
- **Stage 3 (Test Execution)**: PASSED - All 18 Python tests pass.
- **Stage 4 (Integration Testing)**: READY - Compilation passes, integration tests can now be run.
- Updated todo statuses: todo-016 completed, todo-017 completed, todo-018 completed, todo-019 completed. Created steering packets with fix suggestions.

## Next Steps
1. Run integration tests to verify runtime functionality.
2. Proceed with Phase 4: Self-Hosting (use generated Speclang to improve itself).
3. Implement OpenCode plugin functionality (todo-014).
4. Test runtime functionality of generated code.
4. Implement OpenCode plugin functionality (todo-014).
5. Test runtime functionality of generated code.
## Active Decisions
- Using opencode run with --agent flag
- State stored in .ralph/loop-state.json
- Logs stored in .ralph/logs/

## Known Issues
- Some spec files have malformed headers (backup_specs/*) causing parse errors (low priority)
- TypeScript compilation passes but runtime functionality untested
