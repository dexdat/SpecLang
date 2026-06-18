# SpecLang Dogfooding Guide

**Dogfooding** = Using SpecLang to build projects with SpecLang to find bugs.

## Quick Start

```bash
# Run the integration test
python3 scripts/integration-test.py

# Check results
cat _tmp/integration-test-bugs.md
```

## Dogfooding Workflow

### 1. Create Test Project

```bash
# Create fresh test directory
mkdir -p _tmp/test-project-$(date +%Y%m%d)
cd _tmp/test-project-$(date +%Y%m%d)
```

### 2. Initialize SpecLang

```bash
# Use the local SpecLang binary
../../bin/speclang init
```

### 3. Create a Realistic Project Spec

Create `specs/project.scl`:

```markdown
# speclang-header lines:10
id: @test/ecommerce-api
version: 1.0.0
layer: 0
project_level: MVP
agent_support: agent_assisted
tags: [api, ecommerce, test]
short: E-commerce API for dogfooding test
---

# E-Commerce API

A realistic test project to verify SpecLang works end-to-end.

## User Stories

- As a customer, I want to browse products
- As a customer, I want to add items to cart
- As a customer, I want to checkout
- As an admin, I want to manage inventory

## Tech Stack

- Backend: TypeScript/Node.js with Express
- Database: SQLite
- Auth: JWT tokens
- API: REST with OpenAPI spec

## Domain Model

### Product
- id: ID
- name: String
- price: Float
- inventory: Int
- category: Category

### Order
- id: ID
- customerId: ID
- items: Array<OrderItem>
- status: OrderStatus
- total: Float

### User
- id: ID
- email: String
- role: UserRole
- createdAt: DateTime
```

### 4. Generate the Project

```bash
# Start the cascade
../../bin/speclang cascade specs/project.scl

# Or run in daemon mode
../../bin/speclang start
# Edit specs/project.scl and watch it generate
```

### 5. Test the Generated Code

```bash
# Check if code was generated
ls -la src/

# Try to build it
cd src && npm install && npm run build

# Run tests if they exist
npm test
```

### 6. Document Bugs

When you find a bug:

1. **Reproduce it** - Make sure it happens consistently
2. **Document it** - Create a spec in `specs/bugs/`
3. **Add to TODO** - Update TODO.md with the fix needed
4. **Fix it** - Implement the fix in src/
5. **Verify** - Run integration test again

## Bug Report Template

Create `specs/bugs/BUG-ID.spec.md`:

```markdown
# speclang-header lines:8
id: @bugs/cascade-fails-on-nested-refs
version: 1.0.0
layer: 5
tags: [bug, cascade, references]
short: Cascade fails when processing deeply nested references
severity: high
---

# Bug: Cascade Fails on Nested References

## Problem

When a spec references another spec that references a third spec, the cascade fails with:
```
Error: Maximum call stack size exceeded
```

## Reproduction

1. Create spec A that references spec B
2. Create spec B that references spec C
3. Run `speclang cascade specs/a.spec.md`
4. Observe stack overflow

## Root Cause

The cascade coordinator doesn't track visited specs, causing infinite recursion.

## Fix Required

Add a `visited` Set to track processed specs in the cascade coordinator.

## Files to Modify

- src/cascade/coordinator.ts
- Add visited tracking in processSpec()

## Test Case

Create test in tests/cascade/nested-refs.test.ts
```

## Test Scenarios

### Scenario 1: Simple API
Generate a basic REST API with CRUD operations.

**Expected:**
- TypeScript interfaces
- Express routes
- Database schema
- Tests

**Common Bugs:**
- Type mappings incorrect
- Missing imports
- Route handlers not connected

### Scenario 2: Auth System
Generate a JWT-based authentication system.

**Expected:**
- Login/register endpoints
- Password hashing
- JWT middleware
- Protected routes

**Common Bugs:**
- Secret key not configurable
- Token expiration issues
- Middleware order wrong

### Scenario 3: Full Stack App
Generate both backend and frontend.

**Expected:**
- Backend API (TypeScript)
- Frontend (React/Vue)
- Shared types
- Build scripts

**Common Bugs:**
- Shared types not synced
- CORS issues
- Build order wrong

## Integration Test Script

The `scripts/integration-test.py` automates this:

```bash
# Run full test
python3 scripts/integration-test.py

# Output:
# - Creates _tmp/test-project/
# - Runs all test scenarios
# - Generates bug report in _tmp/integration-test-bugs.md
```

## Bug Triage Process

When the integration test finds bugs:

### Step 1: Verify Bug Exists

```bash
# Manually reproduce
cd _tmp/test-project
../../bin/speclang validate specs/broken.spec.md
# Confirm error occurs
```

### Step 2: Create Bug Spec

```bash
# Create bug report spec
cat > specs/bugs/$(date +%Y%m%d)-cascade-error.spec.md << 'EOF'
# speclang-header lines:5
id: @bugs/cascade-error-$(date +%Y%m%d)
version: 1.0.0
severity: high
---

# Bug Description
...
EOF
```

### Step 3: Add to TODO.md

```markdown
## Bug Fixes

### BUG-001: Cascade Error on Deep Nesting
**Status:** 🔴 Open
**Found:** 2026-03-22 during dogfooding

**Problem:** Cascade fails with stack overflow on deeply nested specs
**Root Cause:** No cycle detection in dependency resolution
**Fix:** Add visited set to coordinator

- [ ] Create reproduction test
- [ ] Implement fix in src/cascade/coordinator.ts
- [ ] Add unit test
- [ ] Run integration test to verify
```

### Step 4: Fix It

```bash
# Edit the source
vim src/cascade/coordinator.ts

# Run tests
npm test

# Run integration test
python3 scripts/integration-test.py
```

### Step 5: Mark Complete

Update TODO.md:
```markdown
### BUG-001: Cascade Error on Deep Nesting
**Status:** ✅ Fixed (2026-03-22)
```

## Dogfooding Checklist

Before each release, run through:

- [ ] Create test project with `integration-test.py`
- [ ] Try to generate a REST API
- [ ] Try to generate an auth system
- [ ] Try to generate a full-stack app
- [ ] Verify all generated code compiles
- [ ] Verify all generated tests pass
- [ ] Document any bugs found
- [ ] Fix critical bugs
- [ ] Update changelog

## Success Metrics

A successful dogfooding session means:

1. **Zero critical bugs** - Build/test passes
2. **Working CLI** - All commands functional
3. **Generated code quality** - Follows conventions
4. **Documentation accuracy** - Specs match implementation

## Tips

1. **Start Simple** - Begin with basic CRUD, then add complexity
2. **Test Edge Cases** - Empty specs, invalid refs, large files
3. **Use Real Projects** - Test with actual use cases you have
4. **Time It** - Track how long generation takes
5. **Compare** - Check generated code against hand-written versions

## Common Issues Found

### Issue 1: Type Mappings Wrong
**Symptom:** Generated code has `Int` instead of `number`
**Fix:** Update type mapper in src/codegen/

### Issue 2: Missing Imports
**Symptom:** `Cannot find name 'Date'`
**Fix:** Import tracking in code generator

### Issue 3: Circular Dependencies
**Symptom:** Infinite loop in cascade
**Fix:** Add cycle detection

### Issue 4: Invalid Specs Pass Validation
**Symptom:** `speclang validate` says OK but cascade fails
**Fix:** Strengthen validation rules

## Resources

- Integration test: `scripts/integration-test.py`
- Test projects: `_tmp/test-project*/`
- Bug reports: `specs/bugs/`
- Hard checks: `scripts/hard-checks.py`

## Next Steps

1. Run integration test: `python3 scripts/integration-test.py`
2. Review bug report: `cat _tmp/integration-test-bugs.md`
3. Fix bugs and update TODO.md
4. Re-run until all tests pass
5. Celebrate! 🎉
