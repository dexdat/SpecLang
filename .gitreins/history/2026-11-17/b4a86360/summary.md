# Verdict: DF-SPECLANG-8

**Task:** make the flagship example spec's verification steps actually run
**Evaluated:** 2026-11-17T06:45:39.960800
**Result:** ✓ PASS

## Criteria

- ✓ **From a fresh clone at HEAD the four Verification Steps in specs/examples.spec.dir/hello-world.spec.md run verbatim in order: each exits 0 and step 4 prints Hello, SpecLang!; a test executes the spec's own steps so they cannot rot; npm run build exits 0 and npx tsc --noEmit -p tsconfig.json exits 0**
  - PASS: step2 `npx tsc --noEmit -p tsconfig.json` -> TSC_EXIT=0. step3 `npm run build && node dist/src/examples/hello-world.js` -> printed "Hello, SpecLang!" EXIT=0. step4 expected string "Hello, SpecLang!" matches. step1 path src/examples/hello-world.ts exists (symlink to specs/examples.spec.dir/src/hello-world.ts) and exports helloWorld. Test: TMPDIR=$PWD/.tmp npx vitest run tests/spec-example-verification.test.ts --reporter=verbose -> 5 passed (5), exit 0; test parses steps from markdown (parseVerificationSteps) and executes them verbatim via execSync cwd=REPO_ROOT. [resolution 0.01; specs/examples.spec.dir/hello-world.spec.md, tsconfig.json]

## Pipeline Stages

- ✓ **tier1**
  -   ✓ secrets: ok (no output)
  ✓ build: npm notice run speclang@1.0.0 build
  ✓ tests: Start at  01:42:48
- ✓ **tier2**
  - COMPLETE
  ✓ From a fresh clone at HEAD the four Verification Steps in specs/examples.spec.dir/hello-world.spec.md run verbatim in order: each exits 0 and step 4 prints Hello, SpecLang!; a test executes the spec's own steps so they cannot rot; npm run build exits 0 and npx tsc --noEmit -p tsconfig.json exits 0: PASS: step2 `npx tsc --noEmit -p tsconfig.json` -> TSC_EXIT=0. step3 `npm run build && node dist/src/examples/hello-world.js` -> printed "Hello, SpecLang!" EXIT=0. step4 expected string "Hello, SpecLang!" matches. step1 path src/examples/hello-world.ts exists (symlink to specs/examples.spec.dir/src/hello-world.ts) and exports helloWorld. Test: TMPDIR=$PWD/.tmp npx vitest run tests/spec-example-verification.test.ts --reporter=verbose -> 5 passed (5), exit 0; test parses steps from markdown (parseVerificationSteps) and executes them verbatim via execSync cwd=REPO_ROOT. [resolution 0.01; specs/examples.spec.dir/hello-world.spec.md, tsconfig.json]
The flagship example spec's four verification steps run verbatim and pass at HEAD, and a vitest test parses and executes those same steps so they cannot silently rot.

## Summary

Stage tier1: PASS
    ✓ secrets: ok (no output)
  ✓ build: npm notice run speclang@1.0.0 build
  ✓ tests: Start at  01:42:48

Stage tier2: PASS
  COMPLETE
  ✓ From a fresh clone at HEAD the four Verification Steps in specs/examples.spec.dir/hello-world.spec.md run verbatim in order: each exits 0 and step 4 prints Hello, SpecLang!; a test executes the spec's own steps so they cannot rot; npm run build exits 0 and npx tsc --noEmit -p tsconfig.json exits 0: PASS: step2 `npx tsc --noEmit -p tsconfig.json` -> TSC_EXIT=0. step3 `npm run build && node dist/src/examples/hello-world.js` -> printed "Hello, SpecLang!" EXIT=0. step4 expected string "Hello, SpecLang!" matches. step1 path src/examples/hello-world.ts exists (symlink to specs/examples.spec.dir/src/hello-world.ts) and exports helloWorld. Test: TMPDIR=$PWD/.tmp npx vitest run tests/spec-example-verification.test.ts --reporter=verbose -> 5 passed (5), exit 0; test parses steps from markdown (parseVerificationSteps) and executes them verbatim via execSync cwd=REPO_ROOT. [resolution 0.01; specs/examples.spec.dir/hello-world.spec.md, tsconfig.json]
The flagship example spec's four verification steps run verbatim and pass at HEAD, and a vitest test parses and executes those same steps so they cannot silently rot.

Overall: PASS ✓
