# Active Context

## Current Focus
Building out the SpecLang system using the Ralph Loop pattern.

## Recent Changes
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
- Updated ralph_todo.json: marked todos 016-019 as completed, phase changed to phase_3_code_generation.
## Next Steps
1. Run full validation and cascade simulation with generated code
2. Fix remaining spec header parse errors (backup_specs/*) - low priority
3. Update validation tool to handle edge cases (optional)
4. Proceed to Phase 4: Self-Hosting (use generated Speclang to improve itself)
## Active Decisions
- Using opencode run with --agent flag
- State stored in .ralph/loop-state.json
- Logs stored in .ralph/logs/

## Known Issues
- Some spec files have malformed headers (backup_specs/*) causing parse errors (low priority)
- TypeScript compilation passes but runtime functionality untested
