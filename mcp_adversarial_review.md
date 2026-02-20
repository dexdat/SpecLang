# Adversarial Review of MCP Spec

## Overview
Review of `specs/mcp.spec.md` against SQL schema (`schema.sql`) and plugin spec (`specs/opencode-plugin.spec.md`). Focus on bugs, inconsistencies, missing pieces, and integration issues.

## Issues Found

### 1. Incomplete HTTP Endpoint for SSE
**Location**: Lines 179-184 in MCP spec
**Issue**: The MCP spec defines an SSE endpoint `/mcp` that creates an `SSEServerTransport` with path `/mcp/message`. However, there is no corresponding POST endpoint `/mcp/message` to receive messages from the client. The MCP SDK expects a message endpoint for bidirectional communication.
**Fix**: Add a POST endpoint `/mcp/message` that forwards messages to the appropriate transport.

### 2. Missing Tools: `speclang_query` and `speclang_execute`
**Location**: Plugin spec lines 502, 521 reference these tools; MCP spec does not define them.
**Issue**: The plugin's MCP client calls `speclang_query` and `speclang_execute` for generic SQL operations, but the MCP spec defines only specific query tools (e.g., `speclang_query_commands`, `speclang_query_errors`). This creates a mismatch.
**Fix**: Either add generic `speclang_query` and `speclang_execute` tools to MCP spec, or update plugin spec to use the specific tools.

### 3. SQL Mismatch: `speclang_insert_command` Missing `cascade_id`
**Location**: Lines 327-330 in MCP spec
**Issue**: The `commands` table has a NOT NULL column `cascade_id` (foreign key to cascades). The INSERT statement does not include `cascade_id`, causing a constraint violation.
**Fix**: Add `cascade_id` parameter to the tool, likely derived from the current session or a default cascade.

### 4. SQL Mismatch: `speclang_search` FTS Ranking Function
**Location**: Lines 224-230
**Issue**: The SQL uses `bm25(specs_fts) as score`. The FTS5 `bm25` function may require proper syntax; also need to ensure the virtual table is named `specs_fts`. Should verify that `bm25` is available (requires FTS5 extension).
**Fix**: Confirm SQLite compilation includes FTS5 and bm25. Alternatively use `rank` column (available in FTS5). The tool handler implementation (lines 430-452) uses `rank as score`, which is correct.

### 5. SQL Mismatch: `speclang_get_spec` Subquery Join
**Location**: Lines 253-263
**Issue**: The subquery for dependencies joins `specs d` with `spec_deps sd` on `d.spec_pk = sd.dst_spec_pk`. This retrieves dependencies where the spec is the source (i.e., specs that this spec depends on). However, the column alias `d.id` and `d.file_path` refer to the dependent spec, not the target. That's fine, but the JSON object uses `'id', d.id, 'path', d.file_path`. Should be consistent with naming (`file_path` vs `path`).
**Fix**: Ensure JSON keys match plugin expectations.

### 6. Authentication Middleware Implementation Missing
**Location**: Lines 171-176 reference `basicAuthMiddleware(args)` and `tokenAuthMiddleware(args)` but do not provide implementation details.
**Issue**: The spec assumes these middleware functions exist; they are not defined elsewhere in the spec.
**Fix**: Provide implementation or reference to a separate auth spec.

### 7. SSE Stream Duplication
**Location**: Lines 647-680 define a custom SSE stream at `/events` for real-time updates, while lines 179-184 define MCP SSE transport at `/mcp`. This creates two separate SSE streams, potentially confusing.
**Issue**: The custom SSE stream is not integrated with MCP protocol; it's a separate event system. Need clarity on whether both are needed.
**Fix**: Decide if custom SSE stream is necessary; if yes, document its purpose and relationship to MCP.

### 8. Configuration Schema Mismatch with Plugin
**Location**: MCP config schema (lines 750-773) vs plugin config schema (lines 666-699)
**Issue**: MCP config includes database, server, auth, logging, limits. Plugin config includes `mcp_server` object with command and transport. These are separate configs, but they should align (e.g., MCP server port should match plugin's MCP client port).
**Fix**: Ensure consistency; maybe plugin config should reference MCP config file.

### 9. Tool Signature Mismatches
**Issue**: Several tool signatures in MCP spec may not match plugin expectations. For example:
- `speclang_search` returns `file_path, id, short_desc, score`. Plugin expects `file_path, id, short_desc, score`. That's fine.
- `speclang_get_status` returns `active_sessions, queue_depth, converged, cascade_depth, last_build`. Plugin expects `active_sessions, queue_depth, converged, cascade_depth`. Missing `last_build`.
**Fix**: Align tool signatures between specs.

### 10. Missing Error Codes Consistency
**Issue**: MCP error handling (lines 610-643) defines error codes (`INVALID_PARAMS`, `NOT_FOUND`, `UNAUTHORIZED`). Plugin error handling (lines 831-860) defines categories but not codes. Ensure error responses are standardized.
**Fix**: Define common error codes across both specs.

### 11. SQL Column Name Typos
**Location**: Various SQL queries reference columns that exist but need verification:
- `specs.content_hash` vs `specs.hash`? Actually column is `content_hash`.
- `events.processed` is INTEGER (0/1), matches usage.
- `events.claimed_by` TEXT, matches.
- `file_locks.expires_at` INTEGER, matches.
- `specs.owner_session_id` vs `specs.owned_by`? Both exist; `owner_session_id` is foreign key to sessions, `owned_by` is enum of agent types.
**Fix**: Double-check column names in each SQL query.

### 12. Atomic Lock Acquisition SQL Logic
**Location**: Lines 358-366
**Issue**: The `ON CONFLICT` clause uses `WHERE file_locks.expires_at IS NULL OR file_locks.expires_at < strftime('%s','now')`. However, `expires_at` is defined as `NOT NULL`. So `IS NULL` condition will never be true. Should rely only on expiry comparison.
**Fix**: Remove `OR file_locks.expires_at IS NULL`.

### 13. Missing `speclang_semantic_search` Implementation
**Location**: Lines 232-245
**Issue**: The tool is described but implementation is vague ("Requires sqlite-vss extension or computed in TypeScript"). No SQL or handler provided.
**Fix**: Provide concrete implementation or remove tool.

### 14. Missing `speclang_get_tree` Implementation
**Location**: Lines 278-286
**Issue**: Described as "Recursive CTE in SQLite" but no SQL provided. The handler implementation (lines 491-512) provides a CTE that traverses `spec_deps` edges, but it uses `JOIN spec_deps sd ON sd.dst_spec_pk = s.spec_pk` which goes from child to parent? Actually it joins `specs s` with `spec_deps sd` on `sd.dst_spec_pk = s.spec_pk` and then joins `tree t` on `sd.src_spec_pk = t.spec_pk`. That traverses dependencies from source to destination (depends_on direction). Need to verify correctness.
**Fix**: Provide clear SQL and test with sample data.

### 15. Tool Handler Inconsistencies
**Location**: Tool handlers (lines 423-514) vs SQL definitions (lines 224-417)
**Issue**: Some handlers use different SQL than the tool definitions. Example: `handleSearch` includes tag filtering logic not present in the tool SQL definition.
**Fix**: Ensure handlers match the defined SQL or update tool definitions.

### 16. MCP Transport Modes Incomplete
**Location**: Lines 164-199
**Issue**: `startSocket` method is incomplete (just placeholder). Need implementation for named pipe / Unix socket.
**Fix**: Provide implementation or remove mention.

### 17. CLI Options Not Aligned with Config
**Location**: Lines 816-837
**Issue**: CLI options (`--remote`, `--port`, `--auth`, etc.) should match config schema. For example, `--auth` expects `none`, `basic`, `token`. Config schema `auth.type` expects same values. Good.
**Fix**: Ensure CLI options map to config fields.

### 18. Missing Health Check Endpoint
**Issue**: HTTP mode should expose a health check endpoint (e.g., `/health`) for monitoring.
**Fix**: Add health check endpoint.

### 19. Missing CORS Headers for HTTP Mode
**Issue**: If MCP server is accessed from web clients (e.g., browser), CORS headers may be needed.
**Fix**: Add CORS middleware when in HTTP mode.

### 20. SQL Injection Risk
**Issue**: The generic `speclang_query` and `speclang_execute` tools (if added) could allow arbitrary SQL execution. Need to restrict to read-only for query and validate writes.
**Fix**: Implement parameterized queries only; possibly restrict to certain tables.

## Recommendations

1. **Add missing HTTP endpoint**: Implement POST `/mcp/message` for SSE transport.
2. **Define missing tools**: Add `speclang_query` and `speclang_execute` with proper security.
3. **Fix SQL mismatches**: Update `speclang_insert_command` to include `cascade_id`.
4. **Align tool signatures**: Ensure MCP tools match plugin expectations.
5. **Complete authentication middleware**: Provide implementation details.
6. **Clarify SSE streams**: Decide on custom vs MCP SSE.
7. **Update configuration alignment**: Ensure MCP config and plugin config are consistent.
8. **Fix atomic lock SQL**: Remove `IS NULL` condition.
9. **Provide missing implementations**: Complete `speclang_semantic_search` and `speclang_get_tree`.
10. **Add health check and CORS** for HTTP mode.

## Priority
- High: Missing HTTP endpoint, missing tools, SQL constraint violation.
- Medium: Authentication, SSE duplication, configuration alignment.
- Low: Tool signature mismatches, error codes, health check.

## Next Steps
1. Update MCP spec with fixes.
2. Update SQL schema if needed (but schema seems robust).
3. Update plugin spec to reflect changes.
4. Implement and test.