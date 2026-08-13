# speclang-header lines:5
# id: @specs/docs
# version: 1.0.0
# layer: 5

# SpecLang Cascade Demonstration

**Status:** Working example with explicit coordination  
**Last Updated:** 2026-02-22  
**Architecture:** Explicit coordinator with verification gates

## What We Fixed

**The Problem:** The original cascade was fantasy - automatic file watching, automatic agent triggering, automatic convergence detection. None of this works in OpenCode.

**The Solution:** Explicit coordination. The coordinator (you) invokes subagents via the Task tool, runs verification after each step, and decides when to continue.

## Working Example: Hello World

This demonstrates the cascade with a minimal example that actually works.

### The Spec

File: specs/examples.spec.dir/hello-world.spec.md

Contains:
- Proper speclang-header
- TypeScript code block
- Step-by-step verification instructions
- `project_level: Beta` (SL-GAP-037: `agent_autonomous` requires `project_level >= Beta` per the maturity validator, so the flagship example now passes both `speclang validate` and `speclang maturity`)

### Step 1: Invoke Spec Writer

Coordinator (you) invokes: @speclang-spec-writer

Task: Create specs/examples.spec.dir/hello-world.spec.md

**Result:** Spec created

### Step 2: Verification Gate 1 - Reference Validation

Command: python3 scripts/validate_refs.py

**Result:** All references valid

### Step 3: Verification Gate 2 - Spec Validation

Command: python3 scripts/validate_autonomous.py --file specs/examples.spec.dir/hello-world.spec.md

**Result:** PASSED (confidence: 1.0)

### Step 4: Invoke Code Generator

Coordinator (you) invokes: @speclang-code-gen

Task: Generate TypeScript from spec
Target: src/examples/hello-world.ts

**Result:** Code generated with proper header

### Step 5: Verification Gate 3 - Compilation

Command: npx tsc --noEmit

**Result:** PASSED (no errors, exit code 0)

### Step 6: Invoke Verifier

Coordinator (you) invokes: @speclang-verifier

Task: Verify cascade step and create steering packet

**Result:** Accurate steering packet created with verified=true

### Step 7: User Decision

Coordinator presents results and asks: Continue with next example?

## What Actually Happened

### Before (Broken)
1. Spec written
2. AI "simulates" cascade
3. Code generated (maybe)
4. AI claims "tests pass: 18"
5. No verification
6. Steering packet lies about quality

### After (Working)
1. Spec written
2. Coordinator explicitly invokes spec-writer
3. Verification gate: validate_refs.py
4. Coordinator explicitly invokes code-gen
5. Verification gate: npx tsc --noEmit
6. Coordinator explicitly invokes verifier
7. Verifier actually checks compilation
8. Steering packet reflects verified truth

## Key Principles

1. **Explicit over Automatic**
   - No file watching -> Manual trigger
   - No auto-routing -> Explicit Task invocation
   - No auto-convergence -> User decides

2. **Verification Gates**
   - After EVERY agent
   - Mandatory compilation checks
   - Accurate test counts
   - No wishful thinking

3. **Ground Truth**
   - Verifier checks reality
   - Steering packets accurate
   - Quality scores justified
   - Errors clearly reported

## Running the Demo

1. Validate references: python3 scripts/validate_refs.py
2. Check spec validation: python3 scripts/validate_autonomous.py --file specs/examples.spec.dir/hello-world.spec.md
3. Verify compilation: npx tsc --noEmit
4. Check steering packets: cat .speclang/steering_packets.json | grep architecture-redesign

## Success Metrics

Before:
- 150 adversarial issues
- Code doesn't compile
- Tests don't import
- Steering packets lie
- No working examples

After:
- Hello World compiles
- References validate
- Verification gates work
- Accurate steering packets
- Working example

**Progress:** From 0% to 1% working. But that 1% is REAL.

## Conclusion

The cascade works. Not automatically. Not magically. But explicitly and verifiably.

This is the foundation. From here, we can build more examples, fix the test suite, and eventually bootstrap the code generation.

**Status:** Hello World works. More to come.
