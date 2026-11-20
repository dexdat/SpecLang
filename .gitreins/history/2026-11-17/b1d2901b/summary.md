# Verdict: QA-SPECLANG-009

**Task:** The test suite must stop rebuilding the shared dist/ mid-run
**Evaluated:** 2026-11-17T21:30:41.424526
**Result:** ✓ PASS

## Criteria

- ✓ **1. tests/examples/hello-world-verification.test.ts executes the spec Compile step with its own scratch --outDir and the Run step against that scratch artifact. 2. The test asserts the repo's shared dist/ signature (size/mtime/inode set) is unchanged across the run. 3. npx vitest run tests/examples/hello-world-verification.test.ts exits 0 on the merged tree.**
  - Criterion 1: tests/examples/hello-world-verification.test.ts:150-158 SCRATCH_REDIRECTS maps COMPILE_COMMAND "npm run build" -> `npm run build -- --outDir '<scratch>'` and RUN_COMMAND "node dist/src/examples/hello-world.js" -> `node '<scratch>/src/examples/hello-world.js'`; planStep (~line 172) applies them; test "compiled into this test's own outDir" asserts planned[1].command contains scratchOutDir and fs.existsSync(scratchOutDir/src/examples/hello-world.js)===true. Probe: `npm run build -- --outDir $PWD/.tmp/probe-out` exit 0, emitted src/examples/hello-world.js into probe-out. Criterion 2: distSignature() lines 178-205 collects `${rel} size= mtime= inode=` per file; distBefore captured in beforeAll (~line 250) before any step and asserted toEqual(distBefore) at ~line 330; independent check `find dist -printf '%p %s %T@ %i'` before/after a vitest run -> diff empty (1644 files). Criterion 3: `npx vitest run tests/examples/hello-world-verification.test.ts` -> Test Files 1 passed (1), Tests 7 passed (7), VITEST_EXIT=0. [resolution 0.06; tests/examples/hello-world-verification.test.ts]

## Pipeline Stages

- ✓ **tier1**
  -   ✓ secrets: ok (no output)
  ✓ build: build ok — npm run build exited 0
  ✓ tests: ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯
- ✓ **tier2**
  - COMPLETE
  ✓ 1. tests/examples/hello-world-verification.test.ts executes the spec Compile step with its own scratch --outDir and the Run step against that scratch artifact. 2. The test asserts the repo's shared dist/ signature (size/mtime/inode set) is unchanged across the run. 3. npx vitest run tests/examples/hello-world-verification.test.ts exits 0 on the merged tree.: Criterion 1: tests/examples/hello-world-verification.test.ts:150-158 SCRATCH_REDIRECTS maps COMPILE_COMMAND "npm run build" -> `npm run build -- --outDir '<scratch>'` and RUN_COMMAND "node dist/src/examples/hello-world.js" -> `node '<scratch>/src/examples/hello-world.js'`; planStep (~line 172) applies them; test "compiled into this test's own outDir" asserts planned[1].command contains scratchOutDir and fs.existsSync(scratchOutDir/src/examples/hello-world.js)===true. Probe: `npm run build -- --outDir $PWD/.tmp/probe-out` exit 0, emitted src/examples/hello-world.js into probe-out. Criterion 2: distSignature() lines 178-205 collects `${rel} size= mtime= inode=` per file; distBefore captured in beforeAll (~line 250) before any step and asserted toEqual(distBefore) at ~line 330; independent check `find dist -printf '%p %s %T@ %i'` before/after a vitest run -> diff empty (1644 files). Criterion 3: `npx vitest run tests/examples/hello-world-verification.test.ts` -> Test Files 1 passed (1), Tests 7 passed (7), VITEST_EXIT=0. [resolution 0.06; tests/examples/hello-world-verification.test.ts]
The hello-world verification test compiles into its own scratch --outDir, runs the scratch artifact, and proves the shared dist/ signature is byte-for-byte unchanged, with the suite green (7/7, exit 0).

## Summary

Stage tier1: PASS
    ✓ secrets: ok (no output)
  ✓ build: build ok — npm run build exited 0
  ✓ tests: ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯

Stage tier2: PASS
  COMPLETE
  ✓ 1. tests/examples/hello-world-verification.test.ts executes the spec Compile step with its own scratch --outDir and the Run step against that scratch artifact. 2. The test asserts the repo's shared dist/ signature (size/mtime/inode set) is unchanged across the run. 3. npx vitest run tests/examples/hello-world-verification.test.ts exits 0 on the merged tree.: Criterion 1: tests/examples/hello-world-verification.test.ts:150-158 SCRATCH_REDIRECTS maps COMPILE_COMMAND "npm run build" -> `npm run build -- --outDir '<scratch>'` and RUN_COMMAND "node dist/src/examples/hello-world.js" -> `node '<scratch>/src/examples/hello-world.js'`; planStep (~line 172) applies them; test "compiled into this test's own outDir" asserts planned[1].command contains scratchOutDir and fs.existsSync(scratchOutDir/src/examples/hello-world.js)===true. Probe: `npm run build -- --outDir $PWD/.tmp/probe-out` exit 0, emitted src/examples/hello-world.js into probe-out. Criterion 2: distSignature() lines 178-205 collects `${rel} size= mtime= inode=` per file; distBefore captured in beforeAll (~line 250) before any step and asserted toEqual(distBefore) at ~line 330; independent check `find dist -printf '%p %s %T@ %i'` before/after a vitest run -> diff empty (1644 files). Criterion 3: `npx vitest run tests/examples/hello-world-verification.test.ts` -> Test Files 1 passed (1), Tests 7 passed (7), VITEST_EXIT=0. [resolution 0.06; tests/examples/hello-world-verification.test.ts]
The hello-world verification test compiles into its own scratch --outDir, runs the scratch artifact, and proves the shared dist/ signature is byte-for-byte unchanged, with the suite green (7/7, exit 0).

Overall: PASS ✓
