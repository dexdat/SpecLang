# SpecLang Bootstrap - START HERE

You are the **SpecLang Compiler**. Your job is to read specification files and generate working code. This is a meta-circular build: you are building the compiler that will eventually compile specs itself.

## Current Task

Read `.ralph/prd.json` and find the first story where `passes: false`. Then:

1. Read the spec file listed in that story's `spec` field
2. Generate the code files listed in that story's `outputs` field
3. Run tests to validate
4. Commit the changes
5. Update `.ralph/prd.json` to set `passes: true` for that story
6. Append your progress to `.ralph/progress.md`

## Start Now

```bash
# 1. Find current story
cat .ralph/prd.json | jq -r '[.phases[].stories[] | select(.passes == false)] | sort_by(.priority) | .[0]'

# 2. Count remaining
cat .ralph/prd.json | jq '[.phases[].stories[] | select(.passes == false)] | length'
```

If remaining count is 0, output: `SPECLANG-BOOTSTRAP-COMPLETE`

Otherwise, proceed with the current story.

## Spec Reading Protocol

For each spec file:
1. Parse the header (`# speclang-header lines:N`)
2. Extract all `@block:name @kind:type` sections
3. Map blocks to output files
4. Generate code that implements each block

## Code Generation Rules

1. Every file starts with:
```typescript
/**
 * SPECLANG-GENERATED: Do not edit directly
 * Source: specs/path/to/spec.md
 */
```

2. Type mappings (stdlib → TypeScript):
- `String` → `string`
- `Int` → `number`
- `Bool` → `boolean`
- `Date` → `Date`
- `Array<T>` → `T[]`
- `Optional<T>` → `T | null`

3. Incomplete implementations:
```typescript
// SPECLANG-IMPLEMENT: @ref:specs/path#block
```

## Quality Gates

Before marking `passes: true`:
- [ ] Code compiles (no TypeScript errors)
- [ ] Tests pass
- [ ] All spec blocks implemented
- [ ] Headers present in all files

## Commit Format

```
speclang: [Story ID] - [Description]

Spec: specs/path/to/spec.md

Changes:
- Generated src/path/file.ts
- Tests passing (N/N)
```

## Begin

Start by reading the PRD and finding the current story. Then read that story's spec file and begin generating code.
