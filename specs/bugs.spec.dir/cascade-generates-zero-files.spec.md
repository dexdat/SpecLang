# speclang-header lines:10
id: "@bugs/cascade-generates-zero-files"
version: 1.0.0
layer: 5
tags: [bug, cascade, code-generation, documentation]
short: Cascade completes but generates 0 files - needs better error messages
project_level: Alpha
agent_support: agent_autonomous
status: draft
---

# Bug: Cascade Generates 0 Files Without Clear Explanation

## Problem

When running `speclang cascade` on a spec without TypeScript code blocks, it reports "success" but generates 0 files. This is confusing to users.

## Reproduction

```bash
cd _tmp/test-project
../../bin/speclang cascade specs/greeting.spec.md

# Output:
# 🔄 Running cascade...
#    Spec: /Users/lexykwaii/Code/SpecLang/_tmp/test-project/specs/greeting.spec.md
# 
# ✅ Cascade complete
#    Generated: 0 files
#    Converged: Yes
```

## Root Cause

The cascade only generates code from TypeScript code blocks (```typescript ... ```). If a spec only has descriptions (markdown text), no code is generated.

Our test spec has:
```markdown
### @block::greeting @kind:function
Generate a greeting message for a user.

**Parameters:**
- name: String - The name to greet
...
```

But NO code block like:
```markdown
### @block::greeting @kind:function
```typescript
export function greeting(name: string): string {
  return `Hello, ${name}!`;
}
```
```

## Expected Behavior

Option 1: **Clear error message**
```
⚠️  No TypeScript code blocks found in spec
   The cascade completed but no files were generated.
   Add TypeScript code blocks (```typescript) to generate code.
```

Option 2: **AI generation from descriptions**
Use AI to generate code from the parameter descriptions automatically.

## Fix Required

Update cascade to:
1. Count code blocks found
2. If 0 blocks, show helpful error
3. Suggest adding code blocks or using AI generation

```javascript
// In runCascade function
if (generatedFiles.length === 0) {
  console.log('⚠️  No TypeScript code blocks found in spec');
  console.log('   Add code blocks with ```typescript to generate code');
}
```

## Files to Modify

- [ ] specs/implementation.spec.dir/src/cascade/index.ts
- [ ] Update runCascade to check for 0 files
- [ ] Add helpful error messages

## Test

```bash
# Create spec without code blocks
./bin/speclang cascade specs/no-code.spec.md
# Should show: "⚠️  No TypeScript code blocks found"

# Create spec with code blocks
./bin/speclang cascade specs/with-code.spec.md
# Should show: "✅ Generated 3 files"
```

## Workaround

Add TypeScript code blocks to specs:

```markdown
### @block::greeting @kind:function
Generate a greeting message for a user.

**Parameters:**
- name: String - The name to greet

```typescript
export function greeting(name: string, greeting: string = 'Hello'): string {
  return `${greeting}, ${name}!`;
}
```

## Resolution (2026-03-22)

Fixed by adding warning message when cascade generates 0 files:

- Added `warning` field to `CascadeResult` interface
- Cascade runner now sets warning when no TypeScript code blocks found
- CLI now displays warning with ⚠️ icon
- Message: "No TypeScript code blocks found in spec. Add code blocks with \`\`\`typescript to generate code."

```
