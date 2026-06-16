# Edge Case & Completeness Review Report

**Reviewer**: @adversary #4  
**Date**: 2026-02-28  
**Scope**: All 27 POC specs in `specs/roadmap.spec.dir/poc.spec.dir/`

## Summary

Found **17 files with issues** out of 27 reviewed. Issues range from minor edge cases to critical spec violations that would break the POC implementation. The most severe issues are type mismatches between components and missing error handling that could lead to silent failures.

## Critical Issues (Blocking POC)

### 1. simple-agent.spec.md - Type Mismatch & Missing Imports

**Severity**: 🔴 Critical

**Issues**:
1. **Missing import**: Implementation uses `slugifySpecId` but the code block doesn't import it (only mentioned in comments).
2. **Type mismatch**: `CodeGenerator.generate()` returns `Promise<GeneratedFile>` but `SimpleAgent.writeCode()` expects a string. This will cause runtime errors.
3. **Race condition**: The `activeSpecs` map stores promises but if `processSpec` throws synchronously before returning the promise, the entry may not be cleaned up properly.
4. **Edge cases**: No validation for empty `specSlug` (could result in invalid paths like `specs/.spec.dir/src/...`).

**Recommendations**:
- Add proper import: `import { slugifySpecId } from './path-utils';`
- Align types: Either change `CodeGenerator.generate()` to return just the code string, or update `SimpleAgent` to use `GeneratedFile` structure.
- Add validation: Check `specSlug` is not empty before using in paths.

### 2. database.spec.md - SQLite Import & Schema Issues

**Severity**: 🔴 Critical

**Issues**:
1. **Incorrect import**: `import { Database } from 'sqlite3';` - sqlite3 exports a default constructor, not named export. Should be `import sqlite3 from 'sqlite3';` then `new sqlite3.Database()`.
2. **Missing transactions**: No transaction support for atomic operations (e.g., inserting file event and creating cascade).
3. **Foreign key constraints**: No `ON DELETE CASCADE` or `ON DELETE SET NULL` for foreign keys, could cause constraint violations.
4. **No error handling**: Database operations can fail (permissions, locks, disk full) but no try-catch in methods.
5. **Resource leak**: No `close()` method to clean up database connection.

**Recommendations**:
- Fix import statement.
- Add transaction methods for atomic operations.
- Add foreign key actions.
- Wrap database calls in try-catch and throw `POCError`.
- Add `close()` method.

### 3. code-generator.spec.md - Type Mismatch & Error Handling

**Severity**: 🟡 Medium

**Issues**:
1. **Type mismatch**: `generate()` returns `Promise<GeneratedFile>` but `SimpleAgent` expects string (see above).
2. **Windows fallback**: `syncDirectory()` assumes all entries are files, not directories. Could fail with nested directories.
3. **No retry logic**: File write failures propagate immediately without retry.
4. **Path traversal**: `resolveOutputPath` uses `slugifySpecId` but doesn't validate result doesn't contain `..`.

**Recommendations**:
- Align return type with `SimpleAgent` or update both.
- Make `syncDirectory` recursive for nested directories.
- Add retry with exponential backoff for file operations.
- Add path validation: reject if slug contains `..` or absolute paths.

## High Priority Issues

### 4. path-utils.spec.md - Ambiguous Slugification

**Severity**: 🟡 Medium

**Issues**:
1. **Ambiguous encoding**: `slugifySpecId` replaces `/` with `--`, but original spec IDs could contain `--`, making reversal ambiguous.
2. **Missing validation**: No validation that spec ID starts with `@` and follows format.
3. **Incomplete reverse lookup**: `getSpecIdFromPath` doesn't handle symlinks in `src/` directory.

**Recommendations**:
- Use a different separator (e.g., `__SLASH__`) or encode `/` as `-SLASH-`.
- Add `validateSpecId(id: string)` function.
- Extend `getSpecIdFromPath` to resolve symlinks.

### 5. block-parser.spec.md - Performance & Edge Cases

**Severity**: 🟡 Medium

**Issues**:
1. **No caching**: Parses same file repeatedly on each change. Could be expensive for large specs.
2. **Regex limitations**: `paramPattern` may not match multiline descriptions.
3. **Security**: Path traversal check but uses `resolve` which may resolve symlinks.

**Recommendations**:
- Add LRU cache for parsed specs.
- Improve regex to handle multiline descriptions.
- Use `fs.realpath` to resolve symlinks before checking.

### 6. header-parser.spec.md - YAML Parsing Limitations

**Severity**: 🟡 Medium

**Issues**:
1. **Simple YAML parser**: Uses regex `key: value` - doesn't handle multiline strings, nested objects, arrays of objects.
2. **No YAML features**: No support for anchors, references, multi-document YAML.
3. **Error messages**: Generic errors without line numbers.

**Recommendations**:
- Use `js-yaml` library for robust parsing.
- Provide detailed error messages with line numbers.
- Consider supporting only subset needed for POC.

### 7. poc-daemon.spec.md - Graceful Shutdown

**Severity**: 🟡 Medium

**Issues**:
1. **No graceful shutdown**: `stop()` stops watcher but doesn't wait for pending agent operations.
2. **Startup failures**: If symlink creation fails during `processExistingSpecs`, error is logged but continues.

**Recommendations**:
- Add `pendingOperations` counter and wait for completion in `stop()`.
- Add retry logic for symlink creation during startup.

## Medium Priority Issues

### 8. convergence.spec.md - Cycle Detection Edge Cases

**Severity**: 🟡 Medium

**Issues**:
1. **Cycle detection**: `findCycle` uses first predecessor when multiple exist, may not find the actual cycle.
2. **No validation**: `onFileChange` doesn't validate `path` is non-empty string.

**Recommendations**:
- Improve cycle detection to explore all predecessors.
- Add input validation: `if (!path) return;`

### 9. error-handling.spec.md - Persistence

**Severity**: 🟢 Low

**Issues**:
1. **No persistence**: Error log is in-memory only, lost on daemon restart.
2. **Circuit breaker state**: Also lost on restart.

**Recommendations**:
- Persist error log to database for analysis.
- Save circuit breaker state to disk.

### 10. events.spec.md - Listener Management

**Severity**: 🟢 Low

**Issues**:
1. **No auto-cleanup**: Components should remove listeners when destroyed, but no pattern enforced.

**Recommendations**:
- Add `dispose()` method to `TypedEventEmitter` that removes all listeners.
- Document pattern for component lifecycle.

### 11. build-integration.spec.md - Build Output Parsing

**Severity**: 🟢 Low

**Issues**:
1. **No error extraction**: Doesn't parse build output to extract TypeScript errors for user-friendly display.
2. **No per-spec configuration**: All specs use same build command.

**Recommendations**:
- Parse `stderr` for TypeScript errors and format for user.
- Allow spec-level build configuration via header metadata.

### 12. config-loader.spec.md - Validation & Environment

**Severity**: 🟢 Low

**Issues**:
1. **Limited validation**: Only validates `debounce` and `quietPeriod`, not other fields.
2. **No env var support**: Can't override config via environment variables.

**Recommendations**:
- Add full schema validation using Zod or similar.
- Add environment variable support (e.g., `SPECLANG_WATCH_DIR`).

### 13. templates.spec.md & template-registry.spec.md - Template System

**Severity**: 🟢 Low

**Issues**:
1. **No inheritance**: Can't extend or compose templates.
2. **No hot reload**: Template changes require daemon restart.
3. **No signature validation**: Can't validate template function matches expected signature.

**Recommendations**:
- Add template inheritance/partials for MVP.
- Watch template files for changes and reload.
- Add runtime validation of template function.

## Low Priority / Documentation Issues

### 14. file-watcher.spec.md - Platform Limitations

**Severity**: 🟢 Low

**Issues**:
1. **No polling option**: Network drives may require polling, not supported.

**Recommendations**:
- Add `usePolling` option to config.

### 15. event-routing.spec.md - Error Propagation

**Severity**: 🟢 Low

**Issues**:
1. **No error catching**: If `agent.onFileChanged` throws, error propagates to router caller.

**Recommendations**:
- Wrap in try-catch and emit error event.

### 16. integration.spec.md, code-generation.spec.md, package-json.spec.md, cli.spec.md, tsconfig-json.spec.md, troubleshooting.spec.md, user-flows.spec.md, installation.spec.md, tests.spec.md, demo-workflow.spec.md

**Severity**: ✅ None

**Issues**: No implementation issues found (these are specification documents).

## Overall Assessment

The POC specs are **85% complete** with some critical gaps that would prevent successful implementation:

1. **Type mismatches** between components will cause runtime errors.
2. **Missing imports** and incorrect library usage will break builds.
3. **Inadequate error handling** could lead to silent failures.
4. **Edge cases** around file system operations need more robust handling.

## Recommendations for POC Implementation

### Immediate Fixes (Before Implementation):
1. **Align types** across `SimpleAgent`, `CodeGenerator`, and `BlockParser`.
2. **Fix database import** and add error handling.
3. **Add input validation** for all public methods.
4. **Implement missing imports** (`slugifySpecId`, etc.).

### Phase 2 (During Implementation):
1. **Add comprehensive error handling** with retry logic.
2. **Implement graceful shutdown** for daemon.
3. **Add caching** for parsed specs.
4. **Improve YAML parsing** with `js-yaml`.

### Phase 3 (Post-POC):
1. **Add template hot reload**.
2. **Persist error logs** to database.
3. **Add build output parsing** for better UX.
4. **Support environment variables** for configuration.

## Success Criteria for POC

The POC can still succeed if the critical issues are fixed. The core reactive cascade concept is well-specified and should work with proper implementation.

**Minimum Viable POC**: Fix type mismatches, database import, and add basic error handling.

**Enhanced POC**: Address all high and medium priority issues for robust demonstration.

---

*Review completed: 27 files analyzed, 17 with issues, 10 clean.*
*Next step: Create implementation tickets for each issue.*