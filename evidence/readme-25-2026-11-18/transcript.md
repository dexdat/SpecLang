# README-25 verification transcript

Date: 2026-11-18. All measurements below are snapshots, not maintained README totals.
Worktree: `/home/kara/worktrees/SpecLang-README-25`
Branch: `wt/README-25`
Measured base (`git rev-parse HEAD`): `1a2134ac7d82395c22594c0d9a104cbc65ca06dc`

The verification ran directly in the isolated worktree, not the canonical clone.
Only README.md and new files in this evidence directory are deliverable changes.
The Agent Roles section is not edited. No test, implementation, package, config, board
or saved-index change is part of this fixup.

## Result: not an all-green run

The required Python commands and configured TypeScript typecheck exited 0.
The exact `npm test` invocation exited 1. Its failures are database test/hook
timeouts in unchanged test/implementation files. The separate database-filter run
also exited 1, with timeouts, `SqliteError: disk I/O error` and
`SqliteError: attempt to write a readonly database`. The host-load observation below
records a heavily loaded host; that is context, not proof of a unique root cause.
These failures were not fixed, skipped, hidden or relabeled as green by this docs task.
The selected integration/E2E runs passed; they are not substitutes for the full suite.

`python3 scripts/generate_index.py --validate` exited 1 for missing reference targets.
In contrast, `validate_refs.py` exits 0 and unconditionally prints `All references valid.`:
its source collects import/dependency errors but does not report or enforce them,
and it skips block references. Its success is not proof of reference completeness.
`validate_autonomous.py --project` selects paths from the checked-in index; index
entries can refer to the same path, and non-autonomous specs need only pass the
reference sub-check. Report blocks, graph nodes, indexed entries and source files
are different quantities. The README now uses the commands, not interchangeable totals.

## Measured totals

### tests: exit 1

```text
Test Files  4 failed | 118 passed | 4 skipped (126)
Tests  17 failed | 2005 passed | 58 skipped (2080)
Duration  481.58s (transform 9.80s, setup 2.13s, import 11.02s, tests 1180.60s, environment 10ms)
```

### integration: exit 0

```text
Test Files  3 passed (3)
Tests  22 passed (22)
Duration  2.86s (transform 77ms, setup 58ms, import 60ms, tests 1.88s, environment 0ms)
```

### e2e: exit 0

```text
Test Files  1 passed (1)
Tests  9 passed (9)
Duration  2.04s (transform 44ms, setup 32ms, import 27ms, tests 1.85s, environment 0ms)
```

### db-filter: exit 1

```text
Test Files  4 failed | 5 passed (9)
Tests  24 failed | 63 passed (87)
Duration  426.81s (transform 1.64s, setup 632ms, import 1.54s, tests 977.46s, environment 1ms)
```

validate-autonomous: 464 report blocks; 464 PASSED; 0 FAILED; observed confidence range 0.6–4.1.

saved-validate-autonomous: 464 report blocks; 464 PASSED; 0 FAILED; observed confidence range 0.6–4.1.

Vitest file inventory: 126 unique collected files (126 after deduplication), from `npx vitest list --filesOnly`.

Saved index entries (`jq '.specs | length' _index.json`): 464.

Live graph output (read-only, including warnings):

```text
Generating spec index for ....
Found 480 spec files
(read-only: index computed in memory, _index.json not written)
  - Specs: 471
  - References: 1269
  - Missing refs: 56
  - Orphans: 183
  - Cycles: 0
  - WARNING: 56 missing reference targets!
      @speclang/validation -> @speclang/validation/rules (children)
      @speclang/validation -> @speclang/validation/tool (children)
      @speclang/validation -> @speclang/validation/language-blocks (children)
      @speclang/test-specs -> @speclang/test-specs/format.spec (children)
      @speclang/test-specs -> @speclang/test-specs/examples.spec (children)
      ... and 51 more
=== Graph Statistics ===
Nodes: 471
Dependency edges: 687
Dependent edges: 687
Most dependencies: @speclang/ui (18)
Most depended on: speclang/core (40)
```

Strict validator output (non-zero):

```text
Generating spec index for ....
Found 480 spec files
(read-only: index computed in memory, _index.json not written)
  - Specs: 471
  - References: 1269
  - Missing refs: 56
  - Orphans: 183
  - Cycles: 0
  - WARNING: 56 missing reference targets!
      @speclang/validation -> @speclang/validation/rules (children)
      @speclang/validation -> @speclang/validation/tool (children)
      @speclang/validation -> @speclang/validation/language-blocks (children)
      @speclang/test-specs -> @speclang/test-specs/format.spec (children)
      @speclang/test-specs -> @speclang/test-specs/examples.spec (children)
      ... and 51 more
=== Index Validation ===
Total specs: 480
Total refs: 1269
Missing refs: 56 (tolerance: 0)

❌ 56 missing references exceed tolerance (0):
  - @speclang/validation -> @speclang/validation/rules (children)
  - @speclang/validation -> @speclang/validation/tool (children)
  - @speclang/validation -> @speclang/validation/language-blocks (children)
  - @speclang/test-specs -> @speclang/test-specs/format.spec (children)
  - @speclang/test-specs -> @speclang/test-specs/examples.spec (children)
  - @speclang/config -> @ref:speclang/config.spec.dir/schema (children)
  - @speclang/config -> @ref:speclang/config.spec.dir/defaultsstatus: draft (children)
  - @speclang/ui -> @speclang/ui/overview (children)
  - @speclang/ui -> @speclang/ui/visual-design (children)
  - @speclang/ui -> @speclang/ui/components/cascade-status (children)
  ... and 46 more

✅ No circular dependencies

⚠️  Orphan specs (183) — warnings, not errors:
  - @speclang/scripts-generate-validation-system
  - @speclang/config-spec-dir/defaults
  - @speclang/scripts.generate-opencode-plugin.py
  - @specs/mcp/auth
  - @speclang/cli-spec-dir/installation
  - @speclang/scripts.generate-ralph-loop.py
  - @speclang/cli-spec-dir/integration
  - @speclang/auth/entities
  - @specs/validation/rules/index
  - @specs/mcp/index
```

## Failed-test diagnostics

### tests

```text
Error: --to <level> is required
 FAIL  tests/db.test.ts > Graph Queries > should get tree
 FAIL  tests/db.test.ts > Graph Queries > should find ancestors
Error: Hook timed out in 30000ms.
 FAIL  tests/db.test.ts > JSON Queries > should find by tag
Error: Hook timed out in 30000ms.
 FAIL  tests/db.test.ts > Migrations > should not re-run migrations
Error: Test timed out in 30000ms.
 FAIL  tests/db.test.ts > Migrations > should get current version
Error: Test timed out in 30000ms.
 FAIL  tests/db.test.ts > Vector Search > should report availability correctly
 FAIL  tests/db.test.ts > Vector Search > should return empty results for stub implementation
Error: Hook timed out in 30000ms.
 FAIL  tests/db/corrupt-state-db-surfaces.test.ts > corrupt state database reaches the MCP and Ralph Loop openers (QA-SPECLANG-5-R2) > Ralph Loop still opens a healthy (absent) file
Error: Test timed out in 30000ms.
 FAIL  tests/db/ralph-loop-fresh-state.test.ts > Ralph Loop bootstraps a fresh state database (QA-SPECLANG-5-R3) > creates the canonical state schema plus the loop's own tables on an absent file
Error: Test timed out in 30000ms.
 FAIL  tests/db/ralph-loop-fresh-state.test.ts > Ralph Loop bootstraps a fresh state database (QA-SPECLANG-5-R3) > every statement the loop prepares runs against the freshly created DB
Error: Test timed out in 30000ms.
 FAIL  tests/db/ralph-loop-lifecycle.test.ts > Ralph Loop exit paths (GAP-004) > stop() ends a running loop, clears its poll timer, and logs reason=stopped
Error: Test timed out in 30000ms.
 FAIL  tests/db/ralph-loop-lifecycle.test.ts > Ralph Loop exit paths (GAP-004) > stops itself with reason=idle-timeout after maxIdlePolls idle polls
Error: Test timed out in 30000ms.
 FAIL  tests/db/ralph-loop-lifecycle.test.ts > Ralph Loop exit paths (GAP-004) > ignores launcher loss when exitOnLauncherLoss is off
Error: Test timed out in 30000ms.
 FAIL  tests/db/ralph-loop-lifecycle.test.ts > Ralph Loop exit paths (GAP-004) > does not mistake a live launcher for a dead one
Error: Test timed out in 30000ms.
 FAIL  tests/db/ralph-loop-lifecycle.test.ts > Ralph Loop exit paths (GAP-004) > stops on SIGTERM through the handler start() registered, and removes it again
Error: Test timed out in 30000ms.
 FAIL  tests/db/ralph-loop-lifecycle.test.ts > Ralph Loop exit paths (GAP-004) > does not stack signal listeners when the loop is started twice
Error: Test timed out in 30000ms.
 FAIL  tests/db/ralph-loop-lifecycle.test.ts > Ralph Loop exit paths (GAP-004) > the CLI entry exits 0 on a real SIGTERM instead of being SIGKILLed
Error: Test timed out in 40000ms.
```

### db-filter

```text
 FAIL  tests/db.test.ts > Full-Text Search > should search by content
Error: Hook timed out in 30000ms.
 FAIL  tests/db.test.ts > Graph Queries > should find dependents
 FAIL  tests/db.test.ts > Graph Queries > should find dependencies
 FAIL  tests/db.test.ts > Graph Queries > should find ancestors
Error: Hook timed out in 30000ms.
 FAIL  tests/db.test.ts > JSON Queries > should find by tag
Error: Hook timed out in 30000ms.
 FAIL  tests/db.test.ts > JSON Queries > should find by field
SqliteError: attempt to write a readonly database
 FAIL  tests/db.test.ts > Migrations > should run migrations
SqliteError: disk I/O error
 FAIL  tests/db.test.ts > Migrations > should not re-run migrations
SqliteError: disk I/O error
 FAIL  tests/db.test.ts > Migrations > should get current version
SqliteError: attempt to write a readonly database
 FAIL  tests/db.test.ts > Vector Search > should report availability correctly
SqliteError: disk I/O error
 FAIL  tests/db.test.ts > Vector Search > should return empty results for stub implementation
SqliteError: attempt to write a readonly database
 FAIL  tests/db/corrupt-state-db-surfaces.test.ts > corrupt state database reaches the MCP and Ralph Loop openers (QA-SPECLANG-5-R2) > Ralph Loop still opens a healthy (absent) file
Error: Test timed out in 30000ms.
 FAIL  tests/db/ralph-loop-fresh-state.test.ts > Ralph Loop bootstraps a fresh state database (QA-SPECLANG-5-R3) > creates the canonical state schema plus the loop's own tables on an absent file
Error: Test timed out in 30000ms.
 FAIL  tests/db/ralph-loop-fresh-state.test.ts > Ralph Loop bootstraps a fresh state database (QA-SPECLANG-5-R3) > every statement the loop prepares runs against the freshly created DB
Error: Test timed out in 30000ms.
 FAIL  tests/db/ralph-loop-fresh-state.test.ts > Ralph Loop bootstraps a fresh state database (QA-SPECLANG-5-R3) > creates a missing directory for an explicit DB path
Error: Test timed out in 30000ms.
 FAIL  tests/db/ralph-loop-fresh-state.test.ts > Ralph Loop entry point on a fresh project (QA-SPECLANG-5-R3) > bootstraps .speclang/speclang.db and keeps looping where it used to exit 1
 FAIL  tests/db/ralph-loop-lifecycle.test.ts > Ralph Loop exit paths (GAP-004) > stop() ends a running loop, clears its poll timer, and logs reason=stopped
Error: Test timed out in 30000ms.
 FAIL  tests/db/ralph-loop-lifecycle.test.ts > Ralph Loop exit paths (GAP-004) > stops itself with reason=idle-timeout after maxIdlePolls idle polls
Error: Test timed out in 30000ms.
 FAIL  tests/db/ralph-loop-lifecycle.test.ts > Ralph Loop exit paths (GAP-004) > never stops on idleness when the bound is disabled explicitly
Error: Test timed out in 30000ms.
 FAIL  tests/db/ralph-loop-lifecycle.test.ts > Ralph Loop exit paths (GAP-004) > stops with reason=launcher-gone when the launching process has exited
Error: Test timed out in 30000ms.
 FAIL  tests/db/ralph-loop-lifecycle.test.ts > Ralph Loop exit paths (GAP-004) > does not mistake a live launcher for a dead one
Error: Test timed out in 30000ms.
 FAIL  tests/db/ralph-loop-lifecycle.test.ts > Ralph Loop exit paths (GAP-004) > stops on SIGTERM through the handler start() registered, and removes it again
Error: Test timed out in 30000ms.
 FAIL  tests/db/ralph-loop-lifecycle.test.ts > Ralph Loop exit paths (GAP-004) > does not stack signal listeners when the loop is started twice
Error: Test timed out in 30000ms.
 FAIL  tests/db/ralph-loop-lifecycle.test.ts > Ralph Loop exit paths (GAP-004) > the CLI entry exits 0 on a real SIGTERM instead of being SIGKILLed
Error: timed out after 30000ms waiting for the CLI entry to bootstrap its state DB
```

## Environmental and scope observations

`npm ci` succeeded and the in-memory better-sqlite3 binding probe passed.
Install output also reported dependency vulnerabilities and a blocked esbuild
postinstall script. Those warnings are retained verbatim in install.log; no
dependency approvals, lockfile edits or audit fixes were made by this task.

Host diagnostic command: `{ date --iso-8601=seconds; uptime; }` (exit 0).

```text
2026-11-18T09:20:51-05:00
 09:20:51 up  1:05,  1 user,  load average: 184.08, 221.09, 196.50
```

The index was temporarily different from HEAD during verification. An external foreman
later reported running its own index-generation probe and restoring the index. This
worker did not run `generate_index.py --generate` or restore the index; it cannot
attribute that concurrent churn to the tests alone. The final tracked-scope checks
passed, and these blob hashes match:

```text
2796d023657de8780ed2225b490b6bc9b27668e3
2796d023657de8780ed2225b490b6bc9b27668e3
```

No historical fallback suite totals were used. Raw output is unfiltered; only
the excerpts below are shortened. commands.jsonl carries invocation time, command,
working directory, exit code and the raw log filename for every captured command.

## Commands, exit codes and relevant output tails

### environment

Started (UTC): 2026-11-18T14:10:26.065487+00:00
Command: `pwd; git rev-parse HEAD; git branch --show-current; git status --short; date --iso-8601=seconds; node --version; npm --version; python3 --version`
Exit code: 0
Raw output: [environment.log](environment.log)

```text
/home/kara/worktrees/SpecLang-README-25
1a2134ac7d82395c22594c0d9a104cbc65ca06dc
wt/README-25
?? evidence/
2026-11-18T09:10:26-05:00
v22.22.3
12.2.3
Python 3.14.9
```

### install

Started (UTC): 2026-11-18T14:10:26.299504+00:00
Command: `npm ci`
Exit code: 0
Raw output: [install.log](install.log)

```text
added 464 packages, and audited 465 packages in 7s

122 packages are looking for funding
  run `npm fund` for details

35 vulnerabilities (15 moderate, 17 high, 3 critical)

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
npm warn install-scripts 1 package had install scripts blocked because they are not covered by allowScripts:
npm warn install-scripts   esbuild@0.28.2 (postinstall: node install.js)
npm warn install-scripts
npm warn install-scripts Run `npm install-scripts ls` to review, or `npm install-scripts approve <pkg>` to allow.
```

### sqlite-binding

Started (UTC): 2026-11-18T14:10:33.474125+00:00
Command: `npm run check:sqlite-binding`
Exit code: 0
Raw output: [sqlite-binding.log](sqlite-binding.log)

```text
npm notice run speclang@1.0.0 check:sqlite-binding
npm notice run bash scripts/postinstall-lint-deps.sh --sqlite-binding-only
OK: better-sqlite3 native binding loads (SELECT 1 -> {"x":1})
```

### validate-refs

Started (UTC): 2026-11-18T14:10:33.621067+00:00
Command: `python3 scripts/validate_refs.py`
Exit code: 0
Raw output: [validate-refs.log](validate-refs.log)

```text
All references valid.
```

### validate-autonomous

Started (UTC): 2026-11-18T14:10:33.674183+00:00
Command: `python3 scripts/validate_autonomous.py --project`
Exit code: 0
Raw output: [validate-autonomous.log](validate-autonomous.log)

```text
✓ PASSED (confidence: 1.0)

Checks:
  ✓ Step-by-step descriptions: 100% coverage
  ✓ References: 0/0 resolved
  ✓ Ambiguity: 0 ambiguous terms
  ✓ Metadata: All fields present

Validation Report: @speclang/yaml-schema
─────────────────────────────────────────
✓ PASSED (confidence: 1.0)

Checks:
  ✓ Step-by-step descriptions: 100% coverage
  ✓ References: 3/3 resolved
  ✓ Ambiguity: 0 ambiguous terms
  ✓ Metadata: All fields present

```

### typecheck

Started (UTC): 2026-11-18T14:10:34.132440+00:00
Command: `npx tsc --noEmit`
Exit code: 0
Raw output: [typecheck.log](typecheck.log)

```text
npm notice run speclang@1.0.0 npx
npm notice run 'tsc' --noEmit
```

### tests

Started (UTC): 2026-11-18T14:10:34.970985+00:00
Command: `npm test`
Exit code: 1
Raw output: [tests.log](tests.log)

```text
Error: Test timed out in 40000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
 ❯ tests/db/ralph-loop-lifecycle.test.ts:307:3
    305|   });
    306|
    307|   it("the CLI entry exits 0 on a real SIGTERM instead of being SIGKILL…
       |   ^
    308|     expect(existsSync(TSX)).toBe(true);
    309|     expect(existsSync(RALPH_ENTRY)).toBe(true);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[15/17]⎯


 Test Files  4 failed | 118 passed | 4 skipped (126)
      Tests  17 failed | 2005 passed | 58 skipped (2080)
   Start at  09:10:37
   Duration  481.58s (transform 9.80s, setup 2.13s, import 11.02s, tests 1180.60s, environment 10ms)

```

### integration

Started (UTC): 2026-11-18T14:18:39.099141+00:00
Command: `npm test -- tests/e2e/spec-to-code.test.ts tests/poc-e2e.test.ts tests/dashboard/integration/git-integration.test.tsx`
Exit code: 0
Raw output: [integration.log](integration.log)

```text
npm notice run speclang@1.0.0 pretest
npm notice run npm run build
npm notice run speclang@1.0.0 build
npm notice run tsc
npm notice run speclang@1.0.0 test
npm notice run TMPDIR=$PWD/.tmp vitest run tests/e2e/spec-to-code.test.ts tests/poc-e2e.test.ts tests/dashboard/integration/git-integration.test.tsx

 RUN  v4.1.11 /home/kara/worktrees/SpecLang-README-25


 Test Files  3 passed (3)
      Tests  22 passed (22)
   Start at  09:18:41
   Duration  2.86s (transform 77ms, setup 58ms, import 60ms, tests 1.88s, environment 0ms)

```

### e2e

Started (UTC): 2026-11-18T14:18:44.565320+00:00
Command: `npm test -- tests/e2e`
Exit code: 0
Raw output: [e2e.log](e2e.log)

```text
npm notice run speclang@1.0.0 pretest
npm notice run npm run build
npm notice run speclang@1.0.0 build
npm notice run tsc
npm notice run speclang@1.0.0 test
npm notice run TMPDIR=$PWD/.tmp vitest run tests/e2e

 RUN  v4.1.11 /home/kara/worktrees/SpecLang-README-25


 Test Files  1 passed (1)
      Tests  9 passed (9)
   Start at  09:18:47
   Duration  2.04s (transform 44ms, setup 32ms, import 27ms, tests 1.85s, environment 0ms)

```

### db-filter

Started (UTC): 2026-11-18T14:18:49.610438+00:00
Command: `npm test -- tests/db`
Exit code: 1
Raw output: [db-filter.log](db-filter.log)

```text
Error: timed out after 30000ms waiting for the CLI entry to bootstrap its state DB
 ❯ waitFor tests/db/ralph-loop-lifecycle.test.ts:60:9
     58|     await sleep(2);
     59|   }
     60|   throw new Error(`timed out after ${timeoutMs}ms waiting for ${what}`…
       |         ^
     61| }
     62|
 ❯ tests/db/ralph-loop-lifecycle.test.ts:332:7

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[22/24]⎯


 Test Files  4 failed | 5 passed (9)
      Tests  24 failed | 63 passed (87)
   Start at  09:18:51
   Duration  426.81s (transform 1.64s, setup 632ms, import 1.54s, tests 977.46s, environment 1ms)

```

### test-inventory

Started (UTC): 2026-11-18T14:25:58.289848+00:00
Command: `npx vitest list --filesOnly`
Exit code: 0
Raw output: [test-inventory.log](test-inventory.log)

```text
tests/validation/engine.test.ts
tests/validation/parse-validate.test.ts
tests/validation/rules.test.ts
tests/validation/validate-output.test.ts
tests/dashboard/accessibility/a11y.test.tsx
tests/dashboard/integration/cascade-control.test.tsx
tests/dashboard/integration/git-integration.test.tsx
tests/dashboard/integration/real-time-updates.test.tsx
tests/dashboard/integration/spec-editor.test.tsx
tests/dashboard/hooks/useDashboardState.test.ts
tests/dashboard/hooks/useMCPTools.test.ts
tests/dashboard/hooks/useSSE.test.ts
tests/dashboard/unit/AgentHealth.test.tsx
tests/dashboard/unit/CascadeStatus.test.tsx
tests/dashboard/unit/ControlPanel.test.tsx
tests/dashboard/unit/EventTimeline.test.tsx
tests/dashboard/unit/QueueDepth.test.tsx
tests/dashboard/unit/SystemMetrics.test.tsx
```

### index-entries

Started (UTC): 2026-11-18T14:25:59.183243+00:00
Command: `jq '.specs | length' _index.json`
Exit code: 0
Raw output: [index-entries.log](index-entries.log)

```text
464
```

### index-graph

Started (UTC): 2026-11-18T14:25:59.244644+00:00
Command: `python3 scripts/generate_index.py --graph`
Exit code: 0
Raw output: [index-graph.log](index-graph.log)

```text
  - Specs: 471
  - References: 1269
  - Missing refs: 56
  - Orphans: 183
  - Cycles: 0
  - WARNING: 56 missing reference targets!
      @speclang/validation -> @speclang/validation/rules (children)
      @speclang/validation -> @speclang/validation/tool (children)
      @speclang/validation -> @speclang/validation/language-blocks (children)
      @speclang/test-specs -> @speclang/test-specs/format.spec (children)
      @speclang/test-specs -> @speclang/test-specs/examples.spec (children)
      ... and 51 more
=== Graph Statistics ===
Nodes: 471
Dependency edges: 687
Dependent edges: 687
Most dependencies: @speclang/ui (18)
Most depended on: speclang/core (40)
```

### index-validate

Started (UTC): 2026-11-18T14:25:59.716463+00:00
Command: `python3 scripts/generate_index.py --validate`
Exit code: 1
Raw output: [index-validate.log](index-validate.log)

```text
  - @speclang/ui -> @speclang/ui/overview (children)
  - @speclang/ui -> @speclang/ui/visual-design (children)
  - @speclang/ui -> @speclang/ui/components/cascade-status (children)
  ... and 46 more

✅ No circular dependencies

⚠️  Orphan specs (183) — warnings, not errors:
  - @speclang/scripts-generate-validation-system
  - @speclang/config-spec-dir/defaults
  - @speclang/scripts.generate-opencode-plugin.py
  - @specs/mcp/auth
  - @speclang/cli-spec-dir/installation
  - @speclang/scripts.generate-ralph-loop.py
  - @speclang/cli-spec-dir/integration
  - @speclang/auth/entities
  - @specs/validation/rules/index
  - @specs/mcp/index
```

### lint

Started (UTC): 2026-11-18T14:26:00.535579+00:00
Command: `npm run lint`
Exit code: 0
Raw output: [lint.log](lint.log)

```text
npm notice run speclang@1.0.0 lint
npm notice run NODE_OPTIONS="--require ./scripts/lint/ts6-resolution.cjs" eslint "src/**/*.ts"

/home/kara/worktrees/SpecLang-README-25/src/ralph-loop/types.ts
  11:1  warning  Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-var-requires')

✖ 1 problem (0 errors, 1 warning)
  0 errors and 1 warning potentially fixable with the `--fix` option.

```

### final-status

Started (UTC): 2026-11-18T14:26:06.458741+00:00
Command: `git status --short; git diff --name-only; git diff --exit-code -- _index.json package.json package-lock.json vitest.config.ts tests .coding-hermes .gitreins .opencode/agents`
Exit code: 0
Raw output: [final-status.log](final-status.log)

```text
 M README.md
?? evidence/
README.md
```

### index-hashes

Started (UTC): 2026-11-18T14:27:56.445704+00:00
Command: `git hash-object _index.json && git rev-parse HEAD:_index.json`
Exit code: 0
Raw output: [index-hashes.log](index-hashes.log)

```text
2796d023657de8780ed2225b490b6bc9b27668e3
2796d023657de8780ed2225b490b6bc9b27668e3
```

### saved-index-entries

Started (UTC): 2026-11-18T14:27:56.456352+00:00
Command: `jq '.specs | length' _index.json`
Exit code: 0
Raw output: [saved-index-entries.log](saved-index-entries.log)

```text
464
```

### saved-validate-refs

Started (UTC): 2026-11-18T14:27:56.486879+00:00
Command: `python3 scripts/validate_refs.py`
Exit code: 0
Raw output: [saved-validate-refs.log](saved-validate-refs.log)

```text
All references valid.
```

### saved-validate-autonomous

Started (UTC): 2026-11-18T14:27:56.544173+00:00
Command: `python3 scripts/validate_autonomous.py --project`
Exit code: 0
Raw output: [saved-validate-autonomous.log](saved-validate-autonomous.log)

```text
✓ PASSED (confidence: 1.0)

Checks:
  ✓ Step-by-step descriptions: 100% coverage
  ✓ References: 0/0 resolved
  ✓ Ambiguity: 0 ambiguous terms
  ✓ Metadata: All fields present

Validation Report: @speclang/yaml-schema
─────────────────────────────────────────
✓ PASSED (confidence: 1.0)

Checks:
  ✓ Step-by-step descriptions: 100% coverage
  ✓ References: 3/3 resolved
  ✓ Ambiguity: 0 ambiguous terms
  ✓ Metadata: All fields present

```

### index-tree

Started (UTC): 2026-11-18T14:27:56.980249+00:00
Command: `python3 scripts/generate_index.py --tree @speclang/ui`
Exit code: 0
Raw output: [index-tree.log](index-tree.log)

```text

Depended on by (16):
  └─ @speclang/ui-app
  └─ @speclang/ui-visual-design
  └─ @speclang/ui-index
  └─ @speclang/ui-testing
  └─ @speclang/ui-components-control-panel
  └─ @speclang/ui-interactions
  └─ @speclang/ui-components-agent-health
  └─ @speclang/ui-components-queue-depth
  └─ @speclang/ui-state-management
  └─ @speclang/ui-components-cascade-status
  └─ @speclang/mcp-ui-tools/ui
  └─ @speclang/ui-components-system-metrics
  └─ @speclang/ui-components-event-timeline
  └─ @speclang/ui-components-log-viewer
  └─ @speclang/ui-overview
  └─ @speclang/ui-components-cascade-graph
```

### index-impact

Started (UTC): 2026-11-18T14:27:57.407348+00:00
Command: `python3 scripts/generate_index.py --impact speclang/core`
Exit code: 0
Raw output: [index-impact.log](index-impact.log)

```text
  - specs/implementation-path.spec.md
  - specs/tools.spec.dir/implementations.spec.md
  - specs/cascade.spec.md
  - specs/skills.spec.dir/spec-writer.spec.md
  - specs/external-methodologies.spec.dir/bmad-comparison.spec.md
  - specs/roadmap.spec.dir/production.spec.md
  - specs/agent-protocol.spec.dir/ownership.spec.md
  - specs/roadmap.spec.dir/poc-vs-mvp.spec.md
  - specs/deployment.spec.md
  - specs/roadmap.spec.dir/beta.spec.md
  - specs/skills.spec.md
  - specs/workflow.spec.md
  - specs/bootstrap.spec.dir/phases.spec.md
  - specs/server.spec.md
  - specs/compiler.spec.dir/templates.spec.md
  - specs/opencode-plugin.spec.md
  - specs/ui-dashboard.spec.dir/testing.spec.md
  - specs/test-specs.spec.dir/examples.spec.md
```

### compliance

Started (UTC): 2026-11-18T14:27:57.820384+00:00
Command: `python3 scripts/check_compliance.py --report`
Exit code: 0
Raw output: [compliance.log](compliance.log)

```text
- 📊 Total (non-exempt): 613

## Non-Compliant Files (MUST FIX)
These files have NO corresponding spec:
- ❌ scripts/archive/test_compliance.py
- ❌ scripts/archive/convert_to_symlinks.py
- ❌ scripts/archive/debug_symlink.py
- ❌ scripts/archive/fix-yaml-headers.py
- ❌ scripts/archive/test_symlink.py
- ❌ docs/npm12-allowscripts-probe.md
- ❌ docs/AGENT_DRIVER.md
- ❌ docs/traceability-doctrine.md
- ❌ docs/observability-spec.md
- ❌ docs/gitreins-verdicts.md

## Compliant Files (Working)
✅ 603 files following dual-view pattern

```

### tracked-dist

Started (UTC): 2026-11-18T14:27:58.136115+00:00
Command: `git ls-files dist | wc -l`
Exit code: 0
Raw output: [tracked-dist.log](tracked-dist.log)

```text
0
```

### build

Started (UTC): 2026-11-18T14:27:58.150255+00:00
Command: `npm run build`
Exit code: 0
Raw output: [build.log](build.log)

```text
npm notice run speclang@1.0.0 build
npm notice run tsc
```

### typecheck-final

Started (UTC): 2026-11-18T14:27:59.259048+00:00
Command: `npx tsc --noEmit`
Exit code: 0
Raw output: [typecheck-final.log](typecheck-final.log)

```text
npm notice run speclang@1.0.0 npx
npm notice run 'tsc' --noEmit
```

### scope-final

Started (UTC): 2026-11-18T14:28:00.117124+00:00
Command: `git status --short; git diff --check && git diff --exit-code -- _index.json package.json package-lock.json vitest.config.ts tests .coding-hermes .gitreins .opencode/agents`
Exit code: 0
Raw output: [scope-final.log](scope-final.log)

```text
 M README.md
?? evidence/
```

## Reproduction and boundaries

run-verification.py captures commands individually and records their actual exit codes.
Its own process finishing successfully does not mean every child command passed.
check-evidence.py checks that the protected Agent Roles section is byte-identical
to the immutable measurement base, README suite/file literals were removed, evidence links resolve, and the
tracked diff stays within the allowed scope. Its output is in evidence-check.log.
The full Vitest run and its failure remain authoritative; no tier-2 judge is claimed.
Commit-hook results, if any, are reported separately in the worker handoff.

## Concurrent foreman amendment and provenance correction

The worker's commit command succeeded as `587e838a` (the commit output and guard
result are in [worker-commit.log](worker-commit.log)). While the
worker was still active, an external foreman process amended it to
`0fee44588ea6a746a8c29e995469e68661620692` and appended a handoff note to this
transcript. `git reflog` records both the original commit and the external amend.
The amended tree differs from the worker commit only by that appended note;
[commit-provenance.log](commit-provenance.log) records the reflog evidence.
After the correction, `python3 evidence/readme-25-2026-11-18/check-evidence.py`
exited 0 ([provenance-check.log](provenance-check.log)), checking Agent Roles against
the immutable measurement base, not the already-edited HEAD. `npx tsc --noEmit`
also exited 0 ([postcommit-typecheck.log](postcommit-typecheck.log)).

That note said the worker had been killed before committing and had run an index
`--generate` probe. Those claims do not describe this worker's execution: the worker
remained active, committed its own work, and its command ledger contains no
`--generate` invocation. The amended commit body separately attributes an index
probe/restoration to the foreman. The earlier inference that tests alone caused and
restored the index churn is therefore withdrawn; final byte parity is what was proven.

The foreman's separate `db-solo-rerun.log` is not this worker's `db-filter.log`.
The worker removed that foreign log from its staging set and did not commit it.
No result is claimed for the foreman's partial probe. The worker's own database
filter DID finish: its recorded exit 1 and 24 failed / 63 passed summary are in
`commands.jsonl` and `db-filter.log`, in addition to the completed full-suite run.

The pre-commit hook ran without bypass and returned Tier 1 DEGRADED PASS: secrets
and LSP checks passed, while tests were skipped in diff mode and Python static
analysis had no configured packaging marker/tool. That hook is not a full-suite
pass and does not supersede the direct `npm test` failure above. No tier-2 judge,
push or merge was performed by this worker. This correction is a new commit, not
an amendment or reversal of the external foreman's commit.
