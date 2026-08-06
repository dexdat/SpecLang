# speclang-header lines:11
id: "@bugs/integration-test-template"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
tags: [bug, template, documentation]
short: Template for documenting bugs found during dogfooding
severity: low
status: template
---

# Bug Report Template

Copy this template when filing bugs found during integration testing.

## Bug Information

- **ID:** BUG-XXX (auto-generated)
- **Found During:** Integration test / Dogfooding
- **Date Found:** YYYY-MM-DD
- **Severity:** critical / high / medium / low
- **Status:** open / in-progress / fixed

## Problem Description

Clear description of what went wrong.

## Reproduction Steps

1. Step 1
2. Step 2
3. Step 3

**Expected Result:**
What should have happened

**Actual Result:**
What actually happened

## Error Messages

```
Paste any error messages here
```

## Root Cause Analysis

Why did this happen? (if known)

## Fix Required

### Option 1: Quick Fix
Describe the quick fix

### Option 2: Proper Fix
Describe the proper architectural fix

## Files to Modify

- src/path/to/file1.ts - Change description
- src/path/to/file2.ts - Change description
- specs/path/to/spec.spec.md - Update spec

## Testing

- [ ] Unit test added
- [ ] Integration test updated
- [ ] Manually verified

## Related

- Related specs: <spec-id>
- Similar bugs: <bug-id>
