# WI-SL-015: Fix 62 Test Failures — Upgrade Implementation API Gap

**Source:** AC-013 (Transition Upgrade Workflow)
**Created:** 2026-06-19 15:40 UTC
**Status:** in_progress

## Problem

`npm test` has 62 failures across 3 test files (all in `npm run build` passes):

- `tests/upgrade.test.ts` — 31 failures
- `tests/transition/upgrade.test.ts` — 31 failures (identical copy)
- `tests/transition-registry.test.ts` — import error (no tests run)

## Root Cause

The implementation in `specs/transition-workflows.spec.dir/src/upgrade/` uses a **different API** than what the tests expect.

### Gap 1: Planner API mismatch
- **Tests call:** `planner.plan('POC', 'MVP', specs)` → `{ from, to, specs, checks, estimatedDuration }`
- **Tests call:** `planner.check(spec, target_level)` → check results
- **Tests call:** `planner.isValidTransition('POC', 'MVP')` → boolean
- **Tests call:** `planner.listTransitionPaths()` → paths array
- **Implementation has:** `planner.createPlan(spec, target, options)` (different signature)

### Gap 2: Validator return type
- **Tests expect:** `validator.validate(plan)` → `{ valid, errors }`
- **Implementation returns:** `{ canTransition, plan, results, blockingChecks }`

### Gap 3: Executor missing rollback
- **Tests call:** `executor.rollback(plan, result)`
- **Implementation missing:** no `rollback()` method

### Gap 4: registerUpgradeWorkflows missing
- **Tests import:** `registerUpgradeWorkflows` from index
- **Index exports:** No `registerUpgradeWorkflows` function
- **Expected:** Registers 6 workflows: POC→MVP, MVP→Alpha, Alpha→Beta, Beta→Production, human_only→agent_assisted, agent_assisted→agent_autonomous

### Gap 5: Missing types
- **Tests import:** `SpecRef`, `UpgradePlan` (with `from`, `to`, `specs`, `checks`, `estimatedDuration`), `ValidationResult`, `ExecutionResult`
- **Implementation has:** Different shape for same types

### Gap 6: Duplicate import in transition-registry.test.ts
- Lines 241-573 contain a copy of upgrade tests appended to the file, causing `TransitionRegistryImpl` redeclaration

## Files to modify

- `specs/transition-workflows.spec.dir/src/upgrade/planner.ts` (symlinked to `src/transition/upgrade/planner.ts`)
- `specs/transition-workflows.spec.dir/src/upgrade/validator.ts`
- `specs/transition-workflows.spec.dir/src/upgrade/executor.ts`
- `specs/transition-workflows.spec.dir/src/upgrade/types.ts`
- `specs/transition-workflows.spec.dir/src/upgrade/index.ts`
- `tests/transition-registry.test.ts` (remove lines 241-573)

## Verification

```bash
cd /home/kara/SpecLang && npx vitest run tests/upgrade.test.ts tests/transition/upgrade.test.ts tests/transition-registry.test.ts
# All 62+ tests must pass
```

Then `npm run build && npm test` — full regression: 2176+ passing, 0 failing.
