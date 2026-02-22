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
## Next Steps
1. Run full validation and cascade simulation
2. Fix remaining spec header parse errors (backup_specs/*) - low priority
3. Update validation tool to handle edge cases (optional)
4. Proceed to Phase 3: Code Generation
## Active Decisions
- Using opencode run with --agent flag
- State stored in .ralph/loop-state.json
- Logs stored in .ralph/logs/

## Known Issues
- Some spec files have malformed headers (backup_specs/*) causing parse errors (low priority)
- TypeScript compilation passes but runtime functionality untested
