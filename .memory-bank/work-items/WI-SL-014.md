# WI-SL-014: Transition Upgrade Workflow

**AC:** AC-013
**Spec source:** `specs/transition.spec.md`
**Target:** `src/transition/upgrade/`
**Status:** pending

## Goal

Implement the Transition Upgrade workflow for SpecLang. The spec defines upgrade workflows for moving specs between project maturity levels (POC → MVP → Alpha → Beta → Production) and agent support levels (human_only → agent_assisted → agent_autonomous).

The transition registry (`src/transition/registry.ts`) already exists with `TransitionRegistryImpl`. What's missing is the actual upgrade workflow implementation.

## Deliverables

### 1. `src/transition/upgrade/planner.ts`
- `UpgradePlanner` class with:
  - `plan(from: MaturityLevel, to: MaturityLevel, specs: SpecRef[]): UpgradePlan` — analyzes what needs to happen
  - `check(from: MaturityLevel, to: MaturityLevel, spec: SpecRef): CheckResult` — checks if a spec can be upgraded
  - `Plan` interface with: `specs`, `steps`, `dependencies`, `risks`, `estimatedTime`
  - `CheckResult` interface with: `canUpgrade: boolean`, `blockers: string[]`, `warnings: string[]`

### 2. `src/transition/upgrade/validator.ts`
- `UpgradeValidator` class with:
  - `validate(plan: UpgradePlan): ValidationResult` — runs pre-transition validation
  - Validation checks per level pair (POC→MVP: basic, MVP→Alpha: refs+tests, Alpha→Beta: step-by-step+comprehensive, Beta→Production: security+autonomous)
  - `ValidationResult` interface with: `passed: boolean`, `checks: ValidationCheck[]`
  - `ValidationCheck` interface with: `name: string`, `passed: boolean`, `details: string`

### 3. `src/transition/upgrade/executor.ts`
- `UpgradeExecutor` class with:
  - `execute(plan: UpgradePlan): Promise<ExecutionResult>` — runs the upgrade
  - `rollback(plan: UpgradePlan, result: ExecutionResult): Promise<void>` — rollback on failure
  - `ExecutionResult` interface with: `success: boolean`, `modifiedSpecs: string[]`, `errors: string[]`, `startedAt: Date`, `completedAt: Date`

### 4. `src/transition/upgrade/index.ts`
- Re-export all upgrade types and classes
- Register predefined workflows with the default registry:
  - POC → MVP
  - MVP → Alpha
  - Alpha → Beta
  - Beta → Production

### 5. `tests/transition/upgrade.test.ts`
- Unit tests covering:
  - Planner: plan generation, check correctness, blocked specs detection
  - Validator: passes for valid transitions, fails for invalid
  - Executor: execute success, rollback behavior
  - Registration: workflows registered and discoverable

## Verification

```bash
npm run build && npm test
# Specifically:
npx vitest run tests/transition/upgrade.test.ts
```

## Style Guide

- Use TypeScript with explicit interfaces
- Import from `../registry.ts` for registry types
- Follow the patterns in `src/transition/registry.ts`
- snake_case for object properties, camelCase for TypeScript
- All classes should be exported
- Use `async/await` for the executor

## Constraints

- The upgrade workflow must NOT call external APIs (no Pi Agent SDK calls)
- Must work with the existing `TransitionRegistryImpl`
- Should handle edge cases: same-level upgrade (no-op), invalid level transition, null/undefined specs
