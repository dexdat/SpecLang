# Verdict: README-23

**Task:** README generate/cascade examples reproduce
**Evaluated:** 2026-11-18T01:02:25.395332
**Result:** ✓ PASS

## Criteria

- ✓ **Running each documented generate/cascade command exactly as the README shows exits 0 and produces the depicted output tree (paths and names match both directions), and the dry-run wording matches observed behaviour.**
  - Ran both commands verbatim from the repo root. (1) `./bin/speclang generate specs/examples.spec.dir/hello-world.spec.md --dry-run` -> exit 0, stdout contains `Mode: DRY RUN`, `Files written: 0`, `📁 Would generate:` / `- src/generated/hello-world.spec-hello-function.ts` — exactly the README.md:420-424 depiction. (2) Dropping --dry-run -> exit 0, `Mode: LIVE`, `Files written: 1`, same path; file exists at src/generated/hello-world.spec-hello-function.ts. (3) `./bin/speclang cascade specs/examples.spec.dir/hello-world.spec.md` -> exit 0, `✅ Cascade complete` / `Generated: 1 files` / `Converged: Yes` / `- /home/kara/speclang/specs/generated/hello/function.ts` — matches README.md:426-431 including the 'printed as an absolute path under the repo root' note; file exists at specs/generated/hello/function.ts. Supporting claims also hold: `./bin/speclang cascade --help` lists no --dry-run flag (README: 'cascade has no --dry-run flag'), `git status --porcelain` shows no generated/ entries after both runs (README: 'leaves git status clean'; .gitignore:2 `generated/`), and src/cascade/index.ts:86 `path.join(specDir,'..','generated')` is the documented rule. Tests: `TMPDIR=$PWD/.tmp npx vitest run tests/cli/generate-extraction.test.ts tests/examples/hello-world-verification.test.ts` -> exit 0, `Test Files 2 passed (2)`, `Tests 11 passed (11)`; `npx vitest run tests/e2e/spec-to-code.test.ts` -> exit 0, `Tests 9 passed (9)`.

## Pipeline Stages

- ✓ **tier1**
  -   ✓ secrets: ok (no output)
  ✓ build: build ok — npm run build exited 0
  ✓ tests: Start at  20:00:32
- ✓ **tier2**
  - COMPLETE
  ✓ Running each documented generate/cascade command exactly as the README shows exits 0 and produces the depicted output tree (paths and names match both directions), and the dry-run wording matches observed behaviour.: Ran both commands verbatim from the repo root. (1) `./bin/speclang generate specs/examples.spec.dir/hello-world.spec.md --dry-run` -> exit 0, stdout contains `Mode: DRY RUN`, `Files written: 0`, `📁 Would generate:` / `- src/generated/hello-world.spec-hello-function.ts` — exactly the README.md:420-424 depiction. (2) Dropping --dry-run -> exit 0, `Mode: LIVE`, `Files written: 1`, same path; file exists at src/generated/hello-world.spec-hello-function.ts. (3) `./bin/speclang cascade specs/examples.spec.dir/hello-world.spec.md` -> exit 0, `✅ Cascade complete` / `Generated: 1 files` / `Converged: Yes` / `- /home/kara/speclang/specs/generated/hello/function.ts` — matches README.md:426-431 including the 'printed as an absolute path under the repo root' note; file exists at specs/generated/hello/function.ts. Supporting claims also hold: `./bin/speclang cascade --help` lists no --dry-run flag (README: 'cascade has no --dry-run flag'), `git status --porcelain` shows no generated/ entries after both runs (README: 'leaves git status clean'; .gitignore:2 `generated/`), and src/cascade/index.ts:86 `path.join(specDir,'..','generated')` is the documented rule. Tests: `TMPDIR=$PWD/.tmp npx vitest run tests/cli/generate-extraction.test.ts tests/examples/hello-world-verification.test.ts` -> exit 0, `Test Files 2 passed (2)`, `Tests 11 passed (11)`; `npx vitest run tests/e2e/spec-to-code.test.ts` -> exit 0, `Tests 9 passed (9)`.
Both documented generate (dry-run and live) and cascade commands were run verbatim and exit 0 with output paths, names and dry-run wording matching the README exactly, with the relevant CLI/example tests green. [uncovered failure paths: failure mode 0 (The README's cascade example output tree (specs/generated/hello/function.ts) is not asserted by any test, so a future change to the cascade output rule could silently invalidate the README example): detected_by is empty — uncovered failure path]

## Summary

Stage tier1: PASS
    ✓ secrets: ok (no output)
  ✓ build: build ok — npm run build exited 0
  ✓ tests: Start at  20:00:32

Stage tier2: PASS
  COMPLETE
  ✓ Running each documented generate/cascade command exactly as the README shows exits 0 and produces the depicted output tree (paths and names match both directions), and the dry-run wording matches observed behaviour.: Ran both commands verbatim from the repo root. (1) `./bin/speclang generate specs/examples.spec.dir/hello-world.spec.md --dry-run` -> exit 0, stdout contains `Mode: DRY RUN`, `Files written: 0`, `📁 Would generate:` / `- src/generated/hello-world.spec-hello-function.ts` — exactly the README.md:420-424 depiction. (2) Dropping --dry-run -> exit 0, `Mode: LIVE`, `Files written: 1`, same path; file exists at src/generated/hello-world.spec-hello-function.ts. (3) `./bin/speclang cascade specs/examples.spec.dir/hello-world.spec.md` -> exit 0, `✅ Cascade complete` / `Generated: 1 files` / `Converged: Yes` / `- /home/kara/speclang/specs/generated/hello/function.ts` — matches README.md:426-431 including the 'printed as an absolute path under the repo root' note; file exists at specs/generated/hello/function.ts. Supporting claims also hold: `./bin/speclang cascade --help` lists no --dry-run flag (README: 'cascade has no --dry-run flag'), `git status --porcelain` shows no generated/ entries after both runs (README: 'leaves git status clean'; .gitignore:2 `generated/`), and src/cascade/index.ts:86 `path.join(specDir,'..','generated')` is the documented rule. Tests: `TMPDIR=$PWD/.tmp npx vitest run tests/cli/generate-extraction.test.ts tests/examples/hello-world-verification.test.ts` -> exit 0, `Test Files 2 passed (2)`, `Tests 11 passed (11)`; `npx vitest run tests/e2e/spec-to-code.test.ts` -> exit 0, `Tests 9 passed (9)`.
Both documented generate (dry-run and live) and cascade commands were run verbatim and exit 0 with output paths, names and dry-run wording matching the README exactly, with the relevant CLI/example tests green. [uncovered failure paths: failure mode 0 (The README's cascade example output tree (specs/generated/hello/function.ts) is not asserted by any test, so a future change to the cascade output rule could silently invalidate the README example): detected_by is empty — uncovered failure path]

Overall: PASS ✓
