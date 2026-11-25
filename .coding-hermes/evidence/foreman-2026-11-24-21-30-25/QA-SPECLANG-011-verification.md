# QA-SPECLANG-011 verification (foreman tick speclang-foreman-2026-11-24-21-30-25)

Fix commit: 6b17ff9e (merge 77099940, origin/main)
Files: vitest.config.ts, .gitignore

AC1 — include/exclude sets decide the real tree (quoted):
  $ find tests/e2e -name '*.spec.ts' | wc -l
  0            <- the removed exclude glob 'tests/e2e/**/*.spec.ts' matched NOTHING, so its removal cannot change collection
  $ npx vitest list | grep -c '^tests/e2e/'
  9            <- tests/e2e/spec-to-code.test.ts cases ARE collected (intentionally included; intent recorded as a comment in vitest.config.ts)

AC2 — output dir ignored:
  $ git check-ignore test-spec-to-code-output ; echo $?
  0            <- exit 0 = ignored (.gitignore:10)

AC3 — lint/test at the fix commit:
  npm run lint: green (repo gate, unchanged by this diff)
  npm test: RED for the PRE-EXISTING CI class, not this change — CI run 45281490023 fails on
  (a) 3 daemon suites: Cannot find module './daemon-prom'
  (b) 8 parser/codegen/pipeline/db tests: parseSpecContent returns 0 blocks
  Both are the INT-CI-3 signature and are owned by the INT-CI-3 worker dispatched in this same tick.
  This change touches neither daemon loading nor the block parser; it removes a no-op exclude and
  adds a gitignore entry, so it cannot introduce or mask either failure.

Verdict: AC1/AC2 met with command evidence; AC3's absolute green is blocked by INT-CI-3 with the
failure set attributed — same closure convention as QA-SPECLANG-012.
