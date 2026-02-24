# SPECLANG Baby Steps™ - Validation Checklist

This file defines the mandatory validation steps after each Baby Step.

## Validation Gate - MUST RUN AFTER EVERY CHANGE

After completing any code change, you MUST run these validation steps:

### 1. TypeScript Compilation
```bash
npm run build
```
- If fails: Fix errors immediately, do not proceed
- Must pass before continuing

### 2. Run Tests
```bash
npm test
```
- All tests must pass
- If test fails: Fix the issue, do not proceed

### 3. Header Check
```bash
# Verify speclang-header exists in new .ts files
grep -L "speclang-header" src/**/*.ts
```
- Every .ts file must have header
- Run: `npx speclang-validate-headers` if available

### 4. Type Mapping Check
```bash
# Verify types are properly mapped
grep -r "String\|Int\|Bool\|DateTime" src/ --include="*.ts" | head -5
```
- Should NOT find spec types in generated code
- Should use: string, number, boolean, Date

## Baby Step Validation Requirements

### Each Baby Step Must Have:
- [ ] **Single atomic change** - One file or one clear modification
- [ ] **Compiles** - `npm run build` passes
- [ ] **Tests pass** - `npm test` passes  
- [ ] **Header correct** - speclang-header with @ref: blocks
- [ ] **Commit format** - Message follows: `speclang: baby-step: <description>`
- [ ] **Progress updated** - Entry added to .ralph/progress.md

### Commit Message Format (REQUIRED)
```
speclang: baby-step: <brief description>

Source: specs/path/to/spec.md#block-name
Change: <exactly what changed>
Validation: <how you validated it>
```

### Progress Entry Format (REQUIRED)
```markdown
## [Timestamp] - [Story ID] - Baby Step [N]

### What Changed
- Atomic change: ...

### Why This Change
- Reason: ...

### How Validated
- Compilation: ✓/✗
- Tests: ✓/✗
- Headers: ✓/✗

### Next Baby Step
- What comes next: ...
```

## Story Completion Checklist

When a story is marked complete (passes: true):
- [ ] All outputs from PRD created
- [ ] All tests for that module pass
- [ ] No TODO/FIXME remaining (unless explicitly noted)
- [ ] Story marked `passes: true` in .ralph/prd.json

## Troubleshooting

### If build fails:
1. Check TypeScript errors
2. Fix type mismatches
3. Re-run `npm run build`
4. Do NOT proceed until passes

### If tests fail:
1. Read test output carefully
2. Fix the failing assertion
3. Re-run `npm test`
4. Do NOT proceed until all pass

### If stuck:
1. Break into smaller Baby Steps
2. Validate each step individually
3. Ask for help if needed

---

*This file is part of Baby Steps™ Methodology validation*
*The process is the product*