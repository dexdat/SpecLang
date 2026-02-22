# Active Context

## Current Focus
Building out the SpecLang system using the Ralph Loop pattern.

## Recent Changes
- Builder Agent completed todo-012: Added missing metadata fields (project_level, agent_support, short, version, layer) to all specs (59 specs updated)
- Builder Agent completed todo-010: Installed TypeScript dependencies (@modelcontextprotocol/sdk, better-sqlite3, express) and fixed compilation error (speclang-mcp.ts)
- Builder Agent completed todo-011: Created test suite for generate_index.py and validate_refs.py (basic unit tests)
- Updated spec index and committed changes
- Validation tool still has bug requiring agent_support == agent_autonomous for all specs (todo-005)
## Next Steps
1. Update validation tool to fail specs missing required metadata fields (todo-005)
2. Fix step-by-step descriptions and ambiguous terms in specs (todo-013)
3. Fix remaining spec header parse errors (mcp.dir/tools/*)
4. Run full validation and cascade simulation
## Active Decisions
- Using opencode run with --agent flag
- State stored in .ralph/loop-state.json
- Logs stored in .ralph/logs/

## Known Issues
- Validation tool incorrectly requires agent_support == agent_autonomous for all specs (todo-005)
- Some spec files have malformed headers (mcp.dir/tools/*) causing parse errors
- Some specs missing step-by-step descriptions and contain ambiguous terms (todo-013)
- TypeScript compilation passes but runtime functionality untested
