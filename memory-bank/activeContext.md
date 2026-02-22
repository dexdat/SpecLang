# Active Context

## Current Focus
Building out the SpecLang system using the Ralph Loop pattern.

## Recent Changes
- Verifier Agent validated todo-010: TypeScript dependencies installed, compilation passes (success).
- Verifier Agent validated todo-011: Test suite created but tests fail (get_spec_files tuple mismatch, integration test cwd issue).
- Verifier Agent validated todo-012: Most specs updated, but 10 specs still missing project_level and agent_support fields (code generation specs).
- Updated steering packets and todo statuses accordingly.
- Validation tool still has bug requiring agent_support == agent_autonomous for all specs (todo-005)
- Builder Agent fixed validation tool bug: now allows human_only, agent_assisted, agent_autonomous values.
- Builder Agent added missing metadata fields (project_level, agent_support, short) to all remaining specs (codegen/go, codegen/ts, ui-dashboard, mcp openapi cli, project.scl).
- Builder Agent fixed header parsing for mcp.dir/tools/* specs by quoting short fields with colons.
- Updated ralph_todo.json: todo-012 marked completed.
## Next Steps
1. Fix step-by-step descriptions and ambiguous terms in specs (todo-013)
2. Run full validation and cascade simulation
3. Fix remaining spec header parse errors (backup_specs/*) - low priority
4. Update validation tool to ignore example references (todo-008/009)
## Active Decisions
- Using opencode run with --agent flag
- State stored in .ralph/loop-state.json
- Logs stored in .ralph/logs/

## Known Issues
- Validation tool incorrectly requires agent_support == agent_autonomous for all specs (todo-005)
- Some spec files have malformed headers (mcp.dir/tools/*) causing parse errors
- Some specs missing step-by-step descriptions and contain ambiguous terms (todo-013)
- TypeScript compilation passes but runtime functionality untested
