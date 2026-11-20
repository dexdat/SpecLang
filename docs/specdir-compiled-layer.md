# Decision: the tracked compiled spec-dir layer

**Status:** accepted (QA-SPECLANG-010)
**Scope:** `specs/**/src/**/*.js` and their `.d.ts` / `.map` siblings — the
compiled artifacts committed next to the spec-dir TypeScript sources.
**Enforcement (blocking, in CI):** `tests/specdir-compiled-parity.test.ts`, which
`npm test` runs as a blocking CI step. It exercises both gates: it imports
`compareModules` from `scripts/check-specdir-parity.mjs` for guard-module symbol
parity, and it spawns `scripts/audit-specdir-requires.mjs` and requires
`0 failing, 0 stale baseline entries`. Each gate also has a negative control in
that file (a scratch tree with a dangling require, and a synthetic module that
loses a guard export), so both can be shown to go red.
The two npm scripts (`audit:specdir`, `check:specdir-parity`) are the local and
operator entry points. A dedicated two-step CI job is staged in
`.coding-hermes/pending/ci-specdir-audit-step.patch` — it is not applied because
the fleet push credential cannot write `.github/workflows/**` (INT-CI-1), and the
suite assertion above keeps the protection in place until it can be.

## The problem this decision answers

The `.ts` files under `specs/*.spec.dir/src/` are SpecLang's real source: `src/**`
holds tracked symlinks into them, and `tsconfig.json` maps the
`*.spec.dir/src/*` aliases onto them. Next to those sources the repository also
tracks **440 compiled `.js` files**, produced by compiling the spec-dir modules in
place at some point and committed since.

That layer had drifted, and it is not inert:

- `tests/workflow/conversation.test.ts` imports
  `specs/workflow.spec.dir/src/conversation.js` **at runtime**, so the artifact —
  not the source — is what the suite exercises.
- `specs/sqlite.spec.dir/src/index.ts` installs the state-database corruption
  guard (`STATE_DB_CORRUPT_CODE`, `CorruptStateDatabaseError`,
  `isNotADatabaseError`, `stateDatabaseCorruptionMessage`, `openStateDatabase`,
  `withStateDatabase`) because better-sqlite3 defers reading the file header
  until the first statement. The tracked
  `specs/sqlite.spec.dir/src/index.js` predated that guard entirely — it still
  reached `new Database()` directly. Any consumer following the artifact
  inherited a silent bypass of the guard the source installs.
- 29 relative `require()` calls in the layer point at nothing: paths written for
  the `src/` projection but off by one level for the `specs/` tree, plus
  requires into modules that were never compiled into the layer.

Nothing detected any of this, because nothing compared artifact to source.

## Decision

**The layer is kept — a projection, never a second source of truth — and
regeneration is applied to the modules whose divergence changes behaviour
(guard-bearing modules), not to the tree wholesale.**

1. **The `.ts` source is authoritative.** Nothing writes the compiled artifacts by
   hand. The only sanctioned writer is `npm run regenerate:specdir`
   (`scripts/regenerate-specdir-layer.mjs`), which recompiles a module from its
   source with a throwaway tsconfig that *extends the repo's own*
   `tsconfig.json` (so emit options cannot drift) and writes back only that
   module's `.js` / `.d.ts` / maps.
2. **No guard-bearing artifact may silently disagree with its source.**
   `npm run check:specdir-parity` finds every module whose source exports a
   state-DB opener or corruption diagnostic (`GUARD_SYMBOLS` in
   `scripts/lib/specdir-compiled-layer.mjs`) and requires the compiled artifact to
   export **exactly** the same value symbols. Those modules are regenerated from
   source and the gate is blocking in CI; `tests/specdir-compiled-parity.test.ts`
   pins the same comparison inside the suite and loads the compiled sqlite
   artifact to assert the guard symbols are really there at runtime.
3. **Whole-layer freshness is reported, not gated.** The parity script also
   compares every tracked artifact against a fresh compile, but that number is a
   report (a `--strict-freshness` flag turns it into a gate once the layer is
   clean). Reason, measured: compiling the whole tree at this revision emits
   behavioural changes that the committed artifacts do not have — e.g.
   `specs/parser.spec.dir/src/header.ts` matches `@block::` (double colon) and
   prefixes block ids with `@block::`, while the artifact and the suite use
   `@block:`; regenerating 286 artifacts for a trial run turned 4 pre-existing
   failures into 34 failures across 14 files (parser, codegen, mcp, db, workflow).
   Freshness drift is therefore visible on every CI run but does not decide the
   build; closing it is the follow-up work of fixing the sources first.
4. **A require that cannot resolve is a recorded decision, not silence.**
   `npm run audit:specdir` resolves every relative `require()` in the layer against
   the tree. Exceptions live in `scripts/specdir-requires-baseline.json`; each
   entry carries a `reason` and a `proof` class that the audit re-verifies on every
   run:
   - `source-only` — the required module exists, but only as `.ts`/`.tsx` (the
     layer's membership is partial; see below).
   - `runtime-projection` — the specifier is written for the `src/` projection of
     the same source and resolves there to a tracked symlink that
     `npm run build` compiles.
   - `missing` — nothing by that name exists in either form; accepted only where
     the artifact has no importer anywhere in the tree.

   An entry whose require starts resolving, or whose proof no longer holds,
   **fails** the audit. The list cannot rot into a blanket exception.

`npm run build`, `npm run lint` and `npm test` are unaffected by the decision:
`tsconfig.json` does not include the layer (except `specs/mcp.spec.dir/src`), so
the artifacts are emitted onto tracked paths, not into `dist/`.

## Alternatives rejected

- **Regenerate the whole layer.** Trial-run: 286 artifacts rewritten, suite went
  from 4 to 34 failures. The layer's artifacts are the *older, working* compile of
  sources that have since acquired latent bugs; regenerating them wholesale ships
  those bugs. Regeneration stays scoped to guard-bearing modules until the sources
  are repaired.
- **Retire the layer (delete the tracked artifacts).** Rejected at this revision as
  a rewiring project, not a deletion: `tests/workflow/conversation.test.ts` imports
  the artifact path directly, and extensionless `require('./x')` inside the layer
  resolves to `.js` before `.ts`, so consumers currently exercise the projection.
  Retiring it means rewiring those consumers and re-verifying the suite — a
  separate decision with its own evidence.

## What the decision explicitly does not do

- **It does not complete the layer's membership.** 1015 spec-dir sources exist,
  440 have a compiled sibling. A require into a source that was never compiled is
  recorded as `source-only` rather than papered over by inventing a compiled file:
  adding ~570 artifacts is a separate decision with its own review cost. The audit
  keeps that count visible on every run.
- **It does not fix the source-level mistakes it surfaced** (a spec-dir
  `speclangd.ts` importing a `./daemon/` directory that does not exist,
  `specs/parser.spec.dir/src/block-parser.ts` reaching for `src/types/poc` from a
  coordinate where that path is empty, and the `@block::` grammar drift above).
  Both are recorded; deciding what those sources *meant* is a source change, not a
  layer-integrity change.
- **It does not regenerate source maps on every run.** Maps are rewritten by a
  regeneration but excluded from the freshness verdict: tsc's `mappings` encode
  source byte positions, so a comment-only source edit makes them stale without
  making the artifact wrong.

## How to change the layer

```bash
npm run audit:specdir                 # requires resolve (or are recorded)
npm run check:specdir-parity          # guard parity (gate) + whole-layer freshness (report)
npm run regenerate:specdir            # recompile the guard-bearing modules
npm run regenerate:specdir -- --module specs/foo.spec.dir/src/bar.ts
npm run regenerate:specdir -- --all-stale   # every stale module (only with the sources fixed)
```

Never edit a compiled `.js` under `specs/` by hand: the freshness report will name
it, and the edit disappears the next time anyone regenerates. Edit the `.ts`, then
regenerate.

## Evidence at the time of this decision

- `npm run audit:specdir` — 440 compiled modules, 571 relative requires, 542
  resolve in the tree, 29 recorded exceptions with re-verified proofs, 0 failing,
  0 stale baseline entries.
- `npm run check:specdir-parity` — 1 guard-bearing module
  (`specs/sqlite.spec.dir/src/index.ts`), value exports match, freshness reported
  as stale for the remaining artifacts (see §3).
- Drift removed: `specs/sqlite.spec.dir/src/index.js`, `.d.ts` and both maps were
  regenerated from source, so the artifact now carries the corruption guard it
  lacked (`openStateDatabase`, `withStateDatabase`, `CorruptStateDatabaseError`,
  `stateDatabaseCorruptionMessage`, `STATE_DB_CORRUPT_CODE`).
- Both gates proved they can fail: the audit exits 1 on a scratch tree whose
  compiled module requires a missing file, and on a tracked artifact whose require
  was pointed at a nonexistent module (run by hand during this work:
  `specs/cli.spec.dir/src/list.js` → `1 failing`, exit 1); the parity comparison
  returns the missing symbol list for a source whose guard exports are absent from
  the artifact (`compareModules` negative control in the test file).
